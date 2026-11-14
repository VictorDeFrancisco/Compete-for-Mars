import type { Phase, Stats } from './types';
export const MAX_PLAYERS = 4;
export const STAT_BUDGET = 30;
export const DEFAULT_STATS: Stats = { energy: 20, food: 10, health: 0 };
export const ROUND_RESOURCE_UPKEEP = 30;
export const DISTRIBUTED_RESOURCE_PER_ALIVE = 15;
export const SUIT_COLOR_PALETTE = ['#D97706', '#1D6E8C', '#2F6F4E', '#C83E37'] as const;

export function suitColorForStats(stats: Stats, fallbackIndex = 0): string {
  if (stats.energy === 30 && stats.food === 0 && stats.health === 0) return '#D97706';
  if (stats.energy === 20 && stats.food === 10 && stats.health === 0) return '#1D6E8C';
  if (stats.energy === 0 && stats.food === 30 && stats.health === 0) return '#2F6F4E';
  if (stats.energy === 10 && stats.food === 20 && stats.health === 0) return '#C83E37';
  return SUIT_COLOR_PALETTE[Math.abs(fallbackIndex) % SUIT_COLOR_PALETTE.length];
}
export const PHASE_LABELS: Record<Phase, string> = {
  stats: '0 · Stats', lobby: '1 · Lobby', cards: '2 · Cards',
  presentation: '3 · Briefing', playing: '4 · Minigame', results: '5 · Leaderboard',
};
export const PRESENTATION_MS = 15_000;
export const CARDS_MS = 45_000;
export const RESULTS_MS = 20_000;
export const ROOM_IDLE_MS = 10 * 60_000;
