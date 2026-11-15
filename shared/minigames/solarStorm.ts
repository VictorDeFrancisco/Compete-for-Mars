import { defineMinigame } from './types';

export const solarStormDefinition = defineMinigame({
  id: 'solar-storm',
  title: 'DONKI Alert: Solar Storm Deflector',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'Real NASA DONKI telemetry tracks solar flares and coronal mass ejections (CMEs) heading for your Mars dome. Aim the Magnetic Shield between 115° and 245° using A/D, arrow keys, or pointer/touch over the dome to intercept incoming waves before impact (centering a wave triggers a Critical Parry for +50 bonus pts). Catch falling green orbs to heal +12% base integrity (+50 pts), and hold Space, W, or ↑ to widen the shield to 48° during heavy bursts.',
  objective:
    'NASA DONKI telemetry detects solar flares and CMEs bound for Ares Base Alpha. Deflect incoming waves (+100 pts) and catch green ion orbs to keep the dome intact.',
  controls: [
    {
      id: 'turn-left',
      label: 'Rotate Shield Left',
      description: 'Moves the magnetic deflector toward the left dome sector (115°–245°).',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'pointer', button: 0, label: 'Aim over dome' },
      ],
    },
    {
      id: 'turn-right',
      label: 'Rotate Shield Right',
      description: 'Moves the magnetic deflector toward the right dome sector.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'pointer', button: 0, label: 'Drag on dome' },
      ],
    },
    {
      id: 'boost',
      label: 'Super-Shield (48°)',
      description: 'Hold to double shield coverage from 24° to 48° while draining power.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Space' },
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20, radiation: -10 } },
    loser: { health: -15, resources: { radiation: 25 } },
    ties: 'share',
  },
});
