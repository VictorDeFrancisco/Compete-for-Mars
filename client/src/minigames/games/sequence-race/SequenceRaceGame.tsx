import { sequenceRaceDefinition } from '../../../../../shared/minigames/sequenceRace';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { defineModule, type MinigameViewProps } from '../../core/module';
import type { MinigameContext } from '../../../../../shared/minigames/context';
export class SequenceRaceGame extends BaseMinigame<{ step: number }> {
  constructor(definition = sequenceRaceDefinition, clock?: () => number, context?: MinigameContext) { super(definition, { step: 0 }, clock, context); }
  protected onAction(actionId: string, state: ActionState): void {
    if (state !== 'press') return;
    const step = this.getSnapshot().data.step;
    if (actionId !== `step-${step + 1}`) return;
    if (!this.tryAction()) return;
    this.setData({ step: step + 1 }); this.setScore(step + 1); this.setProgress((step + 1) / 5);
    if (step + 1 === 5) this.complete();
  }
}
function SequenceRaceView({ engine, snapshot }: MinigameViewProps<{ step: number }>) {
  return <><p>Tiempo mínimo entre cierres por energía/comida: {engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs} ms.</p><div className="actions">{Array.from({ length: 5 }, (_, index) => <button key={index}
    disabled={snapshot.status !== 'running' || snapshot.data.step !== index}
    onClick={() => engine.dispatch(`step-${index + 1}`)}>Cierre {index + 1} {snapshot.data.step > index ? '✓' : ''}</button>)}</div></>;
}
export default defineModule(sequenceRaceDefinition, (definition, context) => new SequenceRaceGame(definition, undefined, context), SequenceRaceView);
