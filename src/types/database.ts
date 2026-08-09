/**
 * Kieu du lieu cho schema Supabase.
 *
 * File nay duoc viet tay de khop 1-1 voi `supabase/migrations/0001_init.sql`.
 * Khi doi schema: sua SQL truoc, roi cap nhat file nay.
 *
 * Co the thay bang file sinh tu dong:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type UserRole = 'student' | 'teacher';
export type LessonStatus = 'locked' | 'in_progress' | 'completed';

export type ActivityEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'challenge_started'
  | 'challenge_passed'
  | 'challenge_attempted'
  | 'hint_used'
  | 'badge_earned'
  | 'certificate_issued'
  | 'boss_defeated'
  | 'clean_code_checked'
  | 'reported_issue';

export interface ProfileRow {
  id: string;
  full_name: string;
  class_name: string | null;
  student_code: string | null;
  avatar_id: string;
  role: UserRole;
  total_xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  status: LessonStatus;
  progress_percent: number;
  stars: number;
  xp: number;
  completed_challenges: string[];
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface ChallengeAttemptRow {
  id: string;
  user_id: string;
  lesson_id: string;
  challenge_id: string;
  submitted_code: string;
  is_correct: boolean;
  passed_tests: number;
  total_tests: number;
  error_types: string[];
  hint_level_used: number;
  attempt_number: number;
  clean_code_score: number | null;
  created_at: string;
}

export interface CertificateRow {
  id: string;
  user_id: string;
  lesson_id: string;
  certificate_code: string;
  issued_at: string;
  xp_at_issue: number;
  stars_at_issue: number;
  metadata: CertificateMetadata;
}

export interface CertificateMetadata {
  studentName: string;
  className: string | null;
  lessonTitle: string;
  certificateName: string;
  teacherName: string;
  courseName: string;
}

export interface BadgeRow {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
  sort_order: number;
}

export interface UserBadgeRow {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface ExitTicketRow {
  id: string;
  user_id: string;
  lesson_id: string;
  answers: Record<string, string | number>;
  score: number;
  reflection: string | null;
  submitted_at: string;
}

export interface ActivityEventRow {
  id: string;
  user_id: string;
  event_type: ActivityEventType;
  lesson_id: string | null;
  challenge_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ClassSettingsRow {
  id: string;
  class_name: string;
  unlocked_lessons: string[];
  allow_solution_view: boolean;
  updated_by: string | null;
  updated_at: string;
}

/** Cac cot duoc phep cap nhat tu client khi sua ho so. `role` KHONG nam trong danh sach. */
export type ProfileUpdate = Partial<
  Pick<ProfileRow, 'full_name' | 'class_name' | 'student_code' | 'avatar_id'>
>;
