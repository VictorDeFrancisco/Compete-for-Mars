import { pipesDefinition } from './pipes';
import { triviaDefinition } from './trivia';
import { marsRoverDefinition } from './marsRover';
import { suitUpDefinition } from './suitUp';
import { signalModulatorDefinition } from './signalModulator';
// Solo metadatos compartidos: nunca React, Three.js ni lógica del cliente.
export const MINIGAMES = [triviaDefinition, marsRoverDefinition, pipesDefinition, suitUpDefinition, signalModulatorDefinition];
if (new Set(MINIGAMES.map(game => game.id)).size !== MINIGAMES.length) throw new Error('IDs de minijuegos duplicados.');
