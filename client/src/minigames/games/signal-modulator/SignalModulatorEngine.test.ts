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

test('Completar los 4 paquetes finaliza la carrera con validateResult válido', () => {
  let now = 0;
  const engine = new SignalModulatorEngine(signalModulatorDefinition, () => now, DEFAULT_MINIGAME_CONTEXT);
  engine.start();

  for (let p = 0; p < TELEMETRY_PACKETS.length; p++) {
    const curPacket = engine.getSnapshot().data.currentPacket;
    engine.setPlayerFrequency(curPacket.targetFreq);
    engine.setPlayerAmplitude(curPacket.targetAmp);

    // Si tiene llamarada solar, activamos el filtro para acelerar el lock
    if (curPacket.hasSolarFlare) {
      engine.dispatch('filter-noise', 'press');
    }

    // Avanzamos hasta que pase de paquete
    for (let step = 0; step < 30; step++) {
      now += 100;
      engine.tick();
      if (engine.getSnapshot().data.currentPacketIndex > p || engine.getSnapshot().status === 'finished') {
        break;
      }
    }
  }

  const finalSnap = engine.getSnapshot();
  assert.equal(finalSnap.status, 'finished');
  assert.equal(finalSnap.progress, 1);
  assert.equal(finalSnap.result?.completed, true);
  assert.equal(finalSnap.result?.reason, 'completed');
  assert.ok(finalSnap.score > 0);

  const validated = validateResult(signalModulatorDefinition, finalSnap.result);
  assert.equal(validated.completed, true);
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
