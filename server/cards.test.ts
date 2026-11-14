import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATS } from '../shared/constants';
import { CARD_CATALOG, drawCards, radiationDamage, receiveRadiation, resolveCards } from './cards';
import { advanceIfComplete, chooseCard, makePlayer, makeRoom, startRound, submitResult, viewFor } from './gameEngine';
import { timeoutResult } from '../shared/minigames/ranking';

function fixture(count = 4, ids = ['rest', 'eat', 'expedition']) {
  const players = Array.from({ length: count }, (_, i) => makePlayer({ name: `P${i}`, stats: DEFAULT_STATS }, `token-${i}`, `socket-${i}`));
  players.forEach((p, i) => { p.id = `p${i}`; p.resources.food = 40; p.resources.energy = 40; });
  const room = makeRoom('CARDS1', players[0], 0);
  room.round = 1; // Cards phase starts from round 2 onward.
  room.players = players; players.forEach(p => { p.ready = true; }); startRound(room, players[0], 0);
  room.cards = ids.map(id => CARD_CATALOG.find(c => c.id === id)!);
  return { room, players };
}

test('draws exactly three unique eligible cards: one supply, one risk and one special/interaction', () => {
  const { players } = fixture();
  let state = 1;
  const rng = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  let sawRest = false, sawEat = false, sawContamination = false;
  for (let i = 0; i < 1000; i++) {
    const cards = drawCards(players, rng), ids = cards.map(c => c.id);
    assert.equal(cards.length, 3); assert.equal(new Set(ids).size, 3);
    assert.equal(cards[0].category, 'supply');
    assert.equal(cards[1].category, 'risk');
    assert.ok(cards[2].category === 'defense' || cards[2].category === 'interaction');
    assert.ok(!ids.some(id => ['decontamination', 'contagion', 'reinforced-suit'].includes(id)));
    sawRest ||= ids.includes('rest');
    sawEat ||= ids.includes('eat');
  }
  players[0].resources.radiation = 1;
  for (let i = 0; i < 200; i++) sawContamination ||= drawCards(players, rng).some(c => c.id === 'decontamination');
  assert.ok(sawRest && sawEat); assert.ok(sawContamination);
  players[0].health = 0;
  assert.ok(!drawCards(players).some(c => ['decontamination', 'contagion', 'reinforced-suit'].includes(c.id)));
});

test('each resource pool scales by living players, splits independently and cannot be claimed twice', () => {
  const { room, players: p } = fixture(); // 4 alive => pool = 60, 2 choosers each => +30
  p.forEach((q, i) => chooseCard(room, q, i < 2 ? 'rest' : 'eat'));
  assert.equal(p[0].resources.energy, 40);
  resolveCards(room); assert.equal(p[0].resources.energy, 70); assert.equal(p[2].resources.food, 70);
  resolveCards(room); assert.equal(p[0].resources.energy, 70);

  // 2 alive => pool = 30 (not 40); 1 chooser gets +30
  const duo = fixture(2);
  chooseCard(duo.room, duo.players[0], 'rest'); chooseCard(duo.room, duo.players[1], 'eat');
  resolveCards(duo.room);
  assert.equal(duo.players[0].resources.energy, 70);
  assert.equal(duo.players[1].resources.food, 70);

  // 1 alive => pool = 15
  const solo = fixture(1);
  chooseCard(solo.room, solo.players[0], 'rest');
  resolveCards(solo.room);
  assert.equal(solo.players[0].resources.energy, 55);
});

test('rejects unoffered cards, duplicate decisions, dead/self/missing targets and unaffordable costs', () => {
  const { room, players: p } = fixture(3, ['rest', 'sabotage', 'recycle-food']);
  assert.throws(() => chooseCard(room, p[0], 'expedition'));
  assert.throws(() => chooseCard(room, p[0], 'sabotage'));
  assert.throws(() => chooseCard(room, p[0], 'sabotage', p[0].id));
  assert.throws(() => chooseCard(room, p[0], 'sabotage', 'made-up'));
  p[2].health = 0; assert.throws(() => chooseCard(room, p[0], 'sabotage', p[2].id));
  p[0].resources.energy = 14; assert.throws(() => chooseCard(room, p[0], 'recycle-food'));
  p[0].resources.energy = 15; chooseCard(room, p[0], 'recycle-food');
  assert.throws(() => chooseCard(room, p[0], 'rest'));
  chooseCard(room, p[1], 'rest'); resolveCards(room);
  assert.equal(p[0].resources.energy, 0); assert.equal(p[0].resources.food, 55);
});

test('decontamination clears only with a single visitor and clean visitors are contaminated even when cancelled', () => {
  const single = fixture(1, ['rest', 'decontamination', 'eat']);
  single.players[0].resources.radiation = 3;
  chooseCard(single.room, single.players[0], 'decontamination'); resolveCards(single.room);
  assert.equal(single.players[0].resources.radiation, 0);
  const { room, players: p } = fixture(3, ['rest', 'decontamination', 'eat']);
  p[0].resources.radiation = 3;
  p.forEach(q => chooseCard(room, q, 'decontamination')); resolveCards(room);
  assert.deepEqual(p.map(q => q.resources.radiation), [3, 1, 1]);
});

test('shield blocks precisely the next radiation reception; suit blocks precisely the next nonzero round damage', () => {
  const { room, players: p } = fixture(2, ['radiation-shield', 'contagion', 'rest']);
  p[1].resources.radiation = 2;
  chooseCard(room, p[0], 'radiation-shield'); chooseCard(room, p[1], 'contagion', p[0].id);
  resolveCards(room); assert.equal(p[0].resources.radiation, 0); assert.equal(p[0].protection.radiationShield, false);
  assert.equal(receiveRadiation(p[0], 2), true); assert.equal(p[0].resources.radiation, 2);
  p[0].protection.reinforcedSuit = true; p[0].resources.radiation = 0;
  assert.equal(radiationDamage(p[0]), 0); assert.equal(p[0].protection.reinforcedSuit, true);
  p[0].resources.radiation = 2;
  assert.equal(radiationDamage(p[0]), 0); assert.equal(p[0].protection.reinforcedSuit, false);
  assert.equal(radiationDamage(p[0]), 20); assert.equal(p[0].health, 80);
});

test('protection persists across rounds and does not stack when reselected', () => {
  const { room, players: [p] } = fixture(1, ['rest', 'radiation-shield', 'reinforced-suit']);
  chooseCard(room, p, 'radiation-shield'); resolveCards(room);
  room.phase = 'playing'; submitResult(room, p, timeoutResult(room.minigame)); advanceIfComplete(room, 2);
  p.ready = true; advanceIfComplete(room, 2.5);
  p.ready = true; startRound(room, p, 3);
  assert.equal(p.protection.radiationShield, true);
  receiveRadiation(p, 3); assert.equal(p.resources.radiation, 0); assert.equal(p.protection.radiationShield, false);
});

test('mutual sabotage cancels; third-party sabotage still applies', () => {
  const { room, players: p } = fixture(3, ['sabotage', 'eat', 'rest']);
  chooseCard(room, p[0], 'sabotage', p[1].id); chooseCard(room, p[1], 'sabotage', p[0].id);
  chooseCard(room, p[2], 'sabotage', p[0].id); resolveCards(room);
  assert.deepEqual(p.map(q => q.resources.food), [20, 40, 40]);
});

test('theft splits one finite loot pool and simultaneous sabotage never creates food', () => {
  const { room, players: p } = fixture(3, ['supply-theft', 'rest', 'eat']);
  p[0].resources.food = p[1].resources.food = 0; p[2].resources.food = 80;
  chooseCard(room, p[0], 'supply-theft'); chooseCard(room, p[1], 'supply-theft'); chooseCard(room, p[2], 'rest');
  resolveCards(room); assert.deepEqual(p.map(q => q.resources.food), [15, 15, 50]);
  const mixed = fixture(3, ['sabotage', 'supply-theft', 'rest']);
  const q = mixed.players; q[0].resources.food = 0; q[1].resources.food = 0; q[2].resources.food = 10;
  chooseCard(mixed.room, q[0], 'sabotage', q[2].id); chooseCard(mixed.room, q[1], 'supply-theft'); chooseCard(mixed.room, q[2], 'rest');
  resolveCards(mixed.room); assert.equal(q[2].resources.food, 0); assert.equal(q[1].resources.food, 6);
});

test('expedition chance is living players / 5, using an injectable random source', () => {
  for (const [roll, radiation, food] of [[.79, 0, 70], [.8, 1, 40]]) {
    const { room, players: p } = fixture();
    chooseCard(room, p[0], 'expedition'); p.slice(1).forEach(q => chooseCard(room, q, 'rest'));
    resolveCards(room, () => roll); assert.equal(p[0].resources.radiation, radiation); assert.equal(p[0].resources.food, food);
  }
});

test('all risk cards respect their success, failure, health damage and upfront costs', () => {
  for (const id of ['dust-storm', 'ice-cave', 'all-in', 'mysterious-signal']) {
    for (const success of [true, false]) {
      const { room, players: [p] } = fixture(1, [id, 'rest', 'eat']);
      const card = room.cards[0]; chooseCard(room, p, id); resolveCards(room, () => success ? 0 : .99);
      assert.equal(p.resources.food, 40 - (card.cost?.food ?? 0) + (success ? card.effect.food ?? 0 : 0));
      assert.equal(p.resources.energy, 40 - (card.cost?.energy ?? 0) + (success ? card.effect.energy ?? 0 : id === 'dust-storm' ? -15 : 0));
      assert.equal(p.health, success || id !== 'ice-cave' ? 100 : 80);
      assert.equal(p.resources.radiation, !success && id === 'mysterious-signal' ? 1 : 0);
    }
  }
});

test('exchange rotates complete resource pairs; a lone participant keeps their inventory', () => {
  const { room, players: p } = fixture(3, ['exchange', 'rest', 'eat']);
  p.forEach((q, i) => { q.resources.food = 10 * (i + 1); q.resources.energy = 20 * (i + 1); chooseCard(room, q, 'exchange'); });
  resolveCards(room, () => .99);
  assert.deepEqual(p.map(q => [q.resources.food, q.resources.energy]), [[20, 40], [30, 60], [10, 20]]);
  const single = fixture(1, ['exchange', 'rest', 'eat']); chooseCard(single.room, single.players[0], 'exchange'); resolveCards(single.room);
  assert.equal(single.players[0].resources.food, 40);
});

test('contagion keeps source radiation, does nothing to a contaminated target and landing irradiates each chooser', () => {
  const { room, players: p } = fixture(3, ['contagion', 'emergency-landing', 'rest']);
  assert.throws(() => chooseCard(room, p[0], 'contagion', p[1].id));
  p[0].resources.radiation = 2; p[1].resources.radiation = 1;
  chooseCard(room, p[0], 'contagion', p[1].id); chooseCard(room, p[1], 'emergency-landing'); chooseCard(room, p[2], 'emergency-landing');
  resolveCards(room); assert.deepEqual(p.map(q => q.resources.radiation), [2, 2, 1]);
  assert.equal(p[2].resources.food, 65); assert.equal(p[2].resources.energy, 65);
});

test('selections, targets, protection and personal outcomes remain private in socket views', () => {
  const { room, players: p } = fixture(2, ['sabotage', 'rest', 'eat']);
  chooseCard(room, p[0], 'sabotage', p[1].id); chooseCard(room, p[1], 'rest');
  const other = viewFor(room, p[1]);
  assert.equal(other.self.selectedTargetId, null);
  assert.ok(other.players.every(q => !('selectedTargetId' in q) && !('resources' in q) && !('protection' in q)));
  resolveCards(room); assert.notEqual(viewFor(room, p[0]).self.cardOutcome?.summary, viewFor(room, p[1]).self.cardOutcome?.summary);
});

test('elimination excludes dead players and ends a competitive match without reviving them', () => {
  const { room, players: p } = fixture(2);
  p[0].health = 5; p[0].resources.radiation = 1;
  p.forEach(q => chooseCard(room, q, 'rest')); advanceIfComplete(room, 2);
  p.forEach(q => { q.ready = true; }); advanceIfComplete(room, 2);
  p.forEach(q => submitResult(room, q, timeoutResult(room.minigame))); advanceIfComplete(room, 3);
  assert.equal(p[0].health, 0); assert.equal(room.matchFinished, true); assert.equal(room.winnerId, p[1].id);
  assert.throws(() => startRound(room, p[0], 4));
});

test('a disappeared target cancels the action rather than corrupting card resolution', () => {
  const { room, players: p } = fixture(3, ['sabotage', 'rest', 'eat']);
  chooseCard(room, p[0], 'sabotage', p[1].id); chooseCard(room, p[2], 'rest');
  room.players = [p[0], p[2]]; assert.doesNotThrow(() => resolveCards(room));
  assert.match(p[0].cardOutcome!.summary, /ya no está/);
});

test('resolution is independent of seating order and the suit is consumed only by the round-end damage', () => {
  const run = (reverse: boolean) => {
    const { room, players: p } = fixture(3, ['reinforced-suit', 'contagion', 'rest']);
    p[0].resources.radiation = 2; p[1].resources.radiation = 1;
    chooseCard(room, p[0], 'reinforced-suit'); chooseCard(room, p[1], 'contagion', p[2].id); chooseCard(room, p[2], 'rest');
    if (reverse) room.players = [...room.players].reverse();
    advanceIfComplete(room, 2);
    assert.equal(p[0].protection.reinforcedSuit, true); assert.equal(p[0].health, 100);
    p.forEach(q => { q.ready = true; }); advanceIfComplete(room, 2);
    p.forEach(q => submitResult(room, q, timeoutResult(room.minigame))); advanceIfComplete(room, 3);
    assert.equal(p[0].health, 100); assert.equal(p[0].protection.reinforcedSuit, false); assert.equal(p[2].health, 90);
    const state = p.map(q => ({ health: q.health, resources: { ...q.resources }, protection: { ...q.protection } }));
    p.forEach(q => { q.ready = true; }); advanceIfComplete(room, 4); assert.deepEqual(p.map(q => q.health), state.map(q => q.health));
    return state;
  };
  assert.deepEqual(run(false), run(true));
});

test('a death from a card ends a duel immediately and eliminated observers never block another round', () => {
  const duel = fixture(2, ['ice-cave', 'rest', 'eat']);
  duel.players[0].health = 10;
  chooseCard(duel.room, duel.players[0], 'ice-cave'); chooseCard(duel.room, duel.players[1], 'rest');
  resolveCards(duel.room, () => .99); advanceIfComplete(duel.room, 2);
  assert.equal(duel.room.phase, 'lobby'); assert.equal(duel.room.winnerId, duel.players[1].id);
  const { room, players: p } = fixture(3);
  p.forEach(q => chooseCard(room, q, 'rest')); p[0].health = 10; p[0].resources.radiation = 1;
  advanceIfComplete(room, 2);
  assert.equal(room.phase, 'presentation');
  p.forEach(q => { q.ready = true; }); advanceIfComplete(room, 2);
  assert.equal(room.phase, 'playing');
  p.forEach(q => submitResult(room, q, timeoutResult(room.minigame))); advanceIfComplete(room, 3);
  assert.equal(p[0].health, 0); assert.equal(room.matchFinished, false);
  p.slice(1).forEach(q => { q.ready = true; }); advanceIfComplete(room, 3.5);
  assert.equal(room.phase, 'lobby');
  p.slice(1).forEach(q => { q.ready = true; }); startRound(room, p[0], 4);
  assert.equal(room.phase, 'cards');
  assert.equal(p[0].hasChosenCard, true); assert.equal(p[0].hasSubmitted, true);
  const fallback = room.cards.find(c => c.category === 'supply')!;
  p.slice(1).forEach(q => chooseCard(room, q, fallback.id)); advanceIfComplete(room, 5);
  assert.equal(room.phase, 'presentation');
  p.slice(1).forEach(q => { q.ready = true; }); advanceIfComplete(room, 6);
  assert.equal(room.phase, 'playing'); assert.throws(() => submitResult(room, p[0], timeoutResult(room.minigame)));
});

test('card gains, recycling and theft respect profession caps above 100', () => {
  const { room, players: p } = fixture(3, ['emergency-landing', 'recycle-food', 'supply-theft']);
  p[0].stats = { energy: 30, food: 0, health: 0 }; p[0].resources.energy = 110;
  p[1].stats = { energy: 0, food: 30, health: 0 }; p[1].resources.food = 110;
  p[2].stats = { energy: 0, food: 30, health: 0 }; p[2].resources.food = 110;
  chooseCard(room, p[0], 'emergency-landing'); chooseCard(room, p[1], 'recycle-food'); chooseCard(room, p[2], 'supply-theft');
  resolveCards(room);
  assert.equal(p[0].resources.energy, 130);
  assert.equal(p[1].resources.food, 95); // 110 + 15 recycling - 30 stolen.
  assert.equal(p[2].resources.food, 130); // 110 + 30 stolen, capped by profession.
});

test('exchange respects the recipient profession cap and cave damage preserves health above 100', () => {
  const { room, players: p } = fixture(2, ['exchange', 'rest', 'eat']);
  p[0].stats = { energy: 30, food: 0, health: 0 }; p[0].resources.energy = 130; p[0].resources.food = 40;
  p[1].stats = { energy: 0, food: 30, health: 0 }; p[1].resources.energy = 40; p[1].resources.food = 130;
  p.forEach(q => chooseCard(room, q, 'exchange')); resolveCards(room);
  assert.deepEqual(p.map(q => [q.resources.energy, q.resources.food]), [[40, 100], [100, 40]]);
  const cave = fixture(1, ['ice-cave', 'rest', 'eat']);
  cave.players[0].stats = { energy: 0, food: 0, health: 30 }; cave.players[0].health = cave.players[0].maxHealth = 130;
  chooseCard(cave.room, cave.players[0], 'ice-cave'); resolveCards(cave.room, () => .99);
  assert.equal(cave.players[0].health, 110);
});

test('reinforced suit preserves the upkeep, empty-resource damage and last-place penalty from main', () => {
  const { room, players: p } = fixture(2, ['reinforced-suit', 'rest', 'eat']);
  room.minigame = { ...room.minigame, rewards: { ...room.minigame.rewards, winner: { resources: { energy: 20 } } } };
  room.round = 5;
  p[0].health = 100; p[0].resources = { energy: 0, food: 0, radiation: 2 };
  chooseCard(room, p[0], 'reinforced-suit'); chooseCard(room, p[1], 'rest'); advanceIfComplete(room, 2);
  p.forEach(q => { q.ready = true; }); advanceIfComplete(room, 2);
  const result = timeoutResult(room.minigame);
  submitResult(room, p[0], { ...result, score: 0 }); submitResult(room, p[1], { ...result, score: room.minigame.maxScore }); advanceIfComplete(room, 3);
  assert.equal(p[0].health, 30); // -40 last place (round 5 * 8), -15 empty food, -15 empty energy; radiation blocked.
  assert.equal(p[0].protection.reinforcedSuit, false);
  assert.equal(p[0].resources.radiation, 2);
  assert.equal(p[1].resources.food, 10); // 40 - 30 upkeep.
});
