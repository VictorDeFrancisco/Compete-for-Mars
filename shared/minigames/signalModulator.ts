import { defineMinigame } from './types';

export const signalModulatorDefinition = defineMinigame({
  id: 'signal-modulator',
  title: 'Signal Modulation: DSN Link',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 10_000,
  instructions:
    'Tune the dish antenna to transmit as many telemetry packets as possible to NASA’s Deep Space Network before time runs out. Adjust Frequency (A/D or ←/→) and Amplitude (W/S or ↑/↓) to align your blue carrier with the gold target wave, and toggle the Solar Filter (Space/Enter) during flare interference.',
  objective:
    'Align and transmit as many telemetry packets as possible within 60 seconds.',
  controls: [
    {
      id: 'freq-down',
      label: 'Decrease Frequency',
      description: 'Widens the carrier wave.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Freq' },
      ],
    },
    {
      id: 'freq-up',
      label: 'Increase Frequency',
      description: 'Compresses the carrier wave.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Freq ▶' },
      ],
    },
    {
      id: 'amp-up',
      label: 'Increase Power',
      description: 'Increases wave amplitude.',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Amp' },
      ],
    },
    {
      id: 'amp-down',
      label: 'Decrease Power',
      description: 'Decreases wave amplitude.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Amp' },
      ],
    },
    {
      id: 'filter-noise',
      label: 'Solar Filter',
      description: 'Cancels solar flare interference.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Space' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'pointer', button: 0, label: 'Filter' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
