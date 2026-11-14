import { randomUUID } from 'node:crypto';
import cardsData from './data/boardSlots.json';
import { MINIGAMES } from '../shared/minigames/catalog';
import { rankResults, timeoutResult, validateResult } from '../shared/minigames/ranking';
import type { MinigameResult, Reward } from '../shared/minigames/types';
import { CARDS_MS, MAX_PLAYERS, PRESENTATION_MS, STAT_BUDGET } from '../shared/constants';
import type { Card, Entry, GameView, MinigameDefinition, PublicPlayer, Resources, RoundResult, Stats } from '../shared/types';

export const CARDS: Card[] = cardsData;
export { MINIGAMES };
export const RESULT_GRACE_MS = 1500;
export interface Player extends PublicPlayer {
  token: string;
  socketId: string | null;
  stats: Stats;
  resources: Resources;
  selectedCardId: string | null;
  score: number | null;
  result: MinigameResult | null;
}
export interface Room {
  code: string; hostId: string; phase: GameView['phase']; phaseId: string;
  round: number; deadline: number | null; players: Player[];
  minigame: MinigameDefinition; lastResults: RoundResult[]; lastActive: number;
}
export const clamp = (n: number, low = 0, high = 100) => Math.max(low, Math.min(high, n));
export function clampResource(key: keyof Resources, value: number): number {
  return key === 'radiation' ? Math.max(0, value) : clamp(value, 0, 100);
}
export function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function validateEntry(input: unknown): Entry {
  const entry = input as Partial<Entry> | null;
  requireRule(entry && typeof entry.name === 'string', 'Introduce un nombre.');
  const name = entry.name.trim();
  requireRule(name.length >= 1 && name.length <= 24, 'El nombre debe tener entre 1 y 24 caracteres.');
  const stats = entry.stats;
  requireRule(stats && ['energy', 'food', 'shielding'].every(key => {
    const value = stats[key as keyof Stats];
    return Number.isInteger(value) && value >= 0 && value <= 4;
  }), 'Cada estadística debe ser un entero entre 0 y 4.');
  requireRule(stats.energy + stats.food + stats.shielding === STAT_BUDGET, 'Reparte exactamente 6 puntos.');
  return { name, stats: { energy: stats.energy, food: stats.food, shielding: stats.shielding } };
}
export function makePlayer(entry: Entry, token: string, socketId: string | null, isBot = false): Player {
  return { id: randomUUID(), ...entry, token, socketId, health: 100, isBot, connected: true,
    ready: isBot, hasChosenCard: false, hasSubmitted: false, selectedCardId: null, score: null, result: null,
    resources: { energy: 100, food: 100, radiation: 0 } };
}
export function makeRoom(code: string, player: Player, now = Date.now()): Room {
  return { code, hostId: player.id, phase: 'lobby', phaseId: randomUUID(), round: 0,
    deadline: null, players: [player], minigame: MINIGAMES[0], lastResults: [], lastActive: now };
}
export function publicPlayer(player: Player): PublicPlayer {
  const { id, name, health, isBot, connected, ready, hasChosenCard, hasSubmitted } = player;
  return { id, name, health, isBot, connected, ready, hasChosenCard, hasSubmitted };
}
export function viewFor(room: Room, player: Player, now = Date.now()): GameView {
  return { code: room.code, hostId: room.hostId, phase: room.phase, phaseId: room.phaseId,
    round: room.round, deadline: room.deadline, serverNow: now,
    players: room.players.map(publicPlayer),
    self: { ...publicPlayer(player), stats: { ...player.stats }, resources: { ...player.resources },
      selectedCardId: player.selectedCardId, score: player.score, result: player.result ? { ...player.result } : null },
    cards: CARDS, minigame: room.minigame, lastResults: room.lastResults.map(result => ({ ...result })) };
}
function transition(room: Room, phase: Room['phase'], duration: number | null, now: number) {
  room.phase = phase; room.phaseId = randomUUID();
  room.deadline = duration === null ? null : now + duration;
  room.lastActive = now;
}
export function startRound(room: Room, actor: Player, now = Date.now()) {
  requireRule(room.phase === 'lobby' && room.hostId === actor.id, 'Solo el anfitrión puede iniciar desde el lobby.');
  requireRule(room.players.length > 0 && room.players.length <= MAX_PLAYERS && room.players.every(p => p.connected && p.ready), 'Todos deben estar conectados y listos.');
  room.round++;
  room.minigame = MINIGAMES[(room.round - 1) % MINIGAMES.length];
  for (const player of room.players) {
    player.ready = player.isBot; player.hasChosenCard = false; player.hasSubmitted = false;
    player.selectedCardId = null; player.score = null; player.result = null;
  }
  transition(room, 'presentation', PRESENTATION_MS, now);
}
export function currentPhase(room: Room, expected: Room['phase'], phaseId: unknown) {
  requireRule(room.phase === expected && phaseId === room.phaseId, 'Esta acción ya no corresponde a la fase actual.');
}
export function chooseCard(room: Room, player: Player, cardId: unknown) {
  requireRule(!player.hasChosenCard, 'Ya has elegido una carta.');
  requireRule(CARDS.some(card => card.id === cardId), 'Carta desconocida.');
  player.selectedCardId = cardId as string; player.hasChosenCard = true;
}
export function submitResult(room: Room, player: Player, input: unknown) {
  requireRule(!player.hasSubmitted, 'Ya has enviado tu resultado.');
  const result = validateResult(room.minigame, input);
  requireRule(result.reason !== 'aborted', 'Un intento abortado no se puede enviar.');
  player.result = result; player.score = result.score; player.hasSubmitted = true;
}
export function advanceIfComplete(room: Room, now = Date.now()): boolean {
  const timedOut = room.deadline !== null && now >= room.deadline;
  if (room.phase === 'presentation' && (timedOut || room.players.every(p => p.ready))) {
    transition(room, 'cards', CARDS_MS, now); return true;
  }
  if (room.phase === 'cards' && (timedOut || room.players.every(p => p.hasChosenCard))) {
    for (const player of room.players) {
      if (!player.hasChosenCard) chooseCard(room, player, CARDS[0].id);
      const card = CARDS.find(c => c.id === player.selectedCardId)!;
      for (const key of Object.keys(card.effect) as (keyof Resources)[]) {
        player.resources[key] = clampResource(key, player.resources[key] + (card.effect[key] ?? 0));
      }
    }
    transition(room, 'playing', room.minigame.durationMs, now); return true;
  }
  if (room.phase === 'playing' && ((room.deadline !== null && now >= room.deadline + RESULT_GRACE_MS) || room.players.every(p => p.hasSubmitted))) {
    const ranking = rankResults(room.minigame, room.players.map(player => ({ playerId: player.id, result: player.result ?? timeoutResult(room.minigame) })));
    room.lastResults = ranking.map(entry => {
      const player = room.players.find(p => p.id === entry.playerId)!;
      const reward: Reward = entry.outcome === 'winner' ? room.minigame.rewards.winner
        : entry.outcome === 'loser' ? room.minigame.rewards.loser : {};
      const previousHealth = player.health;
      const previousResources = { ...player.resources };
      player.health = clamp(player.health + (reward.health ?? 0), 1, 100);
      for (const key of ['energy', 'food', 'radiation'] as const) {
        player.resources[key] = clampResource(key, player.resources[key] + (reward.resources?.[key] ?? 0));
      }
      player.ready = player.isBot;
      return { playerId: player.id, name: player.name, score: entry.result.score, rank: entry.rank, outcome: entry.outcome,
        completed: entry.result.completed, elapsedMs: entry.result.elapsedMs, healthDelta: player.health - previousHealth,
        resourcesDelta: { energy: player.resources.energy - previousResources.energy,
          food: player.resources.food - previousResources.food, radiation: player.resources.radiation - previousResources.radiation } };
    });
    transition(room, 'lobby', null, now); return true;
  }
  return false;
}
