import { pulseDefinition } from './pulse';
import { sequenceRaceDefinition } from './sequenceRace';
import { triviaDefinition } from './trivia';
// Solo metadatos compartidos: nunca React, Three.js ni lógica del cliente.
export const MINIGAMES = [pulseDefinition, sequenceRaceDefinition, triviaDefinition];
if (new Set(MINIGAMES.map(game => game.id)).size !== MINIGAMES.length) throw new Error('IDs de minijuegos duplicados.');
