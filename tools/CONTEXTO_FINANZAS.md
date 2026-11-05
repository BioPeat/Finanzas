# CONTEXTO · Finanzas

**Versión actual: v6** · revisión 3 · Worker **w4**

## Qué es
PWA local-first para patrimonio, cuentas, movimientos, inversión, derivados, previsión, fiscalidad orientativa y análisis asistido. Se publica en GitHub Pages y usa opcionalmente un Cloudflare Worker gratuito.

## Contratos que no se pueden cambiar
- `caudal_v1`: clave de datos del navegador.
- `caudal:`: prefijo usado para derivar el identificador de sincronización.
- `X-Caudal-Token`: cabecera de autenticación.
- Binding KV: `CAUDAL`.
Cambiar cualquiera puede desconectar o hacer perder acceso a datos anteriores.

## Arquitectura v6
- `index.html`: app completa, importadores, modelos, UI Atlas, Copiloto y sincronización.
- `worker.js` w4: exchanges, precios, series, radar, noticias, IA multi-proveedor y KV.
- `sw.js`: caché v6, actualización network-first y reparación.
- `manifest.json`: conserva el `id` existente `finanzas-app` para evitar instalaciones duplicadas.
- `actualizar.html`: validador de propuestas de IA.
- `tests/`: smoke del navegador y Worker.
- `tools/`: regeneración de mapa, contexto y guía.

## Diseño
Concepto «Atlas financiero»: cuaderno de navegación + mesa de mercado. Escritorio asimétrico, denso e informativo; móvil orientado al pulgar y a lecturas cortas. Las líneas y escalas crean jerarquía; el color solo comunica estado. Oscuro por defecto y claro/automático disponibles.

## Automatización prioritaria
- Detección e importación CSV/XLSX/OFX/QFX/QIF, deduplicación y categorización aprendida.
- Precios, saldos, avisos, fotos diarias, previsiones y sincronización al abrir, volver, recuperar red y por intervalo.
- Cola implícita local-first: cada cambio se guarda antes de intentar subirlo.
- Reintentos crecientes, detección de conflictos, mezcla por elemento, verificación tras subida y lápidas de borrado.
- 7 copias locales diarias y 10 versiones cifradas anteriores en KV durante 30 días.
- Comprobación automática del Worker al abrir; nunca se conserva en pantalla un «w2» antiguo si el Worker responde w4.
- Service Worker y contexto/mapa se actualizan automáticamente.

## IA
Modos: local sin API; Gemini; OpenAI; Anthropic; cualquier API compatible con OpenAI. Las claves viven solo como secretos del Worker. Por defecto se envían totales agregados, categorías, activos y alertas; los últimos movimientos requieren permiso explícito. La IA no opera ni promete rentabilidad.

## Inversiones
Cartera, FIFO, cobertura de coste, derivados, gráficos TradingView, exposición, concentración, liquidez estable, escenarios, cambio ponderado, radar 24 h, series de un año, RSI, medias 20/50, volatilidad y drawdown, más noticias por activo. Indicadores descriptivos, no señales de compra/venta.

## Seguridad
TOKEN siempre en `type=password`, valor vacío al pintar y nunca incluido en texto. Sincronización AES-GCM en cliente. Claves de exchange de solo lectura en secretos. Origen restringible con `ALLOWED_ORIGIN`. No se usan servicios obligatorios de pago.
