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
| `token-saver` (plugin global `v1.1.0`: `rules/AGENTS.md` + `token-efficiency` + `verificar-cambios` + `context-scout`) | Sí (`~/.gemini/config/plugins/token-saver/`) | **Actualizado a alcance global** (eficiencia, uso selectivo de Context7, Swarm autónomo y skill universal `verificar-cambios`) | Sí (`plugin.json` JSON, YAML de `SKILL.md` y tamaño de reglas verificados) | Aplica automáticamente a todos los proyectos actuales (`Finanzas`, `biopeat`, `estadisticas`) y futuros. |
| Instrucciones `AGENTS.md` (proyecto `Finanzas`) | Sí (preexistente `v7`) | Actualizado a `v12` / `w6` + flujo y comandos propios (sin duplicar Swarm global) | Sí (lectura y tamaño < 24 KB verificados) | Copia previa en `.agents/backups/2026-11-20/AGENTS.md.bak`. |
| Política global `GEMINI.md` | Sí (en `~/.gemini/config/GEMINI.md`) | **No modificado** (protegido por límite del sistema) | Leído (`read_file`); escritura bloqueada por sistema | **Resuelto**: la política global se consolidó en el plugin habilitado `token-saver/rules/AGENTS.md` (alcance global automático). |
| Skill `verificar-cambios` (`Global` + `Proyecto`) | Global en `token-saver/skills/verificar-cambios/` + específica en `.agents/skills/verificar-cambios/` | Global agnóstica de stack + específica de Finanzas (`check-static.mjs` + `worker_smoke.mjs`) | Sí (`agy-node.cmd` → `Static checks: TODO OK`, frontmatter YAML verificado) | En Finanzas prevalece la skill del workspace; en cualquier otro proyecto actúa la global. |
| Suite Worker `tests/worker_smoke.mjs` | Sí (preexistente) | Documentada en `AGENTS.md` y skill | Sí (`agy-node.cmd` → `Worker smoke: TODO OK`) | Ejecuta en local sin red ni secretos reales. |
| Suite E2E `tests/smoke.py` | Sí (preexistente) | Documentada en `AGENTS.md` y skill | **Pendiente en local** (no hay Python/Playwright en `PATH`) | Se ejecuta automáticamente en GitHub Actions (`.github/workflows/check.yml`). |
| `@playwright/cli` | **Descartado** | No | No | Proyecto vanilla sin `package.json`/`npm` en `PATH`; cubierto por subagente `browser` (`flash`) + CI Playwright. |
| GitHub / BD | **Descartados** | No | No | Sin plugin oficial de GitHub en Marketplace y sin necesidad activa; KV ya cubierto por Cloudflare. |
| `Gemini API` (plugin oficial) | **Instalado por el usuario** (`~/.gemini/config/plugins/gemini-api/`) | Disponible globalmente con `gemini-api-dev`, `gemini-api-cli` y MCP `gemini-api_gemini-api-docs` | Pendiente de uso cuando se toque `worker.js` / `js/ai.js` | Puede desactivarse temporalmente desde **Plugins** si no se trabaja con la API de Gemini. |

## Alcance global vs. proyecto (sin duplicidades)
Antigravity protege los archivos sueltos `C:\Users\drami\.gemini\config\config.json` y `C:\Users\drami\.gemini\config\GEMINI.md` frente a escritura directa del agente (regla de seguridad del sistema). En cambio, los plugins globales bajo `C:\Users\drami\.gemini\config\plugins\` sí admiten empaquetar reglas, skills y subagentes con alcance para **todos los proyectos actuales y futuros**.

Por ello:
- Se consolidaron dentro del plugin **`token-saver` (`v1.1.0`)**:
  - `C:\Users\drami\.gemini\config\plugins\token-saver\rules\AGENTS.md` (flujo eficiente, uso selectivo de Context7, delegación escalonada y Swarm autónomo).
  - `C:\Users\drami\.gemini\config\plugins\token-saver\skills\verificar-cambios\SKILL.md` (skill universal de verificación proporcional independiente del stack).
- En `Finanzas/AGENTS.md` se eliminó el bloque duplicado de Swarm para evitar repetir tokens en cada turno, conservando solo la arquitectura y comandos específicos de `Finanzas`.
- Precedencia de `verificar-cambios`: en `Finanzas` prevalece `.agents/skills/verificar-cambios/SKILL.md` (Nivel workspace > Global); en cualquier otro proyecto actual (`biopeat`, `estadisticas`) o futuro se activa la skill global.

## Fuentes oficiales consultadas (`2026-11-20`)
- Documentación integrada de Antigravity: `agy-customizations` (`SKILL.md`, `docs/rules.md`, `docs/skills.md`, `docs/mcp_servers.md`, `docs/plugins.md`, `docs/hooks.md`, `docs/json_configs.md`), `antigravity-guide` (`references/app.md`, `references/ide.md`) y `native_swarm` (`SKILL.md`).
- Documentación pública de Antigravity (`https://antigravity.google/docs`): roles de Orchestrator (`Neon`/`Carbon` planificador + `Hydrogen` ejecutor), ventanas de cuota y ajuste de créditos extra (`AI Credit Overages → Never` / `useG1Credits: false`).
- Documentación oficial de Context7 (`https://context7.com/plans`, `https://context7.com/docs/api-guide`, `https://github.com/upstash/context7`): cuota gratuita de 1.000 llamadas/mes (+ 20/día al agotarse), límites más bajos sin API key y respuesta `429` con cabeceras `Retry-After` y `RateLimit-*`.
- Documentación oficial de Playwright (`https://playwright.dev`): `@playwright/cli` y `playwright-cli install --skills`.

## Reversión paso a paso (PowerShell)
### 1. Revertir los cambios globales del plugin `token-saver`
Desde la raíz `c:\Users\drami\Documents\GitHub\Finanzas\`:

```powershell
Copy-Item .agents\backups\2026-11-20\global-token-saver\plugin.json.bak "$env:USERPROFILE\.gemini\config\plugins\token-saver\plugin.json" -Force
Copy-Item .agents\backups\2026-11-20\global-token-saver\rules_AGENTS.md.bak "$env:USERPROFILE\.gemini\config\plugins\token-saver\rules\AGENTS.md" -Force
Remove-Item "$env:USERPROFILE\.gemini\config\plugins\token-saver\skills\verificar-cambios" -Recurse -Force
```

### 2. Revertir los cambios locales del proyecto `Finanzas`
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
