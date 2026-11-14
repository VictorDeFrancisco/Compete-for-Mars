import type { GameView, PublicPlayer } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from './AstronautPortraitSvg';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import './MatchVictoryScreen.css';

interface MatchVictoryScreenProps {
  game: GameView;
  error: string | null;
  disabled: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

function rankStandings(
  players: PublicPlayer[],
  winnerId: string | null | undefined,
  lastScores: ReadonlyMap<string, number>,
): PublicPlayer[] {
  return [...players].sort((a, b) => {
    if (winnerId && a.id === winnerId) return -1;
    if (winnerId && b.id === winnerId) return 1;
    const aAlive = a.health > 0 ? 1 : 0;
    const bAlive = b.health > 0 ? 1 : 0;
    if (aAlive !== bAlive) return bAlive - aAlive;
    if (a.health !== b.health) return b.health - a.health;
    return (lastScores.get(b.id) ?? 0) - (lastScores.get(a.id) ?? 0);
  });
}

export default function MatchVictoryScreen({
  game,
  error,
  disabled,
  onRestart,
  onLeave,
}: MatchVictoryScreenProps) {
  const lastScores = new Map(game.lastResults.map(r => [r.playerId, r.score]));
  const standings = rankStandings(game.players, game.winnerId, lastScores);
  const winner = (game.winnerId ? game.players.find(p => p.id === game.winnerId) : undefined) ?? standings[0] ?? null;
  const winnerIndex = winner ? Math.max(0, game.players.findIndex(p => p.id === winner.id)) : 0;
  const winnerSuitColor = winner
    ? resolvePlayerSuitColor(winner, game.self.stats, winner.id === game.self.id, winnerIndex)
    : '#FC3D21';
  const isHost = game.self.id === game.hostId;
  const noSurvivor = game.players.every(p => p.health <= 0);

  return (
    <main className="victory-screen" aria-label="Fin de la partida">
      <div className="victory-backdrop" aria-hidden="true">
        <div className="victory-stars" />
        <div className="victory-horizon" />
      </div>

      <section className="victory-card">
        <header className="victory-card__header">
          <div className="victory-card__kicker">
            <span>EXPEDICIÓN {game.code}</span>
            <span>·</span>
            <span>{game.round} {game.round === 1 ? 'RONDA' : 'RONDAS'} EN MARTE</span>
          </div>
          <h1 className="victory-card__title">
            {noSurvivor
              ? 'BASE PERDIDA EN MARTE'
              : winner
                ? `${winner.name.toUpperCase()} CONQUISTA MARTE`
                : 'EXPEDICIÓN FINALIZADA'}
          </h1>
        </header>

        <div className="victory-card__body">
          {winner && (
            <div className="victory-champion">
              <div className="victory-champion__badge">
                {noSurvivor ? 'ÚLTIMO EN PIE' : 'CAMPEÓN DE ARES'}
              </div>
              <div className="victory-champion__portrait">
                <AstronautPortraitSvg
                  suitColor={winnerSuitColor}
                  variant={winnerIndex}
                  className="victory-champion__svg"
                />
              </div>
              <div className="victory-champion__identity">
                <strong className="victory-champion__name">
                  {winner.name}
                  {winner.id === game.self.id ? ' (TÚ)' : ''}
                </strong>
                <div className="victory-champion__stats">
                  <span>♥ {Math.max(0, winner.health)}/{winner.maxHealth} HP</span>
                  {lastScores.has(winner.id) && <span>★ {lastScores.get(winner.id)} PTS</span>}
                </div>
              </div>
            </div>
          )}

          <div className="victory-standings">
            <h2 className="victory-standings__heading">CLASIFICACIÓN FINAL DE LA TRIPULACIÓN</h2>
            <div className="victory-standings__list">
              {standings.map((player, rankIdx) => {
                const slotIdx = Math.max(0, game.players.findIndex(p => p.id === player.id));
                const isSelf = player.id === game.self.id;
                const isWinner = winner?.id === player.id && !noSurvivor;
                const suitColor = resolvePlayerSuitColor(player, game.self.stats, isSelf, slotIdx);
                const hpPct = player.maxHealth > 0
                  ? Math.max(0, Math.min(100, Math.round((player.health / player.maxHealth) * 100)))
                  : 0;
                const lastScore = lastScores.get(player.id);

                return (
                  <article
                    key={player.id}
                    className={`victory-row${isWinner ? ' is-winner' : ''}${isSelf ? ' is-self' : ''}${player.health <= 0 ? ' is-eliminated' : ''}`}
                  >
                    <div className="victory-row__rank">#{rankIdx + 1}</div>
                    <AstronautPortraitSvg
                      suitColor={suitColor}
                      variant={slotIdx}
                      className="victory-row__svg"
                    />
                    <div className="victory-row__info">
                      <div className="victory-row__name">
                        <strong>{player.name}{isSelf ? ' (TÚ)' : ''}</strong>
                        {player.isBot && <span className="victory-pill">BOT</span>}
                        {isWinner && <span className="victory-pill victory-pill--gold">GANADOR</span>}
                        {player.health <= 0 && <span className="victory-pill victory-pill--dead">CAÍDO</span>}
                      </div>
                      <div className="victory-row__hp">
                        <div className="victory-row__hp-bar">
                          <span style={{ width: `${hpPct}%` }} />
                        </div>
                        <span>{Math.max(0, player.health)}/{player.maxHealth} HP</span>
                      </div>
                    </div>
                    <div className="victory-row__score">
                      <strong>{lastScore !== undefined ? lastScore : Math.max(0, player.health)}</strong>
                      <span>{lastScore !== undefined ? 'PTS' : 'HP'}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="victory-error">{error}</p>}

        <footer className="victory-card__footer">
          <button
            type="button"
            className="victory-btn victory-btn--ghost"
            onClick={() => {
              playUiClick();
              onLeave();
            }}
          >
            SALIR DE LA SALA
          </button>

          {isHost ? (
            <button
              type="button"
              className="victory-btn victory-btn--primary"
              disabled={disabled}
              onClick={() => {
                playUiConfirm();
                onRestart();
              }}
            >
              ▶ JUGAR OTRA PARTIDA
            </button>
          ) : (
            <div className="victory-waiting">
              ESPERANDO A QUE EL ANFITRIÓN INICIE OTRA PARTIDA...
            </div>
          )}
        </footer>
      </section>
    </main>
  );
}
