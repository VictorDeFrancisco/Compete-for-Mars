import { useRef } from 'react';
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
  onProgress?: (score: number) => void;
}

// Local runner sends a single result without managing rewards or damage here.
export default function PlayMinigame({ game, onSubmit, onProgress }: PlayMinigameProps) {
  const initialElapsed = useRef(
    Math.max(0, game.minigame.durationMs - ((game.deadline ?? game.serverNow) - game.serverNow)),
  );
  const lowEnergy = game.self.resources.energy <= 30;
  const lowFood = game.self.resources.food <= 30;
  const minigameContext = {
    resources: {
      energy: Math.min(10, Math.max(0, game.self.resources.energy / 10)),
      food: Math.min(10, Math.max(0, game.self.resources.food / 10)),
      radiation: Math.min(10, Math.max(0, game.self.resources.radiation)),
    },
  };
  const debuffClasses = [
    lowEnergy ? 'phase-playing--low-energy' : '',
    lowFood ? 'phase-playing--low-food' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (game.minigame.id === 'pipes' && game.self.health > 0) {
    return (
      <section className={`phase-playing ${debuffClasses}`.trim()}>
        <PipesSceneProvider
          crew={game.players.map(player => ({
            ...player,
            isSelf: player.id === game.self.id,
          }))}
        >
          <MinigameWrapper
            definition={game.minigame}
            context={minigameContext}
            initialElapsedMs={initialElapsed.current}
            onResult={onSubmit}
            onScoreChange={onProgress}
            showChrome={false}
          />
        </PipesSceneProvider>
      </section>
    );
  }

  return (
    <section className={`phase-playing ${debuffClasses}`.trim()}>
      <div className="nasa-console">
        <CornerScrewSvg className="nasa-console__screw--tl" />
        <CornerScrewSvg className="nasa-console__screw--tr" />
        <CornerScrewSvg className="nasa-console__screw--bl" />
        <CornerScrewSvg className="nasa-console__screw--br" />

        <div className="nasa-console__top">
          <span className="nasa-console__label">{game.minigame.title}</span>
          {(game.self.cardOutcome || lowEnergy || lowFood) && (
            <div className="nasa-console__alerts">
              {game.self.cardOutcome && (
                <span className="nasa-console__alert nasa-console__alert--card" role="status">
                  {game.self.cardOutcome.summary}
                </span>
              )}
              {(lowEnergy || lowFood) && (
                <span className="nasa-console__alert nasa-console__alert--warn" role="status">
                  {lowEnergy ? 'LOW ENERGY ' : ''}
                  {lowFood ? 'LOW FOOD' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="nasa-console__screen">
          {game.self.health <= 0 ? (
            <div className="phase-playing__state">
              <p className="phase-playing__state-title">CREWMEMBER OFFLINE</p>
              <p className="phase-playing__state-sub">Spectating the surviving crew…</p>
            </div>
          ) : game.self.hasSubmitted ? (
            <div className="phase-playing__state">
              <p className="phase-playing__state-title">TELEMETRY LOGGED</p>
              <p className="phase-playing__state-sub">Waiting for remaining crewmates…</p>
            </div>
          ) : (
            <MinigameWrapper
              definition={game.minigame}
              context={minigameContext}
              initialElapsedMs={initialElapsed.current}
              onResult={onSubmit}
              onScoreChange={onProgress}
              showChrome={false}
            />
          )}
        </div>
      </div>
    </section>
  );
}
