import type { SuitPartKey } from './suitStepsConfig';

interface SuitAstronautSvgProps {
  completedParts: readonly SuitPartKey[];
  activePartKey: SuitPartKey | null;
  lastRating: 'PERFECT' | 'GOOD' | 'MISS' | null;
  suitPressurePsi: number;
}

const TARGET_RETICLE: Record<SuitPartKey, { x: number; y: number; r: number }> = {
  cooling: { x: 170, y: 185, r: 44 },
  boots: { x: 170, y: 374, r: 50 },
  torso: { x: 170, y: 190, r: 62 },
  gloves: { x: 170, y: 274, r: 102 },
  helmet: { x: 170, y: 78, r: 48 },
  backpack: { x: 170, y: 180, r: 74 },
};

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

  const ratingClass =
    lastRating === 'PERFECT'
      ? 'suit-svg--perfect'
      : lastRating === 'GOOD'
        ? 'suit-svg--good'
        : lastRating === 'MISS'
          ? 'suit-svg--miss'
          : '';

  const reticle = activePartKey ? TARGET_RETICLE[activePartKey] : null;
  const psiPct = Math.max(0, Math.min(100, Math.round((suitPressurePsi / 4.3) * 100)));

  return (
    <div className={`suit-astronaut-viewport ${ratingClass}`.trim()}>
      <svg
        viewBox="0 0 340 440"
        className="suit-astronaut-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Visualizador del traje espacial de astronauta"
      >
        <defs>
          <linearGradient id="suitAirlockBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#121e33" />
            <stop offset="72%" stopColor="#1b2a44" />
            <stop offset="100%" stopColor="#261c1a" />
          </linearGradient>

          <linearGradient id="suitHull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbf7ed" />
            <stop offset="55%" stopColor="#e6decb" />
            <stop offset="100%" stopColor="#bdb39f" />
          </linearGradient>

          <linearGradient id="suitShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ede6d6" />
            <stop offset="100%" stopColor="#a99f8d" />
          </linearGradient>

          <linearGradient id="plssShell" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8e0e8" />
            <stop offset="100%" stopColor="#7f8b99" />
          </linearGradient>

          <linearGradient id="goldVisor" x1="15%" y1="5%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="32%" stopColor="#f59e0b" />
            <stop offset="72%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          <linearGradient id="bootMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="underSuit" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a6e" />
            <stop offset="100%" stopColor="#0f2347" />
          </linearGradient>

          <filter id="glowCyan" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cámara de esclusa técnica */}
        <rect x="6" y="6" width="328" height="428" rx="14" fill="url(#suitAirlockBg)" stroke="#1a1817" strokeWidth="3" />
        <g opacity="0.16" stroke="#7dd3fc" strokeWidth="1">
          <line x1="20" y1="78" x2="320" y2="78" />
          <line x1="20" y1="158" x2="320" y2="158" />
          <line x1="20" y1="238" x2="320" y2="238" />
          <line x1="20" y1="318" x2="320" y2="318" />
          <line x1="95" y1="18" x2="95" y2="395" />
          <line x1="170" y1="18" x2="170" y2="395" strokeDasharray="4 4" />
          <line x1="245" y1="18" x2="245" y2="395" />
        </g>

        {/* Cabecera técnica en el SVG */}
        <text x="20" y="27" fill="#93c5fd" fontFamily="IBM Plex Mono, monospace" fontSize="10" fontWeight="700">
          xEMU-09 // ARES EVA BAY
        </text>
        <text x="320" y="27" textAnchor="end" fill={suitPressurePsi >= 4.0 ? '#4ade80' : '#fbbf24'} fontFamily="IBM Plex Mono, monospace" fontSize="10" fontWeight="700">
          {suitPressurePsi.toFixed(1)} PSI
        </text>

        {/* Pedestal de esclusa */}
        <ellipse cx="170" cy="402" rx="92" ry="13" fill="#0d1524" stroke="#475569" strokeWidth="2.5" />
        <ellipse cx="170" cy="400" rx="72" ry="7" fill="none" stroke={hasHelmet ? '#4ade80' : '#38bdf8'} strokeWidth="1.5" strokeDasharray="6 4" />

        {/* === CAPA 0 (SIEMPRE VISIBLE): MOCHILA PLSS DETRÁS === */}
        <g
          className={`suit-layer suit-layer--backpack ${hasBackpack ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'backpack' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Antena UHF */}
          <line x1="234" y1="64" x2="234" y2="128" stroke={hasBackpack ? '#f8fafc' : '#64748b'} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="234" cy="61" r="4.5" fill={hasBackpack ? '#fc3d21' : '#475569'} stroke="#1a1817" strokeWidth="1.8" />

          {/* Bastidor del PLSS */}
          <rect
            x="92"
            y="108"
            width="156"
            height="146"
            rx="16"
            fill={hasBackpack ? 'url(#plssShell)' : '#253247'}
            stroke={hasBackpack ? '#1a1817' : '#475569'}
            strokeWidth={hasBackpack ? '3.5' : '2'}
          />
          {/* Tanques laterales de O2 y refrigerante */}
          <rect x="84" y="128" width="16" height="96" rx="7" fill={hasBackpack ? '#cbd5e1' : '#1e293b'} stroke="#1a1817" strokeWidth="2" />
          <rect x="240" y="128" width="16" height="96" rx="7" fill={hasBackpack ? '#cbd5e1' : '#1e293b'} stroke="#1a1817" strokeWidth="2" />
          <circle cx="92" cy="144" r="3" fill={hasBackpack ? '#38bdf8' : '#475569'} />
          <circle cx="248" cy="144" r="3" fill={hasBackpack ? '#22c55e' : '#475569'} />
        </g>

        {/* === SILUETA BASE DEL ASTRONAUTA (MONO DE VUELO AZUL NASA) === */}
        <g id="astronaut-base-figure">
          {/* Cuello y cabeza del astronauta (antes de cerrar casco) */}
          <rect x="157" y="96" width="26" height="20" rx="8" fill="#e5b899" stroke="#1a1817" strokeWidth="2" />
          <circle cx="170" cy="76" r="24" fill="#f1c5a8" stroke="#1a1817" strokeWidth="2.5" />
          {/* Pelo y visera de gorro de comunicaciones (Snoopy cap) */}
          <path d="M146 76 Q146 49 170 49 Q194 49 194 76 L190 72 Q170 60 150 72 Z" fill="#1e293b" stroke="#1a1817" strokeWidth="2" />
          <path d="M144 74 L147 84 M196 74 L193 84" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          {/* Ojos, cejas y sonrisa decidida */}
          <circle cx="161" cy="77" r="2.3" fill="#1a1817" />
          <circle cx="179" cy="77" r="2.3" fill="#1a1817" />
          <path d="M157 71 Q161 69 165 71 M175 71 Q179 69 183 71" fill="none" stroke="#1a1817" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M164 87 Q170 91 176 87" fill="none" stroke="#854d38" strokeWidth="2" strokeLinecap="round" />

          {/* Mono de vuelo base (brazos, torso y piernas) */}
          <path
            d="M126 122 Q170 112 214 122 L238 148 L254 252 L232 256 L216 176 L214 250 L204 366 L178 366 L174 268 L166 268 L162 366 L136 366 L126 250 L124 176 L108 256 L86 252 L102 148 Z"
            fill="url(#underSuit)"
            stroke="#0b1528"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Cremallera central y bolsillos del mono */}
          <line x1="170" y1="120" x2="170" y2="245" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.65" />
          <circle cx="145" cy="155" r="8" fill="#0b3d91" stroke="#f8fafc" strokeWidth="1.4" />
        </g>

        {/* === CAPA 1: ROPA INTERIOR DE REFRIGERACIÓN LCVG === */}
        <g
          className={`suit-layer suit-layer--cooling ${hasCooling ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'cooling' ? 'suit-layer--targeting' : ''
          }`}
        >
          <g
            fill="none"
            stroke={hasCooling ? '#38bdf8' : '#334155'}
            strokeWidth={hasCooling ? '3' : '1.5'}
            strokeLinecap="round"
            filter={hasCooling ? 'url(#glowCyan)' : undefined}
            opacity={hasCooling ? 0.95 : 0.45}
          >
            {/* Serpentín térmico pecho y abdomen */}
            <path d="M138 140 C156 146, 184 146, 202 140" />
            <path d="M136 158 C156 164, 184 164, 204 158" />
            <path d="M138 176 C158 182, 182 182, 202 176" />
            <path d="M140 194 C158 200, 182 200, 200 194" />
            <path d="M142 214 C160 220, 180 220, 198 214" />
            {/* Vías hacia brazos y piernas */}
            <path d="M132 142 Q112 182 99 242" />
            <path d="M208 142 Q228 182 241 242" />
            <path d="M152 225 Q150 288 149 348" />
            <path d="M188 225 Q190 288 191 348" />
          </g>
          {/* Válvula distribuidora ventral */}
          <circle
            cx="170"
            cy="208"
            r="9"
            fill={hasCooling ? '#0284c7' : '#1e293b'}
            stroke={hasCooling ? '#bae6fd' : '#475569'}
            strokeWidth="2.5"
          />
          <circle cx="170" cy="208" r="3" fill={hasCooling ? '#e0f2fe' : '#475569'} />
        </g>

        {/* === CAPA 2: BLINDAJE DE TORSO Y PANTALÓN PRESURIZADO (HUT + TMG) === */}
        <g
          className={`suit-layer suit-layer--torso ${hasTorso ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'torso' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Pantalón térmico articulado (LTA) */}
          <path
            d="M124 236 L216 236 L207 354 L177 354 L173 272 L167 272 L163 354 L133 354 Z"
            fill={hasTorso ? 'url(#suitShade)' : '#1e293b'}
            stroke={hasTorso ? '#1a1817' : '#475569'}
            strokeWidth={hasTorso ? '3' : '1.5'}
            strokeLinejoin="round"
          />
          {/* Fuelles articulados en rodillas */}
          <path d="M136 298 H164 M136 306 H164 M176 298 H204 M176 306 H204" stroke={hasTorso ? '#78716c' : '#334155'} strokeWidth="2.5" />
          {/* Franjas rojas de comandante en perneras */}
          {hasTorso && (
            <>
              <rect x="133" y="256" width="6" height="28" rx="2" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.2" />
              <rect x="201" y="256" width="6" height="28" rx="2" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.2" />
            </>
          )}

          {/* Mangas articuladas exteriores */}
          <path
            d="M124 124 L94 148 L78 248 L106 254 L124 176 Z"
            fill={hasTorso ? 'url(#suitHull)' : '#243044'}
            stroke={hasTorso ? '#1a1817' : '#475569'}
            strokeWidth={hasTorso ? '3' : '1.5'}
            strokeLinejoin="round"
          />
          <path
            d="M216 124 L246 148 L262 248 L234 254 L216 176 Z"
            fill={hasTorso ? 'url(#suitHull)' : '#243044'}
            stroke={hasTorso ? '#1a1817' : '#475569'}
            strokeWidth={hasTorso ? '3' : '1.5'}
            strokeLinejoin="round"
          />
          {/* Franjas rojas en hombros */}
          {hasTorso && (
            <>
              <rect x="94" y="164" width="22" height="7" rx="2" transform="rotate(-16 105 167)" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.4" />
              <rect x="224" y="164" width="22" height="7" rx="2" transform="rotate(16 235 167)" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.4" />
            </>
          )}

          {/* Coraza rígida superior (HUT) */}
          <path
            d="M124 118 Q170 107 216 118 L224 162 L214 236 Q170 245 126 236 L116 162 Z"
            fill={hasTorso ? 'url(#suitHull)' : '#263348'}
            stroke={hasTorso ? '#1a1817' : '#475569'}
            strokeWidth={hasTorso ? '3.5' : '2'}
            strokeLinejoin="round"
          />
          {/* Cinturón metálico de sellado (Waist Bearing) */}
          <rect
            x="124"
            y="226"
            width="92"
            height="14"
            rx="5"
            fill={hasTorso ? '#64748b' : '#1e293b'}
            stroke="#1a1817"
            strokeWidth="2.5"
          />
          <rect x="160" y="224" width="20" height="18" rx="3" fill={hasTorso ? '#f59e0b' : '#334155'} stroke="#1a1817" strokeWidth="2" />

          {/* Módulo frontal DCM (Display & Control Module) */}
          <rect
            x="140"
            y="144"
            width="60"
            height="54"
            rx="7"
            fill={hasTorso ? '#f5efe0' : '#1e293b'}
            stroke="#1a1817"
            strokeWidth="2.5"
          />
          <rect x="147" y="151" width="46" height="14" rx="2.5" fill={hasTorso ? '#0f172a' : '#0f172a'} stroke="#1a1817" strokeWidth="1.5" />
          <rect x="150" y="155" width={hasTorso ? '24' : '10'} height="6" rx="1" fill={hasTorso ? '#22c55e' : '#334155'} />
          <rect x="177" y="155" width="12" height="6" rx="1" fill={hasTorso ? '#38bdf8' : '#334155'} />

          {/* Botonera y conectores DCM */}
          <rect x="148" y="172" width="11" height="14" rx="2" fill={hasTorso ? '#fc3d21' : '#334155'} stroke="#1a1817" strokeWidth="1.5" />
          <rect x="164" y="172" width="12" height="14" rx="2" fill={hasTorso ? '#0b3d91' : '#334155'} stroke="#1a1817" strokeWidth="1.5" />
          <rect x="181" y="172" width="11" height="14" rx="2" fill={hasTorso ? '#facc15' : '#334155'} stroke="#1a1817" strokeWidth="1.5" />

          {/* Parche circular de misión NASA / ARES en pecho izquierdo */}
          <circle cx="204" cy="134" r="9" fill={hasTorso ? '#0b3d91' : '#1e293b'} stroke="#1a1817" strokeWidth="1.6" />
          {hasTorso && <path d="M198 136 L204 128 L210 137" fill="none" stroke="#fc3d21" strokeWidth="2" strokeLinecap="round" />}
        </g>

        {/* === CAPA 3: BOTAS LUNARES / MARCIANAS === */}
        <g
          className={`suit-layer suit-layer--boots ${hasBoots ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'boots' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Anillos de acople de tobillos */}
          <rect x="131" y="346" width="34" height="9" rx="3" fill={hasBoots ? '#94a3b8' : '#334155'} stroke="#1a1817" strokeWidth="2" />
          <rect x="175" y="346" width="34" height="9" rx="3" fill={hasBoots ? '#94a3b8' : '#334155'} stroke="#1a1817" strokeWidth="2" />

          {/* Bota izquierda */}
          <path
            d="M131 354 H165 V378 L168 394 Q146 398 118 394 L118 380 Q124 370 131 366 Z"
            fill={hasBoots ? 'url(#bootMetal)' : '#1e293b'}
            stroke={hasBoots ? '#1a1817' : '#475569'}
            strokeWidth={hasBoots ? '3' : '1.5'}
            strokeLinejoin="round"
          />
          <rect x="117" y="390" width="52" height="7" rx="2" fill={hasBoots ? '#0f172a' : '#1e293b'} stroke="#1a1817" strokeWidth="2" />
          <path d="M123 397 H163" stroke={hasBoots ? '#fc3d21' : '#334155'} strokeWidth="2.5" strokeDasharray="5 4" />

          {/* Bota derecha */}
          <path
            d="M175 354 H209 V366 Q216 370 222 380 L222 394 Q194 398 172 394 L175 378 Z"
            fill={hasBoots ? 'url(#bootMetal)' : '#1e293b'}
            stroke={hasBoots ? '#1a1817' : '#475569'}
            strokeWidth={hasBoots ? '3' : '1.5'}
            strokeLinejoin="round"
          />
          <rect x="171" y="390" width="52" height="7" rx="2" fill={hasBoots ? '#0f172a' : '#1e293b'} stroke="#1a1817" strokeWidth="2" />
          <path d="M177 397 H217" stroke={hasBoots ? '#fc3d21' : '#334155'} strokeWidth="2.5" strokeDasharray="5 4" />
        </g>

        {/* === CAPA 4: GUANTES PRESURIZADOS CON ANILLAS METÁLICAS === */}
        <g
          className={`suit-layer suit-layer--gloves ${hasGloves ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'gloves' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Puños rotatorios de aluminio */}
          <rect x="75" y="246" width="32" height="10" rx="4" fill={hasGloves ? '#0b3d91' : '#334155'} stroke="#1a1817" strokeWidth="2" />
          <rect x="233" y="246" width="32" height="10" rx="4" fill={hasGloves ? '#0b3d91' : '#334155'} stroke="#1a1817" strokeWidth="2" />

          {/* Guante izquierdo */}
          <path
            d="M77 256 L105 256 L107 278 Q106 293 92 293 Q73 293 72 276 Z"
            fill={hasGloves ? '#e2e8f0' : '#1e293b'}
            stroke={hasGloves ? '#1a1817' : '#475569'}
            strokeWidth={hasGloves ? '2.8' : '1.5'}
          />
          {/* Guante derecho */}
          <path
            d="M235 256 L263 256 L268 276 Q267 293 248 293 Q234 293 233 278 Z"
            fill={hasGloves ? '#e2e8f0' : '#1e293b'}
            stroke={hasGloves ? '#1a1817' : '#475569'}
            strokeWidth={hasGloves ? '2.8' : '1.5'}
          />
          {hasGloves && (
            <>
              <rect x="76" y="264" width="29" height="5" rx="2" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.2" />
              <rect x="235" y="264" width="29" height="5" rx="2" fill="#fc3d21" stroke="#1a1817" strokeWidth="1.2" />
              <circle cx="84" cy="283" r="2.2" fill="#f59e0b" />
              <circle cx="94" cy="285" r="2.2" fill="#f59e0b" />
              <circle cx="246" cy="285" r="2.2" fill="#f59e0b" />
              <circle cx="256" cy="283" r="2.2" fill="#f59e0b" />
            </>
          )}
        </g>

        {/* === CAPA 5: CASCO DE BURBUJA + VISOR DORADO DE 24K === */}
        <g
          className={`suit-layer suit-layer--helmet ${hasHelmet ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'helmet' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Aro metálico de acople del cuello */}
          <ellipse
            cx="170"
            cy="115"
            rx="38"
            ry="10"
            fill={hasHelmet ? '#475569' : '#253247'}
            stroke={hasHelmet ? '#38bdf8' : '#475569'}
            strokeWidth={hasHelmet ? '3' : '1.5'}
          />

          {/* Burbuja de policarbonato exterior */}
          <circle
            cx="170"
            cy="78"
            r="41"
            fill={hasHelmet ? '#f5efe0' : '#f5efe01a'}
            stroke={hasHelmet ? '#1a1817' : '#64748b'}
            strokeWidth={hasHelmet ? '3.5' : '2'}
            strokeDasharray={hasHelmet ? undefined : '5 4'}
          />

          {/* Visor dorado EVVA reflectante */}
          {hasHelmet && (
            <>
              <path
                d="M138 62 Q170 48 202 62 Q212 92 198 103 Q170 112 142 103 Q128 92 138 62 Z"
                fill="url(#goldVisor)"
                stroke="#1a1817"
                strokeWidth="3"
                filter="url(#glowGold)"
              />
              {/* Reflejo especular y silueta de Marte en el visor */}
              <path
                d="M145 66 Q165 55 190 65"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M144 96 Q170 86 196 96"
                fill="none"
                stroke="#fffbeb"
                strokeWidth="1.6"
                opacity="0.45"
              />
            </>
          )}

          {/* Focos LED laterales del casco */}
          <rect x="123" y="70" width="9" height="16" rx="4" fill={hasHelmet ? '#e2e8f0' : '#334155'} stroke="#1a1817" strokeWidth="2" />
          <rect x="208" y="70" width="9" height="16" rx="4" fill={hasHelmet ? '#e2e8f0' : '#334155'} stroke="#1a1817" strokeWidth="2" />
          {hasHelmet && (
            <>
              <polygon points="122,78 74,62 74,94" fill="#fef08a2a" />
              <polygon points="218,78 266,62 266,94" fill="#fef08a2a" />
            </>
          )}
        </g>

        {/* === RETÍCULA DE OBJETIVO ACTIVO === */}
        {reticle && (
          <g className="suit-target-reticle" pointerEvents="none">
            <circle
              cx={reticle.x}
              cy={reticle.y}
              r={reticle.r}
              fill="none"
              stroke="#fc3d21"
              strokeWidth="2.5"
              strokeDasharray="8 6"
            />
          </g>
        )}

        {/* === BARRA DE PRESIÓN INTEGRADA EN PIE DEL VISUALIZADOR === */}
        <g>
          <rect x="24" y="416" width="292" height="10" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <rect
            x="25.5"
            y="417.5"
            width={Math.max(0, Math.round((289 * psiPct) / 100))}
            height="7"
            rx="3.5"
            fill={psiPct >= 95 ? '#22c55e' : '#38bdf8'}
          />
        </g>
      </svg>
    </div>
  );
}
