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
  // 1. REFRIGERACIÓN LÍQUIDA (Timing QTE)
  {
    id: 'lcvg-cooling',
    partKey: 'cooling',
    name: 'Prenda de Refrigeración Líquida (LCVG)',
    code: 'LCVG-T9',
    prompt: '¡SINCRONIZA EL FLUJO DE REFRIGERANTE!',
    description: 'Pulsa ESPACIO cuando el indicador de refrigerante entre en el anillo de flujo.',
    lore: 'El LCVG teje más de 130 metros de tubos capilares de agua helada sobre la piel del astronauta para evitar golpes de calor por esfuerzo.',
    qte: {
      type: 'timing',
      actionId: 'action-primary',
      sweepPeriodMs: 1400,
      sweetSpotStart: 0.62,
      sweetSpotEnd: 0.88,
      perfectTolerance: 0.05,
      durationMs: 7000,
      basePoints: 120,
      perfectBonus: 40,
    },
  },

  // 2. BOTAS Y PANTALONES (Sequence QTE)
  {
    id: 'lta-boots',
    partKey: 'boots',
    name: 'Pantalones y Botas Presurizadas (LTA)',
    code: 'LTA-BOOTS',
    prompt: '¡BLOQUEA LOS ANCLAJES INFERIORES [↓ · ← · → · ↓]!',
    description: 'Introduce la secuencia con las flechas (↑ ↓ ← →) para asegurar las rodillas y botas de regolito.',
    lore: 'Las botas de EVA tienen suelas multicapa de silicona y titanio para aislar el calor y resistir el cortante regolito marciano o lunar.',
    qte: {
      type: 'sequence',
      sequence: ['action-down', 'action-left', 'action-right', 'action-down'],
      durationMs: 7500,
      basePoints: 130,
      perfectBonus: 30,
    },
  },

  // 3. TORSO RÍGIDO (Mash QTE)
  {
    id: 'hut-chest',
    partKey: 'torso',
    name: 'Torso Rígido Superior (HUT)',
    code: 'HUT-CHEST',
    prompt: '¡PULSA RÁPIDO PARA ENCAJAR LAS BISAGRAS BLINDADAS!',
    description: 'Pulsa repetidamente ESPACIO o el botón central para cerrar los pasadores de fijación del torso.',
    lore: 'El HUT (Hard Upper Torso) es una coraza de fibra de vidrio y aluminio que soporta impactos de micrometeoritos a 27.000 km/h.',
    qte: {
      type: 'mash',
      actionId: 'action-primary',
      targetCount: 6,
      leakRatePerSec: 0.5,
      durationMs: 6500,
      basePoints: 140,
      perfectBonus: 30,
    },
  },

  // 4. GUANTES DE EVA (Timing QTE)
  {
    id: 'eva-gloves',
    partKey: 'gloves',
    name: 'Guantes Presurizados y Aros Giratorios',
    code: 'EVA-GLOVES',
    prompt: '¡BLOQUEA EL ARO DE MUÑECA [ESPACIO]!',
    description: 'Pulsa ESPACIO cuando la aguja entre en la marca dorada de acople estanco.',
    lore: 'Los guantes son la pieza más compleja del traje: integran calefactores en las yemas y aros de rodamientos axiales para manipular herramientas en el vacío.',
    qte: {
      type: 'timing',
      actionId: 'action-primary',
      sweepPeriodMs: 1300,
      sweetSpotStart: 0.60,
      sweetSpotEnd: 0.86,
      perfectTolerance: 0.05,
      durationMs: 7000,
      basePoints: 130,
      perfectBonus: 40,
    },
  },

  // 5. CASCO Y VISOR DORADO (Hold QTE)
  {
    id: 'helmet-visor',
    partKey: 'helmet',
    name: 'Casco de Burbuja y Visor Dorado',
    code: 'EVVA-HELMET',
    prompt: '¡MANTÉN PULSADO Y SUELTA EN LA ZONA VERDE PARA SELLAR!',
    description: 'Mantén presionado ESPACIO y suéltalo justo cuando el medidor alcance la zona de acople estanco.',
    lore: 'El visor exterior está bañado con una película de oro de 24 quilates tan fina que permite ver hacia afuera pero rechaza el 90% del calor y la radiación UV.',
    qte: {
      type: 'hold',
      actionId: 'action-primary',
      chargeDurationMs: 1600,
      targetMin: 0.66,
      targetMax: 0.88,
      perfectMin: 0.73,
      perfectMax: 0.81,
      durationMs: 6500,
      basePoints: 140,
      perfectBonus: 40,
    },
  },

  // 6. MOCHILA PLSS Y SOPORTE VITAL (Sequence QTE)
  {
    id: 'plss-backpack',
    partKey: 'backpack',
    name: 'Soporte Vital y Presurización a 4.3 PSI (PLSS)',
    code: 'PLSS-O2',
    prompt: '¡SECUENCIA DE ACTIVACIÓN DE OXÍGENO [↑ · ESPACIO · ↓ · ESPACIO]!',
    description: 'Abre válvula de O₂ (↑), presuriza cámara (Espacio), purga filtro CO₂ (↓) y asegura regulador a 4.3 PSI (Espacio).',
    lore: 'El sistema PLSS genera oxígeno puro al 100% regulado a una presión interna constante de 4.3 PSI (29.6 kPa) con autonomía de hasta 8 horas.',
    qte: {
      type: 'sequence',
      sequence: ['action-up', 'action-primary', 'action-down', 'action-primary'],
      durationMs: 7500,
      basePoints: 160,
      perfectBonus: 40,
    },
  },
];

/**
 * Mapeo descriptivo de iconos/etiquetas para cada acción disponible.
 */
export const ACTION_LABELS: Record<string, { key: string; label: string; icon: string }> = {
  'action-primary': { key: 'ESPACIO', label: 'Sellar / Acción', icon: '⎵' },
  'action-up': { key: '↑', label: 'Válvula Sup.', icon: '▲' },
  'action-down': { key: '↓', label: 'Pestillo Inf.', icon: '▼' },
  'action-left': { key: '←', label: 'Acople Izq.', icon: '◀' },
  'action-right': { key: '→', label: 'Acople Der.', icon: '▶' },
};

const SEQ_POOL = ['action-up', 'action-down', 'action-left', 'action-right', 'action-primary'] as const;
const QTE_TYPES: readonly QteType[] = ['timing', 'mash', 'sequence', 'hold'];

/**
 * Genera una secuencia aleatoria de montaje del traje espacial (orden, nº de pasos,
 * tipo de QTE y parámetros aleatorios) usando el PRNG indicado.
 */
export function generateRandomSuitSteps(rng: () => number = Math.random): SuitStep[] {
  const pool = [...DEFAULT_SUIT_STEPS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Varía entre 5 y 6 piezas por montaje + posible doble verificación final (hasta 7 pasos)
  const stepCount = 5 + Math.floor(rng() * 2); // 5 o 6 pasos base
  const selected = pool.slice(0, stepCount);
  const addFinalCheck = rng() < 0.45;
  if (addFinalCheck) {
    const base = pool[Math.floor(rng() * pool.length)];
    selected.push({
      ...base,
      id: `${base.id}-verify`,
      code: `${base.code}-CHK`,
      name: `Verificación Final · ${base.name}`,
    });
  }

  return selected.map((baseStep, idx) => {
    // Asegura variedad de mecánicas sin repetir exactamente la anterior cuando hay opciones
    const chosenType = QTE_TYPES[Math.floor(rng() * QTE_TYPES.length)];

    if (chosenType === 'timing') {
      const sweetWidth = 0.18 + rng() * 0.08;
      const sweetSpotStart = Math.round((0.18 + rng() * (0.76 - sweetWidth)) * 100) / 100;
      const sweetSpotEnd = Math.round((sweetSpotStart + sweetWidth) * 100) / 100;
      const sweepPeriodMs = 1050 + Math.floor(rng() * 450);
      return {
        ...baseStep,
        prompt: '¡PULSA ESPACIO JUSTO EN LA ZONA VERDE DE SELLADO!',
        description: 'Sincroniza el indicador móvil dentro del rango de acople estanco.',
        qte: {
          type: 'timing',
          actionId: 'action-primary',
          sweepPeriodMs,
          sweetSpotStart,
          sweetSpotEnd,
          perfectTolerance: 0.06,
          durationMs: 7000,
          basePoints: 120 + idx * 5,
          perfectBonus: 40,
        },
      };
    }

    if (chosenType === 'mash') {
      const targetCount = 6 + Math.floor(rng() * 10); // 6 a 15 pulsaciones aleatorias
      return {
        ...baseStep,
        prompt: `¡PULSA RÁPIDO ESPACIO O EL BOTÓN ${targetCount} VECES!`,
        description: `Presuriza el acople de ${baseStep.code} con ${targetCount} bombeos antes de que baje la presión.`,
        qte: {
          type: 'mash',
          actionId: 'action-primary',
          targetCount,
          leakRatePerSec: 0.35 + rng() * 0.35,
          durationMs: 7000,
          basePoints: 130 + idx * 5,
          perfectBonus: 35,
        },
      };
    }

    if (chosenType === 'hold') {
      const chargeDurationMs = 1250 + Math.floor(rng() * 600);
      const zoneWidth = 0.20 + rng() * 0.06;
      const targetMin = Math.round((0.46 + rng() * 0.24) * 100) / 100;
      const targetMax = Math.round((targetMin + zoneWidth) * 100) / 100;
      const mid = (targetMin + targetMax) / 2;
      return {
        ...baseStep,
        prompt: '¡MANTÉN PULSADO ESPACIO Y SUELTA EN LA ZONA VERDE!',
        description: 'Carga el sello neumático y suelta justo en la franja óptima.',
        qte: {
          type: 'hold',
          actionId: 'action-primary',
          chargeDurationMs,
          targetMin,
          targetMax,
          perfectMin: Math.round((mid - 0.04) * 100) / 100,
          perfectMax: Math.round((mid + 0.04) * 100) / 100,
          durationMs: 7000,
          basePoints: 135 + idx * 5,
          perfectBonus: 40,
        },
      };
    }

    // 'sequence': longitud y teclas aleatorias (3 a 5 teclas)
    const seqLen = 3 + Math.floor(rng() * 3);
    const sequence: string[] = [];
    for (let k = 0; k < seqLen; k++) {
      sequence.push(SEQ_POOL[Math.floor(rng() * SEQ_POOL.length)]);
    }
    const readable = sequence.map(a => ACTION_LABELS[a]?.key ?? a).join(' · ');
    return {
      ...baseStep,
      prompt: `¡INTRODUCE LA SECUENCIA [${readable}]!`,
      description: 'Pulsa las teclas en orden exacto para bloquear los seguros del traje.',
      qte: {
        type: 'sequence',
        sequence,
        durationMs: 8000,
        basePoints: 130 + idx * 5,
        perfectBonus: 35,
      },
    };
  });
}
