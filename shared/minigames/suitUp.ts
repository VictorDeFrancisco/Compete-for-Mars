import { defineMinigame } from './types';

export const suitUpDefinition = defineMinigame({
  id: 'suit-up',
  title: 'Suit-Up Sequence',
  mode: 'race',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'Suit up and seal your NASA EVA suit before time expires by completing each Quick Time Event (QTE): hit timing zones, mash to pressurize, hold and release inside the green zone, or enter directional latch sequences. Use arrow keys (↑ ↓ ← →), Space, or the on-screen controls. Low energy speeds up targets; low food reduces score.',
  objective:
    'First astronaut to fully seal their EVA suit wins. If no one finishes in time, component progress breaks ties.',
  controls: [
    {
      id: 'action-primary',
      label: 'Primary Action / Seal',
      description: 'Press to sync timing rings, pump latches, or hold/release seals.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Space' },
        { device: 'pointer', button: 0, label: 'Primary click' },
        { device: 'touch', label: 'Tap QTE area' },
      ],
    },
    {
      id: 'action-up',
      label: 'Top Valve / Up',
      description: 'Upper directional key for latch sequences.',
      bindings: [
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: 'Up button' },
      ],
    },
    {
      id: 'action-down',
      label: 'Lower Latch / Down',
      description: 'Lower directional key for boots and locks.',
      bindings: [
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: 'Down button' },
      ],
    },
    {
      id: 'action-left',
      label: 'Left Lock / Left',
      description: 'Left directional key for wrist rings.',
      bindings: [
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: 'Left button' },
      ],
    },
    {
      id: 'action-right',
      label: 'Right Lock / Right',
      description: 'Right directional key for rotating couplings.',
      bindings: [
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: 'Right button' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { food: 20 } },
    loser: {},
    ties: 'share',
  },
});
