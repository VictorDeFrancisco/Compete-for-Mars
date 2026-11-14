import type { PresentationProps } from '../../../shared/types';
import MinigameInfo from '../minigames/MinigameInfo';
import './MinigamePresentation.css';

// Phase 2: this component does not create sockets or change phases by itself.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  return (
    <section className="panel phase-presentation">
      <p className="eyebrow">2 · Minigame Briefing</p>
      <MinigameInfo definition={game.minigame} />
      <p>After this briefing you will choose an action card.</p>
      <button disabled={game.self.ready} onClick={onReady}>
        {game.self.ready ? 'Waiting for crew…' : 'Got it'}
      </button>
      <p>
        {game.players.filter(p => p.ready).length}/{game.players.length} ready. The phase also advances when time expires.
      </p>
    </section>
  );
}
