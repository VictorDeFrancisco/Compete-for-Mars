import { useState, type CSSProperties } from 'react';
import type { Stats } from '../../../shared/types';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import AstronautPortraitSvg, { CLASS_SUIT_COLORS } from './AstronautPortraitSvg';
import MarsBackdrop from './MarsBackdrop';
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
const CARD_TILTS = ['-1.6deg', '1.1deg', '-0.9deg', '1.4deg'] as const;

function MissionPatchSvg({ id }: { id: Profession['id'] }) {
  switch (id) {
    case 'engineer':
      return (
        <svg className="entry-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#D97706" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <polygon points="32,14 46,23 46,41 32,50 18,41 18,23" fill="#1A1817" />
          <circle cx="32" cy="32" r="7" fill="#D97706" />
          <rect x="29.5" y="11" width="5" height="9" fill="#F5EFE0" />
        </svg>
      );
    case 'pilot':
      return (
        <svg className="entry-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#1D6E8C" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <path d="M14 40 C24 26 42 20 51 22 C43 32 30 40 14 40 Z" fill="#FC3D21" />
          <polygon points="32,14 45,45 32,38 19,45" fill="#1A1817" />
        </svg>
      );
    case 'biologist':
      return (
        <svg className="entry-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#2F6F4E" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <path d="M16 44 A16 16 0 0 1 48 44 Z" fill="#E09F3E" stroke="#1A1817" strokeWidth="2" />
          <path d="M32 43 V23 C32 18 39 15 44 17 C43 24 37 28 32 28" fill="#2F6F4E" />
          <path d="M32 32 C26 32 21 28 21 22 C26 21 31 25 32 32 Z" fill="#1A1817" />
        </svg>
      );
    case 'medic':
      return (
        <svg className="entry-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#C83E37" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <path d="M26 16 H38 V26 H48 V38 H38 V48 H26 V38 H16 V26 H26 Z" fill="#C83E37" stroke="#1A1817" strokeWidth="2" />
          <circle cx="32" cy="32" r="4.5" fill="#E09F3E" />
        </svg>
      );
  }
}

function PunchStatRow({ label, value }: { label: string; value: number }) {
  const filledSteps = Math.round(value / STAT_STEP_VALUE);
  return (
    <div className="punch-stat">
      <span className="punch-stat__label">{label}</span>
      <div className="punch-stat__boxes" aria-label={`${label} +${value} (max ${100 + value})`}>
        {Array.from({ length: STAT_STEPS }, (_, idx) => (
          <span
            key={idx}
            className={`punch-stat__box ${idx < filledSteps ? 'punch-stat__box--checked' : ''}`.trim()}
          />
        ))}
      </div>
      <span className="punch-stat__val">+{value}</span>
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

  const selectedIndex = Math.max(0, PROFESSIONS.findIndex(p => sameStats(p.stats, stats)));
  const selectedProfession = PROFESSIONS[selectedIndex] ?? PROFESSIONS[0];
  const suitColor = CLASS_SUIT_COLORS[selectedProfession.id];
  const canSubmit = connected && name.trim().length > 0 && (mode === 'create' || code.trim().length === 6);

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
      className="entry-stage"
      aria-label={mode === 'create' ? 'Create room' : 'Join room'}
    >
      <MarsBackdrop suitColor={suitColor} />

      <form className="entry-hud" onSubmit={handleSubmit}>
        {/* Top Row: Title + Compact Tabs + Compact ID Card on Left, Back on Right */}
        <div className="entry-top">
          <div className="entry-top__left">
            <h1 className="entry-title">
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
                CREATE ROOM
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'join'}
                className={`entry-tab ${mode === 'join' ? 'entry-tab--active' : ''}`.trim()}
                onClick={() => handleTabSwitch('join')}
              >
                JOIN WITH CODE
              </button>
            </div>

            <div className="entry-inputs">
              <div className="id-card">
                <AstronautPortraitSvg
                  suitColor={suitColor}
                  variant={selectedIndex}
                  className="id-card__portrait-svg"
                />
                <div className="id-card__body">
                  <label htmlFor="entry-callsign" className="id-card__label">
                    ASTRONAUT NAME
                  </label>
                  <input
                    id="entry-callsign"
                    className="id-card__input"
                    value={name}
                    maxLength={24}
                    onChange={event => onName(event.target.value)}
                    placeholder="Your name"
                    autoFocus={mode === 'create'}
                  />
                </div>
              </div>

              {mode === 'join' && (
                <div className="code-slip">
                  <label htmlFor="entry-room-code" className="id-card__label">
                    ROOM CODE
                  </label>
                  <input
                    id="entry-room-code"
                    className="id-card__input id-card__input--code"
                    value={code}
                    maxLength={6}
                    onChange={event => setCode(event.target.value.toUpperCase())}
                    placeholder="ABC123"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <button type="button" className="entry-back" onClick={handleBack}>
            ← BACK
          </button>
        </div>

        {/* Bottom Dock: 4 Class Cards on Mars Ground + ENTER BASE on Right */}
        <div className="entry-bottom">
          <div className="entry-cards" role="group" aria-label="Select class">
            {PROFESSIONS.map((profession, idx) => {
              const selected = profession.id === selectedProfession.id;
              return (
                <button
                  key={profession.id}
                  type="button"
                  aria-pressed={selected}
                  className={`entry-card ${selected ? 'entry-card--selected' : ''}`.trim()}
                  style={{ '--tilt': CARD_TILTS[idx % CARD_TILTS.length] } as CSSProperties}
                  onClick={() => handleSelectProfession(profession)}
                >
                  {selected && (
                    <span className="rubber-stamp" aria-hidden="true">
                      SELECTED
                    </span>
                  )}

                  <div className="entry-card__patch">
                    <MissionPatchSvg id={profession.id} />
                  </div>

                  <span className="entry-card__name">{profession.name}</span>

                  <div className="entry-card__stats">
                    <PunchStatRow label="ENERGY" value={profession.stats.energy} />
                    <PunchStatRow label="FOOD" value={profession.stats.food} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="entry-cta">
            {error && (
              <p className="entry-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="entry-submit" disabled={!canSubmit}>
              ENTER BASE
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
