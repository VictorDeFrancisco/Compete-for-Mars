export interface MinigameContext {
  resources: Readonly<{ energy: number; food: number; radiation: number }>;
  seed?: number;
}
export interface ResourceModifiers {
  speedMultiplier: number;
  scoreMultiplier: number;
  actionCooldownMs: number;
  reactionDelayMs: number;
}
/** Recursos completos por defecto para probar una clase sin contexto de sala. */
export const DEFAULT_MINIGAME_CONTEXT: MinigameContext = Object.freeze({
  resources: Object.freeze({ energy: 10, food: 10, radiation: 0 }),
});

/** PRNG determinista Mulberry32 en [0, 1) para compartir exactamente la misma secuencia entre jugadores. */
export function seededPrng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deriva una semilla de 32 bits estable (FNV-1a) a partir de los identificadores comunes de la ronda. */
export function deriveRoundSeed(...parts: readonly (string | number | undefined)[]): number {
  let hash = 0x811C9DC5;
  for (const part of parts) {
    const str = String(part ?? '');
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hash ^= 0xFF;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 1;
}

export function copyContext(context: MinigameContext): MinigameContext {
  const resources = context.resources;
  for (const key of ['energy', 'food', 'radiation'] as const) {
    if (!Number.isFinite(resources[key]) || resources[key] < 0 || resources[key] > 10) throw new Error('Recursos del minijuego fuera del rango 0–10.');
  }
  if (typeof context.seed === 'number' && Number.isFinite(context.seed)) {
    return Object.freeze({ resources: Object.freeze({ ...resources }), seed: context.seed >>> 0 });
  }
  return Object.freeze({ resources: Object.freeze({ ...resources }) });
}
/** Equilibrio inicial, común y modificable: nunca bloquea por completo al jugador. */
export function resourceModifiers(context: MinigameContext): Readonly<ResourceModifiers> {
  const { energy, food } = copyContext(context).resources;
  return Object.freeze({
    speedMultiplier: 0.75 + energy * 0.025,
    scoreMultiplier: 0.75 + food * 0.025,
    actionCooldownMs: Math.round((10 - energy) * 25),
    reactionDelayMs: Math.round((10 - food) * 15),
  });
}
