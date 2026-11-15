import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MINIGAME_CONTEXT } from '../../../../../shared/minigames/context';
import { signalModulatorDefinition } from '../../../../../shared/minigames/signalModulator';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { TELEMETRY_PACKETS } from './packetsConfig';
import { SignalModulatorEngine } from './SignalModulatorEngine';

test('SignalModulatorEngine inicializa con el primer paquete y estado idle', () => {
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => 0, DEFAULT_MINIGAME_CONTEXT);
  const snap = engine.getSnapshot();

  assert.equal(snap.status, 'idle');
  assert.equal(snap.score, 0);
  assert.equal(snap.progress, 0);
  assert.equal(snap.data.currentPacketIndex, 0);
  assert.equal(snap.data.totalPackets, TELEMETRY_PACKETS.length);
  assert.equal(snap.data.completedPacketIds.length, 0);
  assert.equal(snap.data.isAligned, false);
});

test('Alinear frecuencia y amplitud activa isAligned y acumula lockProgress', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  const firstPacket = TELEMETRY_PACKETS[0];
  // Colocamos frecuencia y amplitud exactamente en el objetivo
  engine.setPlayerFrequency(firstPacket.targetFreq);
  engine.setPlayerAmplitude(firstPacket.targetAmp);

  now = 500;
  engine.tick();

  const snap = engine.getSnapshot();
  assert.equal(snap.data.isAligned, true);
  assert.ok(snap.data.lockProgress > 0, `Progreso esperado > 0, fue ${snap.data.lockProgress}`);
});

test('Mantener la alineación completa el paquete y avanza al siguiente', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  const firstPacket = TELEMETRY_PACKETS[0];
  engine.setPlayerFrequency(firstPacket.targetFreq);
  engine.setPlayerAmplitude(firstPacket.targetAmp);

  // Simulamos 2.5 segundos con alineación perfecta
  for (let i = 1; i <= 25; i++) {
    now = i * 100;
    engine.tick();
    if (engine.getSnapshot().data.currentPacketIndex > 0) break;
  }

  const snap = engine.getSnapshot();
  assert.equal(snap.data.currentPacketIndex, 1);
  assert.ok(snap.score >= 250);
  assert.equal(snap.data.completedPacketIds.includes(firstPacket.id), true);
  assert.equal(snap.progress, 1 / TELEMETRY_PACKETS.length);
});

test('Acciones de teclado o botones modifican la frecuencia y amplitud', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  const initialFreq = engine.getSnapshot().data.playerFreq;
  engine.dispatch('freq-up', 'press');
  assert.ok(engine.getSnapshot().data.playerFreq > initialFreq);

  const initialAmp = engine.getSnapshot().data.playerAmp;
  engine.dispatch('amp-up', 'press');
  assert.ok(engine.getSnapshot().data.playerAmp > initialAmp);

  // Activación de filtro solar
  engine.dispatch('filter-noise', 'press');
  now = 100;
  engine.tick();
  assert.equal(engine.getSnapshot().data.isFiltering, true);
});

test('Mantener W y S mueve la potencia continuamente incluso a 120 FPS', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  const startAmp = engine.getSnapshot().data.playerAmp;
  engine.dispatch('amp-up', 'press');
  // 60 frames de 8ms (~125 FPS, 480ms totales)
  for (let i = 1; i <= 60; i++) {
    now = i * 8;
    engine.tick();
  }
  engine.dispatch('amp-up', 'release');
  const raisedAmp = engine.getSnapshot().data.playerAmp;
  assert.ok(raisedAmp > startAmp + 0.15, `Amplitud esperada > ${startAmp + 0.15}, fue ${raisedAmp}`);

  engine.dispatch('amp-down', 'press');
  for (let i = 61; i <= 120; i++) {
    now = i * 8;
    engine.tick();
  }
  engine.dispatch('amp-down', 'release');
  const loweredAmp = engine.getSnapshot().data.playerAmp;
  assert.ok(loweredAmp < raisedAmp - 0.15, `Amplitud esperada < ${raisedAmp - 0.15}, fue ${loweredAmp}`);
});

test('Las ondas son ilimitadas: tras 4 paquetes siguen generándose ondas hasta agotar el tiempo', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(
    signalModulatorDefinition,
    () => now,
    { ...DEFAULT_MINIGAME_CONTEXT, seed: 4242 },
  );
  engine.start();

  // Transmitimos 6 ondas seguidas (más que las 4 iniciales)
  for (let p = 0; p < 6; p++) {
    const curPacket = engine.getSnapshot().data.currentPacket;
    engine.setPlayerFrequency(curPacket.targetFreq);
    engine.setPlayerAmplitude(curPacket.targetAmp);

    if (curPacket.hasSolarFlare) {
      engine.dispatch('filter-noise', 'press');
    } else {
      engine.dispatch('filter-noise', 'release');
    }

    for (let step = 0; step < 30; step++) {
      now += 100;
      engine.tick();
      if (engine.getSnapshot().data.currentPacketIndex > p) {
        break;
      }
    }
  }

  const snap = engine.getSnapshot();
  assert.equal(snap.status, 'running');
  assert.equal(snap.data.currentPacketIndex, 6);
  assert.equal(snap.data.completedPacketIds.length, 6);
  assert.ok(snap.score >= 1500);

  // Solo termina al expirar el tiempo
  now = signalModulatorDefinition.durationMs;
  engine.tick();
  const finalSnap = engine.getSnapshot();
  assert.equal(finalSnap.status, 'finished');
  assert.equal(finalSnap.result?.reason, 'timeout');
  assert.ok((finalSnap.result?.score ?? 0) >= 1500);

  const validated = validateResult(signalModulatorDefinition, finalSnap.result);
  assert.equal(validated.score, finalSnap.result?.score);
});

test('Timeout al alcanzar durationMs preserva puntuación y razón timeout', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  // El jugador no hace nada y vence el tiempo
  now = signalModulatorDefinition.durationMs;
  engine.tick();

  const snap = engine.getSnapshot();
  assert.equal(snap.status, 'finished');
  assert.equal(snap.result?.reason, 'timeout');
  assert.equal(snap.result?.completed, false);
});

test('La batería del filtro solar se descarga de forma continua e independiente del FPS', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  engine.dispatch('filter-noise', 'press');
  // Simulamos 1 segundo exacto a ~60 FPS (60 ticks de ~16.67ms): tasa deltaMs / 80 -> ~12.5% en 1s
  for (let i = 1; i <= 60; i++) {
    now = Math.round((i * 1000) / 60);
    engine.tick();
  }

  const snap = engine.getSnapshot();
  assert.ok(snap.data.filterBattery <= 90, `Batería esperada <= 90% tras 1s, fue ${snap.data.filterBattery}%`);
  assert.ok(snap.data.filterBattery >= 85, `Batería esperada >= 85% tras 1s, fue ${snap.data.filterBattery}%`);
});
