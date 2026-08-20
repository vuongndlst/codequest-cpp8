import type { WorldSpec } from '@/types/content';

/**
 * Mô hình "sân khấu game" 2D.
 *
 * Chương trình của học sinh không vẽ trực tiếp lên màn hình. Nó sinh ra một
 * CHUỖI SỰ KIỆN; giao diện phát lại chuỗi đó thành animation. Nhờ vậy phần
 * chạy code (trong Web Worker, không có DOM) tách hoàn toàn khỏi phần hiển thị.
 */

/**
 * Bốn hướng nhân vật có thể quay.
 *
 * Mặc định LUÔN là `east`. Đây không phải lựa chọn thẩm mỹ: 7 nhiệm vụ đã có
 * từ trước dùng bản đồ một hàng ngang, `moveForward()` của chúng tăng cột lên
 * một. Để mặc định là `east` thì những bài đó chạy y hệt như cũ, không phải sửa
 * một dòng nội dung nào.
 */
export type Facing = 'east' | 'south' | 'west' | 'north';

/** Vector di chuyển của từng hướng, theo hệ toạ độ màn hình (row tăng xuống dưới). */
export const FACING_DELTA: Record<Facing, { dCol: number; dRow: number }> = {
  east: { dCol: 1, dRow: 0 },
  south: { dCol: 0, dRow: 1 },
  west: { dCol: -1, dRow: 0 },
  north: { dCol: 0, dRow: -1 },
};

const CLOCKWISE: Facing[] = ['east', 'south', 'west', 'north'];

export function turnedRight(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 1) % 4];
}

export function turnedLeft(facing: Facing): Facing {
  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + 3) % 4];
}

export interface WorldState {
  /** Vị trí ô hiện tại của nhân vật (0-based) */
  col: number;
  /** Hàng hiện tại. Bản đồ một hàng thì luôn bằng 0. */
  row: number;
  /** Ô đích cần tới */
  goalCol: number;
  goalRow: number;
  cols: number;
  rows: number;
  facing: Facing;
  energy: number;
  hasKey: boolean;
  openedDoors: string[];
  litLights: string[];
  activatedBridges: string[];
  /** Các máy đã được cấp năng lượng, theo đúng thứ tự học sinh kích hoạt. */
  chargedMachineIds: string[];
  /** Mức năng lượng tương ứng với từng phần tử trong `chargedMachineIds`. */
  machineCharges: number[];
  /** Tổng năng lượng đã cấp, dùng cho mục tiêu tổng hợp của Lò Toán Tử. */
  totalCharge: number;
  /** Các công tắc đang bật sau khi đánh giá biểu thức bool. */
  activeSwitchIds: string[];
  collectedGems: number;
  /** ID vật phẩm đã nhặt, ngăn một vật phẩm bị tính nhiều lần. */
  collectedPropIds: string[];
  bugHp: number;
  /** Tổng số đòn đã gọi, kể cả khi giáp đã về 0; dùng phát hiện vòng lặp thừa. */
  bugHits: number;
  /** Số lần Byte cố bước vào ô quái canh gác; mục tiêu né quái yêu cầu bằng 0. */
  dangerHits: number;
  /** Nhân vật có đang bị chặn ngay phía trước không */
  blocked: boolean;
}

export type WorldEventType =
  // --- Sân khấu đường đi (khu vực 3–5) ---
  | 'move'
  | 'blocked'
  | 'enemy-alert'
  | 'open-door'
  | 'turn-on-light'
  | 'activate-bridge'
  | 'charge-machine'
  | 'set-switch'
  | 'collect-key'
  | 'collect-gem'
  | 'attack-bug'
  | 'turn'
  | 'reach-goal'
  | 'out-of-energy'
  /*
    --- Sân khấu Tháp Tín Hiệu và Xưởng Rèn (khu vực 1–2) ---

    Area 0 và một số màn Area 2 dạy `cout` và biến — không có nhân vật đi lại nên
    không dùng được sân khấu đường đi. Nhóm sự kiện dưới đây cho phép dựng
    hình cho chính những khái niệm đó.
  */
  | 'print'
  | 'declare-var'
  | 'assign-var'
  | 'declare-func'
  | 'call-func'
  | 'return-func';

/**
 * Trần số sự kiện gửi về giao diện.
 *
 * Một vòng lặp `for` chạy 100 000 lần mà mỗi lần in ra một dòng sẽ đẻ ra
 * 100 000 sự kiện. Chuỗi đó vừa nặng khi truyền từ Web Worker về, vừa đủ để
 * treo trình duyệt lúc dựng hình.
 *
 * Cắt ở 300: nhiều hơn số bước một sân khấu vẽ nổi, mà vẫn thừa cho mọi
 * nhiệm vụ trong khoá. Việc CHẠY code không bị dừng — chỉ ngừng ghi thêm sự
 * kiện, nên kết quả chấm bài không đổi.
 */
export const MAX_WORLD_EVENTS = 300;

export interface WorldEvent {
  type: WorldEventType;
  /** Thứ tự sự kiện, dùng để phát lại animation */
  index: number;
  col: number;
  /** Hàng của nhân vật lúc sự kiện xảy ra. Bản đồ một hàng thì luôn 0. */
  row: number;
  message: string;
  detail?: Record<string, unknown>;
}

export const DEFAULT_WORLD: WorldSpec = { cols: 5, startCol: 0, goalCol: 4 };

export function createWorldState(spec: WorldSpec = DEFAULT_WORLD): WorldState {
  const initial = spec.initialState ?? {};
  return {
    col: spec.startCol ?? 0,
    row: spec.startRow ?? 0,
    goalCol: spec.goalCol ?? spec.cols - 1,
    goalRow: spec.goalRow ?? 0,
    cols: spec.cols,
    rows: spec.rows ?? 1,
    facing: spec.startFacing ?? 'east',
    energy: typeof initial.energy === 'number' ? initial.energy : 10,
    hasKey: initial.hasKey === true,
    openedDoors: [],
    litLights: [],
    activatedBridges: [],
    chargedMachineIds: [],
    machineCharges: [],
    totalCharge: 0,
    activeSwitchIds: [],
    collectedGems: 0,
    collectedPropIds: [],
    bugHp: typeof initial.bugHp === 'number' ? initial.bugHp : 3,
    bugHits: 0,
    dangerHits: 0,
    blocked: false,
  };
}

/** Ô ngay trước mặt nhân vật, theo hướng đang quay. */
export function cellAhead(state: WorldState): { col: number; row: number } {
  const delta = FACING_DELTA[state.facing];
  return { col: state.col + delta.dCol, row: state.row + delta.dRow };
}

/** Ô nền là tường. Bản đồ không khai báo `terrain` thì mọi ô đều đi được. */
export function isWall(spec: WorldSpec | undefined, col: number, row: number): boolean {
  const line = spec?.terrain?.[row];
  return line !== undefined && ['#', '~', '^', 'F'].includes(line[col]);
}

/** Vật thể đứng tại một ô. Prop không khai báo `row` được coi là ở hàng 0. */
export function propAt(
  spec: WorldSpec | undefined,
  col: number,
  row: number,
): NonNullable<WorldSpec['props']>[number] | undefined {
  return spec?.props?.find((prop) => prop.col === col && (prop.row ?? 0) === row);
}

/**
 * Vật cản ngay trước mặt (tường, cửa chưa mở, cầu chưa bật, hoặc mép bản đồ).
 *
 * Với bản đồ một hàng và hướng mặc định `east`, hàm này cho kết quả y hệt bản
 * cũ — đó là điều kiện để 7 nhiệm vụ đã có không phải sửa gì.
 */
export function isBlockedAhead(state: WorldState, spec: WorldSpec | undefined): boolean {
  const { col, row } = cellAhead(state);

  // Ra khỏi bản đồ cũng là bị chặn
  if (col < 0 || col >= state.cols || row < 0 || row >= state.rows) return true;

  if (isWall(spec, col, row)) return true;

  const obstacle = propAt(spec, col, row);
  if (!obstacle) return false;

  switch (obstacle.type) {
    case 'door':
      return !state.openedDoors.includes(obstacle.id);
    case 'bridge':
      return !state.activatedBridges.includes(obstacle.id);
    case 'wall':
    case 'rock':
      return true;
    case 'bot':
    case 'enemy':
      return obstacle.state === 'blocking';
    default:
      return false;
  }
}

/**
 * So sánh trạng thái thế giới với mong đợi của một test case.
 * Chỉ so những khoá được nêu — test không cần liệt kê toàn bộ trạng thái.
 */
export function matchesExpectedWorld(
  state: WorldState,
  expected: Record<string, unknown>,
): boolean {
  return Object.entries(expected).every(([key, value]) => {
    const actual = (state as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value) && Array.isArray(actual)) {
      return value.length === actual.length && value.every((item) => actual.includes(item));
    }
    return actual === value;
  });
}
