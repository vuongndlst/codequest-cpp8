import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapSettingsMenu } from './MapSettingsMenu';
import { playSound } from '@/services/audio';

vi.mock('@/services/audio', () => ({ playSound: vi.fn() }));

const onAvatarChange = vi.fn();
const onToggleSound = vi.fn();
const onToggleMusic = vi.fn();

function renderMenu() {
  return render(
    <MemoryRouter>
      <div className="relative">
        <MapSettingsMenu
          avatarId="guardian-cyan"
          account={{
            name: 'Nguyễn Minh An',
            className: '8A1',
            studentCode: 'HS01',
            level: 2,
            totalXp: 125,
          }}
          soundEnabled
          onToggleSound={onToggleSound}
          musicEnabled={false}
          onToggleMusic={onToggleMusic}
          onAvatarChange={onAvatarChange}
          accountHref="/app/profile"
          accountActionLabel="Mở hồ sơ đầy đủ"
        />
      </div>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Cài đặt nổi trên bản đồ', () => {
  it('mặc định chỉ hiện dock nhỏ, không che sân chơi', () => {
    renderMenu();

    expect(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Cài đặt bản đồ' })).not.toBeInTheDocument();
  });

  it('đổi nhân vật ngay trong popup trên map', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));
    await user.click(screen.getByTitle('Mộc Linh'));

    expect(onAvatarChange).toHaveBeenCalledWith('mage-emerald');
    expect(playSound).toHaveBeenCalledWith('click');
  });

  it('mở modal rộng giữa bản đồ, đóng bằng nền hoặc Escape và trả focus', async () => {
    const user = userEvent.setup();
    renderMenu();

    const opener = screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Góc phiêu lưu' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveClass('w-[min(56rem,calc(100%-1rem))]');
    expect(screen.getByRole('tab', { name: 'Nhân vật' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('đặt focus vào tab đang chọn và đóng khi bấm vùng nền', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));

    expect(screen.getByRole('tab', { name: 'Nhân vật' })).toHaveFocus();
    await user.click(screen.getByTestId('map-settings-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('có nút bật tắt âm thanh dùng được mà không cần mở popup', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Tắt âm thanh' }));

    expect(onToggleSound).toHaveBeenCalledOnce();
  });

  it('để nhạc nền trong popup và nhắc học sinh dùng tai nghe', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));
    expect(screen.getByText('Nhạc tắt')).toBeInTheDocument();
    expect(screen.getByText('Âm thanh bật')).toBeInTheDocument();
    expect(screen.getByText(/chỉ nên bật khi đang dùng tai nghe/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bật nhạc nền khi dùng tai nghe' }));

    expect(onToggleMusic).toHaveBeenCalledOnce();
  });

  it('hồ sơ và trang bị chỉ xuất hiện khi học sinh chủ động mở', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));
    await user.click(screen.getByRole('tab', { name: 'Hồ sơ' }));
    expect(screen.getByText('Nguyễn Minh An')).toBeInTheDocument();
    expect(screen.getByText('Cấp độ').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Kinh nghiệm').nextElementSibling).toHaveTextContent('125 XP');

    await user.click(screen.getByRole('tab', { name: 'Trang bị' }));
    expect(screen.getByText('Bộ điều hướng')).toBeInTheDocument();
    expect(screen.getByText('Kiếm thuật toán')).toBeInTheDocument();
    expect(screen.getByText('Khiên điều kiện')).toBeInTheDocument();
    expect(screen.getByText('La bàn Phòng Gương')).toBeInTheDocument();
    expect(screen.getByText('Găng Chỉ Số')).toBeInTheDocument();
    expect(screen.getByText('Kính Quét Tuyến Tính')).toBeInTheDocument();
    expect(screen.getByText('Lõi Kiến Trúc Thuật Toán')).toBeInTheDocument();
    expect(screen.getAllByTestId('equipment-pixel-art')).toHaveLength(8);
  });

  it('màn nhập môn chỉ hiện một bánh răng và chưa giới thiệu trang bị', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <div className="relative">
          <MapSettingsMenu
            compact
            showEquipment={false}
            avatarId="guardian-cyan"
            account={{ name: 'Minh An', level: 1, totalXp: 0 }}
            soundEnabled
            onToggleSound={onToggleSound}
            onAvatarChange={onAvatarChange}
            accountHref="/app/profile"
            accountActionLabel="Mở hồ sơ"
          />
        </div>
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Tắt âm thanh' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));
    expect(screen.getByRole('button', { name: 'Tắt âm thanh' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Trang bị' })).not.toBeInTheDocument();
  });

  it('mua trang bị thật bằng dữ liệu từ Supabase thay vì chỉ mô phỏng', async () => {
    const user = userEvent.setup();
    const onBuyOrUpgrade = vi.fn();
    render(
      <MemoryRouter>
        <MapSettingsMenu
          avatarId="guardian-cyan"
          account={{ name: 'Minh An', level: 3, totalXp: 300, gems: 100 }}
          soundEnabled
          onToggleSound={onToggleSound}
          onAvatarChange={onAvatarChange}
          accountHref="/app/profile"
          accountActionLabel="Mở hồ sơ"
          currentLessonOrder={3}
          equipmentCatalog={[{
            id: 'algorithm-sword',
            name: 'Kiếm thuật toán',
            description: 'Mở thao tác tấn công.',
            base_cost: 45,
            max_level: 3,
            unlock_lesson: 'l3',
            sort_order: 2,
          }]}
          userEquipment={[]}
          onBuyOrUpgrade={onBuyOrUpgrade}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Mở cài đặt trên bản đồ' }));
    await user.click(screen.getByRole('tab', { name: 'Trang bị' }));
    await user.click(screen.getByRole('button', { name: 'Mua · 45 Gem' }));

    expect(onBuyOrUpgrade).toHaveBeenCalledWith('algorithm-sword');
  });
});
