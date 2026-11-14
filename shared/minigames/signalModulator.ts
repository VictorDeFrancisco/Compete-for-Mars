import { defineMinigame } from './types';

export const signalModulatorDefinition = defineMinigame({
  id: 'signal-modulator',
  title: 'Modulación de Señal: Enlace DSN',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 10_000,
  instructions:
    'Sintoniza la antena para transmitir tantas ondas de telemetría como puedas a la Red del Espacio Profundo antes de que acabe el tiempo. Ajusta Frecuencia (A/D o ←/→) y Amplitud (W/S o ↑/↓) para alinear tu onda azul sobre la dorada y activa el Filtro Solar (Espacio/Enter) cuando aparezcan interferencias.',
  objective:
    'Alinea y transmite el mayor número posible de paquetes de telemetría en 60 segundos.',
  controls: [
    {
      id: 'freq-down',
      label: 'Bajar Frecuencia',
      description: 'Ensancha la onda portadora.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Freq' },
      ],
    },
    {
      id: 'freq-up',
      label: 'Subir Frecuencia',
      description: 'Comprime la onda portadora.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Freq ▶' },
      ],
    },
    {
      id: 'amp-up',
      label: 'Subir Potencia',
      description: 'Aumenta la altura de la onda.',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Amp' },
      ],
    },
    {
      id: 'amp-down',
      label: 'Bajar Potencia',
      description: 'Reduce la altura de la onda.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Amp' },
      ],
    },
    {
      id: 'filter-noise',
      label: 'Filtro Solar',
      description: 'Anula el ruido de llamaradas solares.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'pointer', button: 0, label: 'Filtro' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
