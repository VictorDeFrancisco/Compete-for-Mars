import { defineMinigame } from './types';

export const triviaDefinition = defineMinigame({
  id: 'trivia',
  title: 'Mission Trivia',
  mode: 'score',
  durationMs: 180_000,
  maxScore: 100,
  instructions:
    'Answer 5 random NASA survival questions (up to 30 seconds per question, reduced by low energy; low food reduces points) about life support, radiation, power, and space farming. Use keys 1-4 or click an answer, then press Space/Enter or click Next.',
  objective: 'Earn 20 points per correct answer. Highest score wins when all questions or time finish.',
  controls: [
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `answer-${index + 1}`,
      label: `Option ${index + 1}`,
      description: `Select answer choice ${index + 1}.`,
      bindings: [
        { device: 'keyboard' as const, code: `Digit${index + 1}`, label: `${index + 1}` },
        { device: 'touch' as const, label: `Click or tap option ${index + 1}` },
      ],
    })),
    {
      id: 'next',
      label: 'Next Question',
      description: 'Advance immediately after seeing answer feedback.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Space' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'touch', label: 'Click Next button' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 1, food: 1 } },
    loser: { health: -10 },
    ties: 'share',
  },
});
