# AGENTS.md · Finanzas v12

## Misión
Mejorar la app real sin perder datos ni degradar privacidad, claridad o fiabilidad. Haz cambios en su lugar correcto, ejecuta todas las pruebas y no declares éxito sin `TODO OK`.

## Invariantes
1. No cambiar `caudal_v1`, `caudal:`, `X-Caudal-Token`, el KV `CAUDAL` ni el `id` `finanzas-app`.
2. El TOKEN se pinta vacío y enmascarado; nunca aparece en HTML, logs, capturas ni prompts.
3. Local-first: persistir antes de usar red. Los fallos deben quedar visibles y reintentarse sin perder cambios.
4. No introducir pagos obligatorios. Las credenciales de exchanges son solo lectura.
5. La IA es opt-in, usa mínimos datos, no ejecuta operaciones y no promete rentabilidad.
6. Toda función accesible por gesto tiene botón alternativo. Objetivos táctiles principales: 44 px en móvil.
7. Una aportación, importación inicial o traspaso no puede presentarse como rentabilidad.
8. No rellenar huecos con módulos gigantes: el escritorio es denso; el móvil prioriza y secuencia.

## Arquitectura
- `index.html` + `css/app.css` + `js/*.js`: estado, finanzas, gráficos, importadores, tiempo real, conectores, Copiloto y vistas PC/móvil.
- `worker.js` w6: CORS/origen, precios, exchanges, mercado, Enable Banking, on-chain, IA y KV `CAUDAL`.
- `sw.js`: caché `finanzas-v12-14`, actualización y modo sin conexión.
- `manifest.json`: identidad PWA estable.
- `actualizar.html`: aplica parches propuestos por IA en una copia y los valida.
- `tests/`: navegador integral (`smoke.py`) y Worker (`worker_smoke.mjs`).
- `tools/`: contexto, mapa y guía.

## Jerarquía del producto
- Inicio: posición general → cambios reales → cuentas → activos → flujo → decisiones.
- Mercados: panorama → salud/datos → decisiones → posiciones → exposición → escenarios → radar/noticias.
- Móvil y PC son composiciones distintas; no basta con apilar la cuadrícula de PC.
- Azul: posición/cuentas. Bronce: inversión. Verde petróleo: flujo. Ciruela: inteligencia. Verde/rojo: estado.

## Flujo de cambio obligatorio
1. Empieza por el objetivo, los archivos señalados, los cambios actuales y sus dependencias directas: lee `CONTEXTO_FINANZAS.md` y busca símbolos puntuales en `MAPA_DEL_CODIGO.md` antes de ampliar.
2. Amplía la investigación solo cuando la evidencia lo requiera; formula el cambio y sus riesgos para datos, móvil, PC y Worker.
3. Mantén las modificaciones centradas en la tarea y en la función original; no añadas parches que reasignen funciones.
4. Consulta documentación externa vigente (Context7 `context7-mcp` o plugin de Cloudflare) solo cuando una librería, API externa o versión concreta lo justifique (Playwright, Cloudflare Workers/KV, APIs externas); evítalo en código vanilla interno.
5. Verifica de menor a mayor coste con `.agents/skills/verificar-cambios/SKILL.md`: sintaxis y chequeo estático (`check-static.mjs`) → `tests/worker_smoke.mjs` → `tests/smoke.py` + revisión visual 390×844 y 1440×900 en claro y oscuro según riesgo y antes de cerrar una entrega funcional.
6. Actualiza versión/revisión, comentarios, contexto, mapa, pruebas y guía si cambia el uso.
7. Cierra con un resumen breve: archivos cambiados, comprobaciones ejecutadas con su resultado real (separando probado vs pendiente) y riesgos pendientes.

## Delegación escalonada y Swarm autónomo
Elige el nivel mínimo que resuelva la tarea con fiabilidad y menor consumo de cuota (coste adicional 0 €):
1. **Agente único**: tareas acotadas, secuenciales o centradas en un módulo.
2. **Subagentes ligeros (`invoke_subagent`)**: exploración multiarchivo, triaje de logs o revisión visual puntual (`context-scout`, `research` o `browser` en `flash` / `flash_lite`).
3. **Swarm nativo autónomo (`swarm`, sin esperar `/swarm`)**: actívalo por iniciativa propia **solo** cuando existan ≥2 frentes sustanciales e independientes con archivos y responsabilidades bien delimitados, la coordinación paralela o un verificador aporte ventaja clara, el beneficio en tiempo o fiabilidad compense el alto consumo (`Quota Heavy`, verificando margen antes con `swarm{action:"models"}` y sin créditos de pago) y `swarm` esté disponible (si no lo está, degrada a subagentes admitidos y avisa solo si Swarm aportaría ventaja clara).
4. **Operación y modelos en Swarm**: usa el equipo mínimo suficiente, `workspace:"share"` para autores concurrentes, `kill` al terminar cada worker y comunica brevemente la decisión y motivo sin pedir aprobación rutinaria (manteniendo confirmaciones de seguridad). Por defecto usa el modelo de la conversación (`Orchestrator (Neon)`), pero está autorizado asignar modelos ligeros incluidos en la suscripción (p. ej. `gemini-4-hydrogen-medium` o `gemini-3.8-flash-medium`) a workers auxiliares/rutinarios o si baja la cuota principal, siempre dentro de cuota incluida.

## Decisiones técnicas y comandos comprobados
- **Stack**: PWA 100 % vanilla sin `package.json` ni bundler (`index.html`, `css/app.css`, `js/*.js`), `localStorage` (`caudal_v1`), Cloudflare Worker `w6` + KV `CAUDAL` y CI automático en `.github/workflows/check.yml`.
- **Chequeo estático rápido local** (Node v24 incluido en Antigravity): `& "$env:APPDATA\Antigravity\bin\agy-node.cmd" .agents\skills\verificar-cambios\scripts\check-static.mjs` (o `node .agents/skills/verificar-cambios/scripts/check-static.mjs`).
- **Pruebas Worker `w6`**: `& "$env:APPDATA\Antigravity\bin\agy-node.cmd" tests\worker_smoke.mjs` (o `node tests/worker_smoke.mjs`).
- **Pruebas integrales en navegador** (requiere Python + Playwright): `python tests/smoke.py`.
- **Sincronizar contexto y mapa**: `python tools/sincronizar_version.py` y `python tools/mapa.py`.
- **Revisión visual local**: usar el subagente integrado `browser` (`Model: "flash"`) en modo lectura/datos de prueba (no hace falta `@playwright/cli`).

## Comprobaciones críticas
- Importar Santander/Binance/Kraken y reimportar sin duplicados.
- Privacidad oculta importes y saldos de movimientos.
- Historial no incluye salto artificial desde cero.
- Sincronización mezcla cambios simultáneos y respeta borrados.
- HTTP 403 explica cómo corregir `ALLOWED_ORIGIN`.
- Worker w6, Gemini local/real, radar, noticias y análisis técnico.
- Pantallas con y sin inversiones; claro/oscuro; 360–1920 px.
