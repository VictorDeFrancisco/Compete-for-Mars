import { useState } from 'react';
import type { GameView } from '../../../shared/types';
import MarsBase3D from './MarsBase3D';
import { RadiationIcon } from './RadiationIcon';
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
        <h2>1 · Base &amp; Room</h2>
        <p>Create a room or share the code to compete from other browsers.</p>
        <button disabled={disabled} onClick={onCreate}>Create room</button>
        <form onSubmit={e => { e.preventDefault(); onJoin(code); }}>
          <label>
            Room code
            <input
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
            />
          </label>
          <button disabled={disabled || code.trim().length !== 6}>Join</button>
        </form>
        <button className="secondary" onClick={onBack}>Change profession</button>
      </section>
    );
  }

  const host = game.hostId === game.self.id;
  const nextLevel = game.round + 1;
  const alivePlayers = game.players.filter(p => p.health > 0);
  const readyCount = alivePlayers.filter(p => p.ready).length;
  const allReady = !game.matchFinished && alivePlayers.length > 0 && alivePlayers.every(p => p.ready && p.connected);
  const otherPlayers = game.players.filter(p => p.id !== game.self.id);
  const matchWinner = game.winnerId ? game.players.find(p => p.id === game.winnerId) ?? null : null;
  const gameOver = Boolean(game.matchFinished || matchWinner);
  const selfDead = game.self.health <= 0;
  const maxHealth = game.self.maxHealth || 100 + (game.self.stats.health ?? 0);
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;

  return (
    <div className="lobby-world" aria-label="3D Mars Base">
      <MarsBase3D game={game} />

      <div className="lobby-hud">
        <header className="lobby-hud__top">
          <div className="lobby-hud__brand">
            <span className="lobby-hud__eyebrow">COMPETE FOR MARS · LEVEL {nextLevel}</span>
            <div className="lobby-hud__title-row">
              <strong>Room {game.code}</strong>
              <span className={`lobby-hud__pill ${allReady ? 'lobby-hud__pill--all' : ''}`.trim()}>
                {gameOver ? (matchWinner ? `Winner: ${matchWinner.name}` : 'Mission ended') : `${readyCount}/${alivePlayers.length} ready`}
              </span>
            </div>
            <span className="lobby-hud__drag-hint">Drag background to orbit base · Scroll to zoom</span>
          </div>

          {onLeave && (
            <div className="lobby-hud__top-right">
              <button type="button" className="secondary" disabled={!connected} onClick={onLeave}>
                Leave room
              </button>
            </div>
          )}
        </header>

        {error && (
          <p className="error lobby-hud__error" role="alert">
            {error}
          </p>
        )}

        <div className="lobby-hud__corners">
          <section className="lobby-glass lobby-hud__self" aria-label="Your status">
            <div className="lobby-glass__head">
              <h3>{game.self.name}</h3>
              <span className={`lobby-ready-badge ${selfDead ? 'lobby-ready-badge--off' : game.self.ready ? 'lobby-ready-badge--yes' : 'lobby-ready-badge--no'}`}>
                {selfDead ? 'Eliminated' : game.self.ready ? '✓ Ready' : 'Waiting'}
              </span>
            </div>

            {game.self.cardOutcome && <p className="lobby-card-result">{game.self.cardOutcome.summary}</p>}
            {game.self.protection?.radiationShield && <p className="lobby-card-result">Radiation shield ready.</p>}
            {game.self.protection?.reinforcedSuit && <p className="lobby-card-result">Reinforced suit ready.</p>}
            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Health</span>
                <strong>{game.self.health} / {maxHealth}</strong>
              </div>
              <div className="lobby-bar">
                <div className="lobby-bar__fill" style={{ width: `${Math.min(100, (game.self.health / maxHealth) * 100)}%` }} />
              </div>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Energy</span>
                <strong>{game.self.resources.energy} / {maxEnergy}</strong>
              </div>
              <div className="lobby-bar">
                <div
                  className="lobby-bar__fill lobby-bar__fill--energy"
                  style={{ width: `${Math.min(100, (game.self.resources.energy / maxEnergy) * 100)}%` }}
                />
              </div>
            </div>

            <div className="lobby-stat-row">
              <div className="lobby-stat-row__label">
                <span>Food</span>
                <strong>{game.self.resources.food} / {maxFood}</strong>
              </div>
              <div className="lobby-bar">
                <div
                  className="lobby-bar__fill lobby-bar__fill--food"
                  style={{ width: `${Math.min(100, (game.self.resources.food / maxFood) * 100)}%` }}
                />
              </div>
            </div>

            <div className="lobby-radiation-row" aria-label={`Radiation ${game.self.resources.radiation}`}>
              <span className="lobby-radiation-row__label">
                <RadiationIcon />
                <span>Radiation</span>
              </span>
              <strong className="lobby-radiation-row__value">{game.self.resources.radiation}</strong>
            </div>

            <div className="lobby-traits">
              {game.self.stats.energy > 0 && <span className="lobby-trait">Max Energy +{game.self.stats.energy}</span>}
              {game.self.stats.food > 0 && <span className="lobby-trait">Max Food +{game.self.stats.food}</span>}
              {game.self.stats.health > 0 && <span className="lobby-trait">Max Health +{game.self.stats.health}</span>}
              {(game.self.resources.energy <= 30 || game.self.resources.food <= 30 || game.self.resources.radiation > 0) && (
                <span className="lobby-trait">
                  {game.self.resources.energy === 0 || game.self.resources.food === 0
                    ? '0 resource: -10 HP/minigame'
                    : game.self.resources.radiation > 0
                      ? game.self.protection?.reinforcedSuit ? 'Radiation: next damage blocked' : `Rad: -${game.self.resources.radiation * 5} HP/minigame`
                      : 'Low reserves debuff active'}
                </span>
              )}
            </div>

            {game.lastResults.length > 0 && (
              <div className="lobby-last-results">
                <h4>Last round (Level {game.round})</h4>
                {game.lastResults.map(result => (
                  <p key={result.playerId}>
                    #{result.rank} {result.name} ·{' '}
                    {{ winner: 'winner', loser: 'loser', neutral: 'neutral', draw: 'draw' }[result.outcome]}
                    {result.healthDelta !== 0 && ` · ${result.healthDelta > 0 ? '+' : ''}${result.healthDelta} HP`}
                  </p>
                ))}
              </div>
            )}
          </section>

          <div className="lobby-hud__right-col">
            <section className="lobby-glass lobby-hud__crew" aria-label="Other players">
              <h3>Other players</h3>
              {otherPlayers.length === 0 ? (
                <p className="lobby-crew-note">No other players in the base yet.</p>
              ) : (
                <ul className="lobby-crew">
                  {otherPlayers.map(player => (
                    <li key={player.id} className="lobby-crew__item">
                      <div className="lobby-crew__info">
                        <span className="lobby-crew__name">
                          {player.name} {player.isBot ? '(bot)' : ''} {player.id === game.hostId ? '★' : ''}
                        </span>
                        <span className="lobby-crew__meta">Health: {player.health}/{player.maxHealth}</span>
                      </div>
                      <div className="lobby-crew__status">
                        {player.health <= 0 ? (
                          <span className="lobby-ready-badge lobby-ready-badge--off">Eliminated</span>
                        ) : !player.connected ? (
                          <span className="lobby-ready-badge lobby-ready-badge--off">Offline</span>
                        ) : player.ready ? (
                          <span className="lobby-ready-badge lobby-ready-badge--yes">✓ Ready</span>
                        ) : (
                          <span className="lobby-ready-badge lobby-ready-badge--no">Not ready</span>
                        )}
                        {host && (player.isBot || !player.connected) && (
                          <button type="button" className="secondary" onClick={() => onRemove(player.id)}>
                            Remove
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="lobby-glass lobby-hud__actions" aria-label="Level actions">
              {gameOver ? (
                <p className="lobby-crew-note">
                  {matchWinner ? <><strong>{matchWinner.name}</strong> wins the mission.</> : 'Mission ended. No survivors remain.'}
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    className={`lobby-actions__ready ${game.self.ready ? 'secondary' : ''}`.trim()}
                    disabled={disabled || selfDead}
                    onClick={onReady}
                  >
                    {selfDead ? 'Eliminated' : game.self.ready ? 'Cancel ready' : `Ready for Level ${nextLevel}`}
                  </button>

                  {host ? (
                    <div className="lobby-actions__host">
                      <button
                        type="button"
                        className="secondary"
                        disabled={disabled || gameOver || game.players.length >= 4}
                        onClick={onBots}
                      >
                        + Bots
                      </button>
                      <button
                        type="button"
                        disabled={disabled || !allReady}
                        onClick={onStart}
                      >
                        Start Level {nextLevel}
                      </button>
                    </div>
                  ) : (
                    <p className="lobby-crew-note">Host will start Level {nextLevel} once all survivors are ready.</p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
