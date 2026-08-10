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
}: MapSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MapMenuTab>('character');
  const [savingAvatarId, setSavingAvatarId] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [demoGemBalance, setDemoGemBalance] = useState(account.gems ?? 0);
  const [equipmentLevels, setEquipmentLevels] = useState<Record<string, number>>({ navigator: 1 });
  const [equippedItemId, setEquippedItemId] = useState('navigator');
  const menuRef = useRef<HTMLDivElement>(null);
  const avatar = getAvatar(avatarId);
  const visibleTabs = showEquipment ? TABS : TABS.filter((tab) => tab.id !== 'equipment');

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

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
    <div ref={menuRef} className="absolute right-2 top-2 z-40 sm:right-3 sm:top-3">
      <div className="ml-auto flex w-fit items-center gap-1.5 rounded-2xl border border-white/15 bg-abyss-950/90 p-1.5 shadow-xl shadow-black/35 backdrop-blur-md">
        <button
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

      {open && (
        <section
          id="map-settings-panel"
          role="dialog"
          aria-label="Cài đặt bản đồ"
          className="mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-quest-400/25 bg-abyss-950/96 shadow-2xl shadow-black/55 backdrop-blur-xl"
        >
          <header className="flex items-center justify-between border-b border-abyss-700 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-treasure-300" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Góc phiêu lưu</h3>
                <p className="text-[10px] text-slate-500">Tùy chỉnh ngay trên bản đồ</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleMusic}
                aria-pressed={musicEnabled}
                aria-label={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền khi dùng tai nghe'}
                title={musicEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền khi dùng tai nghe'}
                className={cn(
                  'grid size-8 place-items-center rounded-lg hover:bg-white/10',
                  musicEnabled ? 'text-treasure-300' : 'text-slate-500 hover:text-slate-200',
                )}
              >
                <Music2 className="size-4" aria-hidden="true" />
              </button>
              {compact && (
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={soundEnabled}
                  aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-slate-200"
                >
                  {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-slate-200"
                aria-label="Đóng cài đặt bản đồ"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          <nav className={cn('grid gap-1 border-b border-abyss-700 bg-abyss-900/70 p-1.5', showEquipment ? 'grid-cols-3' : 'grid-cols-2')} aria-label="Các mục cài đặt">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  aria-pressed={selected}
                  className={cn(
                    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                    selected
                      ? 'bg-quest-500/18 text-quest-300'
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300',
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="max-h-[25rem] overflow-y-auto p-3">
            {activeTab === 'character' && (
              <div>
                {!musicEnabled && (
                  <p className="mb-3 rounded-lg border border-treasure-400/20 bg-treasure-500/8 px-2.5 py-2 text-[10px] text-treasure-200">
                    Có nhạc nền ByteLand — em chỉ nên bật khi đang dùng tai nghe.
                  </p>
                )}
                <p className="text-xs font-semibold text-slate-200">Chọn người đồng hành</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Nhân vật sẽ đổi ngay trên sân chơi; chương trình của em vẫn giữ nguyên.
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
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
                          'relative rounded-xl border p-1.5 transition-all disabled:cursor-wait disabled:opacity-65',
                          selected
                            ? 'border-quest-400 bg-quest-500/15 shadow-[0_0_16px_rgba(34,211,238,0.14)]'
                            : 'border-abyss-700 bg-abyss-900/70 hover:-translate-y-0.5 hover:border-abyss-500',
                        )}
                      >
                        <AvatarIcon avatarId={item.id} size={42} className="mx-auto" />
                        <span className="mt-1 block truncate text-[9px] font-medium text-slate-300">
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
                  <p className="mt-2 text-[11px] text-danger-300" role="alert">{avatarError}</p>
                )}
                {account.isGuest && (
                  <p className="mt-2 rounded-lg bg-treasure-500/8 px-2.5 py-2 text-[10px] text-treasure-200">
                    Bản chơi thử chỉ nhớ lựa chọn trong lần mở trang này.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'account' && (
              <div>
                <div className="flex items-center gap-3 rounded-xl border border-abyss-700 bg-abyss-900/70 p-3">
                  <AvatarIcon avatarId={avatarId} size={52} glow />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-100">{account.name}</p>
                    <p className="text-[11px] text-quest-300">
                      Cấp {account.level} · {account.totalXp} XP
                      {typeof account.gems === 'number' && <span className="text-treasure-300"> · {demoGemBalance} Gem</span>}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {account.isGuest
                        ? 'Hồ sơ khách'
                        : [account.className && `Lớp ${account.className}`, account.studentCode && `Mã ${account.studentCode}`]
                            .filter(Boolean)
                            .join(' · ') || 'Chưa tham gia lớp'}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  {account.isGuest
                    ? 'Tạo tài khoản để lưu XP, nhân vật và tiến trình học trên nhiều thiết bị.'
                    : 'Hồ sơ đầy đủ có huy hiệu, tiến trình cấp độ và thông tin lớp của em.'}
                </p>
                <Link
                  to={accountHref}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-quest-500/18 px-3 text-xs font-bold text-quest-200 hover:bg-quest-500/25"
                >
                  {accountActionLabel}
                </Link>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div>
                <div className="rounded-xl border border-treasure-400/20 bg-treasure-500/8 p-2.5">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-treasure-200">
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Trang bị mở kỹ năng code
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    Em mở đồ mới bằng cách học thêm lệnh — không cần mua sức mạnh để vượt bài.
                  </p>
                </div>

                <ul className="mt-3 space-y-2 list-none">
                  {EQUIPMENT_ROADMAP.map((item) => {
                    const unlocked = item.unlocked || allEquipmentUnlocked;
                    return (
                      <li
                        key={item.name}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-2.5',
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
                          'relative grid size-10 shrink-0 place-items-center rounded-xl',
                          unlocked ? 'bg-verdant-500/15 text-verdant-300' : 'bg-abyss-800 text-slate-500',
                        )}>
                          <TileSprite index={item.tileIndex} sheet="dungeon" scale={2} title={item.name} />
                          {!unlocked && (
                            <LockKeyhole className="absolute -bottom-1 -right-1 size-4 rounded-full bg-abyss-950 p-0.5 text-slate-500" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200">{item.name}</p>
                          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{item.description}</p>
                          <p className={cn(
                            'mt-1 text-[9px] font-semibold uppercase tracking-wide',
                            unlocked ? 'text-verdant-300' : 'text-slate-600',
                          )}>
                            {allEquipmentUnlocked && !item.unlocked ? 'Mở trong Demo Sandbox' : item.status}
                          </p>
                          {allEquipmentUnlocked && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click');
                                  setEquippedItemId(item.id);
                                  setEquipmentLevels((levels) => ({ ...levels, [item.id]: levels[item.id] ?? 1 }));
                                }}
                                className={cn(
                                  'rounded-md px-2 py-1 text-[9px] font-bold',
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
                                className="rounded-md bg-treasure-500/12 px-2 py-1 text-[9px] font-bold text-treasure-200 hover:bg-treasure-500/20 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Cấp {equipmentLevels[item.id] ?? 1} · Nâng {item.upgradeCost} Gem
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
