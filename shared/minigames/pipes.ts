import { defineMinigame } from './types';

export const PIPE_GRID_SIZE = 6;
export const pipesDefinition = defineMinigame({
  id: 'pipes', title: 'Water Pipeline', mode: 'score', durationMs: 60_000, maxScore: 100_000,
  instructions: 'Rotate pipes to route water from the blue intake to the gold outlet. Click any tile to rotate it 90°. You do not need to connect every spare tile. Each completed pipeline awards 100 points and loads a new solvable board while the 60s timer keeps running. Low energy and food slow rotation.',
  objective: 'Repair as many water pipelines as possible within one minute.',
  controls: [{
    id: 'rotate', label: 'Rotate Pipe',
    description: 'Rotates 90° clockwise. You can also use Tab and Enter on a pipe tile.',
    bindings: [
      { device: 'pointer' as const, button: 0, label: 'Click pipe tile' },
      { device: 'touch' as const, label: 'Tap pipe tile' },
    ],
  }],
  rewards: { winner: { resources: { food: 20 } }, loser: {}, ties: 'share' },
});
