import { anomaliesDefinition } from '../../../../../shared/minigames/anomalies';
import type { MinigameContext } from '../../../../../shared/minigames/context';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { ANOMALY_COUNT, generateCircuit, type CircuitBoard } from './circuit';

export const NEXT_PANEL_DELAY_MS = 650;
export const MISTAKE_DELAY_MS = 3000;
export interface AnomaliesData {
  board: CircuitBoard; found: readonly number[]; boardsCleared: number; detections: number; mistakes: number;
  nextBoardAt: number | null; lockedUntil: number; lastMistake: number | null;
}
export class AnomaliesEngine extends BaseMinigame<AnomaliesData> {
  private targetIndex = -1;
  constructor(definition = anomaliesDefinition, clock?: () => number, context?: MinigameContext,
    private readonly randomSeed: () => number = () => Math.floor(Math.random() * 0x100000000)) {
    super(definition, { board: generateCircuit(randomSeed()), found: [], boardsCleared: 0, detections: 0,
      mistakes: 0, nextBoardAt: null, lockedUntil: 0, lastMistake: null }, clock, context);
  }
  inspect(index: number): void { this.targetIndex = index; this.dispatch('inspect'); }
  protected onAction(actionId: string, state: ActionState): void {
    if (actionId !== 'inspect' || state !== 'press') return;
    const { data, elapsedMs } = this.getSnapshot(), index = this.targetIndex;
    if (!Number.isInteger(index) || index < 0 || index >= data.board.components.length
      || data.nextBoardAt !== null || elapsedMs < data.lockedUntil || data.found.includes(index)) return;
    if (!this.tryAction()) return;
    if (!data.board.differences.includes(index)) {
      this.setData({ ...data, mistakes: data.mistakes + 1, lastMistake: index, lockedUntil: elapsedMs + MISTAKE_DELAY_MS });
      this.addScore(-10);
      return;
    }
    const found = [...data.found, index], cleared = found.length === ANOMALY_COUNT;
    this.setData({ ...data, found, detections: data.detections + 1, lastMistake: null,
      boardsCleared: data.boardsCleared + Number(cleared), nextBoardAt: cleared ? elapsedMs + NEXT_PANEL_DELAY_MS : null });
    this.addScore(cleared ? 40 : 10);
    this.setProgress(found.length / ANOMALY_COUNT);
  }
  protected onUpdate(): void {
    const { data, elapsedMs } = this.getSnapshot();
    if (data.nextBoardAt !== null && elapsedMs >= data.nextBoardAt) {
      const seed = this.randomSeed() >>> 0;
      let board = generateCircuit(seed);
      // The four layout IDs follow the low seed bits, so advancing once always changes the shape.
      if (board.layoutId === data.board.layoutId) board = generateCircuit((seed + 1) >>> 0);
      this.setData({ ...data, board, found: [], nextBoardAt: null, lastMistake: null, lockedUntil: 0 });
      this.setProgress(0);
    } else if (data.lastMistake !== null && elapsedMs >= data.lockedUntil) {
      this.setData({ ...data, lastMistake: null });
    }
  }
}
