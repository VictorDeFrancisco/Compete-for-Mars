export type ResourceName = 'energy' | 'food' | 'radiation';
export interface Reward { health?: number; resources?: Partial<Record<ResourceName, number>> }
export type ControlBinding =
  | { device: 'keyboard'; code: string; label: string }
  | { device: 'pointer'; button: number; label: string }
  | { device: 'touch'; label: string };
export interface ControlAction { id: string; label: string; description: string; bindings: readonly ControlBinding[] }
export interface MinigameDefinition {
  id: string; title: string; instructions: string; objective: string;
  mode: 'score' | 'race'; durationMs: number; maxScore: number;
  controls: readonly ControlAction[];
  rewards: { winner: Reward; loser: Reward; ties: 'share' | 'no-award' };
}
export type FinishReason = 'completed' | 'timeout' | 'failed' | 'aborted';
export interface MinigameResult {
  minigameId: string; score: number; elapsedMs: number; progress: number;
  completed: boolean; reason: FinishReason;
}
export type Outcome = 'winner' | 'loser' | 'neutral' | 'draw';
export interface RankedResult { playerId: string; rank: number; outcome: Outcome; result: MinigameResult }
export function defineMinigame(definition: MinigameDefinition): MinigameDefinition {
  if (!/^[a-z0-9-]+$/.test(definition.id)) throw new Error('ID de minijuego inválido.');
  if (!Number.isFinite(definition.durationMs) || definition.durationMs < 1000 || definition.durationMs > 600_000) throw new Error('Duración inválida.');
  if (!Number.isInteger(definition.maxScore) || definition.maxScore <= 0) throw new Error('maxScore debe ser positivo.');
  if (new Set(definition.controls.map(action => action.id)).size !== definition.controls.length) throw new Error('Controles duplicados.');
  for (const reward of [definition.rewards.winner, definition.rewards.loser]) {
    for (const value of [reward.health ?? 0, ...Object.values(reward.resources ?? {})]) {
      if (!Number.isFinite(value) || !Number.isInteger(value)) throw new Error('Recompensa inválida.');
    }
  }
  return definition;
}
