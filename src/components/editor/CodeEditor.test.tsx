import { act, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CodeEditor, type CodeEditorHandle } from './CodeEditor';

describe('CodeEditor ở màn luyện tập', () => {
  it('hiển thị toán tử C++ bằng từng ký tự ASCII, không ghép ligature', () => {
    const { container } = render(
      <CodeEditor value={'if (energy >= 8 && energy != 10) {\n    openDoor();\n}'} onChange={vi.fn()} />,
    );
    const editable = container.querySelector('.cm-content');

    expect(editable).not.toBeNull();
    expect(editable).toHaveTextContent('energy >= 8 && energy != 10');
    expect(getComputedStyle(editable!).fontVariantLigatures).toBe('none');
    expect(getComputedStyle(editable!).fontFeatureSettings).toContain('liga');
  });

  it('chặn sao chép code và giải thích bằng lời khuyến khích', () => {
    const { container } = render(
      <CodeEditor value={'int main() {\n    return 0;\n}'} onChange={vi.fn()} />,
    );
    const editable = container.querySelector('.cm-content');
    expect(editable).not.toBeNull();

    const event = createEvent.copy(editable!);
    fireEvent(editable!, event);

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('không cho sao chép code');
  });

  it('chặn dán đáp án vào editor và không làm thay đổi tài liệu', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CodeEditor value={'int main() {\n    return 0;\n}'} onChange={onChange} />,
    );
    const editable = container.querySelector('.cm-content');

    fireEvent.paste(editable!, {
      clipboardData: { getData: () => 'moveRight();' },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('không nhận code dán vào');
  });

  it('nhắc cú pháp ngay cạnh con trỏ sau khi em tự gõ, nhưng không có nút chèn code', () => {
    const handleRef = createRef<CodeEditorHandle>();
    render(
      <CodeEditor
        handleRef={handleRef}
        value=""
        onChange={vi.fn()}
        commands={[{ label: 'moveRight();', snippet: 'moveRight();', hint: 'Game API: đưa Byte sang phải một ô' }]}
      />,
    );

    act(() => handleRef.current?.insert('mo'));

    expect(screen.getByRole('tooltip', { name: 'Nhắc cú pháp theo nội dung em đang gõ' })).toHaveTextContent('moveRight();');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Tiếp tục tự gõ');
    expect(screen.queryByRole('button', { name: /moveRight/i })).not.toBeInTheDocument();
  });
});
