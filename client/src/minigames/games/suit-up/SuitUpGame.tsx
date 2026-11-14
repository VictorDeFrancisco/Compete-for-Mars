import type { MinigameContext } from '../../../../../shared/minigames/context';
import { suitUpDefinition } from '../../../../../shared/minigames/suitUp';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { SuitAstronautSvg } from './SuitAstronautSvg';
import {
  ACTION_LABELS,
  type HoldQteConfig,
  type MashQteConfig,
  type SequenceQteConfig,
  type TimingQteConfig,
} from './suitStepsConfig';
import { SuitUpEngine, type SuitUpData } from './SuitUpEngine';
import './suitUp.css';

export { SuitUpEngine } from './SuitUpEngine';

const DIRECTION_KEYS = [
  { id: 'action-up', arrow: '↑', key: 'UP', mod: 'up' },
  { id: 'action-left', arrow: '←', key: 'LEFT', mod: 'left' },
  { id: 'action-down', arrow: '↓', key: 'DOWN', mod: 'down' },
  { id: 'action-right', arrow: '→', key: 'RIGHT', mod: 'right' },
] as const;

function SuitUpView({ engine, snapshot }: MinigameViewProps<SuitUpData>) {
  const { data, status, score, progress } = snapshot;
  const isRunning = status === 'running';
  const isFinished = status === 'finished';
  const step = data.currentStep;
  const qte = step.qte;

  const activeSeqTarget =
    qte.type === 'sequence'
      ? (qte as SequenceQteConfig).sequence[data.sequenceIndex] ?? null
      : null;

  const handlePrimaryDown = () => {
    if (!isRunning) return;
    engine.dispatch('action-primary', 'press');
  };

  const handlePrimaryUp = () => {
    if (!isRunning) return;
    engine.dispatch('action-primary', 'release');
  };

  const handleDirectionPress = (actionId: string) => {
    if (!isRunning) return;
    engine.dispatch(actionId, 'press');
    engine.dispatch(actionId, 'release');
  };

  return (
    <div className="suit-game">
      <header className="suit-header">
        <div className="suit-header__badges">
          <span className="suit-header__phase">
            STEP {Math.min(data.currentStepIndex + 1, data.totalSteps)} / {data.totalSteps}
          </span>
          <span className="suit-header__code">{step.code}</span>
        </div>

        <div className="suit-telemetry-strip">
          <div className="suit-telemetry-pill">
            <span>PSI</span>
            <b>{data.suitPressurePsi.toFixed(1)}</b>
          </div>
          <div className="suit-telemetry-pill">
            <span>O₂</span>
            <b>{data.oxygenPercent}%</b>
          </div>
          <div className="suit-telemetry-pill suit-telemetry-pill--score">
            <span>SCORE</span>
            <b>{score} PTS</b>
          </div>
        </div>
      </header>

      <div className="suit-main-layout">
        <aside className="suit-astronaut-column" aria-label="Visualizador de traje espacial">
          <SuitAstronautSvg
            completedParts={data.completedParts}
            activePartKey={isRunning ? step.partKey : null}
            lastRating={data.lastRating}
            suitPressurePsi={data.suitPressurePsi}
          />

          <div className="suit-parts-checklist" role="list" aria-label="Componentes del traje">
            {engine instanceof SuitUpEngine &&
              engine.steps.map((s, idx) => {
                const isDone = data.completedStepIds.includes(s.id);
                const isActive = isRunning && data.currentStepIndex === idx;
                return (
                  <div
                    key={s.id}
                    role="listitem"
                    className={`suit-part-pill ${
                      isDone ? 'suit-part-pill--done' : isActive ? 'suit-part-pill--active' : ''
                    }`}
                  >
                    <span>{isDone ? '✓' : isActive ? '●' : '○'}</span>
                    <span>{s.code}</span>
                  </div>
                );
              })}
          </div>
        </aside>

        <section className="suit-qte-arena" aria-live="polite">
          {!isFinished ? (
            <>
              <div className="suit-step-head">
                <h3 className="suit-step-title">{step.name}</h3>
                <p className="suit-step-description">{step.prompt}</p>
              </div>

              <div className="suit-qte-prompt-box">
                {qte.type === 'timing' && (
                  <div className="suit-timing-track-wrap" aria-label="Pista de sincronización temporal">
                    <div
                      className="suit-timing-sweet-spot"
                      style={{
                        left: `${(qte as TimingQteConfig).sweetSpotStart * 100}%`,
                        width: `${
                          ((qte as TimingQteConfig).sweetSpotEnd -
                            (qte as TimingQteConfig).sweetSpotStart) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="suit-timing-perfect-line"
                      style={{
                        left: `${
                          (((qte as TimingQteConfig).sweetSpotStart +
                            (qte as TimingQteConfig).sweetSpotEnd) /
                            2) *
                          100
                        }%`,
                      }}
                    />
                    <div
                      className="suit-timing-needle"
                      style={{ left: `${data.qteProgress * 100}%` }}
                    />
                  </div>
                )}

                {qte.type === 'mash' && (
                  <div className="suit-mash-container" aria-label="Medidor de presurización rápida">
                    <div className="suit-mash-track">
                      <div
                        className="suit-mash-fill"
                        style={{ width: `${data.qteProgress * 100}%` }}
                      />
                      <span className="suit-mash-counter-text">
                        {data.mashCount} / {(qte as MashQteConfig).targetCount} PULSACIONES
                      </span>
                    </div>
                  </div>
                )}

                {qte.type === 'sequence' && (
                  <div className="suit-sequence-list" aria-label="Secuencia direccional">
                    {(qte as SequenceQteConfig).sequence.map((actionKey, idx) => {
                      const isDone = idx < data.sequenceIndex;
                      const isActive = idx === data.sequenceIndex;
                      const info = ACTION_LABELS[actionKey] ?? { icon: '?', key: actionKey };
                      return (
                        <div
                          key={idx}
                          className={`suit-seq-key ${
                            isDone
                              ? 'suit-seq-key--done'
                              : isActive
                                ? 'suit-seq-key--active'
                                : ''
                          }`}
                        >
                          <span className="suit-seq-key__glyph">{isDone ? '✓' : info.icon}</span>
                          <span className="suit-seq-key__sub">{info.key.split('/')[0].trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {qte.type === 'hold' && (
                  <div className="suit-hold-container" aria-label="Indicador de carga y sellado">
                    <div className="suit-hold-bar">
                      <div
                        className="suit-hold-target-zone"
                        style={{
                          left: `${(qte as HoldQteConfig).targetMin * 100}%`,
                          width: `${((qte as HoldQteConfig).targetMax - (qte as HoldQteConfig).targetMin) * 100}%`,
                        }}
                      />
                      <div
                        className="suit-hold-perfect-zone"
                        style={{
                          left: `${(qte as HoldQteConfig).perfectMin * 100}%`,
                          width: `${((qte as HoldQteConfig).perfectMax - (qte as HoldQteConfig).perfectMin) * 100}%`,
                        }}
                      />
                      <div
                        className="suit-hold-meter"
                        style={{ width: `${Math.min(100, data.qteProgress * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="suit-status-row">
                  {data.lastRating && (
                    <span className={`suit-rating-badge suit-rating--${data.lastRating.toLowerCase()}`} role="status">
                      {data.lastRatingMessage}
                    </span>
                  )}
                  {data.combo >= 2 && (
                    <span className="suit-combo-badge">RACHA x{data.combo}</span>
                  )}
                  {data.warningMessage && (
                    <span className="suit-warning-text" role="alert">
                      {data.warningMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Teclas físicas grandes Retro-NASA */}
              <div className="suit-controls-deck">
                <button
                  type="button"
                  className={`suit-key-space${qte.type !== 'sequence' ? ' suit-key-space--highlight' : ''}`}
                  disabled={!isRunning}
                  onMouseDown={handlePrimaryDown}
                  onMouseUp={handlePrimaryUp}
                  onTouchStart={handlePrimaryDown}
                  onTouchEnd={handlePrimaryUp}
                  aria-label="Acción principal Espacio"
                >
                  <kbd className="suit-keycap-tag">SPACE</kbd>
                  <span>
                    {qte.type === 'hold'
                      ? data.isHolding
                        ? 'SUELTA EN LA ZONA VERDE'
                        : 'MANTÉN PULSADO'
                      : qte.type === 'mash'
                        ? '¡PULSA RÁPIDO!'
                        : qte.type === 'sequence'
                          ? 'SOLO FLECHAS ARRIBA'
                          : 'SELLAR AHORA'}
                  </span>
                </button>

                <div className="suit-dpad" aria-label="Teclas direccionales grandes">
                  {DIRECTION_KEYS.map(dir => {
                    const isTarget = activeSeqTarget === dir.id;
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        className={`suit-key-arrow suit-key-arrow--${dir.mod}${isTarget ? ' suit-key-arrow--target' : ''}`}
                        disabled={!isRunning}
                        onClick={() => handleDirectionPress(dir.id)}
                        aria-label={`Flecha ${dir.key}`}
                      >
                        <span className="suit-key-arrow__glyph">{dir.arrow}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="suit-finish-screen">
              <h3 className="suit-finish-title">
                {snapshot.result?.completed
                  ? 'TRAJE TOTALMENTE HERMÉTICO'
                  : 'TIEMPO AGOTADO'}
              </h3>
              <p className="suit-finish-subtitle">
                {snapshot.result?.completed
                  ? 'Todos los sellos verificados. Autorización EVA concedida.'
                  : 'Presurización parcial registrada en telemetría.'}
              </p>

              <div className="suit-finish-stats">
                <div className="suit-finish-stat-box">
                  <span>SCORE</span>
                  <b>{score} PTS</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>TIEMPO</span>
                  <b>{((snapshot.result?.elapsedMs ?? 0) / 1000).toFixed(2)}s</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>PROGRESO</span>
                  <b>{Math.round(progress * 100)}%</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>RACHA</span>
                  <b>{data.bestCombo}x</b>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default defineModule(
  suitUpDefinition,
  (definition: MinigameDefinition, context: MinigameContext) =>
    new SuitUpEngine(definition, undefined, context),
  SuitUpView,
);
