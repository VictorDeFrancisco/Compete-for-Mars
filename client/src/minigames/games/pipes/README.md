# Circuito de agua

Interfaz a pantalla completa con paisaje lunar vectorial, título sin barra decorativa y marcos rectos. Los PNG se muestran sin filtros, brillos ni capas superpuestas. Solo aparecen los astronautas de los jugadores presentes. El laboratorio permite volver y reiniciar al terminar. La fase de partida proporciona los nombres y el estado público de los jugadores a través de `PipesSceneProvider`; los rivales aparecen jugando o terminados, sin inventar puntuaciones que el servidor no publica. No requiere cambios de servidor.

Prueba local: `pnpm dev:client` y abrir `http://localhost:5173/?minigame=pipes`.

- Clic/toque en una pieza para girarla 90°; también Tab y Enter/Espacio.
- Conectar la entrada azul del borde izquierdo con la salida dorada del derecho.
- El agua avanza solo por conexiones recíprocas. Las ramas abiertas no impiden ganar y no es necesario usar todas las piezas.
- Cada circuito suma 100 puntos. Se muestra la conexión durante 650 ms antes de generar otra semilla; el reloj continúa durante la transición.
- La partida completa dura 60 segundos, sin tiempo adicional por resolver tableros.
- Energía y comida bajas aplican la cadencia de `BaseMinigame.tryAction()`; no modifican los recursos globales.

`board.ts` genera primero un camino válido, rellena el resto y mezcla orientaciones. Conserva una solución para las pruebas; la instancia solo guarda el tablero mezclado. Su semilla interna permite reproducirlo con `generateBoard(seed)` y no aparece en pantalla.

Las ocho texturas originales están en `assets/`. El fondo blanco de la pieza recta vacía se oculta con un recorte CSS; los PNG originales no se han alterado.

Validación desde la raíz:

```sh
pnpm build
pnpm test
pnpm exec tsx --test client/src/minigames/games/pipes/PipesEngine.test.ts
```

La suite específica comprueba 2.000 semillas, reciprocidad de conexiones, ausencia de saltos entre bordes, puntuación única, transición, timeout, recursos bajos y reinicio. El patrón de `pnpm test` del proyecto todavía no incluye las carpetas de juegos, por eso se ejecuta además el último comando.
