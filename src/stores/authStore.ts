import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import { fetchProfile, touchActivity } from '@/services/supabase/profiles.repo';
import * as authService from '@/services/supabase/auth.service';
import { isSupabaseConfigured } from '@/lib/env';
import type { ProfileRow } from '@/types/database';
import { flushQueue } from '@/services/offlineQueue';

export type AuthStatus =
  | 'initializing' // đang khôi phục phiên đăng nhập
  | 'authenticated'
  | 'unauthenticated'
  | 'not_configured'; // chưa cấu hình Supabase -> chỉ chạy chế độ Demo

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  /** Lỗi khi tải hồ sơ (khác với lỗi đăng nhập) */
  profileError: string | null;

  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: ProfileRow) => void;
  signOut: () => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'initializing',
  session: null,
  user: null,
  profile: null,
  profileError: null,

  /**
   * Khôi phục phiên đăng nhập và lắng nghe thay đổi trạng thái xác thực.
   * Gọi một lần khi ứng dụng khởi động.
   */
  initialize: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ status: 'not_configured', session: null, user: null, profile: null });
      return;
    }

    // Dọn listener cũ (quan trọng khi Hot Module Replacement chạy lại file này)
    unsubscribe?.();

    const applySession = async (session: Session | null) => {
      if (!session) {
        set({ status: 'unauthenticated', session: null, user: null, profile: null });
        return;
      }

      set({ status: 'authenticated', session, user: session.user });

      // App đăng ký các handler hàng đợi trước khi khôi phục Auth. Một lượt
      // flush sớm có thể phải chờ session; chạy lại ngay tại mốc này để kết quả
      // học offline được ghi lên server trước khi học sinh mở màn tiếp theo.
      void flushQueue();

      try {
        const profile = await fetchProfile(session.user.id);
        set({ profile, profileError: null });

        if (profile) {
          const updated = await touchActivity(profile);
          if (updated) set({ profile: updated });
        }
      } catch (error) {
        set({
          profileError:
            error instanceof Error ? error.message : 'Không tải được hồ sơ của em.',
        });
      }
    };

    const { data } = await supabase.auth.getSession();
    await applySession(data.session);

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Bỏ qua TOKEN_REFRESHED để không tải lại hồ sơ mỗi lần làm mới token
      if (event === 'TOKEN_REFRESHED') {
        set({ session, user: session?.user ?? null });
        return;
      }
      void applySession(session);
    });

    unsubscribe = () => listener.subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await fetchProfile(user.id);
      set({ profile, profileError: null });
    } catch (error) {
      set({
        profileError: error instanceof Error ? error.message : 'Không tải được hồ sơ của em.',
      });
    }
  },

  setProfile: (profile) => set({ profile, profileError: null }),

  signOut: async () => {
    await authService.signOut();
    set({ status: 'unauthenticated', session: null, user: null, profile: null });
  },
}));

/** Tiện ích: người dùng hiện tại có phải giáo viên không. */
export function useIsTeacher(): boolean {
  return useAuthStore((state) => state.profile?.role === 'teacher');
}
