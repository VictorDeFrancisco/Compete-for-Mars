import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATS } from '../shared/constants';
import { CARDS, advanceIfComplete, chooseCard, currentPhase, makePlayer, makeRoom, startRound, submitResult, validateEntry, viewFor, RESULT_GRACE_MS } from './gameEngine';
import { timeoutResult } from '../shared/minigames/ranking';

const player = (name: string) => makePlayer({ name, stats: { ...DEFAULT_STATS } }, `secret-token-${name}`, 'socket-' + name);
test('valida estadísticas y no acepta presupuestos o valores inválidos', () => {
  assert.equal(validateEntry({ name: ' Ana ', stats: DEFAULT_STATS }).name, 'Ana');
  for (const stats of [{ energy: 4, food: 4, shielding: 4 }, { energy: -1, food: 3, shielding: 4 }, { energy: 1.5, food: 2.5, shielding: 2 }]) {
    assert.throws(() => validateEntry({ name: 'Ana', stats }));
  }
  assert.throws(() => validateEntry(null));
});
test('ciclo completo, acciones una sola vez y recursos privados', () => {
  const a = player('Ana'), b = player('Luis');
  const room = makeRoom('ABC123', a, 0); room.players.push(b);
  a.ready = b.ready = true;
  assert.throws(() => startRound(room, b, 0));
  startRound(room, a, 0);
  const oldPhaseId = room.phaseId;
  assert.equal(room.phase, 'presentation');
  a.ready = b.ready = true; advanceIfComplete(room, 1);
  assert.equal(room.phase, 'cards');
  assert.throws(() => currentPhase(room, 'cards', oldPhaseId));
  room.cards = ['eat', 'rest', 'expedition'].map(id => CARDS.find(c => c.id === id)!);
  a.resources.food = 60; a.resources.energy = 50;
  chooseCard(room, a, 'eat'); chooseCard(room, b, 'rest');
  assert.throws(() => chooseCard(room, a, 'rest'));
  const view = viewFor(room, a);
  assert.equal('token' in view.self, false);
  for (const remote of view.players) {
    assert.equal('resources' in remote, false); assert.equal('stats' in remote, false);
    assert.equal('selectedCardId' in remote, false); assert.equal('token' in remote, false);
  }
  advanceIfComplete(room, 2); assert.equal(room.phase, 'playing');
  assert.equal(a.resources.food, 100);
  assert.equal(a.resources.energy, 50);
  assert.equal(a.resources.radiation, 0);
  const result = timeoutResult(room.minigame);
  assert.throws(() => submitResult(room, a, { ...result, score: Infinity }));
  assert.throws(() => submitResult(room, a, { ...result, score: 101 }));
  assert.throws(() => submitResult(room, a, { ...result, minigameId: 'otro' }));
  submitResult(room, a, { ...result, score: 75 }); submitResult(room, b, { ...result, score: 25 });
  assert.throws(() => submitResult(room, a, result));
  advanceIfComplete(room, 3);
  assert.equal(room.phase, 'lobby'); assert.equal(b.health, 90);
  assert.equal(a.resources.food, 100);
  assert.equal(a.resources.energy, 52);
  assert.equal(room.lastResults.find(result => result.playerId === a.id)?.outcome, 'winner');
  assert.equal(a.ready, false); assert.equal(room.lastResults.length, 2);
  a.ready = b.ready = true; startRound(room, a, 4); assert.equal(room.round, 2);
});
test('radiation starts at 0, is uncapped and deals 5 health per unit at round end', () => {
  const a = player('Ana');
  assert.equal(a.resources.energy, 100); assert.equal(a.resources.food, 100); assert.equal(a.resources.radiation, 0);
  const room = makeRoom('RAD001', a, 0);
  a.ready = true; startRound(room, a, 0);
  a.ready = true; advanceIfComplete(room, 1);
  a.resources.radiation = 12;
  room.cards = ['rest', 'eat', 'expedition'].map(id => CARDS.find(c => c.id === id)!);
  chooseCard(room, a, 'rest'); advanceIfComplete(room, 2);
  assert.equal(a.health, 100);
  submitResult(room, a, timeoutResult(room.minigame)); advanceIfComplete(room, 3);
  assert.equal(a.resources.radiation, 12); assert.equal(a.health, 40);
});

test('los tiempos límite completan elecciones y resultados ausentes', () => {
  const a = player('Ana'); const room = makeRoom('ABC123', a, 0);
  a.ready = true; startRound(room, a, 0);
  advanceIfComplete(room, room.deadline!); assert.equal(room.phase, 'cards');
  advanceIfComplete(room, room.deadline!); assert.equal(room.phase, 'playing');
  assert.ok(a.selectedCardId === 'rest' || a.selectedCardId === 'eat');
  advanceIfComplete(room, room.deadline!); assert.equal(room.phase, 'playing');
  advanceIfComplete(room, room.deadline! + RESULT_GRACE_MS); assert.equal(room.phase, 'lobby');
  assert.equal(room.lastResults[0].score, 0);
});
