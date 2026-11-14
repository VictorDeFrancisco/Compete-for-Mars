import { defineMinigame } from './types';

export const anomaliesDefinition = defineMinigame({
  id: 'anomalies', title: 'Detección de anomalías', mode: 'score', durationMs: 60_000, maxScore: 10_000,
  instructions: 'Compara los dos circuitos dibujados y marca las 3 piezas que son distintas: interruptores, pilotos, resistencias, fusibles, diodos y otros componentes. Puedes pulsar en cualquiera de los dos circuitos: cada pareja cuenta una vez. Cada acierto suma 10 puntos; encontrar las tres diferencias añade 30 y abre otro panel sin reiniciar el minuto. Un error resta 10 puntos y bloquea todas las selecciones durante 3 segundos mientras el reloj sigue corriendo. La energía y la comida bajas ralentizan la cadencia de selección.',
  objective: 'Detecta tantas anomalías como puedas durante un minuto.',
  controls: [{
    id: 'inspect', label: 'Marcar componente', description: 'Clic o toque sobre una pieza del circuito. Con teclado, usa Tab y Enter o Espacio.',
    bindings: [{ device: 'pointer', button: 0, label: 'Clic sobre un componente' }, { device: 'touch', label: 'Tocar un componente' }],
  }],
  rewards: { winner: { resources: { energy: 20 } }, loser: {}, ties: 'share' },
});
