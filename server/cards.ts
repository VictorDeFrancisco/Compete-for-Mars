import definitions from './data/boardSlots.json';
import { clamp, clampPlayerResource, maxHealthFor } from './playerLimits';
import { DISTRIBUTED_RESOURCE_PER_ALIVE } from '../shared/constants';
import type { Card, Resources } from '../shared/types';
import type { Player, Room } from './gameEngine';

export const CARD_CATALOG = definitions as Card[];
const resourceKeys = ['food', 'energy', 'radiation'] as const;
const ordered = (players: readonly Player[]) => [...players].sort((a, b) => a.id.localeCompare(b.id));
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function distributedResourcePool(card: Card, aliveCount: number): number {
  const perAlive = card.rules?.perAlive ?? DISTRIBUTED_RESOURCE_PER_ALIVE;
  return Math.max(1, aliveCount) * perAlive;
}
export function drawCards(players: readonly Player[], random = Math.random): Card[] {
  const alive = players.filter(p => p.health > 0), contaminated = alive.some(p => p.resources.radiation > 0);
  const starvingFood = alive.some(p => p.resources.food === 0);
  const starvingEnergy = alive.some(p => p.resources.energy === 0);
  const eligible = (c: Card) =>
    (contaminated || !['decontamination', 'reinforced-suit', 'contagion'].includes(c.id))
    && (alive.length > 1 || !['sabotage', 'supply-theft', 'exchange', 'contagion', 'isotope-leak'].includes(c.id))
    && (!c.cost || alive.some(p => !cardUnavailable(p, c)));
  const supply = CARD_CATALOG.filter(c => c.category === 'supply' && eligible(c));
  const risk = CARD_CATALOG.filter(c => c.category === 'risk' && eligible(c));
  const special = CARD_CATALOG.filter(c => (c.category === 'defense' || c.category === 'interaction') && eligible(c));
  const pickWeighted = (pool: readonly Card[], weightFor: (c: Card) => number) => {
    const weights = pool.map(c => Math.max(1, weightFor(c)));
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = random() * total;
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i];
      if (roll < 0) return pool[i];
    }
    return pool[pool.length - 1];
  };
  const supplyPick = pickWeighted(supply, card => {
    let weight = 1;
    if (starvingFood && (card.id === 'eat' || card.effect.food)) weight += card.id === 'eat' ? 5 : 2;
    if (starvingEnergy && (card.id === 'rest' || card.effect.energy)) weight += card.id === 'rest' ? 5 : 2;
    return weight;
  });
  const riskPick = pickWeighted(risk, card => {
    let weight = 1;
    if (starvingFood && card.effect.food) weight += 2;
    if (starvingEnergy && card.effect.energy) weight += 2;
    return weight;
  });
  const specialPick = special[Math.floor(random() * special.length)];
  return [supplyPick, riskPick, specialPick];
}
export function cardUnavailable(player: Player, card: Card): string | null {
  if (player.health <= 0) return 'Eliminated players cannot choose cards.';
  if (card.requiresRadiation && player.resources.radiation <= 0) return 'You need radiation to use Contagion.';
  if (resourceKeys.some(key => player.resources[key] < (card.cost?.[key] ?? 0))) return 'Insufficient resources to play this card.';
  return null;
}
export function receiveRadiation(player: Player, amount: number): boolean {
  if (amount <= 0) return false;
  if (player.protection.radiationShield) { player.protection.radiationShield = false; return false; }
  player.resources.radiation += amount;
  return true;
}
export function applyResourceEffect(player: Player, effect: Partial<Resources>): void {
  for (const key of resourceKeys) {
    const amount = effect[key] ?? 0;
    if (key === 'radiation') {
      if (amount > 0) receiveRadiation(player, amount);
      else player.resources.radiation = Math.max(0, player.resources.radiation + amount);
    } else player.resources[key] = clampPlayerResource(player, key, player.resources[key] + amount);
  }
}
export function radiationDamage(player: Player, damagePerUnit = 10): number {
  if (player.health <= 0 || player.resources.radiation <= 0) return 0;
  if (player.protection.reinforcedSuit) { player.protection.reinforcedSuit = false; return 0; }
  const damage = Math.min(player.health, player.resources.radiation * damagePerUnit);
  player.health -= damage;
  return damage;
}

/** All choices are locked first; resolution never exposes another player's resources. */
export function resolveCards(room: Room, random = Math.random): void {
  if (room.cardsResolved) return;
  room.cardsResolved = true;
  const players = ordered(room.players.filter(p => p.health > 0));
  const before = new Map(players.map(p => [p.id, { health: p.health, resources: { ...p.resources } }]));
  const notes = new Map(players.map(p => [p.id, [] as string[]]));
  const selected = (id: string) => players.filter(p => p.selectedCardId === id);
  const note = (p: Player, message: string) => notes.get(p.id)!.push(message);
  const affect = (p: Player, effect: Partial<Resources>) => {
    const hadShield = p.protection.radiationShield;
    applyResourceEffect(p, effect);
    if (hadShield && !p.protection.radiationShield) note(p, 'Radiation shield blocked incoming radiation.');
  };
  // Defenses and costs apply before any incoming event, independent of seat order.
  for (const p of players) {
    const card = room.cards.find(c => c.id === p.selectedCardId)!;
    if (card.id === 'radiation-shield') { p.protection.radiationShield = true; note(p, 'Shield armed.'); }
    if (card.id === 'reinforced-suit') { p.protection.reinforcedSuit = true; note(p, 'Reinforced suit armed.'); }
    for (const key of resourceKeys) p.resources[key] = Math.max(0, p.resources[key] - (card.cost?.[key] ?? 0));
  }
  const traders = shuffled(selected('exchange'), random);
  const inventories = traders.map(p => ({ food: p.resources.food, energy: p.resources.energy }));
  traders.forEach((p, i) => {
    if (traders.length > 1) {
      const incoming = inventories[(i + 1) % traders.length];
      p.resources.food = clampPlayerResource(p, 'food', incoming.food);
      p.resources.energy = clampPlayerResource(p, 'energy', incoming.energy);
    }
    note(p, traders.length > 1 ? 'Supplies exchanged.' : 'No one else chose Exchange.');
  });
  for (const p of players) {
    const card = room.cards.find(c => c.id === p.selectedCardId)!, kind = card.rules?.kind ?? card.id;
    if (kind === 'rest' || kind === 'eat') {
      const poolAmount = distributedResourcePool(card, players.length);
      const share = Math.floor(poolAmount / selected(card.id).length);
      affect(p, { [kind === 'rest' ? 'energy' : 'food']: share });
      note(p, `Shared pool (${poolAmount} for ${players.length} alive): +${share} ${kind === 'rest' ? 'energy' : 'food'} each.`);
    } else if (kind === 'decontamination') {
      if (before.get(p.id)!.resources.radiation === 0) { affect(p, { radiation: 1 }); note(p, 'Entered clean: gained +1 radiation unless shielded.'); }
      else if (selected(card.id).length === 1) { p.resources.radiation = 0; note(p, 'Decontamination complete.'); }
      else note(p, 'Decontamination cancelled: multiple crew entered.');
    } else if (kind === 'contagion') {
      const target = players.find(q => q.id === p.selectedTargetId);
      if (!target) { note(p, 'No effect: target is no longer in the room.'); continue; }
      if (before.get(target.id)!.resources.radiation === 0) { affect(target, { radiation: 1 }); note(p, 'Contagion transmitted; your radiation remains.'); }
      else note(p, 'No effect: target was already contaminated.');
    } else if (kind === 'isotope-leak') {
      const target = players.find(q => q.id === p.selectedTargetId);
      if (!target) { note(p, 'No effect: target is no longer in the room.'); continue; }
      const wasShielded = target.protection.radiationShield;
      affect(target, { radiation: 1 });
      const blocked = wasShielded && !target.protection.radiationShield;
      const energyGain = card.rules?.amount ?? 10;
      affect(p, { energy: energyGain });
      if (!blocked) note(target, 'Received +1 radiation from an isotope leak.');
      note(p, blocked ? `Shield blocked leak on ${target.name}; gained +${energyGain} energy.` : `Isotope leak sent to ${target.name}; gained +${energyGain} energy.`);
    } else if (card.rules?.chance !== undefined) {
      const chance = card.rules.chance === 'alive/5' ? Math.min(1, players.length / 5) : card.rules.chance;
      if (random() < chance) { affect(p, card.effect); note(p, 'Mission succeeded.'); }
      else {
        const failure = kind === 'dust-storm' ? (random() < .5 ? { food: card.rules.failure?.food } : { energy: card.rules.failure?.energy }) : (card.rules.failure ?? {});
        affect(p, failure); p.health = clamp(p.health + (card.rules.failureHealth ?? 0), 0, maxHealthFor(p));
        note(p, 'Mission failed.');
      }
    } else if (['recycle-food', 'recycle-energy', 'emergency-landing', 'nuclear-battery', 'solar-flare-harvest'].includes(kind)) {
      affect(p, card.effect); note(p, 'Action completed.');
    }
  }
  // Food withdrawals use a single source budget so simultaneous attacks cannot mint food.
  const withdrawals: { source: Player; amount: number; recipients: Player[]; sabotage: boolean }[] = [];
  for (const p of selected('sabotage')) {
    const target = players.find(q => q.id === p.selectedTargetId);
    if (!target) { note(p, 'No effect: target is no longer in the room.'); continue; }
    if (target.selectedCardId === 'sabotage' && target.selectedTargetId === p.id) { note(p, 'Mutual sabotage cancelled.'); continue; }
    const amount = room.cards.find(c => c.id === 'sabotage')!.rules?.amount ?? 20;
    withdrawals.push({ source: target, amount, recipients: [p], sabotage: true });
  }
  const thieves = selected('supply-theft');
  const donors = players.filter(p => !thieves.includes(p));
  if (thieves.length && donors.length) {
    const maxFood = Math.max(...donors.map(p => p.resources.food));
    const tied = donors.filter(p => p.resources.food === maxFood);
    const source = tied[Math.floor(random() * tied.length)];
    withdrawals.push({ source, amount: room.cards.find(c => c.id === 'supply-theft')!.rules?.amount ?? 30, recipients: thieves, sabotage: false });
  } else thieves.forEach(p => note(p, 'No valid target to steal from.'));
  const credits = new Map(players.map(p => [p.id, 0]));
  for (const source of players) {
    const requests = withdrawals.filter(w => w.source === source), demand = requests.reduce((sum, r) => sum + r.amount, 0);
    if (!demand) continue;
    const budget = Math.min(demand, source.resources.food);
    const amounts = requests.map(r => Math.floor(budget * r.amount / demand));
    let remainder = budget - amounts.reduce((sum, n) => sum + n, 0);
    for (let i = 0; remainder > 0; i = (i + 1) % amounts.length) { amounts[i]++; remainder--; }
    source.resources.food -= budget;
    requests.forEach((request, index) => {
      const amount = amounts[index];
      if (request.sabotage) {
        note(request.recipients[0], `Sabotage: drained ${amount} food from target.`);
        note(source, `Sabotage drained ${amount} of your food.`);
      } else {
        const share = Math.floor(amount / request.recipients.length);
        let extra = amount % request.recipients.length;
        for (const thief of request.recipients) {
          const portion = share + (extra-- > 0 ? 1 : 0);
          credits.set(thief.id, credits.get(thief.id)! + portion); note(thief, `Loot gained: +${portion} food.`);
        }
        note(source, `You lost ${amount} food to supply theft.`);
      }
    });
  }
  for (const p of players) {
    p.resources.food = clampPlayerResource(p, 'food', p.resources.food + credits.get(p.id)!);
    const old = before.get(p.id)!;
    p.cardOutcome = { round: room.round, cardId: p.selectedCardId!, summary: notes.get(p.id)!.join(' '),
      healthDelta: p.health - old.health,
      resourcesDelta: { food: p.resources.food - old.resources.food, energy: p.resources.energy - old.resources.energy, radiation: p.resources.radiation - old.resources.radiation } };
    if (p.health <= 0) { p.hasSubmitted = true; p.ready = false; }
  }
}
