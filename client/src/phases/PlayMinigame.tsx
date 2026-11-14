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
  const minigameContext = {
    resources: {
      energy: Math.min(10, Math.max(0, game.self.resources.energy / 10)),
      food: Math.min(10, Math.max(0, game.self.resources.food / 10)),
      radiation: Math.min(10, Math.max(0, game.self.resources.radiation)),
    },
  };

  if (game.minigame.id === 'pipes') return <section className="phase-playing">
    <PipesSceneProvider crew={game.players.map(player => ({ ...player, isSelf: player.id === game.self.id }))}>
      <MinigameWrapper definition={game.minigame} context={minigameContext} initialElapsedMs={initialElapsed.current} onResult={onSubmit} />
    </PipesSceneProvider>
  </section>;

  return (
    <section className="panel phase-playing">
      <p className="eyebrow">4 · Play Minigame</p>
      <h2>{game.minigame.title}</h2>
      {game.self.hasSubmitted ? (
        <p>Result submitted: {game.self.score} points. Waiting for others…</p>
      ) : (
        <MinigameWrapper
          definition={game.minigame}
          context={minigameContext}
          initialElapsedMs={initialElapsed.current}
          onResult={onSubmit}
        />
      )}
      <p>{game.players.filter(p => p.hasSubmitted).length}/{game.players.length} results received.</p>
    </section>
  );
}
