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
const TEXTURE: Record<PipeKind, [number, number]> = {
  straight: [1, 2],
  elbow: [3, 4],
  cross: [5, 6],
  tee: [7, 8],
};

function PipesView({ engine, snapshot }: MinigameViewProps<PipesData>) {
  const { board, wet, solved, nextBoardAt } = snapshot.data;
  const finished = snapshot.status === 'finished';
  const connected = nextBoardAt !== null;
  const wetCells = new Set(wet);
  const seconds = Math.ceil(snapshot.remainingMs / 1000);
  const { crew, onExit, onRestart } = usePipesScene();

  return (
    <section
      className={`pipes-game${connected ? ' pipes-game--connected' : ''}${seconds <= 10 ? ' pipes-game--urgent' : ''}${finished ? ' pipes-game--finished' : ''}`}
      aria-label="Circuito de agua"
    >
      <LunarBackdrop />
      <div className="pipes-screen">
        <header className="pipes-topbar">
          <div className="pipes-plaque pipes-counter" aria-label={`${solved} circuitos reparados, ${snapshot.score} puntos`}>
            <b>{snapshot.score}</b>
            <span>
              PTS<br />
              {solved} {solved === 1 ? 'circuito' : 'circuitos'}
            </span>
          </div>

          <div className="pipes-title-text">
            <span className="pipes-kicker">LIFE SUPPORT // WATER GRID</span>
            <h2>RESTABLECE EL FLUJO</h2>
          </div>

          <div className="pipes-plaque pipes-timer-panel">
            <div className="pipes-clock" role="timer" aria-label={`${seconds} segundos restantes`}>
              <b>{String(seconds).padStart(2, '0')}s</b>
              <span>TIEMPO</span>
            </div>
            <div className="pipes-time-track">
              <span style={{ width: `${(snapshot.remainingMs / engine.definition.durationMs) * 100}%` }} />
            </div>
          </div>
        </header>

        <div className="pipes-workspace">
          <div className="pipes-console">
            <p className="pipes-instruction">
              Haz clic para girar las tuberías. Conecta la <strong>ENTRADA AZUL</strong> con la <strong>SALIDA DORADA</strong>.
            </p>
            <div
              className="pipes-machine"
              style={{
                '--pipe-size': board.size,
                '--entry-row': board.entryRow,
                '--exit-row': board.exitRow,
              } as CSSProperties}
            >
              <div className="pipes-port pipes-port--entry" aria-label={`Entrada, fila ${board.entryRow + 1}`}>
                <span>IN</span>
                <b>→</b>
              </div>
              <div className="pipes-board-frame">
                <div className="pipes-board" role="group" aria-label={`Tablero de ${board.size} por ${board.size}`}>
                  {board.cells.map((pipe, index) => {
                    const isWet = wetCells.has(index);
                    const texture = TEXTURE[pipe.kind][isWet ? 1 : 0];
                    return (
                      <button
                        key={`${board.seed}-${index}`}
                        type="button"
                        className="pipes-cell"
                        disabled={snapshot.status !== 'running' || connected}
                        aria-label={`Girar tubería, fila ${Math.floor(index / board.size) + 1}, columna ${(index % board.size) + 1}${isWet ? ', con agua' : ''}`}
                        onClick={() => (engine as PipesEngine).rotateAt(index)}
                      >
                        <img
                          src={textures[texture - 1]}
                          alt=""
                          draggable={false}
                          className={texture === 1 ? 'pipes-texture pipes-texture--opaque' : 'pipes-texture'}
                          style={{ transform: `rotate(${pipe.rotation * 90}deg)` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className={`pipes-port pipes-port--exit${connected ? ' pipes-port--flowing' : ''}`}
                aria-label={`Salida, fila ${board.exitRow + 1}`}
              >
                <b>→</b>
                <span>OUT</span>
              </div>
            </div>
            <div className="pipes-feedback" role="status" aria-live="polite">
              {finished
                ? `TIEMPO AGOTADO · ${solved} ${solved === 1 ? 'CIRCUITO' : 'CIRCUITOS'} · ${snapshot.score} PTS`
                : connected
                  ? '¡CIRCUITO CONECTADO! +100 PTS'
                  : '\u00a0'}
            </div>
            {engine.modifiers.actionCooldownMs + engine.modifiers.reactionDelayMs > 0 && (
              <p className="pipes-resource-note">Fatiga y hambre activos: giro ralentizado.</p>
            )}
          </div>

          <aside className="pipes-crew" aria-label="Puntuación en tiempo real">
            <div className="pipes-crew__heading">CREW LIVE SCORE</div>
            {[...crew]
              .map((member, index) => ({
                member,
                index,
                livePoints: member.isSelf ? snapshot.score : (member.liveScore ?? 0),
              }))
              .sort((a, b) => b.livePoints - a.livePoints)
              .map(({ member, index, livePoints }) => (
                <div
                  key={member.id}
                  className={`pipes-astronaut pipes-astronaut--${index}${member.isSelf ? ' pipes-astronaut--self' : ''}`}
                  title={`${member.name}${member.isSelf ? ' · Tú' : ''}`}
                >
                  <div className="pipes-astronaut__avatar">
                    <Astronaut active={!!member.isSelf} />
                  </div>
                  <div className="pipes-astronaut__info">
                    <span className="pipes-astronaut-name">
                      {member.name}
                      {member.isSelf ? ' (YOU)' : ''}
                    </span>
                    <span className="pipes-astronaut-meta">
                      {member.isSelf
                        ? finished ? 'DONE' : 'PLAYING'
                        : member.hasSubmitted ? 'DONE' : 'LIVE'}
                    </span>
                  </div>
                  <span className="pipes-astronaut-score">{livePoints} PTS</span>
                </div>
              ))}
          </aside>
        </div>

        {onExit && !finished && (
          <button type="button" className="pipes-back" onClick={onExit}>
            ← Laboratorio
          </button>
        )}
        {finished && (onRestart || onExit) && (
          <div className="pipes-end-actions">
            {onRestart && (
              <button type="button" className="pipes-restart" onClick={onRestart}>
                Volver a jugar <span>↻</span>
              </button>
            )}
            {onExit && (
              <button type="button" className="pipes-back" onClick={onExit}>
                Volver al laboratorio
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default defineModule(
  pipesDefinition,
  (definition, context) => new PipesEngine(definition, undefined, context),
  PipesView,
);
