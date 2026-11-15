import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Controls } from './Controls';
import { compareResults, rankResults, timeoutResult, validateResult } from './ranking';
import { pulseDefinition } from './pulse';
import { sequenceRaceDefinition } from './sequenceRace';

test('puntos: ganador, perdedor, puesto intermedio y todos empatados', () => {
  const entries = [60, 10, 90].map((score, i) => ({ playerId: String(i), result: { ...timeoutResult(pulseDefinition), score } }));
  assert.deepEqual(rankResults(pulseDefinition, entries).map(r => [r.playerId, r.outcome]), [['2', 'winner'], ['0', 'neutral'], ['1', 'loser']]);
  const equal = [entries[0], { ...entries[0], playerId: 'another' }];
  assert.ok(rankResults(pulseDefinition, equal).every(r => r.outcome === 'draw'));
  assert.equal(rankResults(pulseDefinition, [entries[0]])[0].outcome, 'draw');
});
test('empates de mejor y peor puesto: compartir o no dar premios', () => {
  const entries = [80, 80, 10, 10].map((score, i) => ({ playerId: String(i), result: { ...timeoutResult(pulseDefinition), score } }));
  assert.deepEqual(rankResults(pulseDefinition, entries).map(r => r.outcome), ['winner', 'winner', 'loser', 'loser']);
  const definition = { ...pulseDefinition, rewards: { ...pulseDefinition.rewards, ties: 'no-award' as const } };
  assert.ok(rankResults(definition, entries).every(r => r.outcome === 'neutral'));
});
test('carreras: terminar prevalece; gana el menor tiempo y el incompleto con menos progreso pierde', () => {
  const base = timeoutResult(sequenceRaceDefinition);
  const entries = [
    { playerId: 'slow', result: { ...base, score: 5, completed: true, reason: 'completed' as const, progress: 1, elapsedMs: 4000 } },
    { playerId: 'incomplete', result: { ...base, progress: 0.9 } },
    { playerId: 'fast', result: { ...base, score: 5, completed: true, reason: 'completed' as const, progress: 1, elapsedMs: 2000 } },
  ];
  assert.deepEqual(rankResults(sequenceRaceDefinition, entries).map(r => [r.playerId, r.outcome]), [['fast', 'winner'], ['slow', 'neutral'], ['incomplete', 'loser']]);
  assert.ok(compareResults(sequenceRaceDefinition, { ...base, progress: 0.8 }, { ...base, progress: 0.2 }) < 0);
});
test('rechaza resultados inconsistentes y no copia datos arbitrarios del cliente', () => {
  const base = timeoutResult(pulseDefinition);
  for (const patch of [{ elapsedMs: NaN }, { progress: 2 }, { score: 101 }, { elapsedMs: -1 }, { completed: true }, { reason: 'inventado' }]) {
    assert.throws(() => validateResult(pulseDefinition, { ...base, ...patch }));
  }
  assert.equal('rewards' in validateResult(pulseDefinition, { ...base, rewards: { health: 100 } }), false);
});
test('controles: teclado, ratón y presentación proceden de la misma definición', () => {
  const controls = new Controls(pulseDefinition.controls);
  assert.deepEqual(controls.forKey('Space'), ['activate']);
  assert.deepEqual(controls.forKey('KeyX'), []);
  assert.deepEqual(controls.forPointer(0), ['activate']);
  assert.equal(controls.hasAction('activate'), true);
  assert.equal(controls.getAction('activate')?.label, 'Trigger Panel');
  assert.match(controls.describe()[0].inputs, /Space/);
});
