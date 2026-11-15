import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATS } from '../shared/constants';
import {
  CARDS,
  advanceIfComplete,
  chooseCard,
  clampResource,
  currentPhase,
  makePlayer,
  makeRoom,
  minigameRewardResource,
  restartMatch,
  RESULT_GRACE_MS,
  ROUND_RESOURCE_UPKEEP,
  roundLoserDamage,
  roundWinBonus,
  startRound,
  submitResult,
  validateEntry,
  viewFor,
} from './gameEngine';
import { timeoutResult } from '../shared/minigames/ranking';

const player = (name: string, stats = { ...DEFAULT_STATS }) =>
  makePlayer({ name, stats }, `secret-token-${name}`, 'socket-' + name);

test('valida estadísticas con límites de profesión (+10/+30) y rechaza presupuestos inválidos', () => {
  assert.deepEqual(validateEntry({ name: ' Ana ', stats: DEFAULT_STATS }), {
    name: 'Ana',
    stats: { energy: 20, food: 10, health: 0 },
  });
  for (const stats of [
    { energy: 30, food: 10, health: 0 },
    { energy: -10, food: 20, health: 20 },
    { energy: 15.5, food: 14.5, health: 0 },
    { energy: 10, food: 10, health: 0 },
  ]) {
    assert.throws(() => validateEntry({ name: 'Ana', stats }));
  }
  assert.throws(() => validateEntry(null));

  const medic = player('Medic', { energy: 0, food: 0, health: 30 });
  assert.equal(medic.health, 130);
  assert.equal(medic.maxHealth, 130);

  const pilot = player('Pilot', { energy: 20, food: 0, health: 10 });
  assert.equal(pilot.health, 110);
  assert.equal(pilot.maxHealth, 110);
  assert.equal(pilot.resources.energy, 120);
  assert.equal(pilot.resources.food, 100);
});

test('ciclo completo, coste -5, topes dinámicos de profesión, cartas simultáneas y privacidad', () => {
  const baseStats = { energy: 0, food: 0, health: 30 }; // Medic: maxHealth 130, energy 100, food 100
  const a = player('Ana', baseStats);
  const b = player('Luis', { energy: 20, food: 0, health: 10 }); // Pilot: maxHealth 110, energy 120, food 100
  const room = makeRoom('ABC123', a, 0);
  room.players.push(b);
  a.ready = b.ready = true;
  assert.throws(() => startRound(room, b, 0));

  // Round 1: no cards phase — goes straight from lobby -> presentation -> playing -> lobby.
  startRound(room, a, 0, () => 0);
  const oldPhaseId = room.phaseId;
  assert.equal(room.round, 1);
  assert.equal(room.phase, 'presentation');
  assert.equal(room.cards.length, 0);
  a.ready = b.ready = true;
  advanceIfComplete(room, 1);
  assert.equal(room.phase, 'playing');
  assert.throws(() => currentPhase(room, 'playing', oldPhaseId));

  const r1Result = timeoutResult(room.minigame);
  submitResult(room, a, { ...r1Result, score: room.minigame.maxScore });
  submitResult(room, b, { ...r1Result, score: 0 });
  advanceIfComplete(room, 2);
  assert.equal(room.phase, 'results');
  a.ready = b.ready = true;
  advanceIfComplete(room, 3);
  assert.equal(room.phase, 'lobby');

  // Round 2: cards phase happens BEFORE presentation.
  a.resources.energy = 100 + a.stats.energy;
  a.resources.food = 100 + a.stats.food;
  a.health = a.maxHealth;
  b.resources.energy = 100 + b.stats.energy;
  b.resources.food = 100 + b.stats.food;
  b.health = b.maxHealth;
  a.ready = b.ready = true;
  startRound(room, a, 4, () => 0);
  assert.equal(room.round, 2);
  assert.equal(room.phase, 'cards');

  const roundResource = minigameRewardResource(room.minigame);
  const otherResource = roundResource === 'energy' ? 'food' : 'energy';
  assert.equal(room.cards.length, 3);
  assert.equal(room.cards[0].category, 'supply');
  assert.equal(room.cards[1].category, 'risk');
  assert.ok(room.cards[2].category === 'defense' || room.cards[2].category === 'interaction');
  room.cards = ['rest', 'eat', 'emergency-landing'].map(id => CARDS.find(card => card.id === id)!);
  chooseCard(room, a, 'emergency-landing');
  chooseCard(room, b, 'rest');
  assert.throws(() => chooseCard(room, a, 'rest'));

  const view = viewFor(room, a);
  assert.equal('token' in view.self, false);
  for (const remote of view.players) {
    assert.equal('resources' in remote, false);
    assert.equal('stats' in remote, false);
    assert.equal('selectedCardId' in remote, false);
    assert.equal('token' in remote, false);
  }

  advanceIfComplete(room, 5);
  assert.equal(room.phase, 'presentation');
  assert.equal(a.resources[roundResource], 100);
  assert.equal(a.resources.radiation, 1);
  a.ready = b.ready = true;
  advanceIfComplete(room, 6);
  assert.equal(room.phase, 'playing');

  const result = timeoutResult(room.minigame);
  assert.throws(() => submitResult(room, a, { ...result, score: Infinity }));
  assert.throws(() => submitResult(room, a, { ...result, score: room.minigame.maxScore + 1 }));
  assert.throws(() => submitResult(room, a, { ...result, minigameId: 'otro' }));

  submitResult(room, a, { ...result, score: room.minigame.maxScore });
  submitResult(room, b, { ...result, score: 0 });
  assert.throws(() => submitResult(room, a, result));

  advanceIfComplete(room, 7);
  assert.equal(room.phase, 'results');
  // a (Medic) started at 130 HP -> 1 radiation (-10 HP) -> 120 HP.
  assert.equal(a.health, 120);
  assert.equal(a.maxHealth, 130);
  assert.equal(a.resources[otherResource], 100 - ROUND_RESOURCE_UPKEEP);
  const expectedWinnerBase = room.minigame.rewards.winner.resources?.[roundResource] ?? 24;
  const expectedWinnerGain = Math.max(0, expectedWinnerBase - Math.max(0, room.round - 1) * 2);
  assert.equal(a.resources[roundResource], 100 - ROUND_RESOURCE_UPKEEP + expectedWinnerGain);
  // b (Pilot) started at 110 HP -> lost round 2 with 0 deaths (-16 HP) -> 94 HP.
  assert.equal(b.health, 94);
  assert.equal(b.maxHealth, 110);
  const expectedBResource = (roundResource === 'energy' ? 120 : 100) - ROUND_RESOURCE_UPKEEP;
  assert.equal(b.resources[roundResource], expectedBResource);
  assert.equal(room.lastResults.find(r => r.playerId === a.id)?.outcome, 'winner');
  assert.equal(a.ready, false);
  assert.equal(room.lastResults.length, 2);

  a.ready = b.ready = true;
  advanceIfComplete(room, 8);
  assert.equal(room.phase, 'lobby');

  a.ready = b.ready = true;
  startRound(room, a, 9, () => 0);
  assert.equal(room.round, 3);
});

test('orden aleatorio controlado: mínimo 2 minijuegos distintos entre repeticiones', () => {
  const a = player('Ana');
  const room = makeRoom('ORD001', a, 0);
  let seed = 17;
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };

  const seenOrder: string[] = [];
  for (let i = 0; i < 40; i++) {
    a.health = a.maxHealth;
    a.resources.energy = 100 + a.stats.energy;
    a.resources.food = 100 + a.stats.food;
    a.resources.radiation = 0;
    a.ready = true;
    startRound(room, a, i * 10, seededRandom);
    const id = room.minigame.id;
    const prevIdx = seenOrder.lastIndexOf(id);
    if (prevIdx !== -1) {
      assert.ok(i - prevIdx >= 3, `Minigame ${id} repeated too soon at step ${i} after ${prevIdx}`);
    }
    seenOrder.push(id);
    if (room.phase === 'cards') {
      const pick = room.cards.find(card => !card.targetRequired && !card.cost) ?? room.cards[0];
      chooseCard(room, a, pick.id);
      advanceIfComplete(room, i * 10 + 1);
    }
    assert.equal(room.phase, 'presentation');
    a.ready = true;
    advanceIfComplete(room, i * 10 + 2);
    assert.equal(room.phase, 'playing');
    submitResult(room, a, timeoutResult(room.minigame));
    advanceIfComplete(room, i * 10 + 3);
    assert.equal(room.phase, 'results');
    a.ready = true;
    advanceIfComplete(room, i * 10 + 4);
    assert.equal(room.phase, 'lobby');
  }
  assert.equal(new Set(seenOrder).size >= 4, true);
  // Bag-shuffle invariant: every full cycle of MINIGAMES.length plays every minigame before repeating.
  const firstCycle = seenOrder.slice(0, 7);
  assert.equal(new Set(firstCycle).size, 7);
  const secondCycle = seenOrder.slice(7, 14);
  assert.equal(new Set(secondCycle).size, 7);
});

test('radiación sin límite superior, daño por 0 comida/energía, decaimiento del +24 y fórmula de último puesto', () => {
  assert.equal(clampResource('radiation', 25), 25);
  assert.equal(roundWinBonus(1), 24);
  assert.equal(roundWinBonus(6), 14);
  assert.equal(roundWinBonus(13), 0);
  assert.equal(roundLoserDamage(5, 0), 40);
  assert.equal(roundLoserDamage(5, 2), 120);

  const a = player('Ana', { energy: 30, food: 0, health: 0 });
  const b = player('Luis', { energy: 0, food: 0, health: 30 }); // maxHealth 130
  const c = player('Sol', { energy: 0, food: 30, health: 0 });
  const room = makeRoom('END001', a, 0);
  room.players.push(b, c);
  c.health = 0;
  b.health = 130;
  b.resources.energy = 0;
  b.resources.food = 0;
  b.resources.radiation = 2;
  room.round = 4; // Next round is round 5.

  a.ready = b.ready = true;
  startRound(room, a, 0, () => 0);
  assert.equal(room.phase, 'cards');
  room.cards = ['exchange', 'rest', 'eat'].map(id => CARDS.find(card => card.id === id)!);
  chooseCard(room, a, 'rest');
  chooseCard(room, b, 'exchange');
  advanceIfComplete(room, 1);
  assert.equal(room.phase, 'presentation');
  a.ready = b.ready = true;
  advanceIfComplete(room, 2);
  submitResult(room, a, { ...timeoutResult(room.minigame), score: room.minigame.maxScore });
  submitResult(room, b, { ...timeoutResult(room.minigame), score: 0 });
  advanceIfComplete(room, 3);

  // Round 5 with 1 prior death:
  // loser b takes 5*8*(1+1)=80 (last) + 15 (0 energy) + 15 (0 food) + 2*10=20 (radiation) = -130 HP -> 130 - 130 = 0 HP.
  assert.equal(b.health, 0);
  assert.equal(room.winnerId, a.id);
  assert.equal(room.phase, 'results');
  assert.throws(() => startRound(room, a, 20));
});

test('los tiempos límite completan elecciones y resultados ausentes', () => {
  const a = player('Ana');
  const room = makeRoom('ABC123', a, 0);
  room.round = 1; // Advance to round 2 so cards phase is active.
  a.ready = true;
  startRound(room, a, 0, () => 0);
  assert.equal(room.phase, 'cards');
  advanceIfComplete(room, room.deadline!);
  assert.equal(room.phase, 'presentation');
  assert.ok(a.selectedCardId && !room.cards.find(c => c.id === a.selectedCardId)?.targetRequired);
  // Presentation/instructions phase has no timer; advances when alive players confirm.
  assert.equal(room.deadline, null);
  a.ready = true;
  advanceIfComplete(room, 100);
  assert.equal(room.phase, 'playing');
  advanceIfComplete(room, room.deadline!);
  assert.equal(room.phase, 'playing');
  advanceIfComplete(room, room.deadline! + RESULT_GRACE_MS);
  assert.equal(room.phase, 'results');
  assert.equal(room.lastResults[0].score, 0);
  advanceIfComplete(room, room.deadline!);
  assert.equal(room.phase, 'lobby');
});

test('restartMatch reinicia la sala tras finalizar una partida y permite volver a jugar', () => {
  const host = player('Ana', { energy: 30, food: 0, health: 0 });
  const guest = player('Luis', { energy: 0, food: 30, health: 0 });
  const room = makeRoom('RES123', host, 0);
  room.players.push(guest);
  host.health = 25;
  host.resources = { energy: 10, food: 15, radiation: 3 };
  guest.health = 0;
  room.round = 4;
  room.matchFinished = true;
  room.winnerId = host.id;
  room.phase = 'lobby';

  assert.throws(() => restartMatch(room, guest, 10));
  restartMatch(room, host, 10);

  assert.equal(room.matchFinished, false);
  assert.equal(room.winnerId, null);
  assert.equal(room.round, 0);
  assert.equal(room.phase, 'lobby');
  assert.equal(host.health, 100);
  assert.deepEqual(host.resources, { energy: 130, food: 100, radiation: 0 });
  assert.equal(guest.health, 100);
  assert.deepEqual(guest.resources, { energy: 100, food: 130, radiation: 0 });

  // El color de traje es público sin filtrar estadísticas
  const viewForGuest = viewFor(room, guest);
  assert.equal(viewForGuest.players.find(p => p.id === host.id)?.suitColor, '#D97706');
  assert.equal(viewForGuest.players.find(p => p.id === guest.id)?.suitColor, '#2F6F4E');
});
