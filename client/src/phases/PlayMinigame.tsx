import { useEffect, useRef, useState } from 'react';
import { deriveRoundSeed } from '../../../shared/minigames/context';
import type { MinigameResult } from '../../../shared/minigames/types';
import type { MinigameProps } from '../../../shared/types';
import MinigameWrapper from '../minigames/MinigameWrapper';
import { PipesSceneProvider } from '../minigames/games/pipes/PipesScene';
import './PlayMinigame.css';

function CornerScrewSvg({ className }: { className: string }) {
  return (
    <svg
      className={`nasa-console__screw ${className}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" fill="#B5AB99" stroke="#1A1817" strokeWidth="2" />
      <line x1="4.5" y1="11.5" x2="11.5" y2="4.5" stroke="#1A1817" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export interface PlayMinigameProps extends MinigameProps {
  seconds?: number | null;
  onProgress?: (score: number) => void;
}

const COUNTDOWN_STEP_MS = 900;
const COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * 3;

// Local runner sends a single result without managing rewards or damage here.
export default function PlayMinigame({ game, seconds = null, onSubmit, onProgress }: PlayMinigameProps) {
  const initialElapsed = useRef(
    game.deadline === null
      ? 0
      : Math.max(0, game.minigame.durationMs - (game.deadline - game.serverNow)),
  );
  const canPlay = game.self.health > 0 && !game.self.hasSubmitted;
  const shouldCountdown = canPlay && initialElapsed.current < 1500;
  const [countdown, setCountdown] = useState<number>(shouldCountdown ? 3 : 0);
  const [showGo, setShowGo] = useState(false);
  const [localRemainingMs, setLocalRemainingMs] = useState<number | null>(null);
  const [submittedResult, setSubmittedResult] = useState<MinigameResult | null>(null);

  const handleMinigameResult = (result: MinigameResult) => {
    setSubmittedResult(result);
    onSubmit(result);
  };

  useEffect(() => {
    if (!shouldCountdown) return;
    const t2 = window.setTimeout(() => setCountdown(2), COUNTDOWN_STEP_MS);
    const t1 = window.setTimeout(() => setCountdown(1), COUNTDOWN_STEP_MS * 2);
    const t0 = window.setTimeout(() => {
      setCountdown(0);
      setShowGo(true);
    }, COUNTDOWN_TOTAL_MS);
    const tHideGo = window.setTimeout(() => setShowGo(false), COUNTDOWN_TOTAL_MS + 650);
    return () => {
      window.clearTimeout(t2);
      window.clearTimeout(t1);
      window.clearTimeout(t0);
      window.clearTimeout(tHideGo);
    };
  }, [shouldCountdown]);

  const effectiveInitialElapsedMs =
    game.deadline === null
      ? 0
      : shouldCountdown
        ? Math.min(Math.max(0, game.minigame.durationMs - 4000), initialElapsed.current + COUNTDOWN_TOTAL_MS)
        : initialElapsed.current;

  const displaySeconds =
    localRemainingMs !== null
      ? Math.max(0, Math.ceil(localRemainingMs / 1000))
      : seconds !== null
        ? Math.max(0, seconds)
        : Math.ceil(Math.max(0, game.minigame.durationMs - initialElapsed.current) / 1000);

  const timerUrgency = displaySeconds <= 5 ? 'critical' : displaySeconds <= 10 ? 'low' : 'normal';
  const lowEnergy = game.self.resources.energy <= 30;
  const lowFood = game.self.resources.food <= 30;
  const minigameContext = {
    resources: {
      energy: Math.min(10, Math.max(0, game.self.resources.energy / 10)),
      food: Math.min(10, Math.max(0, game.self.resources.food / 10)),
      radiation: Math.min(10, Math.max(0, game.self.resources.radiation)),
    },
    seed: deriveRoundSeed(game.phaseId, game.code, game.round, game.minigame.id),
  };
  const debuffClasses = [
    lowEnergy ? 'phase-playing--low-energy' : '',
    lowFood ? 'phase-playing--low-food' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={`phase-playing ${debuffClasses}`.trim()}>
      <div className="nasa-console">
        <CornerScrewSvg className="nasa-console__screw--tl" />
        <CornerScrewSvg className="nasa-console__screw--tr" />
        <CornerScrewSvg className="nasa-console__screw--bl" />
        <CornerScrewSvg className="nasa-console__screw--br" />

        <div className="nasa-console__top">
          <span className="nasa-console__label">{game.minigame.title}</span>

          <div className="nasa-console__top-right">
            {(lowEnergy || lowFood) && (
              <div className="nasa-console__alerts">
                <span className="nasa-console__alert nasa-console__alert--warn" role="status">
                  {lowEnergy ? 'LOW ENERGY ' : ''}
                  {lowFood ? 'LOW FOOD' : ''}
                </span>
              </div>
            )}

            {canPlay && (
              <span
                className={`nasa-console__timer nasa-console__timer--${timerUrgency}`}
                role="timer"
                aria-label={`${displaySeconds} seconds remaining`}
              >
                ⏱ {countdown > 0 ? 'GET READY' : `${displaySeconds}s`}
              </span>
            )}
          </div>
        </div>

        <div className="nasa-console__screen">
          {game.self.health <= 0 ? (
            <div className="phase-playing__state">
              <p className="phase-playing__state-title">CREWMEMBER OFFLINE</p>
              <p className="phase-playing__state-sub">Spectating the surviving crew…</p>
            </div>
          ) : game.self.hasSubmitted && submittedResult?.reason !== 'failed' ? (
            <div className="phase-playing__state">
              <p className="phase-playing__state-title">TELEMETRY LOGGED</p>
              <p className="phase-playing__state-sub">Waiting for remaining crewmates…</p>
            </div>
          ) : game.minigame.id === 'pipes' ? (
            <PipesSceneProvider
              embedded
              crew={game.players.map(player => ({
                ...player,
                isSelf: player.id === game.self.id,
              }))}
            >
              <MinigameWrapper
                definition={game.minigame}
                context={minigameContext}
                initialElapsedMs={effectiveInitialElapsedMs}
                paused={countdown > 0}
                onRemainingChange={setLocalRemainingMs}
                onResult={handleMinigameResult}
                onScoreChange={onProgress}
                showChrome={false}
              />
            </PipesSceneProvider>
          ) : (
            <MinigameWrapper
              definition={game.minigame}
              context={minigameContext}
              initialElapsedMs={effectiveInitialElapsedMs}
              paused={countdown > 0}
              onRemainingChange={setLocalRemainingMs}
              onResult={handleMinigameResult}
              onScoreChange={onProgress}
              showChrome={false}
            />
          )}

          {canPlay && countdown > 0 && (
            <div className="play-countdown-overlay" role="status" aria-live="assertive">
              <span className="play-countdown-overlay__kicker">MINIGAME STARTING</span>
              <strong key={countdown} className="play-countdown-overlay__num">
                {countdown}
              </strong>
            </div>
          )}

          {canPlay && showGo && countdown === 0 && (
            <div className="play-countdown-overlay play-countdown-overlay--go" aria-hidden="true">
              <strong className="play-countdown-overlay__go">GO!</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
