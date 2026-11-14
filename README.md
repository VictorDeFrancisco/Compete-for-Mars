# Another Planet
Another Planet es el juego hecho para el reto Build a Junior Astronaut Mission Trainer de la Nasa Space Apps Challenge de 2026 en Zaragoza. Los autores son Lucía Hernando, Diego Gómez, Gabriel Sanjuan, Víctor de Francisco y Didac Medal; del equipo C-Moon Dynamics.

## Arranque rápido

Requisitos: Node.js 24 (la versión usada para verificar esta base) y pnpm 11.25.0. Si falta pnpm, instalarlo con `npm install --global pnpm@11.25.0`.

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abrir http://localhost:5173. El cliente Vite usa el puerto 5173 y el servidor el 3001; Vite redirige `/socket.io` y `/api` al servidor. Ambos procesos se detienen con Ctrl+C. También se pueden arrancar por separado con `pnpm dev:client` y `pnpm dev:server`.

## Qué funciona

```text
0. Elegir estadísticas → crear/unirse a una sala
1. Lobby → 2. Presentación → 3. Elegir cartas → 4. Minijuego → 1. Lobby → …
```

Salas con código, entre uno y cuatro jugadores, bots para completar plazas, estado autoritativo del servidor, elecciones privadas, plazos y resultados. Las estadísticas se validan al entrar en la sala. El anfitrión inicia cada ronda cuando todos están listos.

Para probar solo: poner nombre, continuar, crear sala, completar con bots, marcarse listo e iniciar. Pulsar Entendido en la presentación, elegir una carta, activar el panel y enviar el resultado. Al acabar se vuelve al lobby para la siguiente ronda.

Para probar multijugador: abrir otra pestaña independiente o una ventana privada y unirse con el código. Para probar desde otro dispositivo de la misma red, usar la URL Network que muestra Vite y permitir el puerto 5173 en el firewall local si es necesario. No hace falta introducir la dirección del backend en el cliente.

La misma pestaña recupera su jugador tras una recarga o reconexión. Las partidas se guardan en RAM: reiniciar el servidor (también por una edición con `tsx watch`) borra las salas. El contenido y el equilibrio son provisionales; no hay eliminación, victoria, 3D ni filtros de radiación implementados todavía.

## Repartir el frontend

| Fase | Archivo principal | Contrato |
|---|---|---|
| 2 · Presentación | `client/src/phases/MinigamePresentation.tsx` y su CSS | `game`, `onReady()` |
| 3 · Cartas | `client/src/phases/CardSelection.tsx` y su CSS | `game`, `onChoose(cardId)` |
| 4 · Minijuego | `client/src/phases/PlayMinigame.tsx` y su CSS | `game`, `onSubmit(score)` |

Cada persona puede cambiar la presentación de su fase conservando estas props. `App.tsx` y los hooks ya gestionan la comunicación. Los componentes originales de `src/minigames/` y `BaseBoard`, `NightSummary`, etc. que no usa esta demo siguen disponibles como plantillas para futuras tareas.

- [Contrato y reglas provisionales](docs/CONTRATO.md)
- [Ramas, reparto y Pull Requests](docs/TRABAJO_EN_EQUIPO.md)
- [Instrucciones para las IA](AGENTS.md)
- [Enunciado e ideas originales](Ideas.txt)

## Comprobaciones y versión compilada

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`build` genera el cliente en `client/dist` y el servidor en `dist/server`. `start` sirve ambos bajo una sola URL, http://localhost:3001. Se puede configurar el puerto mediante la variable de entorno `PORT`. Instalar las dependencias de producción en el servidor sigue siendo necesario; el despliegue en Google Cloud queda pendiente.

Las pruebas cubren validación de estadísticas, permisos del anfitrión, privacidad, ciclo, plazos, acciones duplicadas y reconexión con clientes Socket.io reales. Usan un puerto local libre, sin depender del servidor de desarrollo.

## Organización

`shared/` contiene tipos y constantes; `server/gameEngine.ts` las transiciones; `server/index.ts` las salas y los eventos; `server/bots.ts` los bots; `server/data/` las cartas y definiciones de minijuegos. `client/src/phases/` contiene las pantallas que os podéis repartir.

El responsable de integración coordina cambios en `shared/`, `App.tsx`, hooks y dependencias. Las demás tareas se integran mediante PR pequeños hacia `main`, probando una ronda completa antes de fusionar.
