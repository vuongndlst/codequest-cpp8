import type { TypeKeyword } from './tokens';

/**
 * Cây cú pháp (AST) cho tập con C++ của khoá học.
 *
 * Grammar đã được ĐÓNG BĂNG ở docs/phase-1-architecture.md mục 6.2.
 * Mọi cú pháp ngoài phạm vi này đều trả về UNSUPPORTED_FEATURE với thông báo
 * thân thiện, thay vì làm parser sập.
 */

export interface Position {
  line: number;
  column: number;
}

// ---------------------------------------------------------------- Biểu thức

export type Expression =
  | NumberLiteral
  | StringLiteral
  | CharLiteral
  | BoolLiteral
  | EndlLiteral
  | Identifier
  | BinaryExpression
  | UnaryExpression
  | UpdateExpression
  | AssignmentExpression
  | CallExpression
  | ArrayAccessExpression;

export interface NumberLiteral extends Position {
  kind: 'NumberLiteral';
  value: number;
  /** true nếu viết có dấu chấm thập phân -> ảnh hưởng phép chia */
  isFloat: boolean;
}

export interface StringLiteral extends Position {
  kind: 'StringLiteral';
  value: string;
}

export interface CharLiteral extends Position {
  kind: 'CharLiteral';
  value: string;
}

export interface BoolLiteral extends Position {
  kind: 'BoolLiteral';
  value: boolean;
}

/** `endl` — xuống dòng khi in ra màn hình */
export interface EndlLiteral extends Position {
  kind: 'EndlLiteral';
}

export interface Identifier extends Position {
  kind: 'Identifier';
  name: string;
}

export interface BinaryExpression extends Position {
  kind: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends Position {
  kind: 'UnaryExpression';
  operator: string;
  argument: Expression;
}

/** `i++`, `++i`, `i--`, `--i` */
export interface UpdateExpression extends Position {
  kind: 'UpdateExpression';
  operator: '++' | '--';
  argument: Expression;
  prefix: boolean;
}

/** `x = 5`, `score += 10` */
export interface AssignmentExpression extends Position {
  kind: 'AssignmentExpression';
  operator: string;
  target: Identifier | ArrayAccessExpression;
  value: Expression;
}

/** `scores[i]` — truy cập một phần tử của mảng một chiều. */
export interface ArrayAccessExpression extends Position {
  kind: 'ArrayAccessExpression';
  array: Identifier;
  index: Expression;
}

export interface CallExpression extends Position {
  kind: 'CallExpression';
  callee: string;
  args: Expression[];
}

// ------------------------------------------------------------------ Câu lệnh

export type Statement =
  | VariableDeclaration
  | ExpressionStatement
  | IfStatement
  | ForStatement
  | ReturnStatement
  | BlockStatement
  | CoutStatement
  | CinStatement
  | EmptyStatement;

export interface VariableDeclarator extends Position {
  name: string;
  init: Expression | null;
  /** Có giá trị khi đây là khai báo mảng: `int scores[5]`. */
  arraySize: Expression | null;
  /** Danh sách khởi tạo của mảng: `{2, 4, 6}`. */
  arrayInit: Expression[] | null;
}

export interface VariableDeclaration extends Position {
  kind: 'VariableDeclaration';
  varType: TypeKeyword;
  declarations: VariableDeclarator[];
}

export interface ExpressionStatement extends Position {
  kind: 'ExpressionStatement';
  expression: Expression;
}

export interface IfStatement extends Position {
  kind: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface ForStatement extends Position {
  kind: 'ForStatement';
  init: VariableDeclaration | ExpressionStatement | null;
  test: Expression | null;
  update: Expression | null;
  body: Statement;
}

export interface ReturnStatement extends Position {
  kind: 'ReturnStatement';
  argument: Expression | null;
}

export interface BlockStatement extends Position {
  kind: 'BlockStatement';
  body: Statement[];
}

/** `cout << "Xin chao" << endl;` */
export interface CoutStatement extends Position {
  kind: 'CoutStatement';
  parts: Expression[];
}

/** `cin >> score;` */
export interface CinStatement extends Position {
  kind: 'CinStatement';
  targets: Identifier[];
}

export interface EmptyStatement extends Position {
  kind: 'EmptyStatement';
}

// -------------------------------------------------------------- Cấp chương trình

export interface Parameter extends Position {
  paramType: TypeKeyword;
  name: string;
  /** `int &value`: thay đổi trong hàm tác động lên biến được truyền vào. */
  isReference: boolean;
  /** `int values[]`: tham số mảng một chiều. */
  isArray: boolean;
}

export interface FunctionDeclaration extends Position {
  kind: 'FunctionDeclaration';
  returnType: TypeKeyword;
  name: string;
  params: Parameter[];
  body: BlockStatement;
}

export interface IncludeDirective extends Position {
  kind: 'IncludeDirective';
  header: string;
}

export interface UsingDirective extends Position {
  kind: 'UsingDirective';
  namespace: string;
}

export type TopLevelNode = FunctionDeclaration | IncludeDirective | UsingDirective;

export interface Program {
  kind: 'Program';
  body: TopLevelNode[];
}

export type AnyNode = Program | TopLevelNode | Statement | Expression;

// ------------------------------------------------------------------ Duyệt cây

/**
 * Duyệt toàn bộ cây. Dùng cho pattern matcher và Clean Code Coach.
 * `enter` trả về false để không đi sâu vào nhánh con.
 */
export function walk(
  node: AnyNode | null | undefined,
  enter: (node: AnyNode, parents: AnyNode[]) => boolean | void,
  parents: AnyNode[] = [],
): void {
  if (!node) return;
  if (enter(node, parents) === false) return;

  const nextParents = [...parents, node];
  for (const child of childrenOf(node)) {
    walk(child, enter, nextParents);
  }
}

export function childrenOf(node: AnyNode): AnyNode[] {
  switch (node.kind) {
    case 'Program':
      return node.body;
    case 'FunctionDeclaration':
      return [node.body];
    case 'BlockStatement':
      return node.body;
    case 'VariableDeclaration':
      return node.declarations.flatMap((d) => [d.arraySize, d.init, ...(d.arrayInit ?? [])])
        .filter((e): e is Expression => e !== null);
    case 'ExpressionStatement':
      return [node.expression];
    case 'IfStatement':
      return [node.test, node.consequent, node.alternate].filter(Boolean) as AnyNode[];
    case 'ForStatement':
      return [node.init, node.test, node.update, node.body].filter(Boolean) as AnyNode[];
    case 'ReturnStatement':
      return node.argument ? [node.argument] : [];
    case 'CoutStatement':
      return node.parts;
    case 'CinStatement':
      return node.targets;
    case 'BinaryExpression':
      return [node.left, node.right];
    case 'UnaryExpression':
      return [node.argument];
    case 'UpdateExpression':
      return [node.argument];
    case 'AssignmentExpression':
      return [node.target, node.value];
    case 'CallExpression':
      return node.args;
    case 'ArrayAccessExpression':
      return [node.array, node.index];
    default:
      return [];
  }
}
