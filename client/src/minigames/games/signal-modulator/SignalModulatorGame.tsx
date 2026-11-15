import { useEffect, useRef } from 'react';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { signalModulatorDefinition } from '../../../../../shared/minigames/signalModulator';
import { playSfxAction, playSfxPerfect } from '../../../utils/uiAudio';
import { SignalModulatorEngine, type SignalModulatorData } from './SignalModulatorEngine';
import { SignalCanvas } from './SignalCanvas';
import './signalModulator.css';

function SignalModulatorView({ snapshot }: MinigameViewProps<SignalModulatorData>) {
  const data = snapshot.data;
  const currentPacket = data.currentPacket;
  const keys = data.activeKeys;
  const prevCompletedRef = useRef(data.completedPacketIds.length);
  const prevFilteringRef = useRef(data.isFiltering);

  useEffect(() => {
    if (data.completedPacketIds.length > prevCompletedRef.current) {
      playSfxPerfect();
    }
    if (data.isFiltering && !prevFilteringRef.current) {
      playSfxAction();
    }
    prevCompletedRef.current = data.completedPacketIds.length;
    prevFilteringRef.current = data.isFiltering;
  }, [data.completedPacketIds.length, data.isFiltering]);

  return (
    <div className="signal-mod">
      {/* 1. Compact retro-NASA console header */}
      <div className="signal-mod__header">
        <span className="signal-mod__badge">DSN LINK</span>
        <span className="signal-mod__counter">
          WAVE #{data.currentPacketIndex + 1} · {data.completedPacketIds.length} SENT
        </span>
        <span className="signal-mod__score">{snapshot.score} PTS</span>
        <span className="signal-mod__station">{currentPacket.station.split(' ')[0]}</span>
      </div>

      {/* 2. Oscilloscope screen */}
      <div className="signal-mod__screen">
        <div className="signal-mod__canvas-wrap">
          <SignalCanvas data={data} />
        </div>
        {/* Link lock progress bar */}
        <div className="signal-mod__lock-track">
          <div
            className={`signal-mod__lock-fill ${data.isAligned ? 'signal-mod__lock-fill--active' : ''}`}
            style={{ width: `${Math.round(data.lockProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Brief contextual alert (only when an event is active) */}
      {data.isJammed ? (
        <div className="signal-mod__banner signal-mod__banner--storm">
          ⚡ SOLAR STORM: HOLD [SPACE] TO FILTER
        </div>
      ) : data.isAligned ? (
        <div className="signal-mod__banner signal-mod__banner--locked">
          ✔ WAVES IN PHASE: TRANSMITTING...
        </div>
      ) : null}

      {/* 3. Compact controls: Frequency & Power */}
      <div className="signal-mod__controls">
        {/* Frequency */}
        <div className="signal-mod__card">
          <div className="signal-mod__card-top">
            <span className="signal-mod__card-title">FREQUENCY</span>
            <span className={`signal-mod__status signal-mod__status--${data.freqStatus} ${data.freqStatus}`}>
              {data.freqStatus === 'MATCH' ? '✔ OK' : data.freqStatus === 'TOO_LOW' ? '▲ RAISE' : '▼ LOWER'}
            </span>
          </div>

          <div className="signal-mod__readout">
            <span className="signal-mod__val">{data.playerFreq.toFixed(2)}</span>
            <span className="signal-mod__target">/ {data.targetFreq.toFixed(2)} GHz</span>
          </div>

          <div className="signal-mod__keys">
            <kbd className={`mod-key ${keys.freqDown ? 'mod-key--active' : ''}`}>A</kbd>
            <kbd className={`mod-key ${keys.freqUp ? 'mod-key--active' : ''}`}>D</kbd>
          </div>
        </div>

        {/* Power */}
        <div className="signal-mod__card">
          <div className="signal-mod__card-top">
            <span className="signal-mod__card-title">POWER</span>
            <span className={`signal-mod__status signal-mod__status--${data.ampStatus} ${data.ampStatus}`}>
              {data.ampStatus === 'MATCH' ? '✔ OK' : data.ampStatus === 'TOO_LOW' ? '▲ RAISE' : '▼ LOWER'}
            </span>
          </div>

          <div className="signal-mod__readout">
            <span className="signal-mod__val">{Math.round(data.playerAmp * 100)}%</span>
            <span className="signal-mod__target">/ {Math.round(data.targetAmp * 100)}%</span>
          </div>

          <div className="signal-mod__keys">
            <kbd className={`mod-key ${keys.ampDown ? 'mod-key--active' : ''}`}>S</kbd>
            <kbd className={`mod-key ${keys.ampUp ? 'mod-key--active' : ''}`}>W</kbd>
          </div>
        </div>
      </div>

      {/* 4. Solar Filter */}
      <div className={`signal-mod__filter ${data.isFiltering ? 'signal-mod__filter--active' : ''}`}>
        <div className="signal-mod__filter-left">
          <kbd className={`mod-key mod-key--space ${keys.filterNoise ? 'mod-key--active' : ''}`}>
            SPACE
          </kbd>
          <span className="signal-mod__filter-label">
            {data.isFiltering ? 'FILTER ACTIVE' : 'SOLAR FILTER'}
          </span>
        </div>

        <div className="signal-mod__battery">
          <span className="signal-mod__battery-pct">{data.filterBattery}%</span>
          <div className="signal-mod__battery-track">
            <div
              className="signal-mod__battery-fill"
              style={{ width: `${data.filterBattery}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default defineModule(
  signalModulatorDefinition,
  (definition, context) => new SignalModulatorEngine(definition, undefined, context),
  SignalModulatorView,
);
