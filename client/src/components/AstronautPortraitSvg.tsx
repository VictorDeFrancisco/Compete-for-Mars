import { suitColorForStats } from '../../../shared/constants';
import type { PublicPlayer, Stats } from '../../../shared/types';
import { PROFESSIONS, sameStats } from './professions';

export const PLAYER_SLOT_COLORS = ['#E03C28', '#2F9E5B', '#1D78B4', '#E59500'] as const;

export const CLASS_SUIT_COLORS: Record<'engineer' | 'pilot' | 'biologist' | 'medic', string> = {
  engineer: '#D97706',
  pilot: '#1D6E8C',
  biologist: '#2F6F4E',
  medic: '#C83E37',
};

const FALLBACK_SUIT_COLORS = PLAYER_SLOT_COLORS;

export function suitColorByIndex(index: number): string {
  return FALLBACK_SUIT_COLORS[Math.abs(index) % FALLBACK_SUIT_COLORS.length];
}

export function suitColorForPlayer(stats: Stats, fallbackIndex = 0): string {
  const matched = PROFESSIONS.find(profession => sameStats(profession.stats, stats));
  if (matched) return CLASS_SUIT_COLORS[matched.id];
  return suitColorForStats(stats, fallbackIndex);
}

export function resolvePlayerSuitColor(
  _player: Pick<PublicPlayer, 'suitColor'> | undefined,
  _selfStats: Stats,
  _isSelf: boolean,
  fallbackIndex = 0,
): string {
  return PLAYER_SLOT_COLORS[Math.abs(fallbackIndex) % PLAYER_SLOT_COLORS.length];
}

export interface AstronautPortraitSvgProps {
  suitColor?: string;
  variant?: number;
  className?: string;
}

/**
 * Minimalist transparent astronaut logo with pure black visor and full suit/helmet color per player.
 */
export default function AstronautPortraitSvg({
  suitColor = '#E03C28',
  variant: _variant = 0,
  className = 'astronaut-portrait__svg',
}: AstronautPortraitSvgProps) {
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      {/* Minimalist shoulders */}
      <path
        d="M16 74 C16 58, 26 53, 40 53 C54 53, 64 58, 64 74 Z"
        fill={suitColor}
        stroke="#1A1817"
        strokeWidth="3.2"
        strokeLinejoin="round"
        style={{ transition: 'fill 0.2s ease' }}
      />

      {/* Side ear pods */}
      <rect x="11" y="28" width="6" height="12" rx="3" fill={suitColor} stroke="#1A1817" strokeWidth="2.8" />
      <rect x="63" y="28" width="6" height="12" rx="3" fill={suitColor} stroke="#1A1817" strokeWidth="2.8" />

      {/* Helmet shell colored per player */}
      <circle
        cx="40"
        cy="34"
        r="24"
        fill={suitColor}
        stroke="#1A1817"
        strokeWidth="3.2"
        style={{ transition: 'fill 0.2s ease' }}
      />

      {/* Pure black visor */}
      <rect x="21" y="20" width="38" height="26" rx="12" fill="#111111" stroke="#1A1817" strokeWidth="2.8" />
      {/* Single minimalist visor highlight */}
      <path
        d="M27 28 C30 24.5, 36 23.8, 42 24.8"
        fill="none"
        stroke="#F5EFE0"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.82"
      />
    </svg>
  );
}
