import { defineMinigame } from './types';

export const triviaDefinition = defineMinigame({
  id: 'trivia',
  title: 'Misión Trivia NASA',
  mode: 'score',
  durationMs: 180_000,
  maxScore: 100,
  instructions:
    'Responde a 5 preguntas aleatorias de supervivencia espacial (hasta 30 s por pregunta; poca energía reduce el tiempo y poca comida reduce los puntos) sobre soporte vital, radiación, energía y cultivos. Pulsa 1–4 o haz clic en una opción y confirma con Espacio, Enter o Siguiente.',
  objective: 'Consigue 20 puntos por cada respuesta correcta. Quien logre más puntuación al terminar las 5 preguntas o agotarse el tiempo gana.',
  controls: [
    ...Array.from({ length: 4 }, (_, index) => ({
      id: `answer-${index + 1}`,
      label: `Opción ${index + 1}`,
      description: `Selecciona la respuesta ${index + 1}.`,
      bindings: [
        { device: 'keyboard' as const, code: `Digit${index + 1}`, label: `${index + 1}` },
        { device: 'pointer' as const, button: 0, label: `Clic en opción ${index + 1}` },
      ],
    })),
    {
      id: 'next',
      label: 'Siguiente pregunta',
      description: 'Avanza inmediatamente tras ver la explicación científica.',
      bindings: [
        { device: 'keyboard', code: 'Space', label: 'Espacio' },
        { device: 'keyboard', code: 'Enter', label: 'Enter' },
        { device: 'pointer', button: 0, label: 'Botón Siguiente' },
      ],
    },
  ],
  rewards: {
    winner: { resources: { energy: 20 } },
    loser: {},
    ties: 'share',
  },
});
