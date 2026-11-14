import { useRef } from 'react';
import type { MinigameProps } from '../../../shared/types';
import MinigameWrapper from '../minigames/MinigameWrapper';
import './PlayMinigame.css';
import { PipesSceneProvider } from '../minigames/games/pipes/PipesScene';

// Local runner sends a single result without managing rewards or damage here.
export default function PlayMinigame({ game, onSubmit }: MinigameProps) {
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

  if (game.minigame.id === 'pipes') {
    return (
      <section className={`phase-playing ${debuffClasses}`.trim()}>
        {(lowEnergy || lowFood) && (
          <p className="phase-playing__debuff" role="status">
            {lowEnergy ? 'Low Energy debuff: slower actions & suit brownout. ' : ''}
            {lowFood ? 'Low Food debuff: reduced score & tunnel vision.' : ''}
          </p>
        )}
        <PipesSceneProvider crew={game.players.map(player => ({ ...player, isSelf: player.id === game.self.id }))}>
          <MinigameWrapper definition={game.minigame} context={minigameContext} initialElapsedMs={initialElapsed.current} onResult={onSubmit} />
        </PipesSceneProvider>
      </section>
    );
  }

  return (
    <section className={`panel phase-playing ${debuffClasses}`.trim()}>
      <p className="eyebrow">4 · Play Minigame</p>
      <h2>{game.minigame.title}</h2>
      {(lowEnergy || lowFood) && (
        <p className="phase-playing__debuff" role="status">
          {lowEnergy ? 'Low Energy debuff: slower actions & suit brownout. ' : ''}
          {lowFood ? 'Low Food debuff: reduced score & tunnel vision.' : ''}
        </p>
      )}
      {game.self.health <= 0 ? (
        <p>You were eliminated. Spectating the remaining crew…</p>
      ) : game.self.hasSubmitted ? (
        <p>Result submitted: {game.self.score} points. Waiting for others…</p>
      ) : (
        <MinigameWrapper
          definition={game.minigame}
          context={minigameContext}
          initialElapsedMs={initialElapsed.current}
          onResult={onSubmit}
        />
      )}
      <p>{game.players.filter(p => p.health > 0 && p.hasSubmitted).length}/{game.players.filter(p => p.health > 0).length} results received.</p>
    </section>
  );
}
