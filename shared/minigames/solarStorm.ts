import { defineMinigame } from './types';

export const solarStormDefinition = defineMinigame({
  id: 'solar-storm',
  title: 'Alerta DONKI: Deflector de Tormentas Solares',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'El Sol emite llamaradas solares y eyecciones de masa coronal (CME) reales de la base de datos NASA DONKI mientras el tiempo avanza rápidamente. Controla el Escudo Magnético móvil en la órbita de Marte: gira el escudo con A/D o ←/→ para interceptar las ondas de plasma antes de que impacten la colonia marciana. Pulsa Espacio o W para activar el Super-Escudo ampliado durante erupciones extremas.',
  objective:
    'Gira el escudo magnético e intercepta todas las ondas de radiación solar de la NASA para proteger la colonia de Marte.',
  controls: [
    {
      id: 'turn-left',
      label: 'Girar Escudo Izquierda',
      description: 'Rota el escudo magnético en sentido antihorario alrededor de Marte.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Girar Izquierda' },
      ],
    },
    {
      id: 'turn-right',
      label: 'Girar Escudo Derecha',
      description: 'Rota el escudo magnético en sentido horario alrededor de Marte.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Girar Derecha ▶' },
      ],
    },
    {
      id: 'boost',
      label: 'Super-Escudo Ampliado',
      description: 'Expande el deflector magnético a 160° para bloquear ondas masivas.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '⚡ Super-Escudo' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20, radiation: -10 } },
    loser: { health: -15, resources: { radiation: 25 } },
    ties: 'share',
  },
});
