import type { GameView } from '../../../shared/types';
export default function Hud({ game }: { game: GameView }) {
  return <aside className="panel"><h2>Tripulación · Ronda {game.round}</h2>
    <ul>{game.players.map(p => <li key={p.id}>{p.name}: {p.health} de vida {p.connected ? '' : '· desconectado'}</li>)}</ul>
    <h3>Tus recursos privados</h3>
    <p>Energía: {game.self.resources.energy} · Comida: {game.self.resources.food} · Radiación: {game.self.resources.radiation}</p>
  </aside>;
}
