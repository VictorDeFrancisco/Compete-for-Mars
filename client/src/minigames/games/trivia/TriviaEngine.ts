import {
  DEFAULT_MINIGAME_CONTEXT,
  resourceModifiers,
  type MinigameContext,
} from '../../../../../shared/minigames/context';
import { triviaDefinition } from '../../../../../shared/minigames/trivia';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { NASA_TRIVIA_QUESTIONS, type TriviaQuestion } from './questions';

export const QUESTIONS_PER_ROUND = 5;
export const QUESTION_TIME_MS = 30_000;
export const POINTS_PER_CORRECT = 20;

export interface TriviaData {
  questions: readonly TriviaQuestion[];
  currentIndex: number;
  selectedOption: number | null;
  timedOut: boolean;
  isCorrect: boolean | null;
  correctCount: number;
  streak: number;
  bestStreak: number;
  questionDurationMs: number;
  questionRemainingMs: number;
  pointsPerCorrect: number;
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function prepareTriviaQuestions(
  pool: readonly TriviaQuestion[] = NASA_TRIVIA_QUESTIONS,
  count: number = QUESTIONS_PER_ROUND,
  rng: () => number = Math.random,
): TriviaQuestion[] {
  const chosen = shuffle(pool, rng).slice(0, Math.min(count, pool.length));
  return chosen.map(question => {
    const indexed = question.options.map((text, idx) => ({
      text,
      isAnswer: idx === question.correctIndex,
    }));
    const shuffled = shuffle(indexed, rng);
    const correctIndex = shuffled.findIndex(item => item.isAnswer) as 0 | 1 | 2 | 3;
    return {
      ...question,
      options: shuffled.map(item => item.text) as unknown as readonly [string, string, string, string],
      correctIndex,
    };
  });
}

export class TriviaGame extends BaseMinigame<TriviaData> {
  constructor(
    definition: MinigameDefinition = triviaDefinition,
    clock?: () => number,
    context: MinigameContext = DEFAULT_MINIGAME_CONTEXT,
    rng: () => number = Math.random,
    questions?: readonly TriviaQuestion[],
  ) {
    const roundQuestions = questions ?? prepareTriviaQuestions(NASA_TRIVIA_QUESTIONS, QUESTIONS_PER_ROUND, rng);
    const modifiers = resourceModifiers(context);
    const questionDurationMs = Math.round(QUESTION_TIME_MS * modifiers.speedMultiplier);
    const pointsPerCorrect = Math.round(POINTS_PER_CORRECT * modifiers.scoreMultiplier);
    super(
      definition,
      {
        questions: roundQuestions,
        currentIndex: 0,
        selectedOption: null,
        timedOut: false,
        isCorrect: null,
        correctCount: 0,
        streak: 0,
        bestStreak: 0,
        questionDurationMs,
        questionRemainingMs: questionDurationMs,
        pointsPerCorrect,
      },
      clock,
      context,
    );
  }

  protected onAction(actionId: string, state: ActionState): void {
    if (state !== 'press') return;
    const data = this.getSnapshot().data;

    if (data.selectedOption === null && !data.timedOut) {
      if (!actionId.startsWith('answer-')) return;
      const optionIndex = Number(actionId.slice('answer-'.length)) - 1;
      const question = data.questions[data.currentIndex];
      if (!question || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
        return;
      }

      const isCorrect = optionIndex === question.correctIndex;
      const streak = isCorrect ? data.streak + 1 : 0;
      const bestStreak = Math.max(data.bestStreak, streak);
      const correctCount = data.correctCount + (isCorrect ? 1 : 0);

      if (isCorrect) this.addScore(data.pointsPerCorrect);
      this.setProgress((data.currentIndex + 1) / data.questions.length);

      this.setData({
        ...data,
        selectedOption: optionIndex,
        timedOut: false,
        isCorrect,
        correctCount,
        streak,
        bestStreak,
      });
      return;
    }

    if (actionId === 'next') {
      this.advanceQuestion();
    }
  }

  protected onUpdate(deltaMs: number): void {
    if (deltaMs <= 0) return;
    const data = this.getSnapshot().data;

    // Wait for the player to click Next / press Space or Enter before moving on.
    if (data.selectedOption !== null || data.timedOut) return;

    const questionRemaining = data.questionRemainingMs - deltaMs;
    if (questionRemaining <= 0) {
      this.setProgress((data.currentIndex + 1) / data.questions.length);
      this.setData({
        ...data,
        timedOut: true,
        isCorrect: false,
        streak: 0,
        questionRemainingMs: 0,
      });
      return;
    }

    this.setData({ ...data, questionRemainingMs: questionRemaining });
  }

  private advanceQuestion(): void {
    const data = this.getSnapshot().data;
    if (data.selectedOption === null && !data.timedOut) return;

    const nextIndex = data.currentIndex + 1;
    if (nextIndex >= data.questions.length) {
      this.complete();
      return;
    }

    this.setData({
      ...data,
      currentIndex: nextIndex,
      selectedOption: null,
      timedOut: false,
      isCorrect: null,
      questionRemainingMs: data.questionDurationMs,
    });
  }
}
