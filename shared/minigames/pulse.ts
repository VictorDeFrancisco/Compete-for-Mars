import { defineMinigame } from './types';
export const pulseDefinition = defineMinigame({
  id: 'pulse', title: 'Prueba de panel', mode: 'score', durationMs: 20_000, maxScore: 100,
  instructions: 'Activa el panel tantas veces como puedas. Cada activación suma 5 puntos, hasta 100. El resultado se envía automáticamente al terminar.',
  objective: 'Gana quien obtenga más puntos antes del límite de tiempo.',
  controls: [{ id: 'activate', label: 'Activar panel', description: 'Suma 5 puntos.', bindings: [
    { device: 'keyboard', code: 'Space', label: 'Espacio' },
    { device: 'pointer', button: 0, label: 'Clic en el botón' },
    { device: 'touch', label: 'Tocar el botón' },
  ] }],
  rewards: { winner: { resources: { energy: 2, food: 1 } }, loser: { health: -10 }, ties: 'share' },
});
