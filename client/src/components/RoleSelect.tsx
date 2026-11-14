import type { Stats } from '../../../shared/types';
import { PROFESSIONS, sameStats } from './professions';

export default function RoleSelect({
  name,
  stats,
  onName,
  onStats,
  onContinue,
}: {
  name: string;
  stats: Stats;
  onName: (name: string) => void;
  onStats: (stats: Stats) => void;
  onContinue: () => void;
}) {
  const selected = PROFESSIONS.find(p => sameStats(p.stats, stats)) ?? PROFESSIONS[0];

  return (
    <section className="panel">
      <h2>0 · Prepare your astronaut</h2>
      <p>Enter your name and choose your profession for the Mars mission.</p>
      <label>
        Name
        <input
          value={name}
          maxLength={24}
          onChange={e => onName(e.target.value)}
          placeholder="Your name"
        />
      </label>

      <div className="cards" role="group" aria-label="Profession">
        {PROFESSIONS.map(profession => {
          const active = profession.id === selected.id;
          return (
            <button
              key={profession.id}
              type="button"
              aria-pressed={active}
              className={active ? '' : 'secondary'}
              onClick={() => onStats({ ...profession.stats })}
            >
              <strong>{profession.name}</strong>
              <br />
              <small>
                Energy +{profession.stats.energy} · Food +{profession.stats.food} · Shielding +{profession.stats.shielding}
              </small>
            </button>
          );
        })}
      </div>

      <button disabled={!name.trim()} onClick={onContinue}>
        Continue to lobby
      </button>
    </section>
  );
}
