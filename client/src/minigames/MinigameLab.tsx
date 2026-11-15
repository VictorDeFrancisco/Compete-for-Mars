import { useState } from 'react';
import type { MinigameResult } from '../../../shared/minigames/types';
import { minigameModules } from './registry';
import MinigameInfo from './MinigameInfo';
import MinigameWrapper from './MinigameWrapper';
import { PipesSceneProvider } from './games/pipes/PipesScene';

/** Laboratorio local: no importa useGame, no conecta a Socket.io. */
export default function MinigameLab() {
  const initial = new URLSearchParams(location.search).get('minigame');
  const [id, setId] = useState(minigameModules.some(m => m.definition.id === initial) ? initial! : minigameModules[0].definition.id);
  const [attempt, setAttempt] = useState(0);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [result, setResult] = useState<MinigameResult | null>(null);
  const [resources, setResources] = useState({ energy: 10, food: 10, radiation: 0 });
  const module = minigameModules.find(m => m.definition.id === id)!;
  const definition = { ...module.definition, durationMs: duration ?? module.definition.durationMs };
  return <main><header><h1>Minigame Lab</h1><a href="/">Back to game</a></header>
    <p>Standalone local test without room, bots, or server. Resources are not saved here.</p>
    <label htmlFor="lab-game">Minigame</label><select id="lab-game" value={id} onChange={event => { setId(event.target.value); setDuration(null); setRunning(false); setResult(null); }}>
      {minigameModules.map(m => <option key={m.definition.id} value={m.definition.id}>{m.definition.title}</option>)}
    </select>
    <section className="panel"><MinigameInfo definition={definition} />
      <label>Test duration (seconds)<input type="number" min="1" max="600" disabled={running && !result}
        value={definition.durationMs / 1000} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value)) setDuration(Math.round(Math.max(1, Math.min(600, value)) * 1000)); }} /></label>
      <button onClick={() => { setAttempt(n => n + 1); setResult(null); setRunning(true); }}>Start / restart test</button>
      {(['energy', 'food'] as const).map(key => <label key={key}>{key === 'energy' ? 'Test energy' : 'Test food'}: {resources[key]}/10
        <input aria-label={key === 'energy' ? 'Test energy' : 'Test food'} type="range" min="0" max="10" value={resources[key]} disabled={running && !result}
          onChange={event => setResources(current => ({ ...current, [key]: Number(event.target.value) }))} />
      </label>)}
    </section>
    {running && <section className="panel"><PipesSceneProvider crew={[{ id: 'local', name: 'You', isSelf: true }]}
      onExit={() => setRunning(false)} onRestart={() => { setAttempt(n => n + 1); setResult(null); }}>
      <MinigameWrapper key={`${id}-${attempt}`} definition={definition} context={{ resources }} onResult={setResult} />
    </PipesSceneProvider></section>}
    {result && <section className="panel"><h2>Result sent to server</h2><pre>{JSON.stringify(result, null, 2)}</pre></section>}
  </main>;
}
