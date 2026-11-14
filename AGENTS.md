# Instrucciones para agentes

- Lee `README.md` e `Ideas.txt` antes de trabajar. `Ideas.txt` recoge el enunciado y las ideas iniciales; las reglas todavía pueden cambiar.
- El proyecto usa TypeScript, React + Vite en el cliente y Node + Express + Socket.io en el servidor. Hay una base ejecutable del ciclo de rondas. Consulta `docs/CONTRATO.md` y `docs/TRABAJO_EN_EQUIPO.md` antes de cambiar interfaces.
- Limita los cambios a la tarea asignada. Coordina cualquier cambio en `shared/`, los eventos de Socket y las dependencias con el resto del equipo.
- El servidor gestionará el estado y las consecuencias de las acciones; el cliente mostrará la interfaz y ejecutará los minijuegos locales. No envíes datos privados de otros jugadores al cliente.
- Mantén los minijuegos independientes; las cartas y preguntas van en `server/data/`, y las definiciones de minijuegos en `shared/minigames/`.
- No añadas secretos, claves SSH ni archivos `.env` al repositorio.
- Para crear minijuegos, lee `docs/MINIJUEGOS.md`. Extiende `BaseMinigame`, declara metadatos/controles y crea una vista local. El servidor clasifica los resultados y aplica recompensas; no envíes Socket.io desde una clase o vista de minijuego.
- Las fases 2, 3 y 4 están aisladas en `client/src/phases/`, con su propio CSS. Usa las props de `shared/types.ts`; no abras sockets adicionales ni cambies de fase desde el cliente.
- Comprueba `npm run build` y `npm test` (o equivalentes con pnpm) antes de integrar. El lockfile de referencia es `pnpm-lock.yaml`; el responsable de integración coordina dependencias y configuración.

## Crear un minijuego

- Lee `docs/MINIJUEGOS.md` y copia como referencia uno de los ejemplos existentes. Hereda de `BaseMinigame` y conecta tu vista React con `defineModule`.
- Para esta tarea, crea o modifica únicamente tu carpeta `client/src/minigames/games/<id>/` y tu definición `shared/minigames/<nombre>.ts`. Coordina las altas en `shared/minigames/catalog.ts` y `client/src/minigames/registry.ts`. Cualquier otro cambio requiere coordinación o una instrucción explícita de la tarea.
- Declara presentación, controles, duración, modo (`score` o `race`) y recompensas. Actualiza puntos/progreso mediante la clase y llama a `complete()` al terminar una carrera; el timeout lo gestiona la base.
- No uses Socket.io ni modifiques recursos, vida o fases desde el minijuego. El contenedor envía el resultado y el servidor aplica la clasificación y sus consecuencias.
- Para probar sin servidor: `pnpm dev:client` y abrir `http://localhost:5173/?minigame=<id>`. Comprueba controles, finalización, timeout y reinicio en el laboratorio.
- Antes de entregar: `pnpm build` y `pnpm test`. Trabaja en tu rama y prepara un PR hacia `main` con los archivos y la forma de probarlo.
