import { defineMinigame } from './types';
export const pulseDefinition = defineMinigame({
  id: 'pulse', title: 'Panel Surge Test', mode: 'score', durationMs: 20_000, maxScore: 100,
  instructions: 'Trigger the panel as many times as you can. Each activation awards up to 5 points depending on your food; low energy and hunger limit activation speed. Results submit automatically when time expires.',
  objective: 'Score as many points as possible before the timer runs out.',
  controls: [{ id: 'activate', label: 'Trigger Panel', description: 'Adds up to 5 points based on available food.', bindings: [
    { device: 'keyboard', code: 'Space', label: 'Space' },
    { device: 'pointer', button: 0, label: 'Click button' },
    { device: 'touch', label: 'Tap button' },
  ] }],
  rewards: { winner: { resources: { energy: 20 } }, loser: {}, ties: 'share' },
});
