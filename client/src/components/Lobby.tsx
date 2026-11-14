import { useState } from 'react';
import type { GameView } from '../../../shared/types';
export default function Lobby({ game, disabled, onCreate, onJoin, onReady, onStart, onBots, onRemove, onBack }: {
  game: GameView | null; disabled: boolean; onCreate: () => void; onJoin: (code: string) => void;
  onReady: () => void; onStart: () => void; onBots: () => void; onRemove: (id: string) => void; onBack: () => void;
}) {
  const [code, setCode] = useState('');
  if (!game) return <section className="panel"><h2>1 · Lobby</h2>
    <p>Crea una sala o comparte el código para jugar desde otros navegadores.</p>
    <button disabled={disabled} onClick={onCreate}>Crear sala</button>
    <form onSubmit={e => { e.preventDefault(); onJoin(code); }}>
      <label>Código de sala<input value={code} maxLength={6} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123" /></label>
      <button disabled={disabled || code.trim().length !== 6}>Unirse</button>
    </form><button className="secondary" onClick={onBack}>Cambiar estadísticas</button>
  </section>;
  const host = game.hostId === game.self.id;
  return <section className="panel"><h2>1 · Lobby · Sala <span className="code">{game.code}</span></h2>
    <p>{game.round === 0 ? 'Preparad la primera ronda.' : `Ronda ${game.round} terminada. Preparaos para la siguiente.`}</p>
    <ul className="players">{game.players.map(player => <li key={player.id}>
      <span>{player.name} {player.isBot && '(bot)'} {player.id === game.hostId && '★'} {player.id === game.self.id && '(tú)'}</span>
      <span>{!player.connected ? 'Desconectado' : player.ready ? 'Listo' : 'Preparándose'}</span>
      {host && (player.isBot || !player.connected) && <button className="secondary" onClick={() => onRemove(player.id)}>Retirar</button>}
    </li>)}</ul>
    <div className="actions"><button disabled={disabled} onClick={onReady}>{game.self.ready ? 'Ya no estoy listo' : 'Estoy listo'}</button>
      {host && <><button className="secondary" disabled={disabled || game.players.length >= 4} onClick={onBots}>Completar con bots</button>
      <button disabled={disabled || !game.players.every(p => p.ready && p.connected)} onClick={onStart}>Iniciar ronda {game.round + 1}</button></>}
    </div>{!host && <p>El anfitrión inicia cuando todos están listos.</p>}
    {game.lastResults.length > 0 && <div><h3>Resultados de la última ronda</h3>
      {game.lastResults.map(result => <p key={result.playerId}>{result.name}: {result.score} puntos · {result.healthDelta > 0 ? '+' : ''}{result.healthDelta} vida</p>)}
    </div>}
  </section>;
}
