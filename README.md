# Another Planet
Another Planet es el juego hecho para el reto Build a Junior Astronaut Mission Trainer de la Nasa Space Apps Challenge de 2026 en Zaragoza. Los autores son Lucía Hernando, Diego Gómez, Gabriel Sanjuan, Víctor de Francisco y Didac Medal; del equipo C-Moon Dynamics.

## Organización inicial

Lee `Ideas.txt` para consultar el enunciado y las ideas del juego. Las reglas están pendientes de concretar. `AGENTS.md` contiene indicaciones breves para las IA que trabajen en el repositorio.

```text
shared/                  Tipos y constantes compartidas entre cliente y servidor
server/
  index.ts               Express, Socket.io, salas y temporizadores
  gameEngine.ts          Reglas y máquina de estados
  bots.ts                Bots para pruebas y demo
  data/                  Casillas, cartas y preguntas en JSON
client/
  vite.config.ts         Configuración de Vite y proxy de desarrollo
  public/assets/         Modelos, imágenes y otros recursos gráficos
  public/sounds/         Efectos de sonido
  src/
    main.tsx             Entrada del cliente
    App.tsx              Conexión y pantallas
    components/          Lobby, selección, HUD, tablero y resumen
    minigames/           Contenedor común y minijuegos independientes
```

Esta entrega contiene únicamente la estructura: los archivos TypeScript son plantillas y los bancos JSON están vacíos. Los `package.json` definen los espacios de trabajo de npm; todavía faltan dependencias, configuraciones de TypeScript y scripts de desarrollo/build. La aplicación aún no se puede ejecutar.

Cada persona trabajará en su rama y en los archivos de su tarea. Los cambios en `shared/` y las dependencias deben coordinarse con el equipo.
