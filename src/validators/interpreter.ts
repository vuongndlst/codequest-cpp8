import type { WorldSpec } from '@/types/content';
import type { Diagnostic } from './tokens';
import type {
  Expression,
  FunctionDeclaration,
  Program,
  Statement,
  VariableDeclaration,
} from './ast';
import type { TypeKeyword } from './tokens';
import {
  FACING_DELTA,
  MAX_WORLD_EVENTS,
  createWorldState,
  isBlockedAhead,
  turnedLeft,
  turnedRight,
  type WorldEvent,
  type WorldEventType,
  type WorldState,
} from './world';

/** Tên hướng bằng tiếng Việt, dùng trong thông báo cho học sinh. */
const FACING_LABELS = {
  east: 'phải',
  south: 'xuống',
  west: 'trái',
  north: 'lên',
} as const;

/**
 * Bước ⑥ của pipeline: chạy AST.
 *
 * Đây là trình thông dịch duyệt cây, KHÔNG dùng `eval` và không truy cập được
 * bất cứ thứ gì của trình duyệt. Kể cả khi chạy ngoài Web Worker, nó vẫn an toàn:
 * toàn bộ tác dụng phụ chỉ là ghi vào `stdout` và `worldEvents` của chính nó.
 *
 * Giới hạn an toàn (docs mục 6.3):
 *   · 200.000 bước thực thi
 *   · 100.000 lần lặp cho mỗi vòng `for`
 *   · 5.000 dòng output
 *   · độ sâu gọi hàm 100
 */

export const LIMITS = {
  maxSteps: 200_000,
  maxLoopIterations: 100_000,
  maxOutputLines: 5_000,
  maxCallDepth: 100,
  maxOutputChars: 100_000,
} as const;

// ------------------------------------------------------------------- Giá trị

export type CppValue =
  | { type: 'int'; value: number }
  | { type: 'double'; value: number }
  | { type: 'bool'; value: boolean }
  | { type: 'char'; value: string }
  | { type: 'string'; value: string }
  | { type: 'void'; value: null };

const VOID: CppValue = { type: 'void', value: null };

function defaultValueFor(type: TypeKeyword): CppValue {
  switch (type) {
    case 'int':
      return { type: 'int', value: 0 };
    case 'float':
    case 'double':
      return { type: 'double', value: 0 };
    case 'bool':
      return { type: 'bool', value: false };
    case 'char':
      return { type: 'char', value: '' };
    case 'string':
      return { type: 'string', value: '' };
    default:
      return VOID;
  }
}

function toNumber(value: CppValue): number {
  if (value.type === 'bool') return value.value ? 1 : 0;
  if (value.type === 'int' || value.type === 'double') return value.value;
  if (value.type === 'char') return value.value.charCodeAt(0) || 0;
  const parsed = Number(value.value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toBoolean(value: CppValue): boolean {
  if (value.type === 'bool') return value.value;
  if (value.type === 'string' || value.type === 'char') return value.value.length > 0;
  return toNumber(value) !== 0;
}

/**
 * Định dạng giá trị khi in ra — theo đúng cách C++ thật hoạt động.
 * Đáng chú ý: `cout << true` in ra `1`, không phải chữ "true".
 */
export function formatForOutput(value: CppValue): string {
  switch (value.type) {
    case 'bool':
      return value.value ? '1' : '0';
    case 'int':
      return String(Math.trunc(value.value));
    case 'double': {
      if (Number.isInteger(value.value)) return String(value.value);
      // C++ mặc định in 6 chữ số có nghĩa
      return String(Number(value.value.toPrecision(6)));
    }
    case 'void':
      return '';
    default:
      return String(value.value);
  }
}

/** Ép giá trị về đúng kiểu đã khai báo — nhờ vậy `int x = 7/2` cho 3 như C++ thật. */
function coerceTo(type: TypeKeyword, value: CppValue): CppValue {
  switch (type) {
    case 'int':
      return { type: 'int', value: Math.trunc(toNumber(value)) };
    case 'float':
    case 'double':
      return { type: 'double', value: toNumber(value) };
    case 'bool':
      return { type: 'bool', value: toBoolean(value) };
    case 'char':
      return {
        type: 'char',
        value: value.type === 'char' || value.type === 'string' ? String(value.value)[0] ?? '' : '',
      };
    case 'string':
      return { type: 'string', value: value.type === 'string' ? value.value : formatForOutput(value) };
    default:
      return VOID;
  }
}

// ------------------------------------------------------------------ Ngoại lệ

class ReturnSignal {
  readonly value: CppValue;
  constructor(value: CppValue) {
    this.value = value;
  }
}

export class RuntimeErrorSignal extends Error {
  readonly diagnostic: Diagnostic;
  constructor(diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.name = 'RuntimeErrorSignal';
    this.diagnostic = diagnostic;
  }
}

// ----------------------------------------------------------------- Phạm vi

class Scope {
  private readonly values = new Map<string, CppValue>();
  private readonly parent: Scope | null;

  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  declare(name: string, value: CppValue): void {
    this.values.set(name, value);
  }

  has(name: string): boolean {
    return this.values.has(name) || (this.parent?.has(name) ?? false);
  }

  get(name: string): CppValue | undefined {
    return this.values.get(name) ?? this.parent?.get(name);
  }

  assign(name: string, value: CppValue): boolean {
    if (this.values.has(name)) {
      // Giữ nguyên kiểu đã khai báo -> `int i` gán 2.7 vẫn thành 2
      const existing = this.values.get(name)!;
      this.values.set(name, coerceTo(existing.type as TypeKeyword, value));
      return true;
    }
    return this.parent?.assign(name, value) ?? false;
  }
}

// ------------------------------------------------------------- Hàm dựng sẵn

/** Hàm hành động của game — tên tiếng Anh theo quy ước đã chốt. */
export const GAME_ACTIONS: Record<string, WorldEventType> = {
  moveForward: 'move',
  // Quay tại chỗ — bản đồ hai chiều cần đổi hướng mới đi được sang hàng khác
  turnRight: 'turn',
  turnLeft: 'turn',
  openDoor: 'open-door',
  turnOnLight: 'turn-on-light',
  activateBridge: 'activate-bridge',
  collectKey: 'collect-key',
  collectGem: 'collect-gem',
  attackBug: 'attack-bug',
};

/** Hàm truy vấn trạng thái thế giới — trả về giá trị để dùng trong `if`. */
export const GAME_QUERIES = ['getEnergy', 'hasKey', 'isBlocked', 'getPosition', 'getBugHp'];

export const BUILTIN_FUNCTIONS = [...Object.keys(GAME_ACTIONS), ...GAME_QUERIES];

// ------------------------------------------------------------------ Kết quả

export interface InterpretOptions {
  stdin?: string;
  world?: WorldSpec;
  maxSteps?: number;
}

export interface InterpretResult {
  stdout: string[];
  rawOutput: string;
  worldEvents: WorldEvent[];
  finalWorld: WorldState;
  diagnostics: Diagnostic[];
  steps: number;
  /** Số vòng lặp đã chạy — dùng cho gợi ý "vòng lặp chạy 4 lần nhưng đường có 5 ô" */
  loopIterations: number;
  completed: boolean;
}

export function interpret(program: Program, options: InterpretOptions = {}): InterpretResult {
  return new Interpreter(program, options).run();
}

class Interpreter {
  private readonly functions = new Map<string, FunctionDeclaration>();
  private readonly globals = new Scope();
  private readonly worldSpec?: WorldSpec;
  private world: WorldState;
  private readonly inputQueue: string[];
  private readonly maxSteps: number;

  private output = '';
  private outputLineCount = 0;
  private readonly events: WorldEvent[] = [];
  private readonly diagnostics: Diagnostic[] = [];

  private steps = 0;
  private callDepth = 0;
  private loopIterations = 0;
  private completed = false;

  private readonly program: Program;

  constructor(program: Program, options: InterpretOptions) {
    this.program = program;
    this.worldSpec = options.world;
    this.world = createWorldState(options.world);
    this.inputQueue = (options.stdin ?? '').split(/\s+/).filter(Boolean);
    this.maxSteps = options.maxSteps ?? LIMITS.maxSteps;
  }

  run(): InterpretResult {
    for (const node of this.program.body) {
      if (node.kind === 'FunctionDeclaration') {
        this.functions.set(node.name, node);

        /*
          Phát sự kiện ngay lúc ĐĂNG KÝ hàm, trước khi `main()` chạy.

          Sân khấu Xưởng Rèn dựa vào đây để lắp cỗ máy lên bàn nhưng để nó
          ĐỨNG IM. Học sinh viết hàm rồi thắc mắc "sao không thấy gì chạy" là
          hiểu nhầm số một về hàm; nhìn cỗ máy nằm im trên bàn cho tới khi có
          lệnh gọi thì hiểu ngay khai báo khác với chạy.
        */
        if (node.name !== 'main') {
          this.pushEvent('declare-func', `Lắp máy ${node.name}`, {
            name: node.name,
            params: node.params.map((param) => param.name),
            returnType: node.returnType,
            line: node.line,
          });
        }
      }
    }

    const main = this.functions.get('main');

    if (!main) {
      this.diagnostics.push({
        code: 'MISSING_MAIN',
        message: 'Chương trình cần có hàm `int main()` — đó là nơi máy tính bắt đầu chạy.',
        line: 1,
        severity: 'error',
      });
      return this.result();
    }

    try {
      this.callFunction(main, []);
      this.completed = true;
    } catch (error) {
      if (error instanceof ReturnSignal) {
        this.completed = true;
      } else if (error instanceof RuntimeErrorSignal) {
        this.diagnostics.push(error.diagnostic);
      } else {
        this.diagnostics.push({
          code: 'UNKNOWN',
          message: 'Chương trình gặp trục trặc khi chạy. Em thử kiểm tra lại từng dòng nhé.',
          line: 0,
          severity: 'error',
        });
      }
    }

    return this.result();
  }

  private result(): InterpretResult {
    const lines = this.output.split('\n');
    // Bỏ dòng rỗng cuối do `endl` ở câu lệnh cuối cùng tạo ra
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    return {
      stdout: lines,
      rawOutput: this.output,
      worldEvents: this.events,
      finalWorld: this.world,
      diagnostics: this.diagnostics,
      steps: this.steps,
      loopIterations: this.loopIterations,
      completed: this.completed,
    };
  }

  // ------------------------------------------------------------- Ngân sách

  private tick(line: number): void {
    this.steps += 1;
    if (this.steps > this.maxSteps) {
      throw new RuntimeErrorSignal({
        code: 'TIMEOUT',
        message:
          'Chương trình của em chạy quá lâu. Em kiểm tra lại điều kiện dừng của vòng lặp `for` nhé — ' +
          'biến đếm có tăng lên không?',
        line,
        severity: 'error',
        suggestHintLevel: 2,
      });
    }
  }

  private write(text: string): void {
    if (this.output.length > LIMITS.maxOutputChars) return;
    this.output += text;
    this.outputLineCount += (text.match(/\n/g) ?? []).length;
    if (this.outputLineCount > LIMITS.maxOutputLines) {
      throw new RuntimeErrorSignal({
        code: 'TIMEOUT',
        message:
          `Chương trình in ra quá nhiều dòng (hơn ${LIMITS.maxOutputLines}). ` +
          'Có thể vòng lặp của em chưa dừng lại đúng lúc.',
        line: 0,
        severity: 'error',
        suggestHintLevel: 2,
      });
    }
  }

  private pushEvent(type: WorldEventType, message: string, detail?: Record<string, unknown>): void {
    // Ngừng ghi khi đã đủ trần. CỐ Ý không dừng chương trình: đây chỉ là dữ
    // liệu để vẽ hình, cắt bớt không được phép làm đổi kết quả chấm bài.
    if (this.events.length >= MAX_WORLD_EVENTS) return;

    this.events.push({
      type,
      index: this.events.length,
      col: this.world.col,
      row: this.world.row,
      message,
      detail,
    });
  }

  // ------------------------------------------------------------- Gọi hàm

  private callFunction(fn: FunctionDeclaration, args: CppValue[]): CppValue {
    this.callDepth += 1;
    if (this.callDepth > LIMITS.maxCallDepth) {
      throw new RuntimeErrorSignal({
        code: 'TIMEOUT',
        message:
          `Hàm gọi lồng nhau quá sâu (hơn ${LIMITS.maxCallDepth} lần). ` +
          'Có thể một hàm đang tự gọi lại chính nó mà không có điểm dừng.',
        line: fn.line,
        severity: 'error',
      });
    }

    const scope = new Scope(this.globals);
    fn.params.forEach((param, index) => {
      scope.declare(param.name, coerceTo(param.paramType, args[index] ?? defaultValueFor(param.paramType)));
    });

    if (fn.name !== 'main') {
      this.pushEvent('call-func', `Chạy máy ${fn.name}`, {
        name: fn.name,
        // Tham số hiện thành "nguyên liệu bỏ vào phễu" trên sân khấu Xưởng Rèn
        args: args.map(formatForOutput),
        line: fn.line,
      });
    }

    try {
      this.executeBlock(fn.body.body, scope);
      return defaultValueFor(fn.returnType);
    } catch (error) {
      if (error instanceof ReturnSignal) {
        const returned = fn.returnType === 'void' ? VOID : coerceTo(fn.returnType, error.value);

        if (fn.name !== 'main' && fn.returnType !== 'void') {
          this.pushEvent('return-func', `${fn.name} trả về ${formatForOutput(returned)}`, {
            name: fn.name,
            value: formatForOutput(returned),
            line: fn.line,
          });
        }

        return returned;
      }
      throw error;
    } finally {
      this.callDepth -= 1;
    }
  }

  // `args` chưa dùng: các hàm dựng sẵn của game hiện đều không nhận tham số.
  // Giữ lại trong chữ ký để thêm hàm có tham số về sau mà không phải sửa nơi gọi.
  private callBuiltin(name: string, _args: CppValue[], line: number): CppValue {
    this.tick(line);

    // --- Truy vấn trạng thái ---
    switch (name) {
      case 'getEnergy':
        return { type: 'int', value: this.world.energy };
      case 'hasKey':
        return { type: 'bool', value: this.world.hasKey };
      case 'isBlocked':
        return { type: 'bool', value: isBlockedAhead(this.world, this.worldSpec) };
      case 'getPosition':
        return { type: 'int', value: this.world.col };
      case 'getBugHp':
        return { type: 'int', value: this.world.bugHp };
      default:
        break;
    }

    // --- Hành động ---
    const eventType = GAME_ACTIONS[name];
    if (!eventType) {
      throw new RuntimeErrorSignal({
        code: 'FUNC_UNDEFINED',
        message: `Hàm \`${name}\` chưa được khai báo ở đâu cả (dòng ${line}).`,
        line,
        severity: 'error',
      });
    }

    switch (name) {
      case 'moveForward': {
        if (this.world.energy <= 0) {
          this.pushEvent('out-of-energy', 'Nhân vật đã hết năng lượng, không đi tiếp được.');
          break;
        }
        if (isBlockedAhead(this.world, this.worldSpec)) {
          this.world.blocked = true;
          this.pushEvent('blocked', 'Phía trước có vật cản, nhân vật không đi qua được.');
          break;
        }

        // Đi theo HƯỚNG ĐANG QUAY. Bản đồ một hàng mặc định quay `east` nên
        // vẫn là tăng cột lên một, y hệt hành vi cũ.
        const step = FACING_DELTA[this.world.facing];
        this.world.col += step.dCol;
        this.world.row += step.dRow;
        this.world.energy -= 1;
        this.world.blocked = false;

        this.pushEvent(
          'move',
          this.world.rows > 1
            ? `Nhân vật tiến tới ô (${this.world.col}, ${this.world.row})`
            : `Nhân vật tiến tới ô ${this.world.col}`,
        );

        if (this.world.col === this.world.goalCol && this.world.row === this.world.goalRow) {
          this.pushEvent('reach-goal', 'Nhân vật đã tới đích!');
        }
        break;
      }

      case 'turnRight':
      case 'turnLeft': {
        this.world.facing =
          name === 'turnRight' ? turnedRight(this.world.facing) : turnedLeft(this.world.facing);
        // Quay tại chỗ KHÔNG tốn năng lượng: đề bài cấm cơ chế trừng phạt, mà
        // học sinh mới học thường phải quay vài lần mới định hướng được.
        this.world.blocked = isBlockedAhead(this.world, this.worldSpec);
        this.pushEvent('turn', `Nhân vật quay sang hướng ${FACING_LABELS[this.world.facing]}`, {
          facing: this.world.facing,
        });
        break;
      }

      case 'openDoor': {
        const door = this.findPropAhead('door') ?? this.findPropAt('door');
        if (door) {
          if (!this.world.openedDoors.includes(door.id)) this.world.openedDoors.push(door.id);
          this.pushEvent('open-door', 'Cánh cửa đã mở ra.', { id: door.id });
        } else {
          this.world.openedDoors.push(`door-${this.world.col}`);
          this.pushEvent('open-door', 'Cánh cửa đã mở ra.');
        }
        break;
      }

      case 'turnOnLight': {
        const light = this.findPropAt('light') ?? this.findPropAhead('light');
        const id = light?.id ?? `light-${this.world.col}`;
        if (!this.world.litLights.includes(id)) this.world.litLights.push(id);
        this.pushEvent('turn-on-light', 'Đèn đã sáng lên.', { id });
        break;
      }

      case 'activateBridge': {
        const bridge = this.findPropAhead('bridge') ?? this.findPropAt('bridge');
        const id = bridge?.id ?? `bridge-${this.world.col}`;
        if (!this.world.activatedBridges.includes(id)) this.world.activatedBridges.push(id);
        this.pushEvent('activate-bridge', 'Cây cầu đã được kích hoạt.', { id });
        break;
      }

      case 'collectKey':
        this.world.hasKey = true;
        this.pushEvent('collect-key', 'Nhân vật đã nhặt được chìa khoá.');
        break;

      case 'collectGem':
        this.world.collectedGems += 1;
        this.pushEvent('collect-gem', `Nhặt được viên ngọc thứ ${this.world.collectedGems}.`);
        break;

      case 'attackBug':
        this.world.bugHp = Math.max(0, this.world.bugHp - 1);
        this.pushEvent('attack-bug', `Tấn công Bug! Máu Bug còn ${this.world.bugHp}.`);
        break;

      default:
        break;
    }

    return VOID;
  }

  private findPropAt(type: string) {
    return this.worldSpec?.props?.find((prop) => prop.type === type && prop.col === this.world.col);
  }

  private findPropAhead(type: string) {
    return this.worldSpec?.props?.find(
      (prop) => prop.type === type && prop.col === this.world.col + 1,
    );
  }

  // ------------------------------------------------------------ Câu lệnh

  private executeBlock(statements: Statement[], scope: Scope): void {
    for (const statement of statements) {
      this.execute(statement, scope);
    }
  }

  private execute(statement: Statement, scope: Scope): void {
    this.tick(statement.line);

    switch (statement.kind) {
      case 'VariableDeclaration':
        this.executeVariableDeclaration(statement, scope);
        return;

      case 'ExpressionStatement':
        this.evaluate(statement.expression, scope);
        return;

      case 'BlockStatement':
        this.executeBlock(statement.body, new Scope(scope));
        return;

      case 'IfStatement': {
        if (toBoolean(this.evaluate(statement.test, scope))) {
          this.execute(statement.consequent, new Scope(scope));
        } else if (statement.alternate) {
          this.execute(statement.alternate, new Scope(scope));
        }
        return;
      }

      case 'ForStatement': {
        const loopScope = new Scope(scope);
        if (statement.init) {
          if (statement.init.kind === 'VariableDeclaration') {
            this.executeVariableDeclaration(statement.init, loopScope);
          } else {
            this.evaluate(statement.init.expression, loopScope);
          }
        }

        let iterations = 0;
        while (statement.test ? toBoolean(this.evaluate(statement.test, loopScope)) : true) {
          iterations += 1;
          this.loopIterations += 1;

          if (iterations > LIMITS.maxLoopIterations) {
            throw new RuntimeErrorSignal({
              code: 'FOR_MISSING_UPDATE',
              message:
                `Vòng lặp \`for\` ở dòng ${statement.line} chạy mãi không dừng. ` +
                'Em kiểm tra xem biến đếm có được tăng lên (`i++`) và điều kiện có đúng không nhé.',
              line: statement.line,
              severity: 'error',
              suggestHintLevel: 2,
            });
          }

          this.execute(statement.body, new Scope(loopScope));
          if (statement.update) this.evaluate(statement.update, loopScope);
          this.tick(statement.line);
        }
        return;
      }

      case 'ReturnStatement':
        throw new ReturnSignal(
          statement.argument ? this.evaluate(statement.argument, scope) : VOID,
        );

      case 'CoutStatement': {
        /*
          Gom cả câu lệnh thành MỘT sự kiện, không phải mỗi `<<` một sự kiện.

          `cout << "Diem: " << diem << endl;` với học sinh là một hành động in,
          nên trên sân khấu nó phải thắp đúng một ngọn đèn. Tách ra ba sự kiện
          thì đèn nhấp nháy ba lần cho một dòng lệnh — dạy sai luôn cả cách đọc
          code.
        */
        let printed = '';
        for (const part of statement.parts) {
          if (part.kind === 'EndlLiteral') {
            this.write('\n');
            printed += '\n';
            continue;
          }
          const text = formatForOutput(this.evaluate(part, scope));
          this.write(text);
          printed += text;
        }

        const shown = printed.replace(/\n/g, ' ').trim();
        this.pushEvent('print', shown ? `In ra: ${shown}` : 'In ra một dòng trống', {
          text: printed,
          line: statement.line,
        });
        return;
      }

      case 'CinStatement': {
        for (const target of statement.targets) {
          const raw = this.inputQueue.shift() ?? '';
          const existing = scope.get(target.name);
          const type = (existing?.type ?? 'int') as TypeKeyword;
          const parsed: CppValue =
            type === 'string' || type === 'char'
              ? { type: 'string', value: raw }
              : { type: 'double', value: Number(raw) || 0 };
          scope.assign(target.name, parsed);
        }
        return;
      }

      case 'EmptyStatement':
        return;

      default:
        return;
    }
  }

  private executeVariableDeclaration(node: VariableDeclaration, scope: Scope): void {
    for (const declarator of node.declarations) {
      const initial = declarator.init
        ? this.evaluate(declarator.init, scope)
        : defaultValueFor(node.varType);
      const stored = coerceTo(node.varType, initial);
      scope.declare(declarator.name, stored);

      this.pushEvent('declare-var', `Tạo biến ${declarator.name}`, {
        name: declarator.name,
        varType: node.varType,
        value: formatForOutput(stored),
        line: declarator.line,
      });
    }
  }

  // ----------------------------------------------------------- Biểu thức

  private evaluate(expression: Expression, scope: Scope): CppValue {
    this.tick(expression.line);

    switch (expression.kind) {
      case 'NumberLiteral':
        return expression.isFloat
          ? { type: 'double', value: expression.value }
          : { type: 'int', value: expression.value };

      case 'StringLiteral':
        return { type: 'string', value: expression.value };

      case 'CharLiteral':
        return { type: 'char', value: expression.value };

      case 'BoolLiteral':
        return { type: 'bool', value: expression.value };

      case 'EndlLiteral':
        return { type: 'string', value: '\n' };

      case 'Identifier': {
        const value = scope.get(expression.name);
        if (!value) {
          throw new RuntimeErrorSignal({
            code: 'VAR_UNDECLARED',
            message:
              `Biến \`${expression.name}\` ở dòng ${expression.line} chưa được khai báo. ` +
              `Em cần khai báo trước khi dùng, ví dụ \`int ${expression.name} = 0;\``,
            line: expression.line,
            severity: 'error',
            suggestHintLevel: 1,
          });
        }
        return value;
      }

      case 'BinaryExpression':
        return this.evaluateBinary(expression, scope);

      case 'UnaryExpression': {
        const argument = this.evaluate(expression.argument, scope);
        if (expression.operator === '!') return { type: 'bool', value: !toBoolean(argument) };
        const negated = -toNumber(argument);
        return argument.type === 'double'
          ? { type: 'double', value: negated }
          : { type: 'int', value: negated };
      }

      case 'UpdateExpression': {
        if (expression.argument.kind !== 'Identifier') {
          throw new RuntimeErrorSignal({
            code: 'UNKNOWN',
            message: `Dấu \`${expression.operator}\` chỉ dùng được với tên biến (dòng ${expression.line}).`,
            line: expression.line,
            severity: 'error',
          });
        }
        const name = expression.argument.name;
        const current = scope.get(name);
        if (!current) {
          throw new RuntimeErrorSignal({
            code: 'VAR_UNDECLARED',
            message: `Biến \`${name}\` ở dòng ${expression.line} chưa được khai báo.`,
            line: expression.line,
            severity: 'error',
          });
        }
        const before = toNumber(current);
        const after = expression.operator === '++' ? before + 1 : before - 1;
        scope.assign(name, { type: 'double', value: after });
        const resultNumber = expression.prefix ? after : before;
        return current.type === 'double'
          ? { type: 'double', value: resultNumber }
          : { type: 'int', value: resultNumber };
      }

      case 'AssignmentExpression': {
        const rightValue = this.evaluate(expression.value, scope);
        const name = expression.target.name;
        const current = scope.get(name);

        if (!current) {
          throw new RuntimeErrorSignal({
            code: 'VAR_UNDECLARED',
            message:
              `Biến \`${name}\` ở dòng ${expression.line} chưa được khai báo. ` +
              `Em cần viết \`int ${name} = 0;\` trước khi gán giá trị.`,
            line: expression.line,
            severity: 'error',
            suggestHintLevel: 1,
          });
        }

        const nextValue =
          expression.operator === '='
            ? rightValue
            : this.applyBinaryOperator(
                expression.operator.slice(0, -1),
                current,
                rightValue,
                expression.line,
              );

        scope.assign(name, nextValue);
        const stored = scope.get(name) ?? nextValue;

        /*
          Gửi kèm CẢ giá trị cũ lẫn giá trị mới.

          Sân khấu Tháp Tín Hiệu dùng cặp này để cho thấy giá trị cũ biến mất
          khi gán lại — đó chính là hiểu nhầm phổ biến nhất về biến ở lứa tuổi
          này ("gán thêm" chứ không phải "thay thế").
        */
        this.pushEvent('assign-var', `${name} = ${formatForOutput(stored)}`, {
          name,
          from: formatForOutput(current),
          value: formatForOutput(stored),
          line: expression.line,
        });

        return stored;
      }

      case 'CallExpression': {
        const args = expression.args.map((arg) => this.evaluate(arg, scope));

        const userFunction = this.functions.get(expression.callee);
        if (userFunction) return this.callFunction(userFunction, args);

        return this.callBuiltin(expression.callee, args, expression.line);
      }

      default:
        return VOID;
    }
  }

  private evaluateBinary(
    expression: Extract<Expression, { kind: 'BinaryExpression' }>,
    scope: Scope,
  ): CppValue {
    // && và || phải "ngắn mạch" — không đánh giá vế phải nếu không cần
    if (expression.operator === '&&') {
      const left = this.evaluate(expression.left, scope);
      if (!toBoolean(left)) return { type: 'bool', value: false };
      return { type: 'bool', value: toBoolean(this.evaluate(expression.right, scope)) };
    }

    if (expression.operator === '||') {
      const left = this.evaluate(expression.left, scope);
      if (toBoolean(left)) return { type: 'bool', value: true };
      return { type: 'bool', value: toBoolean(this.evaluate(expression.right, scope)) };
    }

    const left = this.evaluate(expression.left, scope);
    const right = this.evaluate(expression.right, scope);
    return this.applyBinaryOperator(expression.operator, left, right, expression.line);
  }

  private applyBinaryOperator(
    operator: string,
    left: CppValue,
    right: CppValue,
    line: number,
  ): CppValue {
    // Nối chuỗi
    if (operator === '+' && (left.type === 'string' || right.type === 'string')) {
      return { type: 'string', value: formatForOutput(left) + formatForOutput(right) };
    }

    const a = toNumber(left);
    const b = toNumber(right);
    // Phép chia số nguyên trong C++ CẮT phần thập phân: 7 / 2 = 3
    const bothInt = left.type !== 'double' && right.type !== 'double';
    const numberType: 'int' | 'double' = bothInt ? 'int' : 'double';

    switch (operator) {
      case '+':
        return { type: numberType, value: a + b };
      case '-':
        return { type: numberType, value: a - b };
      case '*':
        return { type: numberType, value: a * b };

      case '/': {
        if (b === 0) {
          throw new RuntimeErrorSignal({
            code: 'UNKNOWN',
            message: `Ở dòng ${line} có phép chia cho 0. Trong toán học cũng như trong C++, không chia được cho 0 nhé.`,
            line,
            severity: 'error',
          });
        }
        const quotient = a / b;
        return bothInt
          ? { type: 'int', value: Math.trunc(quotient) }
          : { type: 'double', value: quotient };
      }

      case '%': {
        if (b === 0) {
          throw new RuntimeErrorSignal({
            code: 'UNKNOWN',
            message: `Ở dòng ${line} có phép chia lấy dư cho 0. Phép này không thực hiện được.`,
            line,
            severity: 'error',
          });
        }
        return { type: 'int', value: Math.trunc(a) % Math.trunc(b) };
      }

      case '==':
        return { type: 'bool', value: compareEquality(left, right) };
      case '!=':
        return { type: 'bool', value: !compareEquality(left, right) };
      case '<':
        return { type: 'bool', value: a < b };
      case '>':
        return { type: 'bool', value: a > b };
      case '<=':
        return { type: 'bool', value: a <= b };
      case '>=':
        return { type: 'bool', value: a >= b };

      default:
        throw new RuntimeErrorSignal({
          code: 'UNKNOWN',
          message: `Toán tử \`${operator}\` ở dòng ${line} chưa được hỗ trợ trong khoá này.`,
          line,
          severity: 'error',
        });
    }
  }
}

function compareEquality(left: CppValue, right: CppValue): boolean {
  if (left.type === 'string' || right.type === 'string') {
    return formatForOutput(left) === formatForOutput(right);
  }
  return toNumber(left) === toNumber(right);
}
