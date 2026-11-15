import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarStormDefinition } from '../../../../shared/minigames/solarStorm';
import { validateResult } from '../../../../shared/minigames/ranking';
import { SolarStormGame } from '../games/solar-storm/SolarStormEngine';
import { getSolarSceneLayout, SOLAR_CANVAS_HEIGHT, SOLAR_CANVAS_WIDTH } from '../games/solar-storm/solarLayout';

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

  game.dispatch('turn-left', 'press');
  now = 1000;
  game.tick();
  game.dispatch('turn-left', 'release');

  const angleAfterLeft = game.getSnapshot().data.shieldAngle;
  assert.ok(angleAfterLeft < 180, `El ángulo debe disminuir al girar a la izquierda (actual: ${angleAfterLeft})`);

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

test('solar-storm: derrota inmediata si la integridad de la base llega a 0%', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 606);
  game.start();

  // Mantener el escudo desalineado (en un extremo) para recibir todas las ondas hasta caer a 0%
  game.dispatch('turn-left', 'press');
  for (let sec = 1; sec <= 59 && game.getSnapshot().status === 'running'; sec++) {
    now = sec * 1000;
    game.tick();
  }
  game.dispatch('turn-left', 'release');

  const snap = game.getSnapshot();
  assert.equal(snap.data.colonyIntegrity, 0, 'La integridad de la base debe llegar a 0');
  assert.equal(snap.status, 'finished', 'El juego debe terminar al llegar a 0% HP');
  assert.equal(snap.result?.reason, 'failed', 'Debe registrar derrota (failed)');
  assert.equal(snap.result?.completed, false);
  assert.doesNotThrow(() => validateResult(solarStormDefinition, snap.result!));
});

test('solar-storm: layout uniforme mantiene proporciones 1:1 en pantalla completa y ventanas pequeñas', () => {
  const fullscreen = getSolarSceneLayout(1920, 880);
  const narrow = getSolarSceneLayout(640, 480);
  const wideShort = getSolarSceneLayout(1600, 340);

  for (const layout of [fullscreen, narrow, wideShort]) {
    assert.ok(layout.vw >= SOLAR_CANVAS_WIDTH - 1e-6);
    assert.ok(layout.vh >= SOLAR_CANVAS_HEIGHT - 1e-6);
    assert.equal(layout.baseX, layout.vw / 2);
    assert.equal(layout.groundY, layout.vh - 55);
  }
  assert.equal(fullscreen.scale, 1920 / SOLAR_CANVAS_WIDTH);
  assert.equal(narrow.scale, 640 / SOLAR_CANVAS_WIDTH);
  assert.equal(wideShort.scale, 340 / SOLAR_CANVAS_HEIGHT);
});
