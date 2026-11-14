import { useId } from 'react';

/**
 * Shared stylized Martian outpost exterior backdrop + subtle analog surface grain.
 * Anchors the physical NASA dossier & console screens to the Mars base window view.
 */
export default function MarsBackdrop() {
  const uid = useId().replace(/:/g, '');
  const skyGradId = `mars-sky-${uid}`;
  const grainId = `mars-grain-${uid}`;

  return (
    <div className="mars-backdrop" aria-hidden="true">
      <svg
        className="mars-backdrop__svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={skyGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#07111F" />
            <stop offset="48%" stopColor="#0B192C" />
            <stop offset="76%" stopColor="#1B2A42" />
            <stop offset="100%" stopColor="#5C2412" />
          </linearGradient>
        </defs>

        {/* Deep space night sky */}
        <rect width="1440" height="900" fill={`url(#${skyGradId})`} />

        {/* Subtle geometric starfield & Phobos */}
        <g fill="#F5EFE0">
          <circle cx="110" cy="96" r="1.4" opacity="0.65" />
          <circle cx="240" cy="142" r="1.1" opacity="0.45" />
          <circle cx="385" cy="72" r="1.6" opacity="0.7" />
          <circle cx="520" cy="188" r="1" opacity="0.4" />
          <circle cx="660" cy="64" r="1.5" opacity="0.6" />
          <circle cx="790" cy="130" r="1.1" opacity="0.5" />
          <circle cx="915" cy="82" r="1.8" opacity="0.72" />
          <circle cx="1070" cy="156" r="1.2" opacity="0.45" />
          <circle cx="1195" cy="94" r="1.5" opacity="0.65" />
          <circle cx="1330" cy="144" r="1.3" opacity="0.5" />
          <circle cx="170" cy="240" r="1.2" opacity="0.35" />
          <circle cx="1270" cy="245" r="1.1" opacity="0.38" />
          {/* Tiny orbital Phobos silhouette */}
          <circle cx="1145" cy="175" r="14" fill="#D5C8B0" opacity="0.22" />
          <circle cx="1149" cy="172" r="13" fill="#0B192C" opacity="0.78" />
        </g>

        {/* Distant crater mesa / horizon */}
        <path
          d="M0 540 L180 485 L350 518 L525 460 L690 502 L875 452 L1090 506 L1280 468 L1440 512 L1440 900 L0 900 Z"
          fill="#6E2207"
        />

        {/* Mid Martian terracotta dunes */}
        <path
          d="M0 612 C180 568, 340 562, 515 604 C690 644, 860 554, 1075 588 C1245 615, 1345 584, 1440 598 L1440 900 L0 900 Z"
          fill="#9E330A"
        />
        <path
          d="M0 658 C220 622, 410 668, 635 636 C825 609, 1005 645, 1190 620 C1310 605, 1385 628, 1440 640 L1440 900 L0 900 Z"
          fill="#C1440E"
        />

        {/* Geometric Geodesic Dome Outpost on the horizon (right-center) */}
        <g transform="translate(1035, 495)">
          {/* Antenna tower */}
          <line x1="158" y1="-22" x2="158" y2="38" stroke="#1A1817" strokeWidth="3" />
          <circle cx="158" cy="-24" r="4" fill="#FC3D21" />
          {/* Habitat wing */}
          <rect x="-54" y="54" width="66" height="44" fill="#2A120A" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="-42" y="66" width="16" height="7" fill="#FC3D21" opacity="0.85" />
          <rect x="-18" y="66" width="16" height="7" fill="#F5EFE0" opacity="0.7" />
          {/* Main geodesic dome */}
          <path
            d="M0 98 A76 76 0 0 1 152 98 Z"
            fill="#24110B"
            stroke="#1A1817"
            strokeWidth="3"
          />
          {/* Geodesic structural ribs */}
          <path d="M18 98 A58 72 0 0 1 134 98" fill="none" stroke="#5A2816" strokeWidth="2" />
          <path d="M44 98 A32 75 0 0 1 108 98" fill="none" stroke="#5A2816" strokeWidth="2" />
          <line x1="76" y1="22" x2="76" y2="98" stroke="#5A2816" strokeWidth="2" />
          <line x1="14" y1="60" x2="138" y2="60" stroke="#5A2816" strokeWidth="2" />
          {/* Warm interior viewport band */}
          <rect x="34" y="74" width="84" height="9" rx="1" fill="#F5EFE0" opacity="0.78" />
          <rect x="44" y="76" width="22" height="5" fill="#FC3D21" />
        </g>

        {/* Foreground dark Martian regolith & subtle desk shadow edge */}
        <path
          d="M0 736 C260 698, 540 742, 820 714 C1085 688, 1290 726, 1440 704 L1440 900 L0 900 Z"
          fill="#4A1706"
        />
        <rect x="0" y="782" width="1440" height="118" fill="#1B100D" opacity="0.78" />
      </svg>

      {/* Fixed subtle analog film grain */}
      <svg className="mars-backdrop__grain">
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
    </div>
  );
}
