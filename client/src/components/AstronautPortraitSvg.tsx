import type { Stats } from '../../../shared/types';
import { PROFESSIONS, sameStats } from './professions';

export const CLASS_SUIT_COLORS: Record<'engineer' | 'pilot' | 'biologist' | 'medic', string> = {
  engineer: '#D97706',
  pilot: '#1D6E8C',
  biologist: '#2F6F4E',
  medic: '#C83E37',
};

const FALLBACK_SUIT_COLORS = ['#D97706', '#1D6E8C', '#2F6F4E', '#C83E37'] as const;

export function suitColorByIndex(index: number): string {
  return FALLBACK_SUIT_COLORS[Math.abs(index) % FALLBACK_SUIT_COLORS.length];
}

export function suitColorForPlayer(stats: Stats, fallbackIndex = 0): string {
  const matched = PROFESSIONS.find(profession => sameStats(profession.stats, stats));
  if (matched) return CLASS_SUIT_COLORS[matched.id];
  return suitColorByIndex(fallbackIndex);
}

export interface AstronautPortraitSvgProps {
  suitColor?: string;
  variant?: number;
  className?: string;
}

/**
 * Expressive Kurzgesagt / Retro-NASA geometric astronaut face portrait inside helmet & tinted visor.
 */
export default function AstronautPortraitSvg({
  suitColor = '#FC3D21',
  variant = 0,
  className = 'astronaut-portrait__svg',
}: AstronautPortraitSvgProps) {
  const idx = Math.abs(variant) % 4;
  const skinColors = ['#F2C29B', '#E5A87E', '#F5CBA7', '#D69469'] as const;
  const hairColors = ['#3B2618', '#1A1817', '#A44A24', '#5A3A22'] as const;
  const skin = skinColors[idx];
  const hair = hairColors[idx];

  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      {/* Backdrop */}
      <rect width="80" height="80" fill="#13253D" />
      <circle cx="14" cy="14" r="1.4" fill="#F5EFE0" opacity="0.65" />
      <circle cx="67" cy="18" r="1.2" fill="#F5EFE0" opacity="0.55" />
      <circle cx="66" cy="60" r="1.5" fill="#F5EFE0" opacity="0.4" />

      {/* Suit shoulders + chest badge */}
      <path
        d="M12 80 C13 61, 24 56, 40 56 C56 56, 67 61, 68 80 Z"
        fill={suitColor}
        stroke="#1A1817"
        strokeWidth="2.8"
        style={{ transition: 'fill 0.2s ease' }}
      />
      {/* Metallic neck seal ring */}
      <rect x="25" y="53" width="30" height="8" rx="3" fill="#D5C8B0" stroke="#1A1817" strokeWidth="2.2" />
      <circle cx="40" cy="69" r="4" fill="#F5EFE0" stroke="#1A1817" strokeWidth="1.8" />

      {/* Helmet side comms pods */}
      <rect x="11" y="29" width="8" height="17" rx="3.5" fill={suitColor} stroke="#1A1817" strokeWidth="2.2" />
      <rect x="61" y="29" width="8" height="17" rx="3.5" fill={suitColor} stroke="#1A1817" strokeWidth="2.2" />
      <line x1="65" y1="21" x2="65" y2="30" stroke="#1A1817" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="65" cy="19" r="2.6" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.4" />

      {/* Outer Helmet Shell */}
      <circle cx="40" cy="36" r="24" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.8" />
      {/* Subtle lower helmet shading */}
      <path d="M18 42 A23 23 0 0 0 62 42" fill="none" stroke="#DDD0B8" strokeWidth="4" />

      {/* Visor Glass Cavity */}
      <rect x="21" y="20" width="38" height="30" rx="13" fill="#172A44" stroke="#1A1817" strokeWidth="2.5" />

      {/* Stylized Astronaut Head & Face inside Visor */}
      <circle cx="40" cy="37" r="12.5" fill={skin} />

      {/* Hair tuft variations per crewmate */}
      {idx === 0 && (
        <path d="M28 33 C29 24, 51 24, 52 33 C47 29, 34 29, 28 33 Z" fill={hair} />
      )}
      {idx === 1 && (
        <path d="M28 34 C30 23, 46 23, 52 31 C45 28, 36 31, 28 34 Z" fill={hair} />
      )}
      {idx === 2 && (
        <path d="M27 35 C27 24, 53 24, 53 35 C49 27, 31 27, 27 35 Z" fill={hair} />
      )}
      {idx === 3 && (
        <path d="M29 33 C32 24, 50 25, 51 34 C46 28, 35 27, 29 33 Z" fill={hair} />
      )}

      {/* Expressive Brows */}
      <path
        d={idx === 1 ? 'M31 32 Q34 30 37 32' : 'M31 32 L37 31.5'}
        stroke="#1A1817"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={idx === 1 ? 'M43 32 Q46 30 49 32' : 'M43 31.5 L49 32'}
        stroke="#1A1817"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eyes + Crisp White Glints */}
      <circle cx="34.5" cy="36" r="2.3" fill="#1A1817" />
      <circle cx="45.5" cy="36" r="2.3" fill="#1A1817" />
      <circle cx="33.8" cy="35.1" r="0.85" fill="#FFFFFF" />
      <circle cx="44.8" cy="35.1" r="0.85" fill="#FFFFFF" />

      {/* Warm Cheek Tint */}
      <circle cx="31" cy="40" r="1.8" fill="#E07A5F" opacity="0.45" />
      <circle cx="49" cy="40" r="1.8" fill="#E07A5F" opacity="0.45" />

      {/* Confident Grin / Smile */}
      {idx === 2 ? (
        <path d="M36 42.5 Q40 45.8 44 42.5 Z" fill="#FFFFFF" stroke="#1A1817" strokeWidth="1.4" strokeLinejoin="round" />
      ) : (
        <path d="M36 42.5 Q40 45.5 44 42.5" fill="none" stroke="#1A1817" strokeWidth="1.8" strokeLinecap="round" />
      )}

      {/* Subtle Semi-Transparent Visor Reflection Streak */}
      <path
        d="M25 26 C29 22, 37 22, 43 23"
        fill="none"
        stroke="#A6D5FA"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="52" cy="26" r="1.4" fill="#A6D5FA" opacity="0.5" />
    </svg>
  );
}
