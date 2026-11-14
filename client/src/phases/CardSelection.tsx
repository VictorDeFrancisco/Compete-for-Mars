import type { CardSelectionProps } from '../../../shared/types';
import './CardSelection.css';

// Phase 3: selection is sent to the server; does not mutate resources locally.
export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  return (
    <section className="panel phase-cards">
      <p className="eyebrow">3 · Card Selection</p>
      <h2>Choose your action</h2>
      <p>One choice per player. If time runs out, you will automatically Rest.</p>
      <div className="cards">
        {game.cards.map(card => (
          <article className="card" key={card.id}>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <button disabled={game.self.hasChosenCard} onClick={() => onChoose(card.id)}>
              {game.self.selectedCardId === card.id ? 'Selected ✓' : 'Select'}
            </button>
          </article>
        ))}
      </div>
      <p>{game.players.filter(p => p.hasChosenCard).length}/{game.players.length} selected.</p>
    </section>
  );
}
