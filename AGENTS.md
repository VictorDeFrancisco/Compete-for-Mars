# Instrucciones para agentes

- Lee `README.md` e `Ideas.txt` antes de trabajar. `Ideas.txt` recoge el enunciado y las ideas iniciales; las reglas todavía pueden cambiar.
- El proyecto usa TypeScript, React + Vite en el cliente y Node + Express + Socket.io en el servidor. Los archivos actuales son plantillas, sin implementación ni dependencias instaladas.
- Limita los cambios a la tarea asignada. Coordina cualquier cambio en `shared/`, los eventos de Socket y las dependencias con el resto del equipo.
- El servidor gestionará el estado y las consecuencias de las acciones; el cliente mostrará la interfaz y ejecutará los minijuegos locales. No envíes datos privados de otros jugadores al cliente.
- Mantén los minijuegos independientes y el contenido editable en `server/data/`.
- No añadas secretos, claves SSH ni archivos `.env` al repositorio.
