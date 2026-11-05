# Finanzas v7 · Posición financiera

PWA privada y local-first para ver patrimonio, cuentas, movimientos, inversiones, riesgo, fiscalidad orientativa y análisis asistido. El navegador conserva los datos; el Worker gratuito añade sincronización cifrada, precios, exchanges, mercado e IA opcional.

## Publicar
1. Copia **todo el contenido** de `1_CODIGO_GITHUB` en la raíz del repositorio y reemplaza.
2. GitHub Desktop: commit `Finanzas v7 final` → **Push origin**.
3. Espera el visto verde de **Prueba Finanzas** en Actions.
4. Cloudflare: reemplaza el código del Worker por `worker.js` y pulsa **Deploy**. Debe responder **w5**.

## Contratos que no se cambian
`caudal_v1`, `caudal:`, `X-Caudal-Token` y el binding KV `CAUDAL`. El `id` del manifest continúa siendo `finanzas-app`.

## Worker mínimo
- Secret `TOKEN` de 20 caracteres o más.
- Secret `ALLOWED_ORIGIN` igual al origen de GitHub Pages, por ejemplo `https://usuario.github.io`, sin barra final.
- Binding KV llamado exactamente `CAUDAL`.

### IA opcional
- Gemini: `GEMINI_API_KEY`; modelo opcional `GEMINI_MODEL` (por defecto `gemini-2.5-flash`). La clave se crea en Google AI Studio; una suscripción Gemini Pro no sustituye la clave de API.
- OpenAI: `OPENAI_API_KEY`, opcional `OPENAI_MODEL`.
- Anthropic: `ANTHROPIC_API_KEY`, opcional `ANTHROPIC_MODEL`.
- Compatible con OpenAI: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
- El modo Local funciona sin clave y no envía datos.

### Exchanges opcionales, siempre solo lectura
- Binance: `BINANCE_KEY`, `BINANCE_SECRET`.
- Kraken: `KRAKEN_KEY`, `KRAKEN_SECRET`.
- KuCoin: `KUCOIN_KEY`, `KUCOIN_SECRET`, `KUCOIN_PASSPHRASE`.
- OKX: `OKX_KEY`, `OKX_SECRET`, `OKX_PASSPHRASE`.
- Bybit: `BYBIT_KEY`, `BYBIT_SECRET`; `BYBIT_BASE` si corresponde.

Nunca habilites operar, transferir ni retirar.

## Pruebas
```bash
node tests/worker_smoke.mjs
python tests/smoke.py
```
El navegador se prueba en móvil y escritorio; el Worker se prueba sin claves ni red externa.
