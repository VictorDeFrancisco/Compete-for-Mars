# Crear minijuegos independientes

Cada minijuego tiene una definición compartida, una clase local que extiende `BaseMinigame` y una vista React. La vista puede contener HTML, Canvas o Three.js. No debe conocer Socket.io, las salas ni los recursos globales.

Ya hay dos ejemplos completos para copiar: `games/pulse/` (puntos por tiempo) y `games/sequence-race/` (carrera). Los modelos y el aspecto visual pueden añadirse después.

## Probar sin servidor

```bash
pnpm install --frozen-lockfile
pnpm dev:client
```

Abrir http://localhost:5173/?minigame=pulse o http://localhost:5173/?minigame=sequence-race.

El laboratorio muestra presentación, controles, premios, un selector de juego y duración de prueba. Permite iniciar/reiniciar y muestra el JSON final. No conecta con el servidor. El botón de reinicio crea una instancia nueva y limpia la anterior.

Para probar la integración de sala: `pnpm dev`, abrir la raíz y crear sala con bots. Se alternan los dos ejemplos por ronda. La presentación se genera automáticamente; en la fase 4 el resultado se envía automáticamente una sola vez. No hay que programar pantallas de instrucciones para cada juego.

## Archivos y propiedad

```text
shared/minigames/
  types.ts                    Contratos serializables
  Controls.ts                 Clase común de controles
  pulse.ts                    Definición del ejemplo por puntos
  sequenceRace.ts             Definición del ejemplo de carrera
  catalog.ts                  Catálogo compartido
  ranking.ts                  Comparación y validación usadas por el servidor
client/src/minigames/
  core/BaseMinigame.ts         Lógica común, sin React ni red
  core/module.ts              Conexión tipada entre clase y vista
  games/pulse/PulseGame.tsx
  games/sequence-race/SequenceRaceGame.tsx
  registry.ts                 Registro de implementaciones locales
  MinigameWrapper.tsx          Reloj, teclado, ejecución y recogida del resultado
  MinigameInfo.tsx             Presentación automática
  MinigameLab.tsx              Laboratorio sin servidor
```

Cada persona crea su carpeta de juego y su archivo de definición. Coordinar únicamente las altas en `catalog.ts` y `registry.ts`. No hay que editar `App.tsx`, las fases, el servidor ni los tipos comunes para añadir un juego que siga este contrato.

## 1. Declarar el minijuego

Crear `shared/minigames/miJuego.ts`, exportando una definición con `defineMinigame(...)`. Copiar una de las existentes y cambiar:

- `id`: único y estable, por ejemplo `repair-cables`.
- `title`, `instructions`, `objective`: texto que aparecerá en la presentación.
- `mode`: `score` para más puntos, o `race` para terminar antes.
- `durationMs`: límite de tiempo, entre 1 y 600 segundos.
- `maxScore`: máximo entero que puede declarar el juego. No es obligatorio normalizar a 100.
- `controls`: acciones, descripción y entradas alternativas de teclado, ratón o táctil.
- `rewards`: cambios que aplica el servidor al ganador y al perdedor, y política de empate.

Ejemplo de recompensas:

```ts
rewards: {
  winner: { resources: { energy: 2, food: 1 } },
  loser: { health: -10 },
  ties: 'share',
}
```

Los nombres de recursos son `energy`, `food` y `radiation`. Los cambios pueden ser positivos o negativos. Se respetan los límites globales de recursos 0–10 y vida 1–100. Todavía no hay eliminación. Los premios no los decide el navegador y no se incluyen en el resultado enviado.

## 2. Crear la clase y la vista

Ejemplo mínimo; sustituir la importación de la definición por la de vuestro archivo:

```tsx
import { BaseMinigame, type ActionState } from '../../core/BaseMinigame';
import { defineModule, type MinigameViewProps } from '../../core/module';
import { miDefinicion } from '../../../../../shared/minigames/miJuego';

class MiJuego extends BaseMinigame<{ aciertos: number }> {
  protected onAction(actionId: string, state: ActionState) {
    if (actionId !== 'acertar' || state !== 'press') return;
    const aciertos = this.getSnapshot().data.aciertos + 1;
    this.setData({ aciertos });
    this.addScore(10);
    this.setProgress(aciertos / 10);
    // Solo en una carrera cuyo objetivo sea alcanzar 10 aciertos:
    if (this.definition.mode === 'race' && aciertos >= 10) this.complete();
  }
}

function Vista({ engine, snapshot }: MinigameViewProps<{ aciertos: number }>) {
  return <button disabled={snapshot.status !== 'running'}
    onClick={() => engine.dispatch('acertar')}>
    Aciertos: {snapshot.data.aciertos}
  </button>;
}

export default defineModule(miDefinicion,
  definition => new MiJuego(definition, { aciertos: 0 }), Vista);
```

La acción `acertar` debe estar declarada en `controls`. Para juegos con movimiento continuo, usar `onAction` para registrar teclas pulsadas/soltadas y `onUpdate(deltaMs)` para mover elementos. `deltaMs` está expresado en milisegundos. Actualizar el estado propio con objetos nuevos; no mutar `snapshot.data`.

El wrapper traduce automáticamente las teclas declaradas cuando el foco está dentro del minijuego e ignora repeticiones automáticas. Para interacciones de ratón o táctiles, conectar los elementos de la vista a `engine.dispatch(...)`; así no se captura cualquier clic indiscriminadamente. `Controls.forPointer()` ayuda a mapear botones de ratón si se usa un Canvas.

## 3. Registrar

1. Añadir la definición al array de `shared/minigames/catalog.ts`.
2. Añadir el módulo local al array de `client/src/minigames/registry.ts`.
3. Abrir `/?minigame=vuestro-id`.

Los dos registros deben tener el mismo ID. El servidor solo importa el catálogo: nunca ejecuta las clases locales ni importa React o Three.js. Las carpetas antiguas con componentes vacíos pueden sustituirse o reutilizarse dentro de la nueva vista.

## API completa de BaseMinigame

Constructor: `new MiJuego(definition, initialData, clock?)`. El reloj opcional permite pruebas deterministas. Si la subclase declara su constructor, debe llamar a `super(...)`.

| Método público | Uso |
|---|---|
| `start(initialElapsedMs = 0)` | Inicia una instancia una sola vez. El wrapper lo invoca. El desfase inicial conserva el tiempo consumido de una ronda online. |
| `tick()` | Actualiza reloj y llama a `onUpdate`. Al llegar al límite termina con timeout. El wrapper lo invoca. |
| `dispatch(actionId, state = 'press')` | Ejecuta una acción declarada. `state` puede ser `press` o `release`. Fuera de la partida activa no tiene efecto. |
| `complete()` | Termina con éxito, fija progreso a 1 y registra tiempo. Usarlo al llegar a meta. |
| `fail()` | Termina por fallo, conservando puntos y progreso. |
| `abort()` | Aborta el intento local. No se admite como resultado online; al salir de una sala actúa su lógica de desconexión. |
| `getSnapshot()` | Estado actual: `status`, `score`, `progress`, `elapsedMs`, `remainingMs`, `data`, `result`. Tratarlo como solo lectura. |
| `getResult()` | Resultado final o `null` si no hay ninguno. |
| `subscribe(listener)` | Escucha cambios y devuelve una función de desuscripción. El wrapper usa esta API para React. |
| `dispose()` | Limpia la instancia y sus suscripciones. Idempotente. No envía un resultado al desmontar. |

Propiedades públicas de solo lectura: `definition` y `controls`.

| Método protegido | Uso desde la subclase |
|---|---|
| `setScore(score)` | Establece puntos enteros, limitados a 0–maxScore. |
| `addScore(points)` | Suma o resta puntos respetando esos límites. |
| `setProgress(progress)` | Progreso entre 0 y 1; permite comparar carreras sin terminar. |
| `setData(data)` | Sustituye el estado propio que recibe la vista. |
| `onStart()` | Hook opcional de inicialización al comenzar. |
| `onUpdate(deltaMs)` | Hook opcional de actualización; movimiento, temporizadores propios, etc. |
| `onAction(actionId, state)` | Hook obligatorio para acciones del jugador. |
| `onFinish(result)` | Hook opcional tras terminar. No enviar sockets aquí. |
| `onDispose()` | Hook opcional para limpiar recursos propios: Canvas, Three.js, audio, etc. |

No hay pausa de competición: el plazo continúa si se cambia de pestaña. Para reiniciar, crear otra instancia. Solo puede generarse un resultado por intento; llamar varias veces a complete/fail/abort no lo modifica.

## API completa de Controls

Constructor: `new Controls(definition.controls)`.

| Método | Resultado |
|---|---|
| `getActions()` | Lista de acciones declaradas. |
| `getAction(id)` | Una acción o `undefined`. |
| `hasAction(id)` | Si existe una acción. |
| `forKey(code)` | IDs asociados al `KeyboardEvent.code`, por ejemplo `Space` o `Digit1`. |
| `forPointer(button)` | IDs asociados al botón de ratón, por ejemplo 0 para izquierdo. |
| `describe()` | Lista de textos de controles para la presentación automática. |

Una acción puede declarar varias entradas alternativas. Esta clase describe y consulta controles; no instala listeners ni provoca acciones por sí misma.

## Resultado enviado y clasificación

```ts
interface MinigameResult {
  minigameId: string;
  score: number;
  elapsedMs: number;
  progress: number;   // 0..1
  completed: boolean;
  reason: 'completed' | 'timeout' | 'failed' | 'aborted';
}
```

En sala se envía `{ phaseId, result }` por `minigame:submit`. El wrapper construye el resultado; cada desarrollador solo actualiza puntos/progreso y llama a complete o fail cuando corresponda. Un juego por puntos puede dejar que el tiempo lo termine automáticamente.

El servidor valida formato, ID, límites, fase y entrega única; compara y aplica recompensas una sola vez:

- **Puntos:** más puntos gana; menos puntos pierde. El tiempo no rompe empates.
- **Carrera:** quienes completan van antes que quienes no. Entre quienes terminan, menor tiempo gana. Entre quienes no terminan, mayor progreso, y después mayor puntuación.
- **Puestos intermedios:** no reciben cambios por clasificación.
- **Empate parcial, `share`:** todos los empatados en mejor puesto reciben el premio; todos los del peor, la penalización.
- **Empate parcial, `no-award`:** un puesto compartido no aplica su premio o penalización. Un extremo sin empate sí se aplica.
- **Todos empatados o un único participante:** resultado `draw`, sin premio ni penalización.
- **Sin envío:** resultado por defecto de 0 puntos, 0 progreso y timeout. El servidor espera 1,5 s tras el plazo visible para recibir resultados que viajan por la red; ese margen no añade tiempo al juego local.

Los resultados del cliente son de confianza para esta demo: esto no prueba contra trampas que realmente se haya jugado. Los bots también generan resultados sintéticos de demostración. Recargar una prueba online conserva el tiempo consumido pero reinicia el progreso local que todavía no se haya enviado.

Ya no se aplica el antiguo umbral de 50 puntos ni el consumo fijo de energía/comida al terminar: el resultado aplica las recompensas específicas del minijuego. Los límites globales pueden reducir el cambio efectivo si un recurso está al máximo.

## Verificación antes de integrar

```bash
pnpm build
pnpm test
```

Probar también teclado y clic/toque, expiración, terminar antes, reiniciar y salir de la pantalla. Para lógica compleja, añadir una prueba de la clase con reloj simulado como las de `core/BaseMinigame.test.ts`. La clase no debe necesitar DOM, servidor ni React para ejecutar su lógica.
