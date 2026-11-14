import { randomUUID } from 'node:crypto';
import { CARD_CATALOG, cardUnavailable, drawCards, radiationDamage, resolveCards } from './cards';
import { BASE_STAT_CAP, clamp, clampPlayerResource, maxHealthFor } from './playerLimits';
export { BASE_STAT_CAP, clamp, clampResource, clampPlayerResource, maxHealthFor, maxResourceFor } from './playerLimits';
import { MINIGAMES } from '../shared/minigames/catalog';
import { rankResults, timeoutResult, validateResult } from '../shared/minigames/ranking';
import type { MinigameResult } from '../shared/minigames/types';
import { CARDS_MS, MAX_PLAYERS, STAT_BUDGET } from '../shared/constants';
import type { Card, Entry, GameView, MinigameDefinition, PublicPlayer, Resources, RoundResult, Stats, CardOutcome, PlayerProtection } from '../shared/types';

export const CARDS: Card[] = CARD_CATALOG;
export { MINIGAMES };
export const RESULT_GRACE_MS = 1500;
export const ROUND_RESOURCE_UPKEEP = 5;
export const BASE_WIN_RESOURCE_BONUS = 20;
export const WIN_BONUS_ROUND_DECAY = 2;
export const RADIATION_HEALTH_DAMAGE = 5;
export const EMPTY_RESOURCE_HEALTH_DAMAGE = 10;

export interface Player extends PublicPlayer {
  token: string;
  socketId: string | null;
  stats: Stats;
  resources: Resources;
  selectedCardId: string | null;
  score: number | null;
  result: MinigameResult | null;
  selectedTargetId: string | null;
  protection: PlayerProtection;
  cardOutcome: CardOutcome | null;
}

export interface Room {
  code: string; hostId: string; phase: GameView['phase']; phaseId: string;
  round: number; deadline: number | null; players: Player[];
  minigame: MinigameDefinition; minigameHistory: string[]; cards: Card[];
  lastResults: RoundResult[]; winnerId: string | null; lastActive: number;
  cardsResolved: boolean; competitive: boolean; matchFinished: boolean;
}

export function requireRule(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function minigameRewardResource(definition: MinigameDefinition): 'energy' | 'food' {
  const energy = definition.rewards.winner.resources?.energy ?? 0;
  const food = definition.rewards.winner.resources?.food ?? 0;
  return food > energy ? 'food' : 'energy';
}

export function roundWinBonus(round: number, baseBonus = BASE_WIN_RESOURCE_BONUS): number {
  return Math.max(0, baseBonus - Math.max(0, round - 1) * WIN_BONUS_ROUND_DECAY);
}

export function roundLoserDamage(round: number, deaths: number): number {
  return Math.max(1, round) * (Math.max(0, deaths) + 1);
}

export function pickNextMinigame(room: Room, random: () => number = Math.random): MinigameDefinition {
  // Guarantee at least 2 other minigames between repeats whenever catalog size allows.
  const excludeCount = Math.min(2, Math.max(0, MINIGAMES.length - 1));
  const recent = new Set(room.minigameHistory.slice(-excludeCount));
  const candidates = MINIGAMES.filter(minigame => !recent.has(minigame.id));
  const pool = candidates.length > 0 ? candidates : MINIGAMES;
  const chosen = pool[Math.floor(random() * pool.length)] ?? pool[0];
  room.minigameHistory.push(chosen.id);
  return chosen;
}

export function validateEntry(input: unknown): Entry {
  const entry = input as Partial<Entry> | null;
  requireRule(entry && typeof entry.name === 'string', 'Introduce un nombre.');
  const name = entry.name.trim();
  requireRule(name.length >= 1 && name.length <= 24, 'El nombre debe tener entre 1 y 24 caracteres.');
  const stats = entry.stats;
  requireRule(stats && ['energy', 'food', 'health'].every(key => {
    const value = stats[key as keyof Stats];
    return Number.isInteger(value) && value >= 0 && value <= STAT_BUDGET;
  }), `Cada estadística debe ser un entero entre 0 y ${STAT_BUDGET}.`);
  requireRule(stats.energy + stats.food + stats.health === STAT_BUDGET, `Reparte exactamente ${STAT_BUDGET} puntos.`);
  return { name, stats: { energy: stats.energy, food: stats.food, health: stats.health } };
}

export function makePlayer(entry: Entry, token: string, socketId: string | null, isBot = false): Player {
  const maxHealth = maxHealthFor(entry);
  return {
    id: randomUUID(),
    ...entry,
    token,
    socketId,
    health: maxHealth,
    maxHealth,
    isBot,
    connected: true,
    ready: isBot,
    hasChosenCard: false,
    hasSubmitted: false,
    selectedCardId: null,
    score: null,
    result: null,
    selectedTargetId: null, protection: { radiationShield: false, reinforcedSuit: false }, cardOutcome: null,
    resources: {
      energy: BASE_STAT_CAP + entry.stats.energy,
      food: BASE_STAT_CAP + entry.stats.food,
      radiation: 0,
    },
  };
}

export function makeRoom(code: string, player: Player, now = Date.now()): Room {
  const initialMinigame = MINIGAMES[0];
  return {
    code,
    hostId: player.id,
    phase: 'lobby',
    phaseId: randomUUID(),
    round: 0,
    deadline: null,
    players: [player],
    minigame: initialMinigame,
    minigameHistory: [],
    cards: [],
    cardsResolved: false, competitive: false, matchFinished: false,
    lastResults: [],
    winnerId: null,
    lastActive: now,
  };
}

export function publicPlayer(player: Player): PublicPlayer {
  const { id, name, health, isBot, connected, ready, hasChosenCard, hasSubmitted } = player;
  return { id, name, health, maxHealth: maxHealthFor(player), isBot, connected, ready, hasChosenCard, hasSubmitted };
}

export function viewFor(room: Room, player: Player, now = Date.now()): GameView {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    phaseId: room.phaseId,
    round: room.round,
    deadline: room.deadline,
    serverNow: now,
    players: room.players.map(publicPlayer),
    self: {
      ...publicPlayer(player),
      stats: { ...player.stats },
      resources: { ...player.resources },
      selectedCardId: player.selectedCardId,
      selectedTargetId: player.selectedTargetId,
      protection: { ...player.protection },
      cardOutcome: player.cardOutcome ? structuredClone(player.cardOutcome) : null,
      score: player.score,
      result: player.result ? { ...player.result } : null,
    },
    cards: structuredClone(room.cards),
    minigame: room.minigame,
    lastResults: room.lastResults.map(result => ({ ...result })),
    winnerId: room.winnerId,
    matchFinished: room.matchFinished,
  };
}

function transition(room: Room, phase: Room['phase'], duration: number | null, now: number) {
  room.phase = phase; room.phaseId = randomUUID();
  room.deadline = duration === null ? null : now + duration;
  room.lastActive = now;
}

export function startRound(room: Room, actor: Player, now = Date.now(), random: () => number = Math.random) {
  requireRule(room.phase === 'lobby' && room.hostId === actor.id, 'Solo el anfitrión puede iniciar desde el lobby.');
  const alivePlayers = room.players.filter(p => p.health > 0);
  requireRule(alivePlayers.length > 0 && !room.matchFinished && room.winnerId === null, 'La partida ya ha terminado.');
  requireRule(room.players.length <= MAX_PLAYERS && alivePlayers.every(p => p.connected && p.ready), 'Todos los supervivientes deben estar conectados y listos.');
  room.round++;
  room.minigame = pickNextMinigame(room, random);
  room.cards = drawCards(alivePlayers, random); room.cardsResolved = false;
  room.competitive ||= alivePlayers.length > 1;
  for (const player of room.players) {
    player.ready = player.isBot && player.health > 0;
    player.hasChosenCard = player.health <= 0;
    player.hasSubmitted = player.health <= 0;
    player.selectedCardId = null; player.selectedTargetId = null; player.cardOutcome = null;
    player.score = null;
    player.result = null;
  }
  transition(room, 'presentation', null, now);
}

export function currentPhase(room: Room, expected: Room['phase'], phaseId: unknown) {
  requireRule(room.phase === expected && phaseId === room.phaseId, 'Esta acción ya no corresponde a la fase actual.');
}

export function chooseCard(room: Room, player: Player, cardId: unknown, targetId?: unknown) {
  requireRule(room.phase === 'cards' && room.players.includes(player), 'No puedes elegir cartas en esta fase.');
  requireRule(!player.hasChosenCard, 'Ya has elegido una carta.');
  const card = room.cards.find(c => c.id === cardId);
  requireRule(card, 'Esta carta no está disponible en la ronda.');
  const unavailable = cardUnavailable(player, card);
  requireRule(!unavailable, unavailable ?? 'Carta no disponible.');
  if (card.targetRequired) {
    requireRule(typeof targetId === 'string' && room.players.some(p => p.id === targetId && p.id !== player.id && p.health > 0), 'Elige a otro jugador vivo como objetivo.');
  } else requireRule(targetId === undefined || targetId === null, 'Esta carta no admite objetivo.');
  player.selectedCardId = card.id; player.selectedTargetId = card.targetRequired ? targetId as string : null; player.hasChosenCard = true;
}
export function submitResult(room: Room, player: Player, input: unknown) {
  requireRule(player.health > 0 && room.phase === 'playing', 'Los jugadores eliminados no pueden enviar resultado.');
  requireRule(!player.hasSubmitted, 'Ya has enviado tu resultado.');
  const result = validateResult(room.minigame, input);
  requireRule(result.reason !== 'aborted', 'Un intento abortado no se puede enviar.');
  player.result = result; player.score = result.score; player.hasSubmitted = true;
}

export function advanceIfComplete(room: Room, now = Date.now()): boolean {
  const timedOut = room.deadline !== null && now >= room.deadline;
  const alivePlayers = room.players.filter(p => p.health > 0);

  if (room.phase === 'presentation' && (timedOut || alivePlayers.every(p => p.ready))) {
    transition(room, 'cards', CARDS_MS, now);
    return true;
  }

  if (room.phase === 'cards' && (timedOut || alivePlayers.every(p => p.hasChosenCard))) {
    const fallback = room.cards.find(c => c.id === 'rest' || c.id === 'eat')!;
    for (const player of alivePlayers) {
      if (!player.hasChosenCard) chooseCard(room, player, fallback.id);
    }
    resolveCards(room);
    if (finishMatchIfNeeded(room)) { transition(room, 'lobby', null, now); return true; }
    transition(room, 'playing', room.minigame.durationMs, now);
    return true;
  }

  if (
    room.phase === 'playing' &&
    ((room.deadline !== null && now >= room.deadline + RESULT_GRACE_MS) || alivePlayers.every(p => p.hasSubmitted))
  ) {
    const ranking = rankResults(
      room.minigame,
      alivePlayers.map(player => ({ playerId: player.id, result: player.result ?? timeoutResult(room.minigame) })),
    );
    const deathsBefore = room.players.filter(p => p.health <= 0).length;
    const rewardResource = minigameRewardResource(room.minigame);
    const baseBonus = room.minigame.rewards.winner.resources?.[rewardResource] ?? BASE_WIN_RESOURCE_BONUS;
    const winBonus = roundWinBonus(room.round, baseBonus);
    const loserPenalty = roundLoserDamage(room.round, deathsBefore);

    room.lastResults = ranking.map(entry => {
      const player = room.players.find(p => p.id === entry.playerId)!;
      const previousHealth = player.health;
      const previousResources = { ...player.resources };

      // 1. Every round after playing a minigame drains 5 energy and 5 food.
      player.resources.energy = clampPlayerResource(player, 'energy', player.resources.energy - ROUND_RESOURCE_UPKEEP);
      player.resources.food = clampPlayerResource(player, 'food', player.resources.food - ROUND_RESOURCE_UPKEEP);

      // 2. Minigame winner gains +20 (decaying by round) of the minigame's primary resource.
      if (entry.outcome === 'winner' && winBonus > 0) {
        player.resources[rewardResource] = clampPlayerResource(player, rewardResource, player.resources[rewardResource] + winBonus);
      }

      // 3. Apply health penalties: last place + radiation + depleted food/energy.
      let healthDelta = entry.outcome === 'loser' ? -loserPenalty : 0;
      if (player.resources.food === 0) healthDelta -= EMPTY_RESOURCE_HEALTH_DAMAGE;
      if (player.resources.energy === 0) healthDelta -= EMPTY_RESOURCE_HEALTH_DAMAGE;

      player.health = clamp(player.health + healthDelta, 0, maxHealthFor(player));
      radiationDamage(player, RADIATION_HEALTH_DAMAGE);
      player.maxHealth = maxHealthFor(player);
      player.ready = player.isBot && player.health > 0;

      return {
        playerId: player.id,
        name: player.name,
        score: entry.result.score,
        rank: entry.rank,
        outcome: entry.outcome,
        completed: entry.result.completed,
        elapsedMs: entry.result.elapsedMs,
        healthDelta: player.health - previousHealth,
        resourcesDelta: {
          energy: player.resources.energy - previousResources.energy,
          food: player.resources.food - previousResources.food,
          radiation: player.resources.radiation - previousResources.radiation,
        },
      };
    });

    finishMatchIfNeeded(room, ranking[0]?.playerId ?? null);

    transition(room, 'lobby', null, now);
    return true;
  }

  return false;
}

function finishMatchIfNeeded(room: Room, fallbackWinner: string | null = null): boolean {
  const alive = room.players.filter(p => p.health > 0);
  if (alive.length === 0 || (room.competitive && alive.length === 1)) {
    room.matchFinished = true;
    // Main uses the best ranked player to break a simultaneous final elimination.
    room.winnerId = alive[0]?.id ?? (room.competitive ? fallbackWinner : null);
    return true;
  }
  return false;
}
