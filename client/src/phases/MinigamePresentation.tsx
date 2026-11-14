import { Fragment, useState } from 'react';
import { Controls } from '../../../shared/minigames/Controls';
import type { PresentationProps } from '../../../shared/types';
import AstronautPortraitSvg, { suitColorByIndex, suitColorForPlayer } from '../components/AstronautPortraitSvg';
import { NasaOrbitStampSvg, PaperclipSvg, TopoWatermarkSvg } from '../components/NasaMarks';
import { playUiClick, playUiConfirm } from '../utils/uiAudio';
import './MinigamePresentation.css';

const START_BUTTON_LABELS: Record<string, string> = {
  pipes: 'START REPAIR',
  'suit-up': 'START SUIT-UP',
  'mars-rover': 'LAUNCH ROVER',
  trivia: 'START QUIZ',
};

function MinigamePreviewSvg({ id }: { id: string }) {
  switch (id) {
    case 'pipes':
      return (
        <svg className="briefing-preview__svg" viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="#101824" />
          <rect x="8" y="8" width="144" height="84" fill="#162233" stroke="#2D4363" strokeWidth="2" />
          {/* Blue inflow + gold outflow pipe network */}
          <path d="M16 30 H56 V68 H102 V34 H144" fill="none" stroke="#22D3EE" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M16 30 H56 V68 H102 V34 H144" fill="none" stroke="#A5F3FC" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="22" cy="30" r="8" fill="#0B3D91" stroke="#F5EFE0" strokeWidth="2" />
          <circle cx="138" cy="34" r="8" fill="#D97706" stroke="#F5EFE0" strokeWidth="2" />
          <rect x="46" y="58" width="20" height="20" rx="2" fill="none" stroke="#FC3D21" strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      );
    case 'mars-rover':
      return (
        <svg className="briefing-preview__svg" viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="#0B192C" />
          <path d="M0 64 Q50 48 95 62 T160 56 V100 H0 Z" fill="#C1440E" stroke="#1A1817" strokeWidth="2" />
          <circle cx="122" cy="26" r="14" fill="#E67A45" stroke="#1A1817" strokeWidth="2" />
          {/* Stylized Rover */}
          <rect x="48" y="50" width="42" height="16" rx="3" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="64" y="38" width="14" height="12" fill="#0B3D91" stroke="#1A1817" strokeWidth="2" />
          <circle cx="55" cy="70" r="7" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2" />
          <circle cx="70" cy="70" r="7" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2" />
          <circle cx="84" cy="70" r="7" fill="#2B2D2A" stroke="#1A1817" strokeWidth="2" />
        </svg>
      );
    case 'suit-up':
      return (
        <svg className="briefing-preview__svg" viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="#131B26" />
          <circle cx="80" cy="50" r="34" fill="none" stroke="#334155" strokeWidth="8" />
          <path d="M52 30 A34 34 0 0 1 108 30" fill="none" stroke="#4ADE80" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="50" r="20" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.5" />
          <rect x="67" y="42" width="26" height="16" rx="7" fill="#172A44" />
          <rect x="116" y="70" width="32" height="16" rx="2" fill="#FC3D21" stroke="#1A1817" strokeWidth="2" />
        </svg>
      );
    case 'trivia':
      return (
        <svg className="briefing-preview__svg" viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="#101824" />
          <rect x="16" y="14" width="128" height="24" rx="3" fill="#0B3D91" stroke="#F5EFE0" strokeWidth="2" />
          <rect x="26" y="23" width="84" height="6" rx="2" fill="#F5EFE0" />
          <rect x="16" y="46" width="60" height="18" rx="3" fill="#2F6F4E" stroke="#F5EFE0" strokeWidth="1.5" />
          <rect x="84" y="46" width="60" height="18" rx="3" fill="#24344D" stroke="#64748B" strokeWidth="1.5" />
          <rect x="16" y="70" width="60" height="18" rx="3" fill="#24344D" stroke="#64748B" strokeWidth="1.5" />
          <rect x="84" y="70" width="60" height="18" rx="3" fill="#24344D" stroke="#64748B" strokeWidth="1.5" />
        </svg>
      );
    default:
      return (
        <svg className="briefing-preview__svg" viewBox="0 0 160 100" aria-hidden="true">
          <rect width="160" height="100" fill="#101A17" />
          <polyline points="12,56 40,56 52,24 68,78 86,38 102,56 148,56" fill="none" stroke="#4ADE80" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="80" cy="50" r="36" fill="none" stroke="#2D4A3E" strokeWidth="2" />
        </svg>
      );
  }
}

function InputMethodBadgeSvg({ usesMouse, usesKeyboard }: { usesMouse: boolean; usesKeyboard: boolean }) {
  return (
    <div className="briefing-input-badge" aria-label={`Input: ${usesKeyboard && usesMouse ? 'Keyboard & Mouse' : usesMouse ? 'Mouse' : 'Keyboard'}`}>
      <svg className="briefing-input-badge__svg" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="4" y="10" width="40" height="28" rx="4" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2.5" />
        {usesKeyboard ? (
          <>
            <rect x="10" y="17" width="8" height="7" rx="1" fill="#1A1817" />
            <rect x="20" y="17" width="8" height="7" rx="1" fill="#1A1817" />
            <rect x="30" y="17" width="8" height="7" rx="1" fill="#FC3D21" />
            <rect x="12" y="27" width="24" height="5" rx="1" fill="#0B3D91" />
          </>
        ) : (
          <>
            <rect x="16" y="13" width="16" height="22" rx="8" fill="#E5D9C2" stroke="#1A1817" strokeWidth="2" />
            <line x1="24" y1="13" x2="24" y2="23" stroke="#1A1817" strokeWidth="2" />
            <circle cx="20" cy="18" r="2" fill="#FC3D21" />
          </>
        )}
      </svg>
      <span>{usesKeyboard && usesMouse ? 'KEYS + MOUSE' : usesMouse ? 'MOUSE' : 'KEYBOARD'}</span>
    </div>
  );
}

// Phase 2: Mario-Party-inspired Retro-NASA Briefing with Challenge & Controls tabs and contextual Start button.
export default function MinigamePresentation({ game, onReady }: PresentationProps) {
  const [activeTab, setActiveTab] = useState<'challenge' | 'controls'>('challenge');

  const alivePlayers = game.players.filter(p => p.health > 0);
  const rewardFood = game.minigame.rewards.winner.resources?.food ?? 0;
  const rewardEnergy = game.minigame.rewards.winner.resources?.energy ?? 0;
  const resource = rewardFood > rewardEnergy ? 'food' : 'energy';
  const baseBonus = (resource === 'food' ? rewardFood : rewardEnergy) || 20;
  const roundBonus = Math.max(0, baseBonus - Math.max(0, game.round - 1) * 2);
  const deaths = game.players.filter(p => p.health <= 0).length;
  const loserPenalty = Math.max(1, game.round) * (deaths + 1);

  const controls = new Controls(game.minigame.controls).describe();
  const usesMouse = game.minigame.controls.some(c => c.bindings.some(b => b.device === 'pointer' || b.device === 'touch'));
  const usesKeyboard = game.minigame.controls.some(c => c.bindings.some(b => b.device === 'keyboard'));

  const startLabel = START_BUTTON_LABELS[game.minigame.id] ?? 'START MISSION';
  const readyCount = alivePlayers.filter(p => p.ready).length;

  if (game.self.health <= 0) {
    return (
      <section className="panel phase-presentation">
        <h2>Spectating the mission</h2>
        <p>The surviving crew is preparing the next round.</p>
      </section>
    );
  }

  return (
    <section className="phase-presentation" aria-label={`Briefing: ${game.minigame.title}`}>
      {/* Header Title Plate + Crew Matchup Strip (VS) */}
      <header className="briefing-header">
        <div className="briefing-banner">
          <div className="briefing-banner__meta">
            <span className="briefing-round-pill">ROUND {String(game.round).padStart(2, '0')}</span>
            <h2 className="briefing-title">{game.minigame.title}</h2>
          </div>
          <NasaOrbitStampSvg label={`OPS // ${game.minigame.id.toUpperCase()}`} />
        </div>

        <div className="briefing-vs-row" aria-label="Participating astronauts">
          {alivePlayers.map((player, idx) => (
            <Fragment key={player.id}>
              {idx > 0 && <span className="briefing-vs-badge" aria-hidden="true">VS</span>}
              <div className={`briefing-astronaut${player.ready ? ' briefing-astronaut--ready' : ''}`}>
                <AstronautPortraitSvg
                  suitColor={player.id === game.self.id ? suitColorForPlayer(game.self.stats, idx) : suitColorByIndex(idx)}
                  variant={idx}
                  className="briefing-astronaut__portrait"
                />
                <span className="briefing-astronaut__name">{player.name}</span>
                {player.ready && <span className="briefing-astronaut__ready">READY</span>}
              </div>
            </Fragment>
          ))}
        </div>
      </header>

      {/* Tabbed Manila Briefing Sheet (Description vs Controls) */}
      <div className="briefing-folder-wrap">
        <div className="briefing-tabs" role="tablist" aria-label="Briefing sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'challenge'}
            className={`briefing-tab${activeTab === 'challenge' ? ' briefing-tab--active' : ''}`}
            onClick={() => {
              playUiClick();
              setActiveTab('challenge');
            }}
          >
            DESCRIPTION
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'controls'}
            className={`briefing-tab${activeTab === 'controls' ? ' briefing-tab--active' : ''}`}
            onClick={() => {
              playUiClick();
              setActiveTab('controls');
            }}
          >
            CONTROLS
          </button>
        </div>

        <div className="panel briefing-sheet" role="tabpanel">
          <TopoWatermarkSvg />
          <PaperclipSvg className="briefing-paperclip" />

          {activeTab === 'challenge' ? (
            <div className="briefing-challenge-grid">
              <div className="briefing-preview-col">
                <div className="briefing-preview-frame">
                  <MinigamePreviewSvg id={game.minigame.id} />
                </div>
                <InputMethodBadgeSvg usesMouse={usesMouse} usesKeyboard={usesKeyboard} />
              </div>

              <div className="briefing-copy-col">
                <p className="briefing-instructions">{game.minigame.instructions}</p>
                <p className="briefing-objective">{game.minigame.objective}</p>
                <p className="briefing-stakes">
                  <strong>Round stakes:</strong> −5 energy & −5 food · Winner +{roundBonus} {resource} · Last −{loserPenalty} HP · Reinforced suits block radiation damage only.
                </p>
              </div>
            </div>
          ) : (
            <div className="briefing-controls-panel">
              <ul className="briefing-controls-list">
                {controls.map(action => (
                  <li key={action.id} className="briefing-control-row">
                    <span className="briefing-keycap">{action.inputs}</span>
                    <div className="briefing-control-text">
                      <strong>{action.label}</strong>
                      <span>{action.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar: Controls Toggle Button + Per-Minigame Start Action Button */}
      <div className="briefing-footer">
        <button
          type="button"
          className="secondary briefing-toggle-btn"
          onClick={() => {
            playUiClick();
            setActiveTab(prev => (prev === 'challenge' ? 'controls' : 'challenge'));
          }}
        >
          {activeTab === 'challenge' ? 'VIEW CONTROLS' : 'VIEW DESCRIPTION'}
        </button>

        <div className="briefing-start-group">
          <span className="briefing-ready-count">
            {readyCount}/{alivePlayers.length} CREW READY
          </span>
          <button
            type="button"
            className="briefing-start-btn"
            disabled={game.self.ready || game.self.health <= 0}
            onClick={() => {
              playUiConfirm();
              onReady();
            }}
          >
            {game.self.ready ? 'WAITING FOR CREW…' : startLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
