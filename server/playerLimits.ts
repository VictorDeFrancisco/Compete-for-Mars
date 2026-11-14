import type { Resources, Stats } from '../shared/types';

export const BASE_STAT_CAP = 100;
type Profession = { stats: Stats };
export const clamp = (n: number, low = 0, high = BASE_STAT_CAP) => Math.max(low, Math.min(high, n));
export const maxHealthFor = (player: Profession) => BASE_STAT_CAP + player.stats.health;
export function maxResourceFor(player: Profession, key: keyof Resources): number {
  return key === 'radiation' ? Infinity : BASE_STAT_CAP + player.stats[key];
}
export function clampResource(key: keyof Resources, value: number, maxLimit = BASE_STAT_CAP): number {
  return key === 'radiation' ? Math.max(0, value) : clamp(value, 0, maxLimit);
}
export function clampPlayerResource(player: Profession, key: keyof Resources, value: number): number {
  return clampResource(key, value, maxResourceFor(player, key));
}
