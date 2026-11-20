# Registro de configuración de Antigravity · Finanzas

Fecha de comprobación: `2026-11-20`

## Entorno comprobado
- **SO**: Windows 11 (`Microsoft Windows NT 10.0.26200.0`)
- **Antigravity**: versión `44.9.1`
- **Modelo activo**: `Orchestrator (Neon)` (`gemini-pro-orchestrator-neon`: planificador Neon + ejecutor Hydrogen)
- **Runtime local disponible en sandbox**: Node `v24.22.0` vía `C:\Users\drami\AppData\Roaming\Antigravity\bin\agy-node.cmd` (`git`, `node`, `npm`, `npx` y `python`/`python3` con Playwright no están disponibles en el `PATH` local de este equipo).

## Estado por componente (Instalado vs Configurado vs Probado)

| Componente | Instalado / Presente | Configurado | Probado | Notas y alcance |
|---|---|---|---|---|
| `Orchestrator (Neon)` + catálogo de modelos | Sí (integrado en Antigravity) | Seleccionado en la sesión | Sí (`swarm{action:"models", all:true}`: 100% cuota, reset ~5 h) | Planificador Neon + ejecutor Hydrogen; opciones ligeras `gemini-4-hydrogen-*` y `gemini-3.8-flash-*` disponibles sin coste extra. |
| Control `AI Credit Overages` (`Never` / `useG1Credits: false`) | Sí (ajuste de app/cuenta) | **Pendiente de revisión manual** | No (`config.json` protegido por regla de sistema) | Diego debe verificar en **Settings** que el gasto extra esté en **Never**. |
| `context7` (Upstash MCP + skill `context7-mcp`) | Sí (ya instalado `v1.0.1` en `~/.gemini/config/plugins/context7`) | Política de uso selectivo en `AGENTS.md` | Sí (`resolve-library-id` + `query-docs` sobre Playwright Python) | Activo vía HTTP `https://mcp.context7.com/mcp` sin clave API configurada. |
| `cloudflare` (MCP + skills) | Sí (ya instalado `v1.0.4`) | Referenciado en `AGENTS.md` | No invocado en esta sesión (no hubo cambios en Worker/KV) | Cubre Cloudflare Workers `w6` y KV `CAUDAL` sin coste adicional en plan gratuito. |
| `token-saver` (reglas + skill + `context-scout`) | Sí (ya instalado `v1.0.0`) | Conservado intacto | Sí (reglas y skill leídas y seguidas) | Subagente `context-scout` en `flash` sin herencia de MCP. |
| Instrucciones `AGENTS.md` | Sí (preexistente `v7`) | Actualizado a `v12` / `w6` + pautas breves + Swarm + comandos | Sí (lectura y tamaño < 24 KB verificados) | Copia previa en `.agents/backups/2026-11-20/AGENTS.md.bak`. |
| Política global `GEMINI.md` | Sí (en `~/.gemini/config/GEMINI.md`) | **No modificado** (protegido por límite del sistema) | Leído (`read_file`); escritura bloqueada por sistema | Política equivalente aplicada al proyecto en `AGENTS.md`; abajo se incluye el bloque opcional para copiarlo manualmente si se desea global. |
| Skill `verificar-cambios` + `check-static.mjs` | Creada en `.agents/skills/verificar-cambios/` | Lista con escalera 0–3 y comandos reales | Sí (`agy-node.cmd` → `Static checks: TODO OK`, frontmatter YAML verificado) | Sustituye el chequeo sin navegador mientras no haya Python/Playwright local. |
| Suite Worker `tests/worker_smoke.mjs` | Sí (preexistente) | Documentada en `AGENTS.md` y skill | Sí (`agy-node.cmd` → `Worker smoke: TODO OK`) | Ejecuta en local sin red ni secretos reales. |
| Suite E2E `tests/smoke.py` | Sí (preexistente) | Documentada en `AGENTS.md` y skill | **Pendiente en local** (no hay Python/Playwright en `PATH`) | Se ejecuta automáticamente en GitHub Actions (`.github/workflows/check.yml`). |
| `@playwright/cli` | **Descartado** | No | No | Proyecto vanilla sin `package.json`/`npm` en `PATH`; cubierto por subagente `browser` (`flash`) + CI Playwright. |
| GitHub / BD | **Descartados** | No | No | Sin plugin oficial de GitHub en Marketplace y sin necesidad activa; KV ya cubierto por Cloudflare. |
| `Gemini API` (plugin oficial) | No instalado | No instalado | Solo verificado en Marketplace (`antigravity-plugins-official/plugin/gemini-api`) | Sugerido al usuario mediante `<plugin-card>` solo para cuando trabaje en `worker.js` / `js/ai.js`. |

## Limitación sobre `~/.gemini/config/` y bloque opcional para `GEMINI.md`
Antigravity protege el directorio `C:\Users\drami\.gemini\config\` frente a escritura directa del agente (regla de seguridad del sistema). Por ese motivo, ni `config.json` ni `GEMINI.md` han sido modificados. La política de Swarm autónomo y uso selectivo de Context7 quedó integrada en `AGENTS.md` para el proyecto `Finanzas`.

Si deseas aplicarla de forma global en todos tus proyectos, puedes añadir manualmente este bloque al final de `C:\Users\drami\.gemini\config\GEMINI.md`:

```markdown
## Uso selectivo de documentación externa (Context7 / MCP)

- Invoca Context7 (`context7-mcp`) únicamente cuando la tarea dependa de APIs, librerías externas o versiones específicas; evita consultarlo para código propio sin dependencias externas.

## Delegación escalonada y Swarm autónomo

Elige el nivel mínimo que resuelva la tarea con fiabilidad y menor consumo de cuota (coste adicional 0 €):
1. **Agente único**: tareas acotadas o secuenciales.
2. **Subagentes ligeros (`invoke_subagent`)**: exploración multiarchivo, triaje de logs o revisión visual puntual (`context-scout`, `research` o `browser` en `flash` / `flash_lite`).
3. **Swarm nativo autónomo (`swarm`, sin esperar `/swarm`)**: actívalo por iniciativa propia **solo** cuando existan ≥2 frentes sustanciales e independientes con archivos y responsabilidades bien delimitados, la coordinación paralela o un verificador aporte ventaja clara, el beneficio compense el alto consumo (`Quota Heavy`, verificando margen antes con `swarm{action:"models"}` y sin créditos de pago) y `swarm` esté disponible.
4. **Operación y modelos en Swarm**: usa el equipo mínimo suficiente, `workspace:"share"` para autores concurrentes, `kill` al terminar cada worker y comunica brevemente la decisión y motivo sin pedir aprobación rutinaria. Por defecto usa el modelo de la conversación (`Orchestrator (Neon)`), quedando autorizado asignar modelos ligeros incluidos en la suscripción (p. ej. `gemini-4-hydrogen-medium` o `gemini-3.8-flash-medium`) a workers auxiliares/rutinarios o si baja la cuota principal.
```

## Fuentes oficiales consultadas (`2026-11-20`)
- Documentación integrada de Antigravity: `agy-customizations` (`SKILL.md`, `docs/rules.md`, `docs/skills.md`, `docs/mcp_servers.md`, `docs/plugins.md`, `docs/hooks.md`, `docs/json_configs.md`), `antigravity-guide` (`references/app.md`, `references/ide.md`) y `native_swarm` (`SKILL.md`).
- Documentación pública de Antigravity (`https://antigravity.google/docs`): roles de Orchestrator (`Neon`/`Carbon` planificador + `Hydrogen` ejecutor), ventanas de cuota y ajuste de créditos extra (`AI Credit Overages → Never` / `useG1Credits: false`).
- Documentación oficial de Context7 (`https://context7.com/plans`, `https://context7.com/docs/api-guide`, `https://github.com/upstash/context7`): cuota gratuita de 1.000 llamadas/mes (+ 20/día al agotarse), límites más bajos sin API key y respuesta `429` con cabeceras `Retry-After` y `RateLimit-*`.
- Documentación oficial de Playwright (`https://playwright.dev`): `@playwright/cli` y `playwright-cli install --skills`.

## Reversión paso a paso (PowerShell)
Desde la raíz `c:\Users\drami\Documents\GitHub\Finanzas\`:

```powershell
# 1. Restaurar AGENTS.md y .gitignore originales desde las copias de seguridad
Copy-Item .agents\backups\2026-11-20\AGENTS.md.bak AGENTS.md -Force
Copy-Item .agents\backups\2026-11-20\.gitignore.bak .gitignore -Force

# 2. Eliminar la skill de verificación, el registro y las copias de seguridad
Remove-Item .agents\skills\verificar-cambios -Recurse -Force
Remove-Item .agents\REGISTRO_CONFIG_ANTIGRAVITY.md -Force
Remove-Item .agents\backups -Recurse -Force

# 3. Si .agents quedó vacía, eliminar la carpeta (opcional)
if ((Get-ChildItem .agents -Force | Measure-Object).Count -eq 0) { Remove-Item .agents -Force }
```
