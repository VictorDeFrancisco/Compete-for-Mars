import type { CardSelectionProps } from '../../../shared/types';
import './CardSelection.css';

// Phase 3: selection is sent to the server; does not mutate resources locally.
export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  const roundResource =
    (game.minigame.rewards.winner.resources?.food ?? 0) > (game.minigame.rewards.winner.resources?.energy ?? 0)
      ? 'food'
      : 'energy';
  const alivePlayers = game.players.filter(p => p.health > 0);

  return (
    <section className="panel phase-cards">
      <p className="eyebrow">3 · Card Selection ({roundResource})</p>
      <h2>Choose your action</h2>
      <p>
        Cards this round use <strong>{roundResource}</strong> (matching the minigame reward). If time runs out, the safe option is picked.
      </p>
      <div className="cards">
        {game.cards.map(card => {
          const affordable =
            ((card.effect.energy ?? 0) >= 0 || game.self.resources.energy >= Math.abs(card.effect.energy ?? 0)) &&
            ((card.effect.food ?? 0) >= 0 || game.self.resources.food >= Math.abs(card.effect.food ?? 0));
          return (
            <article className="card" key={card.id}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <button
                disabled={game.self.health <= 0 || game.self.hasChosenCard || !affordable}
                onClick={() => onChoose(card.id)}
              >
                {game.self.selectedCardId === card.id ? 'Selected ✓' : !affordable ? 'Not enough resources' : 'Select'}
              </button>
            </article>
          );
        })}
      </div>
      <p>{alivePlayers.filter(p => p.hasChosenCard).length}/{alivePlayers.length} selected.</p>
    </section>
  );
}
