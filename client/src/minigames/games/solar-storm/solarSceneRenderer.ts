import type { SolarStormData } from './SolarStormEngine';
import type { SolarSceneLayout } from './solarLayout';

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RingShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface DrawSceneParams {
  ctx: CanvasRenderingContext2D;
  layout: SolarSceneLayout;
  data: SolarStormData;
  tick: number;
  sparks: Spark[];
  rings: RingShockwave[];
  floatingTexts: FloatingText[];
}

export function drawSolarStormScene({
  ctx,
  layout,
  data,
  tick,
  sparks,
  rings,
  floatingTexts,
}: DrawSceneParams): void {
  drawMartianSky(ctx, layout, tick);
  drawSunAndPhobos(ctx, layout, data, tick);
  drawMartianTerrain(ctx, layout, tick);
  drawMarsBase(ctx, layout, data, tick);
  drawDeflectorShield(ctx, layout, data, tick);
  drawIncomingWavesAndIons(ctx, layout, data, tick);
  drawTransientEffects(ctx, layout, sparks, rings, floatingTexts);
}

function drawMartianSky(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  tick: number
): void {
  const { vw: w, vh: h, groundY } = layout;

  // Palette inspired by base_marte_defensa.svg (#001337 -> #1d1a47 -> #5d2b6b)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY + 4);
  skyGrad.addColorStop(0, '#001337');
  skyGrad.addColorStop(0.55, '#1d1a47');
  skyGrad.addColorStop(1, '#5d2b6b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle warm horizon band right behind mountain silhouettes
  const horizonGlow = ctx.createLinearGradient(0, groundY - 95, 0, groundY + 4);
  horizonGlow.addColorStop(0, 'rgba(194, 72, 35, 0)');
  horizonGlow.addColorStop(1, 'rgba(194, 72, 35, 0.22)');
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, groundY - 95, w, 99);

  // Crisp retro-NASA cream-white starfield (#faf6ee)
  const maxStarY = Math.max(50, groundY - 82);
  for (let i = 0; i < 64; i++) {
    const sx = (((i * 137 + 29) % 997) / 997) * w;
    const sy = (((i * 73 + 19) % 401) / 401) * maxStarY;
    const twinkle = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(tick * 1.6 + i * 1.7));
    const r = i % 9 === 0 ? 1.8 : i % 3 === 0 ? 1.3 : 0.9;
    ctx.fillStyle = `rgba(250, 246, 238, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSunAndPhobos(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  data: SolarStormData,
  tick: number
): void {
  const { vw: w, groundY } = layout;

  // Sun positioned cleanly in upper-left sky with circular corona & solar flares
  const sunX = Math.round(w * 0.11);
  const sunY = Math.max(64, Math.round(groundY * 0.17));
  const sunRadius = 18;
  const stormIntensity = data.activeAlertWave ? 1.25 : 1.0;

  ctx.save();
  // Outer solar corona bloom
  const corona = ctx.createRadialGradient(
    sunX,
    sunY,
    sunRadius * 0.6,
    sunX,
    sunY,
    92 * stormIntensity
  );
  corona.addColorStop(0, 'rgba(254, 240, 138, 0.88)');
  corona.addColorStop(0.22, 'rgba(251, 146, 60, 0.42)');
  corona.addColorStop(0.52, 'rgba(234, 88, 12, 0.16)');
  corona.addColorStop(1, 'transparent');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 92 * stormIntensity, 0, Math.PI * 2);
  ctx.fill();

  // Subtle rotating solar rays
  for (let i = 0; i < 8; i++) {
    const ang = tick * 0.22 + (i * Math.PI) / 4;
    const innerR = sunRadius + 4;
    const outerR = sunRadius + (i % 2 === 0 ? 34 : 24) * stormIntensity;
    const rayGrad = ctx.createLinearGradient(
      sunX + Math.cos(ang) * innerR,
      sunY + Math.sin(ang) * innerR,
      sunX + Math.cos(ang) * outerR,
      sunY + Math.sin(ang) * outerR
    );
    rayGrad.addColorStop(0, 'rgba(253, 224, 71, 0.5)');
    rayGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.strokeStyle = rayGrad;
    ctx.lineWidth = i % 2 === 0 ? 3.5 : 2;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(ang) * innerR, sunY + Math.sin(ang) * innerR);
    ctx.lineTo(sunX + Math.cos(ang) * outerR, sunY + Math.sin(ang) * outerR);
    ctx.stroke();
  }

  // Solar prominences / plasma loops erupting around the limb
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
  ctx.lineWidth = 2.2;
  for (let p = 0; p < 3; p++) {
    const baseAng = 0.4 + p * 2.1 + Math.sin(tick * 0.7 + p) * 0.12;
    const a1 = baseAng - 0.28;
    const a2 = baseAng + 0.28;
    const x1 = sunX + Math.cos(a1) * (sunRadius - 1);
    const y1 = sunY + Math.sin(a1) * (sunRadius - 1);
    const x2 = sunX + Math.cos(a2) * (sunRadius - 1);
    const y2 = sunY + Math.sin(a2) * (sunRadius - 1);
    const cx = sunX + Math.cos(baseAng) * (sunRadius + 13 + Math.sin(tick * 2 + p) * 3);
    const cy = sunY + Math.sin(baseAng) * (sunRadius + 13 + Math.sin(tick * 2 + p) * 3);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cx, cy, x2, y2);
    ctx.stroke();
  }

  // Photosphere core gradient
  const discGrad = ctx.createRadialGradient(
    sunX - 4,
    sunY - 4,
    2,
    sunX,
    sunY,
    sunRadius
  );
  discGrad.addColorStop(0, '#ffffff');
  discGrad.addColorStop(0.45, '#fef08a');
  discGrad.addColorStop(0.8, '#f59e0b');
  discGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = discGrad;
  ctx.strokeStyle = '#1a1d20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawMartianTerrain(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  _tick: number
): void {
  const { vw: w, vh: h, groundY } = layout;
  const ink = '#1a1d20';

  ctx.save();

  // 1. Far Martian mountain range (#2d120b with crisp #1a1d20 stroke)
  ctx.fillStyle = '#2d120b';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(0, groundY - 36);
  ctx.bezierCurveTo(w * 0.03, groundY - 68, w * 0.05, groundY - 102, w * 0.08, groundY - 110);
  ctx.bezierCurveTo(w * 0.11, groundY - 118, w * 0.145, groundY - 86, w * 0.18, groundY - 86);
  ctx.bezierCurveTo(w * 0.215, groundY - 87, w * 0.235, groundY - 116, w * 0.295, groundY - 112);
  ctx.bezierCurveTo(w * 0.35, groundY - 82, w * 0.375, groundY - 84, w * 0.4, groundY - 74);
  ctx.bezierCurveTo(w * 0.43, groundY - 64, w * 0.48, groundY - 96, w * 0.52, groundY - 95);
  ctx.bezierCurveTo(w * 0.56, groundY - 93, w * 0.605, groundY - 62, w * 0.65, groundY - 66);
  ctx.bezierCurveTo(w * 0.695, groundY - 70, w * 0.74, groundY - 116, w * 0.78, groundY - 118);
  ctx.bezierCurveTo(w * 0.82, groundY - 120, w * 0.845, groundY - 76, w * 0.88, groundY - 78);
  ctx.bezierCurveTo(w * 0.92, groundY - 80, w * 0.96, groundY - 106, w, groundY - 112);
  ctx.lineTo(w, groundY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 2. Mid Martian ridge (#4a1c10 with crisp 2.5px #1a1d20 stroke)
  ctx.fillStyle = '#4a1c10';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  ctx.lineTo(w * 0.036, groundY - 14);
  ctx.bezierCurveTo(w * 0.06, groundY - 40, w * 0.085, groundY - 62, w * 0.12, groundY - 64);
  ctx.bezierCurveTo(w * 0.16, groundY - 66, w * 0.215, groundY - 34, w * 0.26, groundY - 35);
  ctx.bezierCurveTo(w * 0.305, groundY - 36, w * 0.34, groundY - 48, w * 0.38, groundY - 47);
  ctx.bezierCurveTo(w * 0.425, groundY - 46, w * 0.465, groundY - 30, w * 0.51, groundY - 30);
  ctx.bezierCurveTo(w * 0.56, groundY - 31, w * 0.62, groundY - 61, w * 0.67, groundY - 62);
  ctx.bezierCurveTo(w * 0.72, groundY - 63, w * 0.775, groundY - 36, w * 0.82, groundY - 35);
  ctx.bezierCurveTo(w * 0.86, groundY - 34, w * 0.9, groundY - 68, w * 0.93, groundY - 69);
  ctx.bezierCurveTo(w * 0.955, groundY - 70, w * 0.985, groundY - 56, w, groundY - 44);
  ctx.lineTo(w, groundY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Foreground Martian regolith plane (#c24823 with bold #1a1d20 horizon border)
  ctx.fillStyle = '#c24823';
  ctx.fillRect(0, groundY, w, h - groundY);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  // Subtle darker floor band at very bottom for depth while preserving vector clarity
  const floorShade = ctx.createLinearGradient(0, groundY, 0, h);
  floorShade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  floorShade.addColorStop(1, 'rgba(45, 18, 11, 0.25)');
  ctx.fillStyle = floorShade;
  ctx.fillRect(0, groundY + 2, w, h - groundY - 2);

  // Outlined Martian surface craters matching base_marte_defensa.svg (#8e3013 + #1a1d20)
  const craterSpecs = [
    [0.06, 0.3, 14, 4],
    [0.14, 0.64, 18, 5],
    [0.23, 0.25, 16, 4.5],
    [0.31, 0.54, 14, 4],
    [0.43, 0.78, 20, 5],
    [0.63, 0.54, 16, 4.5],
    [0.78, 0.35, 18, 5],
    [0.88, 0.64, 15, 4],
    [0.96, 0.25, 12, 3.5],
  ] as const;

  const floorH = Math.max(32, h - groundY);
  ctx.fillStyle = '#8e3013';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.5;
  for (const [xf, yf, rx, ry] of craterSpecs) {
    const cx = w * xf;
    const cy = groundY + Math.min(floorH - 6, Math.max(8, floorH * yf));
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws a triangulated geodesic hemisphere matching the exact vector truss pattern
 * from base_marte_defensa.svg, scaled cleanly around (cx, cy).
 */
function drawGeodesicDome(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scaleX: number,
  scaleY: number,
  fill: string,
  interiorTint: string | null
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, scaleY);

  // Main dome fill
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(0, 0, 130, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  if (interiorTint) {
    const tint = ctx.createRadialGradient(0, -35, 6, 0, -25, 125);
    tint.addColorStop(0, interiorTint);
    tint.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.arc(0, 0, 130, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  // Outer semicircle ink contour
  ctx.strokeStyle = '#1a1d20';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 132, Math.PI, 0);
  ctx.closePath();
  ctx.stroke();

  // Exact geodesic truss segments from base_marte_defensa.svg
  const trussSegments: Array<readonly [number, number, number, number]> = [
    [0, -132, -45, -124],
    [0, -132, 0, -95],
    [0, -132, 45, -124],
    [-85, -101, -45, -124],
    [-45, -124, 0, -95],
    [0, -95, 45, -124],
    [45, -124, 85, -101],
    [-85, -101, -38, -90],
    [-38, -90, 0, -95],
    [0, -95, 38, -90],
    [38, -90, 85, -101],
    [-115, -65, -70, -68],
    [-70, -68, -38, -90],
    [-38, -90, 0, -58],
    [0, -58, 38, -90],
    [38, -90, 70, -68],
    [70, -68, 115, -65],
    [-115, -65, -75, -30],
    [-70, -68, -75, -30],
    [-70, -68, 0, -58],
    [0, -58, -25, -25],
    [0, -58, 25, -25],
    [0, -58, 70, -68],
    [70, -68, 75, -30],
    [115, -65, 75, -30],
    [-132, 0, -115, -65],
    [-115, -65, -105, 0],
    [-75, -30, -60, 0],
    [-25, -25, -15, 0],
    [25, -25, 15, 0],
    [75, -30, 60, 0],
    [115, -65, 105, 0],
    [132, 0, 115, -65],
  ];

  ctx.lineWidth = 3;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of trussSegments) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  ctx.restore();
}

function drawMarsBase(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  data: SolarStormData,
  tick: number
): void {
  const { baseX, groundY } = layout;
  const critical = data.colonyIntegrity <= 20;
  const ink = '#1a1d20';

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Back-Right & Back-Left Geodesic Domes (all 3 domes matching base_marte_defensa.svg)
  drawGeodesicDome(
    ctx,
    baseX + 78,
    groundY,
    0.285,
    0.325,
    '#7a8087',
    critical ? 'rgba(239, 68, 68, 0.25)' : null
  );
  drawGeodesicDome(
    ctx,
    baseX - 72,
    groundY,
    0.32,
    0.36,
    '#7e848b',
    critical ? 'rgba(239, 68, 68, 0.25)' : null
  );

  // 2. Left Wing: Outlined Solar Panels + Cryo O2 Tanks connected into the center dome
  const solarX = baseX - 134;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(solarX - 12, groundY);
  ctx.lineTo(solarX - 12, groundY - 21);
  ctx.moveTo(solarX + 10, groundY);
  ctx.lineTo(solarX + 10, groundY - 21);
  ctx.stroke();

  for (const offset of [-12, 10]) {
    ctx.save();
    ctx.translate(solarX + offset, groundY - 23);
    ctx.rotate(-0.32);
    ctx.fillStyle = '#1e3a8a';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-13, -6.5, 26, 13, 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -5.5);
    ctx.lineTo(-4, 5.5);
    ctx.moveTo(4, -5.5);
    ctx.lineTo(4, 5.5);
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Vertical O2 Tanks standing in front of Left Dome (matching base_marte_defensa.svg)
  const tankAnchorX = baseX - 88;
  ctx.fillStyle = '#cfd8dc';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(tankAnchorX, groundY - 35, 18, 35, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#90a4ae';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tankAnchorX + 3, groundY - 27);
  ctx.lineTo(tankAnchorX + 15, groundY - 27);
  ctx.stroke();

  ctx.fillStyle = '#b0bec5';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(tankAnchorX + 22, groundY - 29, 16, 29, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#78909c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tankAnchorX + 25, groundY - 22);
  ctx.lineTo(tankAnchorX + 35, groundY - 22);
  ctx.stroke();

  // Connecting pipe from O2 tanks to Center Dome
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tankAnchorX + 38, groundY - 15);
  ctx.lineTo(baseX - 42, groundY - 15);
  ctx.stroke();

  // 3. Right Wing (drawn before Center Dome just like SVG): Tight connector + 3-window Lab
  ctx.fillStyle = '#faf6ee';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(baseX + 28, groundY - 18, 36, 18, 4);
  ctx.fill();
  ctx.stroke();

  const labX = baseX + 56;
  ctx.fillStyle = '#faf6ee';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(labX, groundY - 29, 50, 29, 5);
  ctx.fill();
  ctx.stroke();

  // 3 Lab windows from SVG
  for (let i = 0; i < 3; i++) {
    const wx = labX + 8 + i * 13;
    ctx.fillStyle = critical && Math.sin(tick * 10) > 0 ? '#ef4444' : '#808080';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(wx, groundY - 22, 8, 8, 1.5);
    ctx.fill();
    ctx.stroke();
  }

  // 4. Centerpiece Main Geodesic Dome (drawn last on top, clean truss pattern without green door box)
  drawGeodesicDome(
    ctx,
    baseX,
    groundY,
    0.35,
    0.4,
    '#8c9299',
    critical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(254, 240, 138, 0.14)'
  );

  ctx.restore();
}

function drawDeflectorShield(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  data: SolarStormData,
  tick: number
): void {
  const { baseX, baseCenterY, canopyR } = layout;

  const centerRad = ((data.shieldAngle - 180) * Math.PI) / 180;
  const spanRad = (data.shieldWidthDeg * Math.PI) / 180;
  const arcCenterCanvas = -Math.PI / 2 + centerRad;
  const startAngle = arcCenterCanvas - spanRad / 2;
  const endAngle = arcCenterCanvas + spanRad / 2;

  ctx.save();
  // Faint orbital track arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(baseX, baseCenterY, canopyR, -Math.PI + 0.35, -0.35);
  ctx.stroke();
  ctx.setLineDash([]);

  // Soft translucent projection cone from dome projector to shield edges
  const p1X = baseX + Math.cos(startAngle) * canopyR;
  const p1Y = baseCenterY + Math.sin(startAngle) * canopyR;
  const p2X = baseX + Math.cos(endAngle) * canopyR;
  const p2Y = baseCenterY + Math.sin(endAngle) * canopyR;

  const coneGrad = ctx.createRadialGradient(baseX, baseCenterY - 22, 18, baseX, baseCenterY, canopyR);
  if (data.isBoosting) {
    coneGrad.addColorStop(0, 'rgba(192, 132, 252, 0.02)');
    coneGrad.addColorStop(0.75, 'rgba(168, 85, 247, 0.14)');
    coneGrad.addColorStop(1, 'rgba(254, 240, 138, 0.22)');
  } else {
    coneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.01)');
    coneGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.08)');
    coneGrad.addColorStop(1, 'rgba(125, 211, 252, 0.16)');
  }
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(baseX, baseCenterY - 20);
  ctx.lineTo(p1X, p1Y);
  ctx.arc(baseX, baseCenterY, canopyR, startAngle, endAngle);
  ctx.closePath();
  ctx.fill();

  // Main magnetic deflector shield arc
  if (data.isBoosting) {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 9;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 24;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(baseX, baseCenterY, canopyR, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(baseX, baseCenterY, canopyR + 4, startAngle, endAngle);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(baseX, baseCenterY, canopyR, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(baseX, baseCenterY, canopyR + 2, startAngle, endAngle);
    ctx.stroke();
  }

  // Emitter nodes at shield endpoints + center reticle
  ctx.shadowBlur = 0;
  ctx.fillStyle = data.isBoosting ? '#fef08a' : '#e0f2fe';
  for (const [nx, ny] of [
    [p1X, p1Y],
    [p2X, p2Y],
  ]) {
    ctx.beginPath();
    ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tipX = baseX + Math.cos(arcCenterCanvas) * (canopyR + 9);
  const tipY = baseCenterY + Math.sin(arcCenterCanvas) * (canopyR + 9);
  ctx.fillStyle = data.isBoosting ? '#fef08a' : '#38bdf8';
  ctx.beginPath();
  ctx.arc(tipX, tipY, 4 + Math.sin(tick * 6) * 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawIncomingWavesAndIons(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  data: SolarStormData,
  tick: number
): void {
  const { baseX, baseCenterY, canopyR } = layout;

  for (const wave of data.waves) {
    if (wave.status !== 'in_flight') continue;

    const targetDeg = wave.template.approachAngleDeg;
    const targetRad = ((targetDeg - 180) * Math.PI) / 180;
    const canopyHitX = baseX + Math.sin(targetRad) * canopyR;
    const canopyHitY = baseCenterY - Math.cos(targetRad) * canopyR;
    const skyX = baseX + Math.sin(targetRad) * (canopyR + 250);
    const skyY = 15;

    const p = wave.flightProgress;
    const curX = skyX + p * (canopyHitX - skyX);
    const curY = skyY + p * (canopyHitY - skyY);

    const dx = canopyHitX - skyX;
    const dy = canopyHitY - skyY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    // Faint trajectory guide along flight path
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(canopyHitX, canopyHitY);
    ctx.stroke();
    ctx.setLineDash([]);

    const tailLen = Math.min(64, p * 90);
    const tailX = curX - ux * tailLen;
    const tailY = curY - uy * tailLen;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, curX, curY);
    tailGrad.addColorStop(0, 'transparent');
    tailGrad.addColorStop(1, wave.template.color);

    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = wave.template.type === 'CME' ? 7.5 : wave.template.type === 'FLR' ? 5.5 : 4.2;
    ctx.shadowColor = wave.template.color;
    ctx.shadowBlur = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curX - ux * (tailLen * 0.45), curY - uy * (tailLen * 0.45));
    ctx.lineTo(curX, curY);
    ctx.stroke();

    const pointR = wave.template.type === 'CME' ? 7 : 5.5;
    ctx.fillStyle = wave.template.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(curX, curY, pointR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(curX + ux * 1.5, curY + uy * 1.5, pointR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const ion of data.ionOrbs) {
    if (ion.collected || ion.flightProgress <= 0 || ion.flightProgress >= 1.0) continue;
    const p = ion.flightProgress;
    const targetRad = ((ion.approachAngleDeg - 180) * Math.PI) / 180;
    const canopyHitX = baseX + Math.sin(targetRad) * canopyR;
    const canopyHitY = baseCenterY - Math.cos(targetRad) * canopyR;
    const skyX = baseX + Math.sin(targetRad) * (canopyR + 220);
    const skyY = 20;

    const curX = skyX + p * (canopyHitX - skyX);
    const curY = skyY + p * (canopyHitY - skyY);
    const orbR = 6.5 + Math.sin(tick * 8) * 1.0;

    ctx.save();
    // Rotating outer containment ring
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(curX, curY, orbR + 4, tick * 2, tick * 2 + Math.PI * 1.35);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#ecfdf5';
    ctx.lineWidth = 1.4;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(curX, curY, orbR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(curX - 3, curY);
    ctx.lineTo(curX + 3, curY);
    ctx.moveTo(curX, curY - 3);
    ctx.lineTo(curX, curY + 3);
    ctx.stroke();
    ctx.restore();
  }
}

function drawTransientEffects(
  ctx: CanvasRenderingContext2D,
  layout: SolarSceneLayout,
  sparks: Spark[],
  rings: RingShockwave[],
  floatingTexts: FloatingText[]
): void {
  const { baseX, baseCenterY } = layout;

  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.radius += 4.0;
    r.alpha -= 0.035;

    if (r.alpha <= 0 || r.radius >= r.maxRadius) {
      rings.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = Math.max(0, r.alpha);
    ctx.beginPath();
    ctx.arc(baseX + r.x, baseCenterY + r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.life++;

    const alpha = 1.0 - s.life / s.maxLife;
    if (s.life >= s.maxLife || alpha <= 0) {
      sparks.splice(i, 1);
      continue;
    }

    ctx.fillStyle = s.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.beginPath();
    ctx.arc(baseX + s.x, baseCenterY + s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.life++;
    t.y -= 0.8;

    const alpha = 1.0 - t.life / t.maxLife;
    if (t.life >= t.maxLife || alpha <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = t.color;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillText(t.text, baseX + t.x, baseCenterY + t.y);
    ctx.restore();
  }
}
