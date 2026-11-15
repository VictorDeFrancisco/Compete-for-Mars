import type { PointerEvent } from 'react';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import { SolarStormGame, type SolarStormData } from './SolarStormEngine';
import { getSolarSceneLayout } from './solarLayout';
import { SolarStormCanvas } from './SolarStormCanvas';
import './solarStorm.css';

export { SolarStormGame, type SolarStormData };

function SolarStormView({ engine, snapshot }: MinigameViewProps<SolarStormData>) {
  const data = snapshot.data;
  const solarEngine = engine as SolarStormGame;

  const alertWave = data.activeAlertWave;
  const timeToImpact = alertWave
    ? Math.max(0, alertWave.impactSec - data.currentSecond)
    : 0;
  const isDefeated = data.colonyIntegrity <= 0 || snapshot.result?.reason === 'failed';

  const integrityColor =
    data.colonyIntegrity > 70
      ? '#16a34a'
      : data.colonyIntegrity > 35
      ? '#d97706'
      : '#dc2626';

  const aimShieldFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (snapshot.status !== 'running') return;
    const canvas = e.currentTarget.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const layout = getSolarSceneLayout(rect.width, rect.height);
    const sceneX = (e.clientX - rect.left) / layout.scale;
    const sceneY = (e.clientY - rect.top) / layout.scale;
    const dx = sceneX - layout.baseX;
    const dy = layout.baseCenterY - sceneY;
    const angleRad = Math.atan2(dx, Math.max(12, dy));
    const angleDeg = 180 + (angleRad * 180) / Math.PI;
    solarEngine.setDirectAngle(angleDeg);
  };

  return (
    <div className="solar-storm-view">
      <div className="solar-storm__screen-frame">
        {/* Top Retro-NASA Telemetry Bar (inside wide game frame) */}
        <div className="solar-storm__header">
          <div className="solar-storm__header-left">
            <span className="solar-storm__badge">DONKI FEED</span>
            <span className="solar-storm__episode">{data.episode.name}</span>
          </div>

          {alertWave ? (
            <div className="solar-storm__alert-ticker solar-storm__alert-ticker--active">
              <span className="ticker-badge">ALERT</span>
              <span className="ticker-desc">
                <strong>{alertWave.type} ({alertWave.intensity})</strong> · Sector {alertWave.approachAngleDeg}°
              </span>
              <span className="ticker-time">T-{timeToImpact.toFixed(1)}s</span>
            </div>
          ) : (
            <div className="solar-storm__alert-ticker">
              <span className="ticker-clear">SECTOR CLEAR · MOVE SHIELD / [SPACE] BOOST</span>
            </div>
          )}

          <div className="solar-storm__header-right">
            <div
              className={`solar-storm__combo ${
                data.combo >= 4
                  ? 'solar-storm__combo--hot'
                  : data.combo > 1
                  ? 'solar-storm__combo--active'
                  : ''
              }`}
            >
              COMBO x{data.combo}
            </div>
            <div className="solar-storm__score">{snapshot.score} PTS</div>
          </div>
        </div>

        {/* Wide Mars Dome Viewport */}
        <div
          className={`solar-storm__viewport${isDefeated ? ' solar-storm__viewport--defeated' : ''}`}
          onPointerDown={aimShieldFromPointer}
          onPointerMove={e => {
            if (e.pointerType === 'mouse' || e.buttons > 0) {
              aimShieldFromPointer(e);
            }
          }}
        >
          <SolarStormCanvas data={data} />

          {isDefeated && (
            <div className="solar-storm__defeat-overlay" role="status" aria-live="assertive">
              <span className="solar-storm__defeat-badge">DEFEAT · CRITICAL FAILURE</span>
              <strong className="solar-storm__defeat-title">MARS BASE DESTROYED</strong>
              <p className="solar-storm__defeat-sub">
                Shield defenses breached at 0% HP · Final score: {snapshot.score} PTS
              </p>
            </div>
          )}
        </div>

        {/* Bottom Retro-NASA Telemetry Bar (inside wide game frame) */}
        <div className="solar-storm__bottom-hud">
          <div className="hud-metric hud-metric--life">
            <div className="hud-label-row">
              <span className="hud-title">BASE HP</span>
              <span className="hud-value" style={{ color: integrityColor }}>
                {data.colonyIntegrity}%
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className="hud-bar-fill"
                style={{
                  width: `${data.colonyIntegrity}%`,
                  background: integrityColor,
                }}
              />
            </div>
          </div>

          <div className="hud-metric hud-metric--clock">
            <span className="hud-clock-label">NASA UTC</span>
            <span className="hud-clock-time">{data.simulatedDateTime}</span>
          </div>

          <div className="hud-metric hud-metric--shield">
            <div className="hud-label-row">
              <span className="hud-title">
                SHIELD {data.isBoosting ? '· BOOSTING' : '· [SPACE]'}
              </span>
              <span className="hud-value" style={{ color: data.isBoosting ? '#7c3aed' : '#0b3d91' }}>
                {Math.round(data.boostEnergy)}%
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className={`hud-bar-fill ${data.isBoosting ? 'hud-bar-fill--boosting' : ''}`}
                style={{
                  width: `${data.boostEnergy}%`,
                  background: data.isBoosting ? '#7c3aed' : '#0b3d91',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default defineModule(
  solarStormDefinition,
  (definition, context) => new SolarStormGame(definition, undefined, context),
  SolarStormView,
);
