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
    stats: { energy: 30, food: 0, health: 0 },
  },
  {
    id: 'pilot',
    code: 'UNIT_02',
    name: 'Pilot',
    accent: '#22D3EE',
    stats: { energy: 20, food: 10, health: 0 },
  },
  {
    id: 'biologist',
    code: 'UNIT_03',
    name: 'Biologist',
    accent: '#4ADE80',
    stats: { energy: 0, food: 30, health: 0 },
  },
  {
    id: 'medic',
    code: 'UNIT_04',
    name: 'Medic',
    accent: '#FB7185',
    stats: { energy: 10, food: 20, health: 0 },
  },
];

export function sameStats(a: Stats, b: Stats): boolean {
  return a.energy === b.energy && a.food === b.food && a.health === b.health;
}
