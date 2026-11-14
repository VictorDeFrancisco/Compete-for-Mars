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
| `playing` | Todos envían resultado o termina el plazo más 1,5 s de recepción | Quien no envía: 0 puntos, 0 progreso y timeout |

Se usan plazos absolutos (`deadline`) y una referencia de tiempo del servidor (`serverNow`). Los botones pueden adelantar las fases cuando todos han terminado. Cada transición crea un `phaseId` nuevo: enviar el que figure en `game.phaseId`. Las acciones antiguas, duplicadas o fuera de fase se rechazan.

## Pantallas que os podéis repartir

| Tarea | Archivo y CSS propio | Props públicas |
|---|---|---|
| Fase 2 | `client/src/phases/MinigamePresentation.tsx` | `PresentationProps`: `game`, `onReady()` |
| Fase 3 | `client/src/phases/CardSelection.tsx` | `CardSelectionProps`: `game`, `onChoose(cardId)` |
| Fase 4 | `client/src/phases/PlayMinigame.tsx` | `MinigameProps`: `game`, `onSubmit(result)` |

`App.tsx` conecta estas callbacks al Socket. Las pantallas no importan Socket.io ni modifican `game`: muestran la instantánea y llaman a su callback. Cartas utiliza `onChoose(cardId, targetId?)` para las acciones dirigidas. Los estilos propios deben usar la clase raíz de su fase para no afectar a otras pantallas. La fase 4 monta el wrapper común de `src/minigames/`. Consultar [la API de minijuegos](MINIJUEGOS.md) antes de crear un juego.

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
| `card:choose` | `{ phaseId, cardId, targetId? }`; cartas; el servidor valida carta ofrecida, coste y objetivo vivo |
| `minigame:submit` | `{ phaseId, result }`; resultado estructurado del minijuego |

El servidor envía `game:state` después de cada cambio relevante. Un desconectado conserva la plaza; en fases con tiempo no puede bloquear la ronda. En lobby el anfitrión puede retirar su plaza. Si se desconecta el anfitrión, se transfiere el control a otro humano conectado. Las salas sin humanos conectados se limpian tras un periodo de inactividad.

## Reglas provisionales, no diseño definitivo

- Estadísticas: 30 puntos entre energía, comida y vida, según las profesiones. Cada valor inicial y máximo es 100 más su bonificación de profesión. Se elimina el atributo blindaje conforme a `main`.
- Comida y energía se limitan al máximo de cada profesión; la fase del minijuego los convierte al contexto local 0–10. Radiación inicial: 0, sin límite superior.
- Tres cartas distintas por ronda procedentes de `server/data/boardSlots.json`, con resolución simultánea, objetivos, conflictos, azar y protecciones. Ver [reglas y valores provisionales de cartas](CARTAS.md).
- Catálogo de minijuegos en `shared/minigames/catalog.ts`, con modo, controles, presentación y recompensas declarativas.
- Prueba por puntos y carrera de secuencia como ejemplos; la clase base termina automáticamente al vencer el tiempo y el wrapper envía el resultado.
- El servidor clasifica según puntos o tiempo/progreso, y aplica premio de recursos al ganador y daño al perdedor según cada definición. Los puestos intermedios son neutrales. Los empates y la prueba individual están descritos en `MINIJUEGOS.md`.
- La vida queda entre 0 y el máximo de profesión. Al final de cada ronda la radiación quita 5 de vida por unidad, salvo protección de traje. A 0 de vida se pasa a observador. En multijugador gana el último superviviente; si todos mueren al final del minijuego, se conserva el desempate de `main` por clasificación. `GameView.matchFinished` y `winnerId` comunican el final; la elección, el objetivo, `protection` y `cardOutcome` solo aparecen en `self`. Comida y energía se entregan al minijuego mediante un contexto inmutable, con modificadores comunes; cada implementación aplica sus desventajas (ver MINIJUEGOS.md).
- Se conservan las reglas de supervivencia de `main`: gasto fijo de 5 de comida y 5 de energía, premio inicial de 20 del recurso principal con reducción de 2 por ronda posterior, daño del último de `ronda × (muertes previas + 1)` y 10 de daño por cada reserva vacía. El sorteo evita repetir minijuego sin al menos dos intermedios.
- El resultado se comunica desde el cliente: el servidor valida ID, coherencia, límites, fase y entrega única, pero esto todavía no es un sistema contra trampas.

La base permite organizar las tareas; no fija el lore ni sustituye las ideas de `Ideas.txt`.
