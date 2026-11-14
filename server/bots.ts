import { cardUnavailable } from './cards';
import { CARDS_MS, DEFAULT_STATS, MAX_PLAYERS, PRESENTATION_MS, SUIT_COLOR_PALETTE } from '../shared/constants';
import { chooseCard, makePlayer, submitResult, type Room } from './gameEngine';
export function fillBots(room: Room) {
  while (room.players.length < MAX_PLAYERS) {
    const usedColors = new Set(room.players.map(p => p.suitColor));
    const botColor =
      SUIT_COLOR_PALETTE.find(color => !usedColors.has(color)) ??
      SUIT_COLOR_PALETTE[room.players.length % SUIT_COLOR_PALETTE.length];
    room.players.push(
      makePlayer({ name: `Bot ${room.players.length}`, stats: { ...DEFAULT_STATS } }, '', null, true, botColor, room.players.length),
    );
  }
}
export function playBots(room: Room, now: number): boolean {
  if (!room.deadline) return false;
  const duration = room.phase === 'playing' ? room.minigame.durationMs : room.phase === 'cards' ? CARDS_MS : PRESENTATION_MS;
  if (now < room.deadline - duration + 1200) return false;
  let changed = false;
  for (const player of room.players.filter(p => p.isBot && p.health > 0)) {
    if (room.phase === 'cards' && !player.hasChosenCard) {
      const cards = room.cards.filter(card => !cardUnavailable(player, card));
      const card = cards[Math.floor(Math.random() * cards.length)];
      const targets = room.players.filter(p => p.id !== player.id && p.health > 0);
      chooseCard(room, player, card.id, card.targetRequired ? targets[Math.floor(Math.random() * targets.length)].id : undefined); changed = true;
    }
    if (room.phase === 'playing' && !player.hasSubmitted) {
      const completed = room.minigame.mode === 'race' && Math.random() > 0.2;
      // Bots sintéticos para demo: no ejecutan ni validan la simulación local.
      submitResult(room, player, { minigameId: room.minigame.id,
        score: completed ? room.minigame.maxScore : Math.floor(Math.random() * room.minigame.maxScore),
        elapsedMs: completed ? Math.min(1200, room.minigame.durationMs) : room.minigame.durationMs,
        progress: completed ? 1 : Math.random(), completed, reason: completed ? 'completed' : 'timeout' });
      changed = true;
    }
  }
  return changed;
}
