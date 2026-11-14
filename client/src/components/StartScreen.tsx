import { useState } from 'react';
import { STAT_BUDGET } from '../../../shared/constants';
import type { Stats } from '../../../shared/types';
import './StartScreen.css';

export interface StartScreenProps {
  connected: boolean;
  error: string;
  name: string;
  stats: Stats;
  onName: (name: string) => void;
  onStats: (stats: Stats) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onOpenTest: () => void;
}

export default function StartScreen({
  connected,
  error,
  name,
  stats,
  onName,
  onStats,
  onCreateRoom,
  onJoinRoom,
  onOpenTest,
}: StartScreenProps) {
  const [modal, setModal] = useState<'create' | 'join' | null>(null);
  const [code, setCode] = useState('');

  const remaining = STAT_BUDGET - stats.energy - stats.food - stats.shielding;
  const canSubmit = connected && name.trim().length > 0 && remaining === 0 && (modal === 'create' || code.trim().length === 6);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (modal === 'create') onCreateRoom();
    else if (modal === 'join') onJoinRoom(code);
  };

  return (
    <section className="start-screen" aria-label="Compete For Mars">
      <div className="start-screen__scrim" aria-hidden="true" />

      <div className="start-screen__content">
        <div className="start-screen__left">
          <h1 className="start-screen__title">
            <span>COMPETE</span>
            <span>FOR MARS</span>
          </h1>

          <nav className="start-screen__menu" aria-label="Menú principal">
            <button
              type="button"
              className="start-screen__btn start-screen__btn--primary"
              onClick={() => setModal('create')}
            >
              CREAR SALA
            </button>
            <button
              type="button"
              className="start-screen__btn"
              onClick={() => setModal('join')}
            >
              UNIRSE A SALA
            </button>
            <button
              type="button"
              className="start-screen__btn start-screen__btn--test"
              onClick={onOpenTest}
            >
              TEST
            </button>
          </nav>
        </div>

        {modal && (
          <form className="start-screen__panel" onSubmit={handleSubmit}>
            <div className="start-screen__panel-head">
              <h2>{modal === 'create' ? 'Crear sala' : 'Unirse a sala'}</h2>
              <button
                type="button"
                className="secondary start-screen__close"
                onClick={() => setModal(null)}
              >
                Volver
              </button>
            </div>

            {error && (
              <p className="error start-screen__error" role="alert">
                {error}
              </p>
            )}

            {modal === 'join' && (
              <label>
                Código de sala
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
              Nombre de astronauta
              <input
                value={name}
                maxLength={24}
                onChange={event => onName(event.target.value)}
                placeholder="Tu nombre"
                autoFocus={modal === 'create'}
              />
            </label>

            <div className="start-screen__stats">
              <div className="start-screen__stats-head">
                <span>Estadísticas iniciales</span>
                <strong>{remaining === 0 ? '6/6 puntos' : `Faltan ${remaining}`}</strong>
              </div>
              {(['energy', 'food', 'shielding'] as const).map(key => (
                <label key={key} className="start-screen__slider">
                  <span>
                    {{ energy: 'Energía', food: 'Comida', shielding: 'Blindaje' }[key]}: {stats[key]}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={stats[key]}
                    onChange={event => onStats({ ...stats, [key]: Number(event.target.value) })}
                  />
                </label>
              ))}
            </div>

            <button type="submit" className="start-screen__submit" disabled={!canSubmit}>
              {modal === 'create' ? 'Crear y entrar al lobby' : 'Unirse al lobby'}
            </button>

            {!connected && (
              <p className="start-screen__offline-note">
                Esperando conexión con el servidor (puerto 3001)…
              </p>
            )}
          </form>
        )}
      </div>

      <div className="start-screen__footer">
        <span>C-Moon Dynamics</span>
        <span className={connected ? 'start-screen__conn' : 'start-screen__conn start-screen__conn--offline'}>
          {connected ? 'Server online' : 'Connecting…'}
        </span>
      </div>
    </section>
  );
}
