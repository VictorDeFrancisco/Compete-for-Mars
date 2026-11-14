# Instrucciones para agentes

- Lee `README.md` e `Ideas.txt` antes de trabajar. `Ideas.txt` recoge el enunciado y las ideas iniciales; las reglas todavía pueden cambiar.
- El proyecto usa TypeScript, React + Vite en el cliente y Node + Express + Socket.io en el servidor. Hay una base ejecutable del ciclo de rondas. Consulta `docs/CONTRATO.md` y `docs/TRABAJO_EN_EQUIPO.md` antes de cambiar interfaces.
- Limita los cambios a la tarea asignada. Coordina cualquier cambio en `shared/`, los eventos de Socket y las dependencias con el resto del equipo.
- El servidor gestionará el estado y las consecuencias de las acciones; el cliente mostrará la interfaz y ejecutará los minijuegos locales. No envíes datos privados de otros jugadores al cliente.
- Mantén los minijuegos independientes y el contenido editable en `server/data/`.
- No añadas secretos, claves SSH ni archivos `.env` al repositorio.
- Para crear minijuegos, lee `docs/MINIJUEGOS.md`. Extiende `BaseMinigame`, declara metadatos/controles y crea una vista local. El servidor clasifica los resultados y aplica recompensas; no envíes Socket.io desde una clase o vista de minijuego.
- Las fases 2, 3 y 4 están aisladas en `client/src/phases/`, con su propio CSS. Usa las props de `shared/types.ts`; no abras sockets adicionales ni cambies de fase desde el cliente.
- Comprueba `npm run build` y `npm test` (o equivalentes con pnpm) antes de integrar. El lockfile de referencia es `pnpm-lock.yaml`; el responsable de integración coordina dependencias y configuración.
