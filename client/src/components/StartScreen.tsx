import MarsBackdrop from './MarsBackdrop';
import './StartScreen.css';

export interface StartScreenProps {
  onCreateScreen: () => void;
  onJoinScreen: () => void;
  onOpenTest: () => void;
}

export default function StartScreen({
  onCreateScreen,
  onJoinScreen,
  onOpenTest,
}: StartScreenProps) {
  return (
    <section className="start-screen" aria-label="Compete For Mars">
      <MarsBackdrop />

      {/* Sutil atmósfera / cuadrícula CRT Retro-NASA */}
      <div className="start-screen__aura-glow" aria-hidden="true" />
      <div className="start-screen__scanlines" aria-hidden="true" />

      <div className="start-screen__hud">
        <header className="start-screen__top">
          <div className="start-screen__top-left">
            <span className="start-screen__stamp">NASA // ARES SECTOR OUTPOST</span>
            <span className="start-screen__live-pill">
              <span className="start-screen__led" aria-hidden="true" />
              ORBITAL UPLINK READY
            </span>
          </div>
          <button
            type="button"
            className="start-screen__test-btn"
            onClick={onOpenTest}
          >
            TEST LAB
          </button>
        </header>

        <div className="start-screen__center">
          <div className="start-screen__hero-card">
            <div className="start-screen__card-meta">
              <span className="start-screen__kicker">EXPEDITION SOL-014 · JEZERO CRATER</span>
              <span className="start-screen__patch-code">STS-MARS IV</span>
            </div>

            <h1 className="start-screen__title">
              COMPETE <span className="start-screen__title-accent">FOR MARS</span>
            </h1>

            <p className="start-screen__subtitle">
              Coordina o sabotea a tu tripulación en la base marciana. Gestiona energía, comida y radiación para sobrevivir cada ronda.
            </p>

            <div className="start-screen__specs" aria-hidden="true">
              <div className="start-screen__spec">
                <span>CREW</span>
                <b>1–4 PILOTS</b>
              </div>
              <div className="start-screen__spec">
                <span>SECTOR</span>
                <b>ARES BASE 04</b>
              </div>
              <div className="start-screen__spec">
                <span>THREAT</span>
                <b>SOLAR RAD</b>
              </div>
            </div>

            <nav className="start-screen__menu" aria-label="Main menu">
              <button
                type="button"
                className="start-screen__btn start-screen__btn--primary"
                onClick={onCreateScreen}
              >
                <span className="start-screen__btn-sheen" aria-hidden="true" />
                CREATE ROOM →
              </button>
              <button
                type="button"
                className="start-screen__btn start-screen__btn--secondary"
                onClick={onJoinScreen}
              >
                JOIN ROOM →
              </button>
            </nav>
          </div>

          {/* Emblema / Radar Orbital animado para darle aura espacial */}
          <aside className="start-screen__orbital-crest" aria-hidden="true">
            <div className="orbital-crest__frame">
              <svg className="orbital-crest__svg" viewBox="0 0 320 320">
                <defs>
                  <radialGradient id="mars-crest-core" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#F4894D" />
                    <stop offset="55%" stopColor="#FC3D21" />
                    <stop offset="100%" stopColor="#7C1E0B" />
                  </radialGradient>
                  <linearGradient id="radar-sweep-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F5C242" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#F5C242" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Anillos exteriores de telemetría */}
                <circle cx="160" cy="160" r="144" fill="rgba(11, 25, 44, 0.62)" stroke="#F5EFE0" strokeWidth="2.5" strokeOpacity="0.45" />
                <circle
                  className="orbital-crest__ring-outer"
                  cx="160"
                  cy="160"
                  r="132"
                  fill="none"
                  stroke="#F5C242"
                  strokeWidth="2.5"
                  strokeDasharray="16 10 5 10"
                />
                <circle
                  className="orbital-crest__ring-inner"
                  cx="160"
                  cy="160"
                  r="102"
                  fill="none"
                  stroke="#F5EFE0"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  strokeOpacity="0.65"
                />
                <circle cx="160" cy="160" r="68" fill="none" stroke="#FC3D21" strokeWidth="1.8" strokeOpacity="0.55" />

                {/* Ejes de mira */}
                <line x1="160" y1="16" x2="160" y2="304" stroke="#F5EFE0" strokeOpacity="0.22" strokeWidth="1.5" />
                <line x1="16" y1="160" x2="304" y2="160" stroke="#F5EFE0" strokeOpacity="0.22" strokeWidth="1.5" />

                {/* Barrido de radar rotatorio */}
                <g className="orbital-crest__sweep">
                  <path d="M160 160 L160 28 A132 132 0 0 1 274 94 Z" fill="url(#radar-sweep-grad)" />
                  <line x1="160" y1="160" x2="160" y2="28" stroke="#F5C242" strokeWidth="2.5" />
                </g>

                {/* Marte central */}
                <circle cx="160" cy="160" r="46" fill="url(#mars-crest-core)" stroke="#1A1817" strokeWidth="3.5" />
                <path d="M128 148 Q156 138 192 152" fill="none" stroke="#8C2D04" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
                <circle cx="146" cy="146" r="6" fill="#9A3209" stroke="#1A1817" strokeWidth="1.6" />
                <circle cx="174" cy="176" r="8" fill="#7A2506" stroke="#1A1817" strokeWidth="1.6" />

                {/* Trayectoria elíptica de nave + baliza en movimiento */}
                <ellipse
                  cx="160"
                  cy="160"
                  rx="116"
                  ry="40"
                  transform="rotate(-24 160 160)"
                  fill="none"
                  stroke="#F5EFE0"
                  strokeWidth="2.5"
                  strokeDasharray="10 6"
                />
                <g className="orbital-crest__probe">
                  <circle cx="160" cy="28" r="7" fill="#F5C242" stroke="#1A1817" strokeWidth="2.5" />
                </g>
              </svg>

              <div className="orbital-crest__readout">
                <span>APOAPSIS 412 KM</span>
                <span>LAT 18.38°N · LON 77.58°E</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="start-screen__footer">
          <span className="start-screen__brand">C-MOON DYNAMICS · RETRO-NASA TELEMETRY</span>
          <span className="start-screen__telemetry-feed">SOL-014 // ALL SYSTEMS NOMINAL</span>
        </footer>
      </div>
    </section>
  );
}
