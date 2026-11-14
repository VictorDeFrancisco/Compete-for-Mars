import express from 'express';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { MAX_PLAYERS, ROOM_IDLE_MS } from '../shared/constants';
import type { ClientToServerEvents, Reply, ServerToClientEvents } from '../shared/types';
import { advanceIfComplete, chooseCard, currentPhase, makePlayer, makeRoom, requireRule, startRound, submitScore, validateEntry, viewFor, type Player, type Room } from './gameEngine';
import { fillBots, playBots } from './bots';

interface SocketData { code?: string; playerId?: string }
export function createGameServer() {
  const app = express();
  const http = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(http, { maxHttpBufferSize: 16_384 });
  const rooms = new Map<string, Room>();
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  const clientPath = resolve(process.cwd(), 'client/dist');
  if (existsSync(clientPath)) app.use(express.static(clientPath));
  else app.get('/', (_req, res) => res.send('Servidor activo. En desarrollo, abre http://localhost:5173.'));
  function broadcast(room: Room) {
    for (const player of room.players) if (player.socketId) {
      io.to(player.socketId).emit('game:state', viewFor(room, player));
    }
  }
  function remove(room: Room, player: Player) {
    room.players = room.players.filter(p => p.id !== player.id);
    if (!room.players.some(p => !p.isBot)) { rooms.delete(room.code); return; }
    if (room.hostId === player.id) room.hostId = (room.players.find(p => !p.isBot && p.connected) ?? room.players.find(p => !p.isBot))!.id;
    advanceIfComplete(room); broadcast(room);
  }
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) return next(new Error('Sesión inválida. Recarga la página.'));
    next();
  });
  io.on('connection', socket => {
    const token: string = socket.handshake.auth.token;
    for (const room of rooms.values()) {
      const player = room.players.find(p => !p.isBot && p.token === token);
      if (player) {
        const previousSocket = player.socketId;
        player.socketId = socket.id; player.connected = true;
        socket.data = { code: room.code, playerId: player.id };
        if (previousSocket) io.sockets.sockets.get(previousSocket)?.disconnect(true);
        room.lastActive = Date.now(); broadcast(room); break;
      }
    }
    let windowStart = Date.now(), requests = 0;
    function handle(reply: Reply, action: () => void) {
      try {
        if (Date.now() - windowStart > 1000) { requests = 0; windowStart = Date.now(); }
        requireRule(++requests <= 40, 'Demasiadas acciones. Espera un segundo.');
        action();
        if (typeof reply === 'function') reply({ ok: true });
      } catch (error) {
        if (typeof reply === 'function') reply({ ok: false, error: error instanceof Error ? error.message : 'Acción inválida.' });
      }
    }
    function membership(): [Room, Player] {
      const room = rooms.get(socket.data.code ?? '');
      const player = room?.players.find(p => p.id === socket.data.playerId && p.socketId === socket.id);
      requireRule(room && player, 'Ya no estás en una sala. Vuelve a entrar.');
      room.lastActive = Date.now();
      if (advanceIfComplete(room)) broadcast(room);
      return [room, player];
    }
    socket.on('room:create', (input, reply) => handle(reply, () => {
      requireRule(!socket.data.code, 'Ya estás en una sala.');
      requireRule(rooms.size < 200, 'No hay más salas disponibles.');
      const entry = validateEntry(input);
      let code: string;
      do { code = randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(code));
      const player = makePlayer(entry, token, socket.id);
      const room = makeRoom(code, player); rooms.set(code, room);
      socket.data = { code, playerId: player.id }; broadcast(room);
    }));
    socket.on('room:join', (input, reply) => handle(reply, () => {
      requireRule(!socket.data.code, 'Ya estás en una sala.');
      const entry = validateEntry(input);
      requireRule(typeof input.code === 'string', 'Introduce un código de sala.');
      const room = rooms.get(input.code.trim().toUpperCase());
      requireRule(room, 'No existe esa sala.');
      requireRule(room.phase === 'lobby', 'La ronda está en curso. Espera al lobby.');
      requireRule(room.players.length < MAX_PLAYERS, 'La sala está llena.');
      const player = makePlayer(entry, token, socket.id);
      room.players.push(player); room.lastActive = Date.now();
      socket.data = { code: room.code, playerId: player.id }; broadcast(room);
    }));
    socket.on('room:leave', reply => handle(reply, () => {
      const [room, player] = membership(); socket.data = {}; remove(room, player);
    }));
    socket.on('room:add-bots', reply => handle(reply, () => {
      const [room, player] = membership();
      requireRule(room.phase === 'lobby' && room.hostId === player.id, 'Solo el anfitrión puede añadir bots en el lobby.');
      fillBots(room); broadcast(room);
    }));
    socket.on('room:remove-player', (id, reply) => handle(reply, () => {
      const [room, player] = membership();
      const target = room.players.find(p => p.id === id);
      requireRule(room.phase === 'lobby' && room.hostId === player.id && target && (target.isBot || !target.connected), 'Solo puedes retirar bots o jugadores desconectados desde el lobby.');
      remove(room, target);
    }));
    socket.on('player:ready', (ready, reply) => handle(reply, () => {
      const [room, player] = membership();
      requireRule(room.phase === 'lobby' && typeof ready === 'boolean', 'Acción inválida en esta fase.');
      player.ready = ready; broadcast(room);
    }));
    socket.on('game:start', reply => handle(reply, () => {
      const [room, player] = membership(); startRound(room, player); broadcast(room);
    }));
    socket.on('phase:ready', (action, reply) => handle(reply, () => {
      const [room, player] = membership(); currentPhase(room, 'presentation', action?.phaseId);
      player.ready = true; advanceIfComplete(room); broadcast(room);
    }));
    socket.on('card:choose', (action, reply) => handle(reply, () => {
      const [room, player] = membership(); currentPhase(room, 'cards', action?.phaseId);
      chooseCard(room, player, action?.cardId); advanceIfComplete(room); broadcast(room);
    }));
    socket.on('minigame:submit', (action, reply) => handle(reply, () => {
      const [room, player] = membership(); currentPhase(room, 'playing', action?.phaseId);
      submitScore(player, action?.score); advanceIfComplete(room); broadcast(room);
    }));
    socket.on('disconnect', () => {
      const room = rooms.get(socket.data.code ?? '');
      const player = room?.players.find(p => p.id === socket.data.playerId && p.socketId === socket.id);
      if (!room || !player) return;
      player.connected = false; player.socketId = null; player.ready = false;
      room.lastActive = Date.now();
      if (room.hostId === player.id) room.hostId = room.players.find(p => !p.isBot && p.connected)?.id ?? player.id;
      broadcast(room);
    });
  });
  const ticker = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (!room.players.some(p => !p.isBot && p.connected) && now - room.lastActive > ROOM_IDLE_MS) { rooms.delete(room.code); continue; }
      const botChange = playBots(room, now);
      if (advanceIfComplete(room, now) || botChange) broadcast(room);
    }
  }, 250);
  ticker.unref();
  return { app, http, io, rooms, close: async () => { clearInterval(ticker); await io.close(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { http } = createGameServer();
  http.listen(Number(process.env.PORT ?? 3001), '0.0.0.0', () => console.log('Another Planet · servidor en http://localhost:' + (process.env.PORT ?? 3001)));
}
