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
  { x: -1.65, y: 0.04, z: 2.35 },
  { x: 1.65, y: 0.04, z: 2.3 },
  { x: -2.45, y: 0.04, z: -1.25 },
  { x: 2.45, y: 0.04, z: -1.15 },
];

const SKY_VERT_SRC = `
  attribute vec2 aQuad;
  varying vec2 vUv;
  void main() {
    vUv = aQuad * 0.5 + 0.5;
    gl_Position = vec4(aQuad, 0.9999, 1.0);
  }
`;

const SKY_FRAG_SRC = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uHorizon;
  void main() {
    float t = clamp((vUv.y - uHorizon + 0.15) * 1.4, 0.0, 1.0);
    vec3 soil = vec3(0.32, 0.13, 0.07);
    vec3 dust = vec3(0.82, 0.42, 0.17);
    vec3 twilight = vec3(0.16, 0.17, 0.25);
    vec3 space = vec3(0.04, 0.08, 0.15);
    vec3 col = mix(soil, dust, smoothstep(0.0, 0.28, t));
    col = mix(col, twilight, smoothstep(0.26, 0.62, t));
    col = mix(col, space, smoothstep(0.58, 1.0, t));
    // Warm Martian sunset glow near center horizon
    float sun = exp(-length(vec2((vUv.x - 0.5) * 1.4, (vUv.y - uHorizon) * 3.5)) * 2.2);
    col += vec3(0.95, 0.56, 0.22) * sun * 0.38;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const BASE_VERT_SRC = `
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

const BASE_FRAG_SRC = `
  precision mediump float;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  uniform vec4 uColor;
  uniform vec3 uCamPos;
  uniform float uMetal;
  uniform float uRoughness;
  uniform float uMatMode;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 N = normalize(vNorm);
    if (!gl_FrontFacing) N = -N;

    vec3 L1 = normalize(vec3(0.68, 0.65, 0.52));
    vec3 L2 = normalize(vec3(-0.75, 0.40, -0.55));
    vec3 V = normalize(uCamPos - vWorldPos);

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);
    float hemi = N.y * 0.5 + 0.5;

    vec3 baseRgb = uColor.rgb;
    float specBoost = mix(0.24, 0.72, uMetal);

    if (uMatMode > 0.5 && uMatMode < 1.5) {
      // Procedural Martian basalt, iron-oxide dust dunes, and crater grit
      float n1 = noise2(vWorldPos.xz * 1.4);
      float n2 = noise2(vWorldPos.xz * 6.5);
      float dune = sin(vWorldPos.x * 1.2 + vWorldPos.z * 0.7 + n1 * 2.5) * 0.5 + 0.5;
      vec3 rust = vec3(0.62, 0.27, 0.14);
      vec3 basalt = vec3(0.32, 0.14, 0.09);
      baseRgb = mix(basalt, rust, clamp(n1 * 0.55 + dune * 0.35 + n2 * 0.15, 0.0, 1.0));
      // Soft contact ambient occlusion directly beneath base modules
      float ao = smoothstep(0.6, 3.8, length(vWorldPos.xz));
      baseRgb *= mix(0.62, 1.0, ao);
      specBoost = 0.04;
    } else if (uMatMode < 0.5) {
      // Subtle hull panel variation & crevice shading for architectural readability
      float panel = smoothstep(0.92, 0.99, abs(sin(vWorldPos.x * 5.0)) * abs(sin(vWorldPos.z * 5.0)));
      float heightAo = smoothstep(-0.05, 0.38, vWorldPos.y);
      baseRgb *= mix(0.84, 1.03, heightAo) * (1.0 - panel * 0.08);
    }

    vec3 skyBounce = vec3(0.95, 0.76, 0.56);
    vec3 groundBounce = vec3(0.42, 0.18, 0.11);
    vec3 ambient = mix(groundBounce, skyBounce, hemi) * 0.56;
    vec3 sunLight = vec3(1.06, 0.89, 0.74) * diff1 * 0.76;
    vec3 fillLight = vec3(0.54, 0.65, 0.82) * diff2 * 0.28;

    vec3 H = normalize(L1 + V);
    float shininess = mix(92.0, 12.0, uRoughness);
    float spec = pow(max(dot(N, H), 0.0), shininess) * specBoost;

    // Warm Martian sunset rim light on edges
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    vec3 rimCol = vec3(0.98, 0.56, 0.26) * rim * mix(0.22, 0.06, clamp(uMatMode, 0.0, 1.0));

    vec3 lit = baseRgb * (ambient + sunLight + fillLight) + vec3(1.0, 0.92, 0.82) * spec + rimCol;

    // Atmospheric Mars dust horizon blend
    float dist = length(vWorldPos.xz);
    float fog = clamp((dist - 5.2) / 11.5, 0.0, 0.88);
    lit = mix(lit, vec3(0.68, 0.34, 0.16), fog);

    float alpha = uColor.a;
    if (uMatMode > 1.5) {
      // Warm lit interior hint + sky Fresnel reflection on dome glass
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);
      lit += vec3(0.62, 0.84, 0.98) * fresnel * 0.52 + vec3(0.95, 0.72, 0.42) * 0.14;
      alpha = clamp(uColor.a + fresnel * 0.42, 0.20, 0.78);
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

function linkProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  return prog;
}

function buildViewProj(
  yaw: number,
  pitch: number,
  distance: number,
  aspect: number,
): { mat: Float32Array; camPos: [number, number, number] } {
  const target: Vec3 = { x: 0, y: 0.28, z: -0.2 };
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  const eyeX = target.x + distance * cosP * sinY;
  const eyeY = target.y + distance * sinP;
  const eyeZ = target.z + distance * cosP * cosY;

  let fx = target.x - eyeX;
  let fy = target.y - eyeY;
  let fz = target.z - eyeZ;
  const flen = Math.hypot(fx, fy, fz) || 1;
  fx /= flen; fy /= flen; fz /= flen;

  let rx = -fz;
  const ry = 0;
  let rz = fx;
  const rlen = Math.hypot(rx, ry, rz) || 1;
  rx /= rlen; rz /= rlen;

  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  const fovY = 0.72;
  const f = 1 / Math.tan(fovY * 0.5);
  const near = 0.1;
  const far = 60;
  const nf = 1 / (near - far);

  const p00 = f / Math.max(0.2, aspect);
  const p11 = f;
  const p22 = (far + near) * nf;
  const p32 = 2 * far * near * nf;

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
): { x: number; y: number; depth: number } | null {
  const cx = mat[0] * pt.x + mat[4] * pt.y + mat[8] * pt.z + mat[12];
  const cy = mat[1] * pt.x + mat[5] * pt.y + mat[9] * pt.z + mat[13];
  const cw = mat[3] * pt.x + mat[7] * pt.y + mat[11] * pt.z + mat[15];
  if (cw <= 0.15) return null;
  const ndcX = cx / cw;
  const ndcY = cy / cw;
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (0.5 - ndcY * 0.5) * height,
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

  ctx.fillStyle = 'rgba(10, 6, 4, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, foot.y + 2 * dpr, h * 0.34, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#141211';
  ctx.lineWidth = Math.max(1.5, h * 0.06);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(cx - h * 0.2, head.y + h * 0.35, h * 0.4, h * 0.46, h * 0.1);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e5dccb';
  ctx.beginPath();
  ctx.roundRect(cx - h * 0.16, foot.y - h * 0.22, h * 0.13, h * 0.22, h * 0.04);
  ctx.roundRect(cx + h * 0.03, foot.y - h * 0.22, h * 0.13, h * 0.22, h * 0.04);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f5efe0';
  ctx.beginPath();
  ctx.arc(cx, head.y + h * 0.2, h * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(cx, head.y + h * 0.2, h * 0.13, h * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

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
 * Interactive 3D Mars Base Lobby stage rendering the optimized GLB model via opaque 60 FPS WebGL
 * plus a crisp synchronized 2D HUD overlay for crew astronauts and labels.
 */
export default function MarsBase3D({ game, autoOrbit = true }: { game: GameView; autoOrbit?: boolean }) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const [model, setModel] = useState<LoadedBaseModel | null>(null);

  const cameraRef = useRef({
    yaw: 0.72,
    pitch: 0.34,
    distance: 6.2,
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
      .catch(() => {});
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

    // Opaque WebGL context at DPR=1 for high frame rate
    const gl = (glCanvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'high-performance' }) ??
      glCanvas.getContext('webgl', { alpha: false, antialias: true })) as WebGLRenderingContext | null;

    let skyProg: WebGLProgram | null = null;
    let skyQuadBuf: WebGLBuffer | null = null;
    let baseProg: WebGLProgram | null = null;
    const gpuBatches: {
      posBuf: WebGLBuffer;
      normBuf: WebGLBuffer;
      idxBuf: WebGLBuffer;
      idxCount: number;
      color: [number, number, number, number];
      metalness: number;
      roughness: number;
      matMode: 0 | 1 | 2;
    }[] = [];

    let groundPosBuf: WebGLBuffer | null = null;
    let groundNormBuf: WebGLBuffer | null = null;
    let groundIdxBuf: WebGLBuffer | null = null;
    let groundIdxCount = 0;

    if (gl) {
      if (!(gl instanceof WebGL2RenderingContext)) {
        gl.getExtension('OES_element_index_uint');
      }
      skyProg = linkProgram(gl, SKY_VERT_SRC, SKY_FRAG_SRC);
      skyQuadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, skyQuadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      baseProg = linkProgram(gl, BASE_VERT_SRC, BASE_FRAG_SRC);

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
            matMode: batch.matMode,
          });
        }
      }
    }

    const resize = () => {
      const container = glCanvas.parentElement ?? glCanvas;
      const rect = container.getBoundingClientRect();
      // Keep WebGL at native CSS pixels (1x) for smooth 60fps; keep HUD crisp up to 2x
      const glW = Math.max(1, Math.round(rect.width));
      const glH = Math.max(1, Math.round(rect.height));
      if (glCanvas.width !== glW || glCanvas.height !== glH) {
        glCanvas.width = glW;
        glCanvas.height = glH;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const hudW = Math.max(1, Math.round(rect.width * dpr));
      const hudH = Math.max(1, Math.round(rect.height * dpr));
      if (hudCanvas.width !== hudW || hudCanvas.height !== hudH) {
        hudCanvas.width = hudW;
        hudCanvas.height = hudH;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(glCanvas.parentElement ?? glCanvas);

    // Cache WebGL uniform/attrib locations outside the frame loop
    const skyLoc = gl && skyProg ? {
      aQuad: gl.getAttribLocation(skyProg, 'aQuad'),
      uHorizon: gl.getUniformLocation(skyProg, 'uHorizon'),
    } : null;

    const baseLoc = gl && baseProg ? {
      aPos: gl.getAttribLocation(baseProg, 'aPos'),
      aNorm: gl.getAttribLocation(baseProg, 'aNorm'),
      uViewProj: gl.getUniformLocation(baseProg, 'uViewProj'),
      uColor: gl.getUniformLocation(baseProg, 'uColor'),
      uCamPos: gl.getUniformLocation(baseProg, 'uCamPos'),
      uMetal: gl.getUniformLocation(baseProg, 'uMetal'),
      uRough: gl.getUniformLocation(baseProg, 'uRoughness'),
      uMatMode: gl.getUniformLocation(baseProg, 'uMatMode'),
    } : null;

    let animId = 0;
    let lastTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const cam = cameraRef.current;
      if (cam.autoOrbit && !cam.dragging) {
        cam.yaw += dt * 0.12;
      }

      const hudW = hudCanvas.width;
      const hudH = hudCanvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const aspect = glCanvas.width / Math.max(1, glCanvas.height);
      const { mat, camPos } = buildViewProj(cam.yaw, cam.pitch, cam.distance, aspect);

      if (gl && skyProg && skyLoc && baseProg && baseLoc && skyQuadBuf) {
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Sky pass (depth off)
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.depthMask(false);
        gl.useProgram(skyProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, skyQuadBuf);
        gl.enableVertexAttribArray(skyLoc.aQuad);
        gl.vertexAttribPointer(skyLoc.aQuad, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(skyLoc.uHorizon, 0.52 + cam.pitch * 0.14);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Base 3D pass
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.useProgram(baseProg);
        gl.uniformMatrix4fv(baseLoc.uViewProj, false, mat);
        gl.uniform3fv(baseLoc.uCamPos, camPos);
        gl.enableVertexAttribArray(baseLoc.aPos);
        gl.enableVertexAttribArray(baseLoc.aNorm);

        if (groundPosBuf && groundNormBuf && groundIdxBuf) {
          gl.bindBuffer(gl.ARRAY_BUFFER, groundPosBuf);
          gl.vertexAttribPointer(baseLoc.aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, groundNormBuf);
          gl.vertexAttribPointer(baseLoc.aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, groundIdxBuf);
          gl.uniform4f(baseLoc.uColor, 0.52, 0.23, 0.12, 1);
          gl.uniform1f(baseLoc.uMetal, 0.0);
          gl.uniform1f(baseLoc.uRough, 0.95);
          gl.uniform1f(baseLoc.uMatMode, 1.0);
          gl.drawElements(gl.TRIANGLES, groundIdxCount, gl.UNSIGNED_INT, 0);
        }

        for (const batch of gpuBatches) {
          if (batch.matMode === 2) continue;
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.posBuf);
          gl.vertexAttribPointer(baseLoc.aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.normBuf);
          gl.vertexAttribPointer(baseLoc.aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.idxBuf);
          gl.uniform4fv(baseLoc.uColor, batch.color);
          gl.uniform1f(baseLoc.uMetal, batch.metalness);
          gl.uniform1f(baseLoc.uRough, batch.roughness);
          gl.uniform1f(baseLoc.uMatMode, batch.matMode);
          gl.drawElements(gl.TRIANGLES, batch.idxCount, gl.UNSIGNED_INT, 0);
        }

        // Translucent geodesic dome glass pass
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const batch of gpuBatches) {
          if (batch.matMode !== 2) continue;
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.posBuf);
          gl.vertexAttribPointer(baseLoc.aPos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, batch.normBuf);
          gl.vertexAttribPointer(baseLoc.aNorm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.idxBuf);
          gl.uniform4fv(baseLoc.uColor, batch.color);
          gl.uniform1f(baseLoc.uMetal, batch.metalness);
          gl.uniform1f(baseLoc.uRough, batch.roughness);
          gl.uniform1f(baseLoc.uMatMode, 2.0);
          gl.drawElements(gl.TRIANGLES, batch.idxCount, gl.UNSIGNED_INT, 0);
        }
        gl.depthMask(true);
      }

      // Draw Crew Astronauts & Labels synchronized in 3D space
      hudCtx.clearRect(0, 0, hudW, hudH);
      const currentGame = gameRef.current;
      const crewEntries = currentGame.players.map((player, idx) => {
        const slot = CREW_SLOTS[idx % CREW_SLOTS.length];
        const proj = projectPoint(slot, mat, hudW, hudH);
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
        drawAstronautOverlay(hudCtx, entry.player, entry.slot, mat, hudW, hudH, dpr, accent, bob);
      }

      if (!model) {
        hudCtx.font = `700 ${Math.round(12 * dpr)}px "IBM Plex Mono", monospace`;
        hudCtx.fillStyle = 'rgba(245, 239, 224, 0.85)';
        hudCtx.textAlign = 'center';
        hudCtx.fillText('CARGANDO BASE 3D...', hudW * 0.5, hudH * 0.52);
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
        if (skyQuadBuf) gl.deleteBuffer(skyQuadBuf);
        if (skyProg) gl.deleteProgram(skyProg);
        if (baseProg) gl.deleteProgram(baseProg);
      }
    };
  }, [model]);

  const zoomBy = (delta: number) => {
    cameraRef.current.distance = Math.max(3.6, Math.min(10.5, cameraRef.current.distance + delta));
  };

  return (
    <div className="mars-base-bg">
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
