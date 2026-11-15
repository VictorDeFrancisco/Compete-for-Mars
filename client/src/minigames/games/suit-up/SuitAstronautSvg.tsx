import type { SuitPartKey } from './suitStepsConfig';

interface SuitAstronautSvgProps {
  completedParts: readonly SuitPartKey[];
  activePartKey: SuitPartKey | null;
  lastRating: 'PERFECT' | 'GOOD' | 'MISS' | null;
  suitPressurePsi: number;
}

const TARGET_RETICLE: Record<SuitPartKey, { x: number; y: number; r: number }> = {
  cooling: { x: 150, y: 175, r: 42 },
  boots: { x: 150, y: 318, r: 46 },
  torso: { x: 150, y: 175, r: 54 },
  gloves: { x: 150, y: 245, r: 88 },
  helmet: { x: 150, y: 78, r: 46 },
  backpack: { x: 150, y: 170, r: 66 },
};

/**
 * Ilustración vectorial minimalista del astronauta por capas (sin filtros ni adornos recargados).
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
  const reticle = activePartKey ? TARGET_RETICLE[activePartKey] : null;

  return (
    <svg
      viewBox="0 0 300 390"
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
      aria-label="Astronauta poniéndose el traje espacial"
    >
      {/* Tarima mínima */}
      <ellipse
        cx="150"
        cy="366"
        rx="74"
        ry="9"
        fill={isFullSealed ? '#2f855a' : '#d8ccb4'}
        fillOpacity={isFullSealed ? 0.25 : 0.7}
      />

      {/* Mochila trasera (PLSS) */}
      <g>
        {hasBackpack ? (
          <g>
            <rect
              x="76"
              y="108"
              width="148"
              height="122"
              rx="18"
              fill="#d6ccb6"
              stroke="#1a1817"
              strokeWidth="4"
            />
            <line x1="214" y1="68" x2="214" y2="108" stroke="#1a1817" strokeWidth="4" strokeLinecap="round" />
            <circle cx="214" cy="64" r="5" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.5" />
          </g>
        ) : (
          <rect
            x="76"
            y="108"
            width="148"
            height="122"
            rx="18"
            fill="none"
            stroke="#c5b89e"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
        )}
      </g>

      {/* Silueta base minimalista */}
      <g>
        <path
          d="M 118 228 L 112 342 L 136 342 L 146 250 L 154 250 L 164 342 L 188 342 L 182 228 Z"
          fill="#2d3748"
          stroke="#1a1817"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <rect
          x="108"
          y="124"
          width="84"
          height="110"
          rx="20"
          fill="#374151"
          stroke="#1a1817"
          strokeWidth="3.5"
        />
        <path
          d="M 108 134 L 74 226 L 94 234 L 116 164 Z"
          fill="#374151"
          stroke="#1a1817"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 192 134 L 226 226 L 206 234 L 184 164 Z"
          fill="#374151"
          stroke="#1a1817"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="78" cy="236" r="11" fill="#eab68a" stroke="#1a1817" strokeWidth="3" />
        <circle cx="222" cy="236" r="11" fill="#eab68a" stroke="#1a1817" strokeWidth="3" />

        {/* Cabeza simplificada */}
        <rect x="139" y="106" width="22" height="20" rx="6" fill="#eab68a" stroke="#1a1817" strokeWidth="3" />
        <circle cx="150" cy="78" r="28" fill="#f3c69f" stroke="#1a1817" strokeWidth="3.5" />
        <path
          d="M 124 72 C 126 52, 174 52, 176 72 C 166 64, 134 64, 124 72 Z"
          fill="#2c221e"
        />
      </g>

      {/* Capa 1: Refrigeración LCVG */}
      {hasCooling && (
        <g>
          <path
            d="M 118 148 Q 150 162 182 148 M 116 172 Q 150 186 184 172 M 118 196 Q 150 210 182 196"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 124 252 L 122 316 M 176 252 L 178 316"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Capa 2: Pantalones y Botas EVA */}
      {hasBoots ? (
        <g>
          <path
            d="M 110 226 L 104 334 L 140 334 L 146 252 L 154 252 L 160 334 L 196 334 L 190 226 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect x="108" y="280" width="32" height="10" rx="3" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.5" />
          <rect x="160" y="280" width="32" height="10" rx="3" fill="#fc3d21" stroke="#1a1817" strokeWidth="2.5" />
          <path
            d="M 98 334 H 142 V 352 Q 142 360 132 360 H 98 Q 88 360 88 348 Z"
            fill="#d8ccb4"
            stroke="#1a1817"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 158 334 H 202 L 212 348 Q 212 360 202 360 H 168 Q 158 360 158 352 Z"
            fill="#d8ccb4"
            stroke="#1a1817"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
      ) : (
        <path
          d="M 102 334 H 142 V 358 H 90 Z M 158 334 H 198 L 210 358 H 158 Z"
          fill="none"
          stroke="#c5b89e"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
      )}

      {/* Capa 3: Torso y Brazos Presurizados */}
      {hasTorso ? (
        <g>
          <path
            d="M 106 130 L 66 226 L 94 236 L 116 174 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 194 130 L 234 226 L 206 236 L 184 174 Z"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <rect
            x="98"
            y="120"
            width="104"
            height="112"
            rx="24"
            fill="#f5efe0"
            stroke="#1a1817"
            strokeWidth="4"
          />
          {/* Panel frontal limpio */}
          <rect
            x="126"
            y="148"
            width="48"
            height="36"
            rx="7"
            fill="#dfd3bc"
            stroke="#1a1817"
            strokeWidth="3"
          />
          <rect x="133" y="156" width="14" height="10" rx="2" fill="#0b3d91" />
          <rect x="153" y="156" width="14" height="10" rx="2" fill="#fc3d21" />
          <rect x="133" y="172" width="34" height="5" rx="2" fill="#1a1817" />
          {/* Cinturón */}
          <rect
            x="100"
            y="218"
            width="100"
            height="14"
            rx="5"
            fill="#0b3d91"
            stroke="#1a1817"
            strokeWidth="3.5"
          />
        </g>
      ) : (
        <rect
          x="98"
          y="120"
          width="104"
          height="112"
          rx="24"
          fill="none"
          stroke="#c5b89e"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
      )}

      {/* Capa 4: Guantes EVA */}
      {hasGloves ? (
        <g>
          <rect x="64" y="218" width="28" height="9" rx="4" fill="#fc3d21" stroke="#1a1817" strokeWidth="3" />
          <circle cx="76" cy="240" r="14" fill="#e5dcc7" stroke="#1a1817" strokeWidth="4" />
          <rect x="208" y="218" width="28" height="9" rx="4" fill="#fc3d21" stroke="#1a1817" strokeWidth="3" />
          <circle cx="224" cy="240" r="14" fill="#e5dcc7" stroke="#1a1817" strokeWidth="4" />
        </g>
      ) : (
        <g fill="none" stroke="#c5b89e" strokeWidth="2.5" strokeDasharray="5 5">
          <circle cx="76" cy="240" r="14" />
          <circle cx="224" cy="240" r="14" />
        </g>
      )}

      {/* Capa 5: Casco y Visor */}
      {hasHelmet ? (
        <g>
          <rect x="120" y="110" width="60" height="12" rx="6" fill="#fc3d21" stroke="#1a1817" strokeWidth="3.5" />
          <circle cx="150" cy="76" r="40" fill="#f5efe0" stroke="#1a1817" strokeWidth="4" />
          <rect x="119" y="54" width="62" height="42" rx="20" fill="#f59e0b" stroke="#1a1817" strokeWidth="3.5" />
          <path
            d="M 129 66 Q 140 58 158 62"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <circle
          cx="150"
          cy="76"
          r="40"
          fill="none"
          stroke="#c5b89e"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
      )}

      {/* Retícula simple de paso activo */}
      {reticle && (
        <g className="suit-svg-reticle">
          <circle
            cx={reticle.x}
            cy={reticle.y}
            r={reticle.r}
            fill="none"
            stroke="#fc3d21"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
        </g>
      )}
    </svg>
  );
}
