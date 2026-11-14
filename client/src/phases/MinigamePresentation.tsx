import { useState } from 'react';
import type { PresentationProps } from '../../../shared/types';
import AstronautPortraitSvg, { suitColorByIndex, suitColorForPlayer } from '../components/AstronautPortraitSvg';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import './MinigamePresentation.css';

function MinigamePreviewSvg({ id }: { id: string }) {
  switch (id) {
    case 'pipes':
      return (
        <svg className="briefing-card__svg" viewBox="0 0 200 130" aria-hidden="true">
          <rect width="200" height="130" fill="#EAE0CA" />
          <path d="M18 38 H72 V92 H128 V44 H182" fill="none" stroke="#1F7A8C" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M18 38 H72 V92 H128 V44 H182" fill="none" stroke="#7AE5F5" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="24" cy="38" r="11" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.5" />
          <circle cx="176" cy="44" r="11" fill="#D97706" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="60" y="80" width="24" height="24" rx="3" fill="none" stroke="#FC3D21" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      );
    case 'mars-rover':
      return (
        <svg className="briefing-card__svg" viewBox="0 0 200 130" aria-hidden="true">
          <rect width="200" height="130" fill="#E8B99B" />
          <circle cx="152" cy="34" r="18" fill="#E67A45" stroke="#1A1817" strokeWidth="2.5" />
          <path d="M0 82 Q60 62 118 80 T200 72 V130 H0 Z" fill="#C1440E" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="58" y="62" width="54" height="20" rx="4" fill="#F5EFE0" stroke="#1A1817" strokeWidth="3" />
          <rect x="78" y="46" width="18" height="16" fill="#0B3D91" stroke="#1A1817" strokeWidth="2.5" />
          <circle cx="67" cy="88" r="9" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2.5" />
          <circle cx="85" cy="88" r="9" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2.5" />
          <circle cx="103" cy="88" r="9" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2.5" />
        </svg>
      );
    case 'suit-up':
      return (
        <svg className="briefing-card__svg" viewBox="0 0 200 130" aria-hidden="true">
          <rect width="200" height="130" fill="#EAE0CA" />
          <circle cx="100" cy="65" r="44" fill="none" stroke="#C7B99D" strokeWidth="10" />
          <path d="M62 42 A44 44 0 0 1 138 42" fill="none" stroke="#22C55E" strokeWidth="10" strokeLinecap="round" />
          <circle cx="100" cy="65" r="26" fill="#F5EFE0" stroke="#1A1817" strokeWidth="3" />
          <rect x="82" y="54" width="36" height="20" rx="9" fill="#334155" stroke="#1A1817" strokeWidth="2" />
          <rect x="148" y="92" width="36" height="20" rx="3" fill="#FC3D21" stroke="#1A1817" strokeWidth="2.5" />
        </svg>
      );
    case 'trivia':
    default:
      return (
        <svg className="briefing-card__svg" viewBox="0 0 200 130" aria-hidden="true">
          <rect width="200" height="130" fill="#EAE0CA" />
          <rect x="20" y="18" width="160" height="30" rx="4" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="34" y="29" width="104" height="8" rx="3" fill="#1A1817" />
          <rect x="20" y="60" width="74" height="22" rx="4" fill="#2E8B57" stroke="#1A1817" strokeWidth="2" />
          <rect x="106" y="60" width="74" height="22" rx="4" fill="#FFF9EB" stroke="#1A1817" strokeWidth="2" />
          <rect x="20" y="90" width="74" height="22" rx="4" fill="#FFF9EB" stroke="#1A1817" strokeWidth="2" />
          <rect x="106" y="90" width="74" height="22" rx="4" fill="#FFF9EB" stroke="#1A1817" strokeWidth="2" />
        </svg>
      );
  }
}

// Phase 2/3: Mario Party-inspired Retro-NASA Briefing Card with DESCRIPTION & CONTROLS tabs.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'controls'>('description');
  const alivePlayers = game.players.filter(p => p.health > 0);
  const rewardFood = game.minigame.rewards.winner.resources?.food ?? 0;
  const rewardEnergy = game.minigame.rewards.winner.resources?.energy ?? 0;
  const resourceLabel = rewardFood > rewardEnergy ? 'Food' : 'Energy';
  const baseBonus = (rewardFood > rewardEnergy ? rewardFood : rewardEnergy) || 24;
  const roundBonus = Math.max(0, baseBonus - Math.max(0, game.round - 1) * 2);
  const deaths = game.players.filter(p => p.health <= 0).length;
  const loserPenalty = Math.max(1, game.round) * 8 * (deaths + 1);

  if (game.self.health <= 0) {
    return (
      <section className="briefing-card briefing-card--spectator">
        <h2>Spectating the mission</h2>
        <p>The surviving crew is reviewing the briefing for the next round.</p>
      </section>
    );
  }

  return (
    <section className="briefing-shell" aria-label={`Briefing: ${game.minigame.title}`}>
      {/* Pestañas superiores estilo Mario Party (DESCRIPTION / CONTROLS) */}
      <div className="briefing-tabs" role="tablist" aria-label="Briefing sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'description'}
          className={`briefing-tab${activeTab === 'description' ? ' is-active' : ''}`}
          onClick={() => {
            playUiClick();
            setActiveTab('description');
          }}
        >
          DESCRIPTION
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'controls'}
          className={`briefing-tab${activeTab === 'controls' ? ' is-active' : ''}`}
          onClick={() => {
            playUiClick();
            setActiveTab('controls');
          }}
        >
          CONTROLS
        </button>
      </div>

      <div className="briefing-card">
        {activeTab === 'description' ? (
          <div className="briefing-card__body">
            {/* Left Zone (35%): Minigame SVG preview only (controls live exclusively in CONTROLS tab) */}
            <div className="briefing-card__visual">
              <div className="briefing-card__frame">
                <MinigamePreviewSvg id={game.minigame.id} />
              </div>
            </div>

            {/* Right Zone (65%): Big Title + Concise Objective + Stakes Strip */}
            <div className="briefing-card__info">
              <span className="briefing-card__kicker">MISSION BRIEFING</span>
              <h2 className="briefing-card__title">{game.minigame.title}</h2>
              <p className="briefing-card__objective">{game.minigame.objective}</p>

              <div className="briefing-stakes-strip" aria-label="Round rewards and penalties">
                <span className="briefing-stake briefing-stake--cost">-18 Energy · -18 Food</span>
                <span className="briefing-stake briefing-stake--win">+{roundBonus} {resourceLabel} Winner</span>
                <span className="briefing-stake briefing-stake--loss">-{loserPenalty} HP Last</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="briefing-controls-panel" role="tabpanel" aria-label="Minigame controls">
            <div className="briefing-controls-panel__head">
              <span className="briefing-card__kicker">HARDWARE CONTROLS</span>
              <h2 className="briefing-card__title">{game.minigame.title}</h2>
            </div>

            <div className="briefing-controls-grid">
              {game.minigame.controls.map(action => (
                <div key={action.id} className="briefing-control-item">
                  <div className="briefing-control-item__keys">
                    {action.bindings.map((binding, idx) => {
                      const raw = binding.label.toUpperCase();
                      const keyLabel = raw === 'ESPACIO' ? 'SPACE' : raw;
                      return (
                        <kbd
                          key={`${action.id}-${idx}`}
                          className={`briefing-keycap3d${keyLabel.length > 2 ? ' briefing-keycap3d--wide' : ''}`}
                        >
                          {keyLabel}
                        </kbd>
                      );
                    })}
                  </div>
                  <div className="briefing-control-item__copy">
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer: Small Crew Avatars with Ready Tick + Single NASA Orange READY Button */}
        <footer className="briefing-card__footer">
          <div className="briefing-crew" aria-label="Crew readiness">
            {alivePlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`briefing-crew__chip${player.ready ? ' is-ready' : ''}`}
                title={`${player.name}: ${player.ready ? 'Ready' : 'Waiting'}`}
              >
                <AstronautPortraitSvg
                  suitColor={player.id === game.self.id ? suitColorForPlayer(game.self.stats, idx) : suitColorByIndex(idx)}
                  variant={idx}
                  className="briefing-crew__avatar"
                />
                {player.ready && (
                  <span className="briefing-crew__tick" aria-label="Ready">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="briefing-ready-btn"
            disabled={game.self.ready || game.self.health <= 0}
            onClick={() => {
              playUiConfirm();
              onReady();
            }}
          >
            {game.self.ready ? 'READY ✓' : 'READY'}
          </button>
        </footer>
      </div>
    </section>
  );
}
