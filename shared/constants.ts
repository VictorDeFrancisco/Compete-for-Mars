import type { Phase, Stats } from './types';
export const MAX_PLAYERS = 4;
export const STAT_BUDGET = 6;
export const DEFAULT_STATS: Stats = { energy: 2, food: 2, shielding: 2 };
export const PHASE_LABELS: Record<Phase, string> = {
  stats: '0 · Estadísticas', lobby: '1 · Lobby', presentation: '2 · Presentación',
  cards: '3 · Cartas', playing: '4 · Minijuego',
};
export const PRESENTATION_MS = 15_000;
export const CARDS_MS = 25_000;
export const ROOM_IDLE_MS = 10 * 60_000;
