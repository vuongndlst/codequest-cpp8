import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lock, LockOpen, UserPlus, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader, StatTile } from '@/components/ui/Card';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { JoinCodePanel } from '@/components/teacher/JoinCodePanel';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import {
  addTeacherToClass,
  fetchClassById,
  fetchClassMembers,
  fetchClassTeachers,
  fetchTeacherProfiles,
  removeStudentFromClass,
  removeTeacherFromClass,
  setClassOpen,
  updateClass,
  validateNewClassName,
  type ClassRow,
  type ClassTeacherRow,
  type TeacherProfile,
} from '@/services/supabase/classes.repo';
import { fetchStudents, type StudentProfile } from '@/services/supabase/teacher.repo';
import { formatRelativeTime } from '@/utils/format';

/** Trang quản lý một lớp: mã lớp, giáo viên cùng dạy, danh sách học sinh. */
export function TeacherClassDetailPage() {
  const { classId = '' } = useParams();
  const myId = useAuthStore((state) => state.profile?.id);

  const [classRow, setClassRow] = useState<ClassRow | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherRow[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherProfile[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  const [teacherToAdd, setTeacherToAdd] = useState('');
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [row, members, teachers, teacherProfiles, students] = await Promise.all([
        fetchClassById(classId),
        fetchClassMembers(classId),
        fetchClassTeachers(classId),
        fetchTeacherProfiles(),
        fetchStudents(),
      ]);

      setClassRow(row);
      setMemberIds(members.map((member) => member.student_id));
      setClassTeachers(teachers);
      setAllTeachers(teacherProfiles);
      setAllStudents(students);
      setNameDraft(row?.name ?? '');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được thông tin lớp.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải lại khi thầy cô chuyển sang lớp khác qua thanh địa chỉ
  useEffect(() => {
    void load();
  }, [classId]);

  const teacherById = useMemo(
    () => new Map(allTeachers.map((teacher) => [teacher.id, teacher])),
    [allTeachers],
  );

  const students = useMemo(() => {
    const inClass = new Set(memberIds);
    return allStudents.filter((student) => inClass.has(student.id));
  }, [allStudents, memberIds]);

  /** Giáo viên chưa dạy lớp này — nguồn cho ô chọn thêm người cùng dạy. */
  const addableTeachers = useMemo(() => {
    const already = new Set(classTeachers.map((row) => row.teacher_id));
    return allTeachers.filter((teacher) => !already.has(teacher.id));
  }, [allTeachers, classTeachers]);

  if (isLoading) return <LoadingState label="Đang tải thông tin lớp…" />;
  if (loadError) return <ErrorState description={loadError} onRetry={() => void load()} />;

  if (!classRow) {
    return (
      <ErrorState
        title="Không tìm thấy lớp này"
        description="Có thể lớp đã bị xoá, hoặc thầy cô không phụ trách lớp này."
      />
    );
  }

  const runAction = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Thao tác chưa thực hiện được.');
    }
  };

  const handleToggleOpen = () =>
    runAction(async () => {
      const next = !classRow.is_open;
      await setClassOpen(classRow.id, next);
      setClassRow({ ...classRow, is_open: next });
    });

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    const error = validateNewClassName(nameDraft);
    if (error) {
      setNameError(error);
      return;
    }

    setNameError(null);
    setIsSavingName(true);
    await runAction(async () => {
      await updateClass(classRow.id, { name: nameDraft });
      setClassRow({ ...classRow, name: nameDraft.trim() });
      setIsRenaming(false);
    });
    setIsSavingName(false);
  };

  const handleAddTeacher = async (event: FormEvent) => {
    event.preventDefault();
    if (!teacherToAdd) return;

    setIsAddingTeacher(true);
    await runAction(async () => {
      await addTeacherToClass(classRow.id, teacherToAdd);
      setTeacherToAdd('');
      const refreshed = await fetchClassTeachers(classRow.id);
      setClassTeachers(refreshed);
    });
    setIsAddingTeacher(false);
  };

  const handleRemoveTeacher = (teacherId: string) =>
    runAction(async () => {
      await removeTeacherFromClass(classRow.id, teacherId);
      setClassTeachers((current) => current.filter((row) => row.teacher_id !== teacherId));
    });

  const handleRemoveStudent = (studentId: string) =>
    runAction(async () => {
      await removeStudentFromClass(classRow.id, studentId);
      setMemberIds((current) => current.filter((id) => id !== studentId));
    });

  return (
    <div className="space-y-5">
      <Link
        to="/teacher/classes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Về danh sách lớp
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {isRenaming ? (
            <form onSubmit={handleRename} noValidate className="flex flex-wrap items-end gap-2">
              <Input
                label="Tên lớp"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                error={nameError}
                className="w-56"
                autoFocus
              />
              <Button type="submit" size="sm" isLoading={isSavingName} loadingLabel="Đang lưu">
                Lưu
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsRenaming(false);
                  setNameDraft(classRow.name);
                  setNameError(null);
                }}
              >
                Huỷ
              </Button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-100">{classRow.name}</h1>
                <span
                  className={
                    classRow.is_open
                      ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-verdant-500/15 text-verdant-400'
                      : 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-abyss-700 text-slate-400'
                  }
                >
                  {classRow.is_open ? (
                    <LockOpen className="size-3" aria-hidden="true" />
                  ) : (
                    <Lock className="size-3" aria-hidden="true" />
                  )}
                  {classRow.is_open ? 'Đang nhận học sinh' : 'Đã khoá'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {classRow.school_year && <>Năm học {classRow.school_year} · </>}
                {classRow.note ?? 'Chưa có ghi chú'}
              </p>
            </>
          )}
        </div>

        {!isRenaming && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRenaming(true)}>
              Đổi tên lớp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleToggleOpen()}
              leadingIcon={
                classRow.is_open ? (
                  <Lock className="size-4" aria-hidden="true" />
                ) : (
                  <LockOpen className="size-4" aria-hidden="true" />
                )
              }
            >
              {classRow.is_open ? 'Khoá lớp' : 'Mở lại lớp'}
            </Button>
          </div>
        )}
      </header>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatTile label="Học sinh" value={students.length} icon={<Users className="size-5" />} />
        <StatTile
          label="Giáo viên phụ trách"
          value={classTeachers.length}
          icon={<UserPlus className="size-5" />}
          tone="mage"
        />
        <StatTile
          label="Trạng thái"
          value={classRow.is_open ? 'Đang mở' : 'Đã khoá'}
          icon={classRow.is_open ? <LockOpen className="size-5" /> : <Lock className="size-5" />}
          tone={classRow.is_open ? 'verdant' : 'treasure'}
        />
      </section>

      {/* --- Mã lớp --- */}
      <Card as="section">
        <CardHeader
          title="Mã tham gia lớp"
          description="Đọc mã này cho cả lớp, hoặc gửi link mời qua Zalo"
        />
        <JoinCodePanel joinCode={classRow.join_code} />

        {!classRow.is_open && (
          <Alert tone="warning" className="mt-4">
            Lớp đang khoá nên mã này tạm thời không dùng được. Học sinh nhập vào sẽ nhận thông báo
            "Lớp này đã khoá".
          </Alert>
        )}
      </Card>

      {/* --- Giáo viên cùng dạy --- */}
      <Card as="section">
        <CardHeader
          title={`Giáo viên phụ trách (${classTeachers.length})`}
          description="Một lớp có thể có nhiều giáo viên cùng theo dõi"
        />

        <ul className="space-y-2 list-none mb-4">
          {classTeachers.map((row) => {
            const teacher = teacherById.get(row.teacher_id);
            const isMe = row.teacher_id === myId;
            const isOwner = row.role === 'owner';

            return (
              <li key={row.id} className="flex items-center gap-3 cq-panel p-3">
                <AvatarIcon avatarId={teacher?.avatar_id} size={36} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-100 truncate">
                      {teacher?.full_name ?? 'Giáo viên'}
                    </span>
                    {isOwner && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-treasure-400/15 text-treasure-300">
                        Chủ nhiệm
                      </span>
                    )}
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-abyss-700 text-slate-400">
                        Thầy cô
                      </span>
                    )}
                  </div>
                </div>

                {/*
                  Không gỡ được chính mình (RLS chặn) và không gỡ được chủ nhiệm —
                  lớp mất chủ nhiệm thì không còn ai chắc chắn quản lý được nữa.
                */}
                <ConfirmButton
                  label="Gỡ"
                  confirmLabel="Gỡ khỏi lớp?"
                  disabled={isMe || isOwner}
                  title={
                    isMe
                      ? 'Thầy cô không tự gỡ mình khỏi lớp được'
                      : isOwner
                        ? 'Chủ nhiệm lớp không gỡ được'
                        : undefined
                  }
                  onConfirm={() => handleRemoveTeacher(row.teacher_id)}
                />
              </li>
            );
          })}
        </ul>

        {addableTeachers.length > 0 ? (
          <form onSubmit={handleAddTeacher} className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5 min-w-56 flex-1">
              <label
                htmlFor="chon-giao-vien"
                className="block text-sm font-medium text-slate-200"
              >
                Thêm giáo viên cùng dạy
              </label>
              <select
                id="chon-giao-vien"
                value={teacherToAdd}
                onChange={(event) => setTeacherToAdd(event.target.value)}
                className="w-full h-11 rounded-xl bg-abyss-900 border border-abyss-600 focus:border-quest-500 text-slate-100 px-3.5 transition-colors"
              >
                <option value="">— Chọn giáo viên —</option>
                {addableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="secondary"
              disabled={!teacherToAdd}
              isLoading={isAddingTeacher}
              loadingLabel="Đang thêm"
              leadingIcon={<UserPlus className="size-4" aria-hidden="true" />}
            >
              Thêm
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            Mọi tài khoản giáo viên hiện có đều đã ở trong lớp này.
          </p>
        )}
      </Card>

      {/* --- Học sinh --- */}
      <Card as="section">
        <CardHeader
          title={`Học sinh trong lớp (${students.length})`}
          description="Bấm vào một em để xem chi tiết tiến trình"
        />

        {students.length === 0 ? (
          <EmptyState
            title="Lớp chưa có học sinh nào"
            description="Thầy cô gửi mã lớp ở trên cho các em. Khi em nhập mã, tên sẽ hiện ngay ở đây."
          />
        ) : (
          <ul className="space-y-2 list-none">
            {students.map((student) => (
              <li key={student.id} className="flex items-center gap-3 cq-panel p-3">
                <AvatarIcon avatarId={student.avatar_id} size={40} />

                <Link
                  to={`/teacher/students/${student.id}`}
                  className="min-w-0 flex-1 group"
                >
                  <span className="font-semibold text-slate-100 truncate group-hover:text-quest-300 transition-colors">
                    {student.full_name}
                  </span>
                  <p className="text-xs text-slate-500">
                    Lv{student.level} · {student.total_xp} XP
                    {student.student_code && <> · {student.student_code}</>}
                    {' · '}
                    {student.last_active_date
                      ? formatRelativeTime(student.last_active_date)
                      : 'Chưa học'}
                  </p>
                </Link>

                <Link
                  to={`/teacher/students/${student.id}`}
                  className="hidden sm:grid place-items-center size-8 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-abyss-700"
                  aria-label={`Xem chi tiết ${student.full_name}`}
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>

                <ConfirmButton
                  label="Gỡ khỏi lớp"
                  confirmLabel="Chắc chưa?"
                  onConfirm={() => handleRemoveStudent(student.id)}
                />
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Gỡ học sinh khỏi lớp chỉ xoá em khỏi danh sách lớp này. Tài khoản, tiến trình, XP và
          chứng chỉ của em vẫn còn nguyên — em chỉ cần nhập lại mã lớp đúng là vào được.
        </p>
      </Card>
    </div>
  );
}
