import type { PointerEvent } from 'react';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import { SolarStormGame, type SolarStormData } from './SolarStormEngine';
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

  const integrityColor =
    data.colonyIntegrity > 70
      ? '#4ade80'
      : data.colonyIntegrity > 35
      ? '#facc15'
      : '#f87171';

  const aimShieldFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    if (snapshot.status !== 'running') return;
    const canvas = e.currentTarget.querySelector('canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const normX = ((e.clientX - rect.left) / rect.width) * 680;
    const normY = ((e.clientY - rect.top) / rect.height) * 480;
    const dx = normX - 340;
    const dy = 401 - normY;
    const angleRad = Math.atan2(dx, Math.max(12, dy));
    const angleDeg = 180 + (angleRad * 180) / Math.PI;
    solarEngine.setDirectAngle(angleDeg);
  };

  return (
    <div className="solar-storm-view">
      {/* Zona Jugable de la Base Marciana con HUD Integrado en el Interior */}
      <div
        className="solar-storm__screen-frame"
        onPointerDown={aimShieldFromPointer}
        onPointerMove={e => {
          if (e.pointerType === 'mouse' || e.buttons > 0) {
            aimShieldFromPointer(e);
          }
        }}
      >
        <SolarStormCanvas data={data} />

        {/* Ticker de Alerta DONKI superpuesto en la parte superior del canvas */}
        {alertWave && (
          <div className="solar-storm__alert-ticker">
            <span className="ticker-badge">⚠️ ALERTA DONKI</span>
            <span className="ticker-desc">
              <strong>{alertWave.type} ({alertWave.intensity})</strong> · Sector {alertWave.approachAngleDeg}°
            </span>
            <span className="ticker-time">Impacto en {timeToImpact.toFixed(1)}s</span>
          </div>
        )}

        {/* HUD de Datos Mínimos Integrado DEBAJO dentro de la Zona Jugable */}
        <div className="solar-storm__bottom-hud">
          {/* Vida de la Base */}
          <div className="hud-metric hud-metric--life">
            <div className="hud-label-row">
              <span className="hud-title">❤️ VIDA BASE</span>
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
                  boxShadow: `0 0 8px ${integrityColor}`,
                }}
              />
            </div>
          </div>

          {/* Horas / Fecha Simulada NASA */}
          <div className="hud-metric hud-metric--clock">
            <span className="hud-clock-time">{data.simulatedDateTime}</span>
          </div>

          {/* Potencia del Escudo */}
          <div className="hud-metric hud-metric--shield">
            <div className="hud-label-row">
              <span className="hud-title">⚡ POTENCIA ESCUDO</span>
              <span className="hud-value" style={{ color: data.isBoosting ? '#c084fc' : '#38bdf8' }}>
                {Math.round(data.boostEnergy)}%
              </span>
            </div>
            <div className="hud-bar-track">
              <div
                className={`hud-bar-fill ${data.isBoosting ? 'hud-bar-fill--boosting' : ''}`}
                style={{
                  width: `${data.boostEnergy}%`,
                  background: data.isBoosting ? '#c084fc' : '#38bdf8',
                  boxShadow: data.isBoosting ? '0 0 10px #c084fc' : '0 0 8px #38bdf8',
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
  SolarStormView
);
