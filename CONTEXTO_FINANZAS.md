# CONTEXTO · Finanzas

**Versión actual: v12** · revisión 17 · Worker **w6**

## Qué es
PWA privada y local-first para unificar bancos, exchanges (KuCoin, Kraken, Binance, OKX, Bybit), brókeres, wallets on-chain, derivados en vivo, flujo mensual, fiscalidad española y Copiloto IA (Gemini). Se publica en GitHub Pages con un Cloudflare Worker gratuito (`w6`).

## Contratos estables
- `caudal_v1`: almacenamiento local en el navegador.
- `caudal:`: derivación del identificador de sincronización.
- `X-Caudal-Token`: cabecera de autenticación del Worker.
- `CAUDAL`: binding KV de Cloudflare.
- `finanzas-app`: identidad estable del manifest PWA.

## Diseño v12 (Editorial Ledger · Obsidian Dark & Warm Paper)
- **Escritorio (`>= 1024px`)**: barra lateral izquierda fija de `248px` con buscador `Ctrl+K`, navegación agrupada y lista viva de cuentas con puntos semánticos de `6px`; lienzo editorial limpio sin barra superior saturada, bento de 2 filas equilibrado en Inicio (Patrimonio + Flujo, Movimientos + Cartera/Gastos), terminal de Mercados con un único simulador en Derivados, y estudio conversacional neutro para Copiloto.
- **Móvil (`< 1024px`)**: cabecera ligera con menú, privacidad y `+` rápido (sin botón flotante duplicado); hero de patrimonio directo sobre el lienzo con micro-insight, distribución en inversión y curva spline; filas planas separadas por hairlines; barra inferior de 5 pestañas y controles `>= 44 px`.

## Conexiones y APIs (solo lectura y coste 0 €)
- **Bancos**: Open Banking PSD2 gratuito via Enable Banking (`ENABLE_BANKING_APP_ID` + `ENABLE_BANKING_PRIVATE_KEY`) + importador Santander/Revolut/BBVA/OFX/QIF + extractor multimodal con Gemini IA.
- **Exchanges**: KuCoin (Spot + Earn + Futuros), Kraken (Spot + Margen + Futuros), Binance (Spot + Fondos + Earn + Futuros), OKX, Bybit e importación de historial API (`/history`).
- **On-chain**: consulta gratuita de BTC (`mempool.space`), Ethereum, Arbitrum, Base, Polygon y Solana.
- **IA**: Copiloto conversacional multi-turno (Gemini / OpenAI / Anthropic / Local sin clave), autocategorización de comercios desconocidos y lectura de extractos/capturas.

## Archivos
- `index.html` + `css/app.css` + `js/*.js`: aplicación modular completa.
- `worker.js`: Worker `w6`.
- `sw.js`: caché `finanzas-v12-16` (network-first con respaldo sin conexión).
- `tests/smoke.py`: batería integral en navegador.
- `tests/worker_smoke.mjs`: pruebas de rutas, CORS, TOKEN y KV del Worker `w6`.
- `tools/`: generación de mapa y sincronización de versión.
