import previewCards from '../../../server/data/boardSlots.json';
import type { Card } from '../../../shared/types';
import { useState } from 'react';
import { MINIGAMES } from '../../../shared/minigames/catalog';
import type { GameView, Phase } from '../../../shared/types';
import './TestPanel.css';

export interface TestPanelProps {
  connected: boolean;
  error: string;
  onQuickLiveLobby: () => void;
  onOpenClassicFlow: () => void;
  onPreviewPhase: (phase: Exclude<Phase, 'stats'>, minigameId: string) => void;
  onBackToStart: () => void;
}

export function buildPreviewGame(
  phase: Exclude<Phase, 'stats'>,
  minigameId: string,
  selfReady: boolean,
): GameView {
  const minigame = MINIGAMES.find(m => m.id === minigameId) ?? MINIGAMES[0];
  const now = Date.now();
  return {
    code: 'TEST01',
    hostId: 'preview-self',
    phase,
    phaseId: `preview-${phase}-${minigame.id}`,
    round: 1,
    deadline: phase === 'lobby' || phase === 'presentation' ? null : now + (phase === 'playing' ? minigame.durationMs : 25_000),
    serverNow: now,
    players: [
      {
        id: 'preview-self',
        name: 'Tester',
        health: 92,
        maxHealth: 100,
        isBot: false,
        connected: true,
        ready: selfReady,
        hasChosenCard: false,
        hasSubmitted: false,
      },
      {
        id: 'preview-bot-1',
        name: 'Ares (Bot)',
        health: 86,
        maxHealth: 100,
        isBot: true,
        connected: true,
        ready: true,
        hasChosenCard: true,
        hasSubmitted: false,
      },
      {
        id: 'preview-bot-2',
        name: 'Selene (Bot)',
        health: 78,
        maxHealth: 100,
        isBot: true,
        connected: true,
        ready: false,
        hasChosenCard: false,
        hasSubmitted: false,
      },
      {
        id: 'preview-bot-3',
        name: 'Orion (Bot)',
        health: 64,
        maxHealth: 100,
        isBot: true,
        connected: true,
        ready: true,
        hasChosenCard: true,
        hasSubmitted: false,
      },
    ],
    self: {
      id: 'preview-self',
      name: 'Tester',
      health: 92,
      maxHealth: 100,
      isBot: false,
      connected: true,
      ready: selfReady,
      hasChosenCard: false,
      hasSubmitted: false,
      stats: { energy: 30, food: 0, health: 0 },
      resources: { energy: 130, food: 100, radiation: 1 },
      selectedCardId: null,
      score: null,
      result: null,
    },
    cards: (previewCards as Card[]).filter(card => ['rest', 'sabotage', 'expedition'].includes(card.id)),
    minigame,
    lastResults: [
      {
        playerId: 'preview-self',
        name: 'Tester',
        score: 80,
        healthDelta: 0,
        resourcesDelta: { energy: 1, food: 1, radiation: 0 },
        rank: 1,
        outcome: 'winner',
        elapsedMs: 18_420,
        completed: true,
      },
      {
        playerId: 'preview-bot-3',
        name: 'Orion (Bot)',
        score: 40,
        healthDelta: -10,
        resourcesDelta: { energy: 0, food: 0, radiation: 0 },
        rank: 4,
        outcome: 'loser',
        elapsedMs: 25_000,
        completed: false,
      },
    ],
  };
}

export default function TestPanel({
  connected,
  error,
  onQuickLiveLobby,
  onOpenClassicFlow,
  onPreviewPhase,
  onBackToStart,
}: TestPanelProps) {
  const [minigameId, setMinigameId] = useState(MINIGAMES[0].id);

  return (
    <main className="test-panel">
      <header>
        <div>
          <p className="eyebrow">Compete For Mars · Test Mode</p>
          <h1>Control Panel</h1>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBackToStart}>
            Back to start
          </button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="test-panel__grid">
        <section className="panel">
          <h2>Quick Live Access</h2>
          <p>Create a live match instantly or open the step-by-step dev flow.</p>
          <div className="test-panel__actions">
            <button type="button" disabled={!connected} onClick={onQuickLiveLobby}>
              Quick room + 3 bots (Live 3D Lobby)
            </button>
            <button type="button" className="secondary" onClick={onOpenClassicFlow}>
              Classic flow (Stats → Lobby)
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Jump to any screen (local preview)</h2>
          <p>Inspect any game phase directly without waiting for rounds.</p>
          <label>
            Minigame for phases 2 &amp; 4
            <select
              className="test-panel__select"
              value={minigameId}
              onChange={event => setMinigameId(event.target.value)}
            >
              {MINIGAMES.map(game => (
                <option key={game.id} value={game.id}>
                  {game.title} ({game.id})
                </option>
              ))}
            </select>
          </label>
          <div className="test-panel__actions">
            <button type="button" onClick={() => onPreviewPhase('lobby', minigameId)}>
              1 · 3D Lobby (Mars Base)
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('presentation', minigameId)}>
              2 · Briefing
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('cards', minigameId)}>
              3 · Card Selection
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('playing', minigameId)}>
              4 · Play Minigame
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Minigame Lab</h2>
          <p>Test each minigame standalone with energy, food, and duration controls.</p>
          <div className="test-panel__links">
            {MINIGAMES.map(game => (
              <a key={game.id} className="test-panel__link-btn" href={`/?minigame=${game.id}`}>
                Open {game.title}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
