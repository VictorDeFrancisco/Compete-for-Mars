import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MinigameDefinition, MinigameResult } from '../../../shared/minigames/types';
import { getMinigameModule } from './registry';
import type { MinigameContext } from '../../../shared/minigames/context';

export interface MinigameWrapperProps {
  definition: MinigameDefinition;
  context: MinigameContext;
  initialElapsedMs?: number;
  paused?: boolean;
  onRemainingChange?: (remainingMs: number) => void;
  onResult: (result: MinigameResult) => void;
  onScoreChange?: (score: number) => void;
  showChrome?: boolean;
}
export default function MinigameWrapper(props: MinigameWrapperProps) {
  const module = getMinigameModule(props.definition.id);
  if (!module) return <p role="alert">No está registrado el minijuego «{props.definition.id}».</p>;
  return <Runner {...props} module={module} />;
}
function Runner({
  definition,
  context,
  initialElapsedMs = 0,
  paused = false,
  onRemainingChange,
  onResult,
  onScoreChange,
  showChrome = true,
  module,
}: MinigameWrapperProps & { module: NonNullable<ReturnType<typeof getMinigameModule>> }) {
  // El padre debe cambiar key cuando comienza un intento nuevo.
  const [run] = useState(() => module.createRun(definition, context));
  const { engine } = run;
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const callback = useRef(onResult); callback.current = onResult;
  const scoreCallback = useRef(onScoreChange); scoreCallback.current = onScoreChange;
  const remainingCallback = useRef(onRemainingChange); remainingCallback.current = onRemainingChange;
  const initialElapsedRef = useRef(initialElapsedMs); initialElapsedRef.current = initialElapsedMs;
  const lastReportedScore = useRef<number | null>(null);
  const lastReportedSec = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  const lifecycle = useRef(0);
  const engineStarted = useRef(false);

  useEffect(() => {
    if (!scoreCallback.current) return;
    if (lastReportedScore.current !== snapshot.score) {
      lastReportedScore.current = snapshot.score;
      scoreCallback.current(snapshot.score);
    }
  }, [snapshot.score]);

  useEffect(() => {
    if (!remainingCallback.current) return;
    const sec = Math.max(0, Math.ceil(snapshot.remainingMs / 1000));
    if (lastReportedSec.current !== sec) {
      lastReportedSec.current = sec;
      remainingCallback.current(snapshot.remainingMs);
    }
  }, [snapshot.remainingMs]);

  useEffect(() => {
    const generation = ++lifecycle.current;
    return () => {
      // StrictMode vuelve a ejecutar el efecto sin crear otra instancia.
      queueMicrotask(() => { if (lifecycle.current === generation) engine.dispose(); });
    };
  }, [engine]);

  useEffect(() => {
    if (paused) return;
    if (!engineStarted.current) {
      engineStarted.current = true;
      engine.start(initialElapsedRef.current);
      container.current?.focus();
    }
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

    const normalizeCode = (code: string) => {
      if (code.startsWith('Numpad') && code.length === 7 && code[6] >= '0' && code[6] <= '9') {
        return `Digit${code[6]}`;
      }
      if (code === 'NumpadEnter') return 'Enter';
      return code;
    };

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };

    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) return;
      const actions = engine.controls.forKey(normalizeCode(event.code));
      if (actions.length) {
        event.preventDefault();
        actions.forEach(action => engine.dispatch(action, 'press'));
      }
    };

    const onWindowKeyUp = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      engine.controls.forKey(normalizeCode(event.code)).forEach(action => engine.dispatch(action, 'release'));
    };

    const onWindowBlur = () => {
      engine.controls.getActions().forEach(action => engine.dispatch(action.id, 'release'));
    };

    window.addEventListener('keydown', onWindowKeyDown);
    window.addEventListener('keyup', onWindowKeyUp);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener('keydown', onWindowKeyDown);
      window.removeEventListener('keyup', onWindowKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [engine, paused]);

  return <div ref={container} tabIndex={0} aria-label="Minigame area" className="minigame-area">
    {showChrome && definition.id !== 'pipes' && <><p role="timer">{Math.ceil(snapshot.remainingMs / 1000)} s</p>
    <p>Energy: {engine.context.resources.energy}/10 · Food: {engine.context.resources.food}/10</p>
    <p className="score">{snapshot.score} / {definition.maxScore}</p></>}
    {run.render()}
    {showChrome && definition.id !== 'pipes' && <><p>Progress: {Math.round(snapshot.progress * 100)} %</p>
    {snapshot.result && <p role="status">Run finished: {snapshot.result.reason} · {(snapshot.result.elapsedMs / 1000).toFixed(2)} s</p>}</>}
  </div>;
}
