# CONTEXTO · Finanzas

**Versión actual: v7** · revisión 7 · Worker **w5**

## Qué es
PWA local-first para comprender patrimonio, cuentas, movimientos, inversiones, riesgo, previsión y fiscalidad orientativa. Se publica en GitHub Pages y usa opcionalmente un Cloudflare Worker gratuito.

## Contratos estables
- `caudal_v1`: datos del navegador.
- `caudal:`: derivación del identificador de sincronización.
- `X-Caudal-Token`: autenticación del Worker.
- `CAUDAL`: binding KV.
- `finanzas-app`: identidad del manifest.
No se renombra ninguno.

## Diseño v7
Concepto «Posición financiera»: lectura inmediata y seria, no un mosaico de tarjetas iguales. El móvil tiene una secuencia propia con escala muy marcada; el PC usa una mesa densa de 12 columnas. Color funcional: azul para posición/cuentas, bronce para inversión, verde petróleo para flujo y ciruela para inteligencia.

## Inicio
Orden: patrimonio y evolución fiable; cambios de hoy/7/30 días; disponible frente a invertido; cuentas; activos; flujo mensual; decisiones; próximos cargos y actividad. `reliableHistory()` elimina una base cero importada y `netSeries()` mantiene los activos no bancarios como base neutral cuando aún no existen snapshots diarios.

## Mercados
Tres modos móviles: Panorama, Posiciones y Explorar. Incluye salud de cartera, concentración, cobertura FIFO, liquidez, decisiones previas, exposición, escenarios interactivos, derivados, radar, gráficos, RSI, medias, volatilidad, drawdown y noticias por activo. Son ayudas descriptivas; no ejecutan órdenes ni garantizan beneficios.

## Copiloto
Seis lecturas: posición, gasto, cartera, fin de mes, riesgos a 30 días y calidad de datos. Local funciona sin clave. IA real: Gemini, OpenAI, Anthropic o API compatible. Por defecto solo salen datos agregados; los últimos movimientos requieren permiso explícito.

## Sincronización y seguridad
Guardado local antes de red, reintentos, merge por elemento, lápidas, verificación, siete copias locales y diez versiones cifradas en KV. El Worker w5 devuelve un diagnóstico legible de HTTP 403 con el `ALLOWED_ORIGIN` esperado, sin exponer datos. TOKEN nunca visible.

## Archivos
- `index.html`: aplicación completa.
- `worker.js`: Worker w5.
- `sw.js`: caché `finanzas-v7-7`.
- `actualizar.html`: actualizador validado.
- `tests/smoke.py`: navegador, importación, sincronización, responsive y funciones.
- `tests/worker_smoke.mjs`: CORS, TOKEN, KV, conflictos y rutas.
- `tools/`: mapa y sincronización de documentos.

## Historial
- **v7 · Posición financiera:** jerarquía móvil real, escritorio denso, cambios sin importaciones falsas, mercado interactivo y diagnóstico de cartera.
- **v6 · Atlas financiero:** Copiloto multi-proveedor, radar, riesgo, reparación PWA y sincronización reforzada.
