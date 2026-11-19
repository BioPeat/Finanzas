# Finanzas v12 · Centro de Control Financiero

PWA privada y local-first para controlar desde un mismo sitio todas tus cuentas bancarias (Santander, Revolut y cualquier banco), exchanges (KuCoin, Kraken, Binance, OKX, Bybit), brókeres, wallets on-chain, derivados en vivo, gráficos interactivos, fiscalidad FIFO en España y Copiloto IA con Gemini.

## Cómo publicar y actualizar (1 solo commit)
1. En **GitHub Desktop**: revisa los cambios → escribe un mensaje (ej. `Finanzas v12`) → **Commit to main** → **Push origin**.
2. Espera el visto verde de **Prueba Finanzas** en la pestaña **Actions** de GitHub.
3. En **Cloudflare Workers & Pages → tu Worker → Edit code**: pega el archivo `worker.js` completo y pulsa **Deploy** (debe responder **w6**).

## Secretos del Worker en Cloudflare (todos gratuitos)

### Obligatorios
- `TOKEN`: contraseña de 20 o más caracteres (debe coincidir con Ajustes → Código TOKEN).
- `ALLOWED_ORIGIN`: origen exacto de tu GitHub Pages sin barra final (ej. `https://tu-usuario.github.io`).
- Binding KV llamado exactamente `CAUDAL`.

### Copiloto IA (Gemini gratuito)
- `GEMINI_API_KEY`: clave gratuita de [Google AI Studio](https://aistudio.google.com).
- `GEMINI_MODEL` (opcional, por defecto intenta `gemini-3.8-flash` y cambia en segundos con enfriamiento automático a `gemini-3.5-flash-lite` si está saturado o sin cuota).

### Exchanges (siempre permisos de SOLO LECTURA)
- **KuCoin (Spot + Futuros)**: `KUCOIN_KEY`, `KUCOIN_SECRET`, `KUCOIN_PASSPHRASE` (opcionales `KUCOIN_FUTURES_*` si usas claves separadas).
- **Kraken Spot**: `KRAKEN_KEY`, `KRAKEN_SECRET`.
- **Kraken Futures**: `KRAKEN_FUTURES_KEY`, `KRAKEN_FUTURES_SECRET`.
- **Binance**: `BINANCE_KEY`, `BINANCE_SECRET`.
- **OKX**: `OKX_KEY`, `OKX_SECRET`, `OKX_PASSPHRASE`.
- **Bybit**: `BYBIT_KEY`, `BYBIT_SECRET`.

### Open Banking PSD2 gratuito (opcional, para Santander/bancos automáticos)
- `ENABLE_BANKING_APP_ID`: ID de aplicación en [Enable Banking](https://enablebanking.com) (uso personal).
- `ENABLE_BANKING_PRIVATE_KEY`: clave privada RSA en formato PEM PKCS#8.

## Contratos estables
`caudal_v1`, `caudal:`, `X-Caudal-Token`, KV `CAUDAL` y `id` `finanzas-app` se mantienen intactos para conservar tus datos.

## Pruebas automáticas
```bash
node tests/worker_smoke.mjs
python tests/smoke.py
```
