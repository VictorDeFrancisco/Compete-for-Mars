import type { GameView } from '../../../shared/types';
import AstronautPortraitSvg, { suitColorForPlayer } from './AstronautPortraitSvg';
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

export default function Hud({
  game,
  seconds = null,
  onLeave,
  leaveLabel = 'LEAVE ROOM',
  disabled = false,
}: HudProps) {
  const selfIndex = Math.max(0, game.players.findIndex(p => p.id === game.self.id));
  const suitColor = suitColorForPlayer(game.self.stats, selfIndex);
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  const radiation = game.self.resources.radiation;

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

      <div className="top-hud__center">
        <div className="top-hud__identity">
          <div className="top-hud__avatar-frame">
            <AstronautPortraitSvg suitColor={suitColor} variant={selfIndex} className="top-hud__avatar" />
          </div>
          <span className="top-hud__name" title={game.self.name}>
            {game.self.name}
          </span>
        </div>

        <div className="top-hud__meters" aria-label="Suit vitals and resources">
          <div className="top-hud__meter" title={`Health: ${game.self.health}/${game.self.maxHealth}`}>
            <div className="top-hud__meter-head">
              <span className="top-hud__meter-label">
                <svg className="top-hud__icon top-hud__icon--hp" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M10 17.2s-6.2-4-7.6-7.8C1.3 6.4 3.3 3.4 6.3 3.4c1.6 0 3 .9 3.7 2.2.7-1.3 2.1-2.2 3.7-2.2 3 0 5 3 3.9 6-1.4 3.8-7.6 7.8-7.6 7.8z"
                    fill="currentColor"
                  />
                </svg>
                HP
              </span>
              <span className="top-hud__meter-val">{game.self.health}/{game.self.maxHealth}</span>
            </div>
            <div className="top-hud__track">
              <div className="top-hud__fill top-hud__fill--hp" style={{ width: `${pct(game.self.health, game.self.maxHealth)}%` }} />
            </div>
          </div>

          <div className="top-hud__meter" title={`Energy: ${game.self.resources.energy}/${maxEnergy}`}>
            <div className="top-hud__meter-head">
              <span className="top-hud__meter-label">
                <svg className="top-hud__icon top-hud__icon--energy" viewBox="0 0 20 20" aria-hidden="true">
                  <polygon points="11,1.5 4,11.5 9.5,11.5 8.5,18.5 16,8.5 10.5,8.5" fill="currentColor" />
                </svg>
                ENERGY
              </span>
              <span className="top-hud__meter-val">{game.self.resources.energy}/{maxEnergy}</span>
            </div>
            <div className="top-hud__track">
              <div className="top-hud__fill top-hud__fill--energy" style={{ width: `${pct(game.self.resources.energy, maxEnergy)}%` }} />
            </div>
          </div>

          <div className="top-hud__meter" title={`Food: ${game.self.resources.food}/${maxFood}`}>
            <div className="top-hud__meter-head">
              <span className="top-hud__meter-label">
                <svg className="top-hud__icon top-hud__icon--food" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M16.5 3.5c-5.8.2-10.3 3.2-12 8.2-.4 1.3-.4 2.7.2 3.9l-2 2 1.4 1.4 2-2c1.2.6 2.6.6 3.9.2 5-1.7 8-6.2 8.2-12l-1.7-1.7zm-3.2 4.9c-2 2-4.3 3.6-6.9 4.4 1-2.5 2.5-4.7 4.7-6.4l2.2 2z"
                    fill="currentColor"
                  />
                </svg>
                FOOD
              </span>
              <span className="top-hud__meter-val">{game.self.resources.food}/{maxFood}</span>
            </div>
            <div className="top-hud__track">
              <div className="top-hud__fill top-hud__fill--food" style={{ width: `${pct(game.self.resources.food, maxFood)}%` }} />
            </div>
          </div>

          <div
            className={`top-hud__rad-badge${radiation > 0 ? ' is-active' : ''}`}
            title={`Radiation: ${radiation} (cumulative)`}
          >
            <span className="top-hud__icon top-hud__icon--rad" aria-hidden="true">
              <RadiationIcon />
            </span>
            <span className="top-hud__rad-label">RAD</span>
            <strong className="top-hud__rad-val">{radiation}</strong>
          </div>
        </div>
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
