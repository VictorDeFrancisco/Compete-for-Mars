import type { GameView } from '../../../shared/types';
import { RadiationIcon } from './RadiationIcon';

function MeterBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: 'energy' | 'food';
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return (
    <div className="hud-meter">
      <div className="hud-meter__head">
        <span>{label}</span>
        <strong>
          {value}/{max}
        </strong>
      </div>
      <div className="hud-meter__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={`hud-meter__fill hud-meter__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Hud({ game }: { game: GameView }) {
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  return (
    <aside className="panel hud-panel">
      <p className="eyebrow">Round {game.round}</p>
      <h2>Crew status</h2>
      <ul>
        {game.players.map(p => (
          <li key={p.id}>
            <span>{p.name}</span>
            <span>
              {p.health}/{p.maxHealth} HP {p.connected ? '' : '· offline'}
            </span>
          </li>
        ))}
      </ul>

      <h3>Your reserves</h3>
      <div className="hud-meters">
        <MeterBar label="ENERGY" value={game.self.resources.energy} max={maxEnergy} tone="energy" />
        <MeterBar label="FOOD" value={game.self.resources.food} max={maxFood} tone="food" />
      </div>

      <div className={`hud-rad-gauge${game.self.resources.radiation > 0 ? ' hud-rad-gauge--active' : ''}`}>
        <span className="hud-rad-gauge__label">
          <RadiationIcon />
          <span>RADIATION</span>
        </span>
        <strong className="hud-rad-gauge__val">{game.self.resources.radiation}</strong>
      </div>
    </aside>
  );
}
