import { Fragment, useState } from 'react';
import { DISTRIBUTED_RESOURCE_PER_ALIVE } from '../../../shared/constants';
import type { Card, CardSelectionProps } from '../../../shared/types';
import { playUiClick } from '../utils/uiAudio';
import { CardCategoryPatchSvg } from './CardArtworkSvg';
import './CardSelection.css';

export { CardCategoryPatchSvg };

export const categoryLabels = {
  supply: 'Supplies',
  risk: 'Expedition',
  defense: 'Special · Defense',
  interaction: 'Special · Sabotage',
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
    tags.push({ label: `+${sharedPool} ENERGY (SHARED POOL)`, tone: 'energy' });
  } else if (kind === 'eat') {
    tags.push({ label: `+${sharedPool} FOOD (SHARED POOL)`, tone: 'food' });
  } else if (kind === 'decontamination') {
    tags.push({ label: 'CLEARS ALL RADIATION (SOLO ONLY)', tone: 'food' });
    tags.push({ label: '+1 RADIATION IF CLEAN', tone: 'rad' });
  } else if (kind === 'radiation-shield') {
    tags.push({ label: 'BLOCKS NEXT RADIATION HIT', tone: 'info' });
  } else if (kind === 'reinforced-suit') {
    tags.push({ label: 'NEGATES NEXT RADIATION DMG', tone: 'info' });
  } else if (kind === 'sabotage') {
    tags.push({ label: `DRAINS -${card.rules?.amount ?? 20} FOOD FROM TARGET`, tone: 'danger' });
  } else if (kind === 'supply-theft') {
    tags.push({ label: `STEALS +${card.rules?.amount ?? 30} FOOD FROM LEADER`, tone: 'food' });
  } else if (kind === 'exchange') {
    tags.push({ label: 'SWAPS FOOD & ENERGY', tone: 'info' });
  } else if (kind === 'contagion') {
    tags.push({ label: '+1 RADIATION TO TARGET', tone: 'rad' });
  } else if (kind === 'isotope-leak') {
    tags.push({ label: `+${card.rules?.amount ?? 15} ENERGY`, tone: 'energy' });
    tags.push({ label: '+1 RADIATION TO TARGET', tone: 'rad' });
  }

  if (card.cost?.energy) tags.push({ label: `COST -${card.cost.energy} ENERGY`, tone: 'cost' });
  if (card.cost?.food) tags.push({ label: `COST -${card.cost.food} FOOD`, tone: 'cost' });

  if (card.effect.food) tags.push({ label: `+${card.effect.food} FOOD`, tone: 'food' });
  if (card.effect.energy) tags.push({ label: `+${card.effect.energy} ENERGY`, tone: 'energy' });
  if (card.effect.radiation) tags.push({ label: `+${card.effect.radiation} RADIATION`, tone: 'rad' });

  if (card.rules?.chance !== undefined) {
    const chance = card.rules.chance === 'alive/5' ? Math.min(1, aliveCount / 5) : card.rules.chance;
    tags.push({ label: `${Math.round(chance * 100)}% ODDS`, tone: 'info' });
  }
  if (card.rules?.failureHealth) {
    tags.push({ label: `${card.rules.failureHealth} HP ON FAIL`, tone: 'hp' });
  }
  if (card.rules?.failure?.radiation) {
    tags.push({ label: `+${card.rules.failure.radiation} RADIATION ON FAIL`, tone: 'rad' });
  }
  if (card.rules?.failure?.food || card.rules?.failure?.energy) {
    tags.push({ label: '-10 FOOD/ENERGY ON FAIL', tone: 'danger' });
  }

  return tags;
}

const VERB_PATTERN =
  '\\b(?:gain[s]?|obtain[s]?|receive[s]?|recover[s]?|find[s]?|harvest[s]?|distribute[s]?|steal[s]?|add[s]?|clear[s]?|cure[s]?|remove[s]?|block[s]?|negate[s]?|avoid[s]?|protect[s]?|lose[s]?|pay[s]?|drain[s]?|cost[s]?|consume[s]?|spend[s]?|suffer[s]?|swap[s]?|trade[s]?)\\b';

const RESOURCE_OR_NUM_PATTERN =
  '(?:[+-]?\\d+(?:\\s*\\/\\s*\\d+)?(?:\\s*%|\\s+(?:energy|food|health|hp|radiation))?|\\bradiation\\b|\\bfood\\b|\\benergy\\b|\\bhealth\\b|\\bhp\\b)';

const CARD_TOKEN_REGEX = new RegExp(`(${VERB_PATTERN}|${RESOURCE_OR_NUM_PATTERN})`, 'gi');

const CURE_VERBS_RE = /^(?:clear|cure|remove|block|negate|avoid|protect)/i;
const ALWAYS_NEG_VERBS_RE = /^(?:pay|cost|consume|spend|suffer|drain)/i;
const LOSS_VERBS_RE = /^(?:lose)/i;

function classifyVerbPolarity(verb: string, tailText: string): 'pos' | 'neg' {
  if (CURE_VERBS_RE.test(verb)) return 'pos';
  if (ALWAYS_NEG_VERBS_RE.test(verb)) return 'neg';

  const clause = tailText.split(/[.,;():]|\band\b|\bbut\b|\bif\b/i)[0] ?? '';
  const mentionsRadiation = /\bradiation\b/i.test(clause);

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
    if (lower.includes('radiation')) {
      return <mark key={idx} className="card-kw card-kw--rad">{part.text}</mark>;
    }
    if (lower.includes('food')) {
      return <mark key={idx} className="card-kw card-kw--food">{part.text}</mark>;
    }
    if (lower.includes('energy')) {
      return <mark key={idx} className="card-kw card-kw--energy">{part.text}</mark>;
    }
    if (lower.includes('health') || lower.includes('hp')) {
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
          <h2>{dead ? 'SPECTATING TACTICAL PHASE' : 'CHOOSE A TACTICAL CARD'}</h2>
          <p className="cards-heading__explain">
            {dead
              ? 'Surviving crew members are locking in their action before the next challenge.'
              : 'All cards are chosen secretly and resolved before the minigame begins.'}
          </p>
        </div>

        {(game.self.protection?.radiationShield || game.self.protection?.reinforcedSuit) && (
          <p className="cards-protection">
            ACTIVE PROTECTION:{' '}
            {[
              game.self.protection.radiationShield && 'Radiation Shield',
              game.self.protection.reinforcedSuit && 'Reinforced Suit',
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
              {selected && <span className="action-card__stamp" aria-hidden="true">SELECTED</span>}

              <div className="action-card-top">
                <span>{card.category ? categoryLabels[card.category] : 'Action'}</span>
                <span>0{index + 1}</span>
              </div>

              <div className="action-card__patch">
                <CardCategoryPatchSvg cardId={card.id} category={card.category} />
              </div>

              <h3>{card.title}</h3>

              <div className="action-card__badges" aria-label="Key effects">
                {highlights.map((item, i) => (
                  <span key={i} className={`action-badge action-badge--${item.tone}`}>
                    {item.label}
                  </span>
                ))}
              </div>

              <p className="action-card-description">{renderHighlightedText(card.description)}</p>

              {card.targetRequired && (
                <label className="action-card-target">
                  TARGET
                  <select
                    aria-label={`Target for ${card.title}`}
                    value={targets[card.id] ?? ''}
                    disabled={dead || hasChosen}
                    onChange={e => setTargets(current => ({ ...current, [card.id]: e.target.value }))}
                  >
                    <option value="">Choose an astronaut</option>
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
                    ? 'Insufficient resources.'
                    : noRadiation
                      ? 'Requires active radiation.'
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
                  {selected ? 'CARD LOCKED ✓' : 'PLAY CARD'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cards-status" role="status">
        <strong>{readyCount} / {alive.length} READY</strong>
        <span>
          {hasChosen && !dead
            ? 'Waiting for the rest of the crew…'
            : 'Select a card to confirm your action for this round.'}
        </span>
      </div>
    </section>
  );
}
