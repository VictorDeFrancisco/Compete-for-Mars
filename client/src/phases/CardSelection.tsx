import { Fragment, useState } from 'react';
import { DISTRIBUTED_RESOURCE_PER_ALIVE } from '../../../shared/constants';
import type { Card, CardSelectionProps } from '../../../shared/types';
import { playUiClick } from '../utils/uiAudio';
import './CardSelection.css';

const categoryLabels = {
  supply: 'Recursos',
  risk: 'Expedición',
  defense: 'Especial · Protección',
  interaction: 'Especial · Trastada',
} as const;

interface CardHighlight {
  label: string;
  tone: 'gain' | 'cost' | 'danger' | 'rad' | 'info';
}

function getCardHighlights(card: Card, aliveCount: number): CardHighlight[] {
  const tags: CardHighlight[] = [];
  const kind = card.rules?.kind ?? card.id;
  const sharedPool =
    card.rules?.perAlive !== undefined
      ? Math.max(1, aliveCount) * card.rules.perAlive
      : card.rules?.amount ?? Math.max(1, aliveCount) * DISTRIBUTED_RESOURCE_PER_ALIVE;

  if (kind === 'rest') {
    tags.push({ label: `+${sharedPool} ENERGÍA (A REPARTIR)`, tone: 'gain' });
  } else if (kind === 'eat') {
    tags.push({ label: `+${sharedPool} COMIDA (A REPARTIR)`, tone: 'gain' });
  } else if (kind === 'decontamination') {
    tags.push({ label: 'CURA TODA RADIACIÓN (SOLO SI VAS TÚ)', tone: 'gain' });
    tags.push({ label: '+1 RADIACIÓN SI ESTÁS LIMPIO', tone: 'rad' });
  } else if (kind === 'radiation-shield') {
    tags.push({ label: 'BLOQUEA PRÓXIMA RADIACIÓN', tone: 'info' });
  } else if (kind === 'reinforced-suit') {
    tags.push({ label: 'ANULA PRÓXIMO DAÑO DE RADIACIÓN', tone: 'info' });
  } else if (kind === 'sabotage') {
    tags.push({ label: `QUITA -${card.rules?.amount ?? 20} COMIDA AL OBJETIVO`, tone: 'danger' });
  } else if (kind === 'supply-theft') {
    tags.push({ label: `ROBA +${card.rules?.amount ?? 30} COMIDA AL LÍDER`, tone: 'gain' });
  } else if (kind === 'exchange') {
    tags.push({ label: 'ROTA COMIDA Y ENERGÍA', tone: 'info' });
  } else if (kind === 'contagion') {
    tags.push({ label: '+1 RADIACIÓN AL OBJETIVO', tone: 'rad' });
  }

  if (card.cost?.energy) tags.push({ label: `COSTE -${card.cost.energy} ENERGÍA`, tone: 'cost' });
  if (card.cost?.food) tags.push({ label: `COSTE -${card.cost.food} COMIDA`, tone: 'cost' });

  if (card.effect.food) tags.push({ label: `+${card.effect.food} COMIDA`, tone: 'gain' });
  if (card.effect.energy) tags.push({ label: `+${card.effect.energy} ENERGÍA`, tone: 'gain' });
  if (card.effect.radiation) tags.push({ label: `+${card.effect.radiation} RADIACIÓN`, tone: 'rad' });

  if (card.rules?.chance !== undefined) {
    const chance = card.rules.chance === 'alive/5' ? Math.min(1, aliveCount / 5) : card.rules.chance;
    tags.push({ label: `${Math.round(chance * 100)}% ÉXITO`, tone: 'info' });
  }
  if (card.rules?.failureHealth) {
    tags.push({ label: `${card.rules.failureHealth} VIDA SI FALLA`, tone: 'danger' });
  }
  if (card.rules?.failure?.radiation) {
    tags.push({ label: `+${card.rules.failure.radiation} RADIACIÓN SI FALLA`, tone: 'rad' });
  }
  if (card.rules?.failure?.food || card.rules?.failure?.energy) {
    tags.push({ label: '-15 COMIDA/ENERGÍA SI FALLA', tone: 'danger' });
  }

  return tags;
}

const HIGHLIGHT_REGEX =
  /([+-]?\d+(?:\s*\/\s*\d+)?(?:\s*%|\s+de\s+(?:energía|comida|vida|radiación))?|\bradiación\b|\bcomida\b|\benergía\b|\bvida\b)/gi;

function renderHighlightedText(text: string) {
  const parts = text.split(HIGHLIGHT_REGEX);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (idx % 2 === 1) {
      const lower = part.toLowerCase();
      let cls = 'card-kw--num';
      if (lower.includes('radiación')) cls = 'card-kw--rad';
      else if (lower.includes('comida')) cls = 'card-kw--food';
      else if (lower.includes('energía')) cls = 'card-kw--energy';
      else if (lower.includes('vida')) cls = 'card-kw--hp';
      return (
        <mark key={idx} className={`card-kw ${cls}`}>
          {part}
        </mark>
      );
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

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
  const dead = game.self.health <= 0;

  return (
    <section className="phase-cards" aria-label="Card selection">
      <header className="cards-heading">
        <div className="cards-heading__copy">
          <h2>{dead ? 'OBSERVANDO FASE TÁCTICA' : 'ELIGE UNA CARTA TÁCTICA'}</h2>
          <p className="cards-heading__explain">
            {dead
              ? 'Los tripulantes vivos están decidiendo su acción antes del siguiente reto.'
              : 'Todas las cartas se eligen en secreto y se resuelven antes del minijuego.'}
          </p>
        </div>

        {(game.self.protection?.radiationShield || game.self.protection?.reinforcedSuit) && (
          <p className="cards-protection">
            PROTECCIÓN ACTIVA:{' '}
            {[
              game.self.protection.radiationShield && 'Escudo antirradiación',
              game.self.protection.reinforcedSuit && 'Traje reforzado',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </header>

      <div className="cards-options">
        {game.cards.map((card, index) => {
          const cannotPay = Object.entries(card.cost ?? {}).some(
            ([key, value]) => game.self.resources[key as keyof typeof game.self.resources] < value!,
          );
          const noRadiation = card.requiresRadiation && game.self.resources.radiation === 0;
          const needsTarget = card.targetRequired && !targets[card.id];
          const selected = game.self.selectedCardId === card.id;
          const highlights = getCardHighlights(card, alive.length);

          return (
            <article
              className={`action-card${selected ? ' action-card--selected' : ''}`}
              data-category={card.category ?? 'supply'}
              key={card.id}
            >
              {selected && <span className="action-card__stamp" aria-hidden="true">SELECCIONADA</span>}

              <div className="action-card-top">
                <span>{card.category ? categoryLabels[card.category] : 'Acción'}</span>
                <span>0{index + 1}</span>
              </div>

              <div className="action-card__patch">
                <CardCategoryPatchSvg category={card.category} />
              </div>

              <h3>{card.title}</h3>

              <div className="action-card__badges" aria-label="Efectos principales">
                {highlights.map((item, i) => (
                  <span key={i} className={`action-badge action-badge--${item.tone}`}>
                    {item.label}
                  </span>
                ))}
              </div>

              <p className="action-card-description">{renderHighlightedText(card.description)}</p>

              {card.targetRequired && (
                <label className="action-card-target">
                  OBJETIVO
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
                      ? 'Necesitas tener radiación activa.'
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
                  {selected ? 'CARTA ELEGIDA ✓' : 'ELEGIR CARTA'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cards-status" role="status">
        <strong>{alive.filter(p => p.hasChosenCard).length} / {alive.length} LISTOS</strong>
        <span>
          {game.self.hasChosenCard && !dead
            ? 'Selección bloqueada. Esperando al resto de la tripulación…'
            : 'Haz clic en una carta para confirmar tu jugada de esta ronda.'}
        </span>
      </div>
    </section>
  );
}
