import { useState } from 'react';
import { CARDS_MS, PHASE_LABELS, RESULTS_MS } from '../../shared/constants';
import type { Phase, Stats } from '../../shared/types';
import { socket, useGame } from './hooks/useGame';
import { useCountdown } from './hooks/useCountdown';
import RoleSelect from './components/RoleSelect';
import Lobby from './components/Lobby';
import MatchVictoryScreen from './components/MatchVictoryScreen';
import Hud, { BottomCrewDock } from './components/Hud';
import StartScreen from './components/StartScreen';
import RoomEntryScreen from './components/RoomEntryScreen';
import MarsBackdrop from './components/MarsBackdrop';
import MarsMenuBackdrop, { type MenuTransitionDirection } from './components/MarsMenuBackdrop';
import { PROFESSIONS } from './components/professions';
import TestPanel, { buildPreviewGame } from './components/TestPanel';
import MinigamePresentation from './phases/MinigamePresentation';
import CardSelection from './phases/CardSelection';
import PlayMinigame from './phases/PlayMinigame';
import RoundLeaderboard from './phases/RoundLeaderboard';

type AppView = 'start' | 'create' | 'join' | 'classic' | 'test-panel' | 'preview';

export default function App() {
  const { game, connected, error, act, leave, serverOffset } = useGame();
  const [view, setView] = useState<AppView>('start');
  const [menuTransition, setMenuTransition] = useState<{
    direction: MenuTransitionDirection;
    target: 'start' | 'create' | 'join';
  } | null>(null);
  const [enteredViaTransition, setEnteredViaTransition] = useState(false);
  const [name, setName] = useState('');
  const [stats, setStats] = useState<Stats>({ ...PROFESSIONS[0].stats });
  const [prepared, setPrepared] = useState(false);

  const [previewPhase, setPreviewPhase] = useState<Exclude<Phase, 'stats'>>('lobby');
  const [previewMinigameId, setPreviewMinigameId] = useState('pipes');
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
    if (phase === 'lobby' && (game.matchFinished || game.winnerId != null)) {
      return (
        <MatchVictoryScreen
          game={game}
          error={error}
          disabled={!connected}
          onRestart={() => act(reply => socket.emit('game:restart', reply))}
          onLeave={leave}
        />
      );
    }

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
      <div className="mars-stage">
        <MarsBackdrop />
        <main className="mars-stage__main">
          <Hud game={game} seconds={phase === 'playing' ? null : seconds} onLeave={leave} disabled={!connected} />
          {error && <p className="error stage-error" role="alert">{error}</p>}
          <div className="stage-workspace">
            <div className="stage-center">
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
                    onChoose={(cardId, targetId) => act(reply => socket.emit('card:choose', { phaseId: game.phaseId, cardId, targetId }, reply))}
                  />
                )}
                {phase === 'playing' && (
                  <PlayMinigame
                    key={game.phaseId}
                    game={game}
                    seconds={seconds}
                    onProgress={score => socket.emit('minigame:progress', { phaseId: game.phaseId, score })}
                    onSubmit={result => act(reply => socket.emit('minigame:submit', { phaseId: game.phaseId, result }, reply))}
                  />
                )}
                {phase === 'results' && (
                  <RoundLeaderboard
                    game={game}
                    onContinue={() => act(reply => socket.emit('phase:ready', { phaseId: game.phaseId }, reply))}
                  />
                )}
              </fieldset>
            </div>
          </div>
          <BottomCrewDock game={game} />
        </main>
      </div>
    );
  }

  if (view === 'preview') {
    const previewGame = buildPreviewGame(previewPhase, previewMinigameId, previewReady);
    const previewBanner = (
      <div className="preview-banner">
        <span>TEST MODE (preview)</span>
        <button type="button" className="secondary" onClick={() => setView('test-panel')}>
          Control panel
        </button>
        <button type="button" className="secondary" onClick={() => setView('start')}>
          Start
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

    const previewSeconds =
      previewPhase === 'cards'
        ? Math.ceil(CARDS_MS / 1000)
        : previewPhase === 'results'
          ? Math.ceil(RESULTS_MS / 1000)
          : previewPhase === 'playing'
            ? Math.ceil(previewGame.minigame.durationMs / 1000)
            : null;

    return (
      <div className="mars-stage">
        <MarsBackdrop />
        <main className="mars-stage__main">
          <Hud
            game={previewGame}
            seconds={previewPhase === 'playing' ? null : previewSeconds}
            onLeave={() => setView('test-panel')}
            leaveLabel="BACK TO PANEL"
          />
          <div className="stage-workspace">
            <div className="stage-center">
              {previewPhase === 'presentation' && (
                <MinigamePresentation game={previewGame} onReady={() => setPreviewPhase('playing')} />
              )}
              {previewPhase === 'cards' && (
                <CardSelection game={previewGame} onChoose={() => setPreviewPhase('presentation')} />
              )}
              {previewPhase === 'playing' && (
                <PlayMinigame
                  key={previewGame.phaseId}
                  game={previewGame}
                  seconds={previewSeconds}
                  onSubmit={() => setPreviewPhase('results')}
                />
              )}
              {previewPhase === 'results' && (
                <RoundLeaderboard
                  game={previewGame}
                  onContinue={() => setPreviewPhase('lobby')}
                />
              )}
            </div>
          </div>
          <BottomCrewDock game={previewGame} />
          {previewBanner}
        </main>
      </div>
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

  if (view === 'start' || view === 'create' || view === 'join') {
    const scene = view === 'start' ? 'home' : 'entry';
    const startMenuTransition = (
      direction: MenuTransitionDirection,
      target: 'start' | 'create' | 'join',
    ) => {
      if (menuTransition) return;
      setMenuTransition({ direction, target });
    };
    const handleMenuTransitionComplete = () => {
      if (!menuTransition) return;
      const next = menuTransition.target;
      setEnteredViaTransition(menuTransition.direction === 'forward');
      setMenuTransition(null);
      setView(next);
    };

    return (
      <>
        <MarsMenuBackdrop
          scene={scene}
          transition={menuTransition?.direction ?? null}
          onTransitionComplete={handleMenuTransitionComplete}
        />
        {view === 'start' ? (
          <StartScreen
            showBackdrop={false}
            exiting={menuTransition?.direction === 'forward'}
            onCreateScreen={() => startMenuTransition('forward', 'create')}
            onJoinScreen={() => startMenuTransition('forward', 'join')}
            onOpenTest={() => {
              setMenuTransition(null);
              setView('test-panel');
            }}
          />
        ) : (
          <RoomEntryScreen
            showBackdrop={false}
            exiting={menuTransition?.direction === 'reverse'}
            entering={enteredViaTransition && menuTransition === null}
            mode={view}
            connected={connected}
            error={error}
            name={name}
            stats={stats}
            onName={setName}
            onStats={setStats}
            onSubmit={code => {
              if (view === 'create') {
                act(reply => socket.emit('room:create', entry, reply));
              } else if (code) {
                act(reply => socket.emit('room:join', { ...entry, code }, reply));
              }
            }}
            onSwitchMode={nextMode => setView(nextMode)}
            onBack={() => startMenuTransition('reverse', 'start')}
          />
        )}
      </>
    );
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">C-Moon Dynamics · Dev Flow</p>
          <h1>Compete For Mars</h1>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setView('test-panel')}>
            Test Panel
          </button>
          <button type="button" className="secondary" onClick={() => setView('start')}>
            Start
          </button>
        </div>
      </header>
      <nav aria-label="Phases">
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
        Prototype · <a href="/?minigame=pipes">Local minigame lab</a>
      </footer>
    </main>
  );
}
