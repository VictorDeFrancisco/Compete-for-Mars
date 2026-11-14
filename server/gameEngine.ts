import { randomUUID } from 'node:crypto';
import cardsData from './data/boardSlots.json';
import minigamesData from './data/minigames.json';
import { CARDS_MS, MAX_PLAYERS, PRESENTATION_MS, STAT_BUDGET } from '../shared/constants';
import type { Card, Entry, GameView, MinigameDefinition, PublicPlayer, Resources, RoundResult, Stats } from '../shared/types';

export const CARDS: Card[] = cardsData;
export const MINIGAMES: MinigameDefinition[] = minigamesData;
export interface Player extends PublicPlayer {
  token: string;
  socketId: string | null;
  stats: Stats;
  resources: Resources;
  selectedCardId: string | null;
  score: number | null;
}
export interface Room {
  code: string; hostId: string; phase: GameView['phase']; phaseId: string;
  round: number; deadline: number | null; players: Player[];
  minigame: MinigameDefinition; lastResults: RoundResult[]; lastActive: number;
}
export const clamp = (n: number, low = 0, high = 10) => Math.max(low, Math.min(high, n));
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
    ready: isBot, hasChosenCard: false, hasSubmitted: false, selectedCardId: null, score: null,
    resources: { energy: 4 + entry.stats.energy, food: 4 + entry.stats.food, radiation: 0 } };
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
      selectedCardId: player.selectedCardId, score: player.score },
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
    player.selectedCardId = null; player.score = null;
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
export function submitScore(player: Player, score: unknown) {
  requireRule(!player.hasSubmitted, 'Ya has enviado tu resultado.');
  requireRule(typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 100, 'La puntuación debe estar entre 0 y 100.');
  player.score = score; player.hasSubmitted = true;
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
        player.resources[key] = clamp(player.resources[key] + (card.effect[key] ?? 0));
      }
    }
    transition(room, 'playing', room.minigame.durationMs, now); return true;
  }
  if (room.phase === 'playing' && (timedOut || room.players.every(p => p.hasSubmitted))) {
    room.lastResults = room.players.map(player => {
      const score = player.score ?? 0;
      // Equilibrio provisional: sin eliminación mientras se desarrolla el ciclo.
      const delta = score >= 50 ? 5 : -5;
      const previousHealth = player.health;
      player.health = clamp(player.health + delta, 1, 100);
      player.resources.energy = clamp(player.resources.energy - 1);
      player.resources.food = clamp(player.resources.food - 1);
      player.ready = player.isBot;
      return { playerId: player.id, name: player.name, score, healthDelta: player.health - previousHealth };
    });
    transition(room, 'lobby', null, now); return true;
  }
  return false;
}
