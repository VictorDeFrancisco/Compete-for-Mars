import type { GameView, PublicPlayer } from '../../../shared/types';
import AstronautPortraitSvg, { suitColorByIndex, suitColorForPlayer } from './AstronautPortraitSvg';
import { RadiationIcon } from './RadiationIcon';
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

function playerStatusTag(player: PublicPlayer, phase: GameView['phase']): {
  label: string;
  tone: 'neutral' | 'ready' | 'score' | 'offline';
} {
  if (player.health <= 0) {
    return { label: 'OUT', tone: 'offline' };
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
          >
            {seconds}s
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

export function BottomCrewDock({ game }: { game: GameView }) {
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  const radiation = game.self.resources.radiation;

  return (
    <footer className="bottom-crew-dock" aria-label="Crew Telemetry Dock">
      {game.players.map((player, index) => {
        const isSelf = player.id === game.self.id;
        const suitColor = isSelf
          ? suitColorForPlayer(game.self.stats, index)
          : suitColorByIndex(index);
        const badge = playerStatusTag(player, game.phase);
        const hpPercent = pct(player.health, player.maxHealth);

        return (
          <article
            key={player.id}
            className={`crew-dock-card${isSelf ? ' crew-dock-card--self' : ''}${!player.connected ? ' crew-dock-card--offline' : ''}`}
          >
            <div className="crew-dock-card__identity">
              <div className="crew-dock-card__avatar-frame">
                <AstronautPortraitSvg
                  suitColor={suitColor}
                  variant={index}
                  className="crew-dock-card__avatar"
                />
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
                  <div className="crew-dock-res__head">
                    <span>⚡ ENERGY</span>
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
                  <div className="crew-dock-res__head">
                    <span>🌿 FOOD</span>
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
  );
}
