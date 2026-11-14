import { useState } from 'react';
import { DEFAULT_STATS, PHASE_LABELS } from '../../shared/constants';
import type { Phase, Stats } from '../../shared/types';
import { socket, useGame } from './hooks/useGame';
import { useCountdown } from './hooks/useCountdown';
import RoleSelect from './components/RoleSelect';
import Lobby from './components/Lobby';
import Hud from './components/Hud';
import StartScreen from './components/StartScreen';
import TestPanel, { buildPreviewGame } from './components/TestPanel';
import MinigamePresentation from './phases/MinigamePresentation';
import CardSelection from './phases/CardSelection';
import PlayMinigame from './phases/PlayMinigame';

type AppView = 'start' | 'classic' | 'test-panel' | 'preview';

export default function App() {
  const { game, connected, error, act, leave, serverOffset } = useGame();
  const [view, setView] = useState<AppView>('start');
  const [name, setName] = useState('');
  const [stats, setStats] = useState<Stats>({ ...DEFAULT_STATS });
  const [prepared, setPrepared] = useState(false);

  const [previewPhase, setPreviewPhase] = useState<Exclude<Phase, 'stats'>>('lobby');
  const [previewMinigameId, setPreviewMinigameId] = useState('pulse');
  const [previewReady, setPreviewReady] = useState(false);

  const seconds = useCountdown(game?.deadline ?? null, serverOffset);
  const phase: Phase = game?.phase ?? (prepared ? 'lobby' : 'stats');
  const entry = { name, stats };

  const quickLiveLobby = () => {
    const quickName = name.trim() || 'Tester';
    setName(quickName);
    act(reply =>
      socket.emit('room:create', { name: quickName, stats }, result => {
        reply(result);
        if (result.ok) {
          act(botReply => socket.emit('room:add-bots', botReply));
        }
      }),
    );
  };

  if (game) {
    if (phase === 'lobby') {
      return (
        <Lobby
          game={game}
          connected={connected}
          error={error}
          disabled={!connected}
          onBack={() => setPrepared(false)}
          onLeave={leave}
          onCreate={() => act(reply => socket.emit('room:create', entry, reply))}
          onJoin={code => act(reply => socket.emit('room:join', { ...entry, code }, reply))}
          onReady={() => act(reply => socket.emit('player:ready', !game.self.ready, reply))}
          onStart={() => act(reply => socket.emit('game:start', reply))}
          onBots={() => act(reply => socket.emit('room:add-bots', reply))}
          onRemove={id => act(reply => socket.emit('room:remove-player', id, reply))}
        />
      );
    }

    return (
      <main>
        <header>
          <div>
            <p className="eyebrow">C-Moon Dynamics · base de desarrollo</p>
            <h1>Compete For Mars</h1>
          </div>
          <div className="actions">
            <span className={connected ? 'status' : 'status offline'}>
              {connected ? 'Conectado' : 'Reconectando…'}
            </span>
          </div>
        </header>
        <nav aria-label="Fases">
          {(Object.keys(PHASE_LABELS) as Phase[]).map(p => (
            <span key={p} aria-current={p === phase ? 'step' : undefined}>
              {PHASE_LABELS[p]}
            </span>
          ))}
        </nav>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="room-bar">
          <span>Sala <strong>{game.code}</strong> · Ronda {game.round}</span>
          {seconds !== null && <strong role="timer">{seconds} s</strong>}
          <button className="secondary" onClick={leave} disabled={!connected}>Salir de la sala</button>
        </div>
        <div className="layout">
          <div>
            <fieldset disabled={!connected}>
              {phase === 'presentation' && (
                <MinigamePresentation
                  game={game}
                  onReady={() => act(reply => socket.emit('phase:ready', { phaseId: game.phaseId }, reply))}
                />
              )}
              {phase === 'cards' && (
                <CardSelection
                  game={game}
                  onChoose={cardId => act(reply => socket.emit('card:choose', { phaseId: game.phaseId, cardId }, reply))}
                />
              )}
              {phase === 'playing' && (
                <PlayMinigame
                  key={game.phaseId}
                  game={game}
                  onSubmit={result => act(reply => socket.emit('minigame:submit', { phaseId: game.phaseId, result }, reply))}
                />
              )}
            </fieldset>
          </div>
          <Hud game={game} />
        </div>
      </main>
    );
  }

  if (view === 'preview') {
    const previewGame = buildPreviewGame(previewPhase, previewMinigameId, previewReady);
    const previewBanner = (
      <div className="preview-banner">
        <span>MODO TEST (vista previa)</span>
        <button type="button" className="secondary" onClick={() => setView('test-panel')}>
          Panel de control
        </button>
        <button type="button" className="secondary" onClick={() => setView('start')}>
          Inicio
        </button>
      </div>
    );

    if (previewPhase === 'lobby') {
      return (
        <>
          <Lobby
            game={previewGame}
            connected={connected}
            disabled={false}
            onBack={() => setView('test-panel')}
            onLeave={() => setView('test-panel')}
            onCreate={() => {}}
            onJoin={() => {}}
            onReady={() => setPreviewReady(value => !value)}
            onStart={() => setPreviewPhase('presentation')}
            onBots={() => {}}
            onRemove={() => {}}
          />
          {previewBanner}
        </>
      );
    }

    return (
      <main>
        <header>
          <div>
            <p className="eyebrow">Compete For Mars · Vista previa TEST</p>
            <h1>Compete For Mars</h1>
          </div>
          <button type="button" className="secondary" onClick={() => setView('test-panel')}>
            Volver al panel
          </button>
        </header>
        <div className="layout">
          <div>
            {previewPhase === 'presentation' && (
              <MinigamePresentation game={previewGame} onReady={() => setPreviewPhase('cards')} />
            )}
            {previewPhase === 'cards' && (
              <CardSelection game={previewGame} onChoose={() => setPreviewPhase('playing')} />
            )}
            {previewPhase === 'playing' && (
              <PlayMinigame
                key={previewGame.phaseId}
                game={previewGame}
                onSubmit={() => setPreviewPhase('lobby')}
              />
            )}
          </div>
          <Hud game={previewGame} />
        </div>
        {previewBanner}
      </main>
    );
  }

  if (view === 'test-panel') {
    return (
      <TestPanel
        connected={connected}
        error={error}
        onQuickLiveLobby={quickLiveLobby}
        onOpenClassicFlow={() => setView('classic')}
        onPreviewPhase={(nextPhase, nextMinigameId) => {
          setPreviewPhase(nextPhase);
          setPreviewMinigameId(nextMinigameId);
          setPreviewReady(false);
          setView('preview');
        }}
        onBackToStart={() => setView('start')}
      />
    );
  }

  if (view === 'start') {
    return (
      <StartScreen
        connected={connected}
        error={error}
        name={name}
        stats={stats}
        onName={setName}
        onStats={setStats}
        onCreateRoom={() => act(reply => socket.emit('room:create', entry, reply))}
        onJoinRoom={code => act(reply => socket.emit('room:join', { ...entry, code }, reply))}
        onOpenTest={() => setView('test-panel')}
      />
    );
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">C-Moon Dynamics · base de desarrollo</p>
          <h1>Compete For Mars</h1>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setView('test-panel')}>
            Panel Test
          </button>
          <button type="button" className="secondary" onClick={() => setView('start')}>
            Inicio
          </button>
          <span className={connected ? 'status' : 'status offline'}>
            {connected ? 'Conectado' : 'Reconectando…'}
          </span>
        </div>
      </header>
      <nav aria-label="Fases">
        {(Object.keys(PHASE_LABELS) as Phase[]).map(p => (
          <span key={p} aria-current={p === phase ? 'step' : undefined}>
            {PHASE_LABELS[p]}
          </span>
        ))}
      </nav>
      {error && <p className="error" role="alert">{error}</p>}
      <fieldset disabled={false}>
        {phase === 'stats' && (
          <RoleSelect
            name={name}
            stats={stats}
            onName={setName}
            onStats={setStats}
            onContinue={() => setPrepared(true)}
          />
        )}
        {phase === 'lobby' && (
          <Lobby
            game={null}
            disabled={!connected}
            onBack={() => setPrepared(false)}
            onCreate={() => act(reply => socket.emit('room:create', entry, reply))}
            onJoin={code => act(reply => socket.emit('room:join', { ...entry, code }, reply))}
            onReady={() => {}}
            onStart={() => {}}
            onBots={() => {}}
            onRemove={() => {}}
          />
        )}
      </fieldset>
      <footer>
        Prototipo · <a href="/?minigame=pulse">Laboratorio local de minijuegos</a>
      </footer>
    </main>
  );
}
