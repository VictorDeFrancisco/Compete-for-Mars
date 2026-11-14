import { defineModule, type MinigameViewProps } from '../../core/module';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import { SolarStormGame, type SolarStormData } from './SolarStormEngine';
import { SolarStormCanvas } from './SolarStormCanvas';
import './solarStorm.css';

export { SolarStormGame, type SolarStormData };

function SolarStormView({ engine, snapshot }: MinigameViewProps<SolarStormData>) {
  const data = snapshot.data;
  const isRunning = snapshot.status === 'running';
  const episode = data.episode;
  const defenses = data.defenses;

  const bindAction = (actionId: string) => ({
    onPointerDown: () => isRunning && engine.dispatch(actionId, 'press'),
    onPointerUp: () => engine.dispatch(actionId, 'release'),
    onPointerLeave: () => engine.dispatch(actionId, 'release'),
  });

  const radClass =
    data.totalRadiationDose < 1.0
      ? 'rad-safe'
      : data.totalRadiationDose < 3.0
      ? 'rad-warning'
      : 'rad-danger';

  const noaaClass =
    data.noaaScale === 'S0'
      ? 'noaa-s0'
      : data.noaaScale === 'S1' || data.noaaScale === 'S2'
      ? 'noaa-s2'
      : 'noaa-s4';

  return (
    <div className="solar-storm-view">
      {/* 1. Cabecera Estilo NASA DONKI Space Weather Monitor */}
      <div className="solar-storm__header">
        <div className="solar-storm__header-left">
          <span className="solar-storm__nasa-badge">🛰️ NASA DONKI SPACE WEATHER</span>
          <span className="solar-storm__epoch-title">{episode.name}</span>
        </div>
        <div className="solar-storm__time-readout">
          <span className="solar-storm__time-label">⏱️ TIEMPO ACELERADO</span>
          <span className="solar-storm__time-val">{data.simulatedDateTime}</span>
        </div>
      </div>

      {/* 2. Visualizador Heliosférico Canvas */}
      <div className="solar-storm__screen-frame">
        <SolarStormCanvas data={data} />

        {/* Alerta DONKI superpuesta en tiempo real */}
        {data.activeAlert && !data.activeImpact && (
          <div className="solar-storm__alert-box">
            <span className="alert-badge pulse">⚠️ ALERTA NASA DONKI</span>
            <div className="alert-content">
              <strong>{data.activeAlert.type} ({data.activeAlert.intensity})</strong>
              <span>Impacto estimado en Marte: {data.timeToImpactSec.toFixed(1)}s</span>
            </div>
          </div>
        )}

        {/* Notificación de impacto activo */}
        {data.activeImpact && (
          <div className="solar-storm__impact-box">
            <span className="impact-badge flash">⚡ IMPACTO DE RADIACIÓN EN CURSO</span>
            <span className="impact-desc">{data.activeImpact.message}</span>
          </div>
        )}
      </div>

      {/* 3. Panel de Dosimetría y Telemetría Espacial */}
      <div className="solar-storm__telemetry-grid">
        <div className="telemetry-card">
          <span className="card-label">DOSIS ACUMULADA</span>
          <span className={`card-val ${radClass}`}>{data.totalRadiationDose.toFixed(2)} mSv</span>
        </div>
        <div className="telemetry-card">
          <span className="card-label">TASA INSTANTÁNEA</span>
          <span className="card-val">{data.currentRadiationRate.toFixed(1)} mSv/h</span>
        </div>
        <div className="telemetry-card">
          <span className="card-label">ESCALA NOAA</span>
          <span className={`card-val ${noaaClass}`}>{data.noaaScale}</span>
        </div>
        <div className="telemetry-card">
          <span className="card-label">BATERÍA BASE</span>
          <span className="card-val" style={{ color: data.baseEnergy > 30 ? '#4ade80' : '#f87171' }}>
            {data.baseEnergy.toFixed(0)} %
          </span>
        </div>
        <div className="telemetry-card">
          <span className="card-label">TORMENTAS MITIGADAS</span>
          <span className="card-val" style={{ color: '#38bdf8' }}>
            {data.mitigatedEventsCount} / {data.totalEventsCount}
          </span>
        </div>
      </div>

      {/* 4. Banner de Evento / Feedback */}
      <div className="solar-storm__banner">{data.lastEventMessage}</div>

      {/* 5. Controles Táctiles y de Teclado */}
      <div className="solar-storm__controls-cluster">
        <button
          type="button"
          className={`control-btn shield-btn ${defenses.shield ? 'active' : ''}`}
          disabled={!isRunning}
          {...bindAction('shield')}
        >
          <span className="btn-icon">🛡️</span>
          <div className="btn-text">
            <strong>Deflector Magnético (W / ↑)</strong>
            <small>Desvía plasma de CME</small>
          </div>
        </button>

        <button
          type="button"
          className={`control-btn shelter-btn ${defenses.shelter ? 'active' : ''}`}
          disabled={!isRunning}
          {...bindAction('shelter')}
        >
          <span className="btn-icon">🏰</span>
          <div className="btn-text">
            <strong>Búnker Regolito (S / ↓)</strong>
            <small>Absorbe rayos X de llamaradas</small>
          </div>
        </button>

        <button
          type="button"
          className={`control-btn panels-btn ${defenses.panelsProtected ? 'active' : ''}`}
          disabled={!isRunning}
          {...bindAction('panels')}
        >
          <span className="btn-icon">🔋</span>
          <div className="btn-text">
            <strong>Proteger Paneles (A / ←)</strong>
            <small>Repliega fotovoltaica (protones)</small>
          </div>
        </button>

        <button
          type="button"
          className={`control-btn purge-btn ${defenses.purge ? 'active' : ''}`}
          disabled={!isRunning}
          {...bindAction('purge')}
        >
          <span className="btn-icon">⚡</span>
          <div className="btn-text">
            <strong>Disipar Iones (D / Espacio)</strong>
            <small>Purga sobretensión post-choque</small>
          </div>
        </button>
      </div>
    </div>
  );
}

export default defineModule(
  solarStormDefinition,
  (definition, context) => new SolarStormGame(definition, undefined, context),
  SolarStormView
);
