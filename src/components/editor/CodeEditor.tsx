import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  Decoration,
  showTooltip,
  type DecorationSet,
  type Tooltip,
} from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentSelection,
  indentWithTab,
  insertNewlineAndIndent,
} from '@codemirror/commands';
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
  HighlightStyle,
} from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { tags } from '@lezer/highlight';
import type { PaletteCommand } from '@/data/commandPalette';

/**
 * Code editor cho học sinh lớp 8.
 *
 * Vì sao CodeMirror 6 chứ không phải Monaco: Monaco nặng khoảng 2 MB sau khi nén,
 * quá tải với máy phòng ICT dùng Wi-Fi chung. CodeMirror 6 nhẹ hơn khoảng 10 lần
 * mà vẫn có đủ tô màu cú pháp, đánh số dòng và tự thụt lề.
 *
 * CỐ Ý KHÔNG BẬT autocomplete chèn code. Tooltip chỉ nhắc cú pháp ngay tại
 * con trỏ sau khi học sinh tự gõ ít nhất hai ký tự; các em vẫn phải hoàn thiện
 * toàn bộ lệnh bằng bàn phím.
 */

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Chỉ các lệnh thật sự cần cho nhiệm vụ; hiển thị read-only cạnh con trỏ. */
  commands?: PaletteCommand[];
  /** Dòng cần làm nổi bật (dòng có lỗi) */
  highlightedLines?: number[];
  /** Dòng đang được engine thực thi — màu cyan, tách biệt với dòng lỗi màu đỏ. */
  executingLine?: number;
  /** Các dòng trọng tâm; dòng khung C++ còn lại được làm mờ để giảm tải nhận thức. */
  focusLines?: number[];
  readOnly?: boolean;
  /** Chiều cao tối thiểu, mặc định vừa khít khung nhiệm vụ */
  minHeight?: string;
  ariaLabel?: string;
}

// --- Làm nổi bật dòng có lỗi -------------------------------------------------

const setErrorLines = StateEffect.define<number[]>();

const errorLineDecoration = Decoration.line({ class: 'cm-errorLine' });

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = decorations.map(transaction.changes);

    for (const effect of transaction.effects) {
      if (!effect.is(setErrorLines)) continue;

      const ranges = effect.value
        .filter((line) => line >= 1 && line <= transaction.state.doc.lines)
        .map((line) => errorLineDecoration.range(transaction.state.doc.line(line).from));

      next = Decoration.set(ranges, true);
    }

    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const setExecutingLine = StateEffect.define<number | undefined>();
const executingLineDecoration = Decoration.line({ class: 'cm-executingLine' });
const executingLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = decorations.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (!effect.is(setExecutingLine)) continue;
      const line = effect.value;
      next = line && line <= transaction.state.doc.lines
        ? Decoration.set([executingLineDecoration.range(transaction.state.doc.line(line).from)])
        : Decoration.none;
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const setFocusLines = StateEffect.define<number[]>();
const scaffoldLineDecoration = Decoration.line({ class: 'cm-scaffoldLine' });
const focusLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = decorations.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (!effect.is(setFocusLines)) continue;
      const focused = new Set(effect.value);
      next = focused.size === 0
        ? Decoration.none
        : Decoration.set(
            Array.from({ length: transaction.state.doc.lines }, (_, index) => index + 1)
              .filter((line) => !focused.has(line))
              .map((line) => scaffoldLineDecoration.range(transaction.state.doc.line(line).from)),
            true,
          );
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

// --- Nhắc cú pháp ngay tại con trỏ -----------------------------------------

const setInlineCommands = StateEffect.define<readonly PaletteCommand[]>();
const dismissInlineCommand = StateEffect.define<null>();

interface InlineCommandState {
  commands: readonly PaletteCommand[];
  tooltip: Tooltip | null;
}

function commandTrigger(command: PaletteCommand): string {
  return command.label.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]?.toLowerCase() ?? '';
}

function activeToken(state: EditorState): { from: number; text: string } | null {
  if (!state.selection.main.empty) return null;
  const cursor = state.selection.main.head;
  const line = state.doc.lineAt(cursor);
  const beforeCursor = line.text.slice(0, cursor - line.from);
  const match = beforeCursor.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (!match || match[0].length < 2) return null;
  return { from: cursor - match[0].length, text: match[0] };
}

function buildCommandTooltip(state: EditorState, commands: readonly PaletteCommand[]): Tooltip | null {
  const token = activeToken(state);
  if (!token) return null;
  const query = token.text.toLowerCase();
  const matches = commands.filter((command) => commandTrigger(command).startsWith(query)).slice(0, 2);
  if (matches.length === 0) return null;

  return {
    pos: token.from,
    end: state.selection.main.head,
    above: true,
    strictSide: false,
    create: () => {
      const dom = document.createElement('div');
      dom.className = 'cm-commandHint';
      dom.setAttribute('role', 'tooltip');
      dom.setAttribute('aria-label', 'Nhắc cú pháp theo nội dung em đang gõ');

      const heading = document.createElement('div');
      heading.className = 'cm-commandHint-heading';
      heading.textContent = 'Byte nhắc cú pháp';
      dom.append(heading);

      const list = document.createElement('ul');
      list.className = 'cm-commandHint-list';
      for (const command of matches) {
        const item = document.createElement('li');
        item.className = 'cm-commandHint-item';
        const signature = document.createElement('code');
        signature.className = 'cm-commandHint-signature';
        signature.textContent = command.label;
        const explanation = document.createElement('span');
        explanation.className = 'cm-commandHint-explanation';
        explanation.textContent = command.hint;
        item.append(signature, explanation);
        list.append(item);
      }
      dom.append(list);

      const note = document.createElement('p');
      note.className = 'cm-commandHint-note';
      note.textContent = 'Tiếp tục tự gõ · Esc để đóng';
      dom.append(note);
      return { dom };
    },
  };
}

const inlineCommandField = StateField.define<InlineCommandState>({
  create: () => ({ commands: [], tooltip: null }),
  update(current, transaction) {
    let commands = current.commands;
    let dismissed = false;
    for (const effect of transaction.effects) {
      if (effect.is(setInlineCommands)) commands = effect.value;
      if (effect.is(dismissInlineCommand)) dismissed = true;
    }
    return {
      commands,
      tooltip: dismissed ? null : buildCommandTooltip(transaction.state, commands),
    };
  },
  provide: (field) => showTooltip.from(field, (value) => value.tooltip),
});

// --- Giao diện ---------------------------------------------------------------

const byteLandTheme = EditorView.theme(
  {
    '&': {
      color: '#e2e8f0',
      backgroundColor: '#070d1c',
      fontSize: '15px',
      borderRadius: '0.75rem',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontVariantLigatures: 'none',
      fontFeatureSettings: "'liga' 0, 'clig' 0, 'calt' 0",
      padding: '12px 0',
      caretColor: '#22d3ee',
      lineHeight: '1.7',
    },
    '.cm-gutters': {
      backgroundColor: '#0c1428',
      color: '#475569',
      border: 'none',
      borderTopLeftRadius: '0.75rem',
      borderBottomLeftRadius: '0.75rem',
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontVariantLigatures: 'none',
      fontFeatureSettings: "'liga' 0, 'clig' 0, 'calt' 0",
    },
    '.cm-activeLineGutter': { backgroundColor: '#131f3d', color: '#94a3b8' },
    '.cm-activeLine': { backgroundColor: 'rgba(19, 31, 61, 0.5)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#22d3ee', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(34, 211, 238, 0.25)',
    },
    '.cm-errorLine': {
      backgroundColor: 'rgba(248, 113, 113, 0.12)',
      // Không CHỈ dùng màu để báo lỗi (mục 18) — thêm vạch đỏ bên trái
      boxShadow: 'inset 3px 0 0 0 #f87171',
    },
    '.cm-executingLine': {
      backgroundColor: 'rgba(34, 211, 238, 0.13)',
      boxShadow: 'inset 3px 0 0 0 #22d3ee',
    },
    '.cm-scaffoldLine': { opacity: '0.42' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(167, 139, 250, 0.3)',
      outline: 'none',
    },
    '&.cm-focused': { outline: '2px solid #22d3ee', outlineOffset: '2px' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-tooltip.cm-commandHint': {
      maxWidth: '340px',
      overflow: 'hidden',
      border: '1px solid rgba(34, 211, 238, 0.4)',
      borderRadius: '10px',
      backgroundColor: 'rgba(7, 13, 28, 0.97)',
      color: '#e2e8f0',
      boxShadow: '0 14px 32px rgba(0, 0, 0, 0.42)',
      padding: '8px 10px',
    },
    '.cm-commandHint-heading': { color: '#67e8f9', fontSize: '11px', fontWeight: '700' },
    '.cm-commandHint-list': { margin: '5px 0 0', padding: '0', listStyle: 'none' },
    '.cm-commandHint-item': { display: 'grid', gap: '2px', padding: '4px 0' },
    '.cm-commandHint-signature': { color: '#c4b5fd', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700' },
    '.cm-commandHint-explanation': { color: '#94a3b8', fontSize: '11px' },
    '.cm-commandHint-note': { margin: '5px 0 0', borderTop: '1px solid #1e293b', paddingTop: '5px', color: '#64748b', fontSize: '10px' },
  },
  { dark: true },
);

/**
 * Bản sáng của trình soạn code.
 *
 * KHÔNG dùng lại được biến CSS như phần còn lại của website: CodeMirror nhận
 * màu qua đối tượng JavaScript rồi tự sinh stylesheet, nên phải viết riêng
 * một bảng màu thứ hai.
 *
 * Mọi màu chữ ở đây đều đạt tương phản tối thiểu 4.5:1 trên nền trắng — code
 * là thứ học sinh nhìn lâu nhất trong cả buổi học.
 */
const dayLightTheme = EditorView.theme(
  {
    '&': {
      color: '#1b2740',
      backgroundColor: '#ffffff',
      fontSize: '15px',
      borderRadius: '0.75rem',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontVariantLigatures: 'none',
      fontFeatureSettings: "'liga' 0, 'clig' 0, 'calt' 0",
      padding: '12px 0',
      caretColor: '#0891b2',
      lineHeight: '1.7',
    },
    '.cm-gutters': {
      backgroundColor: '#f1f5f9',
      color: '#94a3b8',
      border: 'none',
      borderTopLeftRadius: '0.75rem',
      borderBottomLeftRadius: '0.75rem',
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontVariantLigatures: 'none',
      fontFeatureSettings: "'liga' 0, 'clig' 0, 'calt' 0",
    },
    '.cm-activeLineGutter': { backgroundColor: '#e2e8f0', color: '#475569' },
    '.cm-activeLine': { backgroundColor: 'rgba(6, 182, 212, 0.07)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#0891b2', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(6, 182, 212, 0.22)',
    },
    '.cm-errorLine': {
      backgroundColor: 'rgba(220, 38, 38, 0.09)',
      boxShadow: 'inset 3px 0 0 0 #dc2626',
    },
    '.cm-executingLine': {
      backgroundColor: 'rgba(8, 145, 178, 0.1)',
      boxShadow: 'inset 3px 0 0 0 #0891b2',
    },
    '.cm-scaffoldLine': { opacity: '0.48' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(124, 58, 237, 0.22)',
      outline: 'none',
    },
    '&.cm-focused': { outline: '2px solid #0891b2', outlineOffset: '2px' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-tooltip.cm-commandHint': {
      maxWidth: '340px',
      overflow: 'hidden',
      border: '1px solid rgba(8, 145, 178, 0.36)',
      borderRadius: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      color: '#1b2740',
      boxShadow: '0 14px 30px rgba(15, 23, 42, 0.18)',
      padding: '8px 10px',
    },
    '.cm-commandHint-heading': { color: '#0e7490', fontSize: '11px', fontWeight: '700' },
    '.cm-commandHint-list': { margin: '5px 0 0', padding: '0', listStyle: 'none' },
    '.cm-commandHint-item': { display: 'grid', gap: '2px', padding: '4px 0' },
    '.cm-commandHint-signature': { color: '#7c3aed', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: '700' },
    '.cm-commandHint-explanation': { color: '#475569', fontSize: '11px' },
    '.cm-commandHint-note': { margin: '5px 0 0', borderTop: '1px solid #e2e8f0', paddingTop: '5px', color: '#64748b', fontSize: '10px' },
  },
  { dark: false },
);

const byteLandHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#c4b5fd', fontWeight: '600' },
  { tag: tags.typeName, color: '#67e8f9' },
  { tag: tags.controlKeyword, color: '#f0abfc', fontWeight: '600' },
  { tag: tags.string, color: '#86efac' },
  { tag: tags.number, color: '#fcd34d' },
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#22d3ee' },
  { tag: tags.variableName, color: '#e2e8f0' },
  { tag: tags.operator, color: '#a78bfa' },
  { tag: tags.processingInstruction, color: '#94a3b8' },
  { tag: tags.bool, color: '#fbbf24' },
]);

const dayLightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed', fontWeight: '600' },
  { tag: tags.typeName, color: '#0e7490' },
  { tag: tags.controlKeyword, color: '#a21caf', fontWeight: '600' },
  { tag: tags.string, color: '#047857' },
  { tag: tags.number, color: '#b45309' },
  { tag: tags.comment, color: '#64748b', fontStyle: 'italic' },
  { tag: tags.function(tags.variableName), color: '#0369a1' },
  { tag: tags.variableName, color: '#1b2740' },
  { tag: tags.operator, color: '#7c3aed' },
  { tag: tags.processingInstruction, color: '#4a5b78' },
  { tag: tags.bool, color: '#b45309' },
]);

/**
 * Cho phép đổi bảng màu mà KHÔNG dựng lại cả editor.
 *
 * Dựng lại thì học sinh mất con trỏ, mất vùng đang chọn và mất cả lịch sử
 * Ctrl+Z ngay giữa lúc đang viết dở. Compartment là cách CodeMirror cho phép
 * thay một mảnh cấu hình tại chỗ.
 */
const themeCompartment = new Compartment();

function themeExtension(resolved: 'light' | 'dark'): Extension {
  return resolved === 'light'
    ? [dayLightTheme, syntaxHighlighting(dayLightHighlight)]
    : [byteLandTheme, syntaxHighlighting(byteLandHighlight)];
}

/**
 * Thụt lề lại toàn bộ chương trình.
 *
 * Việc tự thụt lề LÚC GÕ đã chạy đúng: Enter sau `{` thì lùi vào một cấp, gõ
 * `}` thì lùi ra. Thứ còn thiếu là cách sửa code ĐÃ lỡ lộn xộn — học sinh xoá
 * dòng, sửa chỗ nọ chỗ kia, dán code từ phần hướng dẫn vào, và không có nút nào
 * dọn lại. Không có công cụ này thì Clean Code Coach cứ nhắc "chưa thụt lề
 * đúng" mãi mà em không biết phải làm sao.
 *
 * Con trỏ được đặt lại về cuối đúng dòng cũ — nếu để nhảy về đầu file thì mỗi
 * lần bấm dọn dẹp em lại mất chỗ đang viết.
 */
export function formatDocument(view: EditorView): void {
  const lineBefore = view.state.doc.lineAt(view.state.selection.main.head).number;

  view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } });
  indentSelection(view);

  const totalLines = view.state.doc.lines;
  const line = view.state.doc.line(Math.min(lineBefore, totalLines));
  view.dispatch({ selection: { anchor: line.to } });
  view.focus();
}

export interface CodeEditorHandle {
  /** Thụt lề lại cả chương trình */
  format: () => void;
  /** Chèn một đoạn code tại vị trí con trỏ */
  insert: (text: string) => void;
}

/**
 * Chèn code tại con trỏ, tự thụt lề cho khớp dòng hiện tại.
 *
 * Học sinh bấm nút `moveForward();` thì đoạn code phải rơi vào đúng chỗ đang
 * đứng và thẳng hàng với các dòng xung quanh. Chèn thô thì dòng mới dính sát
 * lề trái, nhìn như code hỏng — mà lỗi thụt lề chính là thứ Clean Code Coach
 * sẽ nhắc ngay sau đó.
 *
 * Con trỏ được đặt sau đoạn vừa chèn để em gõ tiếp được luôn.
 */
function insertAtCursor(view: EditorView, text: string): void {
  const { from, to } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const indent = line.text.match(/^[ \t]*/)?.[0] ?? '';

  // Dòng nhiều dòng thì mọi dòng sau phải thụt bằng dòng đầu
  const body = text.split('\n').join(`\n${indent}`);

  // Con trỏ đang ở giữa dòng có chữ -> xuống dòng mới rồi mới chèn
  const needsNewline = line.text.slice(0, from - line.from).trim().length > 0;
  const insert = needsNewline ? `\n${indent}${body}` : body;

  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + insert.length },
    scrollIntoView: true,
  });
  view.focus();
}

function buildExtensions(
  readOnly: boolean,
  resolvedTheme: 'light' | 'dark',
  onChange: (value: string) => void,
  onClipboardBlocked: (action: 'copy' | 'cut' | 'paste' | 'drop') => void,
): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    rectangularSelection(),
    crosshairCursor(),
    // Tự thụt lề khi gõ và khi xuống dòng — hỗ trợ, không viết hộ
    indentOnInput(),
    indentUnit.of('    '),
    bracketMatching(),
    cpp(),
    errorLineField,
    executingLineField,
    focusLineField,
    inlineCommandField,
    themeCompartment.of(themeExtension(resolvedTheme)),
    // Đây là màn luyện gõ và nhớ cú pháp: chặn cả đường tắt bàn phím lẫn menu
    // chuột. Học sinh vẫn chọn văn bản để sửa, dùng Undo và Dọn code bình thường.
    EditorView.domEventHandlers({
      copy: (event) => {
        event.preventDefault();
        onClipboardBlocked('copy');
        return true;
      },
      cut: (event) => {
        event.preventDefault();
        onClipboardBlocked('cut');
        return true;
      },
      paste: (event) => {
        event.preventDefault();
        onClipboardBlocked('paste');
        return true;
      },
      drop: (event) => {
        event.preventDefault();
        onClipboardBlocked('drop');
        return true;
      },
    }),
    keymap.of([
      {
        key: 'Escape',
        run: (view) => {
          if (!view.state.field(inlineCommandField).tooltip) return false;
          view.dispatch({ effects: dismissInlineCommand.of(null) });
          return true;
        },
      },
      // Phím tắt quen thuộc của VS Code, để em nào biết rồi thì dùng được ngay
      { key: 'Shift-Alt-f', run: (view) => (formatDocument(view), true) },
      ...defaultKeymap,
      ...historyKeymap,
      // Tab thụt lề thay vì nhảy khỏi ô nhập — quen thuộc với học sinh
      indentWithTab,
      { key: 'Enter', run: insertNewlineAndIndent },
    ]),
    EditorView.lineWrapping,
    EditorState.readOnly.of(readOnly),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
    }),
  ];
}

export function CodeEditor({
  value,
  onChange,
  commands = [],
  highlightedLines = [],
  executingLine,
  focusLines = [],
  readOnly = false,
  minHeight = '320px',
  ariaLabel = 'Vùng viết code C++',
  handleRef,
}: CodeEditorProps & { handleRef?: Ref<CodeEditorHandle> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const clipboardTimerRef = useRef<number | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const resolvedTheme = useUiStore((state) => state.resolvedTheme);
  // Giữ trong ref để effect khởi tạo không phải phụ thuộc vào giá trị này
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;

  // Cho trang cha gọi được lệnh thụt lề lại mà không phải tự giữ EditorView
  useImperativeHandle(
    handleRef,
    () => ({
      format: () => {
        if (viewRef.current) formatDocument(viewRef.current);
      },
      insert: (text: string) => {
        if (viewRef.current) insertAtCursor(viewRef.current, text);
      },
    }),
    [],
  );

  // Khởi tạo editor một lần
  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: buildExtensions(
          readOnly,
          themeRef.current,
          (next) => onChangeRef.current(next),
          (action) => {
            const isTakingCode = action === 'copy' || action === 'cut';
            setClipboardNotice(
              isTakingCode
                ? 'Màn luyện tập không cho sao chép code. Em hãy tự gõ để ghi nhớ cú pháp nhé.'
                : 'Màn luyện tập không nhận code dán vào. Em hãy tự gõ từng lệnh nhé.',
            );
            if (clipboardTimerRef.current !== null) window.clearTimeout(clipboardTimerRef.current);
            clipboardTimerRef.current = window.setTimeout(() => setClipboardNotice(''), 3500);
          },
        ),
      }),
      parent: hostRef.current,
    });

    viewRef.current = view;
    return () => {
      if (clipboardTimerRef.current !== null) window.clearTimeout(clipboardTimerRef.current);
      view.destroy();
      viewRef.current = null;
    };
    // Cố ý chỉ chạy một lần: nội dung được đồng bộ ở effect bên dưới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Đồng bộ khi nội dung bị thay từ bên ngoài (Đặt lại, khôi phục bản nháp…)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  // Đổi danh sách lệnh theo nhiệm vụ mà không dựng lại editor hoặc mất Undo.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setInlineCommands.of(commands) });
  }, [commands]);

  // Cập nhật dòng được làm nổi bật
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLines.of(highlightedLines) });
  }, [highlightedLines]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setExecutingLine.of(executingLine) });
  }, [executingLine]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setFocusLines.of(focusLines) });
  }, [focusLines]);

  // Đổi bảng màu tại chỗ, giữ nguyên con trỏ và lịch sử Ctrl+Z
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.reconfigure(themeExtension(resolvedTheme)),
    });
  }, [resolvedTheme]);

  return (
    <div>
      <div
        ref={hostRef}
        role="group"
        aria-label={ariaLabel}
        className="cq-editor overflow-hidden rounded-xl border border-abyss-600"
        style={{ minHeight }}
      />
      <p className="mt-1 min-h-5 text-[11px] font-medium text-treasure-300" role="status" aria-live="polite">
        {clipboardNotice}
      </p>
    </div>
  );
}
