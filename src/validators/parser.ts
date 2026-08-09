import type { ErrorCode } from '@/types/content';
import type { Token } from './tokens';
import { OUT_OF_SCOPE_KEYWORDS, isTypeKeyword, type TypeKeyword } from './tokens';
import type {
  BlockStatement,
  Expression,
  FunctionDeclaration,
  Identifier,
  Parameter,
  Program,
  Statement,
  TopLevelNode,
  VariableDeclaration,
  VariableDeclarator,
} from './ast';

/**
 * Bước ④ của pipeline: token -> AST.
 *
 * Mỗi lỗi đều mang một `ErrorCode` và một thông báo tiếng Việt sẵn sàng hiển thị.
 * Parser dừng ở lỗi ĐẦU TIÊN — với học sinh lớp 8, một thông báo rõ ràng
 * tốt hơn mười thông báo dây chuyền (mục 24 của đề bài).
 */

export class ParseError extends Error {
  readonly code: ErrorCode;
  readonly line: number;
  readonly column: number;

  constructor(code: ErrorCode, message: string, line: number, column: number) {
    super(message);
    this.name = 'ParseError';
    this.code = code;
    this.line = line;
    this.column = column;
  }
}

export function parse(tokens: Token[]): Program {
  return new Parser(tokens).parseProgram();
}

class Parser {
  private position = 0;

  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  // ------------------------------------------------------------ Tiện ích

  /**
   * Token đang xét.
   *
   * Cố ý là PHƯƠNG THỨC chứ không phải getter: với getter, TypeScript giữ
   * nguyên kết quả thu hẹp kiểu (narrowing) sau khi `advance()` đã đẩy con trỏ
   * đi, dẫn tới báo lỗi "no overlap" ở những chỗ kiểm tra kiểu token phía sau.
   */
  private peek(): Token {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1];
  }

  private get previous(): Token {
    return this.tokens[Math.max(0, this.position - 1)];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private check(value: string, type?: Token['type']): boolean {
    if (this.isAtEnd() && value !== '') return false;
    if (type && this.peek().type !== type) return false;
    return this.peek().value === value;
  }

  private match(...values: string[]): boolean {
    if (values.includes(this.peek().value) && this.peek().type !== 'eof') {
      this.position += 1;
      return true;
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.position += 1;
    return this.previous;
  }

  private expectSemicolon(context: string): void {
    if (this.match(';')) return;
    // Báo lỗi ở CUỐI dòng trước đó — đúng chỗ học sinh cần thêm dấu ;
    throw new ParseError(
      'MISSING_SEMICOLON',
      `Có vẻ em đang thiếu dấu \`;\` ở cuối ${context} (dòng ${this.previous.line}).`,
      this.previous.line,
      this.previous.column + this.previous.value.length,
    );
  }

  private expect(value: string, code: ErrorCode, message: string): Token {
    if (this.check(value)) return this.advance();
    throw new ParseError(code, message, this.peek().line, this.peek().column);
  }

  /** Chặn từ khoá ngoài phạm vi khoá học bằng thông báo hướng dẫn thay vì lỗi cú pháp. */
  private guardOutOfScope(): void {
    const explanation = OUT_OF_SCOPE_KEYWORDS[this.peek().value];
    if (explanation && this.peek().type === 'identifier') {
      throw new ParseError(
        'UNSUPPORTED_FEATURE',
        explanation,
        this.peek().line,
        this.peek().column,
      );
    }
  }

  // -------------------------------------------------------- Cấp chương trình

  parseProgram(): Program {
    const body: TopLevelNode[] = [];

    while (!this.isAtEnd()) {
      this.guardOutOfScope();

      if (this.peek().type === 'preprocessor') {
        const token = this.advance();
        const match = /#\s*include\s*[<"]([^>"]+)[>"]/.exec(token.value);
        body.push({
          kind: 'IncludeDirective',
          header: match?.[1] ?? '',
          line: token.line,
          column: token.column,
        });
        continue;
      }

      if (this.check('using')) {
        const token = this.advance();
        this.expect(
          'namespace',
          'UNKNOWN',
          'Sau `using` cần có từ `namespace`. Dòng đúng là: `using namespace std;`',
        );
        const name = this.advance();
        this.expectSemicolon('dòng `using namespace std`');
        body.push({
          kind: 'UsingDirective',
          namespace: name.value,
          line: token.line,
          column: token.column,
        });
        continue;
      }

      if (this.peek().type === 'type') {
        body.push(this.parseFunctionDeclaration());
        continue;
      }

      throw new ParseError(
        'UNKNOWN',
        `Ở ngoài các hàm, em chỉ nên viết \`#include\`, \`using namespace std;\` hoặc khai báo hàm. ` +
          `Dòng ${this.peek().line} có \`${this.peek().value}\` nằm ngoài hàm nào cả.`,
        this.peek().line,
        this.peek().column,
      );
    }

    return { kind: 'Program', body };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const typeToken = this.advance();
    const returnType = typeToken.value as TypeKeyword;

    if (this.peek().type !== 'identifier') {
      throw new ParseError(
        'UNKNOWN',
        `Sau kiểu \`${returnType}\` cần có tên hàm hoặc tên biến. Dòng ${this.peek().line} đang thiếu tên.`,
        this.peek().line,
        this.peek().column,
      );
    }

    const nameToken = this.advance();

    this.expect(
      '(',
      'UNBALANCED_PAREN',
      `Sau tên hàm \`${nameToken.value}\` cần có dấu \`(\`. Ví dụ: \`${returnType} ${nameToken.value}() { … }\``,
    );

    const params: Parameter[] = [];
    if (!this.check(')')) {
      do {
        if (this.peek().type !== 'type') {
          throw new ParseError(
            'UNKNOWN',
            `Mỗi tham số của hàm cần ghi rõ kiểu dữ liệu, ví dụ \`int count\`. Dòng ${this.peek().line} còn thiếu kiểu.`,
            this.peek().line,
            this.peek().column,
          );
        }
        const paramTypeToken = this.advance();
        if (this.peek().type !== 'identifier') {
          throw new ParseError(
            'UNKNOWN',
            `Tham số kiểu \`${paramTypeToken.value}\` ở dòng ${paramTypeToken.line} chưa có tên.`,
            this.peek().line,
            this.peek().column,
          );
        }
        const paramNameToken = this.advance();
        params.push({
          paramType: paramTypeToken.value as TypeKeyword,
          name: paramNameToken.value,
          line: paramNameToken.line,
          column: paramNameToken.column,
        });
      } while (this.match(','));
    }

    this.expect(
      ')',
      'UNBALANCED_PAREN',
      `Dấu \`(\` của hàm \`${nameToken.value}\` chưa được đóng lại bằng \`)\`.`,
    );

    if (this.check(';')) {
      throw new ParseError(
        'UNSUPPORTED_FEATURE',
        `Trong khoá này em viết luôn phần thân hàm \`{ … }\` ngay sau tên hàm, không cần khai báo trước.`,
        this.peek().line,
        this.peek().column,
      );
    }

    const body = this.parseBlock(`hàm \`${nameToken.value}\``);

    return {
      kind: 'FunctionDeclaration',
      returnType,
      name: nameToken.value,
      params,
      body,
      line: nameToken.line,
      column: nameToken.column,
    };
  }

  // ------------------------------------------------------------- Câu lệnh

  private parseBlock(context: string): BlockStatement {
    const openToken = this.expect(
      '{',
      'UNBALANCED_BRACE',
      `Phần thân của ${context} cần bắt đầu bằng dấu \`{\`.`,
    );

    const body: Statement[] = [];
    while (!this.check('}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    if (this.isAtEnd()) {
      throw new ParseError(
        'UNBALANCED_BRACE',
        `Dấu \`{\` mở ở dòng ${openToken.line} chưa được đóng lại bằng \`}\`. Em kiểm tra xem có thiếu dấu đóng ngoặc nhọn không nhé.`,
        openToken.line,
        openToken.column,
      );
    }

    this.advance(); // ăn dấu }

    return {
      kind: 'BlockStatement',
      body,
      line: openToken.line,
      column: openToken.column,
    };
  }

  private parseStatement(): Statement {
    this.guardOutOfScope();
    const token = this.peek();

    if (this.check('{')) return this.parseBlock('khối lệnh');
    if (this.check(';')) {
      this.advance();
      return { kind: 'EmptyStatement', line: token.line, column: token.column };
    }
    if (this.check('if')) return this.parseIf();
    if (this.check('for')) return this.parseFor();
    if (this.check('return')) return this.parseReturn();
    if (this.check('cout')) return this.parseCout();
    if (this.check('cin')) return this.parseCin();
    if (token.type === 'type') return this.parseVariableDeclaration();

    const expression = this.parseExpression();
    this.expectSemicolon('câu lệnh');
    return {
      kind: 'ExpressionStatement',
      expression,
      line: token.line,
      column: token.column,
    };
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const typeToken = this.advance();
    const declarations: VariableDeclarator[] = [];

    do {
      if (this.peek().type !== 'identifier') {
        throw new ParseError(
          'UNKNOWN',
          `Sau kiểu \`${typeToken.value}\` ở dòng ${typeToken.line} cần có tên biến, ví dụ \`${typeToken.value} score = 0;\``,
          this.peek().line,
          this.peek().column,
        );
      }
      const nameToken = this.advance();
      let init: Expression | null = null;

      if (this.match('=')) {
        init = this.parseExpression();
      }

      declarations.push({
        name: nameToken.value,
        init,
        line: nameToken.line,
        column: nameToken.column,
      });
    } while (this.match(','));

    this.expectSemicolon('dòng khai báo biến');

    return {
      kind: 'VariableDeclaration',
      varType: typeToken.value as TypeKeyword,
      declarations,
      line: typeToken.line,
      column: typeToken.column,
    };
  }

  private parseIf(): Statement {
    const token = this.advance();
    this.expect('(', 'UNBALANCED_PAREN', 'Sau `if` cần có dấu `(` để mở điều kiện, ví dụ `if (x > 5)`.');
    const test = this.parseExpression();
    this.expect(
      ')',
      'UNBALANCED_PAREN',
      `Điều kiện của \`if\` ở dòng ${token.line} chưa được đóng bằng dấu \`)\`.`,
    );

    if (this.check(';')) {
      throw new ParseError(
        'UNKNOWN',
        `Không đặt dấu \`;\` ngay sau \`if (…)\` nhé — làm vậy thì phần thân \`if\` sẽ rỗng và không chạy gì cả. Dòng ${this.peek().line}.`,
        this.peek().line,
        this.peek().column,
      );
    }

    const consequent = this.parseStatement();
    let alternate: Statement | null = null;
    if (this.match('else')) {
      alternate = this.parseStatement();
    }

    return {
      kind: 'IfStatement',
      test,
      consequent,
      alternate,
      line: token.line,
      column: token.column,
    };
  }

  private parseFor(): Statement {
    const token = this.advance();
    this.expect(
      '(',
      'UNBALANCED_PAREN',
      'Sau `for` cần có dấu `(`. Cấu trúc đầy đủ: `for (khởi tạo; điều kiện; cập nhật)`.',
    );

    let init: VariableDeclaration | Statement | null = null;
    if (!this.check(';')) {
      if (this.peek().type === 'type') {
        init = this.parseVariableDeclaration(); // đã ăn luôn dấu ;
      } else {
        const startToken = this.peek();
        const expression = this.parseExpression();
        this.expectSemicolon('phần khởi tạo của vòng `for`');
        init = {
          kind: 'ExpressionStatement',
          expression,
          line: startToken.line,
          column: startToken.column,
        };
      }
    } else {
      this.advance();
    }

    const test = this.check(';') ? null : this.parseExpression();
    this.expect(
      ';',
      'MISSING_SEMICOLON',
      `Vòng \`for\` ở dòng ${token.line} cần đúng hai dấu \`;\` bên trong ngoặc: \`for (khởi tạo; điều kiện; cập nhật)\`.`,
    );

    const update = this.check(')') ? null : this.parseExpression();
    this.expect(
      ')',
      'UNBALANCED_PAREN',
      `Dấu \`(\` của vòng \`for\` ở dòng ${token.line} chưa được đóng bằng \`)\`.`,
    );

    const body = this.parseStatement();

    return {
      kind: 'ForStatement',
      init: init as VariableDeclaration | null,
      test,
      update,
      body,
      line: token.line,
      column: token.column,
    };
  }

  private parseReturn(): Statement {
    const token = this.advance();
    const argument = this.check(';') ? null : this.parseExpression();
    this.expectSemicolon('câu lệnh `return`');
    return { kind: 'ReturnStatement', argument, line: token.line, column: token.column };
  }

  private parseCout(): Statement {
    const token = this.advance();
    const parts: Expression[] = [];

    if (!this.check('<<')) {
      throw new ParseError(
        'COUT_SYNTAX',
        `Sau \`cout\` em cần dùng dấu \`<<\`, ví dụ: \`cout << "Xin chào";\` (dòng ${token.line}).`,
        token.line,
        token.column,
      );
    }

    while (this.match('<<')) {
      parts.push(this.parseExpression());
    }

    this.expectSemicolon('câu lệnh `cout`');
    return { kind: 'CoutStatement', parts, line: token.line, column: token.column };
  }

  private parseCin(): Statement {
    const token = this.advance();
    const targets: Identifier[] = [];

    if (!this.check('>>')) {
      throw new ParseError(
        'COUT_SYNTAX',
        `Sau \`cin\` em cần dùng dấu \`>>\`, ví dụ: \`cin >> score;\` (dòng ${token.line}).`,
        token.line,
        token.column,
      );
    }

    while (this.match('>>')) {
      if (this.peek().type !== 'identifier') {
        throw new ParseError(
          'UNKNOWN',
          `Sau \`cin >>\` cần là tên một biến để lưu giá trị nhập vào (dòng ${this.peek().line}).`,
          this.peek().line,
          this.peek().column,
        );
      }
      const name = this.advance();
      targets.push({
        kind: 'Identifier',
        name: name.value,
        line: name.line,
        column: name.column,
      });
    }

    this.expectSemicolon('câu lệnh `cin`');
    return { kind: 'CinStatement', targets, line: token.line, column: token.column };
  }

  // ----------------------------------------------------------- Biểu thức

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const left = this.parseLogicalOr();

    if (['=', '+=', '-=', '*=', '/=', '%='].includes(this.peek().value)) {
      const operatorToken = this.advance();

      if (left.kind !== 'Identifier') {
        throw new ParseError(
          'UNKNOWN',
          `Bên trái dấu \`${operatorToken.value}\` phải là tên một biến (dòng ${operatorToken.line}).`,
          operatorToken.line,
          operatorToken.column,
        );
      }

      const value = this.parseAssignment();
      return {
        kind: 'AssignmentExpression',
        operator: operatorToken.value,
        target: left,
        value,
        line: operatorToken.line,
        column: operatorToken.column,
      };
    }

    return left;
  }

  private parseBinaryLevel(operators: string[], next: () => Expression): Expression {
    let left = next();
    while (operators.includes(this.peek().value) && this.peek().type === 'operator') {
      const operatorToken = this.advance();
      const right = next();
      left = {
        kind: 'BinaryExpression',
        operator: operatorToken.value,
        left,
        right,
        line: operatorToken.line,
        column: operatorToken.column,
      };
    }
    return left;
  }

  private parseLogicalOr(): Expression {
    return this.parseBinaryLevel(['||'], () => this.parseLogicalAnd());
  }

  private parseLogicalAnd(): Expression {
    return this.parseBinaryLevel(['&&'], () => this.parseEquality());
  }

  private parseEquality(): Expression {
    return this.parseBinaryLevel(['==', '!='], () => this.parseComparison());
  }

  private parseComparison(): Expression {
    return this.parseBinaryLevel(['<', '>', '<=', '>='], () => this.parseAdditive());
  }

  private parseAdditive(): Expression {
    return this.parseBinaryLevel(['+', '-'], () => this.parseMultiplicative());
  }

  private parseMultiplicative(): Expression {
    return this.parseBinaryLevel(['*', '/', '%'], () => this.parseUnary());
  }

  private parseUnary(): Expression {
    if (['!', '-'].includes(this.peek().value) && this.peek().type === 'operator') {
      const operatorToken = this.advance();
      const argument = this.parseUnary();
      return {
        kind: 'UnaryExpression',
        operator: operatorToken.value,
        argument,
        line: operatorToken.line,
        column: operatorToken.column,
      };
    }

    if (['++', '--'].includes(this.peek().value)) {
      const operatorToken = this.advance();
      const argument = this.parseUnary();
      return {
        kind: 'UpdateExpression',
        operator: operatorToken.value as '++' | '--',
        argument,
        prefix: true,
        line: operatorToken.line,
        column: operatorToken.column,
      };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    const expression = this.parsePrimary();

    if (['++', '--'].includes(this.peek().value)) {
      const operatorToken = this.advance();
      return {
        kind: 'UpdateExpression',
        operator: operatorToken.value as '++' | '--',
        argument: expression,
        prefix: false,
        line: operatorToken.line,
        column: operatorToken.column,
      };
    }

    return expression;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    if (token.type === 'number') {
      this.advance();
      return {
        kind: 'NumberLiteral',
        value: Number(token.value),
        isFloat: token.value.includes('.'),
        line: token.line,
        column: token.column,
      };
    }

    if (token.type === 'string') {
      this.advance();
      return { kind: 'StringLiteral', value: token.value, line: token.line, column: token.column };
    }

    if (token.type === 'char') {
      this.advance();
      return { kind: 'CharLiteral', value: token.value, line: token.line, column: token.column };
    }

    if (this.check('true') || this.check('false')) {
      this.advance();
      return {
        kind: 'BoolLiteral',
        value: token.value === 'true',
        line: token.line,
        column: token.column,
      };
    }

    if (this.check('endl')) {
      this.advance();
      return { kind: 'EndlLiteral', line: token.line, column: token.column };
    }

    if (this.check('(')) {
      this.advance();
      const expression = this.parseExpression();
      this.expect(
        ')',
        'UNBALANCED_PAREN',
        `Dấu \`(\` mở ở dòng ${token.line} chưa được đóng bằng \`)\`.`,
      );
      return expression;
    }

    if (token.type === 'identifier') {
      this.guardOutOfScope();
      this.advance();

      if (this.check('(')) {
        this.advance();
        const args: Expression[] = [];
        if (!this.check(')')) {
          do {
            args.push(this.parseExpression());
          } while (this.match(','));
        }
        this.expect(
          ')',
          'UNBALANCED_PAREN',
          `Lời gọi hàm \`${token.value}\` ở dòng ${token.line} chưa được đóng bằng dấu \`)\`.`,
        );
        return {
          kind: 'CallExpression',
          callee: token.value,
          args,
          line: token.line,
          column: token.column,
        };
      }

      return { kind: 'Identifier', name: token.value, line: token.line, column: token.column };
    }

    if (token.type === 'type' && isTypeKeyword(token.value)) {
      throw new ParseError(
        'UNKNOWN',
        `Từ khoá \`${token.value}\` chỉ dùng khi khai báo biến hoặc hàm, không dùng giữa một phép tính (dòng ${token.line}).`,
        token.line,
        token.column,
      );
    }

    throw new ParseError(
      'UNKNOWN',
      token.type === 'eof'
        ? 'Chương trình kết thúc đột ngột. Em kiểm tra xem có thiếu dấu `}` hoặc `;` ở cuối không nhé.'
        : `Ở dòng ${token.line}, \`${token.value}\` nằm ở vị trí không hợp lệ.`,
      token.line,
      token.column,
    );
  }
}
