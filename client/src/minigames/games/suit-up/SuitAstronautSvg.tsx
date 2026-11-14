import type { SuitPartKey } from './suitStepsConfig';

interface SuitAstronautSvgProps {
  completedParts: readonly SuitPartKey[];
  activePartKey: SuitPartKey | null;
  lastRating: 'PERFECT' | 'GOOD' | 'MISS' | null;
  suitPressurePsi: number;
}

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

  return (
    <div className={`suit-astronaut-viewport ${ratingClass}`.trim()}>
      <svg
        viewBox="0 0 320 440"
        className="suit-astronaut-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Visualizador del traje espacial de astronauta"
      >
        <defs>
          {/* Degradado metálico para el blindaje exterior */}
          <linearGradient id="suitHull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8edf2" />
            <stop offset="50%" stopColor="#c5d1dc" />
            <stop offset="100%" stopColor="#8d9ba8" />
          </linearGradient>

          {/* Degradado dorado para el visor solar de oro de 24k */}
          <linearGradient id="goldVisor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe27a" />
            <stop offset="35%" stopColor="#f5b324" />
            <stop offset="70%" stopColor="#b3780a" />
            <stop offset="100%" stopColor="#ffd859" />
          </linearGradient>

          {/* Degradado azul para el líquido refrigerante LCVG */}
          <linearGradient id="coolantFlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3bf0e4" />
            <stop offset="100%" stopColor="#0080ff" />
          </linearGradient>

          {/* Resplandor para partes activas */}
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- FONDO DE LA ESCLUSA / PLANO RETRO-NASA (SIN FONDO AZUL) --- */}
        <g className="suit-layer--backdrop">
          {/* Marco de plano técnico en crema cálido */}
          <rect x="20" y="10" width="280" height="420" rx="14" fill="#EAE0CA" stroke="#1A1817" strokeWidth="3.5" />
          <line x1="40" y1="10" x2="40" y2="430" stroke="#C6B79B" strokeWidth="1.5" strokeDasharray="6 6" />
          <line x1="280" y1="10" x2="280" y2="430" stroke="#C6B79B" strokeWidth="1.5" strokeDasharray="6 6" />

          {/* Rieles de acople superior */}
          <line x1="65" y1="34" x2="255" y2="34" stroke="#6E6252" strokeWidth="4" />
          <circle cx="80" cy="34" r="5" fill="#463E34" />
          <circle cx="240" cy="34" r="5" fill="#463E34" />

          {/* Indicador de cuadrícula del escáner en sepia suave */}
          <circle cx="160" cy="210" r="126" fill="none" stroke="#C8B99D" strokeWidth="1.5" />
          <circle cx="160" cy="210" r="84" fill="none" stroke="#C8B99D" strokeWidth="1.5" strokeDasharray="5 5" />
        </g>

        {/* --- CAPA 0: SILUETA BASE DEL ASTRONAUTA --- */}
        <g className="suit-layer--mannequin">
          {/* Cabeza interna */}
          <circle cx="160" cy="85" r="28" fill="#5B5349" stroke="#342E27" strokeWidth="2.5" />
          {/* Cuello */}
          <rect x="150" y="112" width="20" height="14" fill="#4F483F" />
          {/* Torso base */}
          <path d="M120 126 L200 126 L192 230 L128 230 Z" fill="#4F483F" stroke="#342E27" strokeWidth="2.5" />
          {/* Brazos base */}
          <path d="M120 130 L85 200 L75 250 L90 252 L100 206 L124 150 Z" fill="#4F483F" stroke="#342E27" strokeWidth="1.5" />
          <path d="M200 130 L235 200 L245 250 L230 252 L220 206 L196 150 Z" fill="#4F483F" stroke="#342E27" strokeWidth="1.5" />
          {/* Piernas base */}
          <path d="M130 230 L124 350 L115 390 L145 390 L152 350 L156 230 Z" fill="#4F483F" stroke="#342E27" strokeWidth="1.5" />
          <path d="M190 230 L196 350 L205 390 L175 390 L168 350 L164 230 Z" fill="#4F483F" stroke="#342E27" strokeWidth="1.5" />
        </g>

        {/* --- CAPA 6 (Detrás del torso): MOCHILA DE SOPORTE VITAL PLSS --- */}
        <g
          className={`suit-layer suit-layer--backpack ${hasBackpack ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'backpack' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Tanque de O2 principal detrás de hombros */}
          <rect
            x="96"
            y="70"
            width="128"
            height="140"
            rx="12"
            fill={hasBackpack ? '#E2D8C4' : '#D5C9B2'}
            stroke={hasBackpack ? '#1A1817' : '#8B7D68'}
            strokeWidth={hasBackpack ? '3.5' : '2'}
          />
          {/* Antena de comunicaciones de alta ganancia */}
          <line
            x1="108"
            y1="70"
            x2="102"
            y2="30"
            stroke={hasBackpack ? '#FC3D21' : '#8B7D68'}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="102" cy="28" r="4.5" fill={hasBackpack ? '#FC3D21' : '#8B7D68'} />
          
          {/* Tanques cilíndricos gemelos de O2 */}
          <rect x="110" y="80" width="45" height="100" rx="8" fill={hasBackpack ? '#C5B89E' : '#BFB29B'} stroke="#1A1817" strokeWidth="1.5" />
          <rect x="165" y="80" width="45" height="100" rx="8" fill={hasBackpack ? '#C5B89E' : '#BFB29B'} stroke="#1A1817" strokeWidth="1.5" />

          {/* Válvula de purga y mangueras */}
          {hasBackpack && (
            <>
              <circle cx="160" cy="78" r="6" fill="#00e5ff" filter="url(#glowCyan)" />
              <path
                d="M100 130 C75 140, 70 180, 110 180"
                fill="none"
                stroke="#4deeea"
                strokeWidth="3"
                strokeDasharray="4 2"
              />
              <path
                d="M220 130 C245 140, 250 180, 210 180"
                fill="none"
                stroke="#4deeea"
                strokeWidth="3"
                strokeDasharray="4 2"
              />
            </>
          )}
        </g>

        {/* --- CAPA 1: PRENDA DE REFRIGERACIÓN LÍQUIDA (LCVG) --- */}
        <g
          className={`suit-layer suit-layer--cooling ${hasCooling ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'cooling' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Tuberías capilares de flujo de agua helada */}
          <path
            d="M135 140 Q160 155 185 140 T135 170 Q160 185 185 170 T135 200 Q160 215 185 200"
            fill="none"
            stroke={hasCooling ? 'url(#coolantFlow)' : '#263345'}
            strokeWidth={hasCooling ? '2.5' : '1'}
            filter={hasCooling ? 'url(#glowCyan)' : undefined}
          />
          {/* Capilares en piernas */}
          <path
            d="M136 240 Q146 290 134 340 M184 240 Q174 290 186 340"
            fill="none"
            stroke={hasCooling ? 'url(#coolantFlow)' : '#263345'}
            strokeWidth={hasCooling ? '2' : '1'}
          />
          {/* Sensor biométrico central de pulso */}
          <circle
            cx="160"
            cy="150"
            r="7"
            fill={hasCooling ? '#4deeea' : '#1f2a3a'}
            stroke="#111622"
            strokeWidth="2"
          />
        </g>

        {/* --- CAPA 2: PANTALONES Y BOTAS PRESURIZADAS (LTA) --- */}
        <g
          className={`suit-layer suit-layer--boots ${hasBoots ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'boots' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Perneras presurizadas */}
          <path
            d="M125 228 L118 348 L108 388 L148 388 L154 348 L158 228 Z"
            fill={hasBoots ? 'url(#suitHull)' : '#9C907D'}
            stroke={hasBoots ? '#1A1817' : '#5E5549'}
            strokeWidth="2"
          />
          <path
            d="M195 228 L202 348 L212 388 L172 388 L166 348 L162 228 Z"
            fill={hasBoots ? 'url(#suitHull)' : '#9C907D'}
            stroke={hasBoots ? '#1A1817' : '#5E5549'}
            strokeWidth="2"
          />

          {/* Fuelle de rodilla acanalado */}
          <line x1="120" y1="290" x2="152" y2="290" stroke="#506175" strokeWidth="3" />
          <line x1="120" y1="296" x2="152" y2="296" stroke="#506175" strokeWidth="3" />
          <line x1="168" y1="290" x2="200" y2="290" stroke="#506175" strokeWidth="3" />
          <line x1="168" y1="296" x2="200" y2="296" stroke="#506175" strokeWidth="3" />

          {/* Botas de regolito macizas con suela reforzada */}
          <path
            d="M98 388 L150 388 L152 408 L94 408 Z"
            fill={hasBoots ? '#3b4859' : '#7A7061'}
            stroke={hasBoots ? '#1A1817' : '#4E463C'}
            strokeWidth="2"
          />
          <path
            d="M170 388 L222 388 L226 408 L168 408 Z"
            fill={hasBoots ? '#3b4859' : '#7A7061'}
            stroke={hasBoots ? '#1A1817' : '#4E463C'}
            strokeWidth="2"
          />

          {/* Suela de tracción con tacos */}
          <rect x="94" y="408" width="58" height="6" fill="#2A2622" />
          <rect x="168" y="408" width="58" height="6" fill="#2A2622" />
        </g>

        {/* --- CAPA 3: TORSO RÍGIDO SUPERIOR (HUT) --- */}
        <g
          className={`suit-layer suit-layer--torso ${hasTorso ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'torso' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Coraza de fibra de vidrio blindada del torso */}
          <path
            d="M112 120 L208 120 L200 234 L120 234 Z"
            fill={hasTorso ? 'url(#suitHull)' : '#A49884'}
            stroke={hasTorso ? '#1A1817' : '#5E5549'}
            strokeWidth={hasTorso ? '2.5' : '1.5'}
          />

          {/* Hombreras reforzadas de acople rotatorio */}
          <path d="M106 122 Q120 110 134 122 Z" fill="#667991" />
          <path d="M186 122 Q200 110 214 122 Z" fill="#667991" />

          {/* Unidad DCM de control en el pecho (Display & Control Module) */}
          <rect
            x="136"
            y="152"
            width="48"
            height="52"
            rx="5"
            fill={hasTorso ? '#233041' : '#18212e'}
            stroke={hasTorso ? '#4deeea' : '#32435b'}
            strokeWidth="2"
          />
          {/* Pantalla LED de telemetría del DCM */}
          <rect x="142" y="158" width="36" height="18" fill="#081018" rx="2" />
          <text
            x="160"
            y="171"
            fill="#4deeea"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            {hasTorso ? `${suitPressurePsi.toFixed(1)} PSI` : '---'}
          </text>

          {/* Interruptores y válvulas manuales en el DCM */}
          <circle cx="147" cy="190" r="4" fill="#e85d43" />
          <circle cx="160" cy="190" r="4" fill="#f5c242" />
          <circle cx="173" cy="190" r="4" fill="#4deeea" />

          {/* Parche de la misión / Emblema NASA */}
          <ellipse cx="188" cy="138" rx="9" ry="7" fill="#104192" />
          <path d="M182 138 Q188 132 194 138 Q188 144 182 138" fill="#e03a3e" />
        </g>

        {/* --- CAPA 4: GUANTES DE EVA Y AROS GIRATORIOS --- */}
        <g
          className={`suit-layer suit-layer--gloves ${hasGloves ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'gloves' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Brazos presurizados */}
          <path
            d="M112 126 L80 196 L70 240 L88 244 L98 202 L120 146 Z"
            fill={hasGloves ? 'url(#suitHull)' : '#9C907D'}
            stroke={hasGloves ? '#1A1817' : '#5E5549'}
            strokeWidth="2"
          />
          <path
            d="M208 126 L240 196 L250 240 L232 244 L222 202 L200 146 Z"
            fill={hasGloves ? 'url(#suitHull)' : '#9C907D'}
            stroke={hasGloves ? '#1A1817' : '#5E5549'}
            strokeWidth="2"
          />

          {/* Aros de muñeca giratorios (Wrist Disconnect Rings) */}
          <rect
            x="66"
            y="238"
            width="24"
            height="8"
            rx="2"
            fill={hasGloves ? '#2070b4' : '#7A7061'}
            stroke={hasGloves ? '#1A1817' : '#4E463C'}
            strokeWidth="1.5"
          />
          <rect
            x="230"
            y="238"
            width="24"
            height="8"
            rx="2"
            fill={hasGloves ? '#c8382c' : '#7A7061'}
            stroke={hasGloves ? '#1A1817' : '#4E463C'}
            strokeWidth="1.5"
          />

          {/* Guantes de EVA con yemas táctiles de alta adherencia */}
          <path
            d="M68 246 L62 278 L78 284 L88 258 L84 246 Z"
            fill={hasGloves ? '#2e3a49' : '#6B6155'}
            stroke={hasGloves ? '#1A1817' : '#4E463C'}
            strokeWidth="2"
          />
          <path
            d="M252 246 L258 278 L242 284 L232 258 L236 246 Z"
            fill={hasGloves ? '#2e3a49' : '#6B6155'}
            stroke={hasGloves ? '#1A1817' : '#4E463C'}
            strokeWidth="2"
          />

          {/* Micro-calefactores en las yemas */}
          {hasGloves && (
            <>
              <circle cx="65" cy="276" r="2.5" fill="#f5c242" />
              <circle cx="70" cy="281" r="2.5" fill="#f5c242" />
              <circle cx="255" cy="276" r="2.5" fill="#f5c242" />
              <circle cx="250" cy="281" r="2.5" fill="#f5c242" />
            </>
          )}
        </g>

        {/* --- CAPA 5: CASCO DE BURBUJA Y VISOR SOLAR DE ORO --- */}
        <g
          className={`suit-layer suit-layer--helmet ${hasHelmet ? 'suit-layer--active' : 'suit-layer--inactive'} ${
            activePartKey === 'helmet' ? 'suit-layer--targeting' : ''
          }`}
        >
          {/* Anillo de acople del cuello (Neck Ring) */}
          <ellipse
            cx="160"
            cy="114"
            rx="34"
            ry="9"
            fill="#2c3a4d"
            stroke={hasHelmet ? '#4deeea' : '#394b63'}
            strokeWidth={hasHelmet ? '3' : '1.5'}
          />

          {/* Casco esférico de policarbonato transparente */}
          <circle
            cx="160"
            cy="78"
            r="38"
            fill={hasHelmet ? '#F5EFE0AA' : '#D9CEB7'}
            stroke={hasHelmet ? '#1A1817' : '#7A6D5C'}
            strokeWidth={hasHelmet ? '3.5' : '2'}
          />

          {/* Visor dorado de 24 quilates extravehicular (EVVA) */}
          {hasHelmet ? (
            <path
              d="M132 64 Q160 52 188 64 Q196 92 184 100 Q160 106 136 100 Q124 92 132 64 Z"
              fill="url(#goldVisor)"
              stroke="#1A1817"
              strokeWidth="2.5"
              filter="url(#glowGold)"
            />
          ) : (
            <ellipse cx="160" cy="80" rx="26" ry="20" fill="#6B6155" stroke="#342E27" strokeWidth="1.5" />
          )}

          {/* Reflejo especular en el visor dorado */}
          {hasHelmet && (
            <path
              d="M138 68 Q154 58 174 66"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}

          {/* Focos LED laterales de exploración EVA */}
          <circle cx="120" cy="74" r="5" fill={hasHelmet ? '#ffffff' : '#283647'} />
          <circle cx="200" cy="74" r="5" fill={hasHelmet ? '#ffffff' : '#283647'} />
          {hasHelmet && (
            <>
              <polygon points="116,74 70,60 70,88" fill="#ffffff22" />
              <polygon points="204,74 250,60 250,88" fill="#ffffff22" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
