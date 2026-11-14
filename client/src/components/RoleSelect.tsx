import { STAT_BUDGET } from '../../../shared/constants';
import type { Stats } from '../../../shared/types';
export default function RoleSelect({ name, stats, onName, onStats, onContinue }: {
  name: string; stats: Stats; onName: (name: string) => void;
  onStats: (stats: Stats) => void; onContinue: () => void;
}) {
  const remaining = STAT_BUDGET - stats.energy - stats.food - stats.shielding;
  return <section className="panel"><h2>0 · Prepara tu astronauta</h2>
    <p>Reparte 6 puntos. Energía y comida aumentan tus reservas iniciales. Blindaje queda reservado para las futuras reglas de radiación.</p>
    <label>Nombre<input value={name} maxLength={24} onChange={e => onName(e.target.value)} placeholder="Tu nombre" /></label>
    {(Object.keys(stats) as (keyof Stats)[]).map(key => <label key={key}>
      {{ energy: 'Energía', food: 'Comida', shielding: 'Blindaje' }[key]}: {stats[key]}
      <input type="range" min="0" max="4" value={stats[key]} onChange={e => onStats({ ...stats, [key]: Number(e.target.value) })} />
    </label>)}
    <p>Puntos por repartir: <strong>{remaining}</strong></p>
    <button disabled={!name.trim() || remaining !== 0} onClick={onContinue}>Continuar al lobby</button>
  </section>;
}
