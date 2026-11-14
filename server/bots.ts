import { CARDS_MS, DEFAULT_STATS, MAX_PLAYERS, PRESENTATION_MS } from '../shared/constants';
import { CARDS, chooseCard, makePlayer, submitScore, type Room } from './gameEngine';
export function fillBots(room: Room) {
  while (room.players.length < MAX_PLAYERS) {
    room.players.push(makePlayer({ name: `Bot ${room.players.length}`, stats: { ...DEFAULT_STATS } }, '', null, true));
  }
}
export function playBots(room: Room, now: number): boolean {
  if (!room.deadline) return false;
  const duration = room.phase === 'playing' ? room.minigame.durationMs : room.phase === 'cards' ? CARDS_MS : PRESENTATION_MS;
  if (now < room.deadline - duration + 1200) return false;
  let changed = false;
  for (const player of room.players.filter(p => p.isBot)) {
    if (room.phase === 'cards' && !player.hasChosenCard) {
      chooseCard(room, player, CARDS[Math.floor(Math.random() * CARDS.length)].id); changed = true;
    }
    if (room.phase === 'playing' && !player.hasSubmitted) {
      submitScore(player, 25 + Math.floor(Math.random() * 66)); changed = true;
    }
  }
  return changed;
}
