import { useId } from 'react';

export interface MarsBackdropProps {
  /** Primary suit fill color for the astronaut standing by the airlock */
  suitColor?: string;
}

/**
 * Full-screen geometric SVG Martian outpost scene (Mars First Logistics / Kurzgesagt style)
 * with crisp dark outlines, horizon planet, terracotta dunes, geodesic dome, solar array,
 * and an astronaut whose suit adapts to the selected crew class.
 */
export default function MarsBackdrop({ suitColor = '#FC3D21' }: MarsBackdropProps) {
  const uid = useId().replace(/:/g, '');
  const skyGradId = `mars-sky-${uid}`;
  const planetGradId = `mars-planet-${uid}`;
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
            <stop offset="0%" stopColor="#071222" />
            <stop offset="42%" stopColor="#0B192C" />
            <stop offset="72%" stopColor="#1B314E" />
            <stop offset="100%" stopColor="#722912" />
          </linearGradient>
          <linearGradient id={planetGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E67A45" />
            <stop offset="52%" stopColor="#C1440E" />
            <stop offset="100%" stopColor="#611D06" />
          </linearGradient>
        </defs>

        {/* Deep space night sky */}
        <rect width="1440" height="900" fill={`url(#${skyGradId})`} />

        {/* Stylized geometric starfield */}
        <g fill="#F5EFE0">
          <circle cx="95" cy="92" r="1.5" opacity="0.7" />
          <circle cx="215" cy="148" r="1.1" opacity="0.45" />
          <circle cx="340" cy="70" r="1.8" opacity="0.75" />
          <circle cx="485" cy="182" r="1.2" opacity="0.55" />
          <circle cx="560" cy="84" r="1.6" opacity="0.7" />
          <circle cx="640" cy="240" r="1.1" opacity="0.45" />
          <circle cx="715" cy="64" r="1.5" opacity="0.65" />
          <circle cx="980" cy="94" r="1.7" opacity="0.72" />
          <circle cx="1095" cy="168" r="1.2" opacity="0.48" />
          <circle cx="1185" cy="78" r="1.5" opacity="0.65" />
          <circle cx="1315" cy="134" r="1.8" opacity="0.72" />
          <circle cx="1385" cy="245" r="1.2" opacity="0.42" />
          {/* Four-point spark stars */}
          <path d="M518 118 L521 126 L529 129 L521 132 L518 140 L515 132 L507 129 L515 126 Z" opacity="0.75" />
          <path d="M1230 202 L1232 208 L1238 210 L1232 212 L1230 218 L1228 212 L1222 210 L1228 208 Z" opacity="0.65" />
        </g>

        {/* Large Illustrated Planet / Phobos-style Horizon Body in Open Center Sky */}
        <g transform="translate(760, 232)">
          <circle cx="0" cy="0" r="118" fill="#172A45" opacity="0.5" />
          <circle cx="0" cy="0" r="98" fill={`url(#${planetGradId})`} stroke="#1A1817" strokeWidth="3.5" />
          {/* Geometric surface bands & craters */}
          <path d="M-78 -36 C-35 -48, 22 -24, 82 -44" fill="none" stroke="#8C2D04" strokeWidth="7" strokeLinecap="round" opacity="0.65" />
          <path d="M-86 22 C-20 8, 35 34, 86 14" fill="none" stroke="#7A2506" strokeWidth="10" strokeLinecap="round" opacity="0.65" />
          <circle cx="-34" cy="-18" r="14" fill="#9A3209" stroke="#1A1817" strokeWidth="2.2" />
          <circle cx="32" cy="-38" r="9" fill="#9A3209" stroke="#1A1817" strokeWidth="2" />
          <circle cx="24" cy="36" r="18" fill="#7A2506" stroke="#1A1817" strokeWidth="2.2" />
          {/* Orbital ring */}
          <ellipse
            cx="0"
            cy="4"
            rx="142"
            ry="26"
            transform="rotate(-14)"
            fill="none"
            stroke="#F5EFE0"
            strokeWidth="2.5"
            opacity="0.45"
            strokeDasharray="16 8"
          />
        </g>

        {/* Far Crater Mesa & Layered Terracotta Mountains */}
        <path
          d="M0 515 L145 452 L285 492 L460 420 L620 478 L785 432 L960 468 L1155 416 L1320 458 L1440 434 L1440 900 L0 900 Z"
          fill="#7A2506"
          stroke="#1A1817"
          strokeWidth="3"
        />

        <path
          d="M0 568 C170 526, 330 538, 490 564 C650 590, 815 512, 1020 532 C1210 550, 1345 524, 1440 540 L1440 900 L0 900 Z"
          fill="#8C2D04"
          stroke="#1A1817"
          strokeWidth="3"
        />

        {/* Plateau Horizon Line supporting the Space Outpost */}
        <path
          d="M0 618 C210 578, 430 622, 650 582 C835 550, 1065 556, 1280 572 C1365 578, 1410 588, 1440 594 L1440 900 L0 900 Z"
          fill="#C1440E"
          stroke="#1A1817"
          strokeWidth="3.5"
        />

        {/* Illustrated Mars Base Outpost (Geodesic Dome + Solar Panels + Airlock + Astronaut) */}
        <g transform="translate(790, 405)">
          {/* Ground shadow platform */}
          <ellipse cx="220" cy="160" rx="235" ry="16" fill="#591B05" stroke="#1A1817" strokeWidth="2.5" />

          {/* Solar Panel Wing (left of dome) */}
          <g transform="translate(0, 102)">
            <rect x="44" y="42" width="12" height="16" fill="#5E645D" stroke="#1A1817" strokeWidth="2.5" />
            <polygon points="8,36 108,14 118,42 18,64" fill="#0B3D91" stroke="#1A1817" strokeWidth="3" />
            <line x1="35" y1="30" x2="45" y2="58" stroke="#F5EFE0" strokeWidth="1.5" opacity="0.6" />
            <line x1="62" y1="24" x2="72" y2="52" stroke="#F5EFE0" strokeWidth="1.5" opacity="0.6" />
            <line x1="88" y1="18" x2="98" y2="46" stroke="#F5EFE0" strokeWidth="1.5" opacity="0.6" />
            <line x1="13" y1="50" x2="113" y2="28" stroke="#F5EFE0" strokeWidth="1.5" opacity="0.6" />
            {/* Power conduit to dome */}
            <rect x="112" y="44" width="32" height="8" fill="#3D403B" stroke="#1A1817" strokeWidth="2.5" />
          </g>

          {/* Comms Antenna Mast */}
          <line x1="296" y1="12" x2="296" y2="85" stroke="#1A1817" strokeWidth="4" />
          <circle cx="296" cy="8" r="6" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M276 26 Q296 14 316 26" fill="none" stroke="#F5EFE0" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

          {/* Main Geodesic Dome */}
          <path
            d="M138 158 A92 92 0 0 1 322 158 Z"
            fill="#F5EFE0"
            stroke="#1A1817"
            strokeWidth="3.5"
          />
          {/* Dome glass / interior glow band */}
          <path
            d="M150 158 A80 80 0 0 1 310 158 Z"
            fill="#233754"
            stroke="#1A1817"
            strokeWidth="2.5"
          />
          {/* Geodesic Ribs */}
          <path d="M170 158 A60 76 0 0 1 290 158" fill="none" stroke="#0B3D91" strokeWidth="2.2" />
          <path d="M198 158 A32 78 0 0 1 262 158" fill="none" stroke="#0B3D91" strokeWidth="2.2" />
          <line x1="230" y1="78" x2="230" y2="158" stroke="#0B3D91" strokeWidth="2.2" />
          <line x1="158" y1="120" x2="302" y2="120" stroke="#0B3D91" strokeWidth="2.2" />
          {/* Warm habitat base windows */}
          <rect x="172" y="132" width="116" height="16" rx="2" fill="#FFB347" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="188" y="136" width="22" height="8" fill="#FC3D21" />
          <rect x="220" y="136" width="26" height="8" fill="#F5EFE0" />
          <rect x="256" y="136" width="18" height="8" fill="#F5EFE0" />

          {/* Pressurized Airlock Module (right of dome) */}
          <rect x="314" y="106" width="66" height="52" rx="4" fill="#E5D9C2" stroke="#1A1817" strokeWidth="3" />
          <rect x="328" y="118" width="24" height="40" rx="12" fill="#464B46" stroke="#1A1817" strokeWidth="2.5" />
          <circle cx="340" cy="134" r="5" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.8" />
          <rect x="358" y="114" width="14" height="8" fill="#0B3D91" stroke="#1A1817" strokeWidth="1.8" />

          {/* Standing Vector Astronaut beside Airlock — Suit Color Tracks Selected Class */}
          <g transform="translate(402, 92)">
            {/* Shadow */}
            <ellipse cx="18" cy="70" rx="16" ry="4.5" fill="#4A1706" />
            {/* Life-support backpack */}
            <rect x="3" y="25" width="10" height="24" rx="3" fill="#D5C8B0" stroke="#1A1817" strokeWidth="2.4" />
            {/* Legs */}
            <rect x="10" y="47" width="7" height="20" rx="2" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.4" />
            <rect x="19" y="47" width="7" height="20" rx="2" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.4" />
            {/* Boots */}
            <rect x="8" y="62" width="9" height="6" rx="1.5" fill="#1A1817" />
            <rect x="19" y="62" width="9" height="6" rx="1.5" fill="#1A1817" />
            {/* Left arm */}
            <path d="M10 31 L4 43" stroke="#1A1817" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M10 31 L4 43"
              stroke={suitColor}
              strokeWidth="5.2"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.2s ease' }}
            />
            <circle cx="3" cy="44" r="3.4" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
            {/* Torso colored by selected class */}
            <rect
              x="9"
              y="26"
              width="19"
              height="24"
              rx="4"
              fill={suitColor}
              stroke="#1A1817"
              strokeWidth="2.5"
              style={{ transition: 'fill 0.2s ease' }}
            />
            {/* Suit chest patch stripe */}
            <rect x="13" y="33" width="11" height="6" rx="1" fill="#F5EFE0" stroke="#1A1817" strokeWidth="1.5" />
            {/* Raised waving / scanner arm */}
            <path d="M27 31 L37 21" stroke="#1A1817" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M27 31 L37 21"
              stroke={suitColor}
              strokeWidth="5.2"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.2s ease' }}
            />
            <circle cx="38" cy="20" r="3.5" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
            {/* Helmet */}
            <circle cx="19" cy="16" r="12.5" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.8" />
            {/* Visor */}
            <rect x="12" y="10" width="16" height="11" rx="5" fill="#1A1817" />
            <line x1="15" y1="13" x2="22" y2="13" stroke={suitColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        {/* Foreground Martian dunes / floor where bottom UI cards rest */}
        <path
          d="M0 688 C235 654, 480 698, 760 666 C1030 636, 1255 676, 1440 652 L1440 900 L0 900 Z"
          fill="#9E330A"
          stroke="#1A1817"
          strokeWidth="3.5"
        />
        <path
          d="M0 746 C310 718, 620 758, 950 730 C1180 712, 1340 738, 1440 726 L1440 900 L0 900 Z"
          fill="#6E2207"
          stroke="#1A1817"
          strokeWidth="3"
        />
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
