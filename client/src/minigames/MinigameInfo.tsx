import { Controls } from '../../../shared/minigames/Controls';
import type { MinigameDefinition, Reward } from '../../../shared/minigames/types';
function describeReward(reward: Reward): string {
  const labels = { energy: 'energy', food: 'food', radiation: 'radiation' };
  const changes = Object.entries(reward.resources ?? {}).map(([key, value]) => `${value! >= 0 ? '+' : ''}${value} ${labels[key as keyof typeof labels]}`);
  if (reward.health) changes.push(`${reward.health > 0 ? '+' : ''}${reward.health} health`);
  return changes.join(', ') || 'No changes';
}
export default function MinigameInfo({ definition }: { definition: MinigameDefinition }) {
  const controls = new Controls(definition.controls);
  return <><h2>{definition.title}</h2><p>{definition.instructions}</p><p><strong>{definition.objective}</strong></p>
    <p>Time limit: {definition.durationMs / 1000} s · {definition.mode === 'score' ? 'Highest score' : 'Fastest completion'}</p>
    <h3>Controls</h3><ul>{controls.describe().map(action => <li key={action.id}><strong>{action.label}: {action.inputs}</strong> — {action.description}</li>)}</ul>
    <p>Winner: {describeReward(definition.rewards.winner)}. Loser: {describeReward(definition.rewards.loser)}.</p>
    <p>Ties: {definition.rewards.ties === 'share' ? 'rewards or penalties are shared among tied players' : 'tied positions receive no reward or penalty'}. If everyone ties or you play solo, there is no ranking reward or penalty.</p>
  </>;
}
