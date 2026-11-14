import { defineMinigame } from './types';
export const sequenceRaceDefinition = defineMinigame({
  id: 'sequence-race', title: 'Secuencia de traje', mode: 'race', durationMs: 30_000, maxScore: 5,
  instructions: 'Activa en orden los cinco cierres del traje. Puedes usar las teclas 1 a 5 o tocar el cierre indicado. Con menos energía o comida debes esperar más entre cierres.',
  objective: 'Gana quien termine antes. Si nadie termina, se compara el progreso.',
  controls: Array.from({ length: 5 }, (_, index) => ({
    id: `step-${index + 1}`, label: `Cierre ${index + 1}`, description: 'Activar cuando sea el siguiente cierre.',
    bindings: [{ device: 'keyboard' as const, code: `Digit${index + 1}`, label: `${index + 1}` },
      { device: 'touch' as const, label: `Clic o toque en cierre ${index + 1}` }],
  })),
  rewards: { winner: { resources: { food: 2 } }, loser: { health: -15 }, ties: 'share' },
});
