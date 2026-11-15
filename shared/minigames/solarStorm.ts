import { defineMinigame } from './types';

export const solarStormDefinition = defineMinigame({
  id: 'solar-storm',
  title: 'Alerta DONKI: Deflector de Tormentas Solares',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'La base de datos real NASA DONKI registra llamaradas solares y eyecciones de masa coronal (CME) dirigidas hacia tu cúpula en Marte. Orienta el Escudo Magnético entre 115° y 245° con A/D, las flechas o moviendo el ratón/dedo sobre el domo para interceptar cada onda antes de que impacte (bloquear en el centro exacto activa un Parry Crítico con +50 pts extra). Atrapa también las bolas verdes que caen para curar +12% de vida de la base (+50 pts), y mantén Espacio, W o ↑ para ensanchar el escudo a 48° ante ráfagas múltiples.',
  objective:
    'Intercepta las ondas solares de NASA DONKI (+100 pts), encadena Parrys Críticos y recoge bolas verdes para curar la integridad de la base.',
  controls: [
    {
      id: 'turn-left',
      label: 'Girar Escudo Izquierda',
      description: 'Desplaza el deflector magnético hacia el sector izquierdo del domo (115°–245°).',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'pointer', button: 0, label: 'Apuntar sobre el domo' },
      ],
    },
    {
      id: 'turn-right',
      label: 'Girar Escudo Derecha',
      description: 'Desplaza el deflector magnético hacia el sector derecho del domo.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'pointer', button: 0, label: 'Arrastrar en el domo' },
      ],
    },
    {
      id: 'boost',
      label: 'Super-Escudo (48°)',
      description: 'Mantén pulsado para duplicar la cobertura del escudo de 24° a 48° consumiendo potencia.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20, radiation: -10 } },
    loser: { health: -15, resources: { radiation: 25 } },
    ties: 'share',
  },
});
