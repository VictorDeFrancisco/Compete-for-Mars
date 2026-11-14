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

uniform mat4 u_matrix;
uniform vec3 u_customColor;
uniform float u_useCustomColor;

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

  if (u_useCustomColor > 0.5) {
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

void main() {
  vec3 sunDir = normalize(vec3(0.42, 0.84, -0.36));
  float diff = max(0.28, dot(v_normal, sunDir));
  vec3 ambient = vec3(0.18, 0.09, 0.05);

  vec3 surfaceColor;
  if (u_useCustomColor > 0.5) {
    surfaceColor = v_color;
  } else {
    // 1. Textura satelital real de la NASA (Mosaico Viking MDIM 2.1 / Mars Trek)
    vec4 satColor = texture2D(u_nasaTexture, v_texCoord);
    vec3 baseMars = vec3(0.74, 0.38, 0.18);
    if (satColor.a > 0.05) {
      baseMars = satColor.rgb;
    }

    // 2. Micro-textura añadida: Grano fino de regolito marciano y ondas eólicas de arena
    float grain1 = sin(v_worldPos.x * 3.4 + v_worldPos.z * 2.2) * cos(v_worldPos.x * 1.9 - v_worldPos.z * 2.8);
    float grain2 = sin(v_worldPos.x * 8.2 + v_worldPos.z * 7.5) * 0.5 + 0.5;
    float ripples = sin((v_worldPos.x * 0.55 + v_worldPos.z * 0.45) * 3.8) * 0.08;
    float regolithGrain = 1.0 + (grain1 * 0.08) + (grain2 * 0.06) + ripples;

    // 3. Matiz mineral geológico sutil por cota (SIN líneas blancas de ningún tipo)
    float elevNorm = clamp((v_elevation + 5.0) / 20.0, 0.0, 1.0);
    vec3 mineralTint = mix(vec3(0.80, 0.60, 0.48), vec3(1.18, 0.98, 0.88), elevNorm);
    surfaceColor = baseMars * regolithGrain * mineralTint;
  }

  vec3 finalColor = surfaceColor * diff + ambient;

  // Bruma atmosférica de polvo de Marte en la distancia
  vec3 marsAtmosphere = vec3(0.84, 0.54, 0.38);
  float distToCam = length(v_worldPos - u_camPos);
  float fogFactor = clamp((distToCam - 28.0) / 145.0, 0.0, 0.82);

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const programRef = useRef<WebGLProgram | null>(null);
  const glTextureRef = useRef<WebGLTexture | null>(null);
  const textureImgRef = useRef<HTMLImageElement | null>(null);
  const [textureVersion, setTextureVersion] = useState(0);

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

    // 1. Malla 3D del paisaje marciano extendido (54x54 vértices)
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

    const aPosLoc = gl.getAttribLocation(program, 'a_position');
    const aNormLoc = gl.getAttribLocation(program, 'a_normal');
    const aElevLoc = gl.getAttribLocation(program, 'a_elevation');
    const aTexCoordLoc = gl.getAttribLocation(program, 'a_texCoord');

    const uMatrixLoc = gl.getUniformLocation(program, 'u_matrix');
    const uCamPosLoc = gl.getUniformLocation(program, 'u_camPos');
    const uCustomColorLoc = gl.getUniformLocation(program, 'u_customColor');
    const uUseCustomColorLoc = gl.getUniformLocation(program, 'u_useCustomColor');
    const uNasaTexLoc = gl.getUniformLocation(program, 'u_nasaTexture');

    // Gestión segura de la textura WebGL
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

    if (textureImgRef.current && textureImgRef.current.complete && textureImgRef.current.naturalWidth > 0) {
      try {
        gl.bindTexture(gl.TEXTURE_2D, glTextureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImgRef.current);
      } catch (err) {
        console.warn('Error al vincular textura satelital:', err);
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glTextureRef.current);
    gl.uniform1i(uNasaTexLoc, 0);

    // 2. Cámara Orbital de Seguimiento Dinámico
    const aspect = canvas.width / canvas.height;
    const projMat = mat4Perspective(mat4Create(), (48 * Math.PI) / 180, aspect, 1.0, 600.0);

    const roverX = data.posX;
    const roverY = data.posY;
    const groundZ = sector.elevationAt(roverX, roverY);
    const headingRad = (data.heading * Math.PI) / 180;
    const ufX = Math.sin(headingRad);
    const ufZ = -Math.cos(headingRad);

    const camDist = 26.0;
    const camHeight = 22.0;
    const eyeX = roverX - ufX * camDist;
    const eyeY = groundZ + camHeight;
    const eyeZ = roverY - ufZ * camDist;
    const targetX = roverX + ufX * 10.0;
    const targetY = groundZ + 1.5;
    const targetZ = roverY + ufZ * 10.0;

    const viewMat = mat4Create();
    mat4LookAt(viewMat, [eyeX, eyeY, eyeZ], [targetX, targetY, targetZ], [0, 1, 0]);
    const vpMat = mat4Multiply(mat4Create(), projMat, viewMat);

    // Renderizar Terreno Marciano con textura satelital y micro-relieve
    gl.uniformMatrix4fv(uMatrixLoc, false, vpMat);
    gl.uniform3f(uCamPosLoc, eyeX, eyeY, eyeZ);
    gl.uniform1f(uUseCustomColorLoc, 0.0);

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.vertexAttribPointer(aNormLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, elevBuffer);
    gl.vertexAttribPointer(aElevLoc, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aElevLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.vertexAttribPointer(aTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTexCoordLoc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // 3. Renderizar Baliza Objetivo B (Pilar holográfico verde fluorescente)
    gl.disableVertexAttribArray(aTexCoordLoc);
    gl.vertexAttrib2f(aTexCoordLoc, 0, 0);
    gl.disableVertexAttribArray(aElevLoc);
    gl.vertexAttrib1f(aElevLoc, 0);
    gl.disableVertexAttribArray(aNormLoc);
    gl.vertexAttrib3f(aNormLoc, 0, 1, 0);

    const targetB = sector.targetPos;
    const bElev = sector.elevationAt(targetB.x, targetB.y);
    const beaconVerts: number[] = [
      targetB.x - 1.8, bElev, targetB.y - 1.8,
      targetB.x + 1.8, bElev, targetB.y - 1.8,
      targetB.x + 1.8, bElev, targetB.y + 1.8,
      targetB.x - 1.8, bElev, targetB.y + 1.8,
      targetB.x - 0.8, bElev + 32.0, targetB.y - 0.8,
      targetB.x + 0.8, bElev + 32.0, targetB.y - 0.8,
      targetB.x + 0.8, bElev + 32.0, targetB.y + 0.8,
      targetB.x - 0.8, bElev + 32.0, targetB.y + 0.8,
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
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    const bIBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(beaconIndices), gl.STATIC_DRAW);

    gl.uniform1f(uUseCustomColorLoc, 1.0);
    gl.uniform3f(uCustomColorLoc, 0.2, 1.0, 0.35); // Verde lima
    gl.drawElements(gl.TRIANGLES, beaconIndices.length, gl.UNSIGNED_SHORT, 0);

    // 4. Renderizar Rover 3D con Pitch, Roll e Inclinación por Pendiente + Suspensión
    const rL = 3.4, rW = 2.4, rH = 1.3;
    const cosH = Math.cos(headingRad);
    const sinH = Math.sin(headingRad);
    const pitchRad = (data.pitchDeg * Math.PI) / 180;
    const rollRad = (data.rollDeg * Math.PI) / 180;
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);
    const cosR = Math.cos(rollRad);
    const sinR = Math.sin(rollRad);

    const chassisBaseY = groundZ + 0.45 + data.suspensionOffset;

    const roverLocalVerts = [
      -rW / 2, 0.0, -rL / 2,
       rW / 2, 0.0, -rL / 2,
       rW / 2, 0.0,  rL / 2,
      -rW / 2, 0.0,  rL / 2,
      -rW / 2, rH,  -rL / 2,
       rW / 2, rH,  -rL / 2,
       rW / 2, rH,   rL / 2,
      -rW / 2, rH,   rL / 2,
    ];

    const roverWorldVerts: number[] = [];
    for (let k = 0; k < 8; k++) {
      let lx = roverLocalVerts[k * 3];
      let ly = roverLocalVerts[k * 3 + 1];
      let lz = roverLocalVerts[k * 3 + 2];

      const rlx = lx * cosR - ly * sinR;
      const rly = lx * sinR + ly * cosR;
      lx = rlx; ly = rly;

      const ply = ly * cosP - lz * sinP;
      const plz = ly * sinP + lz * cosP;
      ly = ply; lz = plz;

      const rx = roverX + (lx * cosH - lz * sinH);
      const ry = chassisBaseY + ly;
      const rz = roverY + (lx * sinH + lz * cosH);
      roverWorldVerts.push(rx, ry, rz);
    }

    const rVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(roverWorldVerts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    // Chasis de alto contraste (Blanco NASA brillante)
    gl.uniform1f(uUseCustomColorLoc, 1.0);
    gl.uniform3f(uCustomColorLoc, 0.98, 0.98, 1.0);
    gl.drawElements(gl.TRIANGLES, beaconIndices.length, gl.UNSIGNED_SHORT, 0);

    // 5. Faros del rover iluminando el terreno
    const lightBeamVerts = [
      roverX, chassisBaseY + 0.4, roverY,
      roverX + ufX * 22.0 - (cosH * 7.0), groundZ + 0.3, roverY + ufZ * 22.0 - (sinH * 7.0),
      roverX + ufX * 22.0 + (cosH * 7.0), groundZ + 0.3, roverY + ufZ * 22.0 + (sinH * 7.0),
    ];
    const lightIBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lightBeamVerts), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lightIBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2]), gl.STATIC_DRAW);

    gl.uniform3f(uCustomColorLoc, 1.0, 0.94, 0.6); // Luz dorada
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

    // Limpieza de buffers temporales
    gl.deleteBuffer(posBuffer);
    gl.deleteBuffer(normBuffer);
    gl.deleteBuffer(elevBuffer);
    gl.deleteBuffer(texBuffer);
    gl.deleteBuffer(indexBuffer);
    gl.deleteBuffer(bVBuffer);
    gl.deleteBuffer(bIBuffer);
    gl.deleteBuffer(rVBuffer);
    gl.deleteBuffer(lightIBuffer);
  }, [data, rover.sector, textureVersion]);

  const energyClass =
    data.energy > 55 ? 'energy-high' : data.energy > 20 ? 'energy-med' : 'energy-low';
  const slopeClass =
    data.slopeDeg > 22 ? 'slope-danger' : data.slopeDeg > 12 ? 'slope-warning' : 'slope-safe';

  const speedKmh = (data.speed * 3.6).toFixed(1);
  const currentElevation = rover.sector.elevationAt(data.posX, data.posY);
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
  let targetNavHint = 'Al frente';
  if (relBearing > 18) targetNavHint = `▶ Der (+${Math.round(relBearing)}°)`;
  else if (relBearing < -18) targetNavHint = `◀ Izq (${Math.round(relBearing)}°)`;

  const bindTouch = (action: string) => ({
    onPointerDown: () => isRunning && engine.dispatch(action, 'press'),
    onPointerUp: () => engine.dispatch(action, 'release'),
    onPointerLeave: () => engine.dispatch(action, 'release'),
  });

  return (
    <div className="mars-rover-container">
      <div className="mars-rover-header">
        <div className="header-main-info">
          <div className="sector-title">
            <strong>{data.sector.sectorName}</strong>
          </div>
          <div className="rover-coords-display" title="Coordenadas orbitales de Marte y métricas locales">
            <span className="coords-icon">📍 Coordenadas:</span>
            <span className="coords-latlon">{roverCoords.formatted}</span>
            <span className="coords-grid">
              (X: {data.posX.toFixed(1)}m, Y: {data.posY.toFixed(1)}m, Z: {currentElevation >= 0 ? `+${currentElevation.toFixed(1)}m` : `${currentElevation.toFixed(1)}m`})
            </span>
          </div>
        </div>
        <div className="mars-api-badge live">
          🛰️ Mosaico Satelital NASA Mars Trek
        </div>
      </div>

      <div className="mars-telemetry-strip">
        <div className="telemetry-card">
          <span className="telemetry-label">Batería (Consumo Real)</span>
          <span className={`telemetry-value ${energyClass}`}>{data.energy.toFixed(1)} %</span>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Velocidad</span>
          <span className="telemetry-value">{speedKmh} km/h</span>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Cabeceo / Inclinación</span>
          <span className={`telemetry-value ${slopeClass}`}>
            {data.pitchDeg > 0 ? `▲ +${data.pitchDeg}°` : `▼ ${data.pitchDeg}°`}
          </span>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Balanceo Lateral</span>
          <span className="telemetry-value">{data.rollDeg}°</span>
        </div>
        <div className="telemetry-card">
          <span className="telemetry-label">Distancia a Baliza B</span>
          <span className="telemetry-value" style={{ color: '#4ade80' }}>{targetDist} m</span>
        </div>
      </div>

      <div className="canvas-map-wrapper">
        <canvas ref={canvasRef} width={520} height={420} className="mars-canvas" />
      </div>

      <div className="legend-bar">
        <span>Capa Satelital:</span>
        <div className="legend-gradient">
          <span>Basalto (-6m)</span>
          <div className="gradient-box gradient-mars-satellite" />
          <span>Hematita (+18m)</span>
        </div>
        <span style={{ opacity: 0.85, fontSize: '0.72rem' }}>
          Fotografía Satelital NASA Viking / MRO + Textura Regolito
        </span>
      </div>

      <div className="rover-status-banner">{data.lastEventMessage}</div>

      <div className="compass-heading">
        Rumbo: <strong>{getHeadingCompass(data.heading)}</strong> · Baliza B: <strong>{getHeadingCompass(targetBearingDeg)} ({targetNavHint})</strong> · Suspensión: <strong>{(data.suspensionOffset * 100).toFixed(0)} cm</strong> · Tiempo: <strong>{Math.ceil(snapshot.remainingMs / 1000)}s</strong>
      </div>

      {/* Controles de conducción */}
      <div className="tank-controls-cluster">
        <button
          type="button"
          className="tank-btn forward"
          disabled={!isRunning}
          {...bindTouch('forward')}
          aria-label="Acelerar hacia adelante"
        >
          ▲ Acelerar (W)
        </button>
        <div className="tank-controls-row">
          <button
            type="button"
            className="tank-btn"
            disabled={!isRunning}
            {...bindTouch('turn-left')}
            aria-label="Girar izquierda"
          >
            ◀ Girar Izq (A)
          </button>
          <button
            type="button"
            className="tank-btn brake"
            disabled={!isRunning}
            {...bindTouch('brake')}
            aria-label="Freno de orugas"
          >
            🛑 Freno (Espacio)
          </button>
          <button
            type="button"
            className="tank-btn"
            disabled={!isRunning}
            {...bindTouch('turn-right')}
            aria-label="Girar derecha"
          >
            ▶ Girar Der (D)
          </button>
        </div>
        <button
          type="button"
          className="tank-btn reverse"
          disabled={!isRunning}
          {...bindTouch('reverse')}
          aria-label="Marcha atrás"
        >
          ▼ Reversa (S)
        </button>
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
