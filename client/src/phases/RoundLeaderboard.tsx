import type { GameView } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from '../components/AstronautPortraitSvg';
import { playUiConfirm } from '../utils/uiAudio';
import './RoundLeaderboard.css';

export interface RoundLeaderboardProps {
  game: GameView;
  onContinue: () => void;
}

function outcomeBadge(outcome: string): { label: string; mod: string } {
  switch (outcome) {
    case 'winner':
      return { label: 'GANADOR', mod: 'winner' };
    case 'loser':
      return { label: 'ÚLTIMO', mod: 'loser' };
    case 'draw':
      return { label: 'EMPATE', mod: 'draw' };
    default:
      return { label: 'SUPERVIVIENTE', mod: 'neutral' };
  }
}

export default function RoundLeaderboard({ game, onContinue }: RoundLeaderboardProps) {
  const sortedResults = [...game.lastResults].sort((a, b) => a.rank - b.rank || b.score - a.score);
  const matchOver = Boolean(game.matchFinished || game.winnerId != null);
  const matchWinner = game.winnerId ? game.players.find(p => p.id === game.winnerId) : null;
  const selfConfirmed = game.self.ready || game.self.health <= 0;

  return (
    <section className="leaderboard-sheet" aria-label="Resultados de la ronda">
      <header className="leaderboard-sheet__head">
        <div>
          <span className="leaderboard-sheet__kicker">
            {matchOver ? 'EXPEDICIÓN FINALIZADA' : `RONDA ${String(game.round).padStart(2, '0')} · ${game.minigame.title.toUpperCase()}`}
          </span>
          <h2 className="leaderboard-sheet__title">
            {matchOver ? 'CLASIFICACIÓN FINAL DE MARTE' : 'RESULTADOS DEL MINIJUEGO'}
          </h2>
        </div>

        {matchOver && matchWinner && (
          <div className="leaderboard-champion">
            <span className="leaderboard-champion__label">CAMPEÓN DE LA MISIÓN</span>
            <strong className="leaderboard-champion__name">{matchWinner.name}</strong>
          </div>
        )}
      </header>

      <div className="leaderboard-rows">
        {sortedResults.map((entry, rowIdx) => {
          const playerIndex = Math.max(0, game.players.findIndex(p => p.id === entry.playerId));
          const player = game.players[playerIndex];
          const isSelf = entry.playerId === game.self.id;
          const suitColor = resolvePlayerSuitColor(player, game.self.stats, isSelf, playerIndex);
          const badge = outcomeBadge(entry.outcome);
          const currentHp = player?.health ?? 0;
          const maxHp = player?.maxHealth ?? 100;
          const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100))) : 0;

          return (
            <article
              key={entry.playerId}
              className={[
                'leaderboard-row',
                `leaderboard-row--rank-${Math.min(4, entry.rank || rowIdx + 1)}`,
                isSelf ? 'leaderboard-row--self' : '',
                currentHp <= 0 ? 'leaderboard-row--dead' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="leaderboard-row__rank">#{entry.rank}</div>

              <div className="leaderboard-row__avatar">
                <AstronautPortraitSvg suitColor={suitColor} variant={playerIndex} className="leaderboard-row__svg" />
              </div>

              <div className="leaderboard-row__identity">
                <div className="leaderboard-row__name-line">
                  <strong>
                    {entry.name}
                    {isSelf ? ' (TÚ)' : ''}
                  </strong>
                  <span className={`leaderboard-outcome leaderboard-outcome--${badge.mod}`}>
                    {currentHp <= 0 ? 'ELIMINADO' : badge.label}
                  </span>
                </div>

                <div className="leaderboard-row__deltas">
                  <span className={`leaderboard-delta ${entry.healthDelta < 0 ? 'is-neg' : 'is-neutral'}`}>
                    {entry.healthDelta >= 0 ? `+${entry.healthDelta}` : entry.healthDelta} VIDA
                  </span>
                  {isSelf && (
                    <>
                      <span className={`leaderboard-delta ${entry.resourcesDelta.energy >= 0 ? 'is-pos' : 'is-neg'}`}>
                        {entry.resourcesDelta.energy >= 0 ? `+${entry.resourcesDelta.energy}` : entry.resourcesDelta.energy} ENERGÍA
                      </span>
                      <span className={`leaderboard-delta ${entry.resourcesDelta.food >= 0 ? 'is-pos' : 'is-neg'}`}>
                        {entry.resourcesDelta.food >= 0 ? `+${entry.resourcesDelta.food}` : entry.resourcesDelta.food} COMIDA
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="leaderboard-row__hp">
                <span className="leaderboard-row__hp-label">HP {currentHp}/{maxHp}</span>
                <div className="leaderboard-row__hp-track">
                  <div className="leaderboard-row__hp-fill" style={{ width: `${hpPct}%` }} />
                </div>
              </div>

              <div className="leaderboard-row__score">
                <b>{entry.score}</b>
                <span>PTS · {(entry.elapsedMs / 1000).toFixed(1)}s</span>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="leaderboard-sheet__foot">
        <button
          type="button"
          className="leaderboard-continue-btn"
          disabled={selfConfirmed}
          onClick={() => {
            playUiConfirm();
            onContinue();
          }}
        >
          {selfConfirmed
            ? 'ESPERANDO TRIPULACIÓN ✓'
            : matchOver
              ? 'VER PANTALLA FINAL →'
              : 'SIGUIENTE RONDA →'}
        </button>
      </footer>
    </section>
  );
}
