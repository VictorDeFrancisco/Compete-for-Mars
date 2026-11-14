import type { GameView } from '../../../shared/types';
import { RadiationIcon } from './RadiationIcon';

export default function Hud({ game }: { game: GameView }) {
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  return (
    <aside className="panel hud-panel">
      <p className="eyebrow">CREW_TELEMETRY // ROUND {game.round}</p>
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
      <p>
        Energy: {game.self.resources.energy}/{maxEnergy} · Food: {game.self.resources.food}/{maxFood}
      </p>
      <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ffd15c', margin: 0 }}>
        <RadiationIcon />
        <span>Radiation: {game.self.resources.radiation}</span>
      </p>
    </aside>
  );
}
