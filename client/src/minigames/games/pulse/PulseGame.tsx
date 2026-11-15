import { pulseDefinition } from '../../../../../shared/minigames/pulse';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { defineModule, type MinigameViewProps } from '../../core/module';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import type { MinigameContext } from '../../../../../shared/minigames/context';

export class PulseGame extends BaseMinigame<{ hits: number }> {
  constructor(definition = pulseDefinition, clock?: () => number, context?: MinigameContext) { super(definition, { hits: 0 }, clock, context); }
  protected onAction(actionId: string, state: ActionState): void {
    if (actionId !== 'activate' || state !== 'press') return;
    if (!this.tryAction()) return;
    const hits = Math.min(20, this.getSnapshot().data.hits + 1);
    this.setData({ hits }); this.setScore(hits * 5 * this.modifiers.scoreMultiplier); this.setProgress(hits / 20);
    // Es una prueba por tiempo: alcanzar el máximo no cierra el intento antes del plazo.
  }
}
function PulseView({ engine, snapshot }: MinigameViewProps<{ hits: number }>) {
  return <><p>Minimum cadence: {engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs} ms. Food score multiplier: {engine.modifiers.scoreMultiplier.toFixed(2)}.</p>
    <button disabled={snapshot.status !== 'running' || snapshot.data.hits >= 20}
    onClick={() => engine.dispatch('activate')}>Activate panel ({snapshot.data.hits}/20)</button></>;
}
export default defineModule(pulseDefinition, (definition: MinigameDefinition, context) => new PulseGame(definition, undefined, context), PulseView);
