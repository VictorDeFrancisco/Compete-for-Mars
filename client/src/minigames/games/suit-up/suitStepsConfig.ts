/**
 * ============================================================================
 * CONFIGURACIÓN DE PASOS Y QUICK TIME EVENTS (QTE) DEL TRAJE ESPACIAL
 * ============================================================================
 *
 * Este archivo centraliza todos los pasos y parámetros del minijuego para que sea
 * lo más fácil posible de modificar, personalizar y balancear:
 *
 * - Para AÑADIR o QUITAR pasos: modifica el array `DEFAULT_SUIT_STEPS`.
 * - Para CAMBIAR el TIPO de QTE de un paso: cambia su propiedad `qte.type`:
 *     * 'timing'   : Pulsar en el momento exacto (anillo/barra en zona verde/dorada).
 *     * 'mash'     : Pulsar repetidamente para presurizar/bombear.
 *     * 'sequence' : Introducir una combinación de direcciones/teclas en orden.
 *     * 'hold'     : Mantener pulsado y soltar en la zona óptima.
 * - Para CAMBIAR TECLAS: cambia `actionId` o `sequence` usando las acciones:
 *     * 'action-primary' : Espacio o Clic/Toque principal.
 *     * 'action-up'      : Flecha Arriba (↑) / Botón Arriba.
 *     * 'action-down'    : Flecha Abajo (↓) / Botón Abajo.
 *     * 'action-left'    : Flecha Izquierda (←) / Botón Izquierda.
 *     * 'action-right'   : Flecha Derecha (→) / Botón Derecha.
 * - Para AJUSTAR PUNTOS o TIEMPOS: ajusta `basePoints`, `perfectBonus`, `durationMs`.
 * ============================================================================
 */

export type QteType = 'timing' | 'mash' | 'sequence' | 'hold';

export type SuitPartKey =
  | 'cooling'   // Prenda de refrigeración líquida (LCVG)
  | 'boots'     // Pantalones y botas presurizadas (LTA)
  | 'torso'     // Hard Upper Torso (HUT)
  | 'gloves'    // Guantes de EVA y aros de muñeca
  | 'helmet'    // Casco de burbuja y visor solar de oro
  | 'backpack'; // Mochila de soporte vital (PLSS)

export interface BaseQteConfig {
  type: QteType;
  /** Tiempo máximo en milisegundos para completar este QTE antes de reintentar */
  durationMs: number;
  /** Puntuación base otorgada al completar el paso */
  basePoints: number;
  /** Puntuación extra otorgada al conseguir un acierto PERFECTO */
  perfectBonus: number;
}

export interface TimingQteConfig extends BaseQteConfig {
  type: 'timing';
  /** ID de la acción que el jugador debe pulsar */
  actionId: string;
  /** Duración de una oscilación completa del indicador (en ms) */
  sweepPeriodMs: number;
  /** Comienzo de la zona de acierto válido (0.0 a 1.0) */
  sweetSpotStart: number;
  /** Fin de la zona de acierto válido (0.0 a 1.0) */
  sweetSpotEnd: number;
  /** Margen central para calificar como "PERFECT!" (fracción de la zona) */
  perfectTolerance: number;
}

export interface MashQteConfig extends BaseQteConfig {
  type: 'mash';
  /** ID de la acción requerida para bombear/presurizar */
  actionId: string;
  /** Número total de pulsaciones necesarias */
  targetCount: number;
  /** Pérdida de pulsaciones por segundo si el jugador no pulsa nada */
  leakRatePerSec: number;
}

export interface SequenceQteConfig extends BaseQteConfig {
  type: 'sequence';
  /** Lista ordenada de acciones que deben introducirse secuencialmente */
  sequence: readonly string[];
}

export interface HoldQteConfig extends BaseQteConfig {
  type: 'hold';
  /** ID de la acción que se debe mantener y soltar */
  actionId: string;
  /** Tiempo en milisegundos que tarda la carga en llegar al 100% */
  chargeDurationMs: number;
  /** Inicio de la zona verde de sellado seguro (0.0 a 1.0) */
  targetMin: number;
  /** Fin de la zona verde de sellado seguro (0.0 a 1.0) */
  targetMax: number;
  /** Inicio de la zona dorada de sellado PERFECTO (0.0 a 1.0) */
  perfectMin: number;
  /** Fin de la zona dorada de sellado PERFECTO (0.0 a 1.0) */
  perfectMax: number;
}

export type StepQteConfig =
  | TimingQteConfig
  | MashQteConfig
  | SequenceQteConfig
  | HoldQteConfig;

export interface SuitStep {
  /** Identificador único del paso */
  id: string;
  /** Clave visual para la capa SVG del astronauta */
  partKey: SuitPartKey;
  /** Nombre del componente del traje espacial */
  name: string;
  /** Código técnico aeroespacial */
  code: string;
  /** Instrucción principal visible en pantalla para el QTE */
  prompt: string;
  /** Descripción secundaria */
  description: string;
  /** Dato científico / educativo real de la NASA sobre esta parte del traje */
  lore: string;
  /** Configuración específica del minijuego QTE */
  qte: StepQteConfig;
}

/**
 * Lista por defecto de los 6 pasos para ponerse y sellar el traje espacial.
 * Se pueden reordenar, modificar o cambiar libremente.
 */
export const DEFAULT_SUIT_STEPS: readonly SuitStep[] = [
  // 1. LIQUID COOLING (Timing QTE)
  {
    id: 'lcvg-cooling',
    partKey: 'cooling',
    name: 'Liquid Cooling Garment (LCVG)',
    code: 'LCVG-T9',
    prompt: 'SYNC THE COOLANT FLOW!',
    description: 'Press SPACE when the coolant indicator enters the flow ring.',
    lore: 'The LCVG weaves over 130 meters of chilled water capillary tubes against the astronaut’s skin to prevent heat stroke.',
    qte: {
      type: 'timing',
      actionId: 'action-primary',
      sweepPeriodMs: 1400,
      sweetSpotStart: 0.62,
      sweetSpotEnd: 0.88,
      perfectTolerance: 0.05,
      durationMs: 7000,
      basePoints: 100,
      perfectBonus: 50,
    },
  },

  // 2. BOOTS AND TROUSERS (Sequence QTE)
  {
    id: 'lta-boots',
    partKey: 'boots',
    name: 'Pressurized Boots & Lower Torso (LTA)',
    code: 'LTA-BOOTS',
    prompt: 'LOCK LOWER ANCHORS [↓ · ← · → · ↓]!',
    description: 'Enter the arrow sequence (↑ ↓ ← →) to secure knees and regolith boots.',
    lore: 'EVA boots have multi-layer silicone and titanium soles to insulate heat and withstand sharp Martian or lunar regolith.',
    qte: {
      type: 'sequence',
      sequence: ['action-down', 'action-left', 'action-right', 'action-down'],
      durationMs: 7500,
      basePoints: 100,
      perfectBonus: 50,
    },
  },

  // 3. HARD UPPER TORSO (Mash QTE)
  {
    id: 'hut-chest',
    partKey: 'torso',
    name: 'Hard Upper Torso (HUT)',
    code: 'HUT-CHEST',
    prompt: 'TAP FAST TO LATCH ARMORED HINGES!',
    description: 'Repeatedly press SPACE or the center button to lock the torso fastening pins.',
    lore: 'The HUT (Hard Upper Torso) is a fiberglass and aluminum shell built to withstand micrometeoroid impacts at 27,000 km/h.',
    qte: {
      type: 'mash',
      actionId: 'action-primary',
      targetCount: 6,
      leakRatePerSec: 0.25,
      durationMs: 6500,
      basePoints: 100,
      perfectBonus: 50,
    },
  },

  // 4. EVA GLOVES (Timing QTE)
  {
    id: 'eva-gloves',
    partKey: 'gloves',
    name: 'Pressurized Gloves & Wrist Bearings',
    code: 'EVA-GLOVES',
    prompt: 'LOCK THE WRIST RING [SPACE]!',
    description: 'Press SPACE when the needle enters the gold airtight coupling mark.',
    lore: 'Gloves are the most complex suit part: they include fingertip heaters and axial bearings for tool handling in vacuum.',
    qte: {
      type: 'timing',
      actionId: 'action-primary',
      sweepPeriodMs: 1300,
      sweetSpotStart: 0.60,
      sweetSpotEnd: 0.86,
      perfectTolerance: 0.05,
      durationMs: 7000,
      basePoints: 100,
      perfectBonus: 50,
    },
  },

  // 5. HELMET AND GOLD VISOR (Hold QTE)
  {
    id: 'helmet-visor',
    partKey: 'helmet',
    name: 'Bubble Helmet & Gold Visor',
    code: 'EVVA-HELMET',
    prompt: 'HOLD AND RELEASE IN THE GREEN ZONE TO SEAL!',
    description: 'Hold SPACE and release right when the gauge reaches the airtight coupling zone.',
    lore: 'The outer visor is coated in a micro-thin 24-karat gold film that lets you see out while blocking 90% of heat and UV radiation.',
    qte: {
      type: 'hold',
      actionId: 'action-primary',
      chargeDurationMs: 1600,
      targetMin: 0.66,
      targetMax: 0.88,
      perfectMin: 0.73,
      perfectMax: 0.81,
      durationMs: 6500,
      basePoints: 100,
      perfectBonus: 50,
    },
  },

  // 6. PLSS BACKPACK & LIFE SUPPORT (Sequence QTE)
  {
    id: 'plss-backpack',
    partKey: 'backpack',
    name: 'Life Support & 4.3 PSI Pressurization (PLSS)',
    code: 'PLSS-O2',
    prompt: 'OXYGEN ACTIVATION SEQUENCE [↑ · SPACE · ↓ · SPACE]!',
    description: 'Open O₂ valve (↑), pressurize chamber (Space), purge CO₂ filter (↓), and lock 4.3 PSI regulator (Space).',
    lore: 'The PLSS supplies 100% pure oxygen regulated at a steady 4.3 PSI (29.6 kPa) internal pressure for up to 8 hours.',
    qte: {
      type: 'sequence',
      sequence: ['action-up', 'action-primary', 'action-down', 'action-primary'],
      durationMs: 7500,
      basePoints: 100,
      perfectBonus: 50,
    },
  },
];

/**
 * Descriptive icon/label mapping for each available action.
 */
export const ACTION_LABELS: Record<string, { key: string; label: string; icon: string }> = {
  'action-primary': { key: 'SPACE', label: 'Seal / Action', icon: '⎵' },
  'action-up': { key: '↑', label: 'Upper Valve', icon: '▲' },
  'action-down': { key: '↓', label: 'Lower Latch', icon: '▼' },
  'action-left': { key: '←', label: 'Left Lock', icon: '◀' },
  'action-right': { key: '→', label: 'Right Lock', icon: '▶' },
};

const ARROW_SEQ_POOL = ['action-up', 'action-down', 'action-left', 'action-right'] as const;

function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Picks 6 QTE types with strictly 1 'mash' and no two consecutive identical types.
 */
function pickBalancedQteTypes(rng: () => number): QteType[] {
  const extraHold = rng() < 0.5;
  const deck: QteType[] = extraHold
    ? ['mash', 'timing', 'sequence', 'sequence', 'hold', 'hold']
    : ['mash', 'timing', 'timing', 'sequence', 'sequence', 'hold'];

  for (let attempt = 0; attempt < 24; attempt++) {
    const candidate = shuffleWithRng([...deck], rng);
    const hasAdjacentRepeat = candidate.some((t, idx) => idx > 0 && candidate[idx - 1] === t);
    if (!hasAdjacentRepeat) return candidate;
  }

  return ['timing', 'sequence', 'hold', 'sequence', 'mash', 'timing'];
}

/**
 * Generates a balanced 6-step spacesuit assembly run:
 * - Dresses all 6 suit parts in logical inside-out order.
 * - Uses at most ONE 'mash' step and avoids consecutive identical QTE modes.
 * - Builds directional sequences purely from arrow keys without consecutive repeats.
 */
export function generateRandomSuitSteps(rng: () => number = Math.random): SuitStep[] {
  const orderedParts = [...DEFAULT_SUIT_STEPS];
  const qteTypes = pickBalancedQteTypes(rng);

  return orderedParts.map((baseStep, idx) => {
    const chosenType = qteTypes[idx] ?? 'timing';

    if (chosenType === 'timing') {
      const sweetWidth = 0.20 + rng() * 0.08;
      const sweetSpotStart = Math.round((0.18 + rng() * (0.74 - sweetWidth)) * 100) / 100;
      const sweetSpotEnd = Math.round((sweetSpotStart + sweetWidth) * 100) / 100;
      const sweepPeriodMs = 1150 + Math.floor(rng() * 400);
      return {
        ...baseStep,
        prompt: 'PRESS SPACE IN THE GREEN ZONE!',
        description: 'Sync the moving indicator inside the airtight coupling range.',
        qte: {
          type: 'timing',
          actionId: 'action-primary',
          sweepPeriodMs,
          sweetSpotStart,
          sweetSpotEnd,
          perfectTolerance: 0.06,
          durationMs: 7000,
          basePoints: 100,
          perfectBonus: 50,
        },
      };
    }

    if (chosenType === 'mash') {
      const targetCount = 6 + Math.floor(rng() * 3); // 6..8 pumps, max once per run
      return {
        ...baseStep,
        prompt: `TAP FAST ${targetCount} TIMES!`,
        description: `Pressurize ${baseStep.code} coupling with ${targetCount} pumps.`,
        qte: {
          type: 'mash',
          actionId: 'action-primary',
          targetCount,
          leakRatePerSec: 0.2,
          durationMs: 7000,
          basePoints: 100,
          perfectBonus: 50,
        },
      };
    }

    if (chosenType === 'hold') {
      const chargeDurationMs = 1250 + Math.floor(rng() * 500);
      const zoneWidth = 0.22 + rng() * 0.06;
      const targetMin = Math.round((0.46 + rng() * 0.22) * 100) / 100;
      const targetMax = Math.round((targetMin + zoneWidth) * 100) / 100;
      const mid = (targetMin + targetMax) / 2;
      return {
        ...baseStep,
        prompt: 'HOLD AND RELEASE IN THE GREEN ZONE!',
        description: 'Charge the pneumatic seal and release inside the optimal band.',
        qte: {
          type: 'hold',
          actionId: 'action-primary',
          chargeDurationMs,
          targetMin,
          targetMax,
          perfectMin: Math.round((mid - 0.05) * 100) / 100,
          perfectMax: Math.round((mid + 0.05) * 100) / 100,
          durationMs: 7000,
          basePoints: 100,
          perfectBonus: 50,
        },
      };
    }

    const seqLen = 4;
    const sequence: string[] = [];
    for (let k = 0; k < seqLen; k++) {
      const prev = sequence[k - 1];
      const choices = ARROW_SEQ_POOL.filter(a => a !== prev);
      sequence.push(choices[Math.floor(rng() * choices.length)]);
    }
    const readable = sequence.map(a => ACTION_LABELS[a]?.key ?? a).join(' · ');
    return {
      ...baseStep,
      prompt: `SEQUENCE: ${readable}!`,
      description: 'Press the arrow keys in exact order to lock the suit latches.',
      qte: {
        type: 'sequence',
        sequence,
        durationMs: 8000,
        basePoints: 100,
        perfectBonus: 50,
      },
    };
  });
}
