import type { Stats } from '../../../shared/types';

export interface Profession {
  id: 'engineer' | 'pilot' | 'biologist' | 'medic';
  code: string;
  name: string;
  accent: string;
  stats: Stats;
}

export const PROFESSIONS: readonly Profession[] = [
  {
    id: 'engineer',
    code: 'UNIT_01',
    name: 'Engineer',
    accent: '#F59E0B',
    stats: { energy: 4, food: 1, shielding: 1 },
  },
  {
    id: 'pilot',
    code: 'UNIT_02',
    name: 'Pilot',
    accent: '#22D3EE',
    stats: { energy: 3, food: 1, shielding: 2 },
  },
  {
    id: 'biologist',
    code: 'UNIT_03',
    name: 'Biologist',
    accent: '#4ADE80',
    stats: { energy: 1, food: 4, shielding: 1 },
  },
  {
    id: 'medic',
    code: 'UNIT_04',
    name: 'Medic',
    accent: '#FB7185',
    stats: { energy: 1, food: 2, shielding: 3 },
  },
];

export function sameStats(a: Stats, b: Stats): boolean {
  return a.energy === b.energy && a.food === b.food && a.shielding === b.shielding;
}
