import { defineMinigame } from './types';

export const signalModulatorDefinition = defineMinigame({
  id: 'signal-modulator',
  title: 'Modulación de Señal: Enlace DSN',
  mode: 'race',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'Sintoniza y modula la antena de la base para transmitir 4 paquetes vitales de telemetría a la Red del Espacio Profundo (NASA DSN en Madrid, Goldstone y Canberra). Ajusta la Frecuencia (A/D o ←/→) y la Potencia/Amplitud (W/S o ↑/↓) hasta superponer tu onda azul sobre la onda dorada de la Tierra. Cuando la señal esté en fase (SIGNAL LOCKED), mantén la alineación para transmitir el paquete. Activa el Filtro de Ruido (Espacio/Enter) cuando haya interferencias de radiación solar.',
  objective:
    'Transmite los 4 paquetes de la misión a la Tierra en el menor tiempo posible antes de que se cierre la ventana orbital.',
  controls: [
    {
      id: 'freq-down',
      label: 'Bajar Frecuencia',
      description: 'Reduce la frecuencia de la portadora de transmisión (hace la onda más ancha).',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Frecuencia' },
      ],
    },
    {
      id: 'freq-up',
      label: 'Subir Frecuencia',
      description: 'Aumenta la frecuencia de la portadora de transmisión (comprime la onda).',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Frecuencia ▶' },
      ],
    },
    {
      id: 'amp-up',
      label: 'Subir Potencia (Amplitud)',
      description: 'Aumenta los vatios de salida del amplificador de la antena (hace la onda más alta).',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Potencia' },
      ],
    },
    {
      id: 'amp-down',
      label: 'Bajar Potencia (Amplitud)',
      description: 'Reduce la potencia de emisión para conservar la batería de la base.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Potencia' },
      ],
    },
    {
      id: 'filter-noise',
      label: 'Filtro de Radiación Solar',
      description: 'Activa el blindaje electromagnético para filtrar el ruido de llamaradas solares DONKI.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'pointer', button: 0, label: 'Clic Filtro' },
        { device: 'touch', label: '🛡️ Filtro Solar' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
