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
  type StormWaveTemplate,
} from './donkiApi';

export interface LiveWaveState {
  template: StormWaveTemplate;
  status: 'waiting' | 'in_flight' | 'deflected' | 'breached';
  flightProgress: number; // 0.0 (en la alta atmósfera) a 1.0 (en la base)
  isCritical?: boolean;
}

export interface SolarIonOrb {
  id: string;
  spawnSec: number;
  travelSec: number;
  approachAngleDeg: number;
  flightProgress: number;
  collected: boolean;
}

export interface SolarStormData {
  episode: DonkiEpisode;
  simulatedDateTime: string;
  currentSecond: number; // 0..60s

  shieldAngle: number; // Ángulo del escudo sobre la base marciana (115° izquierda .. 245° derecha, 180° = cúpula central)
  shieldWidthDeg: number; // Amplitud angular del escudo (24° normal ~18% de la base, 48° en boost)
  isBoosting: boolean;
  boostEnergy: number; // 0..100 %

  waves: LiveWaveState[];
  ionOrbs: SolarIonOrb[];
  activeAlertWave: StormWaveTemplate | null;

  blockedCount: number;
  criticalParryCount: number;
  breachedCount: number;
  ionsCollectedCount: number;
  totalWavesCount: number;

  combo: number;
  maxCombo: number;
  shakeIntensity: number; // 0..10 para vibración de pantalla

  colonyIntegrity: number; // 0..100 % salud de la base marciana
  totalRadiationDose: number; // mSv acumulados
  lastEventMessage: string;
}

export class SolarStormGame extends BaseMinigame<SolarStormData> {
  readonly episode: DonkiEpisode;

  private activeInputs = {
    turnLeft: false,
    turnRight: false,
    boost: false,
  };

  private directTargetAngle: number | null = null;
  private evaluatedWaveIds = new Set<string>();
  private evaluatedIonIds = new Set<string>();
  private lastBoostPressMs = -Infinity;

  constructor(
    definition: MinigameDefinition = solarStormDefinition,
    clock?: () => number,
    context: MinigameContext = DEFAULT_MINIGAME_CONTEXT,
    seed?: number
  ) {
    const episode = getRandomDonkiEpisode(seed);

    const initialWaves: LiveWaveState[] = episode.waves.map(wave => ({
      template: wave,
      status: 'waiting',
      flightProgress: 0,
      isCritical: false,
    }));

    // Orbes de iones aurorales que caen desde la atmósfera marciana
    const initialIons: SolarIonOrb[] = [];
    for (let sec = 4.0; sec <= 56.0; sec += 4.5) {
      const angleOffsets = [155, 170, 180, 195, 140, 215];
      const angle = angleOffsets[Math.floor(sec * 7) % angleOffsets.length];
      initialIons.push({
        id: `ion-${sec}`,
        spawnSec: sec,
        travelSec: 3.2,
        approachAngleDeg: angle,
        flightProgress: 0,
        collected: false,
      });
    }

    const initialData: SolarStormData = {
      episode,
      simulatedDateTime: episode.startDate,
      currentSecond: 0,
      shieldAngle: 180, // Centrado sobre la cúpula central de la base (180°)
      shieldWidthDeg: 24, // Cobertura focalizada y ágil (24° normal, nunca el 90%)
      isBoosting: false,
      boostEnergy: 100,
      waves: initialWaves,
      ionOrbs: initialIons,
      activeAlertWave: null,
      blockedCount: 0,
      criticalParryCount: 0,
      breachedCount: 0,
      ionsCollectedCount: 0,
      totalWavesCount: episode.waves.length,
      combo: 0,
      maxCombo: 0,
      shakeIntensity: 0,
      colonyIntegrity: 100,
      totalRadiationDose: 0.0,
      lastEventMessage: `Base Ares protegida · Alerta DONKI: ${episode.name}`,
    };

    super(definition, initialData, clock, context);
    this.episode = episode;
  }

  /** Permite apuntar el escudo directamente con el ratón o táctil sobre la base */
  public setDirectAngle(angleDeg: number): void {
    if (this.getSnapshot().status !== 'running') return;
    this.directTargetAngle = Math.max(115, Math.min(245, angleDeg));
  }

  protected onAction(actionId: string, state: ActionState): void {
    const isPressed = state === 'press';

    if (actionId === 'turn-left') {
      this.activeInputs.turnLeft = isPressed;
      if (isPressed) this.directTargetAngle = null;
    } else if (actionId === 'turn-right') {
      this.activeInputs.turnRight = isPressed;
      if (isPressed) this.directTargetAngle = null;
    } else if (actionId === 'boost') {
      this.activeInputs.boost = isPressed;
      if (isPressed) {
        this.lastBoostPressMs = this.getSnapshot().elapsedMs;
      }
    }
  }

  protected onUpdate(deltaMs: number): void {
    if (this.getSnapshot().status !== 'running') return;
    if (deltaMs <= 0) return;

    const dt = deltaMs / 1000;
    const snap = this.getSnapshot();
    const elapsedSec = snap.elapsedMs / 1000;
    const totalDuration = this.definition.durationMs || 60_000;
    const progress = Math.min(1.0, snap.elapsedMs / totalDuration);
    this.setProgress(progress);

    let {
      shieldAngle,
      boostEnergy,
      colonyIntegrity,
      totalRadiationDose,
      blockedCount,
      criticalParryCount,
      breachedCount,
      ionsCollectedCount,
      combo,
      maxCombo,
      shakeIntensity,
      lastEventMessage,
    } = snap.data;

    // Disipar vibración de pantalla
    shakeIntensity = Math.max(0, shakeIntensity - 18 * dt);

    // 1. Simulación acelerada del reloj UTC de la NASA
    const startMs = new Date(this.episode.startDate).getTime();
    const endMs = new Date(this.episode.endDate).getTime();
    const currentSimulatedMs = startMs + progress * (endMs - startMs);
    const simulatedDate = new Date(currentSimulatedMs);
    const dateFormatted = `${simulatedDate.toISOString().replace('T', ' ').slice(0, 16)} UTC`;

    // 2. Control del deslizamiento del escudo sobre la base marciana
    const rotationSpeed = 135 * this.modifiers.speedMultiplier;

    if (this.directTargetAngle !== null) {
      const diff = this.directTargetAngle - shieldAngle;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), 180 * dt);
      shieldAngle = Math.max(115, Math.min(245, shieldAngle + step));
    } else {
      if (this.activeInputs.turnLeft) {
        shieldAngle = Math.max(115, shieldAngle - rotationSpeed * dt);
      }
      if (this.activeInputs.turnRight) {
        shieldAngle = Math.min(245, shieldAngle + rotationSpeed * dt);
      }
    }

    // 3. Super-Escudo ampliado (Boost / Parry)
    let isBoosting = false;
    let shieldWidthDeg = 24;
    if (this.activeInputs.boost && boostEnergy > 5) {
      isBoosting = true;
      shieldWidthDeg = 48; // Ampliado en emergencia pero nunca cubre el 90%
      boostEnergy = Math.max(0, boostEnergy - 38 * dt);
    } else {
      isBoosting = false;
      boostEnergy = Math.min(100, boostEnergy + 18 * dt);
    }

    // 4. Actualización de las ondas de radiación solar en caída hacia la base
    const updatedWaves: LiveWaveState[] = [];
    let activeAlertWave: StormWaveTemplate | null = null;

    for (const wave of this.episode.waves) {
      let status: 'waiting' | 'in_flight' | 'deflected' | 'breached' = 'waiting';
      let flightProgress = 0;
      let isCritical = false;

      if (elapsedSec < wave.spawnSec) {
        status = 'waiting';
        flightProgress = 0;
      } else if (elapsedSec >= wave.spawnSec && elapsedSec < wave.impactSec) {
        status = 'in_flight';
        flightProgress = Math.min(1.0, (elapsedSec - wave.spawnSec) / (wave.impactSec - wave.spawnSec));
        if (!activeAlertWave || wave.impactSec < activeAlertWave.impactSec) {
          activeAlertWave = wave;
        }
      } else {
        // La onda alcanzó el dosel de la base
        flightProgress = 1.0;
        if (!this.evaluatedWaveIds.has(wave.id)) {
          this.evaluatedWaveIds.add(wave.id);

          const angleDiff = Math.abs(shieldAngle - wave.approachAngleDeg);
          const effectiveTolerance = (shieldWidthDeg / 2) + 3;

          const justBoosted = snap.elapsedMs - this.lastBoostPressMs < 450;
          const isPrecisionCenter = angleDiff <= 6;

          if (angleDiff <= effectiveTolerance) {
            status = 'deflected';
            blockedCount++;

            if (isPrecisionCenter || (justBoosted && isBoosting)) {
              isCritical = true;
              criticalParryCount++;
              combo++;
              maxCombo = Math.max(maxCombo, combo);
              boostEnergy = Math.min(100, boostEnergy + 24);
              shakeIntensity = 6;
              lastEventMessage = `¡PARRY CRÍTICO! ${wave.intensity} repelida · COMBO x${combo}! (+${100 + combo * 30} pts)`;
            } else {
              combo++;
              maxCombo = Math.max(maxCombo, combo);
              shakeIntensity = 3;
              lastEventMessage = `¡ESCUDO ALINEADO! ${wave.intensity} desviada · Combo x${combo}`;
            }
          } else {
            status = 'breached';
            breachedCount++;
            combo = 0;
            shakeIntensity = 10;
            totalRadiationDose += wave.radiationDose;
            colonyIntegrity = Math.max(0, colonyIntegrity - 16);
            lastEventMessage = `¡IMPACTO EN LA BASE! ${wave.intensity} dañó la cúpula (+${wave.radiationDose.toFixed(1)} mSv).`;
          }
        } else {
          const prevWave = snap.data.waves.find(w => w.template.id === wave.id);
          status = prevWave ? prevWave.status : 'deflected';
          isCritical = prevWave ? !!prevWave.isCritical : false;
        }
      }

      updatedWaves.push({
        template: wave,
        status,
        flightProgress,
        isCritical,
      });
    }

    // 5. Orbes de iones aurorales cayendo hacia la base
    const updatedIons: SolarIonOrb[] = [];
    for (const ion of snap.data.ionOrbs) {
      let flightProgress = ion.flightProgress;
      let collected = ion.collected;

      if (elapsedSec >= ion.spawnSec && !collected) {
        flightProgress = Math.min(1.0, (elapsedSec - ion.spawnSec) / ion.travelSec);

        if (flightProgress >= 0.95 && !this.evaluatedIonIds.has(ion.id)) {
          this.evaluatedIonIds.add(ion.id);
          const diff = Math.abs(shieldAngle - ion.approachAngleDeg);
          if (diff <= shieldWidthDeg / 2 + 8) {
            collected = true;
            ionsCollectedCount++;
            colonyIntegrity = Math.min(100, colonyIntegrity + 12);
            lastEventMessage = '¡ORBE VERDE RECOGIDO! +12% VIDA DE LA BASE (+50 pts)';
          }
        }
      }

      updatedIons.push({
        ...ion,
        flightProgress,
        collected,
      });
    }

    // 6. Puntuación limpia en múltiplos exactos de 50
    const basePts = 200;
    const blockPts = blockedCount * 100;
    const criticalPts = criticalParryCount * 50;
    const ionBonus = ionsCollectedCount * 50;
    const breachPenalty = breachedCount * 50;

    const currentScore = Math.max(
      0,
      Math.min(1000, basePts + blockPts + criticalPts + ionBonus - breachPenalty)
    );
    this.setScore(currentScore);

    this.setData({
      episode: this.episode,
      simulatedDateTime: dateFormatted,
      currentSecond: Math.round(elapsedSec * 10) / 10,
      shieldAngle: Math.round(shieldAngle * 10) / 10,
      shieldWidthDeg,
      isBoosting,
      boostEnergy: Math.round(boostEnergy * 10) / 10,
      waves: updatedWaves,
      ionOrbs: updatedIons,
      activeAlertWave,
      blockedCount,
      criticalParryCount,
      breachedCount,
      ionsCollectedCount,
      totalWavesCount: this.episode.waves.length,
      combo,
      maxCombo,
      shakeIntensity: Math.round(shakeIntensity * 10) / 10,
      colonyIntegrity: Math.round(colonyIntegrity),
      totalRadiationDose: Math.round(totalRadiationDose * 10) / 10,
      lastEventMessage,
    });
  }
}
