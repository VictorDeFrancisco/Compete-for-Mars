import type { GameView } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from './AstronautPortraitSvg';
import './CrewSidebar.css';

export interface CrewSidebarProps {
  game: GameView;
}

function pct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export default function CrewSidebar({ game }: CrewSidebarProps) {
  return (
    <aside className="crew-sidebar" aria-label="Tripulación">
      <div className="crew-sidebar__head">CREW ({game.players.filter(p => p.health > 0).length}/{game.players.length})</div>
      <div className="crew-sidebar__list">
        {game.players.map((player, index) => {
          const isSelf = player.id === game.self.id;
          const dead = player.health <= 0;
          const suitColor = resolvePlayerSuitColor(player, game.self.stats, isSelf, index);
          const hpPct = pct(player.health, player.maxHealth);

          let statusLabel = 'STANDBY';
          let statusKind = 'idle';
          if (dead) {
            statusLabel = 'OUT';
            statusKind = 'dead';
          } else if (game.phase === 'cards') {
            statusLabel = player.hasChosenCard ? 'CARD ✓' : 'PICKING';
            statusKind = player.hasChosenCard ? 'ok' : 'idle';
          } else if (game.phase === 'presentation' || game.phase === 'results') {
            statusLabel = player.ready ? 'READY ✓' : 'WAIT';
            statusKind = player.ready ? 'ok' : 'idle';
          } else if (game.phase === 'playing') {
            if (typeof player.liveScore === 'number') {
              statusLabel = `${player.liveScore} PTS`;
              statusKind = player.hasSubmitted ? 'ok' : 'live';
            } else {
              statusLabel = player.hasSubmitted ? 'DONE ✓' : 'LIVE';
              statusKind = player.hasSubmitted ? 'ok' : 'live';
            }
          }

          return (
            <article
              key={player.id}
              className={[
                'crew-side-card',
                isSelf ? 'crew-side-card--self' : '',
                dead ? 'crew-side-card--dead' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="crew-side-card__avatar">
                <AstronautPortraitSvg suitColor={suitColor} variant={index} className="crew-side-card__svg" />
              </div>

              <div className="crew-side-card__body">
                <div className="crew-side-card__top">
                  <strong className="crew-side-card__name" title={player.name}>
                    {player.name}
                    {isSelf ? ' (YOU)' : ''}
                  </strong>
                  <span className={`crew-side-card__status crew-side-card__status--${statusKind}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="crew-side-card__hp-row">
                  <div className="crew-side-card__bar">
                    <div
                      className={`crew-side-card__fill${hpPct <= 30 ? ' is-low' : ''}`}
                      style={{ width: `${hpPct}%` }}
                    />
                  </div>
                  <span className="crew-side-card__hp-num">{player.health}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
