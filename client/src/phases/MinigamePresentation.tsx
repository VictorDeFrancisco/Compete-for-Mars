import { useEffect, useState } from 'react';
import { ROUND_RESOURCE_UPKEEP } from '../../../shared/constants';
import type { PresentationProps } from '../../../shared/types';
import AstronautPortraitSvg, { resolvePlayerSuitColor } from '../components/AstronautPortraitSvg';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import { CardCategoryPatchSvg, categoryLabels, getCardHighlights } from './CardSelection';
import './MinigamePresentation.css';

function resolveCardVerdict(summary: string): { label: 'SUCCESS' | 'FAILED'; tone: 'success' | 'fail' } | null {
  if (summary.includes('Mission succeeded') || summary.includes('Decontamination complete')) {
    return { label: 'SUCCESS', tone: 'success' };
  }
  if (
    summary.includes('Mission failed') ||
    summary.includes('Decontamination cancelled') ||
    summary.includes('Entered clean') ||
    summary.includes('No effect') ||
    summary.includes('cancelled') ||
    summary.includes('No valid target')
  ) {
    return { label: 'FAILED', tone: 'fail' };
  }
  return null;
}

const MINIGAME_PREVIEW_IMAGES: Record<string, { src: string; width: number; height: number }> = {
  pipes: { src: '/assets/minigames-preview/tuberias_water_grid.svg', width: 520, height: 420 },
  'mars-rover': { src: '/assets/minigames-preview/rover.svg', width: 3507, height: 2956 },
  'suit-up': { src: '/assets/minigames-preview/traje.svg', width: 520, height: 420 },
  'signal-modulator': { src: '/assets/minigames-preview/modulacion.svg', width: 1280, height: 720 },
  anomalies: { src: '/assets/minigames-preview/circuito.svg', width: 1280, height: 720 },
  'solar-storm': { src: '/assets/minigames-preview/donki.svg', width: 500, height: 320 },
  trivia: { src: '/assets/minigames-preview/trivia.svg', width: 1280, height: 720 },
};

const TARGET_PREVIEW_HEIGHT = 225;
const FRAME_CHROME_PX = 18;

function MinigamePreviewSvg({ id, title }: { id: string; title: string }) {
  const preview = MINIGAME_PREVIEW_IMAGES[id] ?? MINIGAME_PREVIEW_IMAGES.trivia;
  const maxFrameWidth = Math.round(TARGET_PREVIEW_HEIGHT * (preview.width / preview.height)) + FRAME_CHROME_PX;
  return (
    <div className="briefing-card__frame" style={{ maxWidth: `${maxFrameWidth}px` }}>
      <img
        className="briefing-card__svg"
        src={preview.src}
        width={preview.width}
        height={preview.height}
        style={{ aspectRatio: `${preview.width} / ${preview.height}` }}
        alt={title}
        draggable={false}
      />
    </div>
  );
}

// Phase 2/3: Mario Party-inspired Retro-NASA Briefing Card with DESCRIPTION & CONTROLS tabs.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'controls'>('description');
  const [dismissedOutcomePhaseId, setDismissedOutcomePhaseId] = useState<string | null>(null);
  const alivePlayers = game.players.filter(p => p.health > 0);
  const rewardFood = game.minigame.rewards.winner.resources?.food ?? 0;
  const rewardEnergy = game.minigame.rewards.winner.resources?.energy ?? 0;
  const resourceLabel = rewardFood > rewardEnergy ? 'Food' : 'Energy';
  const baseBonus = (rewardFood > rewardEnergy ? rewardFood : rewardEnergy) || 24;
  const roundBonus = Math.max(0, baseBonus - Math.max(0, game.round - 1) * 2);
  const deaths = game.players.filter(p => p.health <= 0).length;
  const loserPenalty = Math.max(1, game.round) * 8 * (deaths + 1);
  const cardOutcome = game.self.cardOutcome;
  const resolvedCard = cardOutcome ? game.cards.find(c => c.id === cardOutcome.cardId) : undefined;
  const cardVerdict = cardOutcome ? resolveCardVerdict(cardOutcome.summary) : null;
  const showCardReveal = Boolean(cardOutcome) && dismissedOutcomePhaseId !== game.phaseId && !game.self.ready;

  useEffect(() => {
    if (!showCardReveal) return;
    const timer = window.setTimeout(() => {
      setDismissedOutcomePhaseId(game.phaseId);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [showCardReveal, game.phaseId]);

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
              <MinigamePreviewSvg id={game.minigame.id} title={game.minigame.title} />
            </div>

            {/* Right Zone (65%): Big Title + Concise Objective + Stakes Strip */}
            <div className="briefing-card__info">
              <span className="briefing-card__kicker">MISSION BRIEFING</span>
              <h2 className="briefing-card__title">{game.minigame.title}</h2>
              <p className="briefing-card__objective">{game.minigame.objective}</p>

              <div className="briefing-stakes-strip" aria-label="Round rewards and penalties">
                <span className="briefing-stake briefing-stake--cost">-{ROUND_RESOURCE_UPKEEP} Energy · -{ROUND_RESOURCE_UPKEEP} Food</span>
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
              {(() => {
                const rawControls = game.minigame.controls;
                const answerGroup = rawControls.filter(c => /^answer-[1-4]$/.test(c.id));
                const restControls = answerGroup.length >= 2
                  ? [
                      {
                        id: 'answer-group',
                        label: 'Choose answer',
                        description: 'Pick the correct option (1–4) with the keyboard or by clicking.',
                        bindings: [
                          ...answerGroup.map((_, idx) => ({
                            device: 'keyboard' as const,
                            code: `Digit${idx + 1}`,
                            label: `${idx + 1}`,
                          })),
                          { device: 'pointer' as const, label: 'Click an option' },
                        ],
                      },
                      ...rawControls.filter(c => !/^answer-[1-4]$/.test(c.id)),
                    ]
                  : rawControls;

                return restControls.map(action => {
                  const hasPointer = action.bindings.some(b => b.device === 'pointer');
                  const visibleBindings = action.bindings.filter(b =>
                    b.device === 'touch' && hasPointer ? false : true,
                  );

                  return (
                    <div key={action.id} className="briefing-control-item">
                      <div className="briefing-control-item__keys">
                        {visibleBindings.map((binding, idx) => {
                          if (binding.device === 'pointer' || binding.device === 'touch') {
                            const icon = binding.device === 'pointer' ? '🖱' : '👆';
                            return (
                              <span
                                key={`${action.id}-${idx}`}
                                className={`briefing-input-pill briefing-input-pill--${binding.device}`}
                              >
                                <span aria-hidden="true">{icon}</span>
                                {binding.label}
                              </span>
                            );
                          }

                          const raw = binding.label.toUpperCase();
                          const keyLabel = raw === 'ESPACIO' || raw === 'SPACE' ? 'SPACE' : raw;
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
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Footer: Small Crew Avatars with Ready Tick + Single NASA Orange READY Button */}
        <footer className="briefing-card__footer">
          <div className="briefing-crew" aria-label="Crew readiness">
            {alivePlayers.map((player) => {
              const slotIndex = Math.max(0, game.players.findIndex(p => p.id === player.id));
              return (
                <div
                  key={player.id}
                  className={`briefing-crew__chip${player.ready ? ' is-ready' : ''}`}
                  title={`${player.name}: ${player.ready ? 'Ready' : 'Waiting'}`}
                >
                  <AstronautPortraitSvg
                    suitColor={resolvePlayerSuitColor(player, game.self.stats, player.id === game.self.id, slotIndex)}
                    variant={slotIndex}
                    className="briefing-crew__avatar"
                  />
                  {player.ready && (
                    <span className="briefing-crew__tick" aria-label="Ready">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
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

      {showCardReveal && cardOutcome && (
        <div
          className="briefing-card-reveal-backdrop"
          onClick={() => setDismissedOutcomePhaseId(game.phaseId)}
        >
          <article
            className={`briefing-played-card${cardVerdict ? ` briefing-played-card--${cardVerdict.tone}` : ''}`}
            data-category={resolvedCard?.category ?? 'supply'}
          >
            <div className="briefing-played-card__top">
              <span>{resolvedCard?.category ? categoryLabels[resolvedCard.category] : 'Card played'}</span>
              <span>ROUND {String(game.round).padStart(2, '0')}</span>
            </div>

            <div className="briefing-played-card__patch">
              <CardCategoryPatchSvg cardId={resolvedCard?.id} category={resolvedCard?.category ?? 'supply'} />
            </div>

            <h3 className="briefing-played-card__title">
              {resolvedCard?.title ?? cardOutcome.cardId}
            </h3>

            {resolvedCard && (
              <div className="briefing-played-card__badges">
                {getCardHighlights(resolvedCard, alivePlayers.length).map((item, i) => (
                  <span key={i} className={`action-badge action-badge--${item.tone}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            )}

            <span
              className={`briefing-played-card__stamp briefing-played-card__stamp--${cardVerdict?.tone ?? 'neutral'}`}
            >
              {cardVerdict ? cardVerdict.label : 'CHOSEN'}
            </span>
          </article>
        </div>
      )}
    </section>
  );
}
