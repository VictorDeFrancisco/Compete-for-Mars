import { useState, type CSSProperties } from 'react';
import type { Stats } from '../../../shared/types';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import MarsBackdrop from './MarsBackdrop';
import { NasaOrbitStampSvg, PaperclipSvg, TopoWatermarkSvg } from './NasaMarks';
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

const CARD_TILTS = ['-1.8deg', '1.2deg', '-0.9deg', '1.5deg'] as const;

function HelmetSilhouetteSvg() {
  return (
    <svg className="id-card__portrait-svg" viewBox="0 0 64 64" aria-hidden="true">
      {/* Three flat solid retro print colors */}
      <rect width="64" height="64" fill="#D9CEB8" />
      <path d="M12 64 C12 48 20 44 32 44 C44 44 52 48 52 64 Z" fill="#C94B2B" />
      <circle cx="32" cy="27" r="16" fill="#FAF4E6" stroke="#1E1C19" strokeWidth="2.5" />
      <rect x="20" y="18" width="24" height="16" rx="7" fill="#1E1C19" />
      <path d="M24 22 H34" stroke="#E09F3E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function MissionPatchSvg({ id }: { id: Profession['id'] }) {
  switch (id) {
    case 'engineer':
      return (
        <svg className="dossier-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#D97706" stroke="#1E1C19" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#FAF4E6" stroke="#1E1C19" strokeWidth="2" />
          <polygon points="32,14 46,23 46,41 32,50 18,41 18,23" fill="#1E1C19" />
          <circle cx="32" cy="32" r="7" fill="#D97706" />
          <rect x="29.5" y="11" width="5" height="9" fill="#FAF4E6" />
        </svg>
      );
    case 'pilot':
      return (
        <svg className="dossier-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#1D6E8C" stroke="#1E1C19" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#FAF4E6" stroke="#1E1C19" strokeWidth="2" />
          <path d="M14 40 C24 26 42 20 51 22 C43 32 30 40 14 40 Z" fill="#D64227" />
          <polygon points="32,14 45,45 32,38 19,45" fill="#1E1C19" />
        </svg>
      );
    case 'biologist':
      return (
        <svg className="dossier-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#2F6F4E" stroke="#1E1C19" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#FAF4E6" stroke="#1E1C19" strokeWidth="2" />
          <path d="M16 44 A16 16 0 0 1 48 44 Z" fill="#E09F3E" stroke="#1E1C19" strokeWidth="2" />
          <path d="M32 43 V23 C32 18 39 15 44 17 C43 24 37 28 32 28" fill="#2F6F4E" />
          <path d="M32 32 C26 32 21 28 21 22 C26 21 31 25 32 32 Z" fill="#1E1C19" />
        </svg>
      );
    case 'medic':
      return (
        <svg className="dossier-patch__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="29" fill="#C83E37" stroke="#1E1C19" strokeWidth="3" />
          <circle cx="32" cy="32" r="22" fill="#FAF4E6" stroke="#1E1C19" strokeWidth="2" />
          <path d="M26 16 H38 V26 H48 V38 H38 V48 H26 V38 H16 V26 H26 Z" fill="#C83E37" stroke="#1E1C19" strokeWidth="2" />
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

  const selectedProfession = PROFESSIONS.find(p => sameStats(p.stats, stats)) ?? PROFESSIONS[0];
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
      className="dossier-desk"
      aria-label={mode === 'create' ? 'Create room' : 'Join room'}
    >
      <MarsBackdrop />

      {/* Top manila folder tabs + desk back tag */}
      <form className="dossier-wrap" onSubmit={handleSubmit}>
        <div className="dossier-top-bar">
          <div className="dossier-tabs" role="tablist" aria-label="Room mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'create'}
              className={`dossier-tab ${mode === 'create' ? 'dossier-tab--active' : ''}`.trim()}
              onClick={() => handleTabSwitch('create')}
            >
              CREATE ROOM
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'join'}
              className={`dossier-tab ${mode === 'join' ? 'dossier-tab--active' : ''}`.trim()}
              onClick={() => handleTabSwitch('join')}
            >
              JOIN WITH CODE
            </button>
          </div>

          <button type="button" className="dossier-back" onClick={handleBack}>
            ← BACK
          </button>
        </div>

        {/* Open physical Manila Dossier Sheet */}
        <div className="dossier-folder">
          <TopoWatermarkSvg />

          <header className="dossier-header">
            <h1 className="dossier-title">
              {mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </h1>
            <NasaOrbitStampSvg label="MARS OUTPOST // MISSION TRAINER" />
          </header>

          {/* Typewriter Astronaut ID Card (+ Room Code Slip on Join) */}
          <div className="dossier-inputs">
            <div className="id-card">
              <PaperclipSvg />
              <HelmetSilhouetteSvg />
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

          {/* 4 Cardstock Index Files with Circular 3-Color Patches & Red Stamp */}
          <div className="dossier-roster">
            <span className="dossier-section-label">SELECT CLASS</span>

            <div className="dossier-cards">
              {PROFESSIONS.map((profession, idx) => {
                const selected = profession.id === selectedProfession.id;
                return (
                  <button
                    key={profession.id}
                    type="button"
                    aria-pressed={selected}
                    className={`dossier-card ${selected ? 'dossier-card--selected' : ''}`.trim()}
                    style={{ '--tilt': CARD_TILTS[idx % CARD_TILTS.length] } as CSSProperties}
                    onClick={() => handleSelectProfession(profession)}
                  >
                    {selected && (
                      <span className="rubber-stamp" aria-hidden="true">
                        SELECTED
                      </span>
                    )}

                    <div className="dossier-card__patch">
                      <MissionPatchSvg id={profession.id} />
                    </div>

                    <span className="dossier-card__name">{profession.name}</span>

                    <div className="dossier-card__stats">
                      <PunchStatRow label="ENERGY" value={profession.stats.energy} />
                      <PunchStatRow label="FOOD" value={profession.stats.food} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="dossier-footer">
            <div className="dossier-footer__left">
              {error && (
                <p className="dossier-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className="dossier-submit" disabled={!canSubmit}>
              ENTER BASE
            </button>
          </footer>
        </div>
      </form>
    </section>
  );
}
