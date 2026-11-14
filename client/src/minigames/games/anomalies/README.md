# Detección de anomalías

Prueba: arrancar `pnpm dev:client` y abrir `http://localhost:5173/?minigame=anomalies`.

Dos paneles muestran un esquema eléctrico completo. Hay cuatro trazados diferentes: distribución con filtro, ramales en paralelo, doble malla con fuente central y circuito con derivaciones escalonadas. Cada uno puede reflejarse horizontalmente. Las 12 piezas están conectadas por sus dos terminales, con uniones marcadas y orientación horizontal o vertical según su función. La semilla decide el trazado, los estados, las tres diferencias y la orientación. Exactamente 3 piezas cambian de aspecto entre el original y el circuito a revisar; el cableado, las posiciones y las etiquetas son idénticos dentro de esa pareja. El condensador usa el símbolo clásico de dos placas paralelas; una placa cortada es su estado de anomalía. El LED tiene cúpula y patillas, el diodo una banda y la batería sus polos. Los símbolos son ilustrativos: no se simula eléctricamente el circuito.

Se pulsa directamente sobre la pieza del dibujo en cualquiera de los paneles, con clic/toque o Tab y Enter/Espacio. Una pareja ya encontrada cuenta solo una vez y queda marcada en ambos lados. Cada acierto suma 10 puntos y completar el circuito añade 30: 60 puntos por circuito perfecto. Los errores restan 10 (mínimo total de 0) y bloquean todas las selecciones durante 3 segundos, con cuenta atrás visible. El reloj de la partida sigue corriendo durante el bloqueo; pulsar mientras dura no lo alarga.

Al encontrar las tres diferencias se muestra el resultado durante 650 ms y se genera otro panel. El nuevo trazado siempre es distinto al anterior, aunque el generador aleatorio repita una semilla. Se ajusta la semilla en ese caso, conservando la reproducción determinista mediante `generateCircuit(seed)`. El reloj sigue corriendo durante esa transición y la partida completa dura 60 segundos. La clase base gestiona el timeout y el resultado; el servidor conserva la clasificación y los premios. Reiniciar el laboratorio crea una instancia independiente.

El contexto de recursos se reenvía a `BaseMinigame`. `tryAction()` aplica la cadencia de energía y comida, hasta 400 ms con 0/0; con 10/10 no hay retraso. La radiación no cambia la generación ni los valores correctos.

## Archivos

- `circuit.ts`: generador determinista con 9 tipos de componentes, estados gráficos y selección de 3 diferencias sin repetición. `generateCircuit(seed)` reproduce un circuito; la semilla no aparece en la interfaz.
- `layouts.ts`: cuatro esquemas completos con conexiones y posiciones propias. Las uniones se deducen de los ramales del trazado.
- `CircuitDiagram.tsx`: dibujo SVG de las conexiones y componentes, con zonas de selección sobre cada pieza y teclado. Cada estado de cada símbolo produce un dibujo diferente. La vista memorizada evita redibujar los circuitos por cada actualización del reloj.
- `AnomaliesEngine.ts`: puntuación, selección, errores, transiciones y contexto de recursos, sin DOM ni red.
- `AnomaliesGame.tsx` / `anomalies.css`: vista y estilos locales. La regla `:has(> .anomaly-game)` oculta los indicadores duplicados del contenedor únicamente para este juego; no se modifica el contenedor compartido. En `.phase-playing` una sola barra reúne reloj, puntos y progreso. Se ocultan la cabecera repetida y el pie secundario y se reducen los márgenes de la consola solo cuando contiene anomalías, reservando la mayor altura posible para ambos circuitos sin deformarlos.
- Definición: `shared/minigames/anomalies.ts`; ID: `anomalies`.

Además de estos archivos solo se añaden las dos entradas necesarias en los registros de minijuegos. No se modifica lógica del servidor, fases, cartas, otros juegos ni dependencias.

Validación desde la raíz:

```sh
pnpm build
pnpm test
pnpm exec tsx --test client/src/minigames/games/anomalies/AnomaliesEngine.test.ts client/src/minigames/games/anomalies/CircuitDiagram.test.tsx
```

Las pruebas específicas comprueban 2.000 semillas, exactamente 3 diferencias visibles, reproducción, aciertos únicos, penalizaciones, cadencia con recursos bajos, cambio de panel, reinicio y límite de un minuto. Verifican también la conectividad y los terminales de todos los trazados, que las piezas no se solapan ni quedan atravesadas por cables, y que cada tablero cambia de forma. También comprueban los dos dibujos de cada componente y los controles accesibles sobre las piezas.
