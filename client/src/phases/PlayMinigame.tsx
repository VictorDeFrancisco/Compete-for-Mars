import { useState } from 'react';
import type { MinigameProps } from '../../../shared/types';
import './PlayMinigame.css';

// Fase 4: sustituir el contenido por el minijuego real conservando onSubmit(0..100).
export default function PlayMinigame({ game, onSubmit }: MinigameProps) {
  const [hits, setHits] = useState(0);
  const score = Math.min(hits * 5, 100);
  return <section className="panel phase-playing"><p className="eyebrow">4 · Jugar minijuego</p><h2>{game.minigame.title}</h2>
    <p>{game.minigame.instructions}</p><p className="score">{game.self.score ?? score} / 100</p>
    <div className="actions"><button disabled={game.self.hasSubmitted || hits >= 20} onClick={() => setHits(n => n + 1)}>Activar panel ({hits}/20)</button>
      <button className="secondary" disabled={game.self.hasSubmitted} onClick={() => onSubmit(score)}>Enviar resultado</button></div>
    <p>{game.self.hasSubmitted ? 'Resultado enviado. Esperando al resto…' : 'El resultado sin enviar cuenta como 0 al terminar el tiempo.'}</p>
    <p>{game.players.filter(p => p.hasSubmitted).length}/{game.players.length} resultados recibidos.</p>
  </section>;
}
