import type { MinigameDefinition, MinigameResult, RankedResult } from './types';
/** Comprueba forma y límites. La simulación local todavía es de confianza. */
export function validateResult(definition: MinigameDefinition, input: unknown): MinigameResult {
  const value = input as Partial<MinigameResult> | null;
  if (!value || value.minigameId !== definition.id ||
      !Number.isInteger(value.score) || value.score! < 0 || value.score! > definition.maxScore ||
      typeof value.elapsedMs !== 'number' || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0 || value.elapsedMs > definition.durationMs ||
      typeof value.progress !== 'number' || !Number.isFinite(value.progress) || value.progress < 0 || value.progress > 1 ||
      typeof value.completed !== 'boolean' || !['completed', 'timeout', 'failed', 'aborted'].includes(value.reason!)) throw new Error('Resultado de minijuego inválido.');
  if (value.completed !== (value.reason === 'completed') || (value.completed && value.progress !== 1) ||
      (value.reason === 'timeout' && value.elapsedMs !== definition.durationMs)) throw new Error('Resultado inconsistente.');
  return { minigameId: definition.id, score: value.score!, elapsedMs: value.elapsedMs, progress: value.progress,
    completed: value.completed, reason: value.reason! };
}
export function timeoutResult(definition: MinigameDefinition): MinigameResult {
  return { minigameId: definition.id, score: 0, elapsedMs: definition.durationMs, progress: 0, completed: false, reason: 'timeout' };
}
export function compareResults(definition: MinigameDefinition, a: MinigameResult, b: MinigameResult): number {
  if (definition.mode === 'score') return b.score - a.score;
  if (a.completed !== b.completed) return a.completed ? -1 : 1;
  return a.completed ? a.elapsedMs - b.elapsedMs : b.progress - a.progress || b.score - a.score;
}
export function rankResults(definition: MinigameDefinition, entries: { playerId: string; result: MinigameResult }[]): RankedResult[] {
  const sorted = entries.map(entry => ({ ...entry, result: validateResult(definition, entry.result) }))
    .sort((a, b) => compareResults(definition, a.result, b.result));
  if (!sorted.length) return [];
  const best = sorted[0].result, worst = sorted[sorted.length - 1].result;
  const allEqual = compareResults(definition, best, worst) === 0;
  const bestCount = sorted.filter(entry => compareResults(definition, entry.result, best) === 0).length;
  const worstCount = sorted.filter(entry => compareResults(definition, entry.result, worst) === 0).length;
  let rank = 1;
  return sorted.map((entry, index) => {
    if (index > 0 && compareResults(definition, entry.result, sorted[index - 1].result) !== 0) rank = index + 1;
    const isBest = compareResults(definition, entry.result, best) === 0;
    const isWorst = compareResults(definition, entry.result, worst) === 0;
    const outcome = allEqual ? 'draw'
      : isBest && (bestCount === 1 || definition.rewards.ties === 'share') ? 'winner'
      : isWorst && (worstCount === 1 || definition.rewards.ties === 'share') ? 'loser' : 'neutral';
    return { ...entry, rank, outcome };
  });
}
