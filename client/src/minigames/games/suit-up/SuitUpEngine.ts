import {
  DEFAULT_MINIGAME_CONTEXT,
  resourceModifiers,
  seededPrng,
  type MinigameContext,
} from '../../../../../shared/minigames/context';
import { suitUpDefinition } from '../../../../../shared/minigames/suitUp';
import type { MinigameDefinition } from '../../../../../shared/minigames/types';
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import {
  generateRandomSuitSteps,
  type SuitPartKey,
  type SuitStep,
} from './suitStepsConfig';

export type HitRating = 'PERFECT' | 'GOOD' | 'MISS';

export interface SuitUpData {
  /** Índice del paso actual (0 a totalSteps - 1) */
  currentStepIndex: number;
  /** Número total de pasos configurados */
  totalSteps: number;
  /** IDs de los pasos completados con éxito */
  completedStepIds: readonly string[];
  /** Claves de las partes del traje montadas (para renderizar capas SVG) */
  completedParts: readonly SuitPartKey[];
  /** Configuración del paso actual */
  currentStep: SuitStep;

  // --- Estado dinámico del QTE actual ---
  /** Progreso del indicador visible (0.0 a 1.0) */
  qteProgress: number;
  /** Tiempo restante para completar el intento del paso actual (ms) */
  qteRemainingMs: number;
  /** Contador de pulsaciones acumuladas para QTE tipo 'mash' */
  mashCount: number;
  /** Objetivo de pulsaciones para QTE tipo 'mash' */
  mashTarget: number;
  /** Índice de la tecla esperada actualmente en QTE tipo 'sequence' */
  sequenceIndex: number;
  /** Si el jugador está manteniendo pulsada la acción en QTE tipo 'hold' */
  isHolding: boolean;
  /** Nivel de carga acumulado en QTE tipo 'hold' (0.0 a 1.0+) */
  holdProgress: number;

  // --- Feedback y Telemetría ---
  /** Última calificación obtenida */
  lastRating: HitRating | null;
  /** Mensaje descriptivo del último acierto o fallo */
  lastRatingMessage: string | null;
  /** Racha actual de aciertos sin fallos */
  combo: number;
  /** Mejor racha alcanzada en la partida */
  bestCombo: number;
  /** Presión interna del traje (0.0 a 4.3 PSI) */
  suitPressurePsi: number;
  /** Integridad del blindaje del traje (0% a 100%) */
  suitIntegrityPercent: number;
  /** Nivel de soporte vital y oxígeno (0% a 100%) */
  oxygenPercent: number;
  /** Aviso o alerta del sistema de presurización */
  warningMessage: string | null;
}

export class SuitUpEngine extends BaseMinigame<SuitUpData> {
  readonly steps: readonly SuitStep[];
  private sweepElapsedMs = 0;
  private ratingTimerMs = 0;

  constructor(
    definition: MinigameDefinition = suitUpDefinition,
    clock?: () => number,
    context: MinigameContext = DEFAULT_MINIGAME_CONTEXT,
    steps?: readonly SuitStep[],
  ) {
    const resolvedSteps =
      steps ??
      generateRandomSuitSteps(
        typeof context.seed === 'number' ? seededPrng(context.seed) : Math.random,
      );
    if (!resolvedSteps.length) throw new Error('SuitUpEngine requiere al menos un paso.');
    const firstStep = resolvedSteps[0];

    super(
      definition,
      {
        currentStepIndex: 0,
        totalSteps: resolvedSteps.length,
        completedStepIds: [],
        completedParts: [],
        currentStep: firstStep,

        qteProgress: 0,
        qteRemainingMs: firstStep.qte.durationMs,
        mashCount: 0,
        mashTarget: firstStep.qte.type === 'mash' ? firstStep.qte.targetCount : 0,
        sequenceIndex: 0,
        isHolding: false,
        holdProgress: 0,

        lastRating: null,
        lastRatingMessage: null,
        combo: 0,
        bestCombo: 0,
        suitPressurePsi: 0,
        suitIntegrityPercent: 0,
        oxygenPercent: 0,
        warningMessage: null,
      },
      clock,
      context,
    );

    this.steps = resolvedSteps;
  }

  protected onAction(actionId: string, state: ActionState): void {
    const data = this.getSnapshot().data;
    const currentStep = data.currentStep;
    const qte = currentStep.qte;

    if (state === 'press') {
      if (qte.type === 'timing') {
        if (actionId !== qte.actionId) return;

        // Tolerancias dinámicas afectadas por el nivel de energía del jugador
        const energySpeedMod = this.modifiers.speedMultiplier;
        const progress = data.qteProgress;
        const sweetCenter = (qte.sweetSpotStart + qte.sweetSpotEnd) / 2;
        const sweetHalfWidth = (qte.sweetSpotEnd - qte.sweetSpotStart) / 2;
        const perfectHalfWidth = Math.max(0.02, sweetHalfWidth * qte.perfectTolerance * energySpeedMod);
        const distFromCenter = Math.abs(progress - sweetCenter);

        if (distFromCenter <= perfectHalfWidth) {
          const points = Math.round((qte.basePoints + qte.perfectBonus) * this.modifiers.scoreMultiplier);
          this.advanceStep('PERFECT', '¡SINCRONIZACIÓN PERFECTA! + ' + points, points);
        } else if (progress >= qte.sweetSpotStart && progress <= qte.sweetSpotEnd) {
          const points = Math.round(qte.basePoints * this.modifiers.scoreMultiplier);
          this.advanceStep('GOOD', '¡ACOPLE CORRECTO! + ' + points, points);
        } else {
          const msg = progress < qte.sweetSpotStart ? '¡DEMASIADO PRONTO!' : '¡DEMASIADO TARDE!';
          this.registerMiss(msg);
        }
        return;
      }

      if (qte.type === 'mash') {
        if (actionId !== qte.actionId) return;
        const newMash = data.mashCount + 1;
        const newProgress = Math.min(1, newMash / qte.targetCount);

        if (newMash >= qte.targetCount) {
          const isFast = data.qteRemainingMs >= qte.durationMs * 0.4;
          const points = Math.round(
            (qte.basePoints + (isFast ? qte.perfectBonus : 0)) * this.modifiers.scoreMultiplier,
          );
          const rating = isFast ? 'PERFECT' : 'GOOD';
          const msg = isFast ? '¡PRESURIZACIÓN ULTRARRÁPIDA! + ' + points : '¡BISAGRAS SELLADAS! + ' + points;
          this.advanceStep(rating, msg, points);
        } else {
          this.setData({
            ...data,
            mashCount: newMash,
            qteProgress: newProgress,
            warningMessage: null,
          });
        }
        return;
      }

      if (qte.type === 'sequence') {
        const expectedAction = qte.sequence[data.sequenceIndex];
        if (actionId === expectedAction) {
          const nextSeq = data.sequenceIndex + 1;
          if (nextSeq >= qte.sequence.length) {
            const points = Math.round((qte.basePoints + qte.perfectBonus) * this.modifiers.scoreMultiplier);
            this.advanceStep('PERFECT', '¡SECUENCIA DE CIERRES COMPLETADA! + ' + points, points);
          } else {
            this.setData({
              ...data,
              sequenceIndex: nextSeq,
              qteProgress: nextSeq / qte.sequence.length,
              lastRating: 'GOOD',
              lastRatingMessage: `¡ANCLAJE ${nextSeq}/${qte.sequence.length} ASEGURADO!`,
              warningMessage: null,
            });
          }
        } else {
          this.registerMiss('¡TECLA INCORRECTA! REINICIANDO SECUENCIA');
          this.setData({
            ...this.getSnapshot().data,
            sequenceIndex: 0,
            qteProgress: 0,
          });
        }
        return;
      }

      if (qte.type === 'hold') {
        if (actionId === qte.actionId && !data.isHolding) {
          this.setData({
            ...data,
            isHolding: true,
            holdProgress: 0,
            qteProgress: 0,
            warningMessage: null,
          });
        }
        return;
      }
    }

    if (state === 'release') {
      if (qte.type === 'hold' && data.isHolding && actionId === qte.actionId) {
        const hold = data.holdProgress;
        this.setData({ ...data, isHolding: false });

        if (hold >= qte.perfectMin && hold <= qte.perfectMax) {
          const points = Math.round((qte.basePoints + qte.perfectBonus) * this.modifiers.scoreMultiplier);
          this.advanceStep('PERFECT', '¡SELLADO DE CUELLO PERFECTO! + ' + points, points);
        } else if (hold >= qte.targetMin && hold <= qte.targetMax) {
          const points = Math.round(qte.basePoints * this.modifiers.scoreMultiplier);
          this.advanceStep('GOOD', '¡CASCO BLOQUEADO CON ÉXITO! + ' + points, points);
        } else {
          const msg = hold < qte.targetMin ? '¡SOLTADO DEMASIADO PRONTO!' : '¡SOBRECARGA DE PRESIÓN!';
          this.registerMiss(msg);
          this.setData({
            ...this.getSnapshot().data,
            holdProgress: 0,
            qteProgress: 0,
          });
        }
      }
    }
  }

  protected onUpdate(deltaMs: number): void {
    if (deltaMs <= 0) return;
    const data = this.getSnapshot().data;
    const qte = data.currentStep.qte;

    // Actualizar temporizador de rating visible
    if (this.ratingTimerMs > 0) {
      this.ratingTimerMs = Math.max(0, this.ratingTimerMs - deltaMs);
      if (this.ratingTimerMs === 0 && data.lastRating !== null) {
        this.setData({ ...data, lastRating: null, lastRatingMessage: null });
      }
    }

    const remainingStepMs = Math.max(0, data.qteRemainingMs - deltaMs);

    // Actualización continua según la mecánica del QTE
    if (qte.type === 'timing') {
      const speed = this.modifiers.speedMultiplier;
      this.sweepElapsedMs += deltaMs * (1 / speed);
      const progress = (this.sweepElapsedMs % qte.sweepPeriodMs) / qte.sweepPeriodMs;
      this.setData({
        ...data,
        qteProgress: progress,
        qteRemainingMs: remainingStepMs,
      });
      return;
    }

    if (qte.type === 'mash') {
      let currentMash = data.mashCount;
      if (qte.leakRatePerSec > 0 && currentMash > 0) {
        currentMash = Math.max(0, currentMash - (qte.leakRatePerSec * deltaMs) / 1000);
      }
      this.setData({
        ...data,
        mashCount: currentMash,
        qteProgress: Math.min(1, currentMash / qte.targetCount),
        qteRemainingMs: remainingStepMs,
      });
      return;
    }

    if (qte.type === 'hold') {
      if (data.isHolding) {
        const speed = this.modifiers.speedMultiplier;
        const added = deltaMs / (qte.chargeDurationMs * speed);
        const newHold = data.holdProgress + added;

        // Si se sobrepasa excesivamente el límite superior, auto-fallar por sobrecarga
        if (newHold > 1.15) {
          this.registerMiss('¡SOBRECARGA CRÍTICA DE PRESIÓN!');
          this.setData({
            ...this.getSnapshot().data,
            isHolding: false,
            holdProgress: 0,
            qteProgress: 0,
            qteRemainingMs: remainingStepMs,
          });
          return;
        }

        this.setData({
          ...data,
          holdProgress: newHold,
          qteProgress: Math.min(1, newHold),
          qteRemainingMs: remainingStepMs,
        });
      } else {
        this.setData({ ...data, qteRemainingMs: remainingStepMs });
      }
      return;
    }

    if (qte.type === 'sequence') {
      this.setData({
        ...data,
        qteProgress: data.sequenceIndex / qte.sequence.length,
        qteRemainingMs: remainingStepMs,
      });
    }
  }

  private advanceStep(rating: HitRating, message: string, points: number): void {
    const data = this.getSnapshot().data;
    this.addScore(points);

    const newCombo = data.combo + 1;
    const bestCombo = Math.max(data.bestCombo, newCombo);
    this.ratingTimerMs = 1500;

    const completedStepIds = [...data.completedStepIds, data.currentStep.id];
    const completedParts = [...data.completedParts, data.currentStep.partKey];
    const nextIndex = data.currentStepIndex + 1;
    const progress = nextIndex / this.steps.length;

    this.setProgress(progress);

    // Actualizar telemetría científica del traje
    const suitPressurePsi = Math.min(4.3, Number((progress * 4.3).toFixed(1)));
    const suitIntegrityPercent = Math.round(progress * 100);
    const oxygenPercent = Math.round(progress * 100);

    // ¿Se han completado todos los pasos? ¡Traje presurizado y carrera terminada!
    if (nextIndex >= this.steps.length) {
      this.setData({
        ...data,
        currentStepIndex: nextIndex,
        completedStepIds,
        completedParts,
        qteProgress: 1,
        lastRating: rating,
        lastRatingMessage: '¡TRAJE ESPACIAL 100% OPERATIVO Y SELLADO!',
        combo: newCombo,
        bestCombo,
        suitPressurePsi: 4.3,
        suitIntegrityPercent: 100,
        oxygenPercent: 100,
        warningMessage: null,
      });
      this.complete();
      return;
    }

    const nextStep = this.steps[nextIndex];
    this.sweepElapsedMs = 0;

    this.setData({
      ...data,
      currentStepIndex: nextIndex,
      currentStep: nextStep,
      completedStepIds,
      completedParts,
      qteProgress: 0,
      qteRemainingMs: nextStep.qte.durationMs,
      mashCount: 0,
      mashTarget: nextStep.qte.type === 'mash' ? nextStep.qte.targetCount : 0,
      sequenceIndex: 0,
      isHolding: false,
      holdProgress: 0,
      lastRating: rating,
      lastRatingMessage: message,
      combo: newCombo,
      bestCombo,
      suitPressurePsi,
      suitIntegrityPercent,
      oxygenPercent,
      warningMessage: null,
    });
  }

  private registerMiss(message: string): void {
    const data = this.getSnapshot().data;
    this.ratingTimerMs = 1200;
    this.setData({
      ...data,
      lastRating: 'MISS',
      lastRatingMessage: message,
      combo: 0,
      warningMessage: message,
    });
  }
}
