import { pipesDefinition } from '../../../../../shared/minigames/pipes';
import { seededPrng, type MinigameContext } from '../../../../../shared/minigames/context';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { generateBoard, waterFlow, type PipeBoard } from './board';

export interface PipesData {
  board: PipeBoard; wet: readonly number[]; solved: number; turns: number; nextBoardAt: number | null;
}
export const NEXT_BOARD_DELAY_MS = 650;
export class PipesEngine extends BaseMinigame<PipesData> {
  private targetIndex = -1;
  private readonly randomSeed: () => number;
  constructor(definition = pipesDefinition, clock?: () => number, context?: MinigameContext,
    randomSeed?: () => number) {
    const resolvedRandomSeed =
      randomSeed ??
      (typeof context?.seed === 'number'
        ? (() => {
            const next = seededPrng(context.seed);
            return () => Math.floor(next() * 0x100000000);
          })()
        : () => Math.floor(Math.random() * 0x100000000));
    const board = generateBoard(resolvedRandomSeed()).board;
    super(definition, { board, wet: waterFlow(board).wet, solved: 0, turns: 0, nextBoardAt: null }, clock, context);
    this.randomSeed = resolvedRandomSeed;
  }
  rotateAt(index: number): void {
    this.targetIndex = index;
    this.dispatch('rotate');
  }
  protected onAction(actionId: string, state: ActionState): void {
    if (state !== 'press' || actionId !== 'rotate') return;
    const index = this.targetIndex, snapshot = this.getSnapshot(), data = snapshot.data;
    if (data.nextBoardAt !== null || !Number.isInteger(index) || index < 0 || index >= data.board.cells.length) return;
    if (!this.tryAction()) return;
    const cells = data.board.cells.map((pipe, i) => i === index ? { ...pipe, rotation: (pipe.rotation + 1) % 4 } : pipe);
    const board = { ...data.board, cells }, flow = waterFlow(board);
    const solved = data.solved + Number(flow.solved);
    this.setData({ ...data, board, wet: flow.wet, solved, turns: data.turns + 1,
      nextBoardAt: flow.solved ? snapshot.elapsedMs + NEXT_BOARD_DELAY_MS : null });
    // A complete circuit is always worth the same; resources affect rotation cadence.
    this.setScore(solved * 100);
    this.setProgress(snapshot.elapsedMs / this.definition.durationMs);
  }
  protected onUpdate(): void {
    const { data, elapsedMs } = this.getSnapshot();
    this.setProgress(elapsedMs / this.definition.durationMs);
    if (data.nextBoardAt === null || elapsedMs < data.nextBoardAt) return;
    let seed = this.randomSeed() >>> 0;
    if (seed === data.board.seed) seed = (seed + 1) >>> 0;
    const board = generateBoard(seed).board;
    this.setData({ ...data, board, wet: waterFlow(board).wet, nextBoardAt: null });
  }
}
