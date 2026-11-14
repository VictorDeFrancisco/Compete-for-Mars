import {
  DEFAULT_MINIGAME_CONTEXT,
  type MinigameContext,
} from '../../../../../shared/minigames/context';
import { solarStormDefinition } from '../../../../../shared/minigames/solarStorm';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import {
  getRandomDonkiEpisode,
  type DonkiEpisode,
  type DonkiEvent,
  type DefenseAction,
} from './donkiApi';

export interface DefensiveSystemsState {
  shield: boolean; // Deflector magnético (W / ↑)
  shelter: boolean; // Búnker de regolito (S / ↓)
  panelsProtected: boolean; // Paneles replegados (A / ←)
  purge: boolean; // Disipador iónico (D / → / Espacio)
}

export interface SolarStormData {
  episode: DonkiEpisode;
  simulatedDateTime: string;
  currentSecond: number; // 0..60s

  defenses: DefensiveSystemsState;

  baseEnergy: number; // 0..100 %
  shieldHeat: number; // 0..100 % (temperatura de caloductos)
  currentRadiationRate: number; // mSv/h instantánea
  totalRadiationDose: number; // mSv acumulada
  noaaScale: 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

  activeAlert: DonkiEvent | null;
  activeImpact: DonkiEvent | null;
  timeToImpactSec: number;

  mitigatedEventsCount: number;
  totalEventsCount: number;
  completedEventIds: readonly string[];

  lastFeedback: 'PERFECT' | 'MITIGATED' | 'BREACH' | 'OVERLOAD' | null;
  lastEventMessage: string;
}

export class SolarStormGame extends BaseMinigame<SolarStormData> {
  readonly episode: DonkiEpisode;

  private activeInputs = {
    shield: false,
    shelter: false,
    panels: false,
    purge: false,
  };

  private evaluatedEvents = new Set<string>();
  private nextFeedbackTimer = 0;

  constructor(
    definition: MinigameDefinition = solarStormDefinition,
    clock?: () => number,
    context: MinigameContext = DEFAULT_MINIGAME_CONTEXT,
    seed?: number
  ) {
    const episode = getRandomDonkiEpisode(seed);

    const initialData: SolarStormData = {
      episode,
      simulatedDateTime: episode.startDate,
      currentSecond: 0,
      defenses: {
        shield: false,
        shelter: false,
        panelsProtected: false,
        purge: false,
      },
      baseEnergy: 100,
      shieldHeat: 15,
      currentRadiationRate: 0.04, // Fondo cósmico marciano normal (mSv/h)
      totalRadiationDose: 0.0,
      noaaScale: 'S0',
      activeAlert: null,
      activeImpact: null,
      timeToImpactSec: 0,
      mitigatedEventsCount: 0,
      totalEventsCount: episode.events.length,
      completedEventIds: [],
      lastFeedback: null,
      lastEventMessage: `Monitor DONKI en línea · Ciclo seleccionado: ${episode.name}`,
    };

    super(definition, initialData, clock, context);
    this.episode = episode;
  }

  protected onAction(actionId: string, state: ActionState): void {
    const isPressed = state === 'press';

    if (actionId === 'shield') {
      this.activeInputs.shield = isPressed;
    } else if (actionId === 'shelter') {
      this.activeInputs.shelter = isPressed;
    } else if (actionId === 'panels') {
      this.activeInputs.panels = isPressed;
    } else if (actionId === 'purge') {
      this.activeInputs.purge = isPressed;
    }

    if (this.getSnapshot().status === 'running') {
      this.updateDefenseState();
    }
  }

  private updateDefenseState(): void {
    const prev = this.getSnapshot().data;
    this.setData({
      ...prev,
      defenses: {
        shield: this.activeInputs.shield && prev.baseEnergy > 5,
        shelter: this.activeInputs.shelter,
        panelsProtected: this.activeInputs.panels,
        purge: this.activeInputs.purge,
      },
    });
  }

  protected onUpdate(deltaMs: number): void {
    if (this.getSnapshot().status !== 'running') return;
    if (deltaMs <= 0) return;

    const dt = deltaMs / 1000;
    const snap = this.getSnapshot();
    const elapsedSec = snap.elapsedMs / 1000;
    const progress = Math.min(1.0, snap.elapsedMs / this.definition.durationMs);
    this.setProgress(progress);

    let {
      baseEnergy,
      shieldHeat,
      totalRadiationDose,
      mitigatedEventsCount,
      completedEventIds,
      lastFeedback,
      lastEventMessage,
    } = snap.data;

    // 1. Simulación del reloj de tiempo rápido de la NASA
    const startMs = new Date(this.episode.startDate).getTime();
    const endMs = new Date(this.episode.endDate).getTime();
    const currentSimulatedMs = startMs + progress * (endMs - startMs);
    const simulatedDate = new Date(currentSimulatedMs);
    const dateFormatted = `${simulatedDate.toISOString().replace('T', ' ').slice(0, 16)} UTC`;

    // 2. Estado de defensas considerando energía
    const isShieldOn = this.activeInputs.shield && baseEnergy > 5;
    const isShelterOn = this.activeInputs.shelter;
    const isPanelsSafe = this.activeInputs.panels;
    const isPurging = this.activeInputs.purge;

    // Consumo / recuperación de energía y calor
    if (isShieldOn) {
      baseEnergy = Math.max(0, baseEnergy - 6.5 * dt * (2.0 - this.modifiers.speedMultiplier));
      shieldHeat = Math.min(100, shieldHeat + 9.0 * dt);
    } else if (isPanelsSafe) {
      // Paneles replegados generan menos energía
      baseEnergy = Math.min(100, baseEnergy + 1.2 * dt);
      shieldHeat = Math.max(10, shieldHeat - 8.0 * dt);
    } else {
      // Paneles desplegados al Sol marciano normal
      baseEnergy = Math.min(100, baseEnergy + 4.5 * dt);
      shieldHeat = Math.max(10, shieldHeat - 12.0 * dt);
    }

    if (isPurging) {
      shieldHeat = Math.max(5, shieldHeat - 35.0 * dt);
      baseEnergy = Math.max(0, baseEnergy - 3.0 * dt);
    }

    // 3. Evaluar eventos de la línea temporal de la NASA DONKI
    let activeAlert: DonkiEvent | null = null;
    let activeImpact: DonkiEvent | null = null;
    let timeToImpactSec = 0;
    let instantaneousRate = 0.04; // Fondo normal
    let noaaScale: 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' = 'S0';

    for (const event of this.episode.events) {
      const isPast = elapsedSec > event.impactSec + event.durationSec;
      const isImpacting =
        elapsedSec >= event.impactSec && elapsedSec <= event.impactSec + event.durationSec;
      const isAlerting =
        elapsedSec >= event.triggerSec && elapsedSec < event.impactSec;

      if (isAlerting) {
        activeAlert = event;
        timeToImpactSec = Math.max(0, event.impactSec - elapsedSec);
      }

      if (isImpacting) {
        activeImpact = event;
        const baseRate = event.radiationRate;

        // Comprobar si la defensa adecuada está levantada
        let defenseActive = false;
        if (event.requiredDefense === 'shield' && isShieldOn) defenseActive = true;
        if (event.requiredDefense === 'shelter' && isShelterOn) defenseActive = true;
        if (event.requiredDefense === 'panels' && isPanelsSafe) defenseActive = true;
        if (event.requiredDefense === 'purge' && isPurging) defenseActive = true;

        if (defenseActive) {
          instantaneousRate = baseRate * 0.07; // 93% de mitigación
          noaaScale = 'S1';
        } else {
          instantaneousRate = baseRate; // Impacto total de radiación
          noaaScale = baseRate > 350 ? 'S4' : baseRate > 200 ? 'S3' : 'S2';
        }

        // Evaluar resultado al inicio del impacto
        if (!this.evaluatedEvents.has(event.id)) {
          this.evaluatedEvents.add(event.id);
          completedEventIds = [...completedEventIds, event.id];

          if (defenseActive) {
            mitigatedEventsCount++;
            lastFeedback = 'PERFECT';
            lastEventMessage = `¡Tormenta mitigada! [${event.type} ${event.intensity}]: Defensa coordinada con éxito (+120 pts).`;
          } else {
            lastFeedback = 'BREACH';
            lastEventMessage = `¡ALERTA DE BRECHA! [${event.type}]: ${event.message}`;
          }
        }
      }
    }

    // Acumular dosis de radiación en mSv
    const doseDelta = (instantaneousRate / 3600) * dt;
    totalRadiationDose += doseDelta;

    // Calcular puntuación dinámica en tiempo real
    const basePts = 450;
    const mitigationPts = mitigatedEventsCount * 110 * this.modifiers.scoreMultiplier;
    const radiationPenalty = Math.min(250, totalRadiationDose * 120);
    const energyBonus = Math.round((baseEnergy / 100) * 80);
    const currentScore = Math.max(
      50,
      Math.min(1000, Math.round(basePts + mitigationPts + energyBonus - radiationPenalty))
    );
    this.setScore(currentScore);

    // Mensaje periódico de telemetría si no hay evento activo
    if (!activeAlert && !activeImpact) {
      if (this.nextFeedbackTimer <= 0) {
        lastEventMessage = `Monitoreo DONKI activo · Radiación ambiental: ${instantaneousRate.toFixed(2)} mSv/h`;
        this.nextFeedbackTimer = 4.0;
      } else {
        this.nextFeedbackTimer -= dt;
      }
    }

    this.setData({
      episode: this.episode,
      simulatedDateTime: dateFormatted,
      currentSecond: Math.round(elapsedSec * 10) / 10,
      defenses: {
        shield: isShieldOn,
        shelter: isShelterOn,
        panelsProtected: isPanelsSafe,
        purge: isPurging,
      },
      baseEnergy: Math.round(baseEnergy * 10) / 10,
      shieldHeat: Math.round(shieldHeat * 10) / 10,
      currentRadiationRate: Math.round(instantaneousRate * 10) / 10,
      totalRadiationDose: Math.round(totalRadiationDose * 100) / 100,
      noaaScale,
      activeAlert,
      activeImpact,
      timeToImpactSec: Math.round(timeToImpactSec * 10) / 10,
      mitigatedEventsCount,
      totalEventsCount: this.episode.events.length,
      completedEventIds,
      lastFeedback,
      lastEventMessage,
    });
  }
}
