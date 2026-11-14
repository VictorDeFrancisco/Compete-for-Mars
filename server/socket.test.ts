import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import { createGameServer } from './index';
import { DEFAULT_STATS } from '../shared/constants';
import type { GameView } from '../shared/types';
import { timeoutResult } from '../shared/minigames/ranking';

test('dos clientes reales: sala, autorizaciones, ronda, reconexión y segunda ronda', async t => {
  const server = createGameServer();
  await new Promise<void>(resolve => server.http.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.http.address() as AddressInfo).port}`;
  const clients: Socket[] = []; const states = new Map<Socket, GameView>();
  t.after(async () => { clients.forEach(client => client.disconnect()); await server.close(); });
  async function connect(token: string) {
    const client = io(url, { auth: { token }, autoConnect: false, transports: ['websocket'], forceNew: true });
    clients.push(client); client.on('game:state', view => states.set(client, view));
    await new Promise<void>((resolve, reject) => {
      client.once('connect', resolve); client.once('connect_error', reject); client.connect();
    }); return client;
  }
  async function action(client: Socket, event: string, data?: unknown) {
    return new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
      const done = (error: Error | null, result: { ok: boolean; error?: string }) => error ? reject(error) : resolve(result);
      if (data === undefined) client.timeout(3000).emit(event, done);
      else client.timeout(3000).emit(event, data, done);
    });
  }
  async function state(client: Socket, predicate: (view: GameView) => boolean) {
    if (states.has(client) && predicate(states.get(client)!)) return states.get(client)!;
    return new Promise<GameView>((resolve, reject) => {
      const timer = setTimeout(() => { client.off('game:state', listener); reject(new Error('Estado no recibido')); }, 3000);
      const listener = (view: GameView) => { if (predicate(view)) { clearTimeout(timer); client.off('game:state', listener); resolve(view); } };
      client.on('game:state', listener);
    });
  }
  const a = await connect('token-astronauta-a-123456');
  const b = await connect('token-astronauta-b-123456');
  assert.equal((await action(a, 'room:create', { name: 'Ana', stats: DEFAULT_STATS })).ok, true);
  const initial = await state(a, view => view.phase === 'lobby');
  assert.equal((await action(b, 'room:join', { code: initial.code, name: 'Luis', stats: DEFAULT_STATS })).ok, true);
  await state(a, view => view.players.length === 2);
  assert.equal((await action(b, 'game:start')).ok, false);
  assert.equal((await action(a, 'game:start')).ok, false);
  for (const client of [a, b]) assert.equal((await action(client, 'player:ready', true)).ok, true);
  assert.equal((await action(a, 'game:start')).ok, true);
  const intro = await state(a, view => view.phase === 'presentation');
  for (const client of [a, b]) assert.equal((await action(client, 'phase:ready', { phaseId: intro.phaseId })).ok, true);
  const cards = await state(a, view => view.phase === 'cards');
  assert.equal((await action(a, 'card:choose', { phaseId: intro.phaseId, cardId: 'rest' })).ok, false);
  assert.equal((await action(a, 'card:choose', { phaseId: cards.phaseId, cardId: 'expedition' })).ok, true);
  const bCards = await state(b, view => view.phase === 'cards' && view.players.some(p => p.hasChosenCard));
  assert.equal(JSON.stringify(bCards.players).includes('expedition'), false);
  assert.equal((await action(a, 'card:choose', { phaseId: cards.phaseId, cardId: 'rest' })).ok, false);
  assert.equal((await action(b, 'card:choose', { phaseId: cards.phaseId, cardId: 'rest' })).ok, true);
  const playing = await state(a, view => view.phase === 'playing');
  const result = timeoutResult(playing.minigame);
  assert.equal((await action(a, 'minigame:submit', { phaseId: playing.phaseId, result: { ...result, score: 80 } })).ok, true);
  assert.equal((await action(b, 'minigame:submit', { phaseId: playing.phaseId, result: { ...result, score: 30 } })).ok, true);
  const lobby = await state(a, view => view.phase === 'lobby' && view.round === 1);
  assert.equal(lobby.lastResults.length, 2);
  const id = lobby.self.id; a.disconnect();
  await state(b, view => view.players.some(p => p.id === id && !p.connected));
  const resumed = await connect('token-astronauta-a-123456');
  const restored = await state(resumed, view => view.phase === 'lobby');
  assert.equal(restored.self.id, id); assert.equal(restored.self.resources.food, 10);
  for (const client of [resumed, b]) assert.equal((await action(client, 'player:ready', true)).ok, true);
  assert.equal((await action(b, 'game:start')).ok, true);
  await state(resumed, view => view.phase === 'presentation' && view.round === 2);
});
