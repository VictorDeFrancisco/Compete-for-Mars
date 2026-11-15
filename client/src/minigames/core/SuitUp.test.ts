import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MINIGAME_CONTEXT } from '../../../../shared/minigames/context';
import { suitUpDefinition } from '../../../../shared/minigames/suitUp';
import { validateResult } from '../../../../shared/minigames/ranking';
import { DEFAULT_SUIT_STEPS } from '../games/suit-up/suitStepsConfig';
import { SuitUpEngine, calculateSuitUpTimeBonus } from '../games/suit-up/SuitUpEngine';

test('suit-up: el tiempo restante influye en la puntuación al completar el traje', () => {
  const fastBonus = calculateSuitUpTimeBonus(50_000, suitUpDefinition.durationMs, 1);
  const slowBonus = calculateSuitUpTimeBonus(5_000, suitUpDefinition.durationMs, 1);
  assert.ok(fastBonus > slowBonus, 'Completar antes debe otorgar más bonus por tiempo');

  const completeAllSteps = (initialElapsedMs: number) => {
    let now = 0;
    const steps = DEFAULT_SUIT_STEPS.slice(0, 2);
    const stepTwoOnly = [
      {
        ...steps[1],
        qte: { ...steps[1].qte },
      },
    ];
    const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, stepTwoOnly);
    game.start(initialElapsedMs);
    if (stepTwoOnly[0].qte.type === 'sequence') {
      for (const action of stepTwoOnly[0].qte.sequence) {
        game.dispatch(action, 'press');
      }
    }
    return game.getResult();
  };

  const fastResult = completeAllSteps(2_000);
  const lateResult = completeAllSteps(48_000);

  assert.ok(fastResult?.completed && lateResult?.completed);
  assert.ok(fastResult.score > lateResult.score, 'Completar más rápido debe dar mayor puntuación');
  assert.doesNotThrow(() => validateResult(suitUpDefinition, fastResult));
  assert.doesNotThrow(() => validateResult(suitUpDefinition, lateResult));
});
