import type { CSSProperties } from 'react';
import { pipesDefinition } from '../../../../../shared/minigames/pipes';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { PipesEngine, type PipesData } from './PipesEngine';
import type { PipeKind } from './board';
import { Astronaut, LunarBackdrop, usePipesScene } from './PipesScene';
import './pipes.css';

const textures = [
  new URL('./assets/TUBERIAS_1.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_2.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_3.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_4.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_5.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_6.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_7.png', import.meta.url).href,
  new URL('./assets/TUBERIAS_8.png', import.meta.url).href,
];
const TEXTURE: Record<PipeKind, [number, number]> = { straight: [1, 2], elbow: [3, 4], cross: [5, 6], tee: [7, 8] };

function PipesView({ engine, snapshot }: MinigameViewProps<PipesData>) {
  const { board, wet, solved, nextBoardAt } = snapshot.data;
  const finished = snapshot.status === 'finished', connected = nextBoardAt !== null;
  const wetCells = new Set(wet), seconds = Math.ceil(snapshot.remainingMs / 1000);
  const { crew, onExit, onRestart } = usePipesScene();
  return <section className={`pipes-game${connected ? ' pipes-game--connected' : ''}${seconds <= 10 ? ' pipes-game--urgent' : ''}${finished ? ' pipes-game--finished' : ''}`} aria-label="Circuito de agua">
    <LunarBackdrop />
    <div className="pipes-screen">
    <header className="pipes-heading">
      <div className="pipes-title-text"><span className="pipes-kicker">Soporte vital / Agua</span><h2>Restablece el flujo</h2></div>
    </header>
    <aside className="pipes-counter" aria-label={`${solved} circuitos reparados`}><b>{String(solved).padStart(2, '0')}</b><span>Circuitos<br />reparados</span></aside>
    <aside className="pipes-timer-panel">
      <div className="pipes-clock" role="timer" aria-label={`${seconds} segundos restantes`}><b>{String(seconds).padStart(2, '0')}</b><span>Segundos<br />restantes</span></div>
      <div className="pipes-time-track"><span style={{ width: `${snapshot.remainingMs / engine.definition.durationMs * 100}%` }} /></div>
    </aside>
    <div className="pipes-console">
    <p className="pipes-instruction">Gira las piezas. Conecta la <strong>entrada azul</strong> con la <strong>salida dorada.</strong></p>
    <div className="pipes-machine" style={{ '--pipe-size': board.size, '--entry-row': board.entryRow, '--exit-row': board.exitRow } as CSSProperties}>
      <div className="pipes-port pipes-port--entry" aria-label={`Entrada, fila ${board.entryRow + 1}`}><span>Entrada</span><b>→</b></div>
      <div className="pipes-board-frame">
      <div className="pipes-board" role="group" aria-label={`Tablero de ${board.size} por ${board.size}`}>
        {board.cells.map((pipe, index) => {
          const isWet = wetCells.has(index), texture = TEXTURE[pipe.kind][isWet ? 1 : 0];
          return <button key={`${board.seed}-${index}`} type="button" className="pipes-cell"
            disabled={snapshot.status !== 'running' || connected}
            aria-label={`Girar tubería, fila ${Math.floor(index / board.size) + 1}, columna ${index % board.size + 1}${isWet ? ', con agua' : ''}`}
            onClick={() => (engine as PipesEngine).rotateAt(index)}>
            <img src={textures[texture - 1]} alt="" draggable={false}
              className={texture === 1 ? 'pipes-texture pipes-texture--opaque' : 'pipes-texture'} style={{ transform: `rotate(${pipe.rotation * 90}deg)` }} />
          </button>;
        })}
      </div>
      </div>
      <div className={`pipes-port pipes-port--exit${connected ? ' pipes-port--flowing' : ''}`} aria-label={`Salida, fila ${board.exitRow + 1}`}><b>→</b><span>Salida</span></div>
    </div>
    <div className="pipes-feedback" role="status" aria-live="polite">{finished ? `Tiempo agotado · ${solved} ${solved === 1 ? 'circuito reparado' : 'circuitos reparados'} · ${snapshot.score} puntos` : connected ? '¡Circuito reparado! +100 puntos' : '\u00a0'}</div>
    {(engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs > 0) && <p className="pipes-resource-note">El cansancio y el hambre ralentizan tus giros.</p>}
    </div>
    <aside className="pipes-crew" aria-label="Tripulación">
      {crew.map((member, index) => {
        return <div key={member.id} className={`pipes-astronaut pipes-astronaut--${index}`} title={`${member.name}${member.isSelf ? ' · Tú' : ''}`}>
          <Astronaut active={!!member.isSelf} />
          <span className="pipes-astronaut-score" aria-label={member.isSelf ? `${solved} circuitos reparados por ti` : `${member.name}: ${member.hasSubmitted ? 'terminado' : 'jugando'}`}>{member.isSelf ? solved : (member.hasSubmitted ? '✓' : '…')}</span>
          <span className="pipes-astronaut-name">{member.name}</span>
        </div>;
      })}
    </aside>
    {onExit && !finished && <button type="button" className="pipes-back" onClick={onExit}>← Laboratorio</button>}
    {finished && (onRestart || onExit) && <div className="pipes-end-actions">
      {onRestart && <button type="button" className="pipes-restart" onClick={onRestart}>Volver a jugar <span>↻</span></button>}
      {onExit && <button type="button" className="pipes-back" onClick={onExit}>Volver al laboratorio</button>}
    </div>}
    </div>
  </section>;
}
export default defineModule(pipesDefinition, (definition, context) => new PipesEngine(definition, undefined, context), PipesView);
