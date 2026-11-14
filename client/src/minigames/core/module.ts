import { createElement, type ComponentType, type ReactNode } from 'react';
import type { MinigameDefinition } from '../../../../shared/minigames/types';
import { BaseMinigame, type MinigameSnapshot } from './BaseMinigame';
export interface MinigameViewProps<T extends object> { engine: BaseMinigame<T>; snapshot: MinigameSnapshot<T> }
export interface MinigameRun { engine: BaseMinigame; render: () => ReactNode }
export interface MinigameModule { definition: MinigameDefinition; createRun: (definition: MinigameDefinition) => MinigameRun }
export function defineModule<T extends object>(definition: MinigameDefinition,
  create: (definition: MinigameDefinition) => BaseMinigame<T>, View: ComponentType<MinigameViewProps<T>>): MinigameModule {
  return { definition, createRun: currentDefinition => {
    const engine = create(currentDefinition);
    return { engine, render: () => createElement(View, { engine, snapshot: engine.getSnapshot() }) };
  } };
}
