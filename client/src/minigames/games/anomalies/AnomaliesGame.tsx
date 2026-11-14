import { useCallback } from 'react';
import { anomaliesDefinition } from '../../../../../shared/minigames/anomalies';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { AnomaliesEngine, type AnomaliesData } from './AnomaliesEngine';
import { ANOMALY_COUNT } from './circuit';
import { CircuitDiagram } from './CircuitDiagram';
import './anomalies.css';

function AnomaliesView({ engine, snapshot }: MinigameViewProps<AnomaliesData>) {
  const { board, found, boardsCleared, mistakes, nextBoardAt, lockedUntil, lastMistake } = snapshot.data;
  const finished = snapshot.status === 'finished', cleared = nextBoardAt !== null;
  const locked = snapshot.elapsedMs < lockedUntil, seconds = Math.ceil(snapshot.remainingMs / 1000);
  const lockSeconds = Math.max(0, (lockedUntil - snapshot.elapsedMs) / 1000).toFixed(1);
  const inspect = useCallback((index: number) => (engine as AnomaliesEngine).inspect(index), [engine]);
  return <section className={`anomaly-game${cleared ? ' anomaly-game--cleared' : ''}${finished ? ' anomaly-game--finished' : ''}`} aria-label="Detección de anomalías en circuitos">
    <div className="anomaly-heading"><div><p className="anomaly-eyebrow">MANTENIMIENTO / SISTEMA ELÉCTRICO</p><h2>Encuentra las 3 diferencias</h2></div>
      <div className={`anomaly-clock${seconds <= 10 ? ' anomaly-clock--urgent' : ''}`} role="timer" aria-label={`${seconds} segundos restantes`}><b>{String(seconds).padStart(2, '0')}</b><span>SEGUNDOS</span></div>
    </div>
    <div className="anomaly-toolbar"><span>CIRCUITO <b>{String(boardsCleared + (cleared ? 0 : 1)).padStart(2, '0')}</b></span>
      <div className="anomaly-marks" aria-label={`${found.length} de 3 diferencias encontradas`}>{[0, 1, 2].map(i => <span key={i} className={i < found.length ? 'anomaly-mark anomaly-mark--found' : 'anomaly-mark'}>{i < found.length ? '✓' : '○'}</span>)}</div>
      <span><b>{snapshot.score}</b> PUNTOS</span>
    </div>
    <div className="anomaly-panels">
      {(['reference', 'inspected'] as const).map((side, index) => <section className="anomaly-panel" key={side} aria-label={index === 0 ? 'Panel de referencia' : 'Panel de inspección'}>
        <div className="anomaly-panel-label"><b>{index === 0 ? 'A' : 'B'}</b><span>{index === 0 ? 'CIRCUITO ORIGINAL' : 'CIRCUITO A REVISAR'}</span></div>
        <CircuitDiagram board={board} side={side} found={found} lastMistake={lastMistake}
          disabled={snapshot.status !== 'running' || cleared || locked} onInspect={inspect} />
      </section>)}
    </div>
    <div className="anomaly-feedback" role="status" aria-live="polite">{finished ? `Tiempo agotado · ${boardsCleared} circuitos completados · ${snapshot.score} puntos` : cleared ? '¡Las tres localizadas! +30 puntos. Preparando otro circuito…' : locked ? <span>Estas piezas son iguales. −10 puntos. <span aria-hidden="true">Bloqueo: {lockSeconds} s</span><span className="anomaly-sr-only">Selecciones bloqueadas durante 3 segundos.</span></span> : found.length > 0 ? `Bien visto. ${ANOMALY_COUNT - found.length} por encontrar.` : 'Pulsa las piezas que cambian entre los dos dibujos.'}</div>
    <div className="anomaly-footer"><span>{board.system}</span><span>{mistakes} errores · {boardsCleared} circuitos completados</span></div>
    {(engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs > 0) && <p className="anomaly-resource-note">El cansancio y el hambre ralentizan tus selecciones.</p>}
  </section>;
}
export default defineModule(anomaliesDefinition, (definition, context) => new AnomaliesEngine(definition, undefined, context), AnomaliesView);
