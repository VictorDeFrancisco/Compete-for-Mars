import { defineMinigame } from './types';

export const marsRoverDefinition = defineMinigame({
  id: 'mars-rover',
  title: 'Travesía Rover: Altimetría y Físicas en Marte',
  mode: 'score',
  durationMs: 120_000,
  maxScore: 1000,
  instructions:
    'Expedición de exploración marciana de larga distancia (2 minutos) con cámara orbital de seguimiento. La batería se consume de forma realista al acelerar y al escalar pendientes pronunciadas. Elige sabiamente entre varios caminos (el valle llano más largo, las crestas directas de alto consumo o el paso del cráter) para alcanzar la baliza B sin agotar la batería.',
  objective:
    'Alcanza la baliza B optimizando el consumo de batería en la ruta elegida antes de que se agote la energía.',
  controls: [
    {
      id: 'forward',
      label: 'Acelerar',
      description: 'Aplica tracción motriz hacia adelante en las orugas.',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Acelerar' },
      ],
    },
    {
      id: 'reverse',
      label: 'Marcha atrás',
      description: 'Aplica tracción inversa hacia atrás en las orugas.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Reversa' },
      ],
    },
    {
      id: 'turn-left',
      label: 'Girar a babor',
      description: 'Gira el rover hacia la izquierda.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Izquierda' },
      ],
    },
    {
      id: 'turn-right',
      label: 'Girar a estribor',
      description: 'Gira el rover hacia la derecha.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: '▶ Derecha' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
