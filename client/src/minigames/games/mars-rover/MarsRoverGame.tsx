import { useEffect, useRef, useState } from 'react';
import { marsRoverDefinition } from '../../../../../shared/minigames/marsRover';
import { defineModule, type MinigameViewProps } from '../../core/module';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import type { MinigameContext } from '../../../../../shared/minigames/context';
import {
  MarsRoverGame,
  type MarsRoverData,
} from './MarsRoverEngine';
import { MAP_SIZE, calculateMarsCoordinates } from './jezeroMapData';
import { fetchNasaMarsTelemetry } from './nasaMarsApi';
import { ROVER_GLB_GEOMETRY } from './roverModelData';
import './MarsRoverGame.css';

export { MarsRoverGame, type MarsRoverData };

// --- Matrices 4x4 para WebGL 3D ---
type Mat4 = Float32Array;

function mat4Create(): Mat4 {
  const out = new Float32Array(16);
  out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
  return out;
}

function mat4Perspective(out: Mat4, fovyRad: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1.0 / Math.tan(fovyRad / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

function mat4LookAt(out: Mat4, eye: [number, number, number], center: [number, number, number], up: [number, number, number]): Mat4 {
  let z0 = eye[0] - center[0];
  let z1 = eye[1] - center[1];
  let z2 = eye[2] - center[2];
  let len = Math.hypot(z0, z1, z2) || 1;
  z0 /= len; z1 /= len; z2 /= len;

  let x0 = up[1] * z2 - up[2] * z1;
  let x1 = up[2] * z0 - up[0] * z2;
  let x2 = up[0] * z1 - up[1] * z0;
  len = Math.hypot(x0, x1, x2) || 1;
  x0 /= len; x1 /= len; x2 /= len;

  const y0 = z1 * x2 - z2 * x1;
  const y1 = z2 * x0 - z0 * x2;
  const y2 = z0 * x1 - z1 * x0;

  out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
  out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
  out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
  out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
  out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
  out[15] = 1;
  return out;
}

function mat4Multiply(out: Mat4, a: Mat4, b: Mat4): Mat4 {
  const temp = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + j] * b[i * 4 + k];
      temp[i * 4 + j] = sum;
    }
  }
  out.set(temp);
  return out;
}

// Shaders WebGL con textura satelital real de la NASA, micro-relieve de regolito y atmósfera marciana
const VS_SOURCE = `
precision mediump float;
attribute vec3 a_position;
attribute vec3 a_normal;
attribute float a_elevation;
attribute vec2 a_texCoord;
attribute vec3 a_color;

uniform mat4 u_matrix;
uniform vec3 u_customColor;
uniform float u_useCustomColor;
uniform float u_useVertexColor;

varying vec3 v_normal;
varying float v_elevation;
varying vec3 v_color;
varying vec3 v_worldPos;
varying vec2 v_texCoord;

void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
  v_normal = a_normal;
  v_elevation = a_elevation;
  v_worldPos = a_position;
  v_texCoord = a_texCoord;

  if (u_useVertexColor > 0.5) {
    v_color = a_color;
  } else if (u_useCustomColor > 0.5) {
    v_color = u_customColor;
  } else {
    v_color = vec3(0.0);
  }
}
`;

const FS_SOURCE = `
precision mediump float;
varying vec3 v_normal;
varying vec3 v_color;
varying vec3 v_worldPos;
varying vec2 v_texCoord;
varying float v_elevation;

uniform vec3 u_camPos;
uniform sampler2D u_nasaTexture;
uniform float u_useCustomColor;
uniform float u_useVertexColor;

void main() {
  vec3 sunDir = normalize(vec3(0.42, 0.82, -0.38));
  vec3 ambient = vec3(0.19, 0.11, 0.07);

  vec3 surfaceColor;
  vec3 norm = normalize(v_normal);

  if (u_useVertexColor > 0.5 || u_useCustomColor > 0.5) {
    surfaceColor = v_color;
  } else {
    // 1. Textura satelital real de la NASA (Mosaico Viking MDIM 2.1 / Mars Trek)
    vec4 satColor = texture2D(u_nasaTexture, v_texCoord);
    vec3 baseMars = satColor.a > 0.05 ? satColor.rgb : vec3(0.74, 0.38, 0.18);

    // 2. Micro-relieve y ondas eólicas de arena (normal perturbation dinámica)
    float rippleFreq = 3.6;
    float rx = v_worldPos.x * 0.82 + v_worldPos.z * 0.58;
    float rippleWave = sin(rx * rippleFreq);
    float rippleSlope = cos(rx * rippleFreq) * 0.15;
    
    // Perturbar suavemente la normal para crear sombras físicas en las ondulaciones del suelo
    norm = normalize(v_normal + vec3(rippleSlope * 0.82, 0.0, rippleSlope * 0.58));

    // 3. Textura procedural multicapa de grano de regolito marciano
    float grain1 = sin(v_worldPos.x * 3.4 + v_worldPos.z * 2.2) * cos(v_worldPos.x * 2.1 - v_worldPos.z * 2.9);
    float grain2 = sin(v_worldPos.x * 9.5 + v_worldPos.z * 8.8) * 0.5 + 0.5;
    float regolithGrain = 1.0 + (grain1 * 0.07) + (grain2 * 0.05) + (rippleWave * 0.06);

    // 4. Matiz mineral geológico enriquecido por cota y composición ferruginosa
    float elevNorm = clamp((v_elevation + 6.0) / 22.0, 0.0, 1.0);
    vec3 ferricRust = vec3(0.78, 0.36, 0.17);
    vec3 ochreDunes = vec3(0.88, 0.52, 0.25);
    vec3 basaltRock = vec3(0.48, 0.26, 0.18);
    vec3 mineralTint = mix(basaltRock, mix(ferricRust, ochreDunes, elevNorm), elevNorm * 0.8 + 0.2);

    surfaceColor = baseMars * regolithGrain * mineralTint * 1.35;
  }

  float diff = max(0.24, dot(norm, sunDir));

  // Brillo especular mineral para arena y regolito marciano
  vec3 viewDir = normalize(u_camPos - v_worldPos);
  vec3 halfDir = normalize(sunDir + viewDir);
  float spec = pow(max(0.0, dot(norm, halfDir)), 18.0) * 0.12;

  vec3 finalColor = surfaceColor * diff + ambient + vec3(spec);

  // Bruma atmosférica de polvo de Marte en la distancia
  vec3 marsAtmosphere = vec3(0.82, 0.50, 0.35);
  float distToCam = length(v_worldPos - u_camPos);
  float fogFactor = clamp((distToCam - 32.0) / 140.0, 0.0, 0.80);

  gl_FragColor = vec4(mix(finalColor, marsAtmosphere, fogFactor), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('WebGL Shader Compilation Error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('WebGL Program Link Error:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function getHeadingCompass(degrees: number): string {
  const norm = ((degrees % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return `${Math.round(norm)}° N`;
  if (norm < 67.5) return `${Math.round(norm)}° NE`;
  if (norm < 112.5) return `${Math.round(norm)}° E`;
  if (norm < 157.5) return `${Math.round(norm)}° SE`;
  if (norm < 202.5) return `${Math.round(norm)}° S`;
  if (norm < 247.5) return `${Math.round(norm)}° SO`;
  if (norm < 292.5) return `${Math.round(norm)}° O`;
  return `${Math.round(norm)}° NO`;
}

function MarsRoverView({ engine, snapshot }: MinigameViewProps<MarsRoverData>) {
  const rover = engine as MarsRoverGame;
  const { data, status } = snapshot;
  const isRunning = status === 'running';
  const isGameOver = status === 'finished' || snapshot.result !== null;
  const isMissionCompleted = snapshot.result?.completed ?? false;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 960, height: 540 });

  const programRef = useRef<WebGLProgram | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const textureImgRef = useRef<HTMLImageElement | null>(null);
  const uploadedTexVersionRef = useRef(-1);
  const [textureVersion, setTextureVersion] = useState(0);

  const staticCacheRef = useRef<{
    gl: WebGLRenderingContext;
    seed: number;
    terrainCount: number;
    posBuffer: WebGLBuffer | null;
    normBuffer: WebGLBuffer | null;
    elevBuffer: WebGLBuffer | null;
    texBuffer: WebGLBuffer | null;
    indexBuffer: WebGLBuffer | null;
    rockVertCount: number;
    rockVBuffer: WebGLBuffer | null;
    rockNBuffer: WebGLBuffer | null;
    rockCBuffer: WebGLBuffer | null;
    beaconCount: number;
    bVBuffer: WebGLBuffer | null;
    bIBuffer: WebGLBuffer | null;
    roverCBuffer: WebGLBuffer | null;
  } | null>(null);

  useEffect(() => {
    return () => {
      const cache = staticCacheRef.current;
      if (cache) {
        const g = cache.gl;
        g.deleteBuffer(cache.posBuffer);
        g.deleteBuffer(cache.normBuffer);
        g.deleteBuffer(cache.elevBuffer);
        g.deleteBuffer(cache.texBuffer);
        g.deleteBuffer(cache.indexBuffer);
        g.deleteBuffer(cache.rockVBuffer);
        g.deleteBuffer(cache.rockNBuffer);
        g.deleteBuffer(cache.rockCBuffer);
        g.deleteBuffer(cache.bVBuffer);
        g.deleteBuffer(cache.bIBuffer);
        g.deleteBuffer(cache.roverCBuffer);
        staticCacheRef.current = null;
      }
    };
  }, []);

  // Mantener la relación de aspecto del lienzo 3D adaptada al contenedor disponible
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const sync = () => {
      const w = Math.max(320, Math.round(el.clientWidth || el.getBoundingClientRect().width));
      const h = Math.max(220, Math.round(el.clientHeight || el.getBoundingClientRect().height));
      setViewportSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    sync();
    const rafId = requestAnimationFrame(sync);
    window.addEventListener('resize', sync);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', sync);
      ro?.disconnect();
    };
  }, []);

  // Animación continua de la cámara orbital cenital al finalizar la misión
  const [animTick, setAnimTick] = useState(0);
  useEffect(() => {
    if (!isGameOver) return;
    let frameId: number;
    const loop = () => {
      setAnimTick(t => (t + 1) % 100000);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isGameOver]);

  // Carga de la imagen satelital real de la NASA desde assets locales
  useEffect(() => {
    let mounted = true;
    const tileUrl = rover.sector.nasaTileUrl;
    const img = new Image();

    img.onload = () => {
      if (mounted) {
        textureImgRef.current = img;
        setTextureVersion(v => v + 1);
      }
    };

    img.onerror = () => {
      // Fallback garantizado a la textura local guardada de Jezero
      const fallback = new Image();
      fallback.onload = () => {
        if (mounted) {
          textureImgRef.current = fallback;
          setTextureVersion(v => v + 1);
        }
      };
      fallback.src = '/assets/mars_viking_jezero_z4.jpg';
    };

    img.src = tileUrl;
    return () => {
      mounted = false;
    };
  }, [rover.sector.nasaTileUrl]);

  useEffect(() => {
    let mounted = true;
    fetchNasaMarsTelemetry().then(telemetry => {
      if (mounted) rover.setTelemetry(telemetry);
    });
    return () => { mounted = false; };
  }, [rover]);

  // Renderizado 3D con textura satelital real de la NASA, micro-relieve de regolito y suspensión física
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;

    if (!programRef.current) {
      programRef.current = createProgram(gl, VS_SOURCE, FS_SOURCE);
    }
    const program = programRef.current;
    if (!program) return;
    gl.useProgram(program);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Color del cielo / horizonte de Marte (salmón polvoriento oscuro para buen contraste)
    gl.clearColor(0.70, 0.42, 0.26, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const sector = rover.sector;

    // 1. Caché de geometría estática WebGL (terreno, rocas, baliza y colores del rover)
    if (!staticCacheRef.current || staticCacheRef.current.seed !== sector.seed || staticCacheRef.current.gl !== gl) {
      if (staticCacheRef.current) {
        const prevGl = staticCacheRef.current.gl;
        prevGl.deleteBuffer(staticCacheRef.current.posBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.normBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.elevBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.texBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.indexBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.rockVBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.rockNBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.rockCBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.bVBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.bIBuffer);
        prevGl.deleteBuffer(staticCacheRef.current.roverCBuffer);
      }

      const res = 54;
      const vertices: number[] = [];
      const normals: number[] = [];
      const elevations: number[] = [];
      const texCoords: number[] = [];
      const indices: number[] = [];

      const step = MAP_SIZE / res;
      for (let j = 0; j <= res; j++) {
        for (let i = 0; i <= res; i++) {
          const wx = i * step;
          const wy = j * step;
          const wz = sector.elevationAt(wx, wy);

          vertices.push(wx, wz, wy);
          elevations.push(wz);
          texCoords.push(wx / MAP_SIZE, wy / MAP_SIZE);

          const { gx, gy } = sector.gradientAt(wx, wy);
          const len = Math.hypot(-gx, 1.0, -gy) || 1;
          normals.push(-gx / len, 1.0 / len, -gy / len);
        }
      }

      for (let j = 0; j < res; j++) {
        for (let i = 0; i < res; i++) {
          const row1 = j * (res + 1);
          const row2 = (j + 1) * (res + 1);
          indices.push(row1 + i, row2 + i, row1 + i + 1);
          indices.push(row1 + i + 1, row2 + i, row2 + i + 1);
        }
      }

      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

      const normBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

      const elevBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, elevBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elevations), gl.STATIC_DRAW);

      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      const rockVerts: number[] = [];
      const rockNorms: number[] = [];
      const rockColors: number[] = [];

      for (const rock of sector.rocks) {
        const zBase = sector.elevationAt(rock.x, rock.y);
        const N = 8;
        const ringVerts: Array<[number, number, number]> = [];

        for (let k = 0; k < N; k++) {
          const angle = rock.rotation + (k * Math.PI * 2) / N;
          const rDist = rock.radius * (0.82 + 0.36 * Math.sin(k * 2.7 + rock.shapeSeed * 5.0));
          const hOffset = rock.height * 0.42 * (0.75 + 0.35 * Math.cos(k * 2.1));
          const px = rock.x + Math.cos(angle) * rDist;
          const py = rock.y + Math.sin(angle) * rDist;
          const pz = sector.elevationAt(px, py) + hOffset;
          ringVerts.push([px, pz, py]);
        }

        const topVert: [number, number, number] = [
          rock.x + Math.cos(rock.rotation) * (rock.radius * 0.15),
          zBase + rock.height,
          rock.y + Math.sin(rock.rotation) * (rock.radius * 0.15),
        ];
        const botVert: [number, number, number] = [rock.x, zBase - 0.4, rock.y];
        const baseCol = [0.38 * rock.colorSeed, 0.23 * rock.colorSeed, 0.17 * rock.colorSeed];

        for (let k = 0; k < N; k++) {
          const v0 = topVert;
          const v1 = ringVerts[k];
          const v2 = ringVerts[(k + 1) % N];

          const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
          const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
          const nx = e1[1] * e2[2] - e1[2] * e2[1];
          const ny = e1[2] * e2[0] - e1[0] * e2[2];
          const nz = e1[0] * e2[1] - e1[1] * e2[0];
          const len = Math.hypot(nx, ny, nz) || 1;
          const norm = [nx / len, ny / len, nz / len];

          const varC = 0.88 + 0.22 * Math.sin(k * 2.3 + rock.shapeSeed * 3.0);
          const col = [baseCol[0] * varC, baseCol[1] * varC, baseCol[2] * varC];

          rockVerts.push(...v0, ...v1, ...v2);
          rockNorms.push(...norm, ...norm, ...norm);
          rockColors.push(...col, ...col, ...col);
        }

        for (let k = 0; k < N; k++) {
          const v0 = botVert;
          const v1 = ringVerts[(k + 1) % N];
          const v2 = ringVerts[k];

          const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
          const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
          const nx = e1[1] * e2[2] - e1[2] * e2[1];
          const ny = e1[2] * e2[0] - e1[0] * e2[2];
          const nz = e1[0] * e2[1] - e1[1] * e2[0];
          const len = Math.hypot(nx, ny, nz) || 1;
          const norm = [nx / len, ny / len, nz / len];

          const varC = 0.72 + 0.18 * Math.cos(k * 1.9);
          const col = [baseCol[0] * varC, baseCol[1] * varC, baseCol[2] * varC];

          rockVerts.push(...v0, ...v1, ...v2);
          rockNorms.push(...norm, ...norm, ...norm);
          rockColors.push(...col, ...col, ...col);
        }
      }

      const rockVBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rockVBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rockVerts), gl.STATIC_DRAW);

      const rockNBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rockNBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rockNorms), gl.STATIC_DRAW);

      const rockCBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, rockCBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rockColors), gl.STATIC_DRAW);

      const targetB = sector.targetPos;
      const bElev = sector.elevationAt(targetB.x, targetB.y);
      const beaconVerts: number[] = [
        targetB.x - 2.2, bElev, targetB.y - 2.2,
        targetB.x + 2.2, bElev, targetB.y - 2.2,
        targetB.x + 2.2, bElev, targetB.y + 2.2,
        targetB.x - 2.2, bElev, targetB.y + 2.2,
        targetB.x - 0.7, bElev + 38.0, targetB.y - 0.7,
        targetB.x + 0.7, bElev + 38.0, targetB.y - 0.7,
        targetB.x + 0.7, bElev + 38.0, targetB.y + 0.7,
        targetB.x - 0.7, bElev + 38.0, targetB.y + 0.7,
      ];
      const beaconIndices = [
        0, 1, 5, 0, 5, 4,
        1, 2, 6, 1, 6, 5,
        2, 3, 7, 2, 7, 6,
        3, 0, 4, 3, 4, 7,
        4, 5, 6, 4, 6, 7,
      ];

      const bVBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bVBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(beaconVerts), gl.STATIC_DRAW);

      const bIBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(beaconIndices), gl.STATIC_DRAW);

      const roverCBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, roverCBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, ROVER_GLB_GEOMETRY.colors, gl.STATIC_DRAW);

      staticCacheRef.current = {
        gl,
        seed: sector.seed,
        terrainCount: indices.length,
        posBuffer,
        normBuffer,
        elevBuffer,
        texBuffer,
        indexBuffer,
        rockVertCount: rockVerts.length / 3,
        rockVBuffer,
        rockNBuffer,
        rockCBuffer,
        beaconCount: beaconIndices.length,
        bVBuffer,
        bIBuffer,
        roverCBuffer,
      };
    }

    const cache = staticCacheRef.current;

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    const aNormLoc = gl.getAttribLocation(program, 'a_normal');
    const aElevLoc = gl.getAttribLocation(program, 'a_elevation');
    const aTexCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    const aColorLoc = gl.getAttribLocation(program, 'a_color');

    const uMatrixLoc = gl.getUniformLocation(program, 'u_matrix');
    const uCamPosLoc = gl.getUniformLocation(program, 'u_camPos');
    const uCustomColorLoc = gl.getUniformLocation(program, 'u_customColor');
    const uUseCustomColorLoc = gl.getUniformLocation(program, 'u_useCustomColor');
    const uUseVertexColorLoc = gl.getUniformLocation(program, 'u_useVertexColor');
    const uNasaTexLoc = gl.getUniformLocation(program, 'u_nasaTexture');

    // Gestión segura de la textura WebGL (subir a GPU solo cuando cambia textureVersion)
    if (!glTextureRef.current) {
      glTextureRef.current = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTextureRef.current);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // Píxeles 2x2 terracota iniciales garantizados
      const defaultPix = new Uint8Array([
        195, 92, 45, 255,  180, 82, 38, 255,
        170, 75, 34, 255,  205, 102, 52, 255
      ]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, defaultPix);
    }

    if (
      uploadedTexVersionRef.current !== textureVersion &&
      textureImgRef.current &&
      textureImgRef.current.complete &&
      textureImgRef.current.naturalWidth > 0
    ) {
      try {
        gl.bindTexture(gl.TEXTURE_2D, glTextureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImgRef.current);
        uploadedTexVersionRef.current = textureVersion;
      } catch (err) {
        console.warn('Error al vincular textura satelital:', err);
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glTextureRef.current);
    gl.uniform1i(uNasaTexLoc, 0);

    // 2. Cámara Orbital de Seguimiento Dinámico (con elevación cenital en 360° al terminar la partida)
    const aspect = canvas.width / Math.max(1, canvas.height);
    const projMat = mat4Perspective(mat4Create(), (52 * Math.PI) / 180, aspect, 1.0, 600.0);

    const roverX = data.posX;
    const roverY = data.posY;
    const groundZ = sector.elevationAt(roverX, roverY);
    const headingRad = (data.heading * Math.PI) / 180;
    const ufX = Math.sin(headingRad);
    const ufZ = -Math.cos(headingRad);

    const isGameOver = status === 'finished' || snapshot.result !== null;
    let camDist = 24.0;
    let camHeight = 20.0;
    let lookTargetX = roverX + ufX * 8.5;
    let lookTargetY = groundZ + 1.5;
    let lookTargetZ = roverY + ufZ * 8.5;

    let eyeX = roverX - ufX * camDist;
    let eyeY = groundZ + camHeight;
    let eyeZ = roverY - ufZ * camDist;

    if (isGameOver) {
      // Cámara elevada cinematográfica en 360° orbitando sobre el rover
      const orbitSpeed = 0.0007;
      const angle = headingRad + (Date.now() * orbitSpeed) % (Math.PI * 2);
      camDist = 26.0;
      camHeight = 24.0;
      eyeX = roverX - Math.sin(angle) * camDist;
      eyeY = groundZ + camHeight;
      eyeZ = roverY + Math.cos(angle) * camDist;
      lookTargetX = roverX;
      lookTargetY = groundZ + 1.2;
      lookTargetZ = roverY;
    }

    const viewMat = mat4Create();
    mat4LookAt(viewMat, [eyeX, eyeY, eyeZ], [lookTargetX, lookTargetY, lookTargetZ], [0, 1, 0]);
    const vpMat = mat4Multiply(mat4Create(), projMat, viewMat);

    // Renderizar Terreno Marciano con textura satelital y micro-relieve
    gl.uniformMatrix4fv(uMatrixLoc, false, vpMat);
    gl.uniform3f(uCamPosLoc, eyeX, eyeY, eyeZ);
    gl.uniform1f(uUseCustomColorLoc, 0.0);
    gl.uniform1f(uUseVertexColorLoc, 0.0);
    gl.disableVertexAttribArray(aColorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.posBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.normBuffer);
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.elevBuffer);
    gl.vertexAttribPointer(aElevLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aElevLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.texBuffer);
    gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoordLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.indexBuffer);
    gl.drawElements(gl.TRIANGLES, cache.terrainCount, gl.UNSIGNED_SHORT, 0);

    // 3. Renderizar Rocas y Peñascos Marcianos (Obstáculos Físicos 3D con sombreado faceted)
    gl.disableVertexAttribArray(aTexCoordLoc);
    gl.vertexAttrib2f(aTexCoordLoc, 0, 0);
    gl.disableVertexAttribArray(aElevLoc);
    gl.vertexAttrib1f(aElevLoc, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.rockVBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.rockNBuffer);
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.rockCBuffer);
    gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc);

    gl.uniform1f(uUseVertexColorLoc, 1.0);
    gl.uniform1f(uUseCustomColorLoc, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, cache.rockVertCount);

    gl.disableVertexAttribArray(aColorLoc);

    // 4. Renderizar Baliza Objetivo B (Pilar holográfico verde fluorescente y plataforma)
    gl.uniform1f(uUseVertexColorLoc, 0.0);
    gl.uniform1f(uUseCustomColorLoc, 1.0);
    gl.uniform3f(uCustomColorLoc, 0.22, 1.0, 0.40); // Verde esmeralda brillante

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.bVBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cache.bIBuffer);
    gl.drawElements(gl.TRIANGLES, cache.beaconCount, gl.UNSIGNED_SHORT, 0);

    // 5. Renderizar Rover 3D Low-Poly desde el modelo GLB real (rover modelo.glb)
    const cosH = Math.cos(headingRad);
    const sinH = Math.sin(headingRad);
    const pitchRad = (data.pitchDeg * Math.PI) / 180;
    const rollRad = (data.rollDeg * Math.PI) / 180;
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);

    const chassisBaseY = groundZ + 0.05 + data.suspensionOffset;

    const vCount = ROVER_GLB_GEOMETRY.vertexCount;
    const rawP = ROVER_GLB_GEOMETRY.positions;
    const rawN = ROVER_GLB_GEOMETRY.normals;
    const roverVerts = new Float32Array(rawP.length);
    const roverNorms = new Float32Array(rawN.length);

    for (let i = 0; i < vCount; i++) {
      const idx3 = i * 3;
      const lx = rawP[idx3];
      const ly = rawP[idx3 + 1];
      const lz = rawP[idx3 + 2];

      const rlx = lx * cosR - ly * sinR;
      const rly = lx * sinR + ly * cosR;
      const ply = rly * cosP - lz * sinP;
      const plz = rly * sinP + lz * cosP;

      roverVerts[idx3] = roverX + (rlx * cosH - plz * sinH);
      roverVerts[idx3 + 1] = chassisBaseY + ply;
      roverVerts[idx3 + 2] = roverY + (rlx * sinH + plz * cosH);

      const nx = rawN[idx3];
      const ny = rawN[idx3 + 1];
      const nz = rawN[idx3 + 2];

      const rnx = nx * cosR - ny * sinR;
      const rny = nx * sinR + ny * cosR;
      const pny = rny * cosP - nz * sinP;
      const pnz = rny * sinP + nz * cosP;

      roverNorms[idx3] = rnx * cosH - pnz * sinH;
      roverNorms[idx3 + 1] = pny;
      roverNorms[idx3 + 2] = rnx * sinH + pnz * cosH;
    }

    const rVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, roverVerts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    const rNBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rNBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, roverNorms, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cache.roverCBuffer);
    gl.vertexAttribPointer(aColorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aColorLoc);

    gl.uniform1f(uUseVertexColorLoc, 1.0);
    gl.uniform1f(uUseCustomColorLoc, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, vCount);

    gl.disableVertexAttribArray(aColorLoc);

    // Limpieza únicamente de los buffers dinámicos del rover
    gl.deleteBuffer(rVBuffer);
    gl.deleteBuffer(rNBuffer);
  }, [data, rover.sector, textureVersion, status, animTick, viewportSize]);

  const energyClass =
    data.energy > 55 ? 'energy-high' : data.energy > 20 ? 'energy-med' : 'energy-low';
  const slopeClass =
    data.slopeDeg > 22 ? 'slope-danger' : data.slopeDeg > 12 ? 'slope-warning' : 'slope-safe';

  // Map gameplay speed (0..10.5 m/s) to realistic Mars rover telemetry (0.00..0.18 km/h) without altering physics.
  const speedKmh = Math.min(0.18, (Math.abs(data.speed) / 10.5) * 0.18).toFixed(2);
  const roverCoords = calculateMarsCoordinates(
    data.posX,
    data.posY,
    rover.sector.centerLat,
    rover.sector.centerLon
  );

  const targetDx = rover.sector.targetPos.x - data.posX;
  const targetDy = rover.sector.targetPos.y - data.posY;
  const targetDistNum = Math.hypot(targetDx, targetDy);
  const targetDist = targetDistNum.toFixed(0);

  const targetAngleRad = Math.atan2(targetDx, -targetDy);
  const targetBearingDeg = Math.round(((targetAngleRad * 180) / Math.PI + 360) % 360);
  const relBearing = ((targetBearingDeg - data.heading + 540) % 360) - 180;
  const isAligned = Math.abs(relBearing) <= 15;
  let targetNavHint = 'Straight ahead';
  if (relBearing > 18) targetNavHint = `Right (+${Math.round(relBearing)}°)`;
  else if (relBearing < -18) targetNavHint = `Left (${Math.round(relBearing)}°)`;

  const bindTouch = (action: string) => ({
    onPointerDown: () => isRunning && engine.dispatch(action, 'press'),
    onPointerUp: () => engine.dispatch(action, 'release'),
    onPointerLeave: () => engine.dispatch(action, 'release'),
  });

  return (
    <div className="mars-rover-container">
      <div className="canvas-map-wrapper" ref={wrapperRef}>
        <canvas
          ref={canvasRef}
          width={viewportSize.width}
          height={viewportSize.height}
          className="mars-canvas"
        />

        {/* HUD flotante Retro-NASA sobre toda la vista 3D panorámica */}
        <div className="rover-hud-overlay">
          <div className="rover-hud-group">
            <span className={`rover-hud-pill ${energyClass}`}>BAT {data.energy.toFixed(0)}%</span>
            <span className="rover-hud-pill">{speedKmh} KM/H</span>
            <span className={`rover-hud-pill ${slopeClass}`}>
              SLOPE {data.pitchDeg > 0 ? `+${data.pitchDeg}°` : `${data.pitchDeg}°`}
            </span>
          </div>

          {/* Large rotating compass toward Beacon B */}
          <div
            className={`rover-compass-dial${isAligned ? ' is-aligned' : ''}`}
            aria-label={`Heading to beacon: ${targetNavHint}, ${targetDist} meters`}
          >
            <div className="rover-compass-ring">
              <svg
                className="rover-compass-arrow"
                viewBox="0 0 40 40"
                style={{ transform: `rotate(${relBearing}deg)` }}
                aria-hidden="true"
              >
                <polygon
                  points="20,4 32,32 20,25 8,32"
                  fill={isAligned ? '#2E8B57' : '#FC3D21'}
                  stroke="#1A1817"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="rover-compass-text">
              <span className="rover-compass-label">
                {isAligned ? 'ALIGNED' : 'TARGET'} · {targetNavHint}
              </span>
              <strong className="rover-compass-dist">{targetDist} M</strong>
            </div>
          </div>

          <div className="rover-hud-group rover-hud-group--right">
            <span className="rover-hud-pill rover-hud-pill--sector" title={roverCoords.formatted}>
              {data.sector.sectorName} · {getHeadingCompass(data.heading)}
            </span>
            <span className="rover-hud-pill rover-hud-pill--score">{snapshot.score} PTS</span>
          </div>
        </div>

        {/* Bottom floating strip: 1-line status message + compact WASD pad */}
        <div className="rover-bottom-overlay">
          <div className="rover-status-banner" title={data.lastEventMessage}>
            <span>{data.lastEventMessage}</span>
          </div>

          <div className="tank-controls-cluster" aria-label="Rover controls">
            <button
              type="button"
              className="tank-btn tank-btn--w"
              disabled={!isRunning}
              {...bindTouch('forward')}
              aria-label="Accelerate forward"
            >
              <kbd>W</kbd>
              <span>▲</span>
            </button>
            <button
              type="button"
              className="tank-btn tank-btn--a"
              disabled={!isRunning}
              {...bindTouch('turn-left')}
              aria-label="Turn left"
            >
              <kbd>A</kbd>
              <span>◀</span>
            </button>
            <button
              type="button"
              className="tank-btn tank-btn--s"
              disabled={!isRunning}
              {...bindTouch('reverse')}
              aria-label="Reverse"
            >
              <kbd>S</kbd>
              <span>▼</span>
            </button>
            <button
              type="button"
              className="tank-btn tank-btn--d"
              disabled={!isRunning}
              {...bindTouch('turn-right')}
              aria-label="Turn right"
            >
              <kbd>D</kbd>
              <span>▶</span>
            </button>
          </div>
        </div>

        {isGameOver && (
          <div className="mission-debrief-card">
            <div className="debrief-header">
              <h3>{isMissionCompleted ? 'TARGET REACHED' : 'MISSION ENDED'}</h3>
              <p>{isMissionCompleted ? 'Position secured at Beacon B.' : 'Operation concluded.'}</p>
            </div>
            <div className="debrief-grid">
              <div className="debrief-metric">
                <span className="debrief-label">BATTERY</span>
                <span className="debrief-val">{data.energy.toFixed(0)}%</span>
              </div>
              <div className="debrief-metric">
                <span className="debrief-label">TIME</span>
                <span className="debrief-val">{(snapshot.elapsedMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="debrief-metric">
                <span className="debrief-label">SCORE</span>
                <span className="debrief-val">{snapshot.score} PTS</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default defineModule(
  marsRoverDefinition,
  (definition: MinigameDefinition, context: MinigameContext) =>
    new MarsRoverGame(definition, undefined, context),
  MarsRoverView
);
