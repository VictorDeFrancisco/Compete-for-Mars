import { Controls } from '../../../shared/minigames/Controls';
import type { MinigameDefinition, Reward } from '../../../shared/minigames/types';
function describeReward(reward: Reward): string {
  const labels = { energy: 'energía', food: 'comida', radiation: 'radiación' };
  const changes = Object.entries(reward.resources ?? {}).map(([key, value]) => `${value! >= 0 ? '+' : ''}${value} ${labels[key as keyof typeof labels]}`);
  if (reward.health) changes.push(`${reward.health > 0 ? '+' : ''}${reward.health} vida`);
  return changes.join(', ') || 'Sin cambios';
}
export default function MinigameInfo({ definition }: { definition: MinigameDefinition }) {
  const controls = new Controls(definition.controls);
  return <><h2>{definition.title}</h2><p>{definition.instructions}</p><p><strong>{definition.objective}</strong></p>
    <p>Límite: {definition.durationMs / 1000} s · {definition.mode === 'score' ? 'Más puntos' : 'Menor tiempo de finalización'}</p>
    <h3>Controles</h3><ul>{controls.describe().map(action => <li key={action.id}><strong>{action.label}: {action.inputs}</strong> — {action.description}</li>)}</ul>
    <p>Ganador: {describeReward(definition.rewards.winner)}. Perdedor: {describeReward(definition.rewards.loser)}.</p>
    <p>Empates: {definition.rewards.ties === 'share' ? 'se comparten premios o penalizaciones entre los empatados' : 'un puesto empatado no recibe premio ni penalización'}. Si todos empatan o juegas solo, no hay premio ni penalización de clasificación.</p>
  </>;
}
