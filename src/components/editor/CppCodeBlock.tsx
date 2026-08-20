import { Fragment, type ReactNode } from 'react';
import { Code2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CppCodeBlockProps {
  code: string;
  label?: string;
  className?: string;
}

type TokenKind =
  | 'plain'
  | 'keyword'
  | 'type'
  | 'function'
  | 'number'
  | 'string'
  | 'comment'
  | 'operator'
  | 'placeholder';

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: 'text-slate-200',
  keyword: 'font-semibold text-violet-300',
  type: 'text-cyan-300',
  function: 'text-cyan-400',
  number: 'text-amber-300',
  string: 'text-emerald-300',
  comment: 'italic text-slate-500',
  operator: 'text-violet-400',
  placeholder: 'rounded bg-amber-300/12 px-0.5 font-bold text-amber-200 underline decoration-amber-300/55 decoration-dashed underline-offset-4',
};

const KEYWORDS = new Set(['if', 'else', 'for', 'while', 'return', 'break', 'continue', 'using', 'namespace']);
const TYPES = new Set(['void', 'int', 'bool', 'string', 'double', 'float', 'char', 'long', 'auto']);
const TOKEN_PATTERN = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|___+|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|==|!=|>=|<=|\+\+|--|&&|\|\||<<|>>|[+\-*/%=<>!&|])/gm;

/** Tô màu C++ nhỏ gọn, đồng bộ bảng màu editor nhưng không biến gợi ý thành editor có thể sao chép. */
export function CppCodeBlock({ code, label = 'C++', className }: CppCodeBlockProps) {
  const lines = formatHintCode(code).split('\n');

  return (
    <figure className={cn('overflow-hidden rounded-xl border border-cyan-400/25 bg-[#070d1c] shadow-inner', className)}>
      <figcaption className="flex items-center gap-2 border-b border-slate-700/80 bg-[#0c1428] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-300">
        <Code2 className="size-3.5" aria-hidden="true" /> {label}
      </figcaption>
      <div className="max-h-72 overflow-auto bg-[#070d1c] py-2 font-mono text-[13px] leading-6 [color-scheme:dark] [font-feature-settings:'liga'_0,'clig'_0,'calt'_0] [font-variant-ligatures:none]">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="flex min-w-max px-2 hover:bg-cyan-300/[.04]">
            <span className="w-9 shrink-0 select-none border-r border-slate-800 pr-2 text-right text-slate-600" aria-hidden="true">
              {index + 1}
            </span>
            <code className="block whitespace-pre pl-3 pr-4 text-slate-200">{highlightCppLine(line)}</code>
          </div>
        ))}
      </div>
    </figure>
  );
}

/**
 * Gợi ý khung code thường cố ý viết thân `for` trên một dòng để dữ liệu ngắn.
 * Khi trình bày, tách riêng `{`, thân và `}` để học sinh nhìn đúng cấu trúc sẽ gõ
 * trong editor. Chỉ định dạng các block một dòng; không thay đổi nội dung chỗ trống.
 */
export function formatHintCode(code: string): string {
  const normalized = code.replace(/\r\n?/g, '\n').trimEnd();
  return normalized
    .split('\n')
    .flatMap((line) => {
      const match = /^(\s*)(.*?)\{\s*([^{}]+?)\s*}\s*$/.exec(line);
      if (!match) return [line];
      const [, indent, header, body] = match;
      return [`${indent}${header.trimEnd()} {`, `${indent}    ${body.trim()}`, `${indent}}`];
    })
    .join('\n');
}

function highlightCppLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) nodes.push(line.slice(cursor, index));
    const text = match[0];
    const kind = classifyToken(text, line.slice(index + text.length));
    nodes.push(<Fragment key={`${index}-${text}`}><span className={TOKEN_CLASS[kind]}>{text}</span></Fragment>);
    cursor = index + text.length;
    if (kind === 'comment') break;
  }

  if (cursor < line.length) nodes.push(line.slice(cursor));
  return nodes;
}

function classifyToken(token: string, remainder: string): TokenKind {
  if (token.startsWith('//')) return 'comment';
  if (token.startsWith('"') || token.startsWith("'")) return 'string';
  if (/^___+$/.test(token)) return 'placeholder';
  if (/^\d/.test(token)) return 'number';
  if (KEYWORDS.has(token)) return 'keyword';
  if (TYPES.has(token)) return 'type';
  if (/^[A-Za-z_]/.test(token) && /^\s*\(/.test(remainder)) return 'function';
  if (/^[A-Za-z_]/.test(token)) return 'plain';
  return 'operator';
}
