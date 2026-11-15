import { Controls } from '../../../../shared/minigames/Controls';
import { copyContext, DEFAULT_MINIGAME_CONTEXT, resourceModifiers, type MinigameContext, type ResourceModifiers } from '../../../../shared/minigames/context';
import type { FinishReason, MinigameDefinition, MinigameResult } from '../../../../shared/minigames/types';

export interface MinigameSnapshot<T extends object = object> {
  status: 'idle' | 'running' | 'finished' | 'disposed';
  score: number; progress: number; elapsedMs: number; remainingMs: number;
  data: Readonly<T>; result: Readonly<MinigameResult> | null;
}
export type ActionState = 'press' | 'release';

/** Una instancia por intento. Sin React, Socket.io, recursos globales ni listeners DOM. */
export abstract class BaseMinigame<T extends object = object> {
  readonly controls: Controls;
  readonly context: MinigameContext;
  readonly modifiers: Readonly<ResourceModifiers>;
  private snapshot: MinigameSnapshot<T>;
  private listeners = new Set<() => void>();
  private startedAt = 0;
  private initialElapsedMs = 0;
  private previousElapsedMs = 0;
  private lastActionMs = -Infinity;
  constructor(readonly definition: MinigameDefinition, data: T, private readonly clock: () => number = () => performance.now(), context: MinigameContext = DEFAULT_MINIGAME_CONTEXT) {
    this.context = copyContext(context);
    this.modifiers = resourceModifiers(this.context);
    this.controls = new Controls(definition.controls);
    this.snapshot = { status: 'idle', score: 0, progress: 0, elapsedMs: 0, remainingMs: definition.durationMs, data: { ...data }, result: null };
  }
  getSnapshot = (): MinigameSnapshot<T> => this.snapshot;
  getResult(): Readonly<MinigameResult> | null { return this.snapshot.result; }
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener); return () => { this.listeners.delete(listener); };
  };
  start(initialElapsedMs = 0): void {
    if (this.snapshot.status !== 'idle') return;
    if (!Number.isFinite(initialElapsedMs) || initialElapsedMs < 0) throw new Error('Invalid initial elapsed time.');
    this.initialElapsedMs = Math.min(initialElapsedMs, this.definition.durationMs);
    this.startedAt = this.clock(); this.previousElapsedMs = this.initialElapsedMs;
    this.patch({ status: 'running' });
    this.onStart(); this.tick();
  }
  tick(): void {
    if (this.snapshot.status !== 'running') return;
    const elapsedMs = this.elapsed();
    const deltaMs = elapsedMs - this.previousElapsedMs;
    this.previousElapsedMs = elapsedMs;
    this.patch({ elapsedMs, remainingMs: this.definition.durationMs - elapsedMs });
    if (elapsedMs >= this.definition.durationMs) { this.finish('timeout'); return; }
    this.onUpdate(deltaMs);
  }
  dispatch(actionId: string, state: ActionState = 'press'): void {
    this.tick();
    if (this.snapshot.status !== 'running' || !this.controls.hasAction(actionId)) return;
    this.onAction(actionId, state);
  }
  complete(): void { this.finish('completed'); }
  fail(): void { this.finish('failed'); }
  abort(): void { this.finish('aborted'); }
  dispose(): void {
    if (this.snapshot.status === 'disposed') return;
    this.onDispose(); this.patch({ status: 'disposed' }); this.listeners.clear();
  }
  protected setScore(score: number): void {
    if (this.snapshot.status !== 'running') return;
    if (!Number.isFinite(score)) throw new Error('Score must be finite.');
    this.patch({ score: Math.max(0, Math.min(this.definition.maxScore, Math.round(score))) });
  }
  protected addScore(points: number): void { this.setScore(this.snapshot.score + points); }
  /** Invocar una vez por acción válida si el juego usa penalización de cadencia. */
  protected tryAction(): boolean {
    if (this.snapshot.status !== 'running') return false;
    const cooldown = this.modifiers.actionCooldownMs + this.modifiers.reactionDelayMs;
    if (this.snapshot.elapsedMs - this.lastActionMs < cooldown) return false;
    this.lastActionMs = this.snapshot.elapsedMs;
    return true;
  }
  protected setProgress(progress: number): void {
    if (this.snapshot.status !== 'running') return;
    if (!Number.isFinite(progress)) throw new Error('Progress must be finite.');
    this.patch({ progress: Math.max(0, Math.min(1, progress)) });
  }
  protected setData(data: T): void {
    if (this.snapshot.status === 'running') this.patch({ data: { ...data } });
  }
  protected onStart(): void {}
  protected onUpdate(_deltaMs: number): void {}
  protected abstract onAction(actionId: string, state: ActionState): void;
  protected onFinish(_result: Readonly<MinigameResult>): void {}
  protected onDispose(): void {}
  private elapsed(): number {
    return Math.min(this.definition.durationMs, Math.max(this.previousElapsedMs, this.initialElapsedMs + this.clock() - this.startedAt));
  }
  private finish(reason: FinishReason): void {
    if (this.snapshot.status !== 'running') return;
    const elapsedMs = this.elapsed();
    if (elapsedMs >= this.definition.durationMs) reason = 'timeout';
    const completed = reason === 'completed';
    const result = Object.freeze({ minigameId: this.definition.id, score: this.snapshot.score,
      elapsedMs: Math.round(elapsedMs), progress: completed ? 1 : this.snapshot.progress, completed, reason });
    this.patch({ status: 'finished', elapsedMs, remainingMs: this.definition.durationMs - elapsedMs,
      progress: result.progress, result });
    this.onFinish(result);
  }
  private patch(update: Partial<MinigameSnapshot<T>>): void {
    this.snapshot = { ...this.snapshot, ...update };
    for (const listener of this.listeners) listener();
  }
}
