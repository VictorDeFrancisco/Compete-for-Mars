import { PIPE_GRID_SIZE } from '../../../../../shared/minigames/pipes';

// Clockwise directions; texture orientations are vertical, up/left, cross, up/left/right.
export const N = 1, E = 2, S = 4, W = 8;
export type PipeKind = 'straight' | 'elbow' | 'cross' | 'tee';
export interface Pipe { kind: PipeKind; rotation: number }
export interface PipeBoard { seed: number; size: number; cells: readonly Pipe[]; entryRow: number; exitRow: number }
const BASE: Record<PipeKind, number> = { straight: N | S, elbow: N | W, cross: N | E | S | W, tee: N | E | W };
const DIRECTIONS = [N, E, S, W];

export function pipeMask(pipe: Pipe): number {
  const mask = BASE[pipe.kind], turns = pipe.rotation % 4;
  return ((mask << turns) | (mask >> (4 - turns))) & 15;
}
export function neighbour(index: number, direction: number, size: number): number {
  const row = Math.floor(index / size), col = index % size;
  if (direction === N) return row > 0 ? index - size : -1;
  if (direction === E) return col < size - 1 ? index + 1 : -1;
  if (direction === S) return row < size - 1 ? index + size : -1;
  return col > 0 ? index - 1 : -1;
}
function directionBetween(from: number, to: number, size: number): number {
  return to === from - size ? N : to === from + size ? S : to === from + 1 ? E : W;
}
export function waterFlow(board: PipeBoard): { wet: number[]; solved: boolean } {
  const start = board.entryRow * board.size;
  if (!(pipeMask(board.cells[start]) & W)) return { wet: [], solved: false };
  const visited = new Set([start]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i], mask = pipeMask(board.cells[current]);
    for (let d = 0; d < 4; d++) {
      if (!(mask & DIRECTIONS[d])) continue;
      const next = neighbour(current, DIRECTIONS[d], board.size);
      if (next < 0 || visited.has(next) || !(pipeMask(board.cells[next]) & DIRECTIONS[(d + 2) % 4])) continue;
      visited.add(next); queue.push(next);
    }
  }
  const end = board.exitRow * board.size + board.size - 1;
  return { wet: queue, solved: visited.has(end) && !!(pipeMask(board.cells[end]) & E) };
}
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Build a known valid route first, then rotate the pieces. Generation is bounded. */
export function generateBoard(seed: number): { board: PipeBoard; solution: readonly Pipe[]; path: readonly number[] } {
  const random = seededRandom(seed), size = PIPE_GRID_SIZE;
  const entryRow = Math.floor(random() * size), exitRow = Math.floor(random() * size);
  const start = entryRow * size, end = exitRow * size + size - 1;
  const path = [start], visited = new Set(path);
  let budget = 8_000;
  function search(current: number): boolean {
    if (--budget <= 0) return false;
    if (current === end) return path.length >= size + 4;
    if (path.length >= size * 4) return false;
    for (const direction of shuffle([...DIRECTIONS], random)) {
      const next = neighbour(current, direction, size);
      if (next < 0 || visited.has(next)) continue;
      visited.add(next); path.push(next);
      if (search(next)) return true;
      visited.delete(next); path.pop();
    }
    return false;
  }
  if (!search(start)) {
    // Guaranteed fallback: down/up the first column, then across the destination row.
    path.splice(0, path.length, start);
    const step = entryRow <= exitRow ? size : -size;
    while (path[path.length - 1] !== exitRow * size) path.push(path[path.length - 1] + step);
    for (let col = 1; col < size; col++) path.push(exitRow * size + col);
  }
  const kinds: PipeKind[] = ['straight', 'elbow', 'tee', 'cross'];
  const solution: Pipe[] = Array.from({ length: size * size }, () => ({
    kind: kinds[Math.floor(random() * 3.25)], rotation: Math.floor(random() * 4),
  }));
  path.forEach((cell, index) => {
    const incoming = index === 0 ? W : directionBetween(cell, path[index - 1], size);
    const outgoing = index === path.length - 1 ? E : directionBetween(cell, path[index + 1], size);
    const required = incoming | outgoing;
    const kind: PipeKind = required === (N | S) || required === (E | W) ? 'straight' : 'elbow';
    let rotation = 0;
    while (pipeMask({ kind, rotation }) !== required) rotation++;
    solution[cell] = { kind, rotation };
  });
  const cells = solution.map(pipe => ({ ...pipe, rotation: Math.floor(random() * 4) }));
  const board: PipeBoard = { seed: seed >>> 0, size, cells, entryRow, exitRow };
  // Never hand the player a board that is already solved, even by an accidental shortcut.
  if (waterFlow(board).solved) {
    while (pipeMask(cells[start]) & W) cells[start] = { ...cells[start], rotation: (cells[start].rotation + 1) % 4 };
  }
  return { board, solution, path };
}
