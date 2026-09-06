import { beforeEach, expect, it } from 'vitest';
import { useDemoRewardsStore } from './demoRewardsStore';
beforeEach(() => useDemoRewardsStore.setState({ totalXp: 0, gems: 0, completed: [] }));
it('cộng dồn phần thưởng khi chuyển nhiệm vụ trong cùng phiên Demo', () => {
  useDemoRewardsStore.getState().award('a0-c1', 10, 3);
  useDemoRewardsStore.getState().award('a0-c2', 15, 3);
  expect(useDemoRewardsStore.getState()).toMatchObject({ totalXp: 25, gems: 6 });
});
it('chơi lại cùng nhiệm vụ không cộng trùng phần thưởng Demo', () => {
  useDemoRewardsStore.getState().award('a0-c1', 10, 3);
  expect(useDemoRewardsStore.getState().award('a0-c1', 10, 3)).toEqual({ xp: 0, gems: 0 });
  expect(useDemoRewardsStore.getState().totalXp).toBe(10);
});
