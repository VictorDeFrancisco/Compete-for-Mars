export interface BaseBatch {
  materialIndex: number;
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  color: [number, number, number, number];
  metalness: number;
  roughness: number;
  isGlass: boolean;
}

export interface LoadedBaseModel {
  batches: readonly BaseBatch[];
  radius: number;
  topY: number;
  entrancePoint: [number, number, number];
}

interface GltfAccessor {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  min?: number[];
  max?: number[];
}

interface GltfBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
}

interface GltfMaterial {
  name?: string;
}

interface GltfPrimitive {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
}

interface GltfMesh {
  primitives: GltfPrimitive[];
}

interface GltfNode {
  mesh?: number;
  translation?: [number, number, number];
}

interface GltfJson {
  accessors?: GltfAccessor[];
  bufferViews?: GltfBufferView[];
  materials?: GltfMaterial[];
  meshes?: GltfMesh[];
  nodes?: GltfNode[];
}

interface MaterialStyle {
  color: [number, number, number, number];
  metalness: number;
  roughness: number;
  isGlass: boolean;
}

/**
 * Architectural palette mapped onto the GLB material slots exported by the team's 3D base render.
 */
function styleForMaterial(index: number, name: string): MaterialStyle {
  const lower = name.toLowerCase();
  if (lower.includes('vidrio')) {
    return { color: [0.68, 0.87, 0.96, 0.36], metalness: 0.1, roughness: 0.08, isGlass: true };
  }
  if (lower.includes('gema')) {
    return { color: [0.85, 0.56, 0.34, 0.42], metalness: 0.15, roughness: 0.18, isGlass: true };
  }
  if (lower.includes('metal')) {
    if (index === 10) {
      // Distant terrain/frame ring
      return { color: [0.46, 0.21, 0.13, 1], metalness: 0.05, roughness: 0.92, isGlass: false };
    }
    return { color: [0.34, 0.39, 0.46, 1], metalness: 0.65, roughness: 0.35, isGlass: false };
  }
  if (index === 0) {
    // Immediate Martian terrain pad
    return { color: [0.52, 0.23, 0.13, 1], metalness: 0.0, roughness: 0.95, isGlass: false };
  }
  if (lower.includes('pintura (1)')) {
    return { color: [0.84, 0.41, 0.21, 1], metalness: 0.12, roughness: 0.48, isGlass: false };
  }
  if (lower.includes('pintura (2)')) {
    return { color: [0.24, 0.31, 0.38, 1], metalness: 0.2, roughness: 0.55, isGlass: false };
  }
  if (lower.includes('pintura')) {
    return { color: [0.92, 0.89, 0.82, 1], metalness: 0.08, roughness: 0.42, isGlass: false };
  }
  if (lower.includes('plástico (1)')) {
    return { color: [0.76, 0.74, 0.70, 1], metalness: 0.15, roughness: 0.46, isGlass: false };
  }
  return { color: [0.62, 0.65, 0.69, 1], metalness: 0.2, roughness: 0.5, isGlass: false };
}

function componentByteSize(componentType: number): number {
  switch (componentType) {
    case 5121: return 1; // UNSIGNED_BYTE
    case 5123: return 2; // UNSIGNED_SHORT
    case 5125: return 4; // UNSIGNED_INT
    case 5126: return 4; // FLOAT
    default: return 4;
  }
}

function numComponents(type: string): number {
  switch (type) {
    case 'SCALAR': return 1;
    case 'VEC2': return 2;
    case 'VEC3': return 3;
    case 'VEC4': return 4;
    default: return 3;
  }
}

function readVec3Array(
  accessor: GltfAccessor,
  views: readonly GltfBufferView[],
  binOffset: number,
  view: DataView,
): Float32Array {
  const out = new Float32Array(accessor.count * 3);
  if (accessor.bufferView === undefined) return out;
  const bv = views[accessor.bufferView];
  const stride = bv.byteStride ?? 12;
  const base = binOffset + (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

  for (let i = 0; i < accessor.count; i++) {
    const off = base + i * stride;
    out[i * 3] = view.getFloat32(off, true);
    out[i * 3 + 1] = view.getFloat32(off + 4, true);
    out[i * 3 + 2] = view.getFloat32(off + 8, true);
  }
  return out;
}

function readIndexArray(
  accessor: GltfAccessor,
  views: readonly GltfBufferView[],
  binOffset: number,
  view: DataView,
): Uint32Array {
  const out = new Uint32Array(accessor.count);
  if (accessor.bufferView === undefined) return out;
  const bv = views[accessor.bufferView];
  const cSize = componentByteSize(accessor.componentType);
  const stride = bv.byteStride ?? cSize * numComponents(accessor.type);
  const base = binOffset + (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);

  for (let i = 0; i < accessor.count; i++) {
    const off = base + i * stride;
    if (accessor.componentType === 5125) out[i] = view.getUint32(off, true);
    else if (accessor.componentType === 5123) out[i] = view.getUint16(off, true);
    else out[i] = view.getUint8(off);
  }
  return out;
}

function computeFlatNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i + 2 < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    const ax = positions[i1] - positions[i0];
    const ay = positions[i1 + 1] - positions[i0 + 1];
    const az = positions[i1 + 2] - positions[i0 + 2];
    const bx = positions[i2] - positions[i0];
    const by = positions[i2 + 1] - positions[i0 + 1];
    const bz = positions[i2 + 2] - positions[i0 + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz) || 1;
    for (const idx of [i0, i1, i2]) {
      normals[idx] += nx / len;
      normals[idx + 1] += ny / len;
      normals[idx + 2] += nz / len;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  return normals;
}

/**
 * Parses `/assets/base.glb` and merges all meshes per material into normalized WebGL-ready batches.
 */
export function parseBaseGlb(buffer: ArrayBuffer): LoadedBaseModel {
  const dv = new DataView(buffer);
  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) {
    throw new Error('Archivo GLB inválido.');
  }

  const jsonLength = dv.getUint32(12, true);
  const jsonBytes = new Uint8Array(buffer, 20, jsonLength);
  const jsonText = new TextDecoder('utf-8').decode(jsonBytes);
  const gltf: GltfJson = JSON.parse(jsonText);

  const binHeaderOffset = 20 + jsonLength;
  const binOffset = binHeaderOffset + 8;

  const accessors = gltf.accessors ?? [];
  const views = gltf.bufferViews ?? [];
  const materials = gltf.materials ?? [];
  const meshes = gltf.meshes ?? [];
  const nodes = gltf.nodes ?? [];

  // Compute architectural core bounds using primary base materials (1..9), ignoring distant 10/11 terrain.
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    const mesh = meshes[node.mesh];
    const tx = node.translation?.[0] ?? 0;
    const ty = node.translation?.[1] ?? 0;
    const tz = node.translation?.[2] ?? 0;
    for (const prim of mesh.primitives) {
      const matIdx = prim.material ?? 0;
      if (matIdx < 1 || matIdx > 9) continue;
      const posAcc = accessors[prim.attributes.POSITION];
      if (!posAcc?.min || !posAcc?.max) continue;
      min[0] = Math.min(min[0], posAcc.min[0] + tx);
      min[1] = Math.min(min[1], posAcc.min[1] + ty);
      min[2] = Math.min(min[2], posAcc.min[2] + tz);
      max[0] = Math.max(max[0], posAcc.max[0] + tx);
      max[1] = Math.max(max[1], posAcc.max[1] + ty);
      max[2] = Math.max(max[2], posAcc.max[2] + tz);
    }
  }

  const cx = (min[0] + max[0]) * 0.5;
  const baseY = min[1];
  const cz = (min[2] + max[2]) * 0.5;
  const span = Math.max(max[0] - min[0], max[2] - min[2], 1);
  const scale = 6.2 / span;

  const grouped = new Map<
    number,
    { pos: number[][]; norm: number[][]; idx: Uint32Array[]; totalVerts: number; totalIdx: number }
  >();

  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    const mesh = meshes[node.mesh];
    const tx = node.translation?.[0] ?? 0;
    const ty = node.translation?.[1] ?? 0;
    const tz = node.translation?.[2] ?? 0;

    for (const prim of mesh.primitives) {
      const posAccIdx = prim.attributes.POSITION;
      if (posAccIdx === undefined) continue;
      const posAcc = accessors[posAccIdx];
      const rawPos = readVec3Array(posAcc, views, binOffset, dv);

      const matIdx = prim.material ?? 0;
      // Skip extreme outer 10km landscape shells so fog/horizon never glitches
      if (matIdx === 10 || matIdx === 11) continue;

      let indices: Uint32Array;
      if (prim.indices !== undefined) {
        indices = readIndexArray(accessors[prim.indices], views, binOffset, dv);
      } else {
        indices = new Uint32Array(posAcc.count);
        for (let i = 0; i < posAcc.count; i++) indices[i] = i;
      }

      const normAccIdx = prim.attributes.NORMAL;
      const rawNorm =
        normAccIdx !== undefined
          ? readVec3Array(accessors[normAccIdx], views, binOffset, dv)
          : computeFlatNormals(rawPos, indices);

      const scaledPos = new Array<number>(rawPos.length);
      for (let i = 0; i < rawPos.length; i += 3) {
        scaledPos[i] = (rawPos[i] + tx - cx) * scale;
        scaledPos[i + 1] = (rawPos[i + 1] + ty - baseY) * scale;
        scaledPos[i + 2] = (rawPos[i + 2] + tz - cz) * scale;
      }

      let bucket = grouped.get(matIdx);
      if (!bucket) {
        bucket = { pos: [], norm: [], idx: [], totalVerts: 0, totalIdx: 0 };
        grouped.set(matIdx, bucket);
      }

      const vertOffset = bucket.totalVerts;
      const shiftedIdx = new Uint32Array(indices.length);
      for (let i = 0; i < indices.length; i++) {
        shiftedIdx[i] = indices[i] + vertOffset;
      }

      bucket.pos.push(scaledPos);
      bucket.norm.push(Array.from(rawNorm));
      bucket.idx.push(shiftedIdx);
      bucket.totalVerts += posAcc.count;
      bucket.totalIdx += indices.length;
    }
  }

  const batches: BaseBatch[] = [];
  for (const [matIdx, bucket] of grouped.entries()) {
    const positions = new Float32Array(bucket.totalVerts * 3);
    const normals = new Float32Array(bucket.totalVerts * 3);
    const indices = new Uint32Array(bucket.totalIdx);

    let vPtr = 0;
    for (let i = 0; i < bucket.pos.length; i++) {
      positions.set(bucket.pos[i], vPtr);
      normals.set(bucket.norm[i], vPtr);
      vPtr += bucket.pos[i].length;
    }

    let iPtr = 0;
    for (const chunk of bucket.idx) {
      indices.set(chunk, iPtr);
      iPtr += chunk.length;
    }

    const matName = materials[matIdx]?.name ?? `Material ${matIdx}`;
    const style = styleForMaterial(matIdx, matName);
    batches.push({
      materialIndex: matIdx,
      name: matName,
      positions,
      normals,
      indices,
      ...style,
    });
  }

  // Sort opaque batches before glass batches so translucent domes blend cleanly.
  batches.sort((a, b) => Number(a.isGlass) - Number(b.isGlass) || a.materialIndex - b.materialIndex);

  return {
    batches,
    radius: (span * scale) * 0.5,
    topY: (max[1] - baseY) * scale,
    entrancePoint: [0, 0.15, (max[2] - cz) * scale * 0.72],
  };
}

let cachedPromise: Promise<LoadedBaseModel> | null = null;

export function loadBaseGlb(): Promise<LoadedBaseModel> {
  if (!cachedPromise) {
    cachedPromise = fetch('/assets/base.glb')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(parseBaseGlb)
      .catch(err => {
        cachedPromise = null;
        throw err;
      });
  }
  return cachedPromise;
}
