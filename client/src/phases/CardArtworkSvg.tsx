import type { Card } from '../../../shared/types';

function PatchFrame({
  bg,
  ring,
  children,
}: {
  bg: string;
  ring: string;
  children: React.ReactNode;
}) {
  return (
    <svg className="action-card__svg" viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="33" fill={ring} stroke="#1A1817" strokeWidth="3" />
      <circle cx="36" cy="36" r="27" fill={bg} stroke="#1A1817" strokeWidth="2.2" />
      {children}
    </svg>
  );
}

/**
 * Rich, per-card Retro-NASA SVG emblem patch (falls back to category emblem if unmapped).
 */
export function CardCategoryPatchSvg({
  cardId,
  category = 'supply',
}: {
  cardId?: string;
  category?: Card['category'];
}) {
  switch (cardId) {
    case 'rest':
      return (
        <PatchFrame ring="#D97706" bg="#FFF3DB">
          <rect x="20" y="24" width="32" height="24" rx="4" fill="#F59E0B" stroke="#1A1817" strokeWidth="2.4" />
          <rect x="30" y="20" width="12" height="5" rx="1.5" fill="#7C2D12" stroke="#1A1817" strokeWidth="1.8" />
          <path d="M38 28 L31 37 H36 L34 45 L42 35 H37 Z" fill="#FFFDF7" stroke="#1A1817" strokeWidth="1.5" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'eat':
      return (
        <PatchFrame ring="#16A34A" bg="#E8FAEE">
          <rect x="19" y="34" width="34" height="16" rx="3.5" fill="#22C55E" stroke="#1A1817" strokeWidth="2.4" />
          <path d="M19 40 H53" stroke="#14532D" strokeWidth="2" />
          <path d="M36 34 C36 23 44 19 50 22 C49 29 43 34 36 34 Z" fill="#4ADE80" stroke="#1A1817" strokeWidth="2" />
          <path d="M36 34 C36 25 29 21 22 23 C24 30 29 34 36 34 Z" fill="#15803D" stroke="#1A1817" strokeWidth="2" />
        </PatchFrame>
      );

    case 'recycle-food':
      return (
        <PatchFrame ring="#16A34A" bg="#FFF3DB">
          <path d="M22 30 A14 14 0 0 1 48 27" fill="none" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M46 21 L51 28 L43 30 Z" fill="#EA580C" stroke="#1A1817" strokeWidth="1.4" />
          <path d="M50 42 A14 14 0 0 1 24 45" fill="none" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26 51 L21 44 L29 42 Z" fill="#16A34A" stroke="#1A1817" strokeWidth="1.4" />
          <path d="M36 42 C36 34 41 30 46 32 C45 38 40 42 36 42 Z" fill="#22C55E" stroke="#1A1817" strokeWidth="1.8" />
          <path d="M31 30 L27 36 H31 L29 41 L35 34 H31 Z" fill="#FF9500" stroke="#1A1817" strokeWidth="1.2" />
        </PatchFrame>
      );

    case 'recycle-energy':
      return (
        <PatchFrame ring="#EA580C" bg="#E8FAEE">
          <path d="M22 30 A14 14 0 0 1 48 27" fill="none" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M46 21 L51 28 L43 30 Z" fill="#16A34A" stroke="#1A1817" strokeWidth="1.4" />
          <path d="M50 42 A14 14 0 0 1 24 45" fill="none" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26 51 L21 44 L29 42 Z" fill="#EA580C" stroke="#1A1817" strokeWidth="1.4" />
          <path d="M38 27 L31 37 H36 L34 46 L43 35 H37 Z" fill="#FF9500" stroke="#1A1817" strokeWidth="1.8" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'expedition':
      return (
        <PatchFrame ring="#C1440E" bg="#FBF3E4">
          <path d="M12 46 L25 29 L35 38 L45 24 L59 46 Z" fill="#C1440E" stroke="#1A1817" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M38 33 L45 24 L51 34" fill="#F5EFE0" stroke="#1A1817" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="23" y="42" width="22" height="8" rx="2" fill="#0B3D91" stroke="#1A1817" strokeWidth="2" />
          <circle cx="27" cy="52" r="3.2" fill="#1A1817" />
          <circle cx="34" cy="52" r="3.2" fill="#1A1817" />
          <circle cx="41" cy="52" r="3.2" fill="#1A1817" />
        </PatchFrame>
      );

    case 'dust-storm':
      return (
        <PatchFrame ring="#B45309" bg="#FFF4E0">
          <path d="M18 26 H54 M22 33 H50 M26 40 H46 M30 47 H42" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 20 L33 34 H39 L36 48 L48 31 H41 Z" fill="#FF9500" stroke="#1A1817" strokeWidth="2" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'ice-cave':
      return (
        <PatchFrame ring="#0284C7" bg="#E0F2FE">
          <path d="M13 49 L24 23 L35 37 L46 21 L59 49 Z" fill="#38BDF8" stroke="#1A1817" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M26 49 L36 33 L46 49 Z" fill="#0F172A" stroke="#1A1817" strokeWidth="2" />
          <path d="M24 23 L29 33 L21 31 Z M46 21 L50 32 L41 30 Z" fill="#FFFDF7" />
        </PatchFrame>
      );

    case 'all-in':
      return (
        <PatchFrame ring="#C1440E" bg="#FFF3DB">
          <rect x="21" y="21" width="30" height="30" rx="6" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.6" transform="rotate(-8 36 36)" />
          <circle cx="29" cy="29" r="2.8" fill="#FFFDF7" />
          <circle cx="43" cy="29" r="2.8" fill="#FFFDF7" />
          <circle cx="36" cy="36" r="2.8" fill="#FFFDF7" />
          <circle cx="29" cy="43" r="2.8" fill="#FFFDF7" />
          <circle cx="43" cy="43" r="2.8" fill="#FFFDF7" />
        </PatchFrame>
      );

    case 'mysterious-signal':
      return (
        <PatchFrame ring="#0B3D91" bg="#E8F1FF">
          <path d="M24 44 A15 15 0 0 1 45 23" fill="none" stroke="#0B3D91" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M22 47 L46 23 L40 43 Z" fill="#93C5FD" stroke="#1A1817" strokeWidth="2.2" strokeLinejoin="round" />
          <line x1="34" y1="35" x2="45" y2="24" stroke="#1A1817" strokeWidth="2.2" />
          <circle cx="47" cy="22" r="3" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.5" />
          <path d="M44 15 A11 11 0 0 1 55 26 M48 11 A16 16 0 0 1 59 22" fill="none" stroke="#0B3D91" strokeWidth="2.2" strokeLinecap="round" />
        </PatchFrame>
      );

    case 'emergency-landing':
      return (
        <PatchFrame ring="#C1440E" bg="#FFF5E6">
          <path d="M20 29 C20 18 52 18 52 29 Z" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.2" />
          <line x1="22" y1="29" x2="32" y2="41" stroke="#1A1817" strokeWidth="1.8" />
          <line x1="50" y1="29" x2="40" y2="41" stroke="#1A1817" strokeWidth="1.8" />
          <rect x="28" y="40" width="16" height="12" rx="2.5" fill="#F59E0B" stroke="#1A1817" strokeWidth="2.2" />
        </PatchFrame>
      );

    case 'nuclear-battery':
      return (
        <PatchFrame ring="#7C3AED" bg="#F3E8FF">
          <rect x="23" y="23" width="26" height="28" rx="4" fill="#6D28D9" stroke="#1A1817" strokeWidth="2.4" />
          <rect x="29" y="18" width="14" height="5" rx="1.5" fill="#FF9500" stroke="#1A1817" strokeWidth="1.8" />
          <circle cx="36" cy="37" r="3" fill="#FDE047" />
          <path d="M36 28 A9 9 0 0 0 28.2 32.5 L32.5 35 A4 4 0 0 1 36 33 Z M43.8 32.5 A9 9 0 0 0 36 28 V33 A4 4 0 0 1 39.5 35 Z M36 41 A4 4 0 0 1 32.5 39 L28.2 41.5 A9 9 0 0 0 43.8 41.5 L39.5 39 A4 4 0 0 1 36 41 Z" fill="#FDE047" />
        </PatchFrame>
      );

    case 'solar-flare-harvest':
      return (
        <PatchFrame ring="#EA580C" bg="#FFFBEB">
          <circle cx="36" cy="27" r="9" fill="#F97316" stroke="#1A1817" strokeWidth="2" />
          <path d="M36 14 V16 M24 19 L26 21 M48 19 L46 21 M22 27 H24 M48 27 H50" stroke="#EA580C" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="18,48 26,35 46,35 54,48" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.2" />
          <line x1="36" y1="35" x2="36" y2="48" stroke="#93C5FD" strokeWidth="1.8" />
          <line x1="22" y1="42" x2="50" y2="42" stroke="#93C5FD" strokeWidth="1.8" />
        </PatchFrame>
      );

    case 'crater-excavation':
      return (
        <PatchFrame ring="#C1440E" bg="#F5EFE0">
          <path d="M16 44 Q36 56 56 44" fill="none" stroke="#7A2506" strokeWidth="4" strokeLinecap="round" />
          <polygon points="31,20 41,20 38,39 34,39" fill="#F59E0B" stroke="#1A1817" strokeWidth="2.2" />
          <polygon points="33,39 39,39 36,47" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.8" />
          <path d="M27 25 H45" stroke="#1A1817" strokeWidth="3" strokeLinecap="round" />
        </PatchFrame>
      );

    case 'decontamination':
      return (
        <PatchFrame ring="#0B3D91" bg="#E0F2FE">
          <rect x="24" y="18" width="24" height="6" rx="2" fill="#0B3D91" stroke="#1A1817" strokeWidth="2" />
          <path d="M28 28 L26 35 M36 28 V36 M44 28 L46 35" stroke="#0284C7" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="36" cy="45" r="7" fill="#22C55E" stroke="#1A1817" strokeWidth="2" />
          <path d="M32.5 45 L35 47.5 L40 42.5" fill="none" stroke="#FFFDF7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'radiation-shield':
      return (
        <PatchFrame ring="#0B3D91" bg="#E8F1FF">
          <path d="M36 17 L50 23 V35 C50 44 43 50 36 54 C29 50 22 44 22 35 V23 Z" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M36 22 L45 26 V35 C45 41 40 45 36 48 C32 45 27 41 27 35 V26 Z" fill="#38BDF8" stroke="#1A1817" strokeWidth="1.6" />
          <circle cx="36" cy="34" r="3" fill="#1A1817" />
        </PatchFrame>
      );

    case 'reinforced-suit':
      return (
        <PatchFrame ring="#0B3D91" bg="#E8F1FF">
          <path d="M24 24 L31 20 H41 L48 24 L52 34 L46 36 L44 30 V50 H28 V30 L26 36 L20 34 Z" fill="#1D4ED8" stroke="#1A1817" strokeWidth="2.3" strokeLinejoin="round" />
          <rect x="32" y="27" width="8" height="7" rx="1.5" fill="#FDE047" stroke="#1A1817" strokeWidth="1.6" />
          <path d="M31 40 H41" stroke="#93C5FD" strokeWidth="2.4" strokeLinecap="round" />
        </PatchFrame>
      );

    case 'sabotage':
      return (
        <PatchFrame ring="#6D4B8C" bg="#FCE7F3">
          <path d="M18 42 Q27 32 32 36" fill="none" stroke="#1A1817" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 36 Q46 32 54 26" fill="none" stroke="#1A1817" strokeWidth="4" strokeLinecap="round" />
          <path d="M36 24 L39 30 L45 29 L40 35 L44 41 L37 39 L33 45 L32 38 L26 37 L32 33 Z" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.6" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'supply-theft':
      return (
        <PatchFrame ring="#6D4B8C" bg="#F3E8FF">
          <rect x="20" y="34" width="24" height="17" rx="3" fill="#22C55E" stroke="#1A1817" strokeWidth="2.3" />
          <path d="M32 34 V51 M20 41 H44" stroke="#14532D" strokeWidth="2" />
          <path d="M46 21 V32 M40 27 L46 21 L52 27" fill="none" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'exchange':
      return (
        <PatchFrame ring="#6D4B8C" bg="#F3E8FF">
          <path d="M21 29 H48 M42 23 L49 29 L42 35" fill="none" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M51 43 H24 M30 37 L23 43 L30 49" fill="none" stroke="#EA580C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'contagion':
      return (
        <PatchFrame ring="#7C3AED" bg="#F3E8FF">
          <circle cx="24" cy="36" r="8" fill="#7C3AED" stroke="#1A1817" strokeWidth="2" />
          <circle cx="48" cy="36" r="8" fill="#C084FC" stroke="#1A1817" strokeWidth="2" />
          <path d="M33 36 H40 M37 32 L41 36 L37 40" fill="none" stroke="#FC3D21" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </PatchFrame>
      );

    case 'isotope-leak':
      return (
        <PatchFrame ring="#7C3AED" bg="#FFF3DB">
          <rect x="22" y="24" width="16" height="24" rx="3" fill="#7C3AED" stroke="#1A1817" strokeWidth="2.2" />
          <circle cx="30" cy="36" r="3" fill="#FDE047" />
          <path d="M38 35 H49 L52 44" fill="none" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M49 21 L44 28 H48 L46 34 L53 26 H49 Z" fill="#FF9500" stroke="#1A1817" strokeWidth="1.3" />
        </PatchFrame>
      );

    default:
      switch (category) {
        case 'risk':
          return (
            <PatchFrame ring="#C1440E" bg="#F5EFE0">
              <path d="M16 46 L27 30 L37 39 L47 25 L56 46 Z" fill="#7A2506" stroke="#1A1817" strokeWidth="2.2" />
              <circle cx="46" cy="23" r="5" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.8" />
            </PatchFrame>
          );
        case 'defense':
          return (
            <PatchFrame ring="#0B3D91" bg="#F5EFE0">
              <path d="M36 18 L49 24 V36 C49 44 43 49 36 53 C29 49 23 44 23 36 V24 Z" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.2" />
              <path d="M30 35 H42 M36 29 V41" stroke="#F5EFE0" strokeWidth="3.2" strokeLinecap="round" />
            </PatchFrame>
          );
        case 'interaction':
          return (
            <PatchFrame ring="#6D4B8C" bg="#F5EFE0">
              <circle cx="28" cy="31" r="5.5" fill="#1A1817" />
              <circle cx="44" cy="31" r="5.5" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.8" />
              <path d="M19 47 C20 40 36 40 37 47 Z" fill="#1A1817" />
              <path d="M35 47 C36 40 52 40 53 47 Z" fill="#6D4B8C" stroke="#1A1817" strokeWidth="1.8" />
            </PatchFrame>
          );
        case 'supply':
        default:
          return (
            <PatchFrame ring="#2F6F4E" bg="#F5EFE0">
              <rect x="22" y="24" width="28" height="24" rx="4" fill="#2F6F4E" stroke="#1A1817" strokeWidth="2.2" />
              <rect x="27" y="29" width="18" height="6" fill="#F5EFE0" />
              <line x1="29" y1="41" x2="43" y2="41" stroke="#F5EFE0" strokeWidth="2.5" />
            </PatchFrame>
          );
      }
  }
}
