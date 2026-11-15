import { defineMinigame } from './types';
export const sequenceRaceDefinition = defineMinigame({
  id: 'sequence-race', title: 'Suit Latch Sequence', mode: 'race', durationMs: 30_000, maxScore: 5,
  instructions: 'Engage all five suit latches in order using keys 1–5 or tapping the highlighted latch. Lower energy or food increases the cooldown between latches.',
  objective: 'First astronaut to finish wins. On timeout, progress breaks ties.',
  controls: Array.from({ length: 5 }, (_, index) => ({
    id: `step-${index + 1}`, label: `Latch ${index + 1}`, description: 'Engage when highlighted next.',
    bindings: [{ device: 'keyboard' as const, code: `Digit${index + 1}`, label: `${index + 1}` },
      { device: 'touch' as const, label: `Click or tap latch ${index + 1}` }],
  })),
  rewards: { winner: { resources: { food: 20 } }, loser: {}, ties: 'share' },
});
