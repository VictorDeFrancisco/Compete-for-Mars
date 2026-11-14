import { useEffect, useState } from 'react';
import { MAX_PLAYERS } from '../../../shared/constants';
import type { GameView } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from './AstronautPortraitSvg';
import MarsBase3D from './MarsBase3D';
import { RadiationIcon } from './RadiationIcon';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
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

const BASE_RESOURCE_CAP = 100;

function percentOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export default function Lobby({
  game,
  connected = true,
  error,
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
  const [orbitPaused, setOrbitPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!game) {
    return (
      <section className="panel">
        <h2>1 · Base &amp; Room</h2>
        <div className="row">
          <button disabled={disabled} onClick={onCreate}>Create room</button>
          <span className="muted">or</span>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={8}
            aria-label="Room code"
          />
          <button disabled={disabled || !code.trim()} onClick={() => onJoin(code)}>Join</button>
        </div>
        <button className="secondary" onClick={onBack}>Change profession</button>
      </section>
    );
  }

  const isHost = game.hostId === game.self.id;
  const gameOver = Boolean(game.matchFinished || game.winnerId != null);
  const alivePlayers = game.players.filter(p => p.health > 0);
  const readyCount = alivePlayers.filter(p => p.ready).length;
  const allAliveReady = alivePlayers.length > 0 && alivePlayers.every(p => p.connected && p.ready);
  const canStart = isHost && !disabled && !gameOver && allAliveReady;
  const canAddBots = isHost && !disabled && !gameOver && game.round === 0 && game.players.length < MAX_PLAYERS;
  const winner = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;

  const selfMaxEnergy = BASE_RESOURCE_CAP + game.self.stats.energy;
  const selfMaxFood = BASE_RESOURCE_CAP + game.self.stats.food;

  const handleCopyCode = async () => {
    playUiClick();
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="lobby-world" aria-label="Mars Base Lobby">
      <MarsBase3D game={game} autoOrbit={!orbitPaused} />

      <div className="lobby-hud">
        <header className="lobby-topbar">
          <div className="lobby-topbar__left">
            {game.round === 0 ? (
              <div className="lobby-room-plaque">
                <span className="lobby-room-plaque__eyebrow">ROOM</span>
                <strong className="lobby-room-plaque__code">{game.code}</strong>
                <button
                  type="button"
                  className="lobby-copy-btn"
                  onClick={handleCopyCode}
                  aria-label="Copy room code"
                  title="Copy room code"
                >
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
            ) : (
              <div className="lobby-room-plaque lobby-room-plaque--locked">
                <span className="lobby-room-plaque__eyebrow">MARS BASE</span>
                <strong className="lobby-room-plaque__code">ROUND {game.round}</strong>
              </div>
            )}

            <div className="lobby-ready-pill" title="Crew ready count">
              <span className={`lobby-ready-pill__dot ${allAliveReady ? 'is-all' : ''}`} aria-hidden="true" />
              <span>{readyCount}/{alivePlayers.length} READY</span>
            </div>

            {!connected && (
              <div className="lobby-alert-pill" role="status">
                RECONNECTING...
              </div>
            )}

            {error && (
              <div className="lobby-alert-pill lobby-alert-pill--error" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="lobby-topbar__right">
            <button
              type="button"
              className={`lobby-orbit-btn ${orbitPaused ? 'is-paused' : ''}`}
              onClick={() => {
                playUiClick();
                setOrbitPaused(prev => !prev);
              }}
              aria-label={orbitPaused ? 'Resume orbit' : 'Pause orbit'}
              aria-pressed={orbitPaused}
              title={orbitPaused ? 'Resume base orbit' : 'Pause base orbit'}
            >
              {orbitPaused ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="8,5 19,12 8,19" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="secondary lobby-leave-btn"
              disabled={disabled}
              onClick={() => {
                playUiClick();
                (onLeave ?? onBack)();
              }}
            >
              LEAVE ROOM
            </button>
          </div>
        </header>

        {gameOver && (
          <div className="lobby-gameover-banner" role="status">
            <span className="lobby-gameover-banner__tag">EXPEDITION COMPLETE</span>
            <strong>{winner ? `${winner.name} survives Mars!` : 'No crew survived the expedition.'}</strong>
          </div>
        )}

        <footer className="lobby-bottom-bar">
          <div className="crew-dock" aria-label="Crew Roster">
            {Array.from({ length: MAX_PLAYERS }, (_, slotIndex) => {
              const player = game.players[slotIndex];

              if (!player) {
                return (
                  <article key={`empty-${slotIndex}`} className="crew-slot crew-slot--empty">
                    <div className="crew-slot__empty-top">
                      <span className="crew-slot__num">SLOT 0{slotIndex + 1}</span>
                      <span className="crew-slot__open-tag">OPEN</span>
                    </div>

                    <div className="crew-slot__empty-body">
                      <div className="crew-slot__silhouette" aria-hidden="true">
                        <svg viewBox="0 0 48 48">
                          <circle cx="24" cy="18" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" />
                          <path d="M10 40c1-8 7-12 14-12s13 4 14 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
                        </svg>
                      </div>

                      {canAddBots ? (
                        <button
                          type="button"
                          className="crew-add-bot-btn"
                          disabled={disabled}
                          onClick={() => {
                            playUiClick();
                            onBots();
                          }}
                        >
                          + ADD BOT
                        </button>
                      ) : (
                        <span className="crew-slot__waiting-copy">
                          {game.round > 0 ? 'NO SEAT IN PLAY' : 'WAITING FOR CREW'}
                        </span>
                      )}
                    </div>
                  </article>
                );
              }

              const isSelf = player.id === game.self.id;
              const isSlotHost = player.id === game.hostId;
              const dead = player.health <= 0;
              const offline = !player.connected && !player.isBot;
              const canKick = isHost && !disabled && !isSelf && (player.isBot || !player.connected);
              const suitColor = resolvePlayerSuitColor(player, game.self.stats, isSelf, slotIndex);

              const healthPct = percentOf(player.health, player.maxHealth);
              const stampText = dead
                ? 'ELIMINATED'
                : offline
                  ? 'OFFLINE'
                  : player.ready
                    ? 'READY'
                    : 'WAITING';
              const stampKind = dead
                ? 'dead'
                : offline
                  ? 'offline'
                  : player.ready
                    ? 'ready'
                    : 'waiting';

              return (
                <article
                  key={player.id}
                  className={[
                    'crew-slot',
                    isSelf ? 'crew-slot--self' : '',
                    dead ? 'crew-slot--dead' : '',
                    offline ? 'crew-slot--offline' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="crew-slot__top">
                    <span className={`crew-stamp crew-stamp--${stampKind}`}>
                      {stampText}
                    </span>

                    <div className="crew-slot__badges">
                      {isSlotHost && <span className="crew-badge crew-badge--host" title="Room Host">★ HOST</span>}
                      {player.isBot && <span className="crew-badge crew-badge--bot">BOT</span>}
                      {canKick && (
                        <button
                          type="button"
                          className="crew-slot__kick"
                          onClick={() => {
                            playUiClick();
                            onRemove(player.id);
                          }}
                          title={`Remove ${player.name}`}
                          aria-label={`Remove ${player.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="crew-slot__hero">
                    <div className={`crew-slot__avatar ${isSelf ? 'crew-slot__avatar--self' : ''}`}>
                      <AstronautPortraitSvg
                        suitColor={suitColor}
                        variant={slotIndex}
                        className="crew-slot__portrait"
                      />
                    </div>

                    <div className="crew-slot__identity">
                      <div className="crew-slot__name-row">
                        <strong className="crew-slot__name" title={player.name}>
                          {player.name}
                        </strong>
                        {isSelf && <span className="crew-you-tag">YOU</span>}
                      </div>

                      <div className="crew-health" aria-label={`Health ${player.health} of ${player.maxHealth}`}>
                        <div className="crew-health__head">
                          <span className="crew-health__label">
                            <svg className="crew-icon crew-icon--hp" viewBox="0 0 20 20" aria-hidden="true">
                              <path
                                d="M10 17.2s-6.2-4-7.6-7.8C1.3 6.4 3.3 3.4 6.3 3.4c1.6 0 3 .9 3.7 2.2.7-1.3 2.1-2.2 3.7-2.2 3 0 5 3 3.9 6-1.4 3.8-7.6 7.8-7.6 7.8z"
                                fill="currentColor"
                              />
                            </svg>
                            HP
                          </span>
                          <span className="crew-health__val">{player.health}/{player.maxHealth}</span>
                        </div>
                        <div className="crew-bar crew-bar--hp">
                          <div
                            className={`crew-bar__fill ${healthPct <= 30 ? 'is-critical' : ''}`}
                            style={{ width: `${healthPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isSelf && (
                    <div className="crew-private-meters" aria-label="Private suit resources">
                      <div className="crew-meter crew-meter--energy" title={`Energy: ${game.self.resources.energy}/${selfMaxEnergy}`}>
                        <div className="crew-meter__top">
                          <span className="crew-meter__label">
                            <svg className="crew-icon" viewBox="0 0 20 20" aria-hidden="true">
                              <polygon points="11,1.5 4,11.5 9.5,11.5 8.5,18.5 16,8.5 10.5,8.5" fill="currentColor" />
                            </svg>
                            NRG
                          </span>
                          <strong className="crew-meter__val">{game.self.resources.energy}</strong>
                        </div>
                        <div className="crew-bar crew-bar--energy">
                          <div
                            className="crew-bar__fill"
                            style={{ width: `${percentOf(game.self.resources.energy, selfMaxEnergy)}%` }}
                          />
                        </div>
                      </div>

                      <div className="crew-meter crew-meter--food" title={`Food: ${game.self.resources.food}/${selfMaxFood}`}>
                        <div className="crew-meter__top">
                          <span className="crew-meter__label">
                            <svg className="crew-icon" viewBox="0 0 20 20" aria-hidden="true">
                              <path
                                d="M16.5 3.5c-5.8.2-10.3 3.2-12 8.2-.4 1.3-.4 2.7.2 3.9l-2 2 1.4 1.4 2-2c1.2.6 2.6.6 3.9.2 5-1.7 8-6.2 8.2-12l-1.7-1.7zm-3.2 4.9c-2 2-4.3 3.6-6.9 4.4 1-2.5 2.5-4.7 4.7-6.4l2.2 2z"
                                fill="currentColor"
                              />
                            </svg>
                            FOOD
                          </span>
                          <strong className="crew-meter__val">{game.self.resources.food}</strong>
                        </div>
                        <div className="crew-bar crew-bar--food">
                          <div
                            className="crew-bar__fill"
                            style={{ width: `${percentOf(game.self.resources.food, selfMaxFood)}%` }}
                          />
                        </div>
                      </div>

                      <div className="crew-meter crew-meter--rad-counter" title={`Radiation: ${game.self.resources.radiation} (cumulative)`}>
                        <span className="crew-meter__label">
                          <span className="crew-rad-icon" aria-hidden="true">
                            <RadiationIcon />
                          </span>
                          RAD
                        </span>
                        <strong className="crew-meter__rad-val">{game.self.resources.radiation}</strong>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="lobby-cta-pair">
            <button
              type="button"
              className={`lobby-ready-toggle ${game.self.ready ? 'is-ready' : ''}`}
              disabled={disabled || gameOver || game.self.health <= 0}
              aria-pressed={game.self.ready}
              title={game.self.ready ? 'Click to cancel ready status' : 'Click to mark yourself ready'}
              onClick={() => {
                playUiConfirm();
                onReady();
              }}
            >
              <span>{game.self.ready ? 'READY' : 'READY?'}</span>
              {game.self.ready && (
                <span className="lobby-ready-toggle__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>

            <button
              type="button"
              className="lobby-start-cta"
              disabled={!canStart}
              title={
                gameOver
                  ? 'Match finished'
                  : !isHost
                    ? 'Only the host can launch the mission'
                    : !allAliveReady
                      ? 'Waiting for all crew members to be ready'
                      : 'Launch mission'
              }
              onClick={() => {
                playUiConfirm();
                onStart();
              }}
            >
              {game.round === 0 ? 'START MATCH' : `START LEVEL ${game.round + 1}`}
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
