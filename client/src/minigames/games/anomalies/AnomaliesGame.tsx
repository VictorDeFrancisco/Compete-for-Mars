import { useCallback, useEffect, useRef } from 'react';
import { anomaliesDefinition } from '../../../../../shared/minigames/anomalies';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { playSfxError, playSfxPerfect, playSfxSuccess } from '../../../utils/uiAudio';
import { AnomaliesEngine, type AnomaliesData } from './AnomaliesEngine';
import { ANOMALY_COUNT } from './circuit';
import { CircuitDiagram } from './CircuitDiagram';
import './anomalies.css';

function AnomaliesView({ engine, snapshot }: MinigameViewProps<AnomaliesData>) {
  const { board, found, boardsCleared, mistakes, nextBoardAt, lockedUntil, lastMistake } = snapshot.data;
  const finished = snapshot.status === 'finished', cleared = nextBoardAt !== null;
  const locked = snapshot.elapsedMs < lockedUntil;
  const lockSeconds = Math.max(0, (lockedUntil - snapshot.elapsedMs) / 1000).toFixed(1);
  const inspect = useCallback((index: number) => (engine as AnomaliesEngine).inspect(index), [engine]);
  const prevFoundRef = useRef(found.length);
  const prevClearedRef = useRef(boardsCleared);
  const prevMistakesRef = useRef(mistakes);

  useEffect(() => {
    if (boardsCleared > prevClearedRef.current) {
      playSfxPerfect();
    } else if (found.length > prevFoundRef.current) {
      playSfxSuccess();
    }
    if (mistakes > prevMistakesRef.current) {
      playSfxError();
    }
    prevFoundRef.current = found.length;
    prevClearedRef.current = boardsCleared;
    prevMistakesRef.current = mistakes;
  }, [found.length, boardsCleared, mistakes]);
  return <section className={`anomaly-game${cleared ? ' anomaly-game--cleared' : ''}${finished ? ' anomaly-game--finished' : ''}`} aria-label="Circuit anomaly detection">
    <div className="anomaly-heading"><div><p className="anomaly-eyebrow">MAINTENANCE / ELECTRICAL SYSTEM</p><h2>Spot the 3 differences</h2></div>
    </div>
    <div className="anomaly-toolbar"><span>CIRCUIT <b>{String(boardsCleared + (cleared ? 0 : 1)).padStart(2, '0')}</b></span>
      <div className="anomaly-marks" aria-label={`${found.length} of 3 differences found`}>{[0, 1, 2].map(i => <span key={i} className={i < found.length ? 'anomaly-mark anomaly-mark--found' : 'anomaly-mark'}>{i < found.length ? '✓' : '○'}</span>)}</div>
      <span className="anomaly-score"><b>{snapshot.score}</b> PTS</span>
    </div>
    <div className="anomaly-panels">
      {(['reference', 'inspected'] as const).map((side, index) => <section className="anomaly-panel" key={side} aria-label={index === 0 ? 'Reference panel' : 'Inspection panel'}>
        <div className="anomaly-panel-label"><b>{index === 0 ? 'A' : 'B'}</b><span>{index === 0 ? 'REFERENCE CIRCUIT' : 'CIRCUIT UNDER INSPECTION'}</span></div>
        <CircuitDiagram board={board} side={side} found={found} lastMistake={lastMistake}
          disabled={snapshot.status !== 'running' || cleared || locked} onInspect={inspect} />
      </section>)}
    </div>
    <div className="anomaly-feedback" role="status" aria-live="polite">{finished ? `Time up · ${boardsCleared} circuits cleared · ${snapshot.score} pts` : cleared ? 'All three found! +30 pts. Loading next circuit…' : locked ? <span>Those components match. −10 pts. <span aria-hidden="true">Lockout: {lockSeconds} s</span><span className="anomaly-sr-only">Selection locked for 3 seconds.</span></span> : found.length > 0 ? `Good eye. ${ANOMALY_COUNT - found.length} remaining.` : 'Click the parts that differ between the two schematics.'}</div>
    <div className="anomaly-footer"><span>{board.system}</span><span>{mistakes} mistakes · {boardsCleared} circuits cleared</span></div>
    {(engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs > 0) && <p className="anomaly-resource-note">Fatigue and hunger slow down your inspections.</p>}
  </section>;
}
export default defineModule(anomaliesDefinition, (definition, context) => new AnomaliesEngine(definition, undefined, context), AnomaliesView);
