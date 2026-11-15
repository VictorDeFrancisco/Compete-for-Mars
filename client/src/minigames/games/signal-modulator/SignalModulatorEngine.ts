import {
  DEFAULT_MINIGAME_CONTEXT,
  deriveRoundSeed,
  seededPrng,
  type MinigameContext,
} from '../../../../../shared/minigames/context';
import { signalModulatorDefinition } from '../../../../../shared/minigames/signalModulator';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import {
  TELEMETRY_PACKETS,
  generateTelemetryWave,
  type TelemetryPacket,
} from './packetsConfig';

export interface ActiveKeysState {
  freqDown: boolean;
  freqUp: boolean;
  ampDown: boolean;
  ampUp: boolean;
  filterNoise: boolean;
}

export interface SignalModulatorData {
  currentPacketIndex: number;
  totalPackets: number;
  completedPacketIds: readonly string[];
  currentPacket: TelemetryPacket;

  playerFreq: number;
  playerAmp: number;
  targetFreq: number;
  targetAmp: number;

  freqDiff: number;
  ampDiff: number;
  freqStatus: 'TOO_LOW' | 'TOO_HIGH' | 'MATCH';
  ampStatus: 'TOO_LOW' | 'TOO_HIGH' | 'MATCH';

  isJammed: boolean;
  isAligned: boolean;
  lockProgress: number; // 0.0 a 1.0
  lockQuality: number;  // 0.0 a 1.0

  isFiltering: boolean;
  filterBattery: number; // 0 a 100 %
  solarNoise: number;    // 0.0 a 1.0

  activeKeys: ActiveKeysState;

  lastRating: 'LOCKED' | 'SENT' | 'JAMMED' | null;
  lastRatingMessage: string | null;
  transmitterTempC: number;
  warningMessage: string | null;
}

export class SignalModulatorEngine extends BaseMinigame<SignalModulatorData> {
  readonly packets: readonly TelemetryPacket[];

  private inputState: ActiveKeysState = {
    freqDown: false,
    freqUp: false,
    ampDown: false,
    ampUp: false,
    filterNoise: false,
  };

  private ratingTimerMs = 0;
  private noisePhase = 0;
  private filterBatteryExact = 100;
  private exactFreq = 1.6;
  private exactAmp = 0.30;
  private exactLockProgress = 0;
  private readonly waveRand: () => number;

  constructor(
    definition: MinigameDefinition = signalModulatorDefinition,
    clock?: () => number,
    context: MinigameContext = DEFAULT_MINIGAME_CONTEXT,
    packets: readonly TelemetryPacket[] = TELEMETRY_PACKETS,
  ) {
    if (!packets.length) throw new Error('SignalModulatorEngine requiere al menos un paquete.');
    const firstPacket = packets[0];

    const initialFreq = 1.6;
    const initialAmp = 0.30;
    const freqDiff = Math.abs(initialFreq - firstPacket.targetFreq);
    const ampDiff = Math.abs(initialAmp - firstPacket.targetAmp);

    super(
      definition,
      {
        currentPacketIndex: 0,
        totalPackets: packets.length,
        completedPacketIds: [],
        currentPacket: firstPacket,

        playerFreq: initialFreq,
        playerAmp: initialAmp,
        targetFreq: firstPacket.targetFreq,
        targetAmp: firstPacket.targetAmp,

        freqDiff,
        ampDiff,
        freqStatus: initialFreq < firstPacket.targetFreq ? 'TOO_LOW' : 'TOO_HIGH',
        ampStatus: initialAmp < firstPacket.targetAmp ? 'TOO_LOW' : 'TOO_HIGH',

        isJammed: false,
        isAligned: false,
        lockProgress: 0,
        lockQuality: 0,

        isFiltering: false,
        filterBattery: 100,
        solarNoise: 0,

        activeKeys: {
          freqDown: false,
          freqUp: false,
          ampDown: false,
          ampUp: false,
          filterNoise: false,
        },

        lastRating: null,
        lastRatingMessage: null,
        transmitterTempC: 35,
        warningMessage: null,
      },
      clock,
      context,
    );

    this.packets = packets;
    this.exactFreq = initialFreq;
    this.exactAmp = initialAmp;
    this.waveRand = typeof context.seed === 'number'
      ? seededPrng(deriveRoundSeed(context.seed, 19))
      : Math.random;
  }

  // Permite sintonización en tests deterministas
  setPlayerFrequency(freq: number): void {
    if (this.getSnapshot().status !== 'running') return;
    const clamped = Math.max(1.0, Math.min(5.5, freq));
    this.exactFreq = clamped;
    this.setData({ ...this.getSnapshot().data, playerFreq: Number(clamped.toFixed(2)) });
  }

  setPlayerAmplitude(amp: number): void {
    if (this.getSnapshot().status !== 'running') return;
    const clamped = Math.max(0.15, Math.min(1.0, amp));
    this.exactAmp = clamped;
    this.setData({ ...this.getSnapshot().data, playerAmp: Number(clamped.toFixed(2)) });
  }

  protected onAction(actionId: string, state: ActionState): void {
    const isPress = state === 'press';

    if (actionId === 'freq-down') {
      this.inputState.freqDown = isPress;
      if (isPress) this.nudgeFreq(-0.04);
      return;
    }

    if (actionId === 'freq-up') {
      this.inputState.freqUp = isPress;
      if (isPress) this.nudgeFreq(0.04);
      return;
    }

    if (actionId === 'amp-down') {
      this.inputState.ampDown = isPress;
      if (isPress) this.nudgeAmp(-0.02);
      return;
    }

    if (actionId === 'amp-up') {
      this.inputState.ampUp = isPress;
      if (isPress) this.nudgeAmp(0.02);
      return;
    }

    if (actionId === 'filter-noise') {
      this.inputState.filterNoise = isPress;
      return;
    }
  }

  protected onUpdate(deltaMs: number): void {
    if (deltaMs <= 0) return;
    const data = this.getSnapshot().data;
    const speedMod = this.modifiers.speedMultiplier;

    // 1. Temporizador de avisos
    if (this.ratingTimerMs > 0) {
      this.ratingTimerMs = Math.max(0, this.ratingTimerMs - deltaMs);
      if (this.ratingTimerMs === 0 && data.lastRating !== 'LOCKED') {
        this.setData({ ...data, lastRating: null, lastRatingMessage: null });
      }
    }

    // 2. Modulación continua precisa por teclas mantenidas (acumuladores float independientes del FPS)
    let newFreq = this.exactFreq;
    if (this.inputState.freqDown) {
      newFreq = Math.max(1.0, newFreq - (0.95 * speedMod * deltaMs) / 1000);
    }
    if (this.inputState.freqUp) {
      newFreq = Math.min(5.5, newFreq + (0.95 * speedMod * deltaMs) / 1000);
    }
    this.exactFreq = newFreq;

    let newAmp = this.exactAmp;
    if (this.inputState.ampDown) {
      newAmp = Math.max(0.15, newAmp - (0.45 * deltaMs) / 1000);
    }
    if (this.inputState.ampUp) {
      newAmp = Math.min(1.0, newAmp + (0.45 * deltaMs) / 1000);
    }
    this.exactAmp = newAmp;

    // 3. Gestión del Filtro Solar y Batería de Blindaje (con precisión float independiente del FPS)
    let isFiltering = this.inputState.filterNoise && this.filterBatteryExact > 0;
    if (isFiltering) {
      this.filterBatteryExact = Math.max(0, this.filterBatteryExact - deltaMs / 80); // ~8.0s de uso continuo
      if (this.filterBatteryExact <= 0) isFiltering = false;
    } else {
      this.filterBatteryExact = Math.min(100, this.filterBatteryExact + deltaMs / 22); // recarga en ~2.2s
    }
    const filterBattery = this.filterBatteryExact;

    // 4. Ruido de Tormenta Solar (DONKI)
    this.noisePhase += (deltaMs / 1000) * 6;
    const hasFlare = data.currentPacket.hasSolarFlare;
    let packetSolarNoise = 0;

    if (hasFlare) {
      packetSolarNoise = isFiltering ? 0.04 : 0.75;
    } else {
      packetSolarNoise = 0.02;
    }

    const currentNoise = Math.min(1, packetSolarNoise);
    const isJammed = hasFlare && !isFiltering;

    // 5. Cálculo de Tolerancias y Alineación
    const targetFreq = data.currentPacket.targetFreq;
    const targetAmp = data.currentPacket.targetAmp;
    const freqDiff = Math.abs(newFreq - targetFreq);
    const ampDiff = Math.abs(newAmp - targetAmp);

    // Margen de tolerancia balanceado para teclado fino
    const freqTol = 0.22 * speedMod;
    const ampTol = 0.16;

    const freqMatched = freqDiff <= freqTol;
    const ampMatched = ampDiff <= ampTol;

    // Estados de ayuda visual
    let freqStatus: 'TOO_LOW' | 'TOO_HIGH' | 'MATCH' = 'MATCH';
    if (newFreq < targetFreq - freqTol) freqStatus = 'TOO_LOW';
    else if (newFreq > targetFreq + freqTol) freqStatus = 'TOO_HIGH';

    let ampStatus: 'TOO_LOW' | 'TOO_HIGH' | 'MATCH' = 'MATCH';
    if (newAmp < targetAmp - ampTol) ampStatus = 'TOO_LOW';
    else if (newAmp > targetAmp + ampTol) ampStatus = 'TOO_HIGH';

    // Para alinearse: frecuencia, amplitud Y filtro activo si hay tormenta
    const isAligned = freqMatched && ampMatched && !isJammed;
    let lockQuality = 0;
    let lockProgress = this.exactLockProgress;

    if (isAligned) {
      lockQuality = Math.max(0.4, 1 - (freqDiff / (2 * freqTol)) - (ampDiff / (2 * ampTol)));
      // Llenar lockProgress (tarda aprox 1.7s a alineación sostenida)
      lockProgress = Math.min(1, lockProgress + (deltaMs / 1700) * lockQuality);
      this.exactLockProgress = lockProgress;

      if (lockProgress >= 1) {
        this.advancePacket();
        return;
      }
    } else {
      // Descarga gradual si se sale de la sintonía
      lockProgress = Math.max(0, lockProgress - deltaMs / 2200);
      this.exactLockProgress = lockProgress;
    }

    // 6. Temperatura de la etapa de potencia RF
    const targetTemp = 32 + newAmp * 65;
    const tempChange = ((targetTemp - data.transmitterTempC) * deltaMs) / 2500;
    const transmitterTempC = Math.round(data.transmitterTempC + tempChange);

    // 7. Avisos técnicos estilo telemetría de misión
    let warningMessage: string | null = null;
    let lastRating: 'LOCKED' | 'SENT' | 'JAMMED' | null = data.lastRating;
    let lastRatingMessage: string | null = data.lastRatingMessage;

    if (isJammed && freqMatched && ampMatched) {
      warningMessage = 'PORTADORA ENGANCHADA · RUIDO SOLAR DETECTADO: MANTÉN [ESPACIO] PARA ACTIVAR FILTRO';
      lastRating = 'JAMMED';
      lastRatingMessage = 'SEÑAL BLOQUEADA POR RUIDO CÓSMICO';
    } else if (isJammed) {
      warningMessage = 'ALERTA DONKI: Viento solar ionizante. Activa FILTRO PASOBANDA [ESPACIO] al sintonizar.';
    } else if (transmitterTempC > 85) {
      warningMessage = 'AVISO TÉRMICO: Amplificador de antena sobrecalentándose.';
    }

    if (isAligned) {
      lastRating = 'LOCKED';
      lastRatingMessage = 'ENLACE ESTABLECIDO (CARRIER LOCK) · TRANSMITIENDO TELEMETRÍA...';
    }

    this.setData({
      ...data,
      playerFreq: Number(newFreq.toFixed(2)),
      playerAmp: Number(newAmp.toFixed(2)),
      targetFreq: Number(targetFreq.toFixed(2)),
      targetAmp: Number(targetAmp.toFixed(2)),
      freqDiff: Number(freqDiff.toFixed(2)),
      ampDiff: Number(ampDiff.toFixed(2)),
      freqStatus,
      ampStatus,
      isJammed,
      isAligned,
      lockProgress: Number(lockProgress.toFixed(3)),
      lockQuality: Number(lockQuality.toFixed(2)),
      isFiltering,
      filterBattery: Math.round(filterBattery),
      solarNoise: Number(currentNoise.toFixed(2)),
      activeKeys: { ...this.inputState },
      transmitterTempC,
      warningMessage,
      lastRating,
      lastRatingMessage,
    });
  }

  private nudgeFreq(delta: number): void {
    const cur = this.exactFreq;
    const speedMod = this.modifiers.speedMultiplier;
    this.setPlayerFrequency(cur + delta * speedMod);
  }

  private nudgeAmp(delta: number): void {
    const cur = this.exactAmp;
    this.setPlayerAmplitude(cur + delta);
  }

  private advancePacket(): void {
    const data = this.getSnapshot().data;
    const pointsPerPacket = Math.round(250 * this.modifiers.scoreMultiplier);
    this.addScore(pointsPerPacket);

    const completedPacketIds = [...data.completedPacketIds, data.currentPacket.id];
    const nextIndex = data.currentPacketIndex + 1;
    const progress = Math.min(1, nextIndex / Math.max(1, this.packets.length));
    this.setProgress(progress);

    this.ratingTimerMs = 2500;

    // Modo puntuación continuo: tras los paquetes iniciales, generamos nuevas ondas sin parar hasta agotar el tiempo
    const nextPacket =
      nextIndex < this.packets.length
        ? this.packets[nextIndex]
        : generateTelemetryWave(nextIndex, this.waveRand, data.targetFreq);
    const nextStartFreq = nextPacket.targetFreq >= 3.0 ? 1.5 : 4.5;
    const nextStartAmp = nextPacket.targetAmp >= 0.6 ? 0.25 : 0.78;
    this.exactFreq = nextStartFreq;
    this.exactAmp = nextStartAmp;
    this.exactLockProgress = 0;

    this.setData({
      ...data,
      currentPacketIndex: nextIndex,
      totalPackets: Math.max(data.totalPackets, nextIndex + 1),
      currentPacket: nextPacket,
      completedPacketIds,
      playerFreq: nextStartFreq,
      playerAmp: nextStartAmp,
      targetFreq: nextPacket.targetFreq,
      targetAmp: nextPacket.targetAmp,
      freqDiff: Math.abs(nextStartFreq - nextPacket.targetFreq),
      ampDiff: Math.abs(nextStartAmp - nextPacket.targetAmp),
      freqStatus: nextStartFreq < nextPacket.targetFreq ? 'TOO_LOW' : 'TOO_HIGH',
      ampStatus: nextStartAmp < nextPacket.targetAmp ? 'TOO_LOW' : 'TOO_HIGH',
      isJammed: false,
      isAligned: false,
      lockProgress: 0,
      lockQuality: 0,
      lastRating: 'SENT',
      lastRatingMessage: `PAQUETE ENVIADO A DSN · SIGUIENTE: ${nextPacket.station}`,
      warningMessage: nextPacket.hasSolarFlare ? nextPacket.flareMessage ?? null : null,
    });
  }
}
