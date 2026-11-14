import { defineMinigame } from './types';
export const pulseDefinition = defineMinigame({
  id: 'pulse', title: 'Prueba de panel', mode: 'score', durationMs: 20_000, maxScore: 100,
  instructions: 'Activa el panel tantas veces como puedas. Cada activación suma hasta 5 puntos según tu comida; la energía y el hambre limitan la cadencia. El resultado se envía automáticamente al terminar.',
  objective: 'Gana quien obtenga más puntos antes del límite de tiempo.',
  controls: [{ id: 'activate', label: 'Activar panel', description: 'Suma hasta 5 puntos según la comida disponible.', bindings: [
    { device: 'keyboard', code: 'Space', label: 'Espacio' },
    { device: 'pointer', button: 0, label: 'Clic en el botón' },
    { device: 'touch', label: 'Tocar el botón' },
  ] }],
  rewards: { winner: { resources: { energy: 20 } }, loser: {}, ties: 'share' },
});
