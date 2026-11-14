import type { GameView } from '../../../shared/types';
import { RadiationIcon } from './RadiationIcon';

export default function Hud({ game }: { game: GameView }) {
  return (
    <aside className="panel">
      <h2>Crew · Round {game.round}</h2>
      <ul>
        {game.players.map(p => (
          <li key={p.id}>
            {p.name}: {p.health} HP {p.connected ? '' : '· offline'}
          </li>
        ))}
      </ul>
      <h3>Your resources</h3>
      <p>
        Energy: {game.self.resources.energy}/100 · Food: {game.self.resources.food}/100
      </p>
      <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ffd15c', margin: 0 }}>
        <RadiationIcon />
        <span>Radiation: {game.self.resources.radiation}</span>
      </p>
    </aside>
  );
}
