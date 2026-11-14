import { useEffect, useRef } from 'react';
import type { GameView, PublicPlayer } from '../../../shared/types';
import { resolvePlayerSuitColor } from './AstronautPortraitSvg';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Projected {
  x: number;
  y: number;
  depth: number;
  scale: number;
}

interface Face {
  points: Vec3[];
  fill: string;
  stroke?: string;
  lineWidth?: number;
}

const CREW_SLOTS: readonly Vec3[] = [
  { x: -1.35, y: 0, z: 1.55 },
  { x: 1.35, y: 0, z: 1.5 },
  { x: -2.0, y: 0, z: -0.95 },
  { x: 2.05, y: 0, z: -0.9 },
];

const STARS = Array.from({ length: 140 }, (_, i) => ({
  angle: ((i * 137.5) % 360) * (Math.PI / 180),
  y: ((i * 41 + 7) % 52) / 100,
  r: (i % 3) * 0.55 + 0.55,
  alpha: 0.3 + ((i * 17) % 65) / 100,
}));

const CRATERS: readonly { x: number; z: number; r: number }[] = [
  { x: -4.2, z: 2.6, r: 0.9 },
  { x: 4.5, z: 2.1, r: 1.15 },
  { x: -3.8, z: -3.2, r: 1.3 },
  { x: 3.4, z: -3.8, r: 0.8 },
  { x: 0.4, z: 4.1, r: 0.7 },
  { x: -5.4, z: -0.4, r: 0.95 },
];

function buildBaseFaces(): Face[] {
  const faces: Face[] = [];

  // Outer foundation ring & inner landing deck
  addDisc(faces, 0, 0.01, 0, 2.55, 16, 'rgba(34, 24, 22, 0.85)', 'rgba(245, 156, 66, 0.25)');
  addDisc(faces, 0, 0.03, 0, 1.85, 16, 'rgba(38, 46, 58, 0.92)', 'rgba(255, 196, 128, 0.45)');

  // Left Life-Support & Hydroponics Wing
  addBox(faces, -2.55, 0, -0.2, 1.35, 0.76, 0.96, '#27384b', '#33485f', '#1c2938', 'rgba(115, 212, 194, 0.58)');
  addBox(faces, -1.6, 0, -0.15, 0.72, 0.44, 0.46, '#2d3b4d', '#3a4c62', '#1f2b39', 'rgba(145, 237, 201, 0.45)');
  // Hydroponics glowing window strip
  addBox(faces, -2.55, 0.26, 0.29, 0.85, 0.22, 0.04, '#6ae0c4', '#91edc9', '#45b89d', 'rgba(190, 255, 238, 0.8)');

  // Right Engineering & Comms Wing
  addBox(faces, 2.35, 0, -0.15, 1.18, 0.6, 0.88, '#263445', '#34475c', '#1c2633', 'rgba(245, 156, 66, 0.5)');
  addBox(faces, 1.55, 0, -0.12, 0.68, 0.42, 0.44, '#2d3a4b', '#38485c', '#202b38', 'rgba(245, 156, 66, 0.4)');
  // Comms mast
  addBox(faces, 2.55, 0.6, -0.25, 0.08, 0.85, 0.08, '#8fa3b8', '#b8cbe0', '#5a6b7d', 'rgba(220, 235, 250, 0.6)');

  // Solar farm panels on the right
  for (const zOff of [-1.25, 0.95]) {
    addBox(faces, 2.5, 0, zOff, 0.14, 0.35, 0.14, '#394657', '#4b5a6e', '#26303d', 'rgba(130, 170, 210, 0.4)');
    faces.push({
      points: [
        { x: 1.88, y: 0.32, z: zOff - 0.38 },
        { x: 3.22, y: 0.8, z: zOff - 0.38 },
        { x: 3.22, y: 0.8, z: zOff + 0.38 },
        { x: 1.88, y: 0.32, z: zOff + 0.38 },
      ],
      fill: 'rgba(34, 88, 138, 0.92)',
      stroke: 'rgba(138, 216, 255, 0.72)',
      lineWidth: 1.2,
    });
  }

  // Front airlock & lit entryway
  addBox(faces, 0, 0, 1.32, 0.78, 0.64, 0.66, '#324052', '#425369', '#232e3d', 'rgba(255, 194, 118, 0.75)');
  addBox(faces, 0, 0.06, 1.66, 0.36, 0.42, 0.04, '#ffbe6b', '#ffdba8', '#d98c3b', 'rgba(255, 232, 196, 0.9)');

  // Mars Rover parked near front-right
  addBox(faces, 1.15, 0.14, 2.15, 0.68, 0.28, 0.46, '#9c563c', '#bd6e4f', '#6b3826', 'rgba(255, 208, 158, 0.6)');
  addBox(faces, 1.32, 0.42, 2.15, 0.14, 0.22, 0.14, '#cad6e2', '#eef5fc', '#8ca0b5', 'rgba(255, 255, 255, 0.65)');

  // Glowing inner core inside the geodesic dome
  const coreRings = 3;
  const coreSlices = 10;
  for (let r = 0; r < coreRings; r++) {
    const phi1 = (r / coreRings) * (Math.PI / 2);
    const phi2 = ((r + 1) / coreRings) * (Math.PI / 2);
    for (let s = 0; s < coreSlices; s++) {
      const th1 = (s / coreSlices) * Math.PI * 2;
      const th2 = ((s + 1) / coreSlices) * Math.PI * 2;
      faces.push({
        points: [
          spherePt(0.75, phi1, th1),
          spherePt(0.75, phi1, th2),
          spherePt(0.75, phi2, th2),
          spherePt(0.75, phi2, th1),
        ],
        fill: 'rgba(255, 176, 84, 0.45)',
      });
    }
  }

  // Geodesic dome outer glass + warm ribs
  const rings = 5;
  const slices = 16;
  const radius = 1.42;
  for (let r = 0; r < rings; r++) {
    const phi1 = (r / rings) * (Math.PI / 2);
    const phi2 = ((r + 1) / rings) * (Math.PI / 2);
    for (let s = 0; s < slices; s++) {
      const th1 = (s / slices) * Math.PI * 2;
      const th2 = ((s + 1) / slices) * Math.PI * 2;
      const warmth = 0.24 + (1 - r / rings) * 0.34;
      faces.push({
        points: [
          spherePt(radius, phi1, th1),
          spherePt(radius, phi1, th2),
          spherePt(radius, phi2, th2),
          spherePt(radius, phi2, th1),
        ],
        fill: `rgba(245, 152, 62, ${warmth.toFixed(2)})`,
        stroke: 'rgba(255, 218, 168, 0.64)',
        lineWidth: 1,
      });
    }
  }

  return faces;
}

function addDisc(faces: Face[], cx: number, y: number, cz: number, radius: number, segs: number, fill: string, stroke: string) {
  const pts: Vec3[] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * radius, y, z: cz + Math.sin(a) * radius });
  }
  faces.push({ points: pts, fill, stroke, lineWidth: 1.3 });
}

function spherePt(radius: number, phi: number, theta: number): Vec3 {
  return {
    x: radius * Math.cos(phi) * Math.cos(theta),
    y: radius * Math.sin(phi),
    z: radius * Math.cos(phi) * Math.sin(theta),
  };
}

function addBox(
  faces: Face[],
  cx: number,
  y0: number,
  cz: number,
  w: number,
  h: number,
  d: number,
  frontFill: string,
  topFill: string,
  sideFill: string,
  stroke: string,
) {
  const hw = w / 2;
  const hd = d / 2;
  const y1 = y0 + h;
  const b0 = { x: cx - hw, y: y0, z: cz - hd };
  const b1 = { x: cx + hw, y: y0, z: cz - hd };
  const b2 = { x: cx + hw, y: y0, z: cz + hd };
  const b3 = { x: cx - hw, y: y0, z: cz + hd };
  const t0 = { x: cx - hw, y: y1, z: cz - hd };
  const t1 = { x: cx + hw, y: y1, z: cz - hd };
  const t2 = { x: cx + hw, y: y1, z: cz + hd };
  const t3 = { x: cx - hw, y: y1, z: cz + hd };

  faces.push(
    { points: [t0, t1, t2, t3], fill: topFill, stroke, lineWidth: 1 },
    { points: [b3, b2, t2, t3], fill: frontFill, stroke, lineWidth: 1 },
    { points: [b0, b1, t1, t0], fill: sideFill, stroke, lineWidth: 1 },
    { points: [b1, b2, t2, t1], fill: sideFill, stroke, lineWidth: 1 },
    { points: [b0, b3, t3, t0], fill: frontFill, stroke, lineWidth: 1 },
  );
}

const BASE_FACES = buildBaseFaces();

export default function MarsBase3D({ game, autoOrbit = true }: { game: GameView; autoOrbit?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;

  const cameraRef = useRef({
    yaw: 0.55,
    pitch: 0.36,
    distance: 5.5,
    autoOrbit,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    cameraRef.current.autoOrbit = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();

    const project = (pt: Vec3, width: number, height: number): Projected | null => {
      const { yaw, pitch, distance } = cameraRef.current;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      const x1 = pt.x * cosY - pt.z * sinY;
      const z1 = pt.x * sinY + pt.z * cosY;
      const y1 = pt.y - 0.55;

      const y2 = y1 * cosP + z1 * sinP;
      const z2 = -y1 * sinP + z1 * cosP + distance;

      if (z2 <= 0.4) return null;
      const fov = Math.min(width, height) * 1.12;
      const scale = fov / z2;
      return {
        x: width * 0.5 + x1 * scale,
        y: height * 0.56 - y2 * scale,
        depth: z2,
        scale,
      };
    };

    const resize = () => {
      const container = canvas.parentElement ?? canvas;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement ?? canvas);

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (cameraRef.current.autoOrbit && !cameraRef.current.dragging) {
        cameraRef.current.yaw += dt * 0.14;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width;
      const height = canvas.height;
      const currentGame = gameRef.current;
      const { yaw, pitch } = cameraRef.current;
      const fov = Math.min(width, height) * 1.12;
      const horizonY = height * 0.56 - fov * Math.tan(pitch);

      // 1. Deep starry Mars night sky & distant mountains when horizon is visible
      if (horizonY > 0) {
        const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
        sky.addColorStop(0, '#05070c');
        sky.addColorStop(0.58, '#171117');
        sky.addColorStop(1, '#582c1a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, horizonY + 2);

        // Stars rotating smoothly with camera yaw
        for (const star of STARS) {
          const relAngle = ((star.angle - yaw) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          if (Math.abs(relAngle) > 1.35) continue;
          const sx = width * (0.5 + relAngle / 2.2);
          const sy = star.y * horizonY * 1.85;
          if (sy > horizonY) continue;
          const twinkle = 0.65 + 0.35 * Math.sin(now * 0.002 + star.angle * 7);
          ctx.fillStyle = `rgba(235, 242, 255, ${(star.alpha * twinkle).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, star.r * dpr, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Distant Martian mountain ridge panning with yaw
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        for (let px = 0; px <= width; px += Math.max(18, width / 40)) {
          const worldAngle = yaw + (px / width - 0.5) * 2.1;
          const ridgeH =
            (Math.sin(worldAngle * 3.1) * 0.5 +
              Math.cos(worldAngle * 6.7) * 0.3 +
              Math.sin(worldAngle * 11.3) * 0.2 +
              1) *
            height *
            0.036;
          ctx.lineTo(px, horizonY - ridgeH);
        }
        ctx.lineTo(width, horizonY + 2);
        ctx.closePath();
        ctx.fillStyle = '#2d1610';
        ctx.fill();
      }

      // 3. Full Martian ground plane from horizon to bottom
      const groundTop = Math.max(0, horizonY);
      const ground = ctx.createLinearGradient(0, horizonY, 0, height);
      ground.addColorStop(0, '#5a2818');
      ground.addColorStop(0.32, '#411b11');
      ground.addColorStop(1, '#180b08');
      ctx.fillStyle = ground;
      ctx.fillRect(0, groundTop, width, height - groundTop);

      // Warm atmospheric glow around the dome
      const center = project({ x: 0, y: 0.4, z: 0 }, width, height);
      if (center) {
        const glowR = Math.max(width, height) * 0.42;
        const domeGlow = ctx.createRadialGradient(center.x, center.y, 12, center.x, center.y, glowR);
        domeGlow.addColorStop(0, 'rgba(255, 162, 68, 0.35)');
        domeGlow.addColorStop(0.45, 'rgba(205, 92, 42, 0.14)');
        domeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = domeGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Subtle wide terrain contour rings + craters on Mars surface
      ctx.lineWidth = Math.max(1, dpr * 0.9);
      for (const r of [3.2, 5.2, 7.6]) {
        ctx.strokeStyle = 'rgba(255, 168, 108, 0.1)';
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          const p = project({ x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r }, width, height);
          if (p) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
        }
        ctx.stroke();
      }

      for (const crater of CRATERS) {
        ctx.strokeStyle = 'rgba(255, 152, 98, 0.16)';
        ctx.fillStyle = 'rgba(26, 10, 8, 0.25)';
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          const p = project({ x: crater.x + Math.cos(a) * crater.r, y: 0, z: crater.z + Math.sin(a) * crater.r }, width, height);
          if (p) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 4. Project & depth-sort 3D Mars Base faces
      const projectedFaces: Array<{ pts: Projected[]; depth: number; face: Face }> = [];
      for (const face of BASE_FACES) {
        const pts: Projected[] = [];
        let depthSum = 0;
        let valid = true;
        for (const v of face.points) {
          const p = project(v, width, height);
          if (!p) {
            valid = false;
            break;
          }
          pts.push(p);
          depthSum += p.depth;
        }
        if (valid && pts.length >= 3) {
          projectedFaces.push({ pts, depth: depthSum / pts.length, face });
        }
      }

      projectedFaces.sort((a, b) => b.depth - a.depth);
      for (const item of projectedFaces) {
        ctx.beginPath();
        ctx.moveTo(item.pts[0].x, item.pts[0].y);
        for (let i = 1; i < item.pts.length; i++) {
          ctx.lineTo(item.pts[i].x, item.pts[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = item.face.fill;
        ctx.fill();
        if (item.face.stroke) {
          ctx.strokeStyle = item.face.stroke;
          ctx.lineWidth = (item.face.lineWidth ?? 1) * dpr;
          ctx.stroke();
        }
      }

      // 5. Crew astronauts standing around the 3D base
      const crewEntries = currentGame.players
        .map((player, index) => {
          const slot = CREW_SLOTS[index % CREW_SLOTS.length];
          const base = project(slot, width, height);
          const head = project({ x: slot.x, y: 0.65, z: slot.z }, width, height);
          return { player, index, base, head };
        })
        .filter((entry): entry is { player: PublicPlayer; index: number; base: Projected; head: Projected } =>
          Boolean(entry.base && entry.head),
        )
        .sort((a, b) => b.base.depth - a.base.depth);

      for (const { player, index, base, head } of crewEntries) {
        const isSelf = player.id === currentGame.self.id;
        const suitColor = resolvePlayerSuitColor(player, currentGame.self.stats, isSelf, index);
        const accent = !player.connected
          ? '#7f8c9b'
          : player.ready
            ? '#73d4c2'
            : '#f59c42';

        const ringR = Math.max(10, base.scale * 0.25);
        ctx.strokeStyle = isSelf ? '#ffda80' : accent;
        ctx.lineWidth = (isSelf ? 2.4 : 1.6) * dpr;
        ctx.beginPath();
        ctx.ellipse(base.x, base.y, ringR, ringR * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();

        const bodyH = Math.max(16, base.y - head.y);
        const bodyW = Math.max(7, bodyH * 0.34);
        ctx.fillStyle = suitColor;
        ctx.strokeStyle = '#1a1817';
        ctx.lineWidth = Math.max(1, 1.4 * dpr);
        ctx.fillRect(base.x - bodyW / 2, head.y + bodyH * 0.26, bodyW, bodyH * 0.62);
        ctx.strokeRect(base.x - bodyW / 2, head.y + bodyH * 0.26, bodyW, bodyH * 0.62);

        const helmR = Math.max(5, bodyH * 0.22);
        ctx.fillStyle = '#eef4fc';
        ctx.beginPath();
        ctx.arc(head.x, head.y + helmR * 0.85, helmR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = suitColor;
        ctx.beginPath();
        ctx.arc(head.x, head.y + helmR * 0.85, helmR * 0.58, 0, Math.PI * 2);
        ctx.fill();

        const label = `${player.name}${isSelf ? ' (You)' : ''}`;
        const statusText = !player.connected ? 'OFF' : player.ready ? 'READY' : 'WAIT';
        ctx.font = `600 ${Math.round(11 * dpr)}px Inter, system-ui, sans-serif`;
        const textWidth = ctx.measureText(`${label} · ${statusText}`).width;
        const padX = 8 * dpr;
        const pillW = textWidth + padX * 2;
        const pillH = 20 * dpr;
        const pillX = head.x - pillW / 2;
        const pillY = head.y - 26 * dpr;

        ctx.fillStyle = 'rgba(10, 14, 22, 0.86)';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 6 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#edf3fa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} · ${statusText}`, head.x, pillY + pillH / 2);
      }

      // Beacon pulses on comms mast and dome top
      const domeTop = project({ x: 0, y: 1.5, z: 0 }, width, height);
      const mastTop = project({ x: 2.55, y: 1.48, z: -0.25 }, width, height);
      for (const beacon of [domeTop, mastTop]) {
        if (!beacon) continue;
        const pulse = (Math.sin(now * 0.005) + 1) / 2;
        ctx.fillStyle = `rgba(145, 237, 201, ${(0.45 + pulse * 0.55).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(beacon.x, beacon.y, (3 + pulse * 2.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  const zoomBy = (delta: number) => {
    cameraRef.current.distance = Math.max(3.5, Math.min(9.5, cameraRef.current.distance + delta));
  };

  return (
    <div className="mars-base-bg">
      <canvas
        ref={canvasRef}
        className="mars-base-bg__canvas"
        aria-label="3D view of the Mars base"
        onPointerDown={event => {
          cameraRef.current.dragging = true;
          cameraRef.current.lastX = event.clientX;
          cameraRef.current.lastY = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (!cameraRef.current.dragging) return;
          const dx = event.clientX - cameraRef.current.lastX;
          const dy = event.clientY - cameraRef.current.lastY;
          cameraRef.current.lastX = event.clientX;
          cameraRef.current.lastY = event.clientY;
          cameraRef.current.yaw += dx * 0.007;
          cameraRef.current.pitch = Math.max(0.12, Math.min(1.18, cameraRef.current.pitch + dy * 0.005));
        }}
        onPointerUp={() => {
          cameraRef.current.dragging = false;
        }}
        onPointerCancel={() => {
          cameraRef.current.dragging = false;
        }}
        onWheel={event => {
          event.preventDefault();
          zoomBy(event.deltaY > 0 ? 0.5 : -0.5);
        }}
      />
    </div>
  );
}
