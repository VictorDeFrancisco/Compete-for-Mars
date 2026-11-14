import { defineMinigame } from './types';

export const solarStormDefinition = defineMinigame({
  id: 'solar-storm',
  title: 'Alerta DONKI: Tormentas de Radiación Solar',
  mode: 'score',
  durationMs: 60_000,
  maxScore: 1000,
  instructions:
    'Monitorea el clima espacial con la base de datos DONKI de la NASA (Space Weather Database of Notifications, Knowledge, Information). El tiempo de observación avanza a gran velocidad durante un ciclo de tormentas solares reales. Cuando DONKI alerte de una Llamarada Solar (rayos X), refugia al personal en el Búnker de Regolito (S o ↓). Cuando la onda de plasma de una Eyección de Masa Coronal (CME) impacte Marte, activa el Deflector Magnético (W o ↑) y repliega los Paneles Solares (A o ←). Tras el impacto, purga la Sobrecarga Iónica (D, → o Espacio) antes de que sature los condensadores.',
  objective:
    'Mitiga las erupciones solares reales de la NASA DONKI coordinando escudos magnéticos y búnkers para minimizar la dosis de radiación recibida.',
  controls: [
    {
      id: 'shield',
      label: 'Deflector Magnético',
      description: 'Genera una burbuja magnética toroidal que desvía la onda de plasma de la CME.',
      bindings: [
        { device: 'keyboard', code: 'KeyW', label: 'W' },
        { device: 'keyboard', code: 'ArrowUp', label: '↑' },
        { device: 'touch', label: '▲ Escudo Magnético' },
      ],
    },
    {
      id: 'shelter',
      label: 'Búnker de Regolito',
      description: 'Envía a la tripulación al refugio bajo tierra contra el destello de rayos X de la llamarada.',
      bindings: [
        { device: 'keyboard', code: 'KeyS', label: 'S' },
        { device: 'keyboard', code: 'ArrowDown', label: '↓' },
        { device: 'touch', label: '▼ Búnker Subterráneo' },
      ],
    },
    {
      id: 'panels',
      label: 'Proteger Paneles',
      description: 'Pliega los paneles fotovoltaicos para evitar que las partículas de alta energía fundan las celdas.',
      bindings: [
        { device: 'keyboard', code: 'KeyA', label: 'A' },
        { device: 'keyboard', code: 'ArrowLeft', label: '←' },
        { device: 'touch', label: '◀ Proteger Paneles' },
      ],
    },
    {
      id: 'purge',
      label: 'Disipar Sobrecarga Iónica',
      description: 'Purga la carga electrostática residual acumulada en los caloductos del escudo.',
      bindings: [
        { device: 'keyboard', code: 'KeyD', label: 'D' },
        { device: 'keyboard', code: 'ArrowRight', label: '→' },
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'touch', label: '▶ Disipar Sobrecarga' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20, radiation: -10 } },
    loser: { health: -15, resources: { radiation: 25 } },
    ties: 'share',
  },
});
