import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MINIGAME_CONTEXT } from '../../../../../shared/minigames/context';
import { triviaDefinition } from '../../../../../shared/minigames/trivia';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { NASA_TRIVIA_QUESTIONS } from './questions';
import {
  POINTS_PER_CORRECT,
  QUESTIONS_PER_ROUND,
  QUESTION_TIME_MS,
  TriviaGame,
  prepareTriviaQuestions,
} from './TriviaEngine';

test('defaults to 5 fixed questions per game and 30s per question', () => {
  assert.equal(QUESTIONS_PER_ROUND, 5);
  assert.equal(QUESTION_TIME_MS, 30_000);

  const game = new TriviaGame(triviaDefinition, () => 0, DEFAULT_MINIGAME_CONTEXT, () => 0.25);
  const snapshot = game.getSnapshot();
  assert.equal(snapshot.data.questions.length, 5);
  assert.equal(snapshot.data.questionRemainingMs, 30_000);
  assert.equal(snapshot.data.timedOut, false);
});

test('prepares unique questions with valid shuffled correctIndex', () => {
  const prepared = prepareTriviaQuestions(NASA_TRIVIA_QUESTIONS, QUESTIONS_PER_ROUND, () => 0.42);
  assert.equal(prepared.length, QUESTIONS_PER_ROUND);
  assert.equal(new Set(prepared.map(q => q.id)).size, QUESTIONS_PER_ROUND);
  for (const question of prepared) {
    assert.equal(question.options.length, 4);
    assert.ok(question.correctIndex >= 0 && question.correctIndex <= 3);
    const original = NASA_TRIVIA_QUESTIONS.find(item => item.id === question.id)!;
    assert.equal(question.options[question.correctIndex], original.options[original.correctIndex]);
  }
});

test('scores correct and incorrect answers, waits for next button, and completes on next', () => {
  let now = 0;
  const sample = NASA_TRIVIA_QUESTIONS.slice(0, 3);
  const game = new TriviaGame(triviaDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, () => 0, sample);
  game.start();

  // Answer Q1 correctly (correctIndex is 0)
  game.dispatch('answer-1');
  assert.equal(game.getSnapshot().score, POINTS_PER_CORRECT);
  assert.equal(game.getSnapshot().data.isCorrect, true);
  assert.equal(game.getSnapshot().data.streak, 1);

  // Stay on Q1 feedback even after several seconds until 'next' is pressed
  now += 10_000;
  game.tick();
  assert.equal(game.getSnapshot().data.currentIndex, 0);

  // Ignore duplicate answers while feedback is shown
  game.dispatch('answer-2');
  assert.equal(game.getSnapshot().data.selectedOption, 0);

  // Advance via 'next'
  now += 200;
  game.dispatch('next');
  assert.equal(game.getSnapshot().data.currentIndex, 1);
  assert.equal(game.getSnapshot().data.selectedOption, null);

  // Answer Q2 incorrectly (option 2 => index 1)
  game.dispatch('answer-2');
  assert.equal(game.getSnapshot().score, POINTS_PER_CORRECT);
  assert.equal(game.getSnapshot().data.isCorrect, false);
  assert.equal(game.getSnapshot().data.streak, 0);

  // Still does not auto-advance without 'next'
  now += 5_000;
  game.tick();
  assert.equal(game.getSnapshot().data.currentIndex, 1);

  game.dispatch('next');
  assert.equal(game.getSnapshot().data.currentIndex, 2);

  // Answer Q3 correctly and finish via 'next'
  game.dispatch('answer-1');
  assert.equal(game.getSnapshot().score, POINTS_PER_CORRECT * 2);
  game.dispatch('next');

  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.completed, true);
  assert.equal(result.reason, 'completed');
  assert.equal(result.score, 40);
  assert.equal(result.progress, 1);
  assert.doesNotThrow(() => validateResult(triviaDefinition, result));
});

test('timeout preserves partial score and passes server validation', () => {
  let now = 0;
  const sample = NASA_TRIVIA_QUESTIONS.slice(0, 5);
  const game = new TriviaGame(triviaDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, () => 0, sample);
  game.start();

  game.dispatch('answer-1');
  now = triviaDefinition.durationMs + 500;
  game.tick();

  const result = game.getResult();
  assert.ok(result);
  assert.equal(result.reason, 'timeout');
  assert.equal(result.score, POINTS_PER_CORRECT);
  assert.doesNotThrow(() => validateResult(triviaDefinition, result));
});

test('per-question 30s timer locks answers on expiry and advances only on next', () => {
  let now = 0;
  const sample = NASA_TRIVIA_QUESTIONS.slice(0, 5);
  const game = new TriviaGame(triviaDefinition, () => now, DEFAULT_MINIGAME_CONTEXT, () => 0, sample);
  game.start();

  // Answer Q1 correctly to build a streak
  now += 5000;
  game.dispatch('answer-1');
  assert.equal(game.getSnapshot().data.streak, 1);

  // Advance to Q2 via next and verify timer resets to QUESTION_TIME_MS
  game.dispatch('next');
  assert.equal(game.getSnapshot().data.currentIndex, 1);
  assert.equal(game.getSnapshot().data.questionRemainingMs, QUESTION_TIME_MS);
  assert.equal(game.getSnapshot().data.timedOut, false);

  // Let Q2 run out of its 30s timer, then try to answer late
  now += QUESTION_TIME_MS;
  game.dispatch('answer-1');
  const afterTimeout = game.getSnapshot();
  assert.equal(afterTimeout.data.timedOut, true);
  assert.equal(afterTimeout.data.selectedOption, null);
  assert.equal(afterTimeout.data.isCorrect, false);
  assert.equal(afterTimeout.data.streak, 0);
  assert.equal(afterTimeout.score, POINTS_PER_CORRECT);

  // Stays on Q2 feedback until next is clicked
  now += 5000;
  game.tick();
  assert.equal(game.getSnapshot().data.currentIndex, 1);

  // Advances to Q3 on next with a fresh 30s timer
  game.dispatch('next');
  const q3 = game.getSnapshot();
  assert.equal(q3.data.currentIndex, 2);
  assert.equal(q3.data.timedOut, false);
  assert.equal(q3.data.questionRemainingMs, QUESTION_TIME_MS);
});

test('applies energy and food penalties from MinigameContext', () => {
  let now = 0;
  const sample = NASA_TRIVIA_QUESTIONS.slice(0, 5);
  const lowResources = { resources: { energy: 0, food: 0, radiation: 0 } };
  const game = new TriviaGame(triviaDefinition, () => now, lowResources, () => 0, sample);
  game.start();

  const initial = game.getSnapshot();
  assert.equal(initial.data.questionDurationMs, 22_500);
  assert.equal(initial.data.pointsPerCorrect, 15);

  game.dispatch('answer-1');
  assert.equal(game.getSnapshot().score, 15);
});
