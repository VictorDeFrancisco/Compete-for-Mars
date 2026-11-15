import { defineMinigame } from './types';

export const triviaDefinition = defineMinigame({
  id: 'trivia',
  title: 'NASA Survival Trivia',
  mode: 'score',
  durationMs: 180_000,
  maxScore: 100,
  instructions:
    'Answer 5 random space survival questions (up to 30s each; low energy trims time and low food reduces points) covering life support, radiation, power, and Mars farming. Press 1–4 or click an option, then continue with Space, Enter, or Next.',
  objective: 'Mission Control requires a survival readiness check on ECLSS life support, radiation shielding, and Mars ops. Answer 5 questions (+20 pts each) to lead the crew.',
  controls: [
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `answer-${index + 1}`,
      label: `Option ${index + 1}`,
      description: `Select answer ${index + 1}.`,
      bindings: [
        { device: 'keyboard' as const, code: `Digit${index + 1}`, label: `${index + 1}` },
        { device: 'pointer' as const, button: 0, label: `Click option ${index + 1}` },
      ],
    })),
    {
      id: 'next',
      label: 'Next Question',
      description: 'Advance immediately after reviewing the science note.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Space' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'pointer', button: 0, label: 'Next button' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
