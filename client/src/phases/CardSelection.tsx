import { useState } from 'react';
import type { Card, CardSelectionProps } from '../../../shared/types';
import { NasaOrbitStampSvg, TopoWatermarkSvg } from '../components/NasaMarks';
import { playUiClick } from '../utils/uiAudio';
import './CardSelection.css';

const categoryLabels = {
  supply: 'Suministros',
  risk: 'Expedición / riesgo',
  defense: 'Protección',
  interaction: 'Tripulación',
} as const;

function CardCategoryPatchSvg({ category }: { category: Card['category'] }) {
  switch (category) {
    case 'risk':
      return (
        <svg className="action-card__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#C1440E" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="21" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <path d="M13 41 L24 27 L33 35 L42 23 L51 41 Z" fill="#7A2506" stroke="#1A1817" strokeWidth="2" />
          <circle cx="42" cy="21" r="4.5" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.5" />
        </svg>
      );
    case 'defense':
      return (
        <svg className="action-card__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#0B3D91" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="21" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <path d="M32 16 L44 22 V33 C44 40 38 45 32 48 C26 45 20 40 20 33 V22 Z" fill="#0B3D91" stroke="#1A1817" strokeWidth="2" />
          <path d="M27 32 H37 M32 27 V37" stroke="#F5EFE0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'interaction':
      return (
        <svg className="action-card__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#6D4B8C" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="21" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <circle cx="25" cy="28" r="5" fill="#1A1817" />
          <circle cx="39" cy="28" r="5" fill="#FC3D21" stroke="#1A1817" strokeWidth="1.5" />
          <path d="M17 42 C18 36 32 36 33 42 Z" fill="#1A1817" />
          <path d="M31 42 C32 36 46 36 47 42 Z" fill="#6D4B8C" stroke="#1A1817" strokeWidth="1.5" />
        </svg>
      );
    case 'supply':
    default:
      return (
        <svg className="action-card__svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="#2F6F4E" stroke="#1A1817" strokeWidth="3" />
          <circle cx="32" cy="32" r="21" fill="#F5EFE0" stroke="#1A1817" strokeWidth="2" />
          <rect x="20" y="21" width="24" height="22" rx="3" fill="#2F6F4E" stroke="#1A1817" strokeWidth="2" />
          <rect x="24" y="25" width="16" height="6" fill="#F5EFE0" />
          <line x1="26" y1="36" x2="38" y2="36" stroke="#F5EFE0" strokeWidth="2.5" />
        </svg>
      );
  }
}

export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const alive = game.players.filter(p => p.health > 0);
  const opponents = alive.filter(p => p.id !== game.self.id);
  const maxEnergy = 100 + game.self.stats.energy;
  const maxFood = 100 + game.self.stats.food;
  const dead = game.self.health <= 0;

  return (
    <section className="panel phase-cards">
      <TopoWatermarkSvg />

      <header className="cards-heading">
        <div>
          <p className="eyebrow">03 / Preparación de misión</p>
          <h2>Elige tu siguiente movimiento</h2>
        </div>
        <NasaOrbitStampSvg label={`DIRECTIVE // RONDA ${String(game.round).padStart(2, '0')}`} />
      </header>

      <div className="cards-resources" aria-label="Tus recursos privados">
        <span>Vida <b>{game.self.health}/{game.self.maxHealth}</b></span>
        <span>Comida <b>{game.self.resources.food}/{maxFood}</b></span>
        <span>Energía <b>{game.self.resources.energy}/{maxEnergy}</b></span>
        <span>Radiación <b>{game.self.resources.radiation}</b></span>
      </div>

      <p className="cards-intro">
        {dead
          ? 'Has sido eliminado. Puedes observar la partida.'
          : 'Una carta por persona. Las elecciones son privadas y se resuelven cuando todos hayan elegido.'}
      </p>

      <div className="cards-options">
        {game.cards.map((card, index) => {
          const cost = Object.entries(card.cost ?? {})
            .map(([key, value]) => `${value} de ${key === 'food' ? 'comida' : 'energía'}`)
            .join(' + ');
          const cannotPay = Object.entries(card.cost ?? {}).some(
            ([key, value]) => game.self.resources[key as keyof typeof game.self.resources] < value!,
          );
          const noRadiation = card.requiresRadiation && game.self.resources.radiation === 0;
          const needsTarget = card.targetRequired && !targets[card.id];
          const selected = game.self.selectedCardId === card.id;
          const chance = card.rules?.chance === 'alive/5' ? alive.length / 5 : card.rules?.chance;

          return (
            <article
              className={`action-card${selected ? ' action-card--selected' : ''}`}
              data-category={card.category ?? 'supply'}
              key={card.id}
            >
              {selected && <span className="action-card__stamp" aria-hidden="true">SELECTED</span>}

              <div className="action-card-top">
                <span>{card.category ? categoryLabels[card.category] : 'Acción'}</span>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>

              <div className="action-card__patch">
                <CardCategoryPatchSvg category={card.category} />
              </div>

              <h3>{card.title}</h3>
              <p className="action-card-description">{card.description}</p>

              {chance !== undefined && (
                <p className="action-card-detail">
                  Éxito <b>{Math.round(chance * 100)} %</b>
                </p>
              )}
              {cost && (
                <p className="action-card-detail">
                  Coste <b>{cost}</b>
                </p>
              )}

              {card.targetRequired && (
                <label className="action-card-target">
                  Objetivo
                  <select
                    aria-label={`Objetivo de ${card.title}`}
                    value={targets[card.id] ?? ''}
                    disabled={dead || game.self.hasChosenCard}
                    onChange={e => setTargets(current => ({ ...current, [card.id]: e.target.value }))}
                  >
                    <option value="">Elige un astronauta</option>
                    {opponents.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="action-card-bottom">
                <p className="action-card-warning">
                  {cannotPay
                    ? 'No tienes recursos suficientes.'
                    : noRadiation
                      ? 'Necesitas estar contaminado.'
                      : '\u00a0'}
                </p>
                <button
                  type="button"
                  disabled={dead || game.self.hasChosenCard || cannotPay || !!noRadiation || !!needsTarget}
                  onClick={() => {
                    playUiClick();
                    onChoose(card.id, card.targetRequired ? targets[card.id] : undefined);
                  }}
                >
                  {selected ? 'Elegida ✓' : 'Elegir carta'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cards-status" role="status">
        <span>{alive.filter(p => p.hasChosenCard).length} / {alive.length} decisiones recibidas</span>
        <span>
          {game.self.hasChosenCard && !dead
            ? 'Elección guardada. Esperando a la tripulación…'
            : 'Si no eliges a tiempo, recibirás Comer o Descansar.'}
        </span>
      </div>

      {(game.self.protection?.radiationShield || game.self.protection?.reinforcedSuit) && (
        <p className="cards-protection">
          Protecciones activas:{' '}
          {[
            game.self.protection.radiationShield && 'escudo antirradiación',
            game.self.protection.reinforcedSuit && 'traje reforzado',
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
    </section>
  );
}
