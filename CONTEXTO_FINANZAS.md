# CONTEXTO · Finanzas

**Versión actual: v12** · revisión 13 · Worker **w6**

## Qué es
PWA privada y local-first para unificar bancos, exchanges (KuCoin, Kraken, Binance, OKX, Bybit), brókeres, wallets on-chain, derivados en vivo, flujo mensual, fiscalidad española y Copiloto IA (Gemini). Se publica en GitHub Pages con un Cloudflare Worker gratuito (`w6`).

## Contratos estables
- `caudal_v1`: almacenamiento local en el navegador.
- `caudal:`: derivación del identificador de sincronización.
- `X-Caudal-Token`: cabecera de autenticación del Worker.
- `CAUDAL`: binding KV de Cloudflare.
- `finanzas-app`: identidad estable del manifest PWA.

## Diseño v12 (PC Terminal + Móvil Táctil)
- **Escritorio (`>= 1024px`)**: cabecera superior unificada (Top Command Header con navegación principal, estado BTC en directo, búsqueda `Ctrl+K`, sincronización, privacidad y tema), bento asimétrico de 12 columnas en Inicio sin duplicidades ni cajas vacías, terminal dividido de Mercados (velas OHLCV / TradingView + watchlist + pestañas Spot/Derivados/Operaciones/Radar), detalle por cuenta y estudio conversacional de IA.
- **Móvil (`< 1024px`)**: experiencia táctil independiente inspirada en Revolut/Santander/TradingView móvil con hero centrado, 4 acciones rápidas circulares, carrusel de tarjetas por entidad, barra inferior de 5 pestañas (`Inicio`, `Movimientos`, `Mercados`, `Cuentas`, `Copiloto`), menú deslizable izquierdo y modales tipo hoja inferior.

## Conexiones y APIs (solo lectura y coste 0 €)
- **Bancos**: Open Banking PSD2 gratuito via Enable Banking (`ENABLE_BANKING_APP_ID` + `ENABLE_BANKING_PRIVATE_KEY`) + importador Santander/Revolut/BBVA/OFX/QIF + extractor multimodal con Gemini IA.
- **Exchanges**: KuCoin (Spot + Earn + Futuros), Kraken (Spot + Margen + Futuros), Binance (Spot + Fondos + Earn + Futuros), OKX, Bybit e importación de historial API (`/history`).
- **On-chain**: consulta gratuita de BTC (`mempool.space`), Ethereum, Arbitrum, Base, Polygon y Solana.
- **IA**: Copiloto conversacional multi-turno (Gemini / OpenAI / Anthropic / Local sin clave), autocategorización de comercios desconocidos y lectura de extractos/capturas.

## Archivos
- `index.html` + `css/app.css` + `js/*.js`: aplicación modular completa.
- `worker.js`: Worker `w6`.
- `sw.js`: caché `finanzas-v12-13` con modo sin conexión.
- `tests/smoke.py`: batería integral en navegador.
- `tests/worker_smoke.mjs`: pruebas de rutas, CORS, TOKEN y KV del Worker `w6`.
- `tools/`: generación de mapa y sincronización de versión.
