import type { MinigameContext } from '../../../../../shared/minigames/context';
import { triviaDefinition } from '../../../../../shared/minigames/trivia';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { TriviaGame, type TriviaData } from './TriviaEngine';
import './TriviaGame.css';

export { TriviaGame } from './TriviaEngine';

function TriviaView({ engine, snapshot }: MinigameViewProps<TriviaData>) {
  const { data, status } = snapshot;
  const question = data.questions[data.currentIndex];
  if (!question) return null;

  const isRunning = status === 'running';
  const answered = data.selectedOption !== null || data.timedOut;
  const isLastQuestion = data.currentIndex + 1 >= data.questions.length;
  const timerRatio = Math.max(0, Math.min(1, data.questionRemainingMs / data.questionDurationMs));
  const isLowTime = !answered && data.questionRemainingMs <= 5000;

  return (
    <div className="trivia-game">
      <div className="trivia-game__header">
        <span className="trivia-game__badge">{question.category}</span>
        <span className="trivia-game__counter">
          QUESTION {data.currentIndex + 1} / {data.questions.length}
        </span>
        <span className="trivia-game__score">{snapshot.score} PTS</span>
      </div>

      <div className="trivia-game__timer-track" aria-hidden="true">
        <div
          className={`trivia-game__timer-fill ${isLowTime ? 'trivia-game__timer-fill--low' : ''}`.trim()}
          style={{ width: `${timerRatio * 100}%` }}
        />
      </div>

      <h3 className="trivia-game__prompt">{question.prompt}</h3>

      <div className="trivia-game__options">
        {question.options.map((optionText, index) => {
          const isSelected = data.selectedOption === index;
          const isAnswer = question.correctIndex === index;

          let stateClass = '';
          if (answered) {
            if (isAnswer) stateClass = 'trivia-game__option--correct';
            else if (isSelected) stateClass = 'trivia-game__option--wrong';
            else stateClass = 'trivia-game__option--dimmed';
          }

          return (
            <button
              key={index}
              type="button"
              className={`trivia-game__option ${stateClass}`.trim()}
              disabled={!isRunning || answered}
              onClick={() => engine.dispatch(`answer-${index + 1}`)}
            >
              <span className="trivia-game__key">{index + 1}</span>
              <span className="trivia-game__option-text">{optionText}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`trivia-game__feedback ${
            data.isCorrect ? 'trivia-game__feedback--correct' : 'trivia-game__feedback--wrong'
          }`}
          role="status"
        >
          <div className="trivia-game__feedback-copy">
            <p className="trivia-game__feedback-title">
              {data.timedOut
                ? "TIME'S UP · +0 PTS"
                : data.isCorrect
                  ? `CORRECT · +${data.pointsPerCorrect} PTS`
                  : 'INCORRECT · +0 PTS'}
            </p>
            <p className="trivia-game__feedback-fact">{question.fact}</p>
          </div>
          <button
            type="button"
            className="trivia-game__next"
            disabled={!isRunning}
            onClick={() => engine.dispatch('next')}
          >
            {isLastQuestion ? 'FINISH →' : 'NEXT QUESTION →'}
          </button>
        </div>
      )}
    </div>
  );
}

export default defineModule(
  triviaDefinition,
  (definition: MinigameDefinition, context: MinigameContext) =>
    new TriviaGame(definition, undefined, context),
  TriviaView,
);
