import { useEffect, useMemo, useState } from 'react';
import { Check, Gem, LockKeyhole, ShieldCheck, Sparkles, Sword } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  equipItem,
  fetchEquipmentCatalog,
  fetchUserEquipment,
  purchaseOrUpgradeEquipment,
} from '@/services/supabase/equipment.repo';
import type { EquipmentCatalogRow, UserEquipmentRow } from '@/types/database';
import { equipmentDesign, lessonOrderFromId } from '@/data/equipment';
import { TileSprite } from '@/components/game/TileSprite';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/common/StateViews';
import { cn } from '@/utils/cn';
import { playSound } from '@/services/audio';
import { fetchAllLessonProgress } from '@/services/supabase/progress.repo';

export function ShopPage() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [catalog, setCatalog] = useState<EquipmentCatalogRow[]>([]);
  const [owned, setOwned] = useState<UserEquipmentRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [startedLessons, setStartedLessons] = useState<string[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [items, equipment, progress] = await Promise.all([
        fetchEquipmentCatalog(),
        fetchUserEquipment(user.id),
        fetchAllLessonProgress(user.id),
      ]);
      setCatalog(items);
      setOwned(equipment);
      setStartedLessons(progress.filter((row) => row.status !== 'locked').map((row) => row.lesson_id));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Chưa tải được kho trang bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.id]);

  const highestStartedOrder = useMemo(
    () => Math.max(0, ...startedLessons.map(lessonOrderFromId)),
    [startedLessons],
  );

  const buyOrUpgrade = async (equipmentId: string) => {
    setBusyId(equipmentId);
    setError(null);
    try {
      await purchaseOrUpgradeEquipment(equipmentId);
      await Promise.all([load(), refreshProfile()]);
      playSound('gem');
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : 'Chưa mua được trang bị.');
    } finally {
      setBusyId(null);
    }
  };

  const equip = async (equipmentId: string) => {
    setBusyId(equipmentId);
    setError(null);
    try {
      await equipItem(equipmentId);
      await load();
      playSound('click');
    } catch (equipError) {
      setError(equipError instanceof Error ? equipError.message : 'Chưa trang bị được vật phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingState label="Đang mở Kho trang bị…" />;

  return (
    <div className="space-y-5">
      <section className="cq-card overflow-hidden border-treasure-400/35 bg-[radial-gradient(circle_at_15%_0%,rgba(250,204,21,.16),transparent_45%)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-treasure-400/15 text-treasure-300">
            <Sword className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-treasure-300">Kho trang bị ByteLand</p>
            <h1 className="text-2xl font-extrabold text-slate-100">Gem đổi thành hiệu ứng cho hành trình</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
              Trang bị làm phản hồi trên map rõ và thú vị hơn; không viết code hộ, không bỏ qua mục tiêu và không làm em mạnh hơn bạn khác.
            </p>
          </div>
          <div className="rounded-2xl border border-treasure-400/30 bg-abyss-950/75 px-4 py-3 text-center">
            <p className="inline-flex items-center gap-2 text-xl font-black text-treasure-200">
              <Gem className="size-5" aria-hidden="true" /> {profile?.gem_balance ?? 0}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gem đang có</p>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-verdant-400/25 bg-verdant-500/8 p-3 text-sm text-verdant-200">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p><strong>Luật công bằng:</strong> hoàn thành lần đầu nhận 3 Gem, Boss nhận 12 Gem. Làm lại để luyện tập nhưng không cộng lặp phần thưởng.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <ul className="grid list-none gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((item) => {
          const current = owned.find((row) => row.equipment_id === item.id);
          const design = equipmentDesign(item.id);
          const unlockOrder = lessonOrderFromId(item.unlock_lesson);
          const available = unlockOrder === 0 || unlockOrder <= highestStartedOrder || Boolean(current);
          const nextLevel = (current?.level ?? 0) + 1;
          const cost = item.base_cost * Math.max(1, nextLevel);
          const maxed = (current?.level ?? 0) >= item.max_level;

          return (
            <li key={item.id} className={cn('cq-card p-4', current?.equipped && 'border-verdant-400/55 ring-1 ring-verdant-400/20')}>
              <div className="flex items-start gap-3">
                <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-abyss-800">
                  <TileSprite index={design.tileIndex} sheet="dungeon" scale={2.5} title={item.name} />
                  {!available && <LockKeyhole className="absolute -bottom-1 -right-1 size-5 rounded-full bg-abyss-950 p-1 text-slate-500" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-bold text-slate-100">{item.name}</h2>
                    {current?.equipped && <span className="text-[10px] font-bold uppercase text-verdant-300">Đang dùng</span>}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  <p className="mt-2 text-[11px] font-semibold text-quest-300">Gắn với: {design.curriculum}</p>
                </div>
              </div>

              <ol className="mt-3 space-y-1.5 rounded-xl bg-abyss-950/55 p-3">
                {design.levels.map((benefit, index) => {
                  const reached = (current?.level ?? 0) >= index + 1;
                  return (
                    <li key={benefit} className={cn('flex gap-2 text-xs', reached ? 'text-verdant-200' : 'text-slate-500')}>
                      <span className="grid size-4 shrink-0 place-items-center rounded-full border border-current text-[9px]">{reached ? <Check className="size-2.5" /> : index + 1}</span>
                      {benefit}
                    </li>
                  );
                })}
              </ol>

              <div className="mt-3 flex flex-wrap gap-2">
                {!available ? (
                  <span className="rounded-lg bg-abyss-800 px-3 py-2 text-xs font-semibold text-slate-500">Học tới Khu vực {unlockOrder} để mở</span>
                ) : (
                  <>
                    {current && !current.equipped && <Button size="sm" variant="secondary" onClick={() => void equip(item.id)} disabled={busyId === item.id}>Trang bị</Button>}
                    {!maxed && (
                      <Button size="sm" variant="treasure" onClick={() => void buyOrUpgrade(item.id)} disabled={busyId === item.id || (profile?.gem_balance ?? 0) < cost}>
                        {busyId === item.id ? 'Đang xử lý…' : current ? `Nâng cấp · ${cost} Gem` : `Mua · ${cost} Gem`}
                      </Button>
                    )}
                    {maxed && <span className="inline-flex items-center gap-1 rounded-lg bg-mage-500/12 px-3 py-2 text-xs font-bold text-mage-200"><Sparkles className="size-3.5" /> Cấp tối đa</span>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
