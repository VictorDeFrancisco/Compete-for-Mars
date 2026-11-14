import pipes from './games/pipes/PipesGame';
import trivia from './games/trivia/TriviaGame';
import marsRover from './games/mars-rover/MarsRoverGame';
import suitUp from './games/suit-up/SuitUpGame';
import signalModulator from './games/signal-modulator/SignalModulatorGame';
import solarStorm from './games/solar-storm/SolarStormGame';
import anomalies from './games/anomalies/AnomaliesGame';
import type { MinigameModule } from './core/module';
// Cada integrante crea su carpeta. Coordinar solo esta línea de registro.
export const minigameModules: readonly MinigameModule[] = [trivia, marsRover, pipes, suitUp, signalModulator, solarStorm, anomalies];
export function getMinigameModule(id: string): MinigameModule | undefined {
  return minigameModules.find(module => module.definition.id === id);
}
