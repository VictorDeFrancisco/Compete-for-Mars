import { createElement, type ComponentType, type ReactNode } from 'react';
import type { MinigameDefinition } from '../../../../shared/minigames/types';
import type { MinigameContext } from '../../../../shared/minigames/context';
import { BaseMinigame, type MinigameSnapshot } from './BaseMinigame';
export interface MinigameViewProps<T extends object> { engine: BaseMinigame<T>; snapshot: MinigameSnapshot<T> }
export interface MinigameRun { engine: BaseMinigame; render: () => ReactNode }
export interface MinigameModule { definition: MinigameDefinition; createRun: (definition: MinigameDefinition, context: MinigameContext) => MinigameRun }
export function defineModule<T extends object>(definition: MinigameDefinition,
  create: (definition: MinigameDefinition, context: MinigameContext) => BaseMinigame<T>, View: ComponentType<MinigameViewProps<T>>): MinigameModule {
  return { definition, createRun: (currentDefinition, context) => {
    const engine = create(currentDefinition, context);
    return { engine, render: () => createElement(View, { engine, snapshot: engine.getSnapshot() }) };
  } };
}
