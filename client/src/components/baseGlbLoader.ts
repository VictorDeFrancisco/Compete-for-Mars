export interface BaseBatch {
  materialIndex: number;
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  color: [number, number, number, number];
  metalness: number;
  roughness: number;
  matMode: 0 | 1 | 2; // 0 = architecture/metal, 1 = Mars terrain, 2 = glass
}

export interface LoadedBaseModel {
  batches: readonly BaseBatch[];
  radius: number;
  topY: number;
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
  asset?: { generator?: string };
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
  matMode: 0 | 1 | 2;
}

function styleForMaterial(index: number, name: string): MaterialStyle {
  const lower = name.toLowerCase();
  if (lower.includes('vidrio')) {
    return { color: [0.58, 0.83, 0.96, 0.30], metalness: 0.15, roughness: 0.08, matMode: 2 };
  }
  if (index === 0) {
    return { color: [0.58, 0.25, 0.13, 1], metalness: 0.0, roughness: 0.95, matMode: 1 };
  }
  if (lower.includes('gema')) {
    // Geodesic dome matte ceramic panels (solid, matching sunset reference)
    return { color: [0.89, 0.82, 0.70, 1], metalness: 0.06, roughness: 0.55, matMode: 0 };
  }
  if (lower.includes('metal')) {
    return { color: [0.27, 0.32, 0.38, 1], metalness: 0.72, roughness: 0.32, matMode: 0 };
  }
  if (lower.includes('pintura (1)')) {
    return { color: [0.83, 0.41, 0.19, 1], metalness: 0.14, roughness: 0.45, matMode: 0 };
  }
  if (lower.includes('pintura (2)')) {
    return { color: [0.20, 0.24, 0.29, 1], metalness: 0.25, roughness: 0.52, matMode: 0 };
  }
  if (lower === 'pintura') {
    // Structural frame around the geodesic dome
    return { color: [0.26, 0.29, 0.34, 1], metalness: 0.38, roughness: 0.42, matMode: 0 };
  }
  if (lower.includes('pintura')) {
    return { color: [0.92, 0.89, 0.82, 1], metalness: 0.08, roughness: 0.42, matMode: 0 };
  }
  if (lower.includes('plástico (1)')) {
    return { color: [0.91, 0.87, 0.79, 1], metalness: 0.10, roughness: 0.46, matMode: 0 };
  }
  return { color: [0.76, 0.71, 0.63, 1], metalness: 0.15, roughness: 0.5, matMode: 0 };
}

function componentByteSize(componentType: number): number {
  switch (componentType) {
    case 5121: return 1;
    case 5123: return 2;
    case 5125: return 4;
    case 5126: return 4;
    default: return 4;
  }
}

function readVec3Contiguous(
  accessor: GltfAccessor,
  views: readonly GltfBufferView[],
  binOffset: number,
  buffer: ArrayBuffer,
  view: DataView,
): Float32Array {
  if (accessor.bufferView === undefined) return new Float32Array(accessor.count * 3);
  const bv = views[accessor.bufferView];
  const base = binOffset + (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  if ((!bv.byteStride || bv.byteStride === 12) && base % 4 === 0) {
    return new Float32Array(buffer, base, accessor.count * 3);
  }
  const stride = bv.byteStride ?? 12;
  const out = new Float32Array(accessor.count * 3);
  for (let i = 0; i < accessor.count; i++) {
    const off = base + i * stride;
    out[i * 3] = view.getFloat32(off, true);
    out[i * 3 + 1] = view.getFloat32(off + 4, true);
    out[i * 3 + 2] = view.getFloat32(off + 8, true);
  }
  return out;
}

function readIndexContiguous(
  accessor: GltfAccessor,
  views: readonly GltfBufferView[],
  binOffset: number,
  buffer: ArrayBuffer,
  view: DataView,
): Uint32Array {
  if (accessor.bufferView === undefined) return new Uint32Array(accessor.count);
  const bv = views[accessor.bufferView];
  const base = binOffset + (bv.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  if (accessor.componentType === 5125 && (!bv.byteStride || bv.byteStride === 4) && base % 4 === 0) {
    return new Uint32Array(buffer, base, accessor.count);
  }
  const cSize = componentByteSize(accessor.componentType);
  const stride = bv.byteStride ?? cSize;
  const out = new Uint32Array(accessor.count);
  for (let i = 0; i < accessor.count; i++) {
    const off = base + i * stride;
    if (accessor.componentType === 5125) out[i] = view.getUint32(off, true);
    else if (accessor.componentType === 5123) out[i] = view.getUint16(off, true);
    else out[i] = view.getUint8(off);
  }
  return out;
}

/**
 * Parses pre-optimized or raw GLTF 2.0 binary `.glb` into WebGL-ready material batches.
 */
export function parseBaseGlb(buffer: ArrayBuffer): LoadedBaseModel {
  const dv = new DataView(buffer);
  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) throw new Error('Archivo GLB inválido.');

  const jsonLength = dv.getUint32(12, true);
  const jsonText = new TextDecoder('utf-8').decode(new Uint8Array(buffer, 20, jsonLength));
  const gltf: GltfJson = JSON.parse(jsonText);
  const binOffset = 20 + jsonLength + 8;

  const accessors = gltf.accessors ?? [];
  const views = gltf.bufferViews ?? [];
  const materials = gltf.materials ?? [];
  const meshes = gltf.meshes ?? [];
  const nodes = gltf.nodes ?? [];
  const isPreOpt = gltf.asset?.generator === 'mars-base-opt';

  if (isPreOpt) {
    const batches: BaseBatch[] = [];
    for (const node of nodes) {
      if (node.mesh === undefined) continue;
      for (const prim of meshes[node.mesh].primitives) {
        const matIdx = prim.material ?? 0;
        const posAcc = accessors[prim.attributes.POSITION];
        const normAcc = prim.attributes.NORMAL !== undefined ? accessors[prim.attributes.NORMAL] : undefined;
        const idxAcc = prim.indices !== undefined ? accessors[prim.indices] : undefined;
        if (!posAcc || !normAcc || !idxAcc) continue;
        const positions = readVec3Contiguous(posAcc, views, binOffset, buffer, dv);
        const normals = readVec3Contiguous(normAcc, views, binOffset, buffer, dv);
        const indices = readIndexContiguous(idxAcc, views, binOffset, buffer, dv);
        const matName = materials[matIdx]?.name ?? `Material ${matIdx}`;
        batches.push({
          materialIndex: matIdx,
          name: matName,
          positions,
          normals,
          indices,
          ...styleForMaterial(matIdx, matName),
        });
      }
    }
    batches.sort((a, b) => (a.matMode === 2 ? 1 : 0) - (b.matMode === 2 ? 1 : 0) || a.materialIndex - b.materialIndex);
    return { batches, radius: 3.1, topY: 0.92 };
  }

  // Fallback path for non-optimized raw GLBs
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    for (const prim of meshes[node.mesh].primitives) {
      const matIdx = prim.material ?? 0;
      if (matIdx < 1 || matIdx > 9) continue;
      const posAcc = accessors[prim.attributes.POSITION];
      if (!posAcc?.min || !posAcc?.max) continue;
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], posAcc.min[k]);
        max[k] = Math.max(max[k], posAcc.max[k]);
      }
    }
  }
  const cx = (min[0] + max[0]) * 0.5;
  const baseY = min[1];
  const cz = (min[2] + max[2]) * 0.5;
  const span = Math.max(max[0] - min[0], max[2] - min[2], 1);
  const scale = 6.2 / span;

  const grouped = new Map<number, { pos: Float32Array[]; norm: Float32Array[]; idx: Uint32Array[]; totalVerts: number; totalIdx: number }>();
  for (const node of nodes) {
    if (node.mesh === undefined) continue;
    for (const prim of meshes[node.mesh].primitives) {
      const matIdx = prim.material ?? 0;
      if (matIdx === 10 || matIdx === 11) continue;
      const posAcc = accessors[prim.attributes.POSITION];
      const normAcc = prim.attributes.NORMAL !== undefined ? accessors[prim.attributes.NORMAL] : undefined;
      if (!posAcc || !normAcc) continue;
      const rawPos = readVec3Contiguous(posAcc, views, binOffset, buffer, dv);
      const rawNorm = readVec3Contiguous(normAcc, views, binOffset, buffer, dv);
      const indices = prim.indices !== undefined
        ? readIndexContiguous(accessors[prim.indices], views, binOffset, buffer, dv)
        : Uint32Array.from({ length: posAcc.count }, (_, i) => i);

      const scaledPos = new Float32Array(rawPos.length);
      for (let i = 0; i < rawPos.length; i += 3) {
        scaledPos[i] = (rawPos[i] - cx) * scale;
        scaledPos[i + 1] = (rawPos[i + 1] - baseY) * scale;
        scaledPos[i + 2] = (rawPos[i + 2] - cz) * scale;
      }

      let bucket = grouped.get(matIdx);
      if (!bucket) {
        bucket = { pos: [], norm: [], idx: [], totalVerts: 0, totalIdx: 0 };
        grouped.set(matIdx, bucket);
      }
      const off = bucket.totalVerts;
      const shiftedIdx = new Uint32Array(indices.length);
      for (let i = 0; i < indices.length; i++) shiftedIdx[i] = indices[i] + off;
      bucket.pos.push(scaledPos);
      bucket.norm.push(rawNorm);
      bucket.idx.push(shiftedIdx);
      bucket.totalVerts += posAcc.count;
      bucket.totalIdx += indices.length;
    }
  }

  const batches: BaseBatch[] = [];
  for (const [matIdx, b] of grouped.entries()) {
    const positions = new Float32Array(b.totalVerts * 3);
    const normals = new Float32Array(b.totalVerts * 3);
    const indices = new Uint32Array(b.totalIdx);
    let vp = 0;
    for (let i = 0; i < b.pos.length; i++) {
      positions.set(b.pos[i], vp);
      normals.set(b.norm[i], vp);
      vp += b.pos[i].length;
    }
    let ip = 0;
    for (const chunk of b.idx) {
      indices.set(chunk, ip);
      ip += chunk.length;
    }
    const matName = materials[matIdx]?.name ?? `Material ${matIdx}`;
    batches.push({ materialIndex: matIdx, name: matName, positions, normals, indices, ...styleForMaterial(matIdx, matName) });
  }
  batches.sort((a, b) => (a.matMode === 2 ? 1 : 0) - (b.matMode === 2 ? 1 : 0) || a.materialIndex - b.materialIndex);
  return { batches, radius: (span * scale) * 0.5, topY: (max[1] - baseY) * scale };
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
