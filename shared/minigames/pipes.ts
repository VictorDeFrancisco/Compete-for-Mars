import { defineMinigame } from './types';

export const PIPE_GRID_SIZE = 6;
export const pipesDefinition = defineMinigame({
  id: 'pipes', title: 'Circuito de agua', mode: 'score', durationMs: 60_000, maxScore: 100_000,
  instructions: 'Gira las tuberías para llevar el agua de la entrada azul a la salida dorada. Pulsa una pieza para girarla 90°. No hace falta conectar todas las piezas. Cada circuito reparado da 100 puntos y genera otro tablero resoluble; el reloj de 60 segundos continúa. La energía y la comida bajas ralentizan los giros.',
  objective: 'Repara tantos circuitos como puedas en un minuto.',
  controls: [{
    id: 'rotate', label: 'Girar tubería',
    description: 'Gira 90° en sentido horario. También puedes usar Tab y Enter sobre una pieza.',
    bindings: [
      { device: 'pointer' as const, button: 0, label: 'Clic en una tubería' },
      { device: 'touch' as const, label: 'Tocar una tubería' },
    ],
  }],
  rewards: { winner: { resources: { energy: 2, food: 1 } }, loser: { health: -10 }, ties: 'share' },
});
