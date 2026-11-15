import { defineMinigame } from './types';

export const marsRoverDefinition = defineMinigame({
  id: 'mars-rover',
  title: 'Mars Rover Traverse: Elevation & Physics',
  mode: 'score',
  durationMs: 120_000,
  maxScore: 1000,
  instructions:
    'Long-range Martian exploration traverse (2 minutes) with orbital follow camera. Battery drains realistically when accelerating and climbing steep ridges. Choose wisely between routes — the longer flat valley, steep high-drain ridges, or crater pass — to reach Beacon B without running out of power.',
  objective:
    'Reach Beacon B while conserving battery across Martian terrain before power or time runs out.',
  controls: [
    {
      id: 'forward',
      label: 'Accelerate',
      description: 'Apply forward drive torque to the rover treads.',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Drive' },
      ],
    },
    {
      id: 'reverse',
      label: 'Reverse',
      description: 'Apply reverse drive torque to brake or back up.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Reverse' },
      ],
    },
    {
      id: 'turn-left',
      label: 'Steer Left',
      description: 'Turn the rover left.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Left' },
      ],
    },
    {
      id: 'turn-right',
      label: 'Steer Right',
      description: 'Turn the rover right.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'touch', label: '▶ Right' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
