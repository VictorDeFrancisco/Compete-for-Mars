import type { Phase, Stats } from './types';
export const MAX_PLAYERS = 4;
export const STAT_BUDGET = 30;
export const DEFAULT_STATS: Stats = { energy: 20, food: 10, health: 0 };
export const PHASE_LABELS: Record<Phase, string> = {
  stats: '0 · Stats', lobby: '1 · Lobby', cards: '2 · Cards',
  presentation: '3 · Briefing', playing: '4 · Minigame', results: '5 · Leaderboard',
};
export const PRESENTATION_MS = 15_000;
export const CARDS_MS = 45_000;
export const RESULTS_MS = 20_000;
export const ROOM_IDLE_MS = 10 * 60_000;
