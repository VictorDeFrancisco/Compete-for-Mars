import { useEffect, useRef, useState } from 'react';
import type { GameView, PublicPlayer } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from './AstronautPortraitSvg';
import { EnergyIcon, FoodIcon, RadiationIcon } from './ResourceIcons';
import './Hud.css';

export interface HudProps {
  game: GameView;
  seconds?: number | null;
  onLeave?: () => void;
  leaveLabel?: string;
  disabled?: boolean;
}

function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function SkullSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 6 C17 6, 8 16, 8 30 C8 39, 13 46, 20 49 V56 C20 58, 22 59, 24 59 H40 C42 59, 44 58, 44 56 V49 C51 46, 56 39, 56 30 C56 16, 47 6, 32 6 Z"
        fill="#F5EFE0"
        stroke="#1A1817"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="31" r="6" fill="#1A1817" />
      <circle cx="42" cy="31" r="6" fill="#1A1817" />
      <path d="M32 37 L28 45 H36 Z" fill="#1A1817" />
      <line x1="26" y1="51" x2="26" y2="58" stroke="#1A1817" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="51" x2="32" y2="58" stroke="#1A1817" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="51" x2="38" y2="58" stroke="#1A1817" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function playerStatusTag(player: PublicPlayer, phase: GameView['phase']): {
  label: string;
  tone: 'neutral' | 'ready' | 'score' | 'offline' | 'dead';
} {
  if (player.health <= 0) {
    return { label: 'MUERTO', tone: 'dead' };
  }
  if (!player.connected) {
    return { label: 'OFFLINE', tone: 'offline' };
  }
  if (phase === 'playing') {
    if (typeof player.liveScore === 'number') {
      return { label: `${player.liveScore} PTS`, tone: player.hasSubmitted ? 'ready' : 'score' };
    }
    return { label: player.hasSubmitted ? 'DONE ✓' : 'LIVE', tone: player.hasSubmitted ? 'ready' : 'score' };
  }
  if (phase === 'results') {
    return player.ready ? { label: 'READY ✓', tone: 'ready' } : { label: `${player.liveScore ?? 0} PTS`, tone: 'score' };
  }
  if (phase === 'presentation') {
    return player.ready ? { label: 'READY ✓', tone: 'ready' } : { label: 'READING', tone: 'neutral' };
  }
  if (phase === 'cards') {
    return player.hasChosenCard ? { label: 'LOCKED ✓', tone: 'ready' } : { label: 'CHOOSING', tone: 'neutral' };
  }
  return { label: 'ACTIVE', tone: 'neutral' };
}

export default function Hud({
  game,
  seconds = null,
  onLeave,
  leaveLabel = 'LEAVE ROOM',
  disabled = false,
}: HudProps) {
  return (
    <header className="top-hud" aria-label="Mission Status Bar">
      <div className="top-hud__left">
        <span className="top-hud__round">ROUND {String(game.round).padStart(2, '0')}</span>
        {seconds !== null && (
          <strong
            className={`top-hud__timer${seconds <= 10 ? ' top-hud__timer--low' : ''}`}
            role="timer"
            aria-label={`Tiempo restante: ${seconds} segundos`}
          >
            <span className="top-hud__timer-label">TIEMPO</span>
            <span>{seconds}s</span>
          </strong>
        )}
      </div>

      <div className="top-hud__right">
        {onLeave && (
          <button
            type="button"
            className="secondary top-hud__leave"
            disabled={disabled}
            onClick={onLeave}
          >
            {leaveLabel}
          </button>
        )}
      </div>
    </header>
  );
}

interface StatDeltaEvent {
  id: number;
  playerId: string;
  scope: 'hp' | 'energy' | 'food' | 'rad';
  label: string;
  tone: 'hp' | 'energy' | 'food' | 'rad';
}

interface DeathAlertEvent {
  id: number;
  playerId: string;
  playerName: string;
}

interface DockSnapshot {
  code: string;
  healthById: Record<string, number>;
  energy: number;
  food: number;
  radiation: number;
}

function DeltaScopeIcon({ scope }: { scope: StatDeltaEvent['scope'] }) {
  if (scope === 'energy') return <EnergyIcon className="crew-delta-pop__icon" />;
  if (scope === 'food') return <FoodIcon className="crew-delta-pop__icon" />;
  if (scope === 'rad') return <RadiationIcon className="crew-delta-pop__icon" />;
  return null;
}

function formatDelta(value: number, suffix?: string): string {
  const num = value > 0 ? `+${value}` : `${value}`;
  return suffix ? `${num} ${suffix}` : num;
}

export function BottomCrewDock({ game }: { game: GameView }) {
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  const radiation = game.self.resources.radiation;

  const [deltas, setDeltas] = useState<StatDeltaEvent[]>([]);
  const [cardPulses, setCardPulses] = useState<Record<string, 'damage' | 'heal'>>({});
  const [deathAlerts, setDeathAlerts] = useState<DeathAlertEvent[]>([]);
  const snapshotRef = useRef<DockSnapshot | null>(null);
  const seqRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) {
        window.clearTimeout(id);
      }
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const nextHealthById: Record<string, number> = {};
    for (const player of game.players) {
      nextHealthById[player.id] = player.health;
    }

    const prev = snapshotRef.current;
    snapshotRef.current = {
      code: game.code,
      healthById: nextHealthById,
      energy: game.self.resources.energy,
      food: game.self.resources.food,
      radiation: game.self.resources.radiation,
    };

    if (!prev || prev.code !== game.code) {
      setDeltas([]);
      setCardPulses({});
      setDeathAlerts([]);
      return;
    }

    const spawned: StatDeltaEvent[] = [];
    const pulses: Record<string, 'damage' | 'heal'> = {};
    const newDeaths: DeathAlertEvent[] = [];

    for (const player of game.players) {
      const prevHp = prev.healthById[player.id];
      if (typeof prevHp === 'number' && prevHp !== player.health) {
        const diff = player.health - prevHp;
        spawned.push({
          id: ++seqRef.current,
          playerId: player.id,
          scope: 'hp',
          label: formatDelta(diff, 'HP'),
          tone: 'hp',
        });
        pulses[player.id] = diff < 0 ? 'damage' : 'heal';
        if (prevHp > 0 && player.health <= 0) {
          newDeaths.push({
            id: ++seqRef.current,
            playerId: player.id,
            playerName: player.name,
          });
        }
      }
    }

    const energyDiff = game.self.resources.energy - prev.energy;
    if (energyDiff !== 0) {
      spawned.push({
        id: ++seqRef.current,
        playerId: game.self.id,
        scope: 'energy',
        label: formatDelta(energyDiff),
        tone: 'energy',
      });
    }

    const foodDiff = game.self.resources.food - prev.food;
    if (foodDiff !== 0) {
      spawned.push({
        id: ++seqRef.current,
        playerId: game.self.id,
        scope: 'food',
        label: formatDelta(foodDiff),
        tone: 'food',
      });
    }

    const radDiff = game.self.resources.radiation - prev.radiation;
    if (radDiff !== 0) {
      spawned.push({
        id: ++seqRef.current,
        playerId: game.self.id,
        scope: 'rad',
        label: formatDelta(radDiff),
        tone: 'rad',
      });
      if (radDiff > 0 && !pulses[game.self.id]) {
        pulses[game.self.id] = 'damage';
      }
    }

    const waitLeaderboardReveal =
      game.phase === 'results' && !game.self.ready && game.self.health > 0;
    const revealDelayMs =
      game.phase === 'presentation' && game.self.cardOutcome
        ? 650
        : waitLeaderboardReveal
          ? 2250
          : 0;

    const scheduleReveal = (fn: () => void) => {
      if (revealDelayMs <= 0) {
        fn();
        return;
      }
      if (waitLeaderboardReveal) {
        let fired = false;
        const runOnce = () => {
          if (fired) return;
          fired = true;
          window.removeEventListener('mars:leaderboard-reveal', onReveal);
          window.clearTimeout(fallbackTimer);
          fn();
        };
        const onReveal = () => runOnce();
        const fallbackTimer = window.setTimeout(runOnce, revealDelayMs);
        window.addEventListener('mars:leaderboard-reveal', onReveal, { once: true });
        timersRef.current.push(fallbackTimer);
        return;
      }
      const delayTimer = window.setTimeout(fn, revealDelayMs);
      timersRef.current.push(delayTimer);
    };

    if (spawned.length > 0) {
      const spawnedIds = new Set(spawned.map(item => item.id));
      scheduleReveal(() => {
        setDeltas(current => [...current, ...spawned]);
        const clearTimer = window.setTimeout(() => {
          setDeltas(current => current.filter(item => !spawnedIds.has(item.id)));
        }, 3600);
        timersRef.current.push(clearTimer);
      });
    }

    const pulseKeys = Object.keys(pulses);
    if (pulseKeys.length > 0) {
      scheduleReveal(() => {
        setCardPulses(current => ({ ...current, ...pulses }));
        const pulseTimer = window.setTimeout(() => {
          setCardPulses(current => {
            const next = { ...current };
            for (const key of pulseKeys) {
              if (next[key] === pulses[key]) delete next[key];
            }
            return next;
          });
        }, 1450);
        timersRef.current.push(pulseTimer);
      });
    }
    if (newDeaths.length > 0) {
      const deathIds = new Set(newDeaths.map(item => item.id));
      scheduleReveal(() => {
        setDeathAlerts(current => [...current, ...newDeaths]);
        const deathTimer = window.setTimeout(() => {
          setDeathAlerts(current => current.filter(item => !deathIds.has(item.id)));
        }, 3400);
        timersRef.current.push(deathTimer);
      });
    }
  }, [game]);

  return (
    <>
      {deathAlerts.length > 0 && (
        <div className="crew-death-callout-stack" aria-live="assertive">
          {deathAlerts.map(item => (
            <div key={item.id} className="crew-death-callout">
              <SkullSvg className="crew-death-callout__skull" />
              <span className="crew-death-callout__label">
                {item.playerName.toUpperCase()} HA MUERTO
              </span>
            </div>
          ))}
        </div>
      )}

      <footer className="bottom-crew-dock" aria-label="Crew Telemetry Dock">
        {game.players.map((player, index) => {
          const isSelf = player.id === game.self.id;
          const isDead = player.health <= 0;
          const suitColor = resolvePlayerSuitColor(player, game.self.stats, isSelf, index);
          const badge = playerStatusTag(player, game.phase);
          const hpPercent = pct(player.health, player.maxHealth);
          const pulse = cardPulses[player.id];
          const justDied = deathAlerts.some(d => d.playerId === player.id);
          const hpDeltas = deltas.filter(d => d.playerId === player.id && d.scope === 'hp');
          const energyDeltas = isSelf ? deltas.filter(d => d.playerId === player.id && d.scope === 'energy') : [];
          const foodDeltas = isSelf ? deltas.filter(d => d.playerId === player.id && d.scope === 'food') : [];
          const radDeltas = isSelf ? deltas.filter(d => d.playerId === player.id && d.scope === 'rad') : [];

          return (
            <article
              key={player.id}
              className={[
                'crew-dock-card',
                isSelf ? 'crew-dock-card--self' : '',
                isDead ? 'crew-dock-card--dead' : '',
                !player.connected && !isDead ? 'crew-dock-card--offline' : '',
                pulse === 'damage' ? 'crew-dock-card--damage' : '',
                pulse === 'heal' ? 'crew-dock-card--heal' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {justDied && (
                <div className="crew-death-card-skull" aria-hidden="true">
                  <SkullSvg className="crew-death-card-skull__svg" />
                </div>
              )}

              {hpDeltas.length > 0 && (
                <div className="crew-delta-stack crew-delta-stack--hp" aria-live="polite">
                  {hpDeltas.map(item => (
                    <span key={item.id} className={`crew-delta-pop crew-delta-pop--${item.tone}`}>
                      {item.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="crew-dock-card__identity">
                <div className="crew-dock-card__avatar-frame">
                  <AstronautPortraitSvg
                    suitColor={suitColor}
                    variant={index}
                    className="crew-dock-card__avatar"
                  />
                  {isDead && <SkullSvg className="crew-dock-card__skull-badge" />}
                </div>

              <div className="crew-dock-card__meta">
                <div className="crew-dock-card__name-row">
                  <strong className="crew-dock-card__name" title={player.name}>
                    {player.name}
                  </strong>
                  {isSelf && <span className="crew-dock-card__you">YOU</span>}
                  <span className={`crew-dock-card__status crew-dock-card__status--${badge.tone}`}>
                    {badge.label}
                  </span>
                </div>

                <div
                  className="crew-dock-card__hp-row"
                  title={`HP: ${player.health}/${player.maxHealth}`}
                >
                  <span className="crew-dock-card__stat-tag crew-dock-card__stat-tag--hp">HP</span>
                  <div className="crew-dock-card__track">
                    <div
                      className="crew-dock-card__fill crew-dock-card__fill--hp"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                  <span className="crew-dock-card__stat-val">
                    {player.health}/{player.maxHealth}
                  </span>
                </div>
              </div>
            </div>

            {isSelf && (
              <div className="crew-dock-card__self-resources" aria-label="Personal Resources">
                <div
                  className="crew-dock-res"
                  title={`Energy: ${game.self.resources.energy}/${maxEnergy}`}
                >
                  {energyDeltas.length > 0 && (
                    <div className="crew-delta-stack" aria-live="polite">
                      {energyDeltas.map(item => (
                        <span key={item.id} className={`crew-delta-pop crew-delta-pop--${item.tone}`}>
                          <span>{item.label}</span>
                          <DeltaScopeIcon scope={item.scope} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="crew-dock-res__head">
                    <span className="crew-dock-res__label">
                      <EnergyIcon className="crew-dock-res__icon" /> ENERGY
                    </span>
                    <b>
                      {game.self.resources.energy}/{maxEnergy}
                    </b>
                  </div>
                  <div className="crew-dock-card__track crew-dock-card__track--sm">
                    <div
                      className="crew-dock-card__fill crew-dock-card__fill--energy"
                      style={{ width: `${pct(game.self.resources.energy, maxEnergy)}%` }}
                    />
                  </div>
                </div>

                <div
                  className="crew-dock-res"
                  title={`Food: ${game.self.resources.food}/${maxFood}`}
                >
                  {foodDeltas.length > 0 && (
                    <div className="crew-delta-stack" aria-live="polite">
                      {foodDeltas.map(item => (
                        <span key={item.id} className={`crew-delta-pop crew-delta-pop--${item.tone}`}>
                          <span>{item.label}</span>
                          <DeltaScopeIcon scope={item.scope} />
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="crew-dock-res__head">
                    <span className="crew-dock-res__label">
                      <FoodIcon className="crew-dock-res__icon" /> FOOD
                    </span>
                    <b>
                      {game.self.resources.food}/{maxFood}
                    </b>
                  </div>
                  <div className="crew-dock-card__track crew-dock-card__track--sm">
                    <div
                      className="crew-dock-card__fill crew-dock-card__fill--food"
                      style={{ width: `${pct(game.self.resources.food, maxFood)}%` }}
                    />
                  </div>
                </div>

                <div
                  className={`crew-dock-rad${radiation > 0 ? ' is-active' : ''}`}
                  title={`Radiation: ${radiation} (cumulative)`}
                >
                  {radDeltas.length > 0 && (
                    <div className="crew-delta-stack" aria-live="polite">
                      {radDeltas.map(item => (
                        <span key={item.id} className={`crew-delta-pop crew-delta-pop--${item.tone}`}>
                          <span>{item.label}</span>
                          <DeltaScopeIcon scope={item.scope} />
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="crew-dock-rad__icon" aria-hidden="true">
                    <RadiationIcon />
                  </span>
                  <span className="crew-dock-rad__label">RAD</span>
                  <strong className="crew-dock-rad__val">{radiation}</strong>
                </div>
              </div>
            )}
            </article>
          );
        })}
      </footer>
    </>
  );
}
