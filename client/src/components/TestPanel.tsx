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
    deadline: phase === 'lobby' ? null : now + (phase === 'playing' ? minigame.durationMs : 25_000),
    serverNow: now,
    players: [
      {
        id: 'preview-self',
        name: 'Tester',
        health: 92,
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
      isBot: false,
      connected: true,
      ready: selfReady,
      hasChosenCard: false,
      hasSubmitted: false,
      stats: { energy: 2, food: 2, shielding: 2 },
      resources: { energy: 7, food: 6, radiation: 2 },
      selectedCardId: null,
      score: null,
      result: null,
    },
    cards: [
      { id: 'rest', title: 'Descansar', description: 'Recuperas 2 de energía.', effect: { energy: 2 } },
      { id: 'supplies', title: 'Recoger raciones', description: 'Ganas 2 de comida y gastas 1 de energía.', effect: { food: 2, energy: -1 } },
      { id: 'expedition', title: 'Expedición', description: 'Ganas 3 de comida, gastas 2 de energía y acumulas 1 de radiación.', effect: { food: 3, energy: -2, radiation: 1 } },
    ],
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
          <p className="eyebrow">Compete For Mars · Modo Test</p>
          <h1>Panel de control</h1>
        </div>
        <div className="actions">
          <span className={connected ? 'status' : 'status offline'}>
            {connected ? 'Servidor conectado' : 'Sin servidor (solo previews locales)'}
          </span>
          <button type="button" className="secondary" onClick={onBackToStart}>
            Volver al inicio
          </button>
        </div>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="test-panel__grid">
        <section className="panel">
          <h2>Acceso rápido con servidor</h2>
          <p>Crea una partida real al instante o abre el flujo clásico paso a paso.</p>
          <div className="test-panel__actions">
            <button type="button" disabled={!connected} onClick={onQuickLiveLobby}>
              Crear sala rápida + 3 bots (Lobby 3D real)
            </button>
            <button type="button" className="secondary" onClick={onOpenClassicFlow}>
              Flujo clásico (Estadísticas → Lobby)
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Ir directo a una pantalla (vista previa local)</h2>
          <p>Salta directamente a cualquier fase para probar diseño y controles sin esperar rondas.</p>
          <label>
            Minijuego para fases 2 y 4
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
              1 · Lobby 3D (Base Marciana)
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('presentation', minigameId)}>
              2 · Presentación
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('cards', minigameId)}>
              3 · Elección de cartas
            </button>
            <button type="button" className="secondary" onClick={() => onPreviewPhase('playing', minigameId)}>
              4 · Jugar minijuego
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Laboratorio de minijuegos</h2>
          <p>Prueba cada minijuego aislado con selector de energía, comida y duración.</p>
          <div className="test-panel__links">
            {MINIGAMES.map(game => (
              <a key={game.id} className="test-panel__link-btn" href={`/?minigame=${game.id}`}>
                Abrir {game.title}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
