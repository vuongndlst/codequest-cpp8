import { create } from 'zustand';

/** Demo session only: never persisted to a real student's account. Reload starts a new demo. */
interface DemoRewards {
  totalXp: number;
  gems: number;
  completed: string[];
  award: (challengeId: string, xp: number, gems: number) => { xp: number; gems: number };
}
export const useDemoRewardsStore = create<DemoRewards>((set, get) => ({
  totalXp: 0, gems: 0, completed: [],
  award: (challengeId, xp, gems) => {
    if (get().completed.includes(challengeId)) return { xp: 0, gems: 0 };
    set(state => ({ totalXp: state.totalXp + xp, gems: state.gems + gems, completed: [...state.completed, challengeId] }));
    return { xp, gems };
  },
}));
