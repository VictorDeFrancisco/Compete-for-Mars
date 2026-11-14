import { useState } from 'react';
import type { CardSelectionProps } from '../../../shared/types';
import './CardSelection.css';

const categoryLabels = { supply: 'Suministros', risk: 'Expedición / riesgo', defense: 'Protección', interaction: 'Tripulación' };
export default function CardSelection({ game, onChoose }: CardSelectionProps) {
  const [targets, setTargets] = useState<Record<string, string>>({});
  const alive = game.players.filter(p => p.health > 0), opponents = alive.filter(p => p.id !== game.self.id);
  const maxEnergy = 100 + game.self.stats.energy, maxFood = 100 + game.self.stats.food;
  const dead = game.self.health <= 0;
  return <section className="panel phase-cards">
    <header className="cards-heading"><div><p className="eyebrow">03 / Preparación de misión</p><h2>Elige tu siguiente movimiento</h2></div><span>RONDA {String(game.round).padStart(2, '0')}</span></header>
    <div className="cards-resources" aria-label="Tus recursos privados">
      <span>Vida <b>{game.self.health}/{game.self.maxHealth}</b></span><span>Comida <b>{game.self.resources.food}/{maxFood}</b></span><span>Energía <b>{game.self.resources.energy}/{maxEnergy}</b></span><span>Radiación <b>{game.self.resources.radiation}</b></span>
    </div>
    <p className="cards-intro">{dead ? 'Has sido eliminado. Puedes observar la partida.' : 'Una carta por persona. Las elecciones son privadas y se resuelven cuando todos hayan elegido.'}</p>
    <div className="cards-options">
      {game.cards.map((card, index) => {
        const cost = Object.entries(card.cost ?? {}).map(([key, value]) => `${value} de ${key === 'food' ? 'comida' : 'energía'}`).join(' + ');
        const cannotPay = Object.entries(card.cost ?? {}).some(([key, value]) => game.self.resources[key as keyof typeof game.self.resources] < value!);
        const noRadiation = card.requiresRadiation && game.self.resources.radiation === 0;
        const needsTarget = card.targetRequired && !targets[card.id];
        const selected = game.self.selectedCardId === card.id;
        const chance = card.rules?.chance === 'alive/5' ? alive.length / 5 : card.rules?.chance;
        return <article className={`action-card${selected ? ' action-card--selected' : ''}`} data-category={card.category ?? 'supply'} key={card.id}>
          <div className="action-card-top"><span>{card.category ? categoryLabels[card.category] : 'Acción'}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
          <h3>{card.title}</h3><p className="action-card-description">{card.description}</p>
          {chance !== undefined && <p className="action-card-detail">Éxito <b>{Math.round(chance * 100)} %</b></p>}
          {cost && <p className="action-card-detail">Coste <b>{cost}</b></p>}
          {card.targetRequired && <label className="action-card-target">Objetivo<select aria-label={`Objetivo de ${card.title}`} value={targets[card.id] ?? ''} disabled={dead || game.self.hasChosenCard}
            onChange={e => setTargets(current => ({ ...current, [card.id]: e.target.value }))}>
            <option value="">Elige un astronauta</option>{opponents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>}
          <div className="action-card-bottom">
            <p className="action-card-warning">{cannotPay ? 'No tienes recursos suficientes.' : noRadiation ? 'Necesitas estar contaminado.' : '\u00a0'}</p>
            <button type="button" disabled={dead || game.self.hasChosenCard || cannotPay || !!noRadiation || !!needsTarget} onClick={() => onChoose(card.id, card.targetRequired ? targets[card.id] : undefined)}>
              {selected ? 'Elegida ✓' : 'Elegir carta'}
            </button>
          </div>
        </article>;
      })}
    </div>
    <div className="cards-status" role="status"><span>{alive.filter(p => p.hasChosenCard).length} / {alive.length} decisiones recibidas</span><span>{game.self.hasChosenCard && !dead ? 'Elección guardada. Esperando a la tripulación…' : 'Si no eliges a tiempo, recibirás Comer o Descansar.'}</span></div>
    {(game.self.protection?.radiationShield || game.self.protection?.reinforcedSuit) && <p className="cards-protection">Protecciones activas: {[game.self.protection.radiationShield && 'escudo antirradiación', game.self.protection.reinforcedSuit && 'traje reforzado'].filter(Boolean).join(' · ')}</p>}
  </section>;
}
