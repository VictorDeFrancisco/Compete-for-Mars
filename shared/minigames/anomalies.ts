import { defineMinigame } from './types';

export const anomaliesDefinition = defineMinigame({
  id: 'anomalies', title: 'Anomaly Detection', mode: 'score', durationMs: 60_000, maxScore: 10_000,
  instructions: 'Compare the two circuit boards and mark the 3 mismatched components: switches, indicators, resistors, fuses, diodes, and relays. You can click on either board — each pair counts once. Every correct match awards 10 points; finding all three clears the panel for +30 bonus points and opens a new board without resetting the 60s timer. A mistake deducts 10 points and locks selection for 3 seconds. Low energy and food slow down selection speed.',
  objective: 'Power surges are hitting habitat distribution panels. Compare the schematics and isolate as many faulty components in 60 seconds before a base blackout.',
  controls: [{
    id: 'inspect', label: 'Flag Component', description: 'Click or tap a circuit component. On keyboard, use Tab and Enter or Space.',
    bindings: [{ device: 'pointer', button: 0, label: 'Click component' }, { device: 'touch', label: 'Tap component' }],
  }],
  rewards: { winner: { resources: { energy: 20 } }, loser: {}, ties: 'share' },
});
