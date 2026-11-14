import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, GameView, Reply, ServerToClientEvents } from '../../../shared/types';

// getRandomValues también funciona al acceder por HTTP a una IP de la LAN.
const token = sessionStorage.getItem('another-planet-token') ?? Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
sessionStorage.setItem('another-planet-token', token);
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({ auth: { token }, autoConnect: false });

export function useGame() {
  const [game, setGame] = useState<GameView | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const state = (view: GameView) => { setGame(view); setOffset(view.serverNow - Date.now()); };
    const connect = () => { setGame(null); setConnected(true); setError(''); };
    const disconnect = () => setConnected(false);
    const failure = (err: Error) =>
      setError(
        err.message === 'xhr poll error' || err.message === 'websocket error'
          ? 'No connection to server (port 3001). Start the server with "pnpm dev" or "pnpm dev:server".'
          : err.message,
      );
    socket.on('game:state', state); socket.on('connect', connect);
    socket.on('disconnect', disconnect); socket.on('connect_error', failure);
    socket.connect();
    return () => {
      socket.off('game:state', state); socket.off('connect', connect);
      socket.off('disconnect', disconnect); socket.off('connect_error', failure); socket.disconnect();
    };
  }, []);
  const act = (send: (reply: Reply) => void) => {
    if (!socket.connected) { setError('No connection to server.'); return; }
    setError(''); send(result => { if (!result.ok) setError(result.error ?? 'Action failed.'); });
  };
  const leave = () => act(reply => socket.emit('room:leave', result => {
    if (result.ok) setGame(null); reply(result);
  }));
  return { game, connected, error, act, leave, serverOffset: offset };
}
