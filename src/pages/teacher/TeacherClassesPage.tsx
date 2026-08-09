import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Card, CardHeader } from '@/components/ui/Card';
import { JoinCodePanel } from '@/components/teacher/JoinCodePanel';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import {
  createClass,
  fetchAllClassMembers,
  fetchMyClasses,
  validateClassNote,
  validateNewClassName,
  validateSchoolYear,
  type ClassMemberRow,
  type ClassRow,
} from '@/services/supabase/classes.repo';

type CreateField = 'name' | 'schoolYear' | 'note';

/**
 * Danh sách lớp của giáo viên, kèm form tạo lớp mới.
 *
 * Trước đây "lớp" chỉ là ô chữ tự do trong hồ sơ học sinh: em gõ "8A1", em gõ
 * "8a1", em gõ "8 A1" là thành ba lớp khác nhau và thầy cô không có cách nào
 * biết em nào thật sự thuộc lớp mình. Nay lớp là một thực thể có mã, và mã đó
 * là thứ duy nhất quyết định em thuộc về đâu.
 */
export function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [members, setMembers] = useState<ClassMemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', schoolYear: '', note: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CreateField, string>>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [classRows, memberRows] = await Promise.all([fetchMyClasses(), fetchAllClassMembers()]);
      setClasses(classRows);
      setMembers(memberRows);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách lớp.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải một lần khi mở trang; sau đó danh sách được cập nhật tại chỗ
  useEffect(() => {
    void load();
  }, []);

  /** Đếm học sinh từng lớp — RLS đã lọc sẵn nên chỉ có lớp mình dạy. */
  const memberCountByClass = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members) {
      counts.set(member.class_id, (counts.get(member.class_id) ?? 0) + 1);
    }
    return counts;
  }, [members]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setCreateError(null);

    const errors: Partial<Record<CreateField, string>> = {};
    const nameError = validateNewClassName(form.name);
    const yearError = validateSchoolYear(form.schoolYear);
    const noteError = validateClassNote(form.note);

    if (nameError) errors.name = nameError;
    if (yearError) errors.schoolYear = yearError;
    if (noteError) errors.note = noteError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsCreating(true);

    try {
      const created = await createClass({
        name: form.name,
        schoolYear: form.schoolYear || undefined,
        note: form.note || undefined,
      });

      setClasses((current) => [created, ...current]);
      setJustCreatedId(created.id);
      setForm({ name: '', schoolYear: '', note: '' });
      setIsFormOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không tạo được lớp.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <LoadingState label="Đang tải danh sách lớp…" />;
  if (loadError) return <ErrorState description={loadError} onRetry={() => void load()} />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Lớp của tôi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Mỗi lớp có một mã riêng. Học sinh nhập mã đó là vào đúng lớp, thầy cô không phải xếp
            tay.
          </p>
        </div>

        <Button
          onClick={() => setIsFormOpen((open) => !open)}
          leadingIcon={<Plus className="size-4" aria-hidden="true" />}
          aria-expanded={isFormOpen}
          aria-controls="form-tao-lop"
        >
          {isFormOpen ? 'Đóng form' : 'Tạo lớp mới'}
        </Button>
      </header>

      {isFormOpen && (
        <Card as="section">
          <CardHeader
            title="Tạo lớp mới"
            description="Mã lớp sẽ được sinh tự động, thầy cô không cần tự nghĩ"
          />

          <form id="form-tao-lop" onSubmit={handleCreate} noValidate className="space-y-4">
            {createError && <Alert tone="error">{createError}</Alert>}

            <Input
              label="Tên lớp"
              required
              value={form.name}
              onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
              error={fieldErrors.name}
              placeholder="8A1"
              hint="Tên này hiện trong bảng theo dõi và trên chứng chỉ của học sinh"
              autoFocus
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Năm học"
                value={form.schoolYear}
                onChange={(event) => setForm((c) => ({ ...c, schoolYear: event.target.value }))}
                error={fieldErrors.schoolYear}
                placeholder="2025-2026"
                hint="Không bắt buộc"
              />
              <Input
                label="Ghi chú"
                value={form.note}
                onChange={(event) => setForm((c) => ({ ...c, note: event.target.value }))}
                error={fieldErrors.note}
                placeholder="Lớp học chiều thứ 3"
                hint="Không bắt buộc"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" isLoading={isCreating} loadingLabel="Đang tạo lớp">
                Tạo lớp
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Huỷ
              </Button>
            </div>
          </form>
        </Card>
      )}

      {classes.length === 0 ? (
        <EmptyState
          title="Thầy cô chưa có lớp nào"
          description="Tạo lớp đầu tiên, rồi gửi mã lớp cho học sinh. Các em nhập mã là vào đúng lớp ngay."
        />
      ) : (
        <ul className="space-y-3 list-none">
          {classes.map((classRow) => {
            const studentCount = memberCountByClass.get(classRow.id) ?? 0;
            const isNew = classRow.id === justCreatedId;

            return (
              <li key={classRow.id}>
                <Card
                  className={isNew ? 'border-verdant-500/60' : undefined}
                  as="article"
                >
                  {isNew && (
                    <Alert tone="success" className="mb-4">
                      Đã tạo lớp <strong>{classRow.name}</strong>. Thầy cô gửi mã bên dưới cho học
                      sinh nhé.
                    </Alert>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-100">{classRow.name}</h2>
                        {!classRow.is_open && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-abyss-700 text-slate-400">
                            <Lock className="size-3" aria-hidden="true" />
                            Đã khoá
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {classRow.school_year && <>Năm học {classRow.school_year} · </>}
                        {studentCount} học sinh
                        {classRow.note && <> · {classRow.note}</>}
                      </p>
                    </div>

                    <Link to={`/teacher/classes/${classRow.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        trailingIcon={<ChevronRight className="size-4" aria-hidden="true" />}
                      >
                        Quản lý lớp
                      </Button>
                    </Link>
                  </div>

                  <JoinCodePanel joinCode={classRow.join_code} size="compact" />
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Alert tone="tip">
        Lớp bị khoá thì học sinh mới không nhập mã vào được nữa, nhưng các em đã ở trong lớp vẫn
        học bình thường. Thầy cô khoá lớp sau khi đã điểm danh đủ để tránh em lớp khác vào nhầm.
      </Alert>

      <p className="text-xs text-slate-500">
        Một học sinh chỉ thuộc một lớp. Em nào nhập mã lớp mới sẽ tự động chuyển sang lớp đó, toàn
        bộ tiến trình và chứng chỉ vẫn giữ nguyên.
      </p>
    </div>
  );
}
