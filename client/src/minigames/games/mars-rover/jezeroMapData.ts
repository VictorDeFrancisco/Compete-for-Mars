export interface MarsWaypoint {
  x: number; // 0 a 180 metros
  y: number; // 0 a 180 metros
}

export interface MarsRock {
  id: number;
  x: number;
  y: number;
  radius: number; // Radio de colisión (1.1m a 2.7m)
  height: number; // Altura en metros (0.9m a 2.4m)
  rotation: number;
  colorSeed: number;
  shapeSeed: number;
}

export type ScenarioBiome = 'canyon_delta' | 'crater_basin' | 'volcanic_chasma' | 'dune_sea';

export interface MarsSectorMap {
  seed: number;
  sectorName: string;
  biome: ScenarioBiome;
  centerLat: number;
  centerLon: number;
  nasaTileUrl: string;
  startPos: MarsWaypoint & { heading: number };
  targetPos: MarsWaypoint;
  mapWidth: number; // 180m
  mapHeight: number; // 180m
  rocks: readonly MarsRock[];
  elevationAt: (x: number, y: number) => number; // Metros (-6m a +18m)
  gradientAt: (x: number, y: number) => { gx: number; gy: number; slopeDeg: number };
  gravityForceAt: (x: number, y: number, mass: number) => { fx: number; fy: number; slopeDeg: number };
  surfaceNormalAt: (x: number, y: number) => [number, number, number];
  isHazard: (x: number, y: number) => boolean;
  frictionAt: (x: number, y: number) => number;
  contourLevels: number[];
}

export interface SectorScenario {
  name: string;
  biome: ScenarioBiome;
  centerLat: number;
  centerLon: number;
  nasaTileUrl: string;
}

const SECTOR_SCENARIOS: SectorScenario[] = [
  {
    name: 'Sector Jezero · Valle de Neretva y Abanico Deltaico',
    biome: 'canyon_delta',
    centerLat: 18.38,
    centerLon: 77.58,
    nasaTileUrl: '/assets/mars_tile_jezero.jpg',
  },
  {
    name: 'Sector Gale · Cañón Fluvial de Aeolis Mons',
    biome: 'crater_basin',
    centerLat: -5.36,
    centerLon: 137.81,
    nasaTileUrl: '/assets/mars_tile_gale.jpg',
  },
  {
    name: 'Sector Valles Marineris · Desfiladero de Candor Chasma',
    biome: 'volcanic_chasma',
    centerLat: -14.22,
    centerLon: 301.08,
    nasaTileUrl: '/assets/mars_tile_valles.jpg',
  },
  {
    name: 'Sector Meridiani Planum · Planicie de Dunas de Hematita',
    biome: 'dune_sea',
    centerLat: -0.19,
    centerLon: 357.95,
    nasaTileUrl: '/assets/mars_tile_meridiani.jpg',
  },
  {
    name: 'Sector Elysium Planitia · Laberinto de Fosas Volcánicas',
    biome: 'volcanic_chasma',
    centerLat: 4.50,
    centerLon: 135.90,
    nasaTileUrl: '/assets/mars_tile_elysium.jpg',
  },
  {
    name: 'Sector Utopia Planitia · Cuenca de Depresión Glaciar',
    biome: 'crater_basin',
    centerLat: 46.70,
    centerLon: 117.50,
    nasaTileUrl: '/assets/mars_tile_utopia.jpg',
  },
];

function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const MAP_SIZE = 180; // 180m x 180m de sector activo
export const MARS_GRAVITY = 3.72; // m/s²

export function generateMarsSector(seed = Math.floor(Math.random() * 1_000_000)): MarsSectorMap {
  const rand = createPrng(seed);
  const scenario = SECTOR_SCENARIOS[Math.floor(rand() * SECTOR_SCENARIOS.length)];

  // Lugares COMPLETAMENTE ALEATORIOS para Inicio y Meta en cada partida
  // Se escogen posiciones aleatorias en cualquier parte del mapa separadas al menos por 115m
  let startX = 25, startY = 155, targetX = 155, targetY = 25;
  for (let attempt = 0; attempt < 100; attempt++) {
    const sx = 20 + rand() * 140;
    const sy = 20 + rand() * 140;
    const tx = 20 + rand() * 140;
    const ty = 20 + rand() * 140;
    if (Math.hypot(tx - sx, ty - sy) >= 115) {
      startX = sx;
      startY = sy;
      targetX = tx;
      targetY = ty;
      break;
    }
  }

  // Orientación inicial hacia el objetivo
  const initialAngleRad = Math.atan2(targetX - startX, -(targetY - startY));
  const initialHeadingDeg = Math.round(((initialAngleRad * 180) / Math.PI + 360) % 360);

  // Eje de navegación directo entre el punto de inicio aleatorio y la meta
  const pathDx = targetX - startX;
  const pathDy = targetY - startY;
  const pathLen = Math.hypot(pathDx, pathDy);
  const dirX = pathDx / pathLen;
  const dirY = pathDy / pathLen;
  const perpX = -dirY;
  const perpY = dirX;

  // 1. Armónicos de ondulación satelital y dunas marcianas
  const duneAngle = rand() * Math.PI;
  const cosDune = Math.cos(duneAngle);
  const sinDune = Math.sin(duneAngle);
  const duneFreq = 0.045 + rand() * 0.02; // Longitud de onda ~20-30m
  const f1 = 0.016 + rand() * 0.008;
  const f2 = 0.036 + rand() * 0.012;
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;

  const baseAmp = scenario.biome === 'dune_sea' ? 2.2 : 3.0;
  const duneAmp = scenario.biome === 'dune_sea' ? 1.8 : 0.7;

  // 2. Colinas o mesetas aisladas distribuidas orgánicamente
  // Aseguramos que NO haya siempre una montaña bloqueando en medio entre A y B
  interface MarsHill {
    x: number;
    y: number;
    radius: number;
    height: number;
  }
  const hills: MarsHill[] = [];
  const hillCount = scenario.biome === 'dune_sea' ? 0 : Math.floor(1 + rand() * 2);
  for (let i = 0; i < hillCount; i++) {
    let hx = 30 + rand() * 120;
    let hy = 30 + rand() * 120;

    // Si la colina cae en la trayectoria directa A -> B, desplazarla hacia un lateral
    // para dejar un corredor o paso natural libre de montañas
    const vhx = hx - startX;
    const vhy = hy - startY;
    const proj = vhx * dirX + vhy * dirY;
    if (proj > 12 && proj < pathLen - 12) {
      const perp = vhx * perpX + vhy * perpY;
      if (Math.abs(perp) < 26) {
        const side = perp >= 0 ? 1 : -1;
        hx = startX + dirX * proj + perpX * (28 + rand() * 12) * side;
        hy = startY + dirY * proj + perpY * (28 + rand() * 12) * side;
      }
    }
    hills.push({
      x: hx,
      y: hy,
      radius: 17 + rand() * 10,
      height: 4.2 + rand() * 3.8, // Elevación suave y navegable (+4.2m a +8m)
    });
  }

  // 3. Cráteres de impacto marciano
  interface MarsCrater {
    x: number;
    y: number;
    radius: number;
    depth: number;
    rimH: number;
  }
  const craters: MarsCrater[] = [];
  const craterCount = scenario.biome === 'crater_basin' ? 2 : rand() > 0.45 ? 1 : 0;
  for (let i = 0; i < craterCount; i++) {
    let cx = 35 + rand() * 110;
    let cy = 35 + rand() * 110;

    // Evitar generar el cráter encima del punto de inicio
    if (Math.hypot(cx - startX, cy - startY) < 25) {
      cx += 35;
      cy += 35;
    }

    // Si coincide con el centro directo del camino, desplazar ligeramente para que bordearlo sea natural
    const vcx = cx - startX;
    const vcy = cy - startY;
    const proj = vcx * dirX + vcy * dirY;
    if (proj > 15 && proj < pathLen - 15) {
      const perp = vcx * perpX + vcy * perpY;
      if (Math.abs(perp) < 18) {
        const side = perp >= 0 ? 1 : -1;
        cx = startX + dirX * proj + perpX * (24 + rand() * 10) * side;
        cy = startY + dirY * proj + perpY * (24 + rand() * 10) * side;
      }
    }

    craters.push({
      x: cx,
      y: cy,
      radius: 16 + rand() * 8,
      depth: 3.8 + rand() * 1.8,
      rimH: 1.8 + rand() * 1.0,
    });
  }

  // 4. Valle fluvial sinuoso o lecho de cañón (opcional según bioma)
  const hasValley = scenario.biome === 'canyon_delta' || (rand() > 0.5 && scenario.biome !== 'dune_sea');
  const valleyOffset = (rand() - 0.5) * 44;
  const valleyDepth = 3.5 + rand() * 1.5;

  const elevationAt = (x: number, y: number): number => {
    // 1. Relieve regional suave de llanura marciana
    let z = Math.sin(x * f1 + p1) * Math.cos(y * f1 + p2) * baseAmp;
    z += Math.sin((x + y) * f2 + p3) * 1.4;

    // Ondulaciones de campos de dunas eólicas
    const duneCoord = x * cosDune + y * sinDune;
    z += Math.sin(duneCoord * duneFreq) * duneAmp;

    // 2. Colinas o mesetas aisladas
    for (const h of hills) {
      const dh = Math.hypot(x - h.x, y - h.y);
      if (dh < h.radius * 2.0) {
        z += Math.exp(-Math.pow(dh / (h.radius * 0.85), 2)) * h.height;
      }
    }

    // 3. Cráteres de impacto circular con borde elevado
    for (const c of craters) {
      const dc = Math.hypot(x - c.x, y - c.y);
      if (dc < c.radius * 1.8) {
        if (dc < c.radius) {
          z -= Math.cos((dc / c.radius) * (Math.PI / 2)) * c.depth;
        } else {
          const rimD = Math.abs(dc - c.radius);
          z += Math.exp(-Math.pow(rimD / 3.8, 2)) * c.rimH;
        }
      }
    }

    // 4. Valle o cañón excavado navegable
    if (hasValley) {
      const vX = x - startX;
      const vY = y - startY;
      const perpAlong = vX * perpX + vY * perpY;
      const dValley = Math.abs(perpAlong - valleyOffset);
      if (dValley < 24) {
        z -= Math.exp(-Math.pow(dValley / 11, 2)) * valleyDepth;
      }
    }

    // Garantizar que tanto el inicio como la meta se asienten en terreno suave y llano
    const distToStart = Math.hypot(x - startX, y - startY);
    if (distToStart < 14) {
      const flatten = Math.exp(-Math.pow(distToStart / 7, 2));
      z = z * (1 - flatten) + 0.5 * flatten;
    }
    const distToTarget = Math.hypot(x - targetX, y - targetY);
    if (distToTarget < 14) {
      const flatten = Math.exp(-Math.pow(distToTarget / 7, 2));
      z = z * (1 - flatten) + 0.0 * flatten;
    }

    return z;
  };

  const eps = 0.25;
  const gradientAt = (x: number, y: number) => {
    const zX1 = elevationAt(Math.min(MAP_SIZE + 30, x + eps), y);
    const zX0 = elevationAt(Math.max(-30, x - eps), y);
    const zY1 = elevationAt(x, Math.min(MAP_SIZE + 30, y + eps));
    const zY0 = elevationAt(x, Math.max(-30, y - eps));

    const gx = (zX1 - zX0) / (2 * eps);
    const gy = (zY1 - zY0) / (2 * eps);
    const slope = Math.hypot(gx, gy);
    const slopeDeg = (Math.atan(slope) * 180) / Math.PI;

    return { gx, gy, slopeDeg };
  };

  const surfaceNormalAt = (x: number, y: number): [number, number, number] => {
    const { gx, gy } = gradientAt(x, y);
    const len = Math.hypot(-gx, 1.0, -gy) || 1;
    return [-gx / len, 1.0 / len, -gy / len];
  };

  const gravityForceAt = (x: number, y: number, mass: number) => {
    const { gx, gy, slopeDeg } = gradientAt(x, y);
    const slopeLen = Math.hypot(gx, gy);
    if (slopeLen < 0.001) {
      return { fx: 0, fy: 0, slopeDeg: 0 };
    }
    const sinAlpha = slopeLen / Math.sqrt(1 + slopeLen * slopeLen);
    const totalDownhillForce = mass * MARS_GRAVITY * sinAlpha;

    const fx = -totalDownhillForce * (gx / slopeLen);
    const fy = -totalDownhillForce * (gy / slopeLen);

    return { fx, fy, slopeDeg };
  };

  const isHazard = (x: number, y: number): boolean => {
    const { slopeDeg } = gradientAt(x, y);
    return slopeDeg > 32;
  };

  const frictionAt = (x: number, y: number): number => {
    const { slopeDeg } = gradientAt(x, y);
    if (slopeDeg > 20) return 0.16;
    if (slopeDeg > 10) return 0.22;
    return 0.28;
  };

  const contourLevels: number[] = [];
  for (let lvl = -8; lvl <= 18; lvl += 2.5) {
    contourLevels.push(lvl);
  }

  // 5. Rocas y peñascos marcianos (obstáculos físicos 3D y dificultad)
  const rocks: MarsRock[] = [];
  const targetRockCount = 52;
  let rockIdCounter = 1;

  for (let attempt = 0; attempt < 300 && rocks.length < targetRockCount; attempt++) {
    let rx = 10 + rand() * (MAP_SIZE - 20);
    let ry = 10 + rand() * (MAP_SIZE - 20);

    // Mayor probabilidad de colocar rocas en el área entre el inicio y el destino para crear navegación y dificultad
    if (rand() > 0.4) {
      const t = 0.15 + rand() * 0.70; // 15% a 85% a lo largo del camino
      const pathX = startX + dirX * (t * pathLen);
      const pathY = startY + dirY * (t * pathLen);
      const lateralDisp = (rand() - 0.5) * 48; // Dispersión lateral de hasta 24m
      rx = Math.max(8, Math.min(MAP_SIZE - 8, pathX + perpX * lateralDisp));
      ry = Math.max(8, Math.min(MAP_SIZE - 8, pathY + perpY * lateralDisp));
    }

    // Comprobar distancias mínimas al inicio y meta
    if (Math.hypot(rx - startX, ry - startY) < 14) continue;
    if (Math.hypot(rx - targetX, ry - targetY) < 12) continue;

    const rRadius = 0.9 + rand() * 1.1; // Radio de 0.9m a 2.0m
    const rHeight = 0.8 + rand() * 1.1; // Altura de 0.8m a 1.9m

    // Evitar solapamiento entre rocas y dejar paso holgado para el rover
    const overlaps = rocks.some(
      other => Math.hypot(rx - other.x, ry - other.y) < rRadius + other.radius + 2.2
    );
    if (overlaps) continue;

    rocks.push({
      id: rockIdCounter++,
      x: rx,
      y: ry,
      radius: Math.round(rRadius * 10) / 10,
      height: Math.round(rHeight * 10) / 10,
      rotation: rand() * Math.PI * 2,
      colorSeed: 0.85 + rand() * 0.3,
      shapeSeed: rand(),
    });
  }

  return {
    seed,
    sectorName: scenario.name,
    biome: scenario.biome,
    centerLat: scenario.centerLat,
    centerLon: scenario.centerLon,
    nasaTileUrl: scenario.nasaTileUrl,
    startPos: { x: Math.round(startX), y: Math.round(startY), heading: initialHeadingDeg },
    targetPos: { x: Math.round(targetX), y: Math.round(targetY) },
    mapWidth: MAP_SIZE,
    mapHeight: MAP_SIZE,
    rocks,
    elevationAt,
    gradientAt,
    gravityForceAt,
    surfaceNormalAt,
    isHazard,
    frictionAt,
    contourLevels,
  };
}

/**
 * Convierte coordenadas métricas locales del rover (X, Y)
 * a coordenadas orbitales geográficas reales de Marte (Latitud y Longitud)
 */
export function calculateMarsCoordinates(
  posX: number,
  posY: number,
  centerLat: number,
  centerLon: number
): { lat: number; lon: number; formatted: string } {
  // Radio medio de Marte: ~3.389.500m -> 1° latitud ≈ 59.158m
  const METERS_PER_DEG_LAT = 59158;
  const deltaLat = (MAP_SIZE / 2 - posY) / METERS_PER_DEG_LAT;
  const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1;
  const deltaLon = (posX - MAP_SIZE / 2) / (METERS_PER_DEG_LAT * Math.abs(cosLat));

  const lat = centerLat + deltaLat;
  const lon = ((centerLon + deltaLon) % 360 + 360) % 360;

  const latCard = lat >= 0 ? 'N' : 'S';
  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMinFloat = (absLat - latDeg) * 60;
  const latMin = Math.floor(latMinFloat);
  const latSec = ((latMinFloat - latMin) * 60).toFixed(1);

  const lonCard = lon <= 180 ? 'E' : 'O';
  const displayLon = lon <= 180 ? lon : 360 - lon;
  const lonDeg = Math.floor(displayLon);
  const lonMinFloat = (displayLon - lonDeg) * 60;
  const lonMin = Math.floor(lonMinFloat);
  const lonSec = ((lonMinFloat - lonMin) * 60).toFixed(1);

  const formatted = `${latDeg}°${latMin}'${latSec}" ${latCard}, ${lonDeg}°${lonMin}'${lonSec}" ${lonCard}`;
  return { lat, lon, formatted };
}
