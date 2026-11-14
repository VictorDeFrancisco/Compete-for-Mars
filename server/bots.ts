import { CARDS_MS, DEFAULT_STATS, MAX_PLAYERS, PRESENTATION_MS } from '../shared/constants';
import { CARDS, chooseCard, makePlayer, submitResult, type Room } from './gameEngine';
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
