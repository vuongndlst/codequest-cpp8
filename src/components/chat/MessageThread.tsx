import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { EmptyState } from '@/components/common/StateViews';
import { MAX_MESSAGE_LENGTH, validateMessage, type MessageRow } from '@/services/supabase/messages.repo';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MessageThreadProps {
  messages: MessageRow[];
  /** Vai trò của người đang xem — quyết định tin nào nằm bên phải */
  viewerRole: 'student' | 'teacher';
  onSend: (body: string) => Promise<void>;
  /** Chỉ giáo viên mới gỡ được tin nhắn */
  onDelete?: (messageId: string) => Promise<void>;
  isSending?: boolean;
  emptyHint: string;
  placeholder: string;
  disabled?: boolean;
}

export function MessageThread({
  messages,
  viewerRole,
  onSend,
  onDelete,
  isSending = false,
  emptyHint,
  placeholder,
  disabled = false,
}: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /*
    Cuộn xuống tin mới nhất — nhưng CHỈ KHI người dùng đang ở gần cuối.

    Nếu cuộn vô điều kiện thì thầy cô đang đọc lại một tin cũ ở giữa luồng sẽ
    bị giật xuống đáy mỗi lần có tin mới về.
  */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
    if (distanceFromBottom < 160) {
      endRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  const submit = async () => {
    const validationError = validateMessage(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const body = draft.trim();
    setDraft('');

    try {
      await onSend(body);
    } catch (sendError) {
      // Trả lại nội dung để người dùng không mất công gõ lại
      setDraft(body);
      setError(sendError instanceof Error ? sendError.message : 'Chưa gửi được tin nhắn.');
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter gửi, Shift+Enter xuống dòng — quen thuộc với mọi ứng dụng nhắn tin
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const remaining = MAX_MESSAGE_LENGTH - draft.trim().length;

  return (
    <div className="flex flex-col h-[min(60vh,520px)]">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Nội dung cuộc trò chuyện"
        className="flex-1 overflow-y-auto space-y-3 pr-1"
      >
        {messages.length === 0 ? (
          <EmptyState title="Chưa có tin nhắn nào" description={emptyHint} />
        ) : (
          messages.map((message) => {
            const isMine = message.sender_role === viewerRole;

            return (
              <div
                key={message.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div className={cn('max-w-[85%] sm:max-w-[75%] group', isMine && 'text-right')}>
                  {/*
                    Tên người gửi chỉ hiện ở tin của phía bên kia. Một lớp có
                    nhiều giáo viên, nên học sinh cần biết THẦY CÔ NÀO trả lời.
                  */}
                  {!isMine && (
                    <p className="text-xs font-semibold text-slate-400 mb-0.5 px-1">
                      {message.sender_name}
                      {message.sender_role === 'teacher' && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-mage-500/15 text-mage-300">
                          Giáo viên
                        </span>
                      )}
                    </p>
                  )}

                  <div
                    className={cn(
                      'inline-block rounded-2xl px-3.5 py-2 text-sm leading-relaxed text-left',
                      'whitespace-pre-wrap break-words',
                      isMine
                        ? 'bg-quest-500/15 border border-quest-500/40 text-slate-100'
                        : 'cq-panel',
                    )}
                  >
                    {message.body}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 px-1 flex items-center gap-2 justify-end">
                    {onDelete && (
                      <ConfirmButton
                        label="Gỡ"
                        confirmLabel="Gỡ tin này?"
                        size="sm"
                        onConfirm={() => onDelete(message.id)}
                      />
                    )}
                    <span>{formatRelativeTime(message.created_at)}</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 mt-3 border-t border-abyss-700 space-y-2">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="o-nhap-tin" className="sr-only">
              Nội dung tin nhắn
            </label>
            <textarea
              id="o-nhap-tin"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH + 200}
              className={cn(
                'w-full rounded-xl bg-abyss-900 border border-abyss-600 text-slate-100',
                'placeholder:text-slate-500 px-3.5 py-2.5 resize-none transition-colors',
                'focus:border-quest-500 disabled:opacity-50',
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || draft.trim().length === 0}
            isLoading={isSending}
            loadingLabel="Đang gửi"
            leadingIcon={<Send className="size-4" aria-hidden="true" />}
          >
            Gửi
          </Button>
        </div>

        <p className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Bấm Enter để gửi, Shift + Enter để xuống dòng.</span>
          {remaining < 200 && (
            <span className={cn(remaining < 0 && 'text-alert-400 font-semibold')}>
              Còn {remaining} ký tự
            </span>
          )}
        </p>
      </form>
    </div>
  );
}
