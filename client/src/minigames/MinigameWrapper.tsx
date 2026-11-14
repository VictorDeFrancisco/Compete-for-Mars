import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MinigameDefinition, MinigameResult } from '../../../shared/minigames/types';
import { getMinigameModule } from './registry';
import type { MinigameContext } from '../../../shared/minigames/context';

export interface MinigameWrapperProps {
  definition: MinigameDefinition;
  context: MinigameContext;
  initialElapsedMs?: number;
  onResult: (result: MinigameResult) => void;
  onScoreChange?: (score: number) => void;
  showChrome?: boolean;
}
export default function MinigameWrapper(props: MinigameWrapperProps) {
  const module = getMinigameModule(props.definition.id);
  if (!module) return <p role="alert">No está registrado el minijuego «{props.definition.id}».</p>;
  return <Runner {...props} module={module} />;
}
function Runner({ definition, context, initialElapsedMs = 0, onResult, onScoreChange, showChrome = true, module }: MinigameWrapperProps & { module: NonNullable<ReturnType<typeof getMinigameModule>> }) {
  // El padre debe cambiar key cuando comienza un intento nuevo.
  const [run] = useState(() => module.createRun(definition, context));
  const { engine } = run;
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const callback = useRef(onResult); callback.current = onResult;
  const scoreCallback = useRef(onScoreChange); scoreCallback.current = onScoreChange;
  const lastReportedScore = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  const lifecycle = useRef(0);
  useEffect(() => {
    if (!scoreCallback.current) return;
    if (lastReportedScore.current !== snapshot.score) {
      lastReportedScore.current = snapshot.score;
      scoreCallback.current(snapshot.score);
    }
  }, [snapshot.score]);
  useEffect(() => {
    const generation = ++lifecycle.current;
    engine.start(initialElapsedMs); container.current?.focus();
    let frame: number;
    const loop = () => {
      engine.tick();
      if (engine.getSnapshot().status === 'running') frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    // Los RAF se pausan en pestañas ocultas: este intervalo permite cerrar y enviar igualmente.
    const timer = setInterval(() => engine.tick(), 100);
    const unsubscribe = engine.subscribe(() => {
      const result = engine.getResult();
      if (result && !sent.current) { sent.current = true; callback.current({ ...result }); }
    });
    const initialResult = engine.getResult();
    if (initialResult && !sent.current) { sent.current = true; callback.current({ ...initialResult }); }
    return () => {
      cancelAnimationFrame(frame); clearInterval(timer); unsubscribe();
      // StrictMode vuelve a ejecutar el efecto sin crear otra instancia.
      queueMicrotask(() => { if (lifecycle.current === generation) engine.dispose(); });
    };
  }, [engine]);
  return <div ref={container} tabIndex={0} aria-label="Minigame area" className="minigame-area"
    onKeyDown={event => {
      if (event.repeat) return;
      const actions = engine.controls.forKey(event.code);
      if (actions.length) { event.preventDefault(); actions.forEach(action => engine.dispatch(action, 'press')); }
    }}
    onKeyUp={event => { engine.controls.forKey(event.code).forEach(action => engine.dispatch(action, 'release')); }}
    onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) engine.controls.getActions().forEach(action => engine.dispatch(action.id, 'release'));
    }}>
    {showChrome && definition.id !== 'pipes' && <><p role="timer">{Math.ceil(snapshot.remainingMs / 1000)} s</p>
    <p>Energy: {engine.context.resources.energy}/10 · Food: {engine.context.resources.food}/10</p>
    <p className="score">{snapshot.score} / {definition.maxScore}</p></>}
    {run.render()}
    {showChrome && definition.id !== 'pipes' && <><p>Progress: {Math.round(snapshot.progress * 100)} %</p>
    {snapshot.result && <p role="status">Run finished: {snapshot.result.reason} · {(snapshot.result.elapsedMs / 1000).toFixed(2)} s</p>}</>}
  </div>;
}
