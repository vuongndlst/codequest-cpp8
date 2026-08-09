import { useEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
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
  type DecorationSet,
} from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
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

/**
 * Code editor cho học sinh lớp 8.
 *
 * Vì sao CodeMirror 6 chứ không phải Monaco: Monaco nặng khoảng 2 MB sau khi nén,
 * quá tải với máy phòng ICT dùng Wi-Fi chung. CodeMirror 6 nhẹ hơn khoảng 10 lần
 * mà vẫn có đủ tô màu cú pháp, đánh số dòng và tự thụt lề.
 *
 * CỐ Ý KHÔNG BẬT: gợi ý tự động hoàn thành code. Đề bài yêu cầu rõ
 * "không tự động hoàn thành toàn bộ bài cho học sinh" (mục 7) — các em phải tự
 * nhớ cú pháp thì mới học được. Chỉ hỗ trợ đóng ngoặc và thụt lề.
 */

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Dòng cần làm nổi bật (dòng có lỗi) */
  highlightedLines?: number[];
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
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(167, 139, 250, 0.3)',
      outline: 'none',
    },
    '&.cm-focused': { outline: '2px solid #22d3ee', outlineOffset: '2px' },
    '.cm-scroller': { overflow: 'auto' },
  },
  { dark: true },
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

function buildExtensions(readOnly: boolean, onChange: (value: string) => void): Extension[] {
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
    syntaxHighlighting(byteLandHighlight),
    errorLineField,
    byteLandTheme,
    keymap.of([
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
  highlightedLines = [],
  readOnly = false,
  minHeight = '320px',
  ariaLabel = 'Vùng viết code C++',
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Khởi tạo editor một lần
  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: buildExtensions(readOnly, (next) => onChangeRef.current(next)),
      }),
      parent: hostRef.current,
    });

    viewRef.current = view;
    return () => {
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

  // Cập nhật dòng được làm nổi bật
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLines.of(highlightedLines) });
  }, [highlightedLines]);

  return (
    <div
      ref={hostRef}
      role="group"
      aria-label={ariaLabel}
      className="cq-editor overflow-hidden rounded-xl border border-abyss-600"
      style={{ minHeight }}
    />
  );
}
