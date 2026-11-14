export type Phase = 'stats' | 'lobby' | 'presentation' | 'cards' | 'playing' | 'results';
export interface Stats { energy: number; food: number; health: number }
export interface Resources { energy: number; food: number; radiation: number }
export type CardKind = 'rest' | 'eat' | 'expedition' | 'decontamination' | 'radiation-shield' | 'reinforced-suit'
  | 'recycle-food' | 'recycle-energy' | 'sabotage' | 'supply-theft' | 'dust-storm' | 'ice-cave'
  | 'all-in' | 'mysterious-signal' | 'exchange' | 'contagion' | 'emergency-landing';
export interface CardRules {
  kind: CardKind;
  amount?: number;
  perAlive?: number;
  chance?: number | 'alive/5';
  failure?: Partial<Resources>;
  failureHealth?: number;
}
export interface Card {
  id: string;
  title: string;
  description: string;
  effect: Partial<Resources>;
  category?: 'supply' | 'risk' | 'defense' | 'interaction';
  targetRequired?: boolean;
  requiresRadiation?: boolean;
  cost?: Partial<Resources>;
  rules?: CardRules;
}
export interface CardOutcome {
  round: number; cardId: string; summary: string;
  healthDelta: number; resourcesDelta: Resources;
}
export interface PlayerProtection { radiationShield: boolean; reinforcedSuit: boolean }
import type { MinigameDefinition, MinigameResult, Outcome } from './minigames/types';
export type { MinigameDefinition, MinigameResult } from './minigames/types';
export interface PublicPlayer {
  id: string;
  name: string;
  suitColor?: string;
  health: number;
  maxHealth: number;
  isBot: boolean;
  connected: boolean;
  ready: boolean;
  hasChosenCard: boolean;
  hasSubmitted: boolean;
  liveScore?: number | null;
}
export interface SelfPlayer extends PublicPlayer {
  stats: Stats;
  resources: Resources;
  selectedCardId: string | null;
  score: number | null;
  result: MinigameResult | null;
  selectedTargetId?: string | null;
  protection?: PlayerProtection;
  cardOutcome?: CardOutcome | null;
}
export interface RoundResult {
  playerId: string; name: string; score: number; healthDelta: number;
  resourcesDelta: Resources; rank: number; outcome: Outcome;
  elapsedMs: number; completed: boolean;
}
export interface GameView {
  code: string;
  hostId: string;
  phase: Exclude<Phase, 'stats'>;
  phaseId: string;
  round: number;
  deadline: number | null;
  serverNow: number;
  players: PublicPlayer[];
  self: SelfPlayer;
  cards: Card[];
  minigame: MinigameDefinition;
  lastResults: RoundResult[];
  matchFinished?: boolean;
  winnerId?: string | null;
}
export type Reply = (result: { ok: boolean; error?: string }) => void;
export interface Entry { name: string; stats: Stats }
export interface PhaseAction { phaseId: string }
export interface ClientToServerEvents {
  'room:create': (entry: Entry, reply: Reply) => void;
  'room:join': (entry: Entry & { code: string }, reply: Reply) => void;
  'room:leave': (reply: Reply) => void;
  'room:add-bots': (reply: Reply) => void;
  'room:remove-player': (id: string, reply: Reply) => void;
  'game:start': (reply: Reply) => void;
  'game:restart': (reply: Reply) => void;
  'player:ready': (ready: boolean, reply: Reply) => void;
  'phase:ready': (action: PhaseAction, reply: Reply) => void;
  'card:choose': (action: PhaseAction & { cardId: string; targetId?: string }, reply: Reply) => void;
  'minigame:progress': (action: PhaseAction & { score: number }) => void;
  'minigame:submit': (action: PhaseAction & { result: MinigameResult }, reply: Reply) => void;
}
export interface ServerToClientEvents { 'game:state': (state: GameView) => void }

// Contratos de las tres pantallas: pueden rediseñarse sin gestionar el Socket.
export interface PresentationProps { game: GameView; onReady: () => void }
export interface CardSelectionProps { game: GameView; onChoose: (cardId: string, targetId?: string) => void }
export interface MinigameProps { game: GameView; onSubmit: (result: MinigameResult) => void }
