export const SOLAR_CANVAS_WIDTH = 1200;
export const SOLAR_CANVAS_HEIGHT = 420;

export interface SolarSceneLayout {
  scale: number;
  vw: number;
  vh: number;
  baseX: number;
  baseOffset: number;
  groundY: number;
  baseCenterY: number;
  canopyR: number;
}

/**
 * Calcula un sistema de coordenadas virtuales con escala 1:1 uniforme para que
 * el Sol, la cúpula, la base y los arcos mantengan sus proporciones exactas en
 * pantalla completa o ventanas estrechas/bajas sin deformarse.
 */
export function getSolarSceneLayout(viewWidth: number, viewHeight: number): SolarSceneLayout {
  const safeW = Math.max(1, viewWidth);
  const safeH = Math.max(1, viewHeight);
  const scale = Math.min(safeW / SOLAR_CANVAS_WIDTH, safeH / SOLAR_CANVAS_HEIGHT);
  const vw = safeW / scale;
  const vh = safeH / scale;
  const groundY = vh - 55;
  const baseX = vw / 2;

  return {
    scale,
    vw,
    vh,
    baseX,
    baseOffset: baseX - 340,
    groundY,
    baseCenterY: groundY - 14,
    canopyR: 138,
  };
}
