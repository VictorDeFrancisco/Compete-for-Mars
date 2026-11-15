import { CIRCUIT_LAYOUTS } from './layouts';

export const COMPONENT_COUNT = 12;
export const ANOMALY_COUNT = 3;
export type ComponentKind = 'resistor' | 'lamp' | 'switch' | 'capacitor' | 'diode' | 'fuse' | 'coil' | 'meter' | 'battery';
export type ComponentState = 0 | 1;
export interface CircuitComponent {
  id: string; kind: ComponentKind; x: number; y: number; rotation: 0 | 90; reference: ComponentState; inspected: ComponentState;
}
export type CircuitPoint = readonly [number, number];
export interface CircuitWire { points: readonly CircuitPoint[] }
export interface CircuitBoard {
  seed: number; layoutId: number; system: string; voltage: number; components: readonly CircuitComponent[]; differences: readonly number[];
  wires: readonly CircuitWire[]; junctions: readonly CircuitPoint[]; ground: CircuitPoint;
}

const PREFIX: Record<ComponentKind, string> = { resistor: 'R', lamp: 'LED', switch: 'SW', capacitor: 'C', diode: 'D', fuse: 'F', coil: 'K', meter: 'M', battery: 'B' };
export const COMPONENT_NAMES: Record<ComponentKind, string> = { resistor: 'Resistor', lamp: 'LED', switch: 'Switch', capacitor: 'Capacitor', diode: 'Diode', fuse: 'Fuse', coil: 'Coil', meter: 'Meter', battery: 'Battery' };
const SYSTEMS = ['POWER DISTRIBUTION', 'HABITAT CONTROL', 'ROVER POWER SUPPLY', 'SOLAR REGULATOR'];

export function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) | 0;
    let n = Math.imul(value ^ value >>> 15, 1 | value);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
/** Both diagrams share the same wiring and components. Exactly three graphic states differ. */
export function generateCircuit(seed: number): CircuitBoard {
  seed >>>= 0;
  const layoutId = seed % CIRCUIT_LAYOUTS.length, layout = CIRCUIT_LAYOUTS[layoutId];
  const random = seededRandom(seed);
  const system = SYSTEMS[Math.floor(random() * SYSTEMS.length)];
  const voltage = [12, 24, 28][Math.floor(random() * 3)];
  const mirrored = random() < .5;
  const position = ([x, y]: CircuitPoint): CircuitPoint => [mirrored ? 600 - x : x, y];
  const differences = shuffle(Array.from({ length: COMPONENT_COUNT }, (_, i) => i), random).slice(0, ANOMALY_COUNT).sort((a, b) => a - b);
  const counts = new Map<ComponentKind, number>();
  const components = layout.parts.map(([kind, x, y, rotation], index): CircuitComponent => {
    const count = (counts.get(kind) ?? 0) + 1; counts.set(kind, count);
    const reference = Math.floor(random() * 2) as ComponentState;
    return { id: `${PREFIX[kind]}${count}`, kind, x: position([x, y])[0], y, rotation,
      reference, inspected: differences.includes(index) ? (1 - reference) as ComponentState : reference };
  });
  const neighbours = new Map<string, Set<string>>();
  for (const points of layout.wires) for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].join(','), b = points[i].join(',');
    if (!neighbours.has(a)) neighbours.set(a, new Set());
    if (!neighbours.has(b)) neighbours.set(b, new Set());
    neighbours.get(a)!.add(b); neighbours.get(b)!.add(a);
  }
  const junctions = [...neighbours].filter(([, nodes]) => nodes.size >= 3).map(([point]) => position(point.split(',').map(Number) as [number, number]));
  return { seed, layoutId, system, voltage, components, differences,
    wires: layout.wires.map(points => ({ points: points.map(position) })), junctions, ground: position(layout.ground) };
}

