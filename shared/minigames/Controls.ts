import type { ControlAction } from './types';
/** Declaraciones serializables. No instala listeners globales. Teclas según KeyboardEvent.code. */
export class Controls {
  constructor(private readonly actions: readonly ControlAction[]) {}
  getActions(): readonly ControlAction[] { return this.actions; }
  getAction(id: string): ControlAction | undefined { return this.actions.find(action => action.id === id); }
  hasAction(id: string): boolean { return this.getAction(id) !== undefined; }
  forKey(code: string): string[] {
    return this.actions.filter(action => action.bindings.some(binding => binding.device === 'keyboard' && binding.code === code)).map(action => action.id);
  }
  forPointer(button: number): string[] {
    return this.actions.filter(action => action.bindings.some(binding => binding.device === 'pointer' && binding.button === button)).map(action => action.id);
  }
  describe(): { id: string; label: string; description: string; inputs: string }[] {
    return this.actions.map(action => ({ id: action.id, label: action.label, description: action.description,
      inputs: action.bindings.map(binding => binding.label).join(' / ') }));
  }
}
