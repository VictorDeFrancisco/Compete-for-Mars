import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MINIGAME_CONTEXT } from '../../../../../shared/minigames/context';
import { suitUpDefinition } from '../../../../../shared/minigames/suitUp';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { DEFAULT_SUIT_STEPS, type SuitStep } from './suitStepsConfig';
import { SuitUpEngine } from './SuitUpEngine';

test('SuitUpEngine inicializa en paso 0 con telemetría en cero', () => {
  const game = new SuitUpEngine(suitUpDefinition, () => 0, DEFAULT_MINIGAME_CONTEXT, DEFAULT_SUIT_STEPS);
  const snap = game.getSnapshot();

  assert.equal(snap.status, 'idle');
  assert.equal(snap.score, 0);
  assert.equal(snap.progress, 0);
  assert.equal(snap.data.currentStepIndex, 0);
  assert.equal(snap.data.totalSteps, DEFAULT_SUIT_STEPS.length);
  assert.equal(snap.data.suitPressurePsi, 0);
  assert.equal(snap.data.completedParts.length, 0);
});

test('Timing QTE: acierto perfecto, acierto normal y fallo fuera de zona', () => {
  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, DEFAULT_SUIT_STEPS);
  game.start();

  // Paso 1 es 'lcvg-cooling', tipo timing con sweetSpot [0.62, 0.88] y periodo 1400ms
  // Centro = 0.75 => a 1400 * 0.75 = 1050ms
  now = 1050;
  game.tick();

  const progress = game.getSnapshot().data.qteProgress;
  assert.ok(Math.abs(progress - 0.75) < 0.05, `Progreso esperado cercano a 0.75, fue ${progress}`);

  // Disparamos la acción en el centro perfecto
  game.dispatch('action-primary', 'press');

  const afterHit = game.getSnapshot();
  assert.equal(afterHit.data.currentStepIndex, 1);
  assert.equal(afterHit.data.lastRating, 'PERFECT');
  assert.ok(afterHit.score > 0);
  assert.ok(afterHit.data.completedParts.includes('cooling'));
});

test('Timing QTE: fallo por pulsar demasiado pronto no avanza el paso', () => {
  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, DEFAULT_SUIT_STEPS);
  game.start();

  // Progreso en 100ms (0.07), muy antes del sweetSpot (0.62)
  now = 100;
  game.tick();

  game.dispatch('action-primary', 'press');

  const snap = game.getSnapshot();
  assert.equal(snap.data.currentStepIndex, 0);
  assert.equal(snap.data.lastRating, 'MISS');
  assert.equal(snap.score, 0);
});

test('Sequence QTE: avanza con teclas correctas y se reinicia si falla', () => {
  // Creamos un paso de secuencia aislado para probar
  const seqStep: SuitStep = {
    id: 'test-seq',
    partKey: 'boots',
    name: 'Secuencia Test',
    code: 'SEQ-01',
    prompt: 'TEST',
    description: 'TEST',
    lore: 'TEST',
    qte: {
      type: 'sequence',
      sequence: ['action-up', 'action-right', 'action-down'],
      durationMs: 5000,
      basePoints: 100,
      perfectBonus: 20,
    },
  };

  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, [seqStep]);
  game.start();

  // Primer tecla correcta
  game.dispatch('action-up', 'press');
  assert.equal(game.getSnapshot().data.sequenceIndex, 1);

  // Tecla errónea (debería reiniciar la secuencia a 0)
  game.dispatch('action-left', 'press');
  assert.equal(game.getSnapshot().data.sequenceIndex, 0);
  assert.equal(game.getSnapshot().data.lastRating, 'MISS');

  // Ahora introducimos la secuencia completa correcta: Arriba -> Derecha -> Abajo
  game.dispatch('action-up', 'press');
  assert.equal(game.getSnapshot().data.sequenceIndex, 1);

  game.dispatch('action-right', 'press');
  assert.equal(game.getSnapshot().data.sequenceIndex, 2);

  game.dispatch('action-down', 'press');

  // Al completar la secuencia del único paso, el juego termina completado
  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.completed, true);
  assert.equal(result.reason, 'completed');
  assert.equal(result.progress, 1);
  assert.doesNotThrow(() => validateResult(suitUpDefinition, result));
});

test('Mash QTE: pulsaciones rápidas llenan el medidor y completan el paso', () => {
  const mashStep: SuitStep = {
    id: 'test-mash',
    partKey: 'torso',
    name: 'Mash Test',
    code: 'MASH-01',
    prompt: 'TEST',
    description: 'TEST',
    lore: 'TEST',
    qte: {
      type: 'mash',
      actionId: 'action-primary',
      targetCount: 4,
      leakRatePerSec: 0,
      durationMs: 5000,
      basePoints: 100,
      perfectBonus: 20,
    },
  };

  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, [mashStep]);
  game.start();

  // 3 pulsaciones
  game.dispatch('action-primary', 'press');
  game.dispatch('action-primary', 'press');
  game.dispatch('action-primary', 'press');
  assert.equal(game.getSnapshot().data.mashCount, 3);
  assert.equal(game.getResult(), null);

  // 4ª pulsación alcanza el objetivo de 4
  game.dispatch('action-primary', 'press');
  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.completed, true);
  assert.equal(result.score, 120);
});

test('Hold QTE: mantener y soltar en la zona óptima completa con éxito', () => {
  const holdStep: SuitStep = {
    id: 'test-hold',
    partKey: 'helmet',
    name: 'Hold Test',
    code: 'HOLD-01',
    prompt: 'TEST',
    description: 'TEST',
    lore: 'TEST',
    qte: {
      type: 'hold',
      actionId: 'action-primary',
      chargeDurationMs: 1000,
      targetMin: 0.60,
      targetMax: 0.90,
      perfectMin: 0.70,
      perfectMax: 0.80,
      durationMs: 5000,
      basePoints: 100,
      perfectBonus: 30,
    },
  };

  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, [holdStep]);
  game.start();

  // Iniciar hold
  game.dispatch('action-primary', 'press');
  assert.equal(game.getSnapshot().data.isHolding, true);

  // Avanzar 750ms (0.75, dentro de perfectMin y perfectMax)
  now = 750;
  game.tick();

  // Soltar acción
  game.dispatch('action-primary', 'release');
  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.completed, true);
  assert.equal(result.score, 130); // 100 base + 30 perfect
});

test('Hold QTE: soltar demasiado pronto resulta en MISS', () => {
  const holdStep: SuitStep = {
    id: 'test-hold-miss',
    partKey: 'helmet',
    name: 'Hold Miss',
    code: 'HOLD-02',
    prompt: 'TEST',
    description: 'TEST',
    lore: 'TEST',
    qte: {
      type: 'hold',
      actionId: 'action-primary',
      chargeDurationMs: 1000,
      targetMin: 0.60,
      targetMax: 0.90,
      perfectMin: 0.70,
      perfectMax: 0.80,
      durationMs: 5000,
      basePoints: 100,
      perfectBonus: 30,
    },
  };

  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, [holdStep]);
  game.start();

  game.dispatch('action-primary', 'press');
  now = 300; // 0.30, antes del targetMin de 0.60
  game.tick();
  game.dispatch('action-primary', 'release');

  const snap = game.getSnapshot();
  assert.equal(snap.data.lastRating, 'MISS');
  assert.equal(snap.result, null);
});

test('Modificadores de recursos: baja comida reduce puntos proporcionalmente', () => {
  const lowFoodContext = { resources: { energy: 10, food: 0, radiation: 0 } };
  const simpleStep: SuitStep = {
    id: 'test-points',
    partKey: 'cooling',
    name: 'Points Test',
    code: 'PTS-01',
    prompt: 'TEST',
    description: 'TEST',
    lore: 'TEST',
    qte: {
      type: 'mash',
      actionId: 'action-primary',
      targetCount: 1,
      leakRatePerSec: 0,
      durationMs: 5000,
      basePoints: 100,
      perfectBonus: 0,
    },
  };

  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, lowFoodContext, [simpleStep]);
  game.start();

  game.dispatch('action-primary', 'press');
  const result = game.getResult();
  assert.ok(result);
  // Con comida 0, scoreMultiplier es 0.75 => 100 * 0.75 = 75
  assert.equal(result.score, 75);
});

test('Timeout al expirar durationMs genera resultado válido según contrato', () => {
  let now = 0;
  const game = new SuitUpEngine(suitUpDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  game.start();

  now = suitUpDefinition.durationMs + 10;
  game.tick();

  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.completed, false);
  assert.equal(result.reason, 'timeout');
  assert.equal(result.elapsedMs, suitUpDefinition.durationMs);
  assert.doesNotThrow(() => validateResult(suitUpDefinition, result));
});

test('Semilla compartida genera pasos aleatorios idénticos para la misma ronda y distintos entre semillas', () => {
  const ctxA = { resources: { energy: 10, food: 10, radiation: 0 }, seed: 10101 };
  const ctxB = { resources: { energy: 7, food: 8, radiation: 1 }, seed: 10101 };
  const ctxC = { resources: { energy: 10, food: 10, radiation: 0 }, seed: 90909 };

  const engineA = new SuitUpEngine(suitUpDefinition, () => 0, ctxA);
  const engineB = new SuitUpEngine(suitUpDefinition, () => 0, ctxB);
  const engineC = new SuitUpEngine(suitUpDefinition, () => 0, ctxC);

  assert.deepEqual(engineA.steps, engineB.steps);
  assert.notDeepEqual(engineA.steps, engineC.steps);
});

test('Sin semilla explícita genera pasos aleatorios distintos entre partidas', () => {
  const signatures = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const engine = new SuitUpEngine(suitUpDefinition, () => 0, DEFAULT_MINIGAME_CONTEXT);
    assert.ok(engine.steps.length >= 6);
    signatures.add(engine.steps.map(s => `${s.id}:${s.qte.type}`).join('|'));
  }
  assert.ok(signatures.size >= 2, 'Sin seed los pasos deben variar aleatoriamente');
});
