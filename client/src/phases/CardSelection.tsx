import type { CardSelectionProps } from '../../../shared/types';
import './CardSelection.css';

// Fase 3: la elección se envía al servidor; no modifica recursos localmente.
export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  return <section className="panel phase-cards"><p className="eyebrow">3 · Elección de cartas</p><h2>Elige tu acción</h2>
    <p>Una elección por jugador. Si se acaba el tiempo sin elegir, descansarás.</p>
    <div className="cards">{game.cards.map(card => <article className="card" key={card.id}>
      <h3>{card.title}</h3><p>{card.description}</p>
      <button disabled={game.self.hasChosenCard} onClick={() => onChoose(card.id)}>
        {game.self.selectedCardId === card.id ? 'Elegida ✓' : 'Elegir'}
      </button>
    </article>)}</div>
    <p>{game.players.filter(p => p.hasChosenCard).length}/{game.players.length} han elegido. Las elecciones ajenas son privadas.</p>
  </section>;
}
