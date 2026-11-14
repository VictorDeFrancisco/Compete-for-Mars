import { useState } from 'react';
import type { GameView } from '../../../shared/types';
import MarsBase3D from './MarsBase3D';
import './Lobby.css';

export interface LobbyProps {
  game: GameView | null;
  connected?: boolean;
  error?: string;
  disabled: boolean;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onReady: () => void;
  onStart: () => void;
  onBots: () => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onLeave?: () => void;
}

export default function Lobby({
  game,
  connected = true,
  error = '',
  disabled,
  onCreate,
  onJoin,
  onReady,
  onStart,
  onBots,
  onRemove,
  onBack,
  onLeave,
}: LobbyProps) {
  const [code, setCode] = useState('');

  if (!game) {
    return (
      <section className="panel">
        <h2>1 · Base y sala</h2>
        <p>Crea una sala o comparte el código para competir desde otros navegadores.</p>
        <button disabled={disabled} onClick={onCreate}>Crear sala</button>
        <form onSubmit={e => { e.preventDefault(); onJoin(code); }}>
          <label>
            Código de sala
            <input
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
          </label>
          <button disabled={disabled || code.trim().length !== 6}>Unirse</button>
        </form>
        <button className="secondary" onClick={onBack}>Cambiar estadísticas</button>
      </section>
    );
  }

  const host = game.hostId === game.self.id;
  const nextLevel = game.round + 1;
  const readyCount = game.players.filter(p => p.ready).length;
  const allReady = game.players.every(p => p.ready && p.connected);
  const otherPlayers = game.players.filter(p => p.id !== game.self.id);

  return (
    <div className="lobby-world" aria-label="Base marciana en 3D">
      <MarsBase3D game={game} />

      <div className="lobby-hud">
        {/* Top bar: Mission title, room code, readiness, connection & leave */}
        <header className="lobby-hud__top">
          <div className="lobby-hud__brand">
            <span className="lobby-hud__eyebrow">COMPETE FOR MARS · NIVEL {nextLevel}</span>
            <div className="lobby-hud__title-row">
              <strong>Sala {game.code}</strong>
              <span className={`lobby-hud__pill ${allReady ? 'lobby-hud__pill--all' : ''}`.trim()}>
                {readyCount}/{game.players.length} listos
              </span>
            </div>
            <span className="lobby-hud__drag-hint">Arrastra el fondo para rotar la base · Rueda para zoom</span>
          </div>

          <div className="lobby-hud__top-right">
            <span className={connected ? 'status' : 'status offline'}>
              {connected ? 'Conectado' : 'Reconectando…'}
            </span>
            {onLeave && (
              <button type="button" className="secondary" disabled={!connected} onClick={onLeave}>
                Salir de la sala
              </button>
            )}
          </div>
        </header>

        {error && (
          <p className="error lobby-hud__error" role="alert">
            {error}
          </p>
        )}

        {/* Middle/Bottom distributed HUD corners over the 3D base */}
        <div className="lobby-hud__corners">
          {/* Bottom-Left: Your own full data */}
          <section className="lobby-glass lobby-hud__self" aria-label="Tus datos">
            <div className="lobby-glass__head">
              <h3>Tus datos · {game.self.name}</h3>
              <span className={`lobby-ready-badge ${game.self.ready ? 'lobby-ready-badge--yes' : 'lobby-ready-badge--no'}`}>
                {game.self.ready ? '✓ Listo' : 'Pendiente'}
              </span>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Vida</span>
                <strong>{game.self.health} / 100</strong>
              </div>
              <div className="lobby-bar">
                <div className="lobby-bar__fill" style={{ width: `${game.self.health}%` }} />
              </div>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Energía privada</span>
                <strong>{game.self.resources.energy} / 10</strong>
              </div>
              <div className="lobby-bar">
                <div
                  className="lobby-bar__fill lobby-bar__fill--energy"
                  style={{ width: `${game.self.resources.energy * 10}%` }}
                />
              </div>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Comida privada</span>
                <strong>{game.self.resources.food} / 10</strong>
              </div>
              <div className="lobby-bar">
                <div
                  className="lobby-bar__fill lobby-bar__fill--food"
                  style={{ width: `${game.self.resources.food * 10}%` }}
                />
              </div>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Radiación</span>
                <strong>{game.self.resources.radiation} / 10</strong>
              </div>
              <div className="lobby-bar">
                <div
                  className="lobby-bar__fill lobby-bar__fill--radiation"
                  style={{ width: `${game.self.resources.radiation * 10}%` }}
                />
              </div>
            </div>

            <div className="lobby-traits">
              <span className="lobby-trait">Base Energía +{game.self.stats.energy}</span>
              <span className="lobby-trait">Base Comida +{game.self.stats.food}</span>
              <span className="lobby-trait">Blindaje +{game.self.stats.shielding}</span>
            </div>

            {game.lastResults.length > 0 && (
              <div className="lobby-last-results">
                <h4>Último nivel ({game.round})</h4>
                {game.lastResults.map(result => (
                  <p key={result.playerId}>
                    #{result.rank} {result.name}: {result.score} pts ·
                    {{ winner: ' ganador', loser: ' perdedor', neutral: ' sin premio', draw: ' empate' }[result.outcome]}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Right side: Public crew view + Ready & Next Level buttons */}
          <div className="lobby-hud__right-col">
            <section className="lobby-glass lobby-hud__crew" aria-label="Otros jugadores">
              <h3>Demás jugadores (solo vista)</h3>
              {otherPlayers.length === 0 ? (
                <p className="lobby-crew-note">Aún no hay otros jugadores en la base.</p>
              ) : (
                <ul className="lobby-crew">
                  {otherPlayers.map(player => (
                    <li key={player.id} className="lobby-crew__item">
                      <div className="lobby-crew__info">
                        <span className="lobby-crew__name">
                          {player.name} {player.isBot ? '(bot)' : ''} {player.id === game.hostId ? '★' : ''}
                        </span>
                        <span className="lobby-crew__meta">Vida: {player.health}/100</span>
                      </div>
                      <div className="lobby-crew__status">
                        {!player.connected ? (
                          <span className="lobby-ready-badge lobby-ready-badge--off">Offline</span>
                        ) : player.ready ? (
                          <span className="lobby-ready-badge lobby-ready-badge--yes">✓ Listo</span>
                        ) : (
                          <span className="lobby-ready-badge lobby-ready-badge--no">No listo</span>
                        )}
                        {host && (player.isBot || !player.connected) && (
                          <button type="button" className="secondary" onClick={() => onRemove(player.id)}>
                            Retirar
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="lobby-glass lobby-hud__actions" aria-label="Acciones de nivel">
              <button
                type="button"
                className={`lobby-actions__ready ${game.self.ready ? 'secondary' : ''}`.trim()}
                disabled={disabled}
                onClick={onReady}
              >
                {game.self.ready ? 'Cancelar listo' : `Listo para el nivel ${nextLevel}`}
              </button>

              {host ? (
                <div className="lobby-actions__host">
                  <button
                    type="button"
                    className="secondary"
                    disabled={disabled || game.players.length >= 4}
                    onClick={onBots}
                  >
                    + Bots
                  </button>
                  <button
                    type="button"
                    disabled={disabled || !allReady}
                    onClick={onStart}
                  >
                    Iniciar nivel {nextLevel}
                  </button>
                </div>
              ) : (
                <p className="lobby-crew-note">El anfitrión iniciará el nivel {nextLevel} cuando todos estén listos.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
