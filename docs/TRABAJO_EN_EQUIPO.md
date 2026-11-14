# Cómo trabajar sin pisarnos

## Empezar todos desde la misma base

Cada persona usa su propia copia del repositorio. Ejecutar estos comandos dentro de ella con el trabajo anterior guardado en un commit:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/presentacion
```

Usar un nombre diferente para cada tarea: `feat/presentacion`, `feat/cartas`, `feat/minijuego`, `feat/lobby` o `feat/assets`. Las ramas separan cambios; repartir archivos evita conflictos.

Instalar dependencias desde la raíz del repo con `pnpm install --frozen-lockfile` y arrancar con `pnpm dev`. Leer `CONTRATO.md` y `AGENTS.md` antes de pedir cambios a una IA.

## Reparto recomendado

- Una persona: fase 2 y `MinigamePresentation.css`.
- Otra: fase 3 y `CardSelection.css`.
- Otra: fase 4 y `PlayMinigame.css`; componentes de minijuegos que necesite.
- Otra: lobby/HUD o recursos y contenido.
- Un responsable de integración: servidor, `shared/`, `App.tsx`, hooks, configuración, dependencias y estilos globales. Puede colaborar en otras tareas, coordinando los archivos que toque.

Para cada IA: «Lee AGENTS.md, README.md y docs/CONTRATO.md. Trabaja en la fase X. Cambia solo estos archivos: […]. Conserva las props públicas y utiliza las callbacks existentes. Coordina cualquier necesidad de modificar shared o dependencias».

## Guardar y proponer una integración

```bash
git add client/src/phases/MinigamePresentation.tsx client/src/phases/MinigamePresentation.css
git commit -m "feat: mejorar presentación del minijuego"
git push -u origin feat/presentacion
```

Abrir un Pull Request en GitHub desde esa rama hacia `main`. Escribir qué cambia, cómo se prueba y si requiere algún cambio de contrato.

Antes de integrar, incorporar la base actual a la rama:

```bash
git fetch origin
git merge origin/main
pnpm build
pnpm test
git push
```

Si hay conflictos, la IA puede ayudar, pero debe conservar las dos funcionalidades. No aceptar automáticamente todo «ours» o todo «theirs». Probar también una ronda completa en el navegador. El responsable revisa y fusiona los PR de uno en uno; no esperar al final del hackatón.

## Después de fusionar

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/siguiente-tarea
```

Si otra persona sigue en su rama, incorporar `origin/main` con el mismo procedimiento. Evitar cambios ajenos a la tarea, no subir `node_modules` ni secretos, y coordinar instalaciones para mantener un único lockfile.

En GitHub conviene activar protección de `main` para exigir PR antes de integrar. Esta guía no configura esa protección automáticamente.
