# Uso de Inteligencia Artificial

## Herramientas

| Herramienta | Modelo | Uso |
|---|---|---|
| Claude Code (CLI, Windows) | Claude Opus 5.5 | Análisis del enunciado y de los datos, preparación del entorno, planificación y generación de código bajo revisión |

## Forma de trabajo

- La IA propone; yo decido. Ninguna decisión de estructura, herramientas o diseño se toma sin mi confirmación explícita.
- Regla dada a la IA desde el inicio: **no asumir nada**, verificar el estado real del entorno con comandos y consultar cualquier duda.
- Cada sesión queda registrada en `prompts/` (prompts y extractos relevantes) y los planes/diseños en `planes/`.

## Registro de decisiones (aceptado / modificado / descartado)

| # | Propuesta de la IA | Decisión | Motivo |
|---|---|---|---|
| 1 | Reportó Docker como no instalado | **Descartado / corregido** | La terminal tenía el PATH desactualizado; Docker Desktop sí estaba instalado. A partir de aquí se exigió verificar en lugar de asumir. |
| 2 | Mencionó la falta de Python como bloqueo | **Descartado** | El proyecto no necesita Python; la IA lo usó por costumbre para analizar el CSV y luego lo rehízo con Node. |
| 3 | Monorepo `api/` + `web/` + `ia/` | **Aceptado con aclaración** | El enunciado pide un solo repositorio, `ia/` en la raíz y un `docker-compose.yml` que levante todo (HU-E4). Se pidió justificarlo; se acordó un repo simple con carpetas, sin tooling de monorepo (sin workspaces/Turborepo/Nx). |
| 4 | Nombres de carpetas | **Aceptado tras debate** | Se compararon `api/`+`web/`, `backend/`+`frontend/` y `api/`+`front/`; se eligió `api/`+`web/` por brevedad y convención. |
| 5 | Node 22 LTS con nvm-windows y `.nvmrc` | **Aceptado** | Node 20 llegó a fin de soporte (abril 2026); Node 22 está en LTS de mantenimiento. Elegí nvm-windows sobre reemplazar Node manualmente. |
| 6 | Desinstalar Node 24 desde la sesión de IA | **Modificado** | La IA detectó que Claude Code estaba instalado sobre Node 24; desinstalarlo rompería la propia herramienta. Ejecuté yo los pasos fuera de la sesión. |
| 7 | Confiar en que nvm-windows lee `.nvmrc` | **Verificado: no lo lee** | Prueba en carpeta temporal: `nvm use` sin argumento falla en 1.2.2. Se documenta `nvm use (Get-Content .nvmrc)`. |
| 8 | Idioma | **Decidido por mí** | Commits en español (Conventional Commits, como en el PDF); código en inglés. |
