import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateBoard, pipeMask, waterFlow, E, W, type PipeBoard } from './board';
import { PipesEngine, NEXT_BOARD_DELAY_MS } from './PipesEngine';
import { pipesDefinition } from '../../../../../shared/minigames/pipes';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { deriveRoundSeed } from '../../../../../shared/minigames/context';

test('2,000 seeds are reproducible, initially unsolved and have a valid solution', () => {
  for (let seed = 0; seed < 2_000; seed++) {
    const { board, solution, path } = generateBoard(seed);
    assert.equal(waterFlow(board).solved, false, `initial seed ${seed}`);
    assert.equal(waterFlow({ ...board, cells: solution }).solved, true, `solution seed ${seed}`);
    assert.equal(new Set(path).size, path.length);
    assert.ok(pipeMask(solution[board.entryRow * board.size]) & W);
    assert.ok(pipeMask(solution[board.exitRow * board.size + board.size - 1]) & E);
    if (seed < 20) assert.deepEqual(generateBoard(seed).board, board);
  }
});

test('flow needs reciprocal openings and cannot wrap around the edge', () => {
  const board: PipeBoard = { size: 2, seed: 0, entryRow: 0, exitRow: 1, cells: [
    { kind: 'straight', rotation: 1 }, { kind: 'straight', rotation: 1 },
    { kind: 'straight', rotation: 1 }, { kind: 'straight', rotation: 1 },
  ] };
  assert.deepEqual(waterFlow(board), { wet: [0, 1], solved: false });
  assert.deepEqual(waterFlow({ ...board, cells: [{ kind: 'straight', rotation: 0 }, ...board.cells.slice(1)] }), { wet: [], solved: false });
  assert.deepEqual(waterFlow({ ...board, cells: [board.cells[0], { kind: 'straight', rotation: 0 }, ...board.cells.slice(2)] }), { wet: [0], solved: false });
});

function solve(game: PipesEngine, advance: () => void = () => {}) {
  const { solution } = generateBoard(game.getSnapshot().data.board.seed);
  for (let index = 0; index < solution.length; index++) {
    for (let turn = 0; turn < 4; turn++) {
      const { data } = game.getSnapshot();
      if (data.nextBoardAt !== null) return;
      if (pipeMask(data.board.cells[index]) === pipeMask(solution[index])) break;
      advance(); game.rotateAt(index);
    }
  }
  assert.notEqual(game.getSnapshot().data.nextBoardAt, null);
}

test('completion awards once, generates another seed and preserves the minute deadline', () => {
  let now = 0, nextSeed = 42;
  const game = new PipesEngine(undefined, () => now, undefined, () => nextSeed++);
  game.start(); now = 1_000;
  solve(game);
  const firstSeed = game.getSnapshot().data.board.seed;
  assert.equal(game.getSnapshot().score, 100);
  assert.equal(game.getSnapshot().data.solved, 1);
  assert.equal(game.getSnapshot().status, 'running');
  const turns = game.getSnapshot().data.turns;
  game.rotateAt(0); assert.equal(game.getSnapshot().data.turns, turns);
  now += NEXT_BOARD_DELAY_MS; game.tick();
  assert.notEqual(game.getSnapshot().data.board.seed, firstSeed);
  assert.equal(game.getSnapshot().remainingMs, 60_000 - now);
  solve(game); assert.equal(game.getSnapshot().score, 200);
  now = 60_000; game.tick();
  assert.equal(game.getResult()?.reason, 'timeout');
  assert.equal(game.getResult()?.elapsedMs, 60_000);
  assert.equal(game.getResult()?.score, 200);
  const result = game.getResult(); game.rotateAt(0); assert.equal(game.getResult(), result);
  assert.doesNotThrow(() => validateResult(pipesDefinition, result));
});

test('low resources slow rotation but do not prevent a solution; reset creates a clean run', () => {
  let now = 0;
  const game = new PipesEngine(undefined, () => now, { resources: { energy: 0, food: 0, radiation: 0 } }, () => 7);
  game.start();
  game.rotateAt(-1); game.rotateAt(36); game.rotateAt(NaN);
  assert.equal(game.getSnapshot().data.turns, 0);
  game.rotateAt(0); game.rotateAt(1); assert.equal(game.getSnapshot().data.turns, 1);
  now = 399; game.rotateAt(1); assert.equal(game.getSnapshot().data.turns, 1);
  now = 400; game.rotateAt(1); assert.equal(game.getSnapshot().data.turns, 2);
  solve(game, () => { now += 400; });
  assert.equal(game.getSnapshot().score, 100);
  game.dispose();
  const fresh = new PipesEngine(undefined, () => now, undefined, () => 7);
  fresh.start();
  assert.equal(fresh.getSnapshot().score, 0);
  assert.equal(fresh.getSnapshot().data.turns, 0);
  assert.equal(fresh.getSnapshot().remainingMs, 60_000);
});

test('late input cannot award a circuit and duplicate seed sources advance', () => {
  let now = 0;
  const game = new PipesEngine(undefined, () => now, undefined, () => 0);
  game.start(); solve(game);
  now = NEXT_BOARD_DELAY_MS; game.tick(); assert.equal(game.getSnapshot().data.board.seed, 1);
  now = 60_000; game.rotateAt(0);
  assert.equal(game.getResult()?.reason, 'timeout');
  assert.equal(game.getSnapshot().score, 100);
});

test('shared context seed produces identical board sequence for all players', () => {
  const seed = deriveRoundSeed('phase-42', 'MARS', 2, 'pipes');
  let nowA = 0, nowB = 0;
  const playerA = new PipesEngine(undefined, () => nowA, { resources: { energy: 10, food: 10, radiation: 0 }, seed });
  const playerB = new PipesEngine(undefined, () => nowB, { resources: { energy: 6, food: 7, radiation: 2 }, seed });
  playerA.start(); playerB.start();
  assert.deepEqual(playerA.getSnapshot().data.board, playerB.getSnapshot().data.board);

  solve(playerA, () => { nowA += 400; });
  solve(playerB, () => { nowB += 400; });
  nowA += NEXT_BOARD_DELAY_MS; nowB += NEXT_BOARD_DELAY_MS;
  playerA.tick(); playerB.tick();
  assert.deepEqual(playerA.getSnapshot().data.board, playerB.getSnapshot().data.board);
});
