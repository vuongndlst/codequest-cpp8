import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDraft } from '@/services/supabase/drafts.repo';
import type { SaveState } from '@/components/common/StateViews';

/**
 * Tự động lưu code (mục 23 của đề bài).
 *
 * Kiến trúc hai tầng:
 *   · Tầng 1 — localStorage: ghi ngay khi hết debounce. KHÔNG BAO GIỜ mất code,
 *     kể cả khi mất mạng, sập nguồn máy hay đóng nhầm tab.
 *   · Tầng 2 — Supabase: ghi khi có mạng, một bản ghi cho mỗi challenge.
 *
 * KHÔNG tạo bản ghi database cho từng phím gõ. Chỉ ghi khi:
 *   code thay đổi và đã qua debounce · bấm Chạy · chuyển challenge · rời trang.
 */

const DEBOUNCE_MS = 1_500;

export function draftStorageKey(userId: string | null, challengeId: string): string {
  return `cq8:code:${userId ?? 'demo'}:${challengeId}`;
}

export interface LocalDraft {
  code: string;
  updatedAt: string;
}

export function readLocalDraft(userId: string | null, challengeId: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(draftStorageKey(userId, challengeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDraft;
    return typeof parsed.code === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLocalDraft(userId: string | null, challengeId: string, code: string): void {
  try {
    localStorage.setItem(
      draftStorageKey(userId, challengeId),
      JSON.stringify({ code, updatedAt: new Date().toISOString() } satisfies LocalDraft),
    );
  } catch {
    // localStorage đầy hoặc bị chặn — bỏ qua, tầng Supabase vẫn hoạt động
  }
}

interface UseAutoSaveOptions {
  userId: string | null;
  lessonId: string;
  challengeId: string;
  code: string;
  /** false ở chế độ Demo — chỉ lưu localStorage, không đụng database */
  enabled: boolean;
  /** Không ghi starter code trong lúc còn đang đọc bản nháp cũ. */
  suspended?: boolean;
}

export function useAutoSave({
  userId,
  lessonId,
  challengeId,
  code,
  enabled,
  suspended = false,
}: UseAutoSaveOptions) {
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(code);
  const codeRef = useRef(code);
  codeRef.current = code;

  const persist = useCallback(
    async (value: string) => {
      if (suspended) return;
      if (value === lastSavedRef.current) return;

      // Tầng 1 luôn chạy trước, và luôn thành công về mặt trải nghiệm
      writeLocalDraft(userId, challengeId, value);

      if (!enabled || !userId) {
        lastSavedRef.current = value;
        setSaveState('local_only');
        return;
      }

      setSaveState('saving');
      try {
        await saveDraft(userId, lessonId, challengeId, value);
        lastSavedRef.current = value;
        setSaveState('saved');
      } catch {
        // Code vẫn nằm an toàn trong localStorage -> báo trạng thái nhẹ nhàng
        lastSavedRef.current = value;
        setSaveState(navigator.onLine ? 'failed' : 'local_only');
      }
    },
    [userId, lessonId, challengeId, enabled, suspended],
  );

  /** Lưu ngay lập tức — dùng khi bấm Chạy, chuyển challenge, rời trang. */
  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await persist(codeRef.current);
  }, [persist]);

  // Debounce theo thay đổi của code
  useEffect(() => {
    if (suspended || code === lastSavedRef.current) return;

    setSaveState('editing');
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void persist(codeRef.current);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, persist, suspended]);

  // Rời trang / chuyển tab -> lưu nốt.
  // Chỉ kịp ghi localStorage một cách chắc chắn; ghi database là nỗ lực thêm.
  useEffect(() => {
    const handleLeave = () => {
      if (!suspended && codeRef.current !== lastSavedRef.current) {
        writeLocalDraft(userId, challengeId, codeRef.current);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') void flush();
    };

    window.addEventListener('beforeunload', handleLeave);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
      handleLeave();
    };
  }, [userId, challengeId, flush, suspended]);

  // Có mạng lại -> đồng bộ phần chưa kịp lưu
  useEffect(() => {
    const handleOnline = () => {
      if (!suspended && (codeRef.current !== lastSavedRef.current || saveState === 'local_only' || saveState === 'failed')) {
        lastSavedRef.current = '';
        void persist(codeRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [persist, saveState, suspended]);

  /** Gọi khi nạp code từ nguồn khác (bản nháp trên server, nút Đặt lại). */
  const markSaved = useCallback((value: string) => {
    lastSavedRef.current = value;
    setSaveState('saved');
  }, []);

  return { saveState, flush, markSaved };
}
