import { useRef, useState, type CSSProperties } from 'react';
import type { Stats } from '../../../shared/types';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import { PROFESSIONS, sameStats, type Profession } from './professions';
import './RoomEntryScreen.css';

export interface RoomEntryScreenProps {
  mode: 'create' | 'join';
  connected: boolean;
  error: string;
  name: string;
  stats: Stats;
  onName: (name: string) => void;
  onStats: (stats: Stats) => void;
  onSubmit: (code?: string) => void;
  onSwitchMode: (mode: 'create' | 'join') => void;
  onBack: () => void;
}

const STAT_STEPS = 3;
const STAT_STEP_VALUE = 10;

const STARS = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  left: `${((index * 73 + 11) % 98) + 1}%`,
  top: `${((index * 37 + 5) % 48) + 2}%`,
  size: index % 5 === 0 ? 2.5 : index % 2 === 0 ? 1.8 : 1.2,
  delay: `${((index * 0.43) % 4).toFixed(2)}s`,
  duration: `${(2.8 + (index % 4) * 0.9).toFixed(1)}s`,
}));

function ProfessionIcon({ id }: { id: Profession['id'] }) {
  switch (id) {
    case 'engineer':
      return (
        <svg viewBox="0 0 28 28" className="entry-patch__svg" aria-hidden="true">
          <polygon
            points="14,2.5 23.5,8 23.5,20 14,25.5 4.5,20 4.5,8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <circle cx="14" cy="14" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M14 5.5v3M14 19.5v3M6.7 9.8l2.6 1.5M18.7 16.7l2.6 1.5M21.3 9.8l-2.6 1.5M9.3 16.7l-2.6 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'pilot':
      return (
        <svg viewBox="0 0 28 28" className="entry-patch__svg" aria-hidden="true">
          <ellipse
            cx="14"
            cy="14"
            rx="11"
            ry="5.2"
            transform="rotate(-24 14 14)"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M14 5.5L21 20.5L14 17.2L7 20.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="miter"
          />
          <circle cx="22.5" cy="9.2" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'biologist':
      return (
        <svg viewBox="0 0 28 28" className="entry-patch__svg" aria-hidden="true">
          <path
            d="M22.5 5.5C14 5.5 7 10.5 6.5 21.5C17.5 21 22.5 14 22.5 5.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M6.5 21.5L18.5 9.5M11.5 16.5H16.5M14 14V9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      );
    case 'medic':
      return (
        <svg viewBox="0 0 28 28" className="entry-patch__svg" aria-hidden="true">
          <path
            d="M11 4.5H17V11H23.5V17H17V23.5H11V17H4.5V11H11Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M7.5 14H11L12.8 10.8L15.2 17.2L17 14H20.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      );
  }
}

function SegmentedStatBar({ label, value }: { label: string; value: number }) {
  const filledSteps = Math.round(value / STAT_STEP_VALUE);
  return (
    <div className="entry-stat">
      <span className="entry-stat__label">{label}</span>
      <div
        className="entry-stat__blocks entry-stat__blocks--three"
        aria-label={`${label} +${value} (max ${100 + value})`}
      >
        {Array.from({ length: STAT_STEPS }, (_, idx) => (
          <span
            key={idx}
            className={`entry-stat__block ${idx < filledSteps ? 'entry-stat__block--filled' : ''}`.trim()}
          />
        ))}
      </div>
      <span className="entry-stat__value">+{value}</span>
    </div>
  );
}

export default function RoomEntryScreen({
  mode,
  connected,
  error,
  name,
  stats,
  onName,
  onStats,
  onSubmit,
  onSwitchMode,
  onBack,
}: RoomEntryScreenProps) {
  const [code, setCode] = useState('');
  const rootRef = useRef<HTMLElement>(null);

  const selectedProfession = PROFESSIONS.find(p => sameStats(p.stats, stats)) ?? PROFESSIONS[0];
  const canSubmit = connected && name.trim().length > 0 && (mode === 'create' || code.trim().length === 6);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    el.style.setProperty('--mx', nx.toFixed(3));
    el.style.setProperty('--my', ny.toFixed(3));
  };

  const handleSelectProfession = (profession: Profession) => {
    playUiClick();
    onStats({ ...profession.stats });
  };

  const handleTabSwitch = (nextMode: 'create' | 'join') => {
    if (nextMode === mode) return;
    playUiClick();
    onSwitchMode(nextMode);
  };

  const handleBack = () => {
    playUiClick();
    onBack();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    playUiConfirm();
    onSubmit(mode === 'join' ? code : undefined);
  };

  return (
    <section
      ref={rootRef}
      className="entry-screen"
      aria-label={mode === 'create' ? 'Create room' : 'Join room'}
      onPointerMove={handlePointerMove}
    >
      {/* Vector Mars sky, twinkling stars, 3 parallax mountain ridges & geodesic dome */}
      <div className="entry-backdrop" aria-hidden="true">
        <div className="entry-backdrop__sky" />
        <div className="entry-backdrop__horizon-glow" />

        <div className="entry-backdrop__stars">
          {STARS.map(star => (
            <span
              key={star.id}
              className="entry-backdrop__star"
              style={
                {
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  animationDelay: star.delay,
                  animationDuration: star.duration,
                } as CSSProperties
              }
            />
          ))}
        </div>

        {/* Far Martian ridge */}
        <svg
          className="entry-backdrop__ridge entry-backdrop__ridge--far"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
        >
          <path d="M0,420 L0,275 L120,248 L245,264 L390,210 L540,246 L700,198 L850,236 L1015,186 L1165,224 L1320,192 L1440,216 L1440,420 Z" />
        </svg>

        {/* Mid ridge + Geodesic Mars Outpost silhouette */}
        <svg
          className="entry-backdrop__ridge entry-backdrop__ridge--mid"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="dome-amber-glow" cx="50%" cy="80%" r="65%">
              <stop offset="0%" stopColor="rgba(255, 138, 62, 0.42)" />
              <stop offset="55%" stopColor="rgba(255, 90, 31, 0.14)" />
              <stop offset="100%" stopColor="rgba(255, 90, 31, 0)" />
            </radialGradient>
          </defs>
          <path d="M0,420 L0,315 L180,290 L330,308 L510,272 L670,295 L860,268 L1045,262 L1260,256 L1440,274 L1440,420 Z" />

          {/* Geodesic dome & comms array anchored cleanly on right horizon */}
          <g transform="translate(1070, 178)">
            <ellipse cx="90" cy="84" rx="145" ry="52" fill="url(#dome-amber-glow)" />
            <rect x="-36" y="72" width="38" height="14" fill="#170d0e" stroke="rgba(255, 168, 112, 0.28)" strokeWidth="1" />
            <rect x="176" y="70" width="46" height="16" fill="#170d0e" stroke="rgba(255, 168, 112, 0.28)" strokeWidth="1" />
            <line x1="208" y1="70" x2="208" y2="28" stroke="rgba(255, 184, 138, 0.45)" strokeWidth="1.2" />
            <circle cx="208" cy="26" r="2.2" fill="#FF5A1F" />
            <path
              d="M12,86 A78,78 0 0,1 168,86 Z"
              fill="rgba(255, 112, 48, 0.12)"
              stroke="rgba(255, 194, 148, 0.48)"
              strokeWidth="1.3"
            />
            <ellipse cx="90" cy="86" rx="56" ry="74" fill="none" stroke="rgba(255, 194, 148, 0.26)" strokeWidth="1" />
            <ellipse cx="90" cy="86" rx="28" ry="78" fill="none" stroke="rgba(255, 194, 148, 0.26)" strokeWidth="1" />
            <line x1="24" y1="60" x2="156" y2="60" stroke="rgba(255, 194, 148, 0.24)" strokeWidth="1" />
            <line x1="42" y1="36" x2="138" y2="36" stroke="rgba(255, 194, 148, 0.24)" strokeWidth="1" />
          </g>
        </svg>

        {/* Near foreground ridge */}
        <svg
          className="entry-backdrop__ridge entry-backdrop__ridge--near"
          viewBox="0 0 1440 420"
          preserveAspectRatio="none"
        >
          <path d="M0,420 L0,356 L170,338 L370,362 L585,342 L790,368 L985,344 L1210,360 L1440,336 L1440,420 Z" />
        </svg>
      </div>

      {/* Tactile technical HUD layout anchored across full viewport (no enclosing box) */}
      <form className="entry-hud" onSubmit={handleSubmit}>
        {/* Top Row: Title + Mode Tabs on left, Sector stamp + Back on right */}
        <header className="entry-hud__top">
          <div className="entry-hud__identity">
            <div className="entry-hud__micro-row">
              <span className="entry-micro">MARS_OUTPOST // CREW_ROSTER</span>
              <span className="entry-micro entry-micro--dim">COMPETE_FOR_MARS</span>
            </div>

            <h1 className="entry-hud__title">
              {mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </h1>

            <div className="entry-tabs" role="tablist" aria-label="Room mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'create'}
                className={`entry-tab ${mode === 'create' ? 'entry-tab--active' : ''}`.trim()}
                onClick={() => handleTabSwitch('create')}
              >
                <span className="entry-tab__idx">01</span>
                CREATE ROOM
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'join'}
                className={`entry-tab ${mode === 'join' ? 'entry-tab--active' : ''}`.trim()}
                onClick={() => handleTabSwitch('join')}
              >
                <span className="entry-tab__idx">02</span>
                JOIN WITH CODE
              </button>
            </div>
          </div>

          <div className="entry-hud__top-right">
            <span className="entry-micro entry-micro--coord">18.65°N · 226.2°E // ARES_VALLIS</span>
            <button type="button" className="entry-back-btn" onClick={handleBack}>
              <span>[ ESC ]</span> BACK TO MENU
            </button>
          </div>
        </header>

        {/* Terminal-style direct line inputs */}
        <div className="entry-terminal-row">
          <div className="entry-terminal-field">
            <label htmlFor="entry-callsign" className="entry-terminal-field__tag">
              &gt; CALLSIGN // ASTRONAUT_ID
            </label>
            <div className="entry-terminal-field__line">
              <span className="entry-terminal-field__prompt" aria-hidden="true">
                ID_
              </span>
              <input
                id="entry-callsign"
                className="entry-terminal-field__input"
                value={name}
                maxLength={24}
                onChange={event => onName(event.target.value)}
                placeholder="ENTER NAME"
                autoFocus={mode === 'create'}
              />
            </div>
          </div>

          {mode === 'join' && (
            <div className="entry-terminal-field entry-terminal-field--code">
              <label htmlFor="entry-room-code" className="entry-terminal-field__tag">
                &gt; UPLINK // ROOM_CODE
              </label>
              <div className="entry-terminal-field__line">
                <span className="entry-terminal-field__prompt" aria-hidden="true">
                  #
                </span>
                <input
                  id="entry-room-code"
                  className="entry-terminal-field__input entry-terminal-field__input--code"
                  value={code}
                  maxLength={6}
                  onChange={event => setCode(event.target.value.toUpperCase())}
                  placeholder="ABC123"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* 4 Mission Credential Patches across open space */}
        <div className="entry-roster">
          <div className="entry-roster__bar">
            <span className="entry-micro">MISSION_CREDENTIALS // SELECT_CLASS</span>
            <span
              className="entry-roster__selected"
              style={{ '--accent': selectedProfession.accent } as CSSProperties}
            >
              [ {selectedProfession.code} · {selectedProfession.name.toUpperCase()} ]
            </span>
          </div>

          <div className="entry-roster__grid">
            {PROFESSIONS.map(profession => {
              const selected = profession.id === selectedProfession.id;
              return (
                <button
                  key={profession.id}
                  type="button"
                  aria-pressed={selected}
                  className={`entry-patch ${selected ? 'entry-patch--active' : ''}`.trim()}
                  style={{ '--accent': profession.accent } as CSSProperties}
                  onClick={() => handleSelectProfession(profession)}
                >
                  <span className="entry-patch__corner entry-patch__corner--tl" aria-hidden="true" />
                  <span className="entry-patch__corner entry-patch__corner--tr" aria-hidden="true" />
                  <span className="entry-patch__corner entry-patch__corner--bl" aria-hidden="true" />
                  <span className="entry-patch__corner entry-patch__corner--br" aria-hidden="true" />

                  <div className="entry-patch__head">
                    <span className="entry-patch__code">{profession.code}</span>
                    <span className="entry-patch__reg" aria-hidden="true">
                      +
                    </span>
                  </div>

                  <div className="entry-patch__emblem">
                    <ProfessionIcon id={profession.id} />
                    <span className="entry-patch__name">{profession.name}</span>
                  </div>

                  <div className="entry-patch__stats">
                    <SegmentedStatBar label="ENERGY" value={profession.stats.energy} />
                    <SegmentedStatBar label="FOOD" value={profession.stats.food} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom-left alert/telemetry & bottom-right high-contrast CTA */}
        <footer className="entry-hud__bottom">
          <div className="entry-hud__bottom-left">
            {error ? (
              <p className="entry-alert" role="alert">
                [ERR] {error}
              </p>
            ) : (
              <span className="entry-micro entry-micro--dim">
                + CREW_LOCK: {selectedProfession.code} // READY_FOR_DEPLOY
              </span>
            )}
          </div>

          <button type="submit" className="entry-cta" disabled={!canSubmit}>
            {mode === 'create' ? 'CREATE ROOM & ENTER BASE' : 'JOIN & ENTER BASE'}
            <span aria-hidden="true"> -&gt;</span>
          </button>
        </footer>
      </form>

      {/* Fixed 3.5% SVG film grain overlay */}
      <svg className="entry-grain" aria-hidden="true">
        <filter id="mars-hud-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#mars-hud-grain)" />
      </svg>
    </section>
  );
}
