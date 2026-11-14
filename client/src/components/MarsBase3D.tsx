import { useEffect, useRef, useState } from 'react';
import type { GameView, PublicPlayer } from '../../../shared/types';
import { resolvePlayerSuitColor } from './AstronautPortraitSvg';
import { loadBaseGlb, type LoadedBaseModel } from './baseGlbLoader';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const CREW_SLOTS: readonly Vec3[] = [
  { x: -1.55, y: 0.04, z: 2.35 },
  { x: 1.55, y: 0.04, z: 2.3 },
  { x: -2.45, y: 0.04, z: -1.25 },
  { x: 2.45, y: 0.04, z: -1.15 },
];

const STARS = Array.from({ length: 130 }, (_, i) => ({
  angle: ((i * 137.5) % 360) * (Math.PI / 180),
  y: ((i * 41 + 7) % 50) / 100,
  r: (i % 3) * 0.55 + 0.55,
  alpha: 0.3 + ((i * 17) % 65) / 100,
}));

const VERT_SRC = `
  attribute vec3 aPos;
  attribute vec3 aNorm;
  uniform mat4 uViewProj;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  void main() {
    vNorm = aNorm;
    vWorldPos = aPos;
    gl_Position = uViewProj * vec4(aPos, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  uniform vec4 uColor;
  uniform vec3 uCamPos;
  uniform float uMetal;
  uniform float uRoughness;
  uniform float uIsGlass;
  void main() {
    vec3 N = normalize(vNorm);
    vec3 L1 = normalize(vec3(0.65, 0.78, 0.52));
    vec3 L2 = normalize(vec3(-0.7, 0.35, -0.55));
    vec3 V = normalize(uCamPos - vWorldPos);

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);
    float hemi = N.y * 0.5 + 0.5;

    vec3 skyTint = vec3(0.95, 0.72, 0.45);
    vec3 groundTint = vec3(0.45, 0.19, 0.11);
    vec3 ambient = mix(groundTint, skyTint, hemi) * 0.52;
    vec3 sunLight = vec3(1.05, 0.88, 0.72) * diff1 * 0.78;
    vec3 fillLight = vec3(0.55, 0.62, 0.78) * diff2 * 0.25;

    vec3 H = normalize(L1 + V);
    float shininess = mix(96.0, 10.0, uRoughness);
    float spec = pow(max(dot(N, H), 0.0), shininess) * mix(0.28, 0.75, uMetal);

    vec3 lit = uColor.rgb * (ambient + sunLight + fillLight) + vec3(1.0, 0.92, 0.8) * spec;

    // Atmospheric Martian distance haze
    float dist = length(vWorldPos.xz);
    float fog = clamp((dist - 5.5) / 11.0, 0.0, 0.65);
    lit = mix(lit, vec3(0.55, 0.26, 0.14), fog);

    float alpha = uColor.a;
    if (uIsGlass > 0.5) {
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);
      lit += vec3(0.65, 0.86, 1.0) * fresnel * 0.45;
      alpha = clamp(uColor.a + fresnel * 0.42, 0.2, 0.85);
    }
    gl_FragColor = vec4(lit, alpha);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader error: ${info}`);
  }
  return shader;
}

function buildViewProj(
  yaw: number,
  pitch: number,
  distance: number,
  aspect: number,
): { mat: Float32Array; camPos: [number, number, number] } {
  const target: Vec3 = { x: 0, y: 0.28, z: -0.25 };
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Camera position in world space orbiting around target
  const eyeX = target.x + distance * cosP * sinY;
  const eyeY = target.y + distance * sinP;
  const eyeZ = target.z + distance * cosP * cosY;

  // View basis
  let fx = target.x - eyeX;
  let fy = target.y - eyeY;
  let fz = target.z - eyeZ;
  const flen = Math.hypot(fx, fy, fz) || 1;
  fx /= flen; fy /= flen; fz /= flen;

  // right = normalize(cross(f, up(0,1,0)))
  let rx = -fz;
  let ry = 0;
  let rz = fx;
  const rlen = Math.hypot(rx, ry, rz) || 1;
  rx /= rlen; rz /= rlen;

  // up = cross(r, f)
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  const fovY = 0.72;
  const f = 1 / Math.tan(fovY * 0.5);
  const near = 0.1;
  const far = 80;
  const nf = 1 / (near - far);

  const p00 = f / Math.max(0.2, aspect);
  const p11 = f;
  const p22 = (far + near) * nf;
  const p32 = 2 * far * near * nf;

  // Column-major viewProj = P * V
  const tx = -(rx * eyeX + ry * eyeY + rz * eyeZ);
  const ty = -(ux * eyeX + uy * eyeY + uz * eyeZ);
  const tz = fx * eyeX + fy * eyeY + fz * eyeZ;

  const mat = new Float32Array([
    p00 * rx, p11 * ux, p22 * -fx, fx,
    p00 * ry, p11 * uy, p22 * -fy, fy,
    p00 * rz, p11 * uz, p22 * -fz, fz,
    p00 * tx, p11 * ty, p22 * tz + p32, -tz,
  ]);

  return { mat, camPos: [eyeX, eyeY, eyeZ] };
}

function projectPoint(
  pt: Vec3,
  mat: Float32Array,
  width: number,
  height: number,
): { x: number; y: number; scale: number; depth: number } | null {
  const cx = mat[0] * pt.x + mat[4] * pt.y + mat[8] * pt.z + mat[12];
  const cy = mat[1] * pt.x + mat[5] * pt.y + mat[9] * pt.z + mat[13];
  const cw = mat[3] * pt.x + mat[7] * pt.y + mat[11] * pt.z + mat[15];
  if (cw <= 0.15) return null;
  const ndcX = cx / cw;
  const ndcY = cy / cw;
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (0.5 - ndcY * 0.5) * height,
    scale: (height * 0.85) / cw,
    depth: cw,
  };
}

function drawAstronautOverlay(
  ctx: CanvasRenderingContext2D,
  player: PublicPlayer,
  pos: Vec3,
  mat: Float32Array,
  width: number,
  height: number,
  dpr: number,
  accent: string,
  bob: number,
) {
  const foot = projectPoint({ x: pos.x, y: pos.y + bob, z: pos.z }, mat, width, height);
  const head = projectPoint({ x: pos.x, y: pos.y + 0.62 + bob, z: pos.z }, mat, width, height);
  if (!foot || !head) return;

  const h = Math.max(20, foot.y - head.y);
  const cx = foot.x;

  // Shadow on Martian soil
  ctx.fillStyle = 'rgba(10, 6, 4, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, foot.y + 2 * dpr, h * 0.34, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit torso & helmet silhouette
  ctx.strokeStyle = '#141211';
  ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(cx - h * 0.2, head.y + h * 0.35, h * 0.4, h * 0.46, h * 0.1);
  ctx.fill();
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#e5dccb';
  ctx.beginPath();
  ctx.roundRect(cx - h * 0.16, foot.y - h * 0.22, h * 0.13, h * 0.22, h * 0.04);
  ctx.roundRect(cx + h * 0.03, foot.y - h * 0.22, h * 0.13, h * 0.22, h * 0.04);
  ctx.fill();
  ctx.stroke();

  // Helmet + gold visor
  ctx.fillStyle = '#f5efe0';
  ctx.beginPath();
  ctx.arc(cx, head.y + h * 0.2, h * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(cx, head.y + h * 0.2, h * 0.13, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floating nameplate pill
  const label = player.name.slice(0, 12);
  const statusText = !player.connected ? 'OFF' : player.ready ? 'READY' : 'WAIT';
  ctx.font = `700 ${Math.round(11 * dpr)}px Archivo, Inter, system-ui, sans-serif`;
  const textWidth = ctx.measureText(`${label} · ${statusText}`).width;
  const padX = 9 * dpr;
  const pillW = textWidth + padX * 2;
  const pillH = 22 * dpr;
  const pillX = cx - pillW / 2;
  const pillY = head.y - 26 * dpr;

  ctx.fillStyle = 'rgba(12, 18, 30, 0.9)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.6 * dpr;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 6 * dpr);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f5efe0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label} · ${statusText}`, cx, pillY + pillH / 2);
}

/**
 * Interactive 3D Mars Base Lobby stage rendering the architect's GLB model via WebGL
 * plus a synchronized 2D overlay for crew avatars, status badges, and Martian sky.
 */
export default function MarsBase3D({ game, autoOrbit = true }: { game: GameView; autoOrbit?: boolean }) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const [model, setModel] = useState<LoadedBaseModel | null>(null);

  const cameraRef = useRef({
    yaw: 0.68,
    pitch: 0.34,
    distance: 6.4,
    autoOrbit,
    dragging: false,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    cameraRef.current.autoOrbit = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    let active = true;
    loadBaseGlb()
      .then(loaded => {
        if (active) setModel(loaded);
      })
      .catch(() => {
        // Fallback sky + crew overlay still renders cleanly
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const hudCanvas = hudCanvasRef.current;
    if (!glCanvas || !hudCanvas) return;

    const hudCtx = hudCanvas.getContext('2d');
    if (!hudCtx) return;

    const gl = (glCanvas.getContext('webgl2', { alpha: true, antialias: true }) ??
      glCanvas.getContext('webgl', { alpha: true, antialias: true })) as WebGLRenderingContext | null;

    let program: WebGLProgram | null = null;
    const gpuBatches: {
      posBuf: WebGLBuffer;
      normBuf: WebGLBuffer;
      idxBuf: WebGLBuffer;
      idxCount: number;
      color: [number, number, number, number];
      metalness: number;
      roughness: number;
      isGlass: boolean;
    }[] = [];

    // Ground disc geometry for surrounding Mars desert
    let groundPosBuf: WebGLBuffer | null = null;
    let groundNormBuf: WebGLBuffer | null = null;
    let groundIdxBuf: WebGLBuffer | null = null;
    let groundIdxCount = 0;

    if (gl) {
      if (!(gl instanceof WebGL2RenderingContext)) {
        gl.getExtension('OES_element_index_uint');
      }
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      // Build broad Martian terrain apron so the base sits seamlessly on Mars regolith
      const segs = 48;
      const gPos = [0, -0.02, 0];
      const gNorm = [0, 1, 0];
      const gIdx: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const r = 18;
        gPos.push(Math.cos(a) * r, -0.04, Math.sin(a) * r);
        gNorm.push(0, 1, 0);
        if (i < segs) gIdx.push(0, i + 1, i + 2);
      }
      groundPosBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, groundPosBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gPos), gl.STATIC_DRAW);

      groundNormBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, groundNormBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gNorm), gl.STATIC_DRAW);

      groundIdxBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIdxBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(gIdx), gl.STATIC_DRAW);
      groundIdxCount = gIdx.length;

      if (model) {
        for (const batch of model.batches) {
          const posBuf = gl.createBuffer()!;
          gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
          gl.bufferData(gl.ARRAY_BUFFER, batch.positions, gl.STATIC_DRAW);

          const normBuf = gl.createBuffer()!;
          gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
          gl.bufferData(gl.ARRAY_BUFFER, batch.normals, gl.STATIC_DRAW);

          const idxBuf = gl.createBuffer()!;
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.STATIC_DRAW);

          gpuBatches.push({
            posBuf,
            normBuf,
            idxBuf,
            idxCount: batch.indices.length,
            color: batch.color,
            metalness: batch.metalness,
            roughness: batch.roughness,
            isGlass: batch.isGlass,
          });
        }
      }
    }

    const resize = () => {
      const container = glCanvas.parentElement ?? glCanvas;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (glCanvas.width !== w || glCanvas.height !== h) {
        glCanvas.width = w;
        glCanvas.height = h;
      }
      if (hudCanvas.width !== w || hudCanvas.height !== h) {
        hudCanvas.width = w;
        hudCanvas.height = h;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(glCanvas.parentElement ?? glCanvas);

    let animId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const cam = cameraRef.current;
      if (cam.autoOrbit && !cam.dragging) {
        cam.yaw += dt * 0.12;
      }

      const width = hudCanvas.width;
      const height = hudCanvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const aspect = width / Math.max(1, height);
      const { mat, camPos } = buildViewProj(cam.yaw, cam.pitch, cam.distance, aspect);

      // 1. Background sky + stars on HUD canvas first, then WebGL base on top, OR draw sky on hudCtx when clear.
      // We draw sky behind WebGL via CSS gradient and draw stars + crew astronauts cleanly on hudCtx!
      hudCtx.clearRect(0, 0, width, height);

      const horizonY = height * (0.46 - cam.pitch * 0.16);
      hudCtx.fillStyle = '#fff5dc';
      for (const star of STARS) {
        const sx = ((((star.angle - cam.yaw * 0.5) / (Math.PI * 2)) % 1) + 1) % 1;
        const py = star.y * Math.max(100, horizonY);
        if (py > horizonY - 24) continue;
        hudCtx.globalAlpha = star.alpha * 0.85;
        hudCtx.beginPath();
        hudCtx.arc(sx * width, py, star.r * dpr, 0, Math.PI * 2);
        hudCtx.fill();
      }
      hudCtx.globalAlpha = 1;

      // 2. Render Architect's GLB Base in WebGL
      if (gl && program) {
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        const aPos = gl.getAttribLocation(program, 'aPos');
        const aNorm = gl.getAttribLocation(program, 'aNorm');
        const uViewProj = gl.getUniformLocation(program, 'uViewProj');
        const uColor = gl.getUniformLocation(program, 'uColor');
        const uCamPos = gl.getUniformLocation(program, 'uCamPos');
        const uMetal = gl.getUniformLocation(program, 'uMetal');
        const uRough = gl.getUniformLocation(program, 'uRoughness');
        const uIsGlass = gl.getUniformLocation(program, 'uIsGlass');

        gl.uniformMatrix4fv(uViewProj, false, mat);
        gl.uniform3fv(uCamPos, camPos);
        gl.enable(gl.DEPTH_TEST);
        gl.enableVertexAttribArray(aPos);
        gl.enableVertexAttribArray(aNorm);

        // Draw Martian regolith ground apron
        if (groundPosBuf && groundNormBuf && groundIdxBuf) {
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          gl.bindBuffer(gl.ARRAY_BUFFER, groundPosBuf);
          gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, groundNormBuf);
          gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIdxBuf);
          gl.uniform4f(uColor, 0.45, 0.19, 0.11, 1);
          gl.uniform1f(uMetal, 0.0);
          gl.uniform1f(uRough, 0.95);
          gl.uniform1f(uIsGlass, 0.0);
          gl.drawElements(gl.TRIANGLES, groundIdxCount, gl.UNSIGNED_INT, 0);
        }

        // Opaque base pass
        for (const batch of gpuBatches) {
          if (batch.isGlass) continue;
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.posBuf);
          gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.normBuf);
          gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.idxBuf);
          gl.uniform4fv(uColor, batch.color);
          gl.uniform1f(uMetal, batch.metalness);
          gl.uniform1f(uRough, batch.roughness);
          gl.uniform1f(uIsGlass, 0.0);
          gl.drawElements(gl.TRIANGLES, batch.idxCount, gl.UNSIGNED_INT, 0);
        }

        // Translucent geodesic glass pass
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const batch of gpuBatches) {
          if (!batch.isGlass) continue;
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.posBuf);
          gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.normBuf);
          gl.vertexAttribPointer(aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.idxBuf);
          gl.uniform4fv(uColor, batch.color);
          gl.uniform1f(uMetal, batch.metalness);
          gl.uniform1f(uRough, batch.roughness);
          gl.uniform1f(uIsGlass, 1.0);
          gl.drawElements(gl.TRIANGLES, batch.idxCount, gl.UNSIGNED_INT, 0);
        }
        gl.depthMask(true);
      }

      // 3. Draw Crew Astronauts & Labels synchronized in 3D space
      const currentGame = gameRef.current;
      const crewEntries = currentGame.players.map((player, idx) => {
        const slot = CREW_SLOTS[idx % CREW_SLOTS.length];
        const proj = projectPoint(slot, mat, width, height);
        return { player, idx, slot, depth: proj?.depth ?? 999 };
      });
      crewEntries.sort((a, b) => b.depth - a.depth);

      for (const entry of crewEntries) {
        const isSelf = entry.player.id === currentGame.self.id;
        const accent = resolvePlayerSuitColor(
          entry.player,
          currentGame.self.stats,
          isSelf,
          entry.idx,
        );
        const bob = entry.player.ready ? Math.sin(now * 0.005 + entry.idx) * 0.035 : 0;
        drawAstronautOverlay(hudCtx, entry.player, entry.slot, mat, width, height, dpr, accent, bob);
      }

      if (!model) {
        hudCtx.font = `700 ${Math.round(12 * dpr)}px "IBM Plex Mono", monospace`;
        hudCtx.fillStyle = 'rgba(245, 239, 224, 0.85)';
        hudCtx.textAlign = 'center';
        hudCtx.fillText('CARGANDO MODELO 3D DE LA BASE...', width * 0.5, height * 0.52);
      }

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      if (gl) {
        for (const batch of gpuBatches) {
          gl.deleteBuffer(batch.posBuf);
          gl.deleteBuffer(batch.normBuf);
          gl.deleteBuffer(batch.idxBuf);
        }
        if (groundPosBuf) gl.deleteBuffer(groundPosBuf);
        if (groundNormBuf) gl.deleteBuffer(groundNormBuf);
        if (groundIdxBuf) gl.deleteBuffer(groundIdxBuf);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [model]);

  const zoomBy = (delta: number) => {
    cameraRef.current.distance = Math.max(3.6, Math.min(10.5, cameraRef.current.distance + delta));
  };

  return (
    <div className="mars-base-bg">
      <div className="mars-base-bg__sky" aria-hidden="true" />
      <canvas
        ref={glCanvasRef}
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
          cameraRef.current.yaw -= dx * 0.007;
          cameraRef.current.pitch = Math.max(0.14, Math.min(1.12, cameraRef.current.pitch + dy * 0.005));
        }}
        onPointerUp={() => {
          cameraRef.current.dragging = false;
        }}
        onPointerCancel={() => {
          cameraRef.current.dragging = false;
        }}
        onWheel={event => {
          event.preventDefault();
          zoomBy(event.deltaY > 0 ? 0.55 : -0.55);
        }}
      />
      <canvas ref={hudCanvasRef} className="mars-base-bg__hud" aria-hidden="true" />
    </div>
  );
}
