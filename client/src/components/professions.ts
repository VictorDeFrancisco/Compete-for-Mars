import type { Stats } from '../../../shared/types';

export interface Profession {
  id: 'engineer' | 'pilot' | 'biologist' | 'medic';
  name: string;
  stats: Stats;
}

export const PROFESSIONS: readonly Profession[] = [
  {
    id: 'engineer',
    name: 'Engineer',
    stats: { energy: 4, food: 1, shielding: 1 },
  },
  {
    id: 'pilot',
    name: 'Pilot',
    stats: { energy: 3, food: 1, shielding: 2 },
  },
  {
    id: 'biologist',
    name: 'Biologist',
    stats: { energy: 1, food: 4, shielding: 1 },
  },
  {
    id: 'medic',
    name: 'Medic',
    stats: { energy: 1, food: 2, shielding: 3 },
  },
];

export function sameStats(a: Stats, b: Stats): boolean {
  return a.energy === b.energy && a.food === b.food && a.shielding === b.shielding;
}
