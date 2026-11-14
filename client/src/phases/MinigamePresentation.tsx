import type { PresentationProps } from '../../../shared/types';
import MinigameInfo from '../minigames/MinigameInfo';
import './MinigamePresentation.css';

// Phase 2: this component does not create sockets or change phases by itself.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  const rewardFood = game.minigame.rewards.winner.resources?.food ?? 0;
  const rewardEnergy = game.minigame.rewards.winner.resources?.energy ?? 0;
  const resource = rewardFood > rewardEnergy ? 'food' : 'energy';
  const baseBonus = (resource === 'food' ? rewardFood : rewardEnergy) || 20;
  const roundBonus = Math.max(0, baseBonus - Math.max(0, game.round - 1) * 2);
  const deaths = game.players.filter(p => p.health <= 0).length;
  const loserPenalty = Math.max(1, game.round) * (deaths + 1);

  if (game.self.health <= 0) return <section className="panel phase-presentation"><h2>Spectating the mission</h2><p>The surviving crew is preparing the next round.</p></section>;

  return (
    <section className="panel phase-presentation">
      <p className="eyebrow">2 · Minigame Briefing · Round {game.round}</p>
      <MinigameInfo definition={game.minigame} />
      <p>
        <strong>This round:</strong> All players spend 5 energy and 5 food. Winner gets +{roundBonus} {resource}.
        Last place loses {loserPenalty} health. Radiation deals 5 health per point, and each resource at 0 costs 10 health.
      </p>
      <p>Next: choose one of three action cards. Reinforced suits block radiation damage only; other survival penalties still apply.</p>
      <button disabled={game.self.ready || game.self.health <= 0} onClick={onReady}>
        {game.self.health <= 0 ? 'Eliminated' : game.self.ready ? 'Waiting for crew…' : 'Got it'}
      </button>
      <p>
        {game.players.filter(p => p.health > 0 && p.ready).length}/{game.players.filter(p => p.health > 0).length} ready.
        The phase also advances when time expires.
      </p>
    </section>
  );
}
