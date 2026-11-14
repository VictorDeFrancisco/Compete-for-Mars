import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solarStormDefinition } from '../../../../shared/minigames/solarStorm';
import { validateResult } from '../../../../shared/minigames/ranking';
import { SolarStormGame } from '../games/solar-storm/SolarStormEngine';

test('solar-storm: inicialización con episodio DONKI y metadatos reales de la NASA', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 42);
  const snap = game.getSnapshot();

  assert.ok(game.episode.name.length > 5, 'Debe cargar un episodio real de DONKI');
  assert.ok(game.episode.startDate.includes('UTC'), 'Fecha con formato UTC');
  assert.ok(game.episode.events.length >= 4, 'Debe incluir al menos 4 eventos de tormenta solar');
  assert.equal(snap.data.baseEnergy, 100);
  assert.equal(snap.data.totalRadiationDose, 0);
  assert.ok(snap.data.currentRadiationRate < 0.1, 'Radiación ambiental inicial baja');
});

test('solar-storm: activación de sistemas defensivos según los controles', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 101);
  game.start();

  game.dispatch('shield', 'press');
  assert.equal(game.getSnapshot().data.defenses.shield, true);
  game.dispatch('shield', 'release');
  assert.equal(game.getSnapshot().data.defenses.shield, false);

  game.dispatch('shelter', 'press');
  assert.equal(game.getSnapshot().data.defenses.shelter, true);
  game.dispatch('shelter', 'release');
  assert.equal(game.getSnapshot().data.defenses.shelter, false);

  game.dispatch('panels', 'press');
  assert.equal(game.getSnapshot().data.defenses.panelsProtected, true);
  game.dispatch('panels', 'release');
  assert.equal(game.getSnapshot().data.defenses.panelsProtected, false);

  game.dispatch('purge', 'press');
  assert.equal(game.getSnapshot().data.defenses.purge, true);
  game.dispatch('purge', 'release');
  assert.equal(game.getSnapshot().data.defenses.purge, false);
});

test('solar-storm: mitigación exitosa de eventos solares y bonificación de puntuación', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 202);
  game.start();

  const firstEvent = game.episode.events[0];
  const impactMs = firstEvent.impactSec * 1000;

  game.dispatch(firstEvent.requiredDefense, 'press');

  now = impactMs + 500;
  game.tick();

  const snap = game.getSnapshot();
  assert.equal(snap.data.mitigatedEventsCount, 1, 'Debe registrar el evento como mitigado');
  assert.equal(snap.data.lastFeedback, 'PERFECT');
  assert.ok(snap.score >= 500, 'Puntuación positiva por mitigación');
});

test('solar-storm: falta de defensa provoca brecha y aumenta la dosis de radiación', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 303);
  game.start();

  const firstEvent = game.episode.events[0];
  const impactMs = firstEvent.impactSec * 1000;

  now = impactMs + 1000;
  game.tick();

  const snap = game.getSnapshot();
  assert.equal(snap.data.mitigatedEventsCount, 0, 'No debe mitigar el evento');
  assert.equal(snap.data.lastFeedback, 'BREACH');
  assert.ok(snap.data.totalRadiationDose > 0, 'Debe acumular dosis de radiación recibida');
});

test('solar-storm: finalización al completar 60s y validación de contrato', () => {
  let now = 0;
  const game = new SolarStormGame(solarStormDefinition, () => now, undefined, 404);
  game.start();

  now = 60_000;
  game.tick();

  const result = game.getResult();
  assert.ok(result !== null, 'Debe generar resultado al vencer el plazo de 60s');
  assert.equal(result.elapsedMs, 60_000);
  assert.ok(result.score >= 0 && result.score <= 1000);
  assert.doesNotThrow(() => validateResult(solarStormDefinition, result));
});
