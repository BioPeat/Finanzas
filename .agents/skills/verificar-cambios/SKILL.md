---
name: verificar-cambios
description: >-
  Verifica modificaciones en el proyecto Finanzas con un coste proporcionado tras
  implementar una función, corregir un error o refactorizar. Revisa los archivos
  cambiados y sus dependencias directas, ejecuta primero la comprobación más pequeña
  pertinente y escala las pruebas solo según el riesgo o los fallos encontrados.
---

# Verificar cambios · Finanzas

Aplica este procedimiento tras implementar una función, corregir un fallo o refactorizar, sin repetir la exploración completa del repositorio ni ejecutar pruebas desproporcionadas.

## Paso 1 · Acotar el cambio
1. Lista únicamente los archivos modificados (`git status --short` / `git diff --stat` si `git` está disponible; si no, los archivos editados en la sesión).
2. Identifica qué capas están afectadas:
   - Documentación / reglas / skills (`*.md`, `.agents/`)
   - Frontend (`index.html`, `css/app.css`, `js/*.js`, `sw.js`, `manifest.json`)
   - Worker (`worker.js`, `tests/worker_smoke.mjs`)
   - Pruebas o herramientas (`tests/smoke.py`, `tools/*.py`)

## Paso 2 · Escalera proporcional de comprobación
Ejecuta el primer nivel aplicable y escala solo si el cambio lo requiere o aparece un fallo:

- **Nivel 0 (solo docs, reglas o skills)**:
  - Comprueba que YAML/JSON/Markdown sean válidos, que no falten enlaces referenciados y que ningún archivo de la app (`js/`, `css/`, `index.html`, `worker.js`, `sw.js`, `manifest.json`) haya cambiado por accidente.
- **Nivel 1 (cualquier cambio en `js/*.js`, `css/app.css`, `index.html`, `sw.js`, `manifest.json`)**:
  - Ejecuta el chequeo estático rápido sin dependencias externas [check-static.mjs](./scripts/check-static.mjs):
    - `node .agents/skills/verificar-cambios/scripts/check-static.mjs`
    - Respaldo sin `node` en `PATH`: `& "$env:APPDATA\Antigravity\bin\agy-node.cmd" .agents\skills\verificar-cambios\scripts\check-static.mjs`
  - Criterio de éxito: `Static checks: TODO OK` (`EXIT=0`).
- **Nivel 2 (cambios en `worker.js`, `tests/worker_smoke.mjs`, sincronización, auth, CORS, KV o conectores del Worker)**:
  - Ejecuta la batería del Worker `w6`:
    `node tests/worker_smoke.mjs` (o respaldo `& "$env:APPDATA\Antigravity\bin\agy-node.cmd" tests\worker_smoke.mjs`).
  - Criterio de éxito: `Worker smoke: TODO OK` (`EXIT=0`).
- **Nivel 3 (cambios funcionales en UI, importadores, cálculos, responsive, privacidad o antes de una entrega funcional)**:
  - Ejecuta `python tests/smoke.py` (`TODO OK`) y, si cambiaron versiones o firmas JS, `python tools/sincronizar_version.py` y `python tools/mapa.py`.
  - Si hubiera cambios visuales relevantes, complementa abriendo la app en servidor local temporal y delegando en el subagente integrado `browser` (`Model: "flash"`, solo lectura con datos de prueba) para revisar `390×844` y `1440×900` en claro/oscuro.

## Paso 3 · Escalado ante fallos
- Filtra la salida de errores en origen (no vuelques logs completos al contexto).
- Corrige siempre la función original afectada (nunca añadas parches que reasignen funciones).
- Tras corregir, re-ejecuta el nivel que falló y el nivel inmediatamente superior si afecta a Worker o navegador.

## Paso 4 · Informe final breve
Entrega siempre:
1. Archivos modificados y dependencias afectadas.
2. Comprobaciones ejecutadas y su resultado exacto (separando claramente qué se ha **probado** y qué queda **pendiente**).
3. Riesgos o puntos abiertos, si existen.
