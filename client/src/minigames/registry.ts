import pulse from './games/pulse/PulseGame';
import sequenceRace from './games/sequence-race/SequenceRaceGame';
import type { MinigameModule } from './core/module';
// Cada integrante crea su carpeta. Coordinar solo esta línea de registro.
export const minigameModules: readonly MinigameModule[] = [pulse, sequenceRace];
export function getMinigameModule(id: string): MinigameModule | undefined {
  return minigameModules.find(module => module.definition.id === id);
}
