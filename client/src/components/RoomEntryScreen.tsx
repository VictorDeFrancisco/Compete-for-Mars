import { useState } from 'react';
import type { Stats } from '../../../shared/types';
import { PROFESSIONS, sameStats } from './professions';
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(mode === 'join' ? code : undefined);
  };

  return (
    <section className="entry-screen" aria-label={mode === 'create' ? 'Create room' : 'Join room'}>
      <div className="entry-screen__scrim" aria-hidden="true" />

      <div className="entry-screen__shell">
        <header className="entry-screen__header">
          <div>
            <p className="entry-screen__eyebrow">COMPETE FOR MARS</p>
            <h1 className="entry-screen__title">
              {mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </h1>
          </div>

          <button type="button" className="secondary" onClick={onBack}>
            Back to menu
          </button>
        </header>

        <form className="entry-screen__card" onSubmit={handleSubmit}>
          <div className="entry-screen__tabs" role="tablist" aria-label="Room mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'create'}
              className={`entry-screen__tab ${mode === 'create' ? 'entry-screen__tab--active' : ''}`.trim()}
              onClick={() => onSwitchMode('create')}
            >
              Create room
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'join'}
              className={`entry-screen__tab ${mode === 'join' ? 'entry-screen__tab--active' : ''}`.trim()}
              onClick={() => onSwitchMode('join')}
            >
              Join with code
            </button>
          </div>

          {error && (
            <p className="error entry-screen__error" role="alert">
              {error}
            </p>
          )}

          <div className="entry-screen__fields">
            {mode === 'join' && (
              <label>
                Room code
                <input
                  value={code}
                  maxLength={6}
                  onChange={event => setCode(event.target.value.toUpperCase())}
                  placeholder="ABC123"
                  autoFocus
                />
              </label>
            )}

            <label>
              Astronaut name
              <input
                value={name}
                maxLength={24}
                onChange={event => onName(event.target.value)}
                placeholder="Your name"
                autoFocus={mode === 'create'}
              />
            </label>
          </div>

          <div className="entry-screen__professions">
            <div className="entry-screen__prof-head">
              <span>Choose your profession</span>
              <strong>{selectedProfession.name}</strong>
            </div>

            <div className="entry-screen__prof-grid">
              {PROFESSIONS.map(profession => {
                const selected = profession.id === selectedProfession.id;
                return (
                  <button
                    key={profession.id}
                    type="button"
                    aria-pressed={selected}
                    className={`entry-screen__prof-card ${selected ? 'entry-screen__prof-card--active' : ''}`.trim()}
                    onClick={() => onStats({ ...profession.stats })}
                  >
                    <span className="entry-screen__prof-name">{profession.name}</span>
                    <div className="entry-screen__prof-stats">
                      <span>Energy +{profession.stats.energy}</span>
                      <span>Food +{profession.stats.food}</span>
                      <span>Shielding +{profession.stats.shielding}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className="entry-screen__submit" disabled={!canSubmit}>
            {mode === 'create' ? 'Create room & enter base' : 'Join & enter base'}
          </button>
        </form>
      </div>
    </section>
  );
}
