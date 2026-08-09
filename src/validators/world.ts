import type { WorldSpec } from '@/types/content';

/**
 * Mô hình "sân khấu game" 2D.
 *
 * Chương trình của học sinh không vẽ trực tiếp lên màn hình. Nó sinh ra một
 * CHUỖI SỰ KIỆN; giao diện phát lại chuỗi đó thành animation. Nhờ vậy phần
 * chạy code (trong Web Worker, không có DOM) tách hoàn toàn khỏi phần hiển thị.
 */

export interface WorldState {
  /** Vị trí ô hiện tại của nhân vật (0-based) */
  col: number;
  /** Ô đích cần tới */
  goalCol: number;
  cols: number;
  energy: number;
  hasKey: boolean;
  openedDoors: string[];
  litLights: string[];
  activatedBridges: string[];
  collectedGems: number;
  bugHp: number;
  /** Nhân vật có đang bị chặn ngay phía trước không */
  blocked: boolean;
}

export type WorldEventType =
  | 'move'
  | 'blocked'
  | 'open-door'
  | 'turn-on-light'
  | 'activate-bridge'
  | 'collect-key'
  | 'collect-gem'
  | 'attack-bug'
  | 'reach-goal'
  | 'out-of-energy';

export interface WorldEvent {
  type: WorldEventType;
  /** Thứ tự sự kiện, dùng để phát lại animation */
  index: number;
  col: number;
  message: string;
  detail?: Record<string, unknown>;
}

export const DEFAULT_WORLD: WorldSpec = { cols: 5, startCol: 0, goalCol: 4 };

export function createWorldState(spec: WorldSpec = DEFAULT_WORLD): WorldState {
  const initial = spec.initialState ?? {};
  return {
    col: spec.startCol ?? 0,
    goalCol: spec.goalCol ?? spec.cols - 1,
    cols: spec.cols,
    energy: typeof initial.energy === 'number' ? initial.energy : 10,
    hasKey: initial.hasKey === true,
    openedDoors: [],
    litLights: [],
    activatedBridges: [],
    collectedGems: 0,
    bugHp: typeof initial.bugHp === 'number' ? initial.bugHp : 3,
    blocked: false,
  };
}

/** Vật cản ở ô kế tiếp (tường, cầu chưa bật…) */
export function isBlockedAhead(state: WorldState, spec: WorldSpec | undefined): boolean {
  if (!spec?.props) return state.col >= state.cols - 1;

  const nextCol = state.col + 1;
  if (nextCol >= state.cols) return true;

  const obstacle = spec.props.find((prop) => prop.col === nextCol);
  if (!obstacle) return false;

  switch (obstacle.type) {
    case 'door':
      return !state.openedDoors.includes(obstacle.id);
    case 'bridge':
      return !state.activatedBridges.includes(obstacle.id);
    case 'wall':
      return true;
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
