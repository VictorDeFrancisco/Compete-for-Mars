import { useRef } from 'react';
import type { MinigameProps } from '../../../shared/types';
import { TopoWatermarkSvg } from '../components/NasaMarks';
import MinigameWrapper from '../minigames/MinigameWrapper';
import { PipesSceneProvider } from '../minigames/games/pipes/PipesScene';
import './PlayMinigame.css';

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

  if (game.self.health <= 0) return <section className="panel phase-playing"><h2>Eliminated</h2><p>Spectating the surviving crew.</p></section>;

  if (game.minigame.id === 'pipes') {
    return (
      <section className={`phase-playing ${debuffClasses}`.trim()}>
        {(lowEnergy || lowFood) && (
          <p className="phase-playing__debuff" role="status">
            {lowEnergy ? 'Low Energy debuff: slower actions & suit brownout. ' : ''}
            {lowFood ? 'Low Food debuff: tunnel vision & reduced minigame output.' : ''}
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
      <TopoWatermarkSvg />

      <div className="phase-playing__head">
        <div>
          <p className="eyebrow">4 · Play Minigame</p>
          <h2>{game.minigame.title}</h2>
        </div>
        <div className="oscilloscope-leds" aria-hidden="true">
          <span className={`osc-led ${lowEnergy ? 'osc-led--warn' : 'osc-led--ok'}`}>PWR</span>
          <span className={`osc-led ${lowFood ? 'osc-led--warn' : 'osc-led--ok'}`}>VIT</span>
          <span className={`osc-led ${game.self.resources.radiation > 0 ? 'osc-led--warn' : 'osc-led--idle'}`}>RAD</span>
        </div>
      </div>

      {game.self.cardOutcome && (
        <p className="phase-playing__outcome" role="status">
          {game.self.cardOutcome.summary}
        </p>
      )}
      {(lowEnergy || lowFood) && (
        <p className="phase-playing__debuff" role="status">
          {lowEnergy ? 'Low Energy debuff: slower actions & suit brownout. ' : ''}
          {lowFood ? 'Low Food debuff: tunnel vision & reduced minigame output.' : ''}
        </p>
      )}

      <div className="oscilloscope-bezel">
        <div className="oscilloscope-bezel__bar" aria-hidden="true">
          <span className="oscilloscope-bezel__plate">CRT-04 // ARES TELEMETRY</span>
          <div className="oscilloscope-bezel__screws">
            <span />
            <span />
          </div>
        </div>

        {game.self.health <= 0 ? (
          <div className="minigame-area phase-playing__state">
            <p>You were eliminated. Spectating the remaining crew…</p>
          </div>
        ) : game.self.hasSubmitted ? (
          <div className="minigame-area phase-playing__state">
            <p>Result submitted. Waiting for others…</p>
          </div>
        ) : (
          <MinigameWrapper
            definition={game.minigame}
            context={minigameContext}
            initialElapsedMs={initialElapsed.current}
            onResult={onSubmit}
          />
        )}
      </div>

      <p className="phase-playing__status">
        {game.players.filter(p => p.health > 0 && p.hasSubmitted).length}/{game.players.filter(p => p.health > 0).length} results received.
      </p>
    </section>
  );
}
