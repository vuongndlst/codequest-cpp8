import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CircleUserRound,
  Music2,
  LockKeyhole,
  Settings,
  Sparkles,
  Sword,
  UserRoundCog,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AVATARS, getAvatar } from '@/data/avatars';
import { AvatarIcon } from '@/components/game/AvatarIcon';
import { TileSprite } from '@/components/game/TileSprite';
import { TILE } from '@/components/game/mapTiles';
import { playSound } from '@/services/audio';
import { cn } from '@/utils/cn';
import type { EquipmentCatalogRow, UserEquipmentRow } from '@/types/database';
import { equipmentDesign, lessonOrderFromId } from '@/data/equipment';

type MapMenuTab = 'character' | 'account' | 'equipment';

export interface MapAccountSummary {
  name: string;
  className?: string | null;
  studentCode?: string | null;
  level: number;
  totalXp: number;
  gems?: number;
  isGuest?: boolean;
}

interface MapSettingsMenuProps {
  avatarId: string;
  account: MapAccountSummary;
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled?: boolean;
  onToggleMusic?: () => void;
  onAvatarChange: (avatarId: string) => void | Promise<void>;
  accountHref: string;
  accountActionLabel: string;
  /** Màn nhập môn chỉ hiện một bánh răng, tránh cạnh tranh với mục tiêu học. */
  compact?: boolean;
  /** Ẩn hệ trang bị khi bài học chưa giới thiệu khái niệm tương ứng. */
  showEquipment?: boolean;
  /** Chế độ sandbox cho phép xem trước toàn bộ trang bị mà không ghi dữ liệu thật. */
  allEquipmentUnlocked?: boolean;
  equipmentCatalog?: EquipmentCatalogRow[];
  userEquipment?: UserEquipmentRow[];
  equipmentBusyId?: string | null;
  equipmentError?: string | null;
  currentLessonOrder?: number;
  onBuyOrUpgrade?: (equipmentId: string) => void | Promise<void>;
  onEquip?: (equipmentId: string) => void | Promise<void>;
}

const TABS: Array<{
  id: MapMenuTab;
  label: string;
  icon: typeof UserRoundCog;
}> = [
  { id: 'character', label: 'Nhân vật', icon: UserRoundCog },
  { id: 'account', label: 'Hồ sơ', icon: CircleUserRound },
  { id: 'equipment', label: 'Trang bị', icon: Sword },
];

const EQUIPMENT_ROADMAP = [
  {
    id: 'navigator',
    name: 'Bộ điều hướng',
    description: 'Giúp Byte nhận lệnh di chuyển trên bản đồ.',
    status: 'Đang dùng',
    tileIndex: TILE.key.index,
    unlocked: true,
    upgradeCost: 30,
  },
  {
    id: 'algorithm-sword',
    name: 'Kiếm thuật toán',
    description: 'Mở thao tác attack() khi gặp bot cản đường.',
    status: 'Mở ở chặng chiến đấu',
    tileIndex: TILE.sword.index,
    unlocked: false,
    upgradeCost: 45,
  },
  {
    id: 'condition-shield',
    name: 'Khiên điều kiện',
    description: 'Giúp chọn hành động bằng if / else.',
    status: 'Mở ở chặng điều kiện',
    tileIndex: TILE.shield.index,
    unlocked: false,
    upgradeCost: 45,
  },
  {
    id: 'function-toolkit',
    name: 'Bộ dụng cụ Xưởng Hàm',
    description: 'Làm nổi lời gọi hàm và dữ liệu tham số.',
    status: 'Mở ở khu vực 6', tileIndex: TILE.machine.index, unlocked: false, upgradeCost: 48,
  },
  {
    id: 'mirror-compass',
    name: 'La bàn Phòng Gương',
    description: 'Theo dõi tham trị, tham chiếu và ô nhớ.',
    status: 'Mở ở khu vực 7', tileIndex: TILE.key.index, unlocked: false, upgradeCost: 55,
  },
  {
    id: 'index-bracer',
    name: 'Găng Chỉ Số',
    description: 'Làm nổi phần tử và miền chỉ số hợp lệ.',
    status: 'Mở ở khu vực 8', tileIndex: TILE.shield.index, unlocked: false, upgradeCost: 62,
  },
  {
    id: 'scanner-lens',
    name: 'Kính Quét Tuyến Tính',
    description: 'Đánh dấu phần mảng đã được thuật toán duyệt.',
    status: 'Mở ở khu vực 9', tileIndex: TILE.gem.index, unlocked: false, upgradeCost: 68,
  },
  {
    id: 'algorithm-core',
    name: 'Lõi Kiến Trúc Thuật Toán',
    description: 'Hiện cặp so sánh và bất biến của sắp xếp.',
    status: 'Mở ở khu vực 10', tileIndex: TILE.machine.index, unlocked: false, upgradeCost: 75,
  },
] as const;

/**
 * Menu phụ của sân chơi. Mặc định đóng để bản đồ luôn là tâm điểm; mọi thay đổi
 * nhân vật, âm thanh và hồ sơ đều diễn ra trong một popup duy nhất trên map.
 */
export function MapSettingsMenu({
  avatarId,
  account,
  soundEnabled,
  onToggleSound,
  musicEnabled = false,
  onToggleMusic = () => undefined,
  onAvatarChange,
  accountHref,
  accountActionLabel,
  compact = false,
  showEquipment = true,
  allEquipmentUnlocked = false,
  equipmentCatalog = [],
  userEquipment = [],
  equipmentBusyId = null,
  equipmentError = null,
  currentLessonOrder = 1,
  onBuyOrUpgrade,
  onEquip,
}: MapSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MapMenuTab>('character');
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [demoGemBalance, setDemoGemBalance] = useState(account.gems ?? 0);
  const [equipmentLevels, setEquipmentLevels] = useState<Record<string, number>>({ navigator: 1 });
  const [equippedItemId, setEquippedItemId] = useState('navigator');
  const menuRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const avatar = getAvatar(avatarId);
  const visibleTabs = showEquipment ? TABS : TABS.filter((tab) => tab.id !== 'equipment');
  const hasPersistentEquipment = equipmentCatalog.length > 0;
  const equipmentItems = hasPersistentEquipment
    ? equipmentCatalog.map((catalogItem) => {
        const owned = userEquipment.find((item) => item.equipment_id === catalogItem.id);
        const unlockOrder = lessonOrderFromId(catalogItem.unlock_lesson);
        const design = equipmentDesign(catalogItem.id);
        return {
          ...catalogItem,
          tileIndex: design.tileIndex,
          unlocked: Boolean(owned),
          available: currentLessonOrder >= unlockOrder,
          level: owned?.level ?? 0,
          equipped: owned?.equipped ?? false,
          upgradeCost: catalogItem.base_cost * Math.max(1, (owned?.level ?? 0) + 1),
          status: owned
            ? owned.equipped
              ? 'Đang trang bị'
              : `Đã sở hữu · Cấp ${owned.level}`
            : currentLessonOrder >= unlockOrder
              ? 'Đã mở khoá · Có thể mua bằng Gem'
              : `Mở ở khu vực ${unlockOrder}`,
        };
      })
    : EQUIPMENT_ROADMAP.map((item) => ({
        ...item,
        available: item.unlocked || allEquipmentUnlocked,
        level: equipmentLevels[item.id] ?? (item.unlocked ? 1 : 0),
        equipped: equippedItemId === item.id,
        max_level: 3,
      }));

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        openerRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href], select:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    menuRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (typeof account.gems === 'number') setDemoGemBalance(account.gems);
  }, [account.gems]);

  const chooseAvatar = async (nextAvatarId: string) => {
    if (nextAvatarId === avatarId || savingAvatarId) return;
    playSound('click');
    setAvatarError(null);
    setSavingAvatarId(nextAvatarId);
    try {
      await onAvatarChange(nextAvatarId);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Chưa đổi được nhân vật. Em thử lại nhé.');
    } finally {
      setSavingAvatarId(null);
    }
  };

  const toggleMenu = () => {
    playSound('click');
    setOpen((value) => !value);
  };

  const closeMenu = () => {
    setOpen(false);
    openerRef.current?.focus();
  };

  const selectTab = (tab: MapMenuTab) => {
    playSound('click');
    setActiveTab(tab);
  };

  const toggleSound = () => {
    if (soundEnabled) playSound('click');
    onToggleSound();
    if (!soundEnabled) window.setTimeout(() => playSound('click'), 0);
  };

  const toggleMusic = () => {
    playSound('click');
    onToggleMusic();
  };

  return (
    <>
      <div className="absolute right-2 top-2 z-40 sm:right-3 sm:top-3">
        <div className="ml-auto flex w-fit items-center gap-1.5 rounded-2xl border border-white/15 bg-abyss-950/90 p-1.5 shadow-xl shadow-black/35 backdrop-blur-md">
        <button
          ref={openerRef}
          type="button"
          onClick={toggleMenu}
          aria-expanded={open}
          aria-controls="map-settings-panel"
          aria-label="Mở cài đặt trên bản đồ"
          className={cn(
            'group relative flex items-center gap-2 rounded-xl text-left transition-colors',
            compact ? 'grid size-9 place-items-center p-0' : 'px-1.5 py-1',
            open ? 'bg-quest-500/18 text-quest-300' : 'hover:bg-white/10',
          )}
          title="Tùy chỉnh bản đồ"
        >
          {!compact && <AvatarIcon avatarId={avatarId} size={34} />}
          {!compact && (
            <span className="hidden max-w-28 sm:block">
              <span className="block truncate text-[11px] font-bold text-slate-100">{avatar.name}</span>
              <span className="block text-[9px] text-slate-400">Tùy chỉnh</span>
            </span>
          )}
          <Settings className={cn('text-slate-400 group-hover:text-quest-300', compact ? 'size-4.5' : 'size-3.5')} aria-hidden="true" />
          <span className="sr-only">Mở cài đặt trên bản đồ</span>
        </button>

          {!compact && <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundEnabled}
          aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          className={cn(
            'grid size-9 place-items-center rounded-xl transition-colors',
            soundEnabled
              ? 'bg-verdant-500/12 text-verdant-300 hover:bg-verdant-500/20'
              : 'text-slate-500 hover:bg-white/10 hover:text-slate-300',
          )}
        >
          {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>}
        </div>
      </div>

      {open && (
        <div
          data-testid="map-settings-backdrop"
          className="absolute inset-0 z-50 flex items-center justify-center bg-[#020817]/72 p-3 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenu();
          }}
        >
          <section
            ref={menuRef}
            id="map-settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-settings-title"
            className="flex max-h-[calc(100%-1rem)] w-[min(56rem,calc(100%-1rem))] flex-col overflow-hidden rounded-3xl border border-quest-300/35 bg-abyss-950 shadow-[0_24px_80px_rgba(0,0,0,.65),0_0_36px_rgba(34,211,238,.16)]"
          >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-abyss-700 bg-gradient-to-r from-quest-500/14 via-abyss-900 to-mage-500/10 px-4 py-3.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-treasure-300/25 bg-treasure-500/10 text-treasure-300 shadow-inner">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 id="map-settings-title" className="text-base font-extrabold text-slate-100 sm:text-lg">Góc phiêu lưu</h3>
                <p className="text-xs text-slate-400">Nhân vật, âm thanh và trang bị của em</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleMusic}
                aria-pressed={musicEnabled}
                aria-label={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền khi dùng tai nghe'}
                title={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền khi dùng tai nghe'}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors',
                  musicEnabled
                    ? 'border-treasure-300/35 bg-treasure-500/12 text-treasure-200'
                    : 'border-abyss-600 bg-abyss-900 text-slate-400 hover:text-slate-200',
                )}
              >
                <Music2 className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Nhạc {musicEnabled ? 'bật' : 'tắt'}</span>
              </button>
              <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={soundEnabled}
                  aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors',
                    soundEnabled
                      ? 'border-verdant-400/30 bg-verdant-500/10 text-verdant-300'
                      : 'border-abyss-600 bg-abyss-900 text-slate-400',
                  )}
                >
                  {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                  <span className="hidden sm:inline">Âm thanh {soundEnabled ? 'bật' : 'tắt'}</span>
                </button>
              <button
                type="button"
                onClick={closeMenu}
                className="grid size-10 place-items-center rounded-xl border border-abyss-600 bg-abyss-900 text-slate-400 hover:border-abyss-500 hover:text-slate-100"
                aria-label="Đóng cài đặt bản đồ"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] sm:grid-cols-[11.5rem_minmax(0,1fr)] sm:grid-rows-1">
          <nav className="flex gap-1 overflow-x-auto border-b border-abyss-700 bg-abyss-900/75 p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3" aria-label="Các mục cài đặt" role="tablist">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  role="tab"
                  id={`map-settings-tab-${tab.id}`}
                  aria-controls={`map-settings-view-${tab.id}`}
                  aria-selected={selected}
                  className={cn(
                    'inline-flex h-11 min-w-28 items-center justify-start gap-2 rounded-xl px-3 text-sm font-bold transition-colors sm:w-full',
                    selected
                      ? 'bg-quest-500/18 text-quest-200 shadow-inner ring-1 ring-quest-300/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div
            id={`map-settings-view-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`map-settings-tab-${activeTab}`}
            className="min-h-0 overflow-y-auto bg-abyss-950/95 p-4 sm:p-5"
          >
            {activeTab === 'character' && (
              <div>
                {!musicEnabled && (
                  <p className="mb-4 rounded-xl border border-treasure-400/25 bg-treasure-500/8 px-3 py-2.5 text-xs text-treasure-200">
                    Có nhạc nền ByteLand — em chỉ nên bật khi đang dùng tai nghe.
                  </p>
                )}
                <p className="text-base font-extrabold text-slate-100">Chọn người đồng hành</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Nhân vật sẽ đổi ngay trên sân chơi; chương trình của em vẫn giữ nguyên.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 xs:grid-cols-4">
                  {AVATARS.map((item) => {
                    const selected = item.id === avatarId;
                    const saving = item.id === savingAvatarId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={Boolean(savingAvatarId)}
                        onClick={() => void chooseAvatar(item.id)}
                        aria-pressed={selected}
                        title={item.name}
                        className={cn(
                          'relative rounded-2xl border p-2.5 transition-all disabled:cursor-wait disabled:opacity-65',
                          selected
                            ? 'border-quest-400 bg-quest-500/15 shadow-[0_0_16px_rgba(34,211,238,0.14)]'
                            : 'border-abyss-700 bg-abyss-900/70 hover:-translate-y-0.5 hover:border-abyss-500',
                        )}
                      >
                        <AvatarIcon avatarId={item.id} size={52} className="mx-auto" />
                        <span className="mt-2 block truncate text-xs font-bold text-slate-200">
                          {saving ? 'Đang đổi…' : item.shortName}
                        </span>
                        {selected && (
                          <span className="absolute right-1 top-1 size-2 rounded-full bg-quest-300 ring-2 ring-abyss-950" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {avatarError && (
                  <p className="mt-3 text-sm text-danger-300" role="alert">{avatarError}</p>
                )}
                {account.isGuest && (
                  <p className="mt-3 rounded-xl bg-treasure-500/8 px-3 py-2.5 text-xs text-treasure-200">
                    Bản chơi thử chỉ nhớ lựa chọn trong lần mở trang này.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <div className="flex items-center gap-4 rounded-2xl border border-quest-400/20 bg-gradient-to-br from-quest-500/12 to-abyss-900 p-4 sm:p-5">
                  <AvatarIcon avatarId={avatarId} size={72} glow />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-extrabold text-slate-100">{account.name}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {account.isGuest
                        ? 'Hồ sơ khách'
                        : [account.className && `Lớp ${account.className}`, account.studentCode && `Mã ${account.studentCode}`]
                            .filter(Boolean)
                            .join(' · ') || 'Chưa tham gia lớp'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-abyss-700 bg-abyss-900/65 p-3">
                    <p className="text-xs font-semibold text-slate-500">Cấp độ</p>
                    <p className="mt-1 text-xl font-black text-quest-300">{account.level}</p>
                  </div>
                  <div className="rounded-2xl border border-abyss-700 bg-abyss-900/65 p-3">
                    <p className="text-xs font-semibold text-slate-500">Kinh nghiệm</p>
                    <p className="mt-1 text-xl font-black text-verdant-300">{account.totalXp} XP</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-treasure-400/20 bg-treasure-500/8 p-3 sm:col-span-1">
                    <p className="text-xs font-semibold text-slate-500">Kho báu</p>
                    <p className="mt-1 text-xl font-black text-treasure-200">{demoGemBalance} Gem</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  {account.isGuest
                    ? 'Tạo tài khoản để lưu XP, nhân vật và tiến trình học trên nhiều thiết bị.'
                    : 'Hồ sơ đầy đủ có huy hiệu, tiến trình cấp độ và thông tin lớp của em.'}
                </p>
                <Link
                  to={accountHref}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-quest-600 px-4 text-sm font-bold text-onaccent shadow-lg shadow-quest-600/20 hover:bg-quest-500"
                >
                  {accountActionLabel}
                </Link>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div>
                <div className="rounded-2xl border border-treasure-400/25 bg-treasure-500/8 p-4">
                  <p className="flex items-center gap-2 text-base font-extrabold text-treasure-200">
                    <Sparkles className="size-4" aria-hidden="true" />
                    Trang bị mở kỹ năng code
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    Em mở đồ mới bằng cách học thêm lệnh — không cần mua sức mạnh để vượt bài.
                  </p>
                </div>

                <ul className="mt-4 grid list-none grid-cols-1 gap-3 md:grid-cols-2">
                  {equipmentItems.map((item) => {
                    const unlocked = item.unlocked || allEquipmentUnlocked;
                    return (
                      <li
                        key={item.name}
                        className={cn(
                          'flex min-h-48 flex-col rounded-2xl border p-4',
                          unlocked
                            ? 'border-verdant-500/25 bg-verdant-500/8'
                            : 'border-abyss-700 bg-abyss-900/65',
                        )}
                      >
                        <span
                          role="img"
                          aria-label={`Vật phẩm ${item.name}`}
                          data-testid="equipment-pixel-art"
                          className={cn(
                          'relative grid size-14 shrink-0 place-items-center rounded-2xl',
                          unlocked ? 'bg-verdant-500/15 text-verdant-300' : 'bg-abyss-800 text-slate-500',
                        )}>
                          <TileSprite index={item.tileIndex} sheet="dungeon" scale={2} title={item.name} />
                          {!unlocked && (
                            <LockKeyhole className="absolute -bottom-1 -right-1 size-4 rounded-full bg-abyss-950 p-0.5 text-slate-500" aria-hidden="true" />
                          )}
                        </span>
                        <div className="mt-3 flex min-w-0 flex-1 flex-col">
                          <p className="text-sm font-extrabold text-slate-100">{item.name}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                          <p className="mt-2 text-xs leading-relaxed text-quest-300">
                            Hiệu ứng: {equipmentDesign(item.id).levels[Math.max(0, Math.min(2, item.level - 1))]}
                          </p>
                          <p className={cn(
                            'mt-2 text-[10px] font-bold uppercase tracking-wide',
                            unlocked ? 'text-verdant-300' : 'text-slate-600',
                          )}>
                            {allEquipmentUnlocked && !item.unlocked ? 'Mở trong Demo Sandbox' : item.status}
                          </p>
                          {allEquipmentUnlocked && !hasPersistentEquipment && (
                            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  setEquippedItemId(item.id);
                                  setEquipmentLevels((levels) => ({ ...levels, [item.id]: levels[item.id] ?? 1 }));
                                }}
                                className={cn(
                                  'rounded-lg px-3 py-2 text-xs font-bold',
                                  equippedItemId === item.id
                                    ? 'bg-verdant-500/18 text-verdant-200'
                                    : 'bg-quest-500/15 text-quest-200 hover:bg-quest-500/25',
                                )}
                              >
                                {equippedItemId === item.id ? 'Đang trang bị' : 'Trang bị'}
                              </button>
                              <button
                                type="button"
                                disabled={demoGemBalance < item.upgradeCost || (equipmentLevels[item.id] ?? 1) >= 3}
                                onClick={() => {
                                  playSound('gem');
                                  setDemoGemBalance((balance) => balance - item.upgradeCost);
                                  setEquipmentLevels((levels) => ({
                                    ...levels,
                                    [item.id]: Math.min(3, (levels[item.id] ?? 1) + 1),
                                  }));
                                }}
                                className="rounded-lg bg-treasure-500/12 px-3 py-2 text-xs font-bold text-treasure-200 hover:bg-treasure-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Cấp {equipmentLevels[item.id] ?? 1} · Nâng {item.upgradeCost} Gem
                              </button>
                            </div>
                          )}
                          {hasPersistentEquipment && item.available && (
                            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                              {item.unlocked && (
                                <button
                                  type="button"
                                  disabled={item.equipped || equipmentBusyId === item.id}
                                  onClick={() => void onEquip?.(item.id)}
                                  className={cn(
                                    'rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed',
                                    item.equipped
                                      ? 'bg-verdant-500/18 text-verdant-200'
                                      : 'bg-quest-500/15 text-quest-200 hover:bg-quest-500/25 disabled:opacity-50',
                                  )}
                                >
                                  {item.equipped ? 'Đang trang bị' : 'Trang bị'}
                                </button>
                              )}
                              {item.level < item.max_level && (
                                <button
                                  type="button"
                                  disabled={demoGemBalance < item.upgradeCost || equipmentBusyId === item.id}
                                  onClick={() => void onBuyOrUpgrade?.(item.id)}
                                  className="rounded-lg bg-treasure-500/12 px-3 py-2 text-xs font-bold text-treasure-200 hover:bg-treasure-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  {equipmentBusyId === item.id
                                    ? 'Đang xử lý…'
                                    : item.unlocked
                                      ? `Nâng cấp · ${item.upgradeCost} Gem`
                                      : `Mua · ${item.upgradeCost} Gem`}
                                </button>
                              )}
                              {item.level >= item.max_level && (
                                <span className="rounded-lg bg-mage-500/12 px-3 py-2 text-xs font-bold text-mage-200">Cấp tối đa</span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {!account.isGuest && (
                  <Link
                    to="/app/shop"
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-treasure-400/30 bg-treasure-500/10 px-4 text-sm font-bold text-treasure-200 hover:bg-treasure-500/18"
                  >
                    Mở Kho trang bị đầy đủ
                  </Link>
                )}
                {equipmentError && (
                  <p className="mt-3 rounded-xl border border-danger-400/20 bg-danger-500/8 px-3 py-2.5 text-xs text-danger-200" role="alert">
                    {equipmentError}
                  </p>
                )}
              </div>
            )}
          </div>
          </div>
          </section>
        </div>
      )}
    </>
  );
}
