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

const QTE_MODE_META: Record<
  'timing' | 'mash' | 'sequence' | 'hold',
  { label: string; colorClass: string }
> = {
  timing: { label: 'PRECISION', colorClass: 'suit-qte-mode--timing' },
  mash: { label: 'PUMP', colorClass: 'suit-qte-mode--mash' },
  sequence: { label: 'SEQUENCE', colorClass: 'suit-qte-mode--sequence' },
  hold: { label: 'HOLD', colorClass: 'suit-qte-mode--hold' },
};

function SuitUpView({ engine, snapshot }: MinigameViewProps<SuitUpData>) {
  const { data, status, score, progress } = snapshot;
  const isRunning = status === 'running';
  const isFinished = status === 'finished';
  const step = data.currentStep;
  const qte = step.qte;
  const modeMeta = QTE_MODE_META[qte.type];
  const psiPercent = Math.max(0, Math.min(100, (data.suitPressurePsi / 4.3) * 100));
  const o2Percent = Math.max(0, Math.min(100, data.oxygenPercent));

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
        </div>

        <ol className="suit-step-pipeline" aria-label="Spacesuit assembly sequence">
          {engine instanceof SuitUpEngine &&
            engine.steps.map((s, idx) => {
              const isDone = data.completedStepIds.includes(s.id);
              const isActive = isRunning && data.currentStepIndex === idx;
              return (
                <li
                  key={s.id}
                  title={s.name}
                  className={`suit-pipe-node ${
                    isDone ? 'suit-pipe-node--done' : isActive ? 'suit-pipe-node--active' : ''
                  }`}
                >
                  <span className="suit-pipe-node__idx">
                    {isDone ? '✓' : idx + 1}
                  </span>
                </li>
              );
            })}
        </ol>

        <div className="suit-telemetry-strip">
          <div className="suit-telemetry-pill suit-telemetry-pill--score">
            <b>{score} PTS</b>
          </div>
        </div>
      </header>

      <div className="suit-main-layout">
        <aside className="suit-astronaut-column" aria-label="Spacesuit visualizer">
          <div className="suit-astronaut-stage">
            <SuitAstronautSvg
              completedParts={data.completedParts}
              activePartKey={isRunning ? step.partKey : null}
              lastRating={data.lastRating}
              suitPressurePsi={data.suitPressurePsi}
            />
          </div>

          <div className="suit-gauges" aria-label="Suit telemetry">
            <div className="suit-gauge">
              <div className="suit-gauge__row">
                <span>PRESSURE</span>
                <b>{data.suitPressurePsi.toFixed(1)} PSI</b>
              </div>
              <div className="suit-gauge__track">
                <div
                  className="suit-gauge__fill suit-gauge__fill--psi"
                  style={{ width: `${psiPercent}%` }}
                />
              </div>
            </div>

            <div className="suit-gauge">
              <div className="suit-gauge__row">
                <span>OXYGEN</span>
                <b>{data.oxygenPercent}%</b>
              </div>
              <div className="suit-gauge__track">
                <div
                  className="suit-gauge__fill suit-gauge__fill--o2"
                  style={{ width: `${o2Percent}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="suit-qte-arena" aria-live="polite">
          {!isFinished ? (
            <>
              <div className="suit-step-head">
                <span className={`suit-qte-mode ${modeMeta.colorClass}`}>
                  {modeMeta.label}
                </span>
                <h3 className="suit-step-title">{step.name}</h3>
              </div>

              <div className="suit-qte-prompt-box">
                {qte.type === 'timing' && (
                  <div className="suit-timing-track-wrap" aria-label="Timing synchronization track">
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
                  <div className="suit-mash-container" aria-label="Rapid pressurization gauge">
                    <div className="suit-mash-track">
                      <div
                        className="suit-mash-fill"
                        style={{ width: `${data.qteProgress * 100}%` }}
                      />
                      <span className="suit-mash-counter-text">
                        {(data.mashCount >= (qte as MashQteConfig).targetCount
                          ? (qte as MashQteConfig).targetCount
                          : Math.min(
                              (qte as MashQteConfig).targetCount - 1,
                              Math.round(data.mashCount),
                            ))}{' '}
                        / {(qte as MashQteConfig).targetCount} PUMPS
                      </span>
                    </div>
                  </div>
                )}

                {qte.type === 'sequence' && (
                  <div className="suit-sequence-list" aria-label="Directional sequence">
                    {(qte as SequenceQteConfig).sequence.map((actionKey, idx) => {
                      const isDone = idx < data.sequenceIndex;
                      const isActive = idx === data.sequenceIndex;
                      const isSpace = actionKey === 'action-primary';
                      const info = ACTION_LABELS[actionKey] ?? { icon: '?', key: actionKey };
                      return (
                        <div
                          key={idx}
                          className={`suit-seq-key${isSpace ? ' suit-seq-key--space' : ''} ${
                            isDone
                              ? 'suit-seq-key--done'
                              : isActive
                                ? 'suit-seq-key--active'
                                : ''
                          }`}
                        >
                          <span className="suit-seq-key__glyph">
                            {isDone ? (
                              '✓'
                            ) : isSpace ? (
                              <svg
                                className="suit-seq-key__space-icon"
                                viewBox="0 0 30 12"
                                aria-hidden="true"
                              >
                                <path
                                  d="M2.5 2 V9.5 H27.5 V2"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3.2"
                                  strokeLinecap="square"
                                  strokeLinejoin="miter"
                                />
                              </svg>
                            ) : (
                              info.icon
                            )}
                          </span>
                          <span className="suit-seq-key__sub">{info.key.split('/')[0].trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {qte.type === 'hold' && (
                  <div className="suit-hold-container" aria-label="Charge and seal indicator">
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
                    <span className="suit-combo-badge">STREAK x{data.combo}</span>
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
                  aria-label="Primary action Space"
                >
                  <kbd className="suit-keycap-tag">SPACE</kbd>
                  <span>
                    {qte.type === 'hold'
                      ? data.isHolding
                        ? 'RELEASE IN GREEN ZONE'
                        : 'HOLD DOWN'
                      : qte.type === 'mash'
                        ? 'TAP FAST!'
                        : qte.type === 'sequence'
                          ? 'ARROWS ONLY ABOVE'
                          : 'SEAL NOW'}
                  </span>
                </button>

                <div className="suit-dpad" aria-label="Large directional keys">
                  {DIRECTION_KEYS.map(dir => {
                    const isTarget = activeSeqTarget === dir.id;
                    return (
                      <button
                        key={dir.id}
                        type="button"
                        className={`suit-key-arrow suit-key-arrow--${dir.mod}${isTarget ? ' suit-key-arrow--target' : ''}`}
                        disabled={!isRunning}
                        onClick={() => handleDirectionPress(dir.id)}
                        aria-label={`Arrow ${dir.key}`}
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
                  ? 'SUIT FULLY AIRTIGHT'
                  : "TIME'S UP"}
              </h3>
              <p className="suit-finish-subtitle">
                {snapshot.result?.completed
                  ? 'All seals verified. EVA clearance granted.'
                  : 'Partial pressurization logged in telemetry.'}
              </p>

              <div className="suit-finish-stats">
                <div className="suit-finish-stat-box">
                  <span>SCORE</span>
                  <b>{score} PTS</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>TIME</span>
                  <b>{((snapshot.result?.elapsedMs ?? 0) / 1000).toFixed(2)}s</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>PROGRESS</span>
                  <b>{Math.round(progress * 100)}%</b>
                </div>
                <div className="suit-finish-stat-box">
                  <span>STREAK</span>
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
  (definition: MinigameDefinition, context: MinigameContext) => {
    const seededContext =
      typeof context.seed === 'number'
        ? context
        : { ...context, seed: Math.floor(Math.random() * 0x100000000) || 1 };
    return new SuitUpEngine(definition, undefined, seededContext);
  },
  SuitUpView,
);
