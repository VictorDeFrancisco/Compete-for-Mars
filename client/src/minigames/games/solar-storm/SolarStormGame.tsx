import { defineModule, type MinigameViewProps } from '../../core/module';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import { SolarStormGame, type SolarStormData } from './SolarStormEngine';
import { SolarStormCanvas } from './SolarStormCanvas';
import './solarStorm.css';

export { SolarStormGame, type SolarStormData };

function SolarStormView({ snapshot }: MinigameViewProps<SolarStormData>) {
  const data = snapshot.data;

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

  const timeLeftSec = Math.max(0, 60 - Math.floor(data.currentSecond));

  return (
    <div className="solar-storm-view">
      {/* Zona Jugable de la Base Marciana con HUD Integrado en el Interior */}
      <div className="solar-storm__screen-frame">
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

          {/* Horas / Fecha Simulada NASA y Cuenta Atrás */}
          <div className="hud-metric hud-metric--clock">
            <span className="hud-clock-time">{data.simulatedDateTime}</span>
            <span className="hud-clock-sub">⏱️ RESTANTE: {timeLeftSec}s</span>
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
