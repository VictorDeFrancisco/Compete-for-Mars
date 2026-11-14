export interface MinigameContext {
  resources: Readonly<{ energy: number; food: number; radiation: number }>;
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
export function copyContext(context: MinigameContext): MinigameContext {
  const resources = context.resources;
  for (const key of ['energy', 'food', 'radiation'] as const) {
    if (!Number.isFinite(resources[key]) || resources[key] < 0 || resources[key] > 10) throw new Error('Recursos del minijuego fuera del rango 0–10.');
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
