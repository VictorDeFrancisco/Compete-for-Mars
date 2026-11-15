import { defineMinigame } from './types';

export const suitUpDefinition = defineMinigame({
  id: 'suit-up',
  title: 'Ponerse el Traje Espacial',
  mode: 'race',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'Vístete con el traje espacial de la NASA antes de que se acabe el tiempo completando los Quick Time Events (QTE) de cada componente: sincroniza anillos de sellado, pulsa rápido para presurizar, mantén y suelta en la zona verde o introduce secuencias de acople. Usa las flechas (↑ ↓ ← →), Espacio o toca los controles en pantalla. Menos energía reduce tu margen de tiempo; menos comida reduce tus puntos.',
  objective:
    'Gana quien complete y selle el traje en menor tiempo. Si nadie lo completa antes del límite, se compara el progreso de componentes.',
  controls: [
    {
      id: 'action-primary',
      label: 'Acción Principal / Sellar',
      description: 'Pulsa para sincronizar QTE, presurizar rápidamente o mantener/soltar sellos.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'pointer', button: 0, label: 'Clic principal' },
        { device: 'touch', label: 'Tocar área QTE' },
      ],
    },
    {
      id: 'action-up',
      label: 'Válvula Superior / Arriba',
      description: 'Acción direccional superior para secuencias de cierre.',
      bindings: [
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: 'Botón Arriba' },
      ],
    },
    {
      id: 'action-down',
      label: 'Pestillo Inferior / Abajo',
      description: 'Acción direccional inferior para botas y fijaciones.',
      bindings: [
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: 'Botón Abajo' },
      ],
    },
    {
      id: 'action-left',
      label: 'Acople Izquierdo / Izquierda',
      description: 'Acción lateral izquierda para guantes y cierres.',
      bindings: [
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: 'Botón Izquierda' },
      ],
    },
    {
      id: 'action-right',
      label: 'Acople Derecho / Derecha',
      description: 'Acción lateral derecha para girar aros y válvulas.',
      bindings: [
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Botón Derecha' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { food: 20 } },
    loser: {},
    ties: 'share',
  },
});
