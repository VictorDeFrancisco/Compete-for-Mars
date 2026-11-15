import { Fragment, useState } from 'react';
import { DISTRIBUTED_RESOURCE_PER_ALIVE } from '../../../shared/constants';
import type { Card, CardSelectionProps } from '../../../shared/types';
import { playUiClick } from '../utils/uiAudio';
import { CardCategoryPatchSvg } from './CardArtworkSvg';
import './CardSelection.css';

export { CardCategoryPatchSvg };

export const categoryLabels = {
  supply: 'Recursos',
  risk: 'Expedición',
  defense: 'Especial · Protección',
  interaction: 'Especial · Trastada',
} as const;

type HighlightTone = 'food' | 'energy' | 'hp' | 'rad' | 'cost' | 'info' | 'danger';

interface CardHighlight {
  label: string;
  tone: HighlightTone;
}

export function getCardHighlights(card: Card, aliveCount: number): CardHighlight[] {
  const tags: CardHighlight[] = [];
  const kind = card.rules?.kind ?? card.id;
  const sharedPool =
    card.rules?.perAlive !== undefined
      ? Math.max(1, aliveCount) * card.rules.perAlive
      : card.rules?.amount ?? Math.max(1, aliveCount) * DISTRIBUTED_RESOURCE_PER_ALIVE;

  if (kind === 'rest') {
    tags.push({ label: `+${sharedPool} ENERGÍA (A REPARTIR)`, tone: 'energy' });
  } else if (kind === 'eat') {
    tags.push({ label: `+${sharedPool} COMIDA (A REPARTIR)`, tone: 'food' });
  } else if (kind === 'decontamination') {
    tags.push({ label: 'CURA TODA RADIACIÓN (SOLO SI VAS TÚ)', tone: 'food' });
    tags.push({ label: '+1 RADIACIÓN SI ESTÁS LIMPIO', tone: 'rad' });
  } else if (kind === 'radiation-shield') {
    tags.push({ label: 'BLOQUEA PRÓXIMA RADIACIÓN', tone: 'info' });
  } else if (kind === 'reinforced-suit') {
    tags.push({ label: 'ANULA PRÓXIMO DAÑO DE RADIACIÓN', tone: 'info' });
  } else if (kind === 'sabotage') {
    tags.push({ label: `QUITA -${card.rules?.amount ?? 20} COMIDA AL OBJETIVO`, tone: 'danger' });
  } else if (kind === 'supply-theft') {
    tags.push({ label: `ROBA +${card.rules?.amount ?? 30} COMIDA AL LÍDER`, tone: 'food' });
  } else if (kind === 'exchange') {
    tags.push({ label: 'ROTA COMIDA Y ENERGÍA', tone: 'info' });
  } else if (kind === 'contagion') {
    tags.push({ label: '+1 RADIACIÓN AL OBJETIVO', tone: 'rad' });
  } else if (kind === 'isotope-leak') {
    tags.push({ label: `+${card.rules?.amount ?? 15} ENERGÍA`, tone: 'energy' });
    tags.push({ label: '+1 RADIACIÓN AL OBJETIVO', tone: 'rad' });
  }

  if (card.cost?.energy) tags.push({ label: `COSTE -${card.cost.energy} ENERGÍA`, tone: 'cost' });
  if (card.cost?.food) tags.push({ label: `COSTE -${card.cost.food} COMIDA`, tone: 'cost' });

  if (card.effect.food) tags.push({ label: `+${card.effect.food} COMIDA`, tone: 'food' });
  if (card.effect.energy) tags.push({ label: `+${card.effect.energy} ENERGÍA`, tone: 'energy' });
  if (card.effect.radiation) tags.push({ label: `+${card.effect.radiation} RADIACIÓN`, tone: 'rad' });

  if (card.rules?.chance !== undefined) {
    const chance = card.rules.chance === 'alive/5' ? Math.min(1, aliveCount / 5) : card.rules.chance;
    tags.push({ label: `${Math.round(chance * 100)}% ÉXITO`, tone: 'info' });
  }
  if (card.rules?.failureHealth) {
    tags.push({ label: `${card.rules.failureHealth} VIDA SI FALLA`, tone: 'hp' });
  }
  if (card.rules?.failure?.radiation) {
    tags.push({ label: `+${card.rules.failure.radiation} RADIACIÓN SI FALLA`, tone: 'rad' });
  }
  if (card.rules?.failure?.food || card.rules?.failure?.energy) {
    tags.push({ label: '-15 COMIDA/ENERGÍA SI FALLA', tone: 'danger' });
  }

  return tags;
}

const VERB_PATTERN =
  '\\b(?:gana[rs]?|ganar|obtiene[ns]?|obtener|consigue[ns]?|conseguir|recibe[ns]?|recibir|recupera[rsn]?|recuperar|encuentra[rsn]?|encontrar|capta[rsn]?|captar|reparte[ns]?|repartir|roba[rsn]?|robar|suma[rsn]?|sumar|aumenta[rsn]?|aumentar|añade[ns]?|añadir|cura[rsn]?|curar|elimina[rsn]?|eliminar|bloquea[rsn]?|bloquear|anula[rsn]?|anular|evita[rsn]?|evitar|protege[ns]?|proteger|pierde[ns]?|perder|paga[rsn]?|pagar|quita[rsn]?|quitar|cuesta[ns]?|costar|consume[ns]?|consumir|gasta[rsn]?|gastar|sufre[ns]?|sufrir|transfiere[ns]?|transferir|pasa[rsn]?|pasar)\\b';

const RESOURCE_OR_NUM_PATTERN =
  '(?:[+-]?\\d+(?:\\s*\\/\\s*\\d+)?(?:\\s*%|\\s+de\\s+(?:energía|comida|vida|radiación))?|\\bradiación\\b|\\bcomida\\b|\\benergía\\b|\\bvida\\b)';

const CARD_TOKEN_REGEX = new RegExp(`(${VERB_PATTERN}|${RESOURCE_OR_NUM_PATTERN})`, 'gi');

const CURE_VERBS_RE = /^(?:cura|elimina|bloquea|anula|evita|protege)/i;
const ALWAYS_NEG_VERBS_RE = /^(?:paga|cuesta|costar|consume|gasta|sufre|transfiere|pasa)/i;
const LOSS_VERBS_RE = /^(?:pierde|perder|quita)/i;

function classifyVerbPolarity(verb: string, tailText: string): 'pos' | 'neg' {
  if (CURE_VERBS_RE.test(verb)) return 'pos';
  if (ALWAYS_NEG_VERBS_RE.test(verb)) return 'neg';

  const clause = tailText.split(/[.,;():]|\by\b|\bpero\b|\bsi\b/i)[0] ?? '';
  const mentionsRadiation = /radiaci[oó]n/i.test(clause);

  if (LOSS_VERBS_RE.test(verb)) {
    return mentionsRadiation ? 'pos' : 'neg';
  }
  return mentionsRadiation ? 'neg' : 'pos';
}

function renderHighlightedText(text: string) {
  const parts: Array<{ text: string; start: number; isMatch: boolean }> = [];
  let cursor = 0;
  for (const match of text.matchAll(CARD_TOKEN_REGEX)) {
    const idx = match.index ?? 0;
    if (idx > cursor) {
      parts.push({ text: text.slice(cursor, idx), start: cursor, isMatch: false });
    }
    parts.push({ text: match[0], start: idx, isMatch: true });
    cursor = idx + match[0].length;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), start: cursor, isMatch: false });
  }

  return parts.map((part, idx) => {
    if (!part.text) return null;
    if (!part.isMatch) return <Fragment key={idx}>{part.text}</Fragment>;

    const lower = part.text.toLowerCase();
    if (lower.includes('radiación')) {
      return <mark key={idx} className="card-kw card-kw--rad">{part.text}</mark>;
    }
    if (lower.includes('comida')) {
      return <mark key={idx} className="card-kw card-kw--food">{part.text}</mark>;
    }
    if (lower.includes('energía')) {
      return <mark key={idx} className="card-kw card-kw--energy">{part.text}</mark>;
    }
    if (lower.includes('vida')) {
      return <mark key={idx} className="card-kw card-kw--hp">{part.text}</mark>;
    }
    if (/^[+-]?\d/.test(part.text)) {
      return <mark key={idx} className="card-kw card-kw--num">{part.text}</mark>;
    }

    const tail = text.slice(part.start + part.text.length);
    const polarity = classifyVerbPolarity(part.text, tail);
    return (
      <span key={idx} className={`card-verb card-verb--${polarity}`}>
        {part.text}
      </span>
    );
  });
}

export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [pendingChoice, setPendingChoice] = useState<{
    phaseId: string;
    cardId: string;
    targetId?: string;
  } | null>(null);
  const alive = game.players.filter(p => p.health > 0);
  const opponents = alive.filter(p => p.id !== game.self.id);
  const dead = game.self.health <= 0;
  const activePending = pendingChoice?.phaseId === game.phaseId ? pendingChoice : null;
  const activeSelectedId = game.self.selectedCardId ?? activePending?.cardId ?? null;
  const hasChosen = game.self.hasChosenCard || activePending !== null;
  const readyCount = alive.filter(p => p.hasChosenCard).length;

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
          const selected = activeSelectedId === card.id;
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
                <CardCategoryPatchSvg cardId={card.id} category={card.category} />
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
                    disabled={dead || hasChosen}
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
                  disabled={dead || hasChosen || cannotPay || !!noRadiation || !!needsTarget}
                  onClick={() => {
                    const targetId = card.targetRequired ? targets[card.id] : undefined;
                    playUiClick();
                    setPendingChoice({ phaseId: game.phaseId, cardId: card.id, targetId });
                    onChoose(card.id, targetId);
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
        <strong>{readyCount} / {alive.length} LISTOS</strong>
        <span>
          {hasChosen && !dead
            ? 'Esperando al resto de la tripulación…'
            : 'Haz clic en una carta para confirmar tu jugada de esta ronda.'}
        </span>
      </div>
    </section>
  );
}
