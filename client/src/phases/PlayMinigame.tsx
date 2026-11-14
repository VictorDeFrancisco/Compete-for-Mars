import { useRef } from 'react';
import type { MinigameProps } from '../../../shared/types';
import MinigameWrapper from '../minigames/MinigameWrapper';
import './PlayMinigame.css';

// El runner local envía un único resultado, sin gestionar premios o daño aquí.
export default function PlayMinigame({ game, onSubmit }: MinigameProps) {
  const initialElapsed = useRef(Math.max(0, game.minigame.durationMs - ((game.deadline ?? game.serverNow) - game.serverNow)));
  return <section className="panel phase-playing"><p className="eyebrow">4 · Jugar minijuego</p><h2>{game.minigame.title}</h2>
    {game.self.hasSubmitted ? <p>Resultado enviado: {game.self.score} puntos. Esperando al resto…</p>
      : <MinigameWrapper definition={game.minigame} initialElapsedMs={initialElapsed.current} onResult={onSubmit} />}
    <p>{game.players.filter(p => p.hasSubmitted).length}/{game.players.length} resultados recibidos.</p>
  </section>;
}
