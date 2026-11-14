import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaseMinigame, type ActionState } from './BaseMinigame';
import { pulseDefinition } from '../../../../shared/minigames/pulse';
import { validateResult } from '../../../../shared/minigames/ranking';
import { PulseGame } from '../games/pulse/PulseGame';
import { SequenceRaceGame } from '../games/sequence-race/SequenceRaceGame';
import { resourceModifiers } from '../../../../shared/minigames/context';

test('recursos bajos reducen cadencia y puntos; el contexto es una copia inmutable', () => {
  let now = 0; const context = { resources: { energy: 0, food: 0, radiation: 0 } };
  const weak = new PulseGame(pulseDefinition, () => now, context);
  const strong = new PulseGame(pulseDefinition, () => now);
  context.resources.food = 10;
  assert.equal(weak.context.resources.food, 0);
  assert.equal(Object.isFrozen(weak.context.resources), true);
  weak.start(); strong.start(); weak.dispatch('activate'); strong.dispatch('activate');
  assert.equal(weak.getSnapshot().score, 4); assert.equal(strong.getSnapshot().score, 5);
  now = 100; weak.dispatch('activate'); strong.dispatch('activate');
  assert.equal(weak.getSnapshot().data.hits, 1); assert.equal(strong.getSnapshot().data.hits, 2);
  now = 400; weak.dispatch('activate'); assert.equal(weak.getSnapshot().data.hits, 2);
});
test('una carrera con pocos recursos requiere separar acciones', () => {
  let now = 0;
  const game = new SequenceRaceGame(undefined, () => now, { resources: { energy: 0, food: 0, radiation: 0 } });
  game.start();
  for (let i = 1; i <= 5; i++) { now = (i - 1) * 400; game.dispatch(`step-${i}`); }
  assert.equal(game.getResult()?.elapsedMs, 1600); assert.equal(game.getResult()?.completed, true);
});
test('recursos completos son neutros y se rechazan valores inválidos', () => {
  assert.deepEqual(resourceModifiers({ resources: { energy: 10, food: 10, radiation: 0 } }), {
    speedMultiplier: 1, scoreMultiplier: 1, actionCooldownMs: 0, reactionDelayMs: 0,
  });
  assert.throws(() => resourceModifiers({ resources: { energy: NaN, food: 5, radiation: 0 } }));
});

test('reloj local: timeout automático conserva puntos, sin acciones después de terminar', () => {
  let now = 0;
  const game = new PulseGame(pulseDefinition, () => now);
  game.dispatch('activate'); assert.equal(game.getSnapshot().score, 0);
  game.start(); game.dispatch('activate'); game.dispatch('activate');
  assert.equal(game.getSnapshot().score, 10);
  now = 20_001; game.dispatch('activate');
  assert.equal(game.getResult()?.score, 10);
  assert.equal(game.getResult()?.reason, 'timeout');
  assert.equal(game.getResult()?.elapsedMs, 20_000);
  assert.doesNotThrow(() => validateResult(pulseDefinition, game.getResult()));
  game.complete(); assert.equal(game.getResult()?.reason, 'timeout');
});
test('carrera: termina sola, conserva tiempo y limpia suscripciones', () => {
  let now = 0; const game = new SequenceRaceGame(undefined, () => now);
  let calls = 0; const off = game.subscribe(() => calls++);
  game.start(); game.dispatch('step-5'); assert.equal(game.getSnapshot().progress, 0);
  for (let i = 1; i <= 5; i++) { now += 100; game.dispatch(`step-${i}`); }
  assert.equal(game.getResult()?.elapsedMs, 500); assert.equal(game.getResult()?.completed, true);
  const result = game.getResult(); game.fail(); assert.equal(game.getResult(), result);
  off(); const previousCalls = calls; game.dispose(); game.dispose(); assert.equal(calls, previousCalls);
});
test('desfase inicial de sala cuenta en el tiempo y el reloj nunca retrocede', () => {
  let now = 0; const game = new PulseGame(pulseDefinition, () => now);
  game.start(5000); assert.equal(game.getSnapshot().elapsedMs, 5000);
  now = 1000; game.tick(); now = 500; game.tick();
  assert.equal(game.getSnapshot().elapsedMs, 6000);
  now = 16_000; game.tick(); assert.equal(game.getResult()?.reason, 'timeout');
});
test('hooks, puntos, progreso, failure y abort se pueden extender sin React', () => {
  class Example extends BaseMinigame<{ updates: number }> {
    protected onStart() { this.addScore(3); }
    protected onUpdate() { this.setData({ updates: this.getSnapshot().data.updates + 1 }); }
    protected onAction(_action: string, state: ActionState) { if (state === 'press') { this.setProgress(0.5); this.fail(); } }
  }
  const game = new Example(pulseDefinition, { updates: 0 }, () => 0);
  game.start(); assert.equal(game.getSnapshot().score, 3);
  game.dispatch('activate'); assert.equal(game.getResult()?.reason, 'failed');
  assert.equal(game.getResult()?.progress, 0.5);
  const another = new Example(pulseDefinition, { updates: 0 }, () => 0);
  another.start(); another.abort(); assert.equal(another.getResult()?.reason, 'aborted');
});
