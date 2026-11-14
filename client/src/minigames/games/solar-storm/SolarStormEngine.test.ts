import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import { validateResult } from '../../../../../shared/minigames/ranking';
import { SolarStormGame } from './SolarStormEngine';

test('solar-storm: inicialización con episodio DONKI y ángulo de escudo a 180°', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 42);
  const snap = game.getSnapshot();

  assert.ok(game.episode.name.length > 5, 'Debe cargar un episodio real de DONKI');
  assert.ok(game.episode.startDate.includes('UTC'), 'Fecha con formato UTC');
  assert.ok(game.episode.waves.length >= 4, 'Debe incluir al menos 4 ondas de tormenta solar');
  assert.equal(snap.data.shieldAngle, 180, 'El escudo inicia encarando al Sol (180°)');
  assert.equal(snap.data.shieldWidthDeg, 24, 'Amplitud angular estándar');
  assert.equal(snap.data.colonyIntegrity, 100, 'Integridad inicial al 100%');
  assert.equal(snap.data.totalRadiationDose, 0, 'Dosis inicial en 0 mSv');
  assert.equal(snap.data.boostEnergy, 100, 'Energía de super-escudo al 100%');
});

test('solar-storm: rotación orbital del escudo con turn-left y turn-right', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 101);
  game.start();

  // Giro a la izquierda: disminuye ángulo
  game.dispatch('turn-left', 'press');
  now = 1000;
  game.tick();
  game.dispatch('turn-left', 'release');

  const angleAfterLeft = game.getSnapshot().data.shieldAngle;
  assert.ok(angleAfterLeft < 180, `El ángulo debe disminuir al girar a la izquierda (actual: ${angleAfterLeft})`);

  // Giro a la derecha: aumenta ángulo
  game.dispatch('turn-right', 'press');
  now = 2000;
  game.tick();
  game.dispatch('turn-right', 'release');

  const angleAfterRight = game.getSnapshot().data.shieldAngle;
  assert.ok(angleAfterRight > angleAfterLeft, 'El ángulo debe aumentar al girar a la derecha');
});

test('solar-storm: activación de super-escudo amplía la cobertura angular a 150°', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 202);
  game.start();

  game.dispatch('boost', 'press');
  now = 500;
  game.tick();

  const snap = game.getSnapshot();
  assert.equal(snap.data.isBoosting, true, 'Super-escudo activo');
  assert.equal(snap.data.shieldWidthDeg, 48, 'Amplitud de cobertura ampliada a 48°');
  assert.ok(snap.data.boostEnergy < 100, 'Debe consumir energía del super-escudo');

  game.dispatch('boost', 'release');
  now = 1000;
  game.tick();
  assert.equal(game.getSnapshot().data.isBoosting, false);
});

test('solar-storm: deflexión exitosa de onda cuando el escudo está alineado', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 303);
  game.start();

  const firstWave = game.episode.waves[0];
  const impactMs = firstWave.impactSec * 1000;

  // Si la onda llega a 180° y el escudo inicia en 180°, la intercepción será exitosa
  now = impactMs + 200;
  game.tick();

  const snap = game.getSnapshot();
  assert.equal(snap.data.blockedCount, 1, 'Debe registrar la onda como bloqueada');
  assert.ok(snap.score >= 300, 'Puntuación otorgada por deflexión');
  assert.equal(snap.data.totalRadiationDose, 0, 'No debe penetrar radiación');
});

test('solar-storm: impacto de radiación si el escudo está desalineado', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 404);
  game.start();

  // Girar el escudo lejos del ángulo frontal (180°)
  game.dispatch('turn-left', 'press');
  now = 1000;
  game.tick();
  game.dispatch('turn-left', 'release');

  const firstWave = game.episode.waves[0];
  const impactMs = firstWave.impactSec * 1000;

  now = Math.max(now, impactMs + 500);
  game.tick();

  const snap = game.getSnapshot();
  assert.equal(snap.data.breachedCount, 1, 'La onda no alineada debe provocar brecha');
  assert.ok(snap.data.totalRadiationDose > 0, 'Debe registrar dosis de radiación');
  assert.ok(snap.data.colonyIntegrity < 100, 'La integridad de la base disminuye');
});

test('solar-storm: finalización al completar 60s y validación de contrato', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 505);
  game.start();

  now = 60_000;
  game.tick();

  const result = game.getResult();
  assert.ok(result !== null, 'Debe generar resultado al vencer el plazo de 60s');
  assert.equal(result.elapsedMs, 60_000);
  assert.ok(result.score >= 0 && result.score <= 1000);
  assert.doesNotThrow(() => validateResult(solarStormDefinition, result));
});
