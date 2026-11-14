# Contrato de la base jugable

Los tipos compartidos están en `shared/types.ts` y las duraciones en `shared/constants.ts`. Coordinar cambios en estos archivos con el responsable de integración.

## Ciclo

```text
0. Estadísticas (local, antes de entrar en sala)
   ↓ crear/unirse; el servidor valida nombre y estadísticas
1. Lobby → 2. Presentación → 3. Cartas → 4. Minijuego → 1. Lobby → …
```

El servidor posee el estado de cada sala. El frontend solo solicita acciones. El lobby no avanza automáticamente: todos los humanos se marcan listos y el anfitrión inicia la siguiente ronda. Se admite un jugador solo, hasta cuatro jugadores o completar plazas con bots.

| Fase del servidor | Termina cuando | Al vencer el tiempo |
|---|---|---|
| `lobby` | El anfitrión inicia y todos están conectados/listos | Sin temporizador |
| `presentation` | Todos confirman o pasan 15 s | Va a cartas |
| `cards` | Todos eligen o pasan 25 s | Quien no elige recibe Descansar |
| `playing` | Todos envían resultado o termina la duración del minijuego | Quien no envía puntúa 0 |

Se usan plazos absolutos (`deadline`) y una referencia de tiempo del servidor (`serverNow`). Los botones pueden adelantar las fases cuando todos han terminado. Cada transición crea un `phaseId` nuevo: enviar el que figure en `game.phaseId`. Las acciones antiguas, duplicadas o fuera de fase se rechazan.

## Pantallas que os podéis repartir

| Tarea | Archivo y CSS propio | Props públicas |
|---|---|---|
| Fase 2 | `client/src/phases/MinigamePresentation.tsx` | `PresentationProps`: `game`, `onReady()` |
| Fase 3 | `client/src/phases/CardSelection.tsx` | `CardSelectionProps`: `game`, `onChoose(cardId)` |
| Fase 4 | `client/src/phases/PlayMinigame.tsx` | `MinigameProps`: `game`, `onSubmit(score)` |

`App.tsx` conecta estas callbacks al Socket. Las pantallas no importan Socket.io ni modifican `game`: muestran la instantánea y llaman a su callback. Los estilos propios deben usar la clase raíz de su fase para no afectar a otras pantallas. Los futuros minijuegos de `src/minigames/` se montarán dentro de la fase 4.

## Qué recibe cada navegador

- `game.players`: nombre, vida, conexión y señales públicas de quién está listo/ha elegido/ha terminado.
- `game.self`: además, estadísticas, recursos, carta elegida y puntuación propios.
- `game.minigame`, `game.cards`: contenido de la ronda.
- `game.lastResults`: resultados públicos de la ronda anterior, visibles en el lobby.

Los tokens de reconexión, socket IDs y los recursos o cartas ajenos no salen en estas vistas. Un token aleatorio en `sessionStorage` permite recuperar el jugador al recargar la misma pestaña. Para simular jugadores distintos, abrir pestañas nuevas independientes o ventanas privadas; duplicar una pestaña puede copiar su sesión. Si el servidor se reinicia, las salas desaparecen.

## Eventos

Todos reciben una callback de respuesta `{ ok, error? }`. `shared/types.ts` contiene las firmas exactas.

| Cliente → servidor | Datos |
|---|---|
| `room:create` | `{ name, stats }` |
| `room:join` | `{ name, stats, code }` |
| `room:leave` | Sin datos |
| `room:add-bots` | Sin datos; anfitrión en lobby |
| `room:remove-player` | ID de bot o desconectado; anfitrión en lobby |
| `player:ready` | Booleano; lobby |
| `game:start` | Sin datos; anfitrión |
| `phase:ready` | `{ phaseId }`; presentación |
| `card:choose` | `{ phaseId, cardId }`; cartas |
| `minigame:submit` | `{ phaseId, score }`; minijuego |

El servidor envía `game:state` después de cada cambio relevante. Un desconectado conserva la plaza; en fases con tiempo no puede bloquear la ronda. En lobby el anfitrión puede retirar su plaza. Si se desconecta el anfitrión, se transfiere el control a otro humano conectado. Las salas sin humanos conectados se limpian tras un periodo de inactividad.

## Reglas provisionales, no diseño definitivo

- Estadísticas: repartir 6 puntos enteros entre energía, comida y blindaje, de 0 a 4 por atributo. Blindaje todavía no tiene efecto.
- Energía/comida iniciales: `4 + atributo`. Recursos limitados entre 0 y 10.
- Tres cartas de prueba en `server/data/boardSlots.json`, sin cupos ni conflictos todavía.
- Prueba de pulsaciones: 20 pulsaciones equivalen a 100 puntos. Enviar manualmente antes del plazo. El tiempo solo limita la entrega; las últimas pulsaciones sin enviar no se guardan.
- Puntuación entera de 0 a 100. Resultado ≥ 50: +5 de vida; resultado < 50: −5. La vida queda entre 1 y 100: sin eliminación ni condición de victoria por ahora.
- Al volver al lobby: −1 energía y −1 comida. Radiación todavía no provoca daño ni filtros. Los recursos no modifican todavía la dificultad.
- La puntuación del minijuego se comunica desde el cliente: el servidor valida rango, fase y entrega única, pero esto todavía no es un sistema contra trampas.

La base permite organizar las tareas; no fija el lore ni sustituye las ideas de `Ideas.txt`.
