import type { SuitPartKey } from './suitStepsConfig';

interface SuitAstronautSvgProps {
  completedParts: readonly SuitPartKey[];
  activePartKey: SuitPartKey | null;
  lastRating: 'PERFECT' | 'GOOD' | 'MISS' | null;
  suitPressurePsi: number;
}

/**
 * Clean Retro-NASA vector astronaut synchronized visually with the HUD crew portraits.
 */
export function SuitAstronautSvg({
  completedParts,
  activePartKey,
  lastRating,
  suitPressurePsi,
}: SuitAstronautSvgProps) {
  const hasCooling = completedParts.includes('cooling');
  const hasBoots = completedParts.includes('boots');
  const hasTorso = completedParts.includes('torso');
  const hasGloves = completedParts.includes('gloves');
  const hasHelmet = completedParts.includes('helmet');
  const hasBackpack = completedParts.includes('backpack');
  const isFullSealed = suitPressurePsi >= 4.2 && hasHelmet && hasBackpack;

  return (
    <svg
      viewBox="0 0 280 360"
      className={`suit-astronaut-svg ${
        lastRating === 'PERFECT'
          ? 'suit-svg--perfect'
          : lastRating === 'MISS'
            ? 'suit-svg--miss'
            : lastRating === 'GOOD'
              ? 'suit-svg--good'
              : ''
      }`}
      role="img"
      aria-label="Astronaut putting on spacesuit"
    >
      {/* Ground shadow / pressurized pad */}
      <ellipse
        cx="140"
        cy="337"
        rx="68"
        ry="10"
        fill={isFullSealed ? '#2e8b57' : '#d8ccb4'}
        fillOpacity={isFullSealed ? 0.28 : 0.72}
      />

      {/* Active step ghost outline ONLY for Backpack */}
      {!hasBackpack && activePartKey === 'backpack' && (
        <rect
          x="84"
          y="102"
          width="112"
          height="108"
          rx="18"
          fill="rgba(252, 61, 33, 0.08)"
          stroke="#fc3d21"
          strokeWidth="3"
          strokeDasharray="7 5"
        />
      )}

      {/* Layer 6: PLSS Backpack (renders behind body) */}
      {hasBackpack && (
        <g>
          <line x1="186" y1="64" x2="186" y2="104" stroke="#1a1817" strokeWidth="4" strokeLinecap="round" />
          <circle cx="186" cy="60" r="4.5" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.5" />
          <rect
            x="84"
            y="102"
            width="112"
            height="108"
            rx="18"
            fill="#d6ccb6"
            stroke="#1a1817"
            strokeWidth="3.5"
          />
          <rect x="92" y="110" width="18" height="12" rx="4" fill="#bcae92" stroke="#1a1817" strokeWidth="2.2" />
          <rect x="170" y="110" width="18" height="12" rx="4" fill="#bcae92" stroke="#1a1817" strokeWidth="2.2" />
        </g>
      )}

      {/* Base Crew Silhouette (Thermal under-suit + NASA Snoopy comms cap) */}
      <g>
        {/* Under-suit legs */}
        <path
          d="M 114 212 L 109 314 Q 109 322 117 322 H 131 Q 136 322 137 314 L 139 240 H 141 L 143 314 Q 144 322 149 322 H 163 Q 171 322 171 314 L 166 212 Z"
          fill="#263242"
          stroke="#1a1817"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        {/* Base crew socks / shoes */}
        <path
          d="M 105 316 H 137 V 328 Q 137 334 130 334 H 104 Q 98 334 98 327 Z"
          fill="#1b222c"
          stroke="#1a1817"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 143 316 H 175 L 182 327 Q 182 334 176 334 H 150 Q 143 334 143 328 Z"
          fill="#1b222c"
          stroke="#1a1817"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Natural curved under-suit arms + bare hands */}
        <path
          d="M 106 126 C 86 132, 76 168, 76 208 L 94 212 C 95 180, 102 158, 114 146 Z"
          fill="#2c3a4b"
          stroke="#1a1817"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M 174 126 C 194 132, 204 168, 204 208 L 186 212 C 185 180, 178 158, 166 146 Z"
          fill="#2c3a4b"
          stroke="#1a1817"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <circle cx="84" cy="217" r="9.5" fill="#f0c199" stroke="#1a1817" strokeWidth="3" />
        <circle cx="196" cy="217" r="9.5" fill="#f0c199" stroke="#1a1817" strokeWidth="3" />

        {/* Sleek under-suit torso */}
        <path
          d="M 104 124 C 114 114, 166 114, 176 124 L 168 214 C 166 220, 114 220, 112 214 Z"
          fill="#2f3e52"
          stroke="#1a1817"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        {/* Under-suit neck collar + chest zipper */}
        <path d="M 140 120 V 214" stroke="#1a1817" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
        <rect x="128" y="112" width="24" height="10" rx="4" fill="#1e293b" stroke="#1a1817" strokeWidth="2.6" />

        {/* Head + Classic NASA Snoopy Comms Cap */}
        <rect x="131" y="96" width="18" height="18" rx="6" fill="#eab68a" stroke="#1a1817" strokeWidth="3" />
        <circle cx="140" cy="76" r="24" fill="#f5c9a4" stroke="#1a1817" strokeWidth="3.3" />

        {/* Snoopy cap crown */}
        <path
          d="M 115 76 C 115 41, 165 41, 165 76 C 155 64, 125 64, 115 76 Z"
          fill="#f5efe0"
          stroke="#1a1817"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Subtle hair fringe */}
        <path
          d="M 124 68 Q 140 62 156 68"
          fill="none"
          stroke="#3b2820"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Comms earcups & mic boom */}
        <rect x="110" y="66" width="9" height="19" rx="4.5" fill="#1f2937" stroke="#1a1817" strokeWidth="2.6" />
        <rect x="161" y="66" width="9" height="19" rx="4.5" fill="#1f2937" stroke="#1a1817" strokeWidth="2.6" />
        <path d="M 114 83 Q 119 92 133 91" fill="none" stroke="#1a1817" strokeWidth="2.4" strokeLinecap="round" />

        {/* Minimal friendly crew face */}
        <circle cx="132" cy="77" r="2.5" fill="#1a1817" />
        <circle cx="148" cy="77" r="2.5" fill="#1a1817" />
        <path d="M 135 87 Q 140 90 145 87" fill="none" stroke="#1a1817" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Layer 1: LCVG Liquid Cooling Tubes */}
      {hasCooling && (
        <g>
          <path
            d="M 118 140 Q 140 152 162 140 M 116 160 Q 140 172 164 160 M 117 180 Q 140 192 163 180 M 119 198 Q 140 208 161 198"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 124 236 L 122 302 M 156 236 L 158 302 M 96 154 L 86 196 M 184 154 L 194 196"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>
      )}
      {!hasCooling && activePartKey === 'cooling' && (
        <path
          d="M 118 144 Q 140 156 162 144 M 116 166 Q 140 178 164 166 M 118 188 Q 140 200 162 188"
          fill="none"
          stroke="#fc3d21"
          strokeWidth="3"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
      )}

      {/* Layer 2: EVA Pants & Lunar/Mars Boots */}
      {hasBoots ? (
        <g>
          <path
            d="M 110 212 H 170 L 176 312 H 146 L 141 244 H 139 L 134 312 H 104 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Knee red trim */}
          <rect x="108" y="264" width="28" height="9" rx="3" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.4" />
          <rect x="144" y="264" width="28" height="9" rx="3" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.4" />
          {/* Heavy EVA boots */}
          <path
            d="M 98 310 H 138 V 326 Q 138 335 129 335 H 96 Q 87 335 87 325 Z"
            fill="#dfd3bc"
            stroke="#1a1817"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 142 310 H 182 L 193 325 Q 193 335 184 335 H 151 Q 142 335 142 326 Z"
            fill="#dfd3bc"
            stroke="#1a1817"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Boot soles */}
          <path d="M 88 329 H 137" stroke="#1a1817" strokeWidth="4" strokeLinecap="round" />
          <path d="M 143 329 H 192" stroke="#1a1817" strokeWidth="4" strokeLinecap="round" />
        </g>
      ) : (
        activePartKey === 'boots' && (
          <g fill="rgba(252, 61, 33, 0.08)" stroke="#fc3d21" strokeWidth="2.8" strokeDasharray="6 5">
            <path d="M 98 310 H 138 V 334 H 88 Z" />
            <path d="M 142 310 H 182 L 192 334 H 142 Z" />
          </g>
        )
      )}

      {/* Layer 3: Hard Upper Torso (HUT) & Pressurized Sleeves */}
      {hasTorso ? (
        <g>
          {/* Pressurized EVA Sleeves */}
          <path
            d="M 105 122 C 82 128, 70 166, 71 208 L 95 212 C 96 178, 102 154, 114 144 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 175 122 C 198 128, 210 166, 209 208 L 185 212 C 184 178, 178 154, 166 144 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Shoulder stripes */}
          <path d="M 82 156 L 101 161" stroke="#0b3d91" strokeWidth="5" strokeLinecap="round" />
          <path d="M 198 156 L 179 161" stroke="#0b3d91" strokeWidth="5" strokeLinecap="round" />

          {/* Hard Upper Torso Shell */}
          <path
            d="M 98 126 C 102 110, 178 110, 182 126 L 174 214 C 172 222, 108 222, 106 214 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />

          {/* Chest Display & Control Module (DCM) */}
          <rect
            x="118"
            y="138"
            width="44"
            height="34"
            rx="6"
            fill="#dfd3bc"
            stroke="#1a1817"
            strokeWidth="3"
          />
          <rect x="124" y="145" width="14" height="10" rx="2" fill="#0b3d91" stroke="#1a1817" strokeWidth="1.5" />
          <rect x="142" y="145" width="14" height="10" rx="2" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.5" />
          <rect x="124" y="160" width="32" height="5" rx="2" fill="#1a1817" />

          {/* Waist Locking Ring */}
          <rect
            x="105"
            y="204"
            width="70"
            height="13"
            rx="5"
            fill="#0b3d91"
            stroke="#1a1817"
            strokeWidth="3"
          />
          <rect x="133" y="203" width="14" height="15" rx="3" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.4" />
        </g>
      ) : (
        activePartKey === 'torso' && (
          <path
            d="M 98 126 C 102 110, 178 110, 182 126 L 174 214 C 172 222, 108 222, 106 214 Z"
            fill="rgba(252, 61, 33, 0.08)"
            stroke="#fc3d21"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
        )
      )}

      {/* Layer 4: EVA Gloves */}
      {hasGloves ? (
        <g>
          <rect x="69" y="202" width="27" height="9" rx="4" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.8" />
          <rect x="70" y="210" width="23" height="20" rx="10" fill="#dfd3bc" stroke="#1a1817" strokeWidth="3.4" />
          <rect x="184" y="202" width="27" height="9" rx="4" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.8" />
          <rect x="187" y="210" width="23" height="20" rx="10" fill="#dfd3bc" stroke="#1a1817" strokeWidth="3.4" />
        </g>
      ) : (
        activePartKey === 'gloves' && (
          <g fill="rgba(252, 61, 33, 0.08)" stroke="#fc3d21" strokeWidth="2.8" strokeDasharray="5 5">
            <circle cx="82" cy="218" r="15" />
            <circle cx="198" cy="218" r="15" />
          </g>
        )
      )}

      {/* Layer 5: EVA Helmet & Glossy Black Visor (matches HUD portrait icon) */}
      {hasHelmet ? (
        <g>
          {/* Red neck disconnect ring */}
          <rect x="114" y="104" width="52" height="12" rx="6" fill="#fc3d21" stroke="#1a1817" strokeWidth="3.2" />
          {/* Side ear pods */}
          <rect x="97" y="64" width="9" height="18" rx="4.5" fill="#f5efe0" stroke="#1a1817" strokeWidth="3" />
          <rect x="174" y="64" width="9" height="18" rx="4.5" fill="#f5efe0" stroke="#1a1817" strokeWidth="3" />
          {/* Helmet dome */}
          <circle cx="140" cy="73" r="35" fill="#f5efe0" stroke="#1a1817" strokeWidth="3.6" />
          {/* Pure dark visor */}
          <rect x="113" y="53" width="54" height="37" rx="17" fill="#111111" stroke="#1a1817" strokeWidth="3" />
          {/* Minimal visor specular highlight */}
          <path
            d="M 121 64 C 126 59, 134 58, 143 60"
            fill="none"
            stroke="#f5efe0"
            strokeWidth="3.4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      ) : (
        activePartKey === 'helmet' && (
          <circle
            cx="140"
            cy="73"
            r="36"
            fill="rgba(252, 61, 33, 0.08)"
            stroke="#fc3d21"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
        )
      )}
    </svg>
  );
}
