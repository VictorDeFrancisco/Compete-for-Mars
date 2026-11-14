import type { PresentationProps } from '../../../shared/types';
import './MinigamePresentation.css';

// Fase 2: este componente no crea sockets ni cambia de fase por su cuenta.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  return <section className="panel phase-presentation"><p className="eyebrow">2 · Presentación del minijuego</p>
    <h2>{game.minigame.title}</h2><p>{game.minigame.instructions}</p>
    <p>Duración: {game.minigame.durationMs / 1000} segundos. Después de esta presentación elegirás una carta.</p>
    <button disabled={game.self.ready} onClick={onReady}>{game.self.ready ? 'Esperando a la tripulación…' : 'Entendido'}</button>
    <p>{game.players.filter(p => p.ready).length}/{game.players.length} preparados. La fase avanza también al terminar el tiempo.</p>
  </section>;
}
