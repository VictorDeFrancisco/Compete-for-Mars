import { useState } from 'react';
import { DEFAULT_STATS, PHASE_LABELS } from '../../shared/constants';
import type { Phase, Stats } from '../../shared/types';
import { socket, useGame } from './hooks/useGame';
import { useCountdown } from './hooks/useCountdown';
import RoleSelect from './components/RoleSelect';
import Lobby from './components/Lobby';
import Hud from './components/Hud';
import MinigamePresentation from './phases/MinigamePresentation';
import CardSelection from './phases/CardSelection';
import PlayMinigame from './phases/PlayMinigame';

export default function App() {
  const { game, connected, error, act, leave, serverOffset } = useGame();
  const [name, setName] = useState('');
  const [stats, setStats] = useState<Stats>({ ...DEFAULT_STATS });
  const [prepared, setPrepared] = useState(false);
  const seconds = useCountdown(game?.deadline ?? null, serverOffset);
  const phase: Phase = game?.phase ?? (prepared ? 'lobby' : 'stats');
  const entry = { name, stats };
  return <main><header><div><p className="eyebrow">C-Moon Dynamics · base de desarrollo</p><h1>Another Planet</h1></div>
    <span className={connected ? 'status' : 'status offline'}>{connected ? 'Conectado' : 'Reconectando…'}</span></header>
    <nav aria-label="Fases">{(Object.keys(PHASE_LABELS) as Phase[]).map(p => <span key={p} aria-current={p === phase ? 'step' : undefined}>{PHASE_LABELS[p]}</span>)}</nav>
    {error && <p className="error" role="alert">{error}</p>}
    {game && <div className="room-bar"><span>Sala <strong>{game.code}</strong> · Ronda {game.round}</span>
      {seconds !== null && <strong role="timer">{seconds} s</strong>}
      <button className="secondary" onClick={leave} disabled={!connected}>Salir de la sala</button></div>}
    <div className={game ? 'layout' : ''}><div><fieldset disabled={!connected}>
      {phase === 'stats' && <RoleSelect name={name} stats={stats} onName={setName} onStats={setStats} onContinue={() => setPrepared(true)} />}
      {phase === 'lobby' && <Lobby game={game} disabled={!connected}
        onBack={() => setPrepared(false)} onCreate={() => act(reply => socket.emit('room:create', entry, reply))}
        onJoin={code => act(reply => socket.emit('room:join', { ...entry, code }, reply))}
        onReady={() => act(reply => socket.emit('player:ready', !game?.self.ready, reply))}
        onStart={() => act(reply => socket.emit('game:start', reply))}
        onBots={() => act(reply => socket.emit('room:add-bots', reply))}
        onRemove={id => act(reply => socket.emit('room:remove-player', id, reply))} />}
      {game && phase === 'presentation' && <MinigamePresentation game={game} onReady={() => act(reply => socket.emit('phase:ready', { phaseId: game.phaseId }, reply))} />}
      {game && phase === 'cards' && <CardSelection game={game} onChoose={cardId => act(reply => socket.emit('card:choose', { phaseId: game.phaseId, cardId }, reply))} />}
      {game && phase === 'playing' && <PlayMinigame key={game.phaseId} game={game} onSubmit={score => act(reply => socket.emit('minigame:submit', { phaseId: game.phaseId, score }, reply))} />}
    </fieldset></div>{game && <Hud game={game} />}</div>
    <footer>Prototipo: cartas, puntuaciones y efectos provisionales. Ciclo de rondas sin eliminación.</footer>
  </main>;
}
