import type { CSSProperties } from 'react';
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

function SuitUpView({ engine, snapshot }: MinigameViewProps<SuitUpData>) {
  const { data, status, score, remainingMs, progress } = snapshot;
  const isRunning = status === 'running';
  const isFinished = status === 'finished';
  const step = data.currentStep;
  const qte = step.qte;

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const isUrgent = isRunning && seconds <= 8;

  // Manejo accesible de acciones táctiles y de ratón (soporta press y release para hold)
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
    // Para toques instantáneos, emitir release de inmediato para no quedar encallado
    engine.dispatch(actionId, 'release');
  };

  return (
    <div className={`suit-game ${isUrgent ? 'suit-game--urgent' : ''}`.trim()}>
      {/* --- CABECERA DE LA MISIÓN Y TELEMETRÍA --- */}
      <header className="suit-header">
        <div className="suit-header__title-block">
          <span className="suit-header__kicker">Esclusa de Descompresión · Misión NASA</span>
          <h2 className="suit-header__title">Ponerse el Traje Espacial</h2>
        </div>

        <div className="suit-telemetry-strip">
          <div className="suit-telemetry-item">
            <span className="suit-telemetry-item__label">Presión Traje</span>
            <span
              className={`suit-telemetry-item__value ${
                data.suitPressurePsi >= 4.0
                  ? 'suit-telemetry-item__value--green'
                  : data.suitPressurePsi >= 2.0
                    ? 'suit-telemetry-item__value--gold'
                    : ''
              }`}
            >
              {data.suitPressurePsi.toFixed(1)} PSI
            </span>
          </div>

          <div className="suit-telemetry-item">
            <span className="suit-telemetry-item__label">Oxígeno O₂</span>
            <span className="suit-telemetry-item__value">{data.oxygenPercent}%</span>
          </div>

          <div className="suit-telemetry-item">
            <span className="suit-telemetry-item__label">Blindaje</span>
            <span className="suit-telemetry-item__value">{data.suitIntegrityPercent}%</span>
          </div>

          <div className="suit-telemetry-item">
            <span className="suit-telemetry-item__label">Fase</span>
            <span className="suit-telemetry-item__value suit-telemetry-item__value--gold">
              {Math.min(data.currentStepIndex + 1, data.totalSteps)} / {data.totalSteps}
            </span>
          </div>
        </div>
      </header>

      {/* --- DISEÑO PRINCIPAL EN DOS COLUMNAS --- */}
      <div className="suit-main-layout">
        {/* Columna Izquierda: Visualizador del Traje Astronauta */}
        <section className="suit-astronaut-column" aria-label="Visualizador de traje espacial">
          <SuitAstronautSvg
            completedParts={data.completedParts}
            activePartKey={isRunning ? step.partKey : null}
            lastRating={data.lastRating}
            suitPressurePsi={data.suitPressurePsi}
          />

          {/* Lista de comprobación de sellado de partes */}
          <div className="suit-parts-checklist" role="list" aria-label="Comprobación de componentes">
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
        </section>

        {/* Columna Derecha: Arena interactiva de Quick Time Events */}
        <section className="suit-qte-arena" aria-live="polite">
          {!isFinished ? (
            <>
              <div className="suit-step-badge">{step.code}</div>
              <h3 className="suit-step-title">{step.name}</h3>
              <p className="suit-step-description">{step.description}</p>

              {/* Caja principal del QTE */}
              <div className="suit-qte-prompt-box">
                <p className="suit-qte-prompt-text">{step.prompt}</p>

                {/* 1. TIMING QTE WIDGET */}
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

                {/* 2. MASH QTE WIDGET */}
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

                {/* 3. SEQUENCE QTE WIDGET */}
                {qte.type === 'sequence' && (
                  <div className="suit-sequence-list" aria-label="Secuencia direccional de cierre">
                    {(qte as SequenceQteConfig).sequence.map((actionKey, idx) => {
                      const isDone = idx < data.sequenceIndex;
                      const isActive = idx === data.sequenceIndex;
                      const info = ACTION_LABELS[actionKey] ?? { icon: '?', key: actionKey };
                      return (
                        <div
                          key={idx}
                          className={`suit-seq-item ${
                            isDone
                              ? 'suit-seq-item--done'
                              : isActive
                                ? 'suit-seq-item--active'
                                : ''
                          }`}
                        >
                          <span>{isDone ? '✓' : info.icon}</span>
                          <span className="suit-seq-item__sub">{info.key.split('/')[0].trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. HOLD QTE WIDGET */}
                {qte.type === 'hold' && (
                  <div className="suit-hold-container" aria-label="Indicador de carga y sellado de presión">
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

                {/* Rating flotante y mensajes */}
                {data.lastRating && (
                  <div
                    className={`suit-rating-badge suit-rating--${data.lastRating.toLowerCase()}`}
                    role="status"
                  >
                    <span>{data.lastRatingMessage}</span>
                  </div>
                )}

                {data.combo >= 2 && (
                  <div className="suit-combo-badge" aria-label={`Racha de ${data.combo}`}>
                    ⚡ ¡Racha x{data.combo}!
                  </div>
                )}

                {data.warningMessage && (
                  <div className="suit-warning-text" role="alert">
                    ⚠️ {data.warningMessage}
                  </div>
                )}
              </div>

              {/* Botones de control interactivos (teclado, ratón o táctil) */}
              <div className="suit-controls-panel">
                <button
                  type="button"
                  className="suit-btn-primary"
                  disabled={!isRunning}
                  onMouseDown={handlePrimaryDown}
                  onMouseUp={handlePrimaryUp}
                  onTouchStart={handlePrimaryDown}
                  onTouchEnd={handlePrimaryUp}
                  aria-label="Acción principal / Sellar"
                >
                  <span>⎵</span>
                  <span>
                    {qte.type === 'hold'
                      ? data.isHolding
                        ? '¡SUELTA EN LA ZONA VERDE!'
                        : 'MANTÉN PULSADO [ESPACIO / CLIC]'
                      : qte.type === 'mash'
                        ? '¡PULSA RÁPIDO [ESPACIO / CLIC]!'
                        : 'SELLAR / ACCIÓN [ESPACIO]'}
                  </span>
                </button>

                {/* Cruceta direccional para pasos tipo sequence o direccionales */}
                <div className="suit-dpad" aria-label="Controles direccionales de apoyo">
                  <button
                    type="button"
                    className="suit-dpad-btn suit-dpad-btn--up"
                    disabled={!isRunning}
                    onClick={() => handleDirectionPress('action-up')}
                    aria-label="Válvula superior (W / Arriba)"
                  >
                    ▲ W
                  </button>
                  <button
                    type="button"
                    className="suit-dpad-btn suit-dpad-btn--left"
                    disabled={!isRunning}
                    onClick={() => handleDirectionPress('action-left')}
                    aria-label="Acople izquierdo (A / Izquierda)"
                  >
                    ◀ A
                  </button>
                  <button
                    type="button"
                    className="suit-dpad-btn suit-dpad-btn--down"
                    disabled={!isRunning}
                    onClick={() => handleDirectionPress('action-down')}
                    aria-label="Pestillo inferior (S / Abajo)"
                  >
                    ▼ S
                  </button>
                  <button
                    type="button"
                    className="suit-dpad-btn suit-dpad-btn--right"
                    disabled={!isRunning}
                    onClick={() => handleDirectionPress('action-right')}
                    aria-label="Acople derecho (D / Derecha)"
                  >
                    ▶ D
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Pantalla final de la carrera */
            <div className="suit-finish-screen">
              <h3 className="suit-finish-title">
                {snapshot.result?.completed
                  ? '¡TRAJE TOTALMENTE EQUIPADO Y HERMÉTICO!'
                  : 'TIEMPO LÍMITE ALCANZADO'}
              </h3>
              <p className="suit-finish-subtitle">
                {snapshot.result?.completed
                  ? 'Todos los sellos de seguridad están verificados. Autorización EVA concedida para salir a la superficie.'
                  : 'Presurización incompleta. Se ha guardado el progreso alcanzado.'}
              </p>

              <div className="suit-finish-stats">
                <div className="suit-finish-stat-box">
                  <span>Puntuación</span>
                  <b>{score} pts</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>Tiempo</span>
                  <b>{((snapshot.result?.elapsedMs ?? 0) / 1000).toFixed(2)} s</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>Progreso</span>
                  <b>{Math.round(progress * 100)}%</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>Mejor Racha</span>
                  <b>{data.bestCombo}x</b>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* --- PIE DE PÁGINA: DATO CIENTÍFICO REAL DE LA NASA --- */}
      <footer className="suit-lore-card">
        <strong>NASA STEM Trainer · {step.name}: </strong>
        <span>{step.lore}</span>
      </footer>
    </div>
  );
}

export default defineModule(
  suitUpDefinition,
  (definition: MinigameDefinition, context: MinigameContext) =>
    new SuitUpEngine(definition, undefined, context),
  SuitUpView,
);
