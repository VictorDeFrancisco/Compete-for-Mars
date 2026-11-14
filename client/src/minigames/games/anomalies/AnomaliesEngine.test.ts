import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anomaliesDefinition } from '../../../../../shared/minigames/anomalies';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { ANOMALY_COUNT, COMPONENT_COUNT, generateCircuit } from './circuit';
import { AnomaliesEngine, NEXT_PANEL_DELAY_MS } from './AnomaliesEngine';

test('2,000 seeds always produce twelve circuit components and exactly three visual state differences', () => {
  const layouts = new Set<string>();
  for (let seed = 0; seed < 2000; seed++) {
    const board = generateCircuit(seed);
    assert.equal(board.components.length, COMPONENT_COUNT);
    assert.equal(new Set(board.components.map(r => r.id)).size, COMPONENT_COUNT);
    const differences = board.components.flatMap((reading, i) => reading.reference !== reading.inspected ? [i] : []);
    assert.deepEqual(differences, board.differences);
    assert.equal(differences.length, ANOMALY_COUNT);
    assert.ok(board.components.every(r => [0, 1].includes(r.reference) && [0, 1].includes(r.inspected)));
    assert.equal(new Set(board.components.map(r => r.kind)).size, 9);
    if (seed < 20) assert.deepEqual(board, generateCircuit(seed));
    layouts.add(board.differences.join(','));
  }
  assert.ok(layouts.size > 150, 'difference positions should vary');
});

test('every seed draws one connected circuit with both terminals of every part wired and no dangling branches', () => {
  const arrangements = new Set<string>();
  for (let seed = 0; seed < 100; seed++) {
    const board = generateCircuit(seed);
    const graph = new Map<string, Set<string>>();
    const key = (point: readonly number[]) => point.join(',');
    const connect = (a: string, b: string) => {
      if (!graph.has(a)) graph.set(a, new Set());
      if (!graph.has(b)) graph.set(b, new Set());
      graph.get(a)!.add(b); graph.get(b)!.add(a);
    };
    for (const wire of board.wires) {
      for (let i = 1; i < wire.points.length; i++) {
        const a = wire.points[i - 1], b = wire.points[i];
        assert.ok(a[0] === b[0] || a[1] === b[1], 'wires use schematic right angles');
        connect(key(a), key(b));
      }
    }
    for (const part of board.components) {
      const terminals = [-51, 51].map(offset => key(part.rotation ? [part.x, part.y + offset] : [part.x + offset, part.y]));
      assert.ok(terminals.every(terminal => graph.has(terminal)), `${part.id} has both terminals attached`);
      connect(terminals[0], terminals[1]);
    }
    for (const junction of board.junctions) assert.ok((graph.get(key(junction))?.size ?? 0) >= 3);
    assert.ok([...graph.values()].every(neighbours => neighbours.size >= 2), 'no dangling wire ends');
    const visited = new Set<string>(), pending = [graph.keys().next().value!];
    while (pending.length) {
      const node = pending.pop()!;
      if (visited.has(node)) continue;
      visited.add(node); pending.push(...graph.get(node)!);
    }
    assert.equal(visited.size, graph.size, 'all parts and branches belong to the same circuit');
    arrangements.add(board.components.map(part => `${part.x},${part.y}`).join(';'));
  }
  assert.equal(arrangements.size, 8, 'four different schematics, each with two orientations');
});

test('every new board changes the actual layout, including repeated random seeds and unsigned overflow', () => {
  for (const seed of [0, 1, 2, 3, 0xffffffff]) {
    let now = 0;
    const game = new AnomaliesEngine(undefined, () => now, undefined, () => seed);
    game.start();
    for (let round = 0; round < 12; round++) {
      const previous = game.getSnapshot().data.board;
      previous.differences.forEach(index => game.inspect(index));
      now += NEXT_PANEL_DELAY_MS; game.tick();
      const next = game.getSnapshot().data.board;
      assert.notEqual(next.layoutId, previous.layoutId);
      assert.notDeepEqual(next.wires, previous.wires, 'the wiring must change, not only component states');
    }
  }
});

test('wires never run through component bodies and selectable components do not overlap', () => {
  for (let seed = 0; seed < 100; seed++) {
    const board = generateCircuit(seed);
    for (const part of board.components) {
      const rx = part.rotation ? 32 : 36, ry = part.rotation ? 36 : 32;
      for (const { points } of board.wires) for (let i = 1; i < points.length; i++) {
        const [a, b] = [points[i - 1], points[i]];
        const crosses = a[0] === b[0]
          ? a[0] > part.x - rx && a[0] < part.x + rx && Math.max(a[1], b[1]) > part.y - ry && Math.min(a[1], b[1]) < part.y + ry
          : a[1] > part.y - ry && a[1] < part.y + ry && Math.max(a[0], b[0]) > part.x - rx && Math.min(a[0], b[0]) < part.x + rx;
        assert.ok(!crosses, `layout ${board.layoutId}: wire crosses ${part.id}`);
      }
      for (const other of board.components) {
        if (part === other) continue;
        const separated = Math.abs(part.x - other.x) >= (part.rotation ? 43 : 63) + (other.rotation ? 43 : 63)
          || Math.abs(part.y - other.y) >= (part.rotation ? 73 : 55) + (other.rotation ? 73 : 55);
        assert.ok(separated, `layout ${board.layoutId}: targets ${part.id} and ${other.id} overlap`);
      }
    }
  }
});

test('a correct pair scores only once even when clicked repeatedly from either panel', () => {
  const game = new AnomaliesEngine(undefined, () => 0, undefined, () => 7);
  game.start();
  const target = game.getSnapshot().data.board.differences[0];
  game.inspect(target); game.inspect(target); game.inspect(target);
  assert.equal(game.getSnapshot().score, 10);
  assert.equal(game.getSnapshot().data.detections, 1);
  assert.equal(game.getSnapshot().data.found.length, 1);
});

test('third detection awards one bonus, changes seed and keeps the original deadline', () => {
  let now = 1000, seed = 42;
  const game = new AnomaliesEngine(undefined, () => now, undefined, () => seed++);
  game.start(); now += 2000;
  const first = game.getSnapshot().data.board;
  first.differences.forEach(i => game.inspect(i));
  assert.equal(game.getSnapshot().score, 60); assert.equal(game.getSnapshot().data.boardsCleared, 1);
  assert.equal(game.getSnapshot().status, 'running'); assert.equal(game.getResult(), null);
  game.inspect(first.differences[0]); assert.equal(game.getSnapshot().score, 60);
  now += NEXT_PANEL_DELAY_MS - 1; game.tick(); assert.equal(game.getSnapshot().data.board.seed, first.seed);
  now += 1; game.tick();
  assert.notEqual(game.getSnapshot().data.board.seed, first.seed);
  assert.equal(game.getSnapshot().remainingMs, 60_000 - 2000 - NEXT_PANEL_DELAY_MS);
  assert.deepEqual(game.getSnapshot().data.found, []); assert.equal(game.getSnapshot().progress, 0);
  game.getSnapshot().data.board.differences.forEach(i => game.inspect(i));
  assert.equal(game.getSnapshot().score, 120); assert.equal(game.getSnapshot().data.detections, 6);
});

test('a mistake blocks every selection for exactly 3 seconds while the round clock continues', () => {
  let now = 0;
  const game = new AnomaliesEngine(undefined, () => now, undefined, () => 9);
  game.start(); const board = game.getSnapshot().data.board;
  const wrong = board.components.findIndex((_, i) => !board.differences.includes(i));
  game.inspect(board.differences[0]); game.inspect(wrong);
  assert.equal(game.getSnapshot().score, 0); assert.equal(game.getSnapshot().data.mistakes, 1);
  assert.equal(game.getSnapshot().data.lockedUntil, 3000);
  for (let i = 0; i < COMPONENT_COUNT; i++) game.inspect(i);
  assert.equal(game.getSnapshot().data.detections, 1); assert.equal(game.getSnapshot().data.mistakes, 1);
  now = 2999; game.inspect(board.differences[1]); assert.equal(game.getSnapshot().score, 0);
  assert.equal(game.getSnapshot().remainingMs, 57_001);
  assert.equal(game.getSnapshot().data.lockedUntil, 3000, 'blocked clicks must not extend the penalty');
  now = 3000; game.inspect(board.differences[1]); assert.equal(game.getSnapshot().score, 10);
  assert.equal(game.getSnapshot().remainingMs, 57_000);
  assert.equal(game.getSnapshot().data.lastMistake, null);
});

test('timeout at 60 seconds preserves points and blocks late input and panel transitions', () => {
  let now = 0;
  const game = new AnomaliesEngine(undefined, () => now, undefined, () => 3);
  game.start(); now = 59_900;
  game.getSnapshot().data.board.differences.forEach(i => game.inspect(i));
  const seed = game.getSnapshot().data.board.seed;
  now = 60_000; game.inspect(0);
  const result = game.getResult();
  assert.equal(result?.elapsedMs, 60_000); assert.equal(result?.reason, 'timeout'); assert.equal(result?.score, 60);
  now = 70_000; game.tick(); game.inspect(1); game.complete();
  assert.equal(game.getSnapshot().data.board.seed, seed); assert.equal(game.getResult(), result);
  assert.doesNotThrow(() => validateResult(anomaliesDefinition, result));
});

test('low food and energy apply selection cadence without changing solvability', () => {
  let now = 0;
  const game = new AnomaliesEngine(undefined, () => now, { resources: { food: 0, energy: 0, radiation: 0 } }, () => 1);
  game.start(); const targets = game.getSnapshot().data.board.differences;
  game.inspect(targets[0]); game.inspect(targets[1]);
  assert.equal(game.getSnapshot().data.detections, 1);
  now = 399; game.inspect(targets[1]); assert.equal(game.getSnapshot().data.detections, 1);
  now = 400; game.inspect(targets[1]); now = 800; game.inspect(targets[2]);
  assert.equal(game.getSnapshot().score, 60); assert.equal(game.getSnapshot().data.boardsCleared, 1);
});

test('invalid inputs and releases are ignored; restarting creates a clean independent attempt', () => {
  const game = new AnomaliesEngine(undefined, () => 0, undefined, () => 1);
  game.inspect(0); assert.equal(game.getSnapshot().score, 0);
  game.start(); [-1, 12, 1.5, NaN, Infinity].forEach(i => game.inspect(i)); game.dispatch('inspect', 'release');
  assert.equal(game.getSnapshot().data.mistakes, 0); assert.equal(game.getSnapshot().data.detections, 0);
  game.getSnapshot().data.board.differences.forEach(i => game.inspect(i)); game.dispose();
  const fresh = new AnomaliesEngine(undefined, () => 0, undefined, () => 1); fresh.start();
  assert.equal(fresh.getSnapshot().score, 0); assert.equal(fresh.getSnapshot().remainingMs, 60_000);
  assert.equal(fresh.getSnapshot().data.boardsCleared, 0);
});

test('a repeated seed source still advances to a different board and online elapsed time is retained', () => {
  let now = 0;
  const game = new AnomaliesEngine(undefined, () => now, undefined, () => 0);
  game.start(10_000); game.getSnapshot().data.board.differences.forEach(i => game.inspect(i));
  now = NEXT_PANEL_DELAY_MS; game.tick();
  assert.equal(game.getSnapshot().data.board.seed, 1);
  assert.equal(game.getSnapshot().remainingMs, 50_000 - NEXT_PANEL_DELAY_MS);
});
