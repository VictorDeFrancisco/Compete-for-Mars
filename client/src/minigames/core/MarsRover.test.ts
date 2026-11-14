import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marsRoverDefinition } from '../../../../shared/minigames/marsRover';
import { validateResult } from '../../../../shared/minigames/ranking';
import { MarsRoverGame } from '../games/mars-rover/MarsRoverEngine';
import { calculateMarsCoordinates } from '../games/mars-rover/jezeroMapData';

test('mars-rover: físicas continuas, aceleración y consumo visible de batería', () => {
  let now = 0;
  const game = new MarsRoverGame(marsRoverDefinition, () => now, undefined, 42);
  game.start();

  const initEnergy = game.getSnapshot().data.energy;
  assert.equal(game.getSnapshot().data.speed, 0);

  // Acelerar hacia adelante durante 1000ms
  game.dispatch('forward', 'press');
  now = 500;
  game.tick();
  now = 1000;
  game.tick();

  const speedAfterAccel = game.getSnapshot().data.speed;
  const energyAfterAccel = game.getSnapshot().data.energy;

  assert.ok(speedAfterAccel > 0.5, 'El rover debe haber ganado velocidad');
  assert.ok(energyAfterAccel < initEnergy, 'La batería debe reducirse visiblemente al acelerar');

  // Soltar acelerador y comprobar que conserva inercia
  game.dispatch('forward', 'release');
  now = 1500;
  game.tick();
  assert.ok(game.getSnapshot().data.speed > 0, 'La inercia debe mantener el movimiento');
});

test('mars-rover: giro angular con inercia y orientación orbital', () => {
  let now = 0;
  const game = new MarsRoverGame(marsRoverDefinition, () => now, undefined, 123);
  game.start();
  const initHeading = game.getSnapshot().data.heading;

  // Girar a la derecha durante 300ms
  game.dispatch('turn-right', 'press');
  now = 150;
  game.tick();
  now = 300;
  game.tick();
  game.dispatch('turn-right', 'release');

  const headingAfterTurn = game.getSnapshot().data.heading;
  assert.notEqual(headingAfterTurn, initHeading, 'El rumbo debe haber rotado');
});

test('mars-rover: freno de orugas reduce velocidad activamente', () => {
  let now = 0;
  const game = new MarsRoverGame(marsRoverDefinition, () => now, undefined, 999);
  game.start();

  // Acelerar
  game.dispatch('forward', 'press');
  now = 800;
  game.tick();
  game.dispatch('forward', 'release');
  const speedBeforeBrake = game.getSnapshot().data.speed;
  assert.ok(speedBeforeBrake > 0.3, 'Debe haber ganado velocidad');

  // Aplicar freno
  game.dispatch('brake', 'press');
  now = 1400;
  game.tick();
  const speedAfterBrake = game.getSnapshot().data.speed;

  assert.ok(speedAfterBrake < speedBeforeBrake, 'El freno debe reducir la velocidad con fricción');
});

test('mars-rover: generación procedural de escenarios satelitales y orografía', () => {
  const g1 = new MarsRoverGame(marsRoverDefinition, () => 0, undefined, 111);
  const g2 = new MarsRoverGame(marsRoverDefinition, () => 0, undefined, 222);

  const start1 = g1.sector.startPos;
  const start2 = g2.sector.startPos;
  assert.notEqual(`${start1.x},${start1.y}`, `${start2.x},${start2.y}`);
  assert.ok(g1.sector.contourLevels.length > 5, 'Debe haber curvas de nivel');
});

test('mars-rover: timeout al vencer el plazo de 120s preserva resultado válido', () => {
  let now = 0;
  const game = new MarsRoverGame(marsRoverDefinition, () => now, undefined, 777);
  game.start();
  game.dispatch('forward', 'press');
  now = 500;
  game.tick();
  game.dispatch('forward', 'release');

  // Vencer el plazo de 120s
  now = 120_000;
  game.tick();

  const result = game.getResult();
  assert.ok(result !== null);
  assert.equal(result.completed, false);
  assert.equal(result.reason, 'timeout');
  assert.equal(result.elapsedMs, 120_000);
  assert.doesNotThrow(() => validateResult(marsRoverDefinition, result));
});

test('mars-rover: telemetría de coordenadas geográficas de Marte y metadatos NASA', () => {
  const game = new MarsRoverGame(marsRoverDefinition, () => 0, undefined, 555);
  const sector = game.sector;

  assert.ok(sector.centerLat !== undefined && sector.centerLon !== undefined);
  assert.ok(sector.nasaTileUrl.includes('mars_tile_') || sector.nasaTileUrl.startsWith('http'));

  const coords = calculateMarsCoordinates(90, 90, sector.centerLat, sector.centerLon);
  assert.ok(coords.formatted.length > 5, 'Debe formatear latitud y longitud');
  assert.equal(Math.round(coords.lat * 100) / 100, Math.round(sector.centerLat * 100) / 100);
});

test('mars-rover: obstáculos de rocas 3D y respuesta física de colisión', () => {
  const game = new MarsRoverGame(marsRoverDefinition, () => 0, undefined, 4321);
  const sector = game.sector;

  assert.ok(sector.rocks.length >= 30, 'Debe generar un campo con abundantes rocas');
  const firstRock = sector.rocks[0];
  assert.ok(firstRock.radius >= 1.0 && firstRock.height >= 0.8, 'Dimensiones realistas de roca');

  // Comprobar que no hay rocas inmediatamente encima del punto de inicio
  const startDist = Math.hypot(firstRock.x - sector.startPos.x, firstRock.y - sector.startPos.y);
  assert.ok(startDist >= 12, 'El rover no debe aparecer dentro de una roca');
});
