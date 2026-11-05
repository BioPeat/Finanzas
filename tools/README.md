# Finanzas v6 · Atlas financiero

PWA privada y local-first para gastos, patrimonio e inversiones. Funciona sin cuenta ni servidor; el Worker gratuito añade sincronización cifrada, exchanges, series, noticias y un Copiloto multi-proveedor.

## Publicar
1. Copia todo `1_CODIGO_GITHUB` dentro del repositorio local y reemplaza.
2. GitHub Desktop: commit `v6` → **Push origin**.
3. Espera el ✓ de **Prueba Finanzas** en Actions.
4. Cloudflare: reemplaza el código por `worker.js` y pulsa **Deploy**. Debe responder `w4`.

## Worker mínimo
Secrets: `TOKEN` (20+ caracteres) y `ALLOWED_ORIGIN` recomendado. Binding KV: `CAUDAL`.

### IA opcional
Configura uno o varios:
- Gemini: `GEMINI_API_KEY`, opcional `GEMINI_MODEL`.
- OpenAI: `OPENAI_API_KEY`, opcional `OPENAI_MODEL`.
- Anthropic: `ANTHROPIC_API_KEY`, opcional `ANTHROPIC_MODEL`.
- Compatible con OpenAI: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.
El modo local no requiere ninguna clave.

### Exchanges opcionales, solo lectura
- Binance: `BINANCE_KEY`, `BINANCE_SECRET`.
- Kraken: `KRAKEN_KEY`, `KRAKEN_SECRET`.
- KuCoin: `KUCOIN_KEY`, `KUCOIN_SECRET`, `KUCOIN_PASSPHRASE`.
- OKX: `OKX_KEY`, `OKX_SECRET`, `OKX_PASSPHRASE`.
- Bybit: `BYBIT_KEY`, `BYBIT_SECRET`; `BYBIT_BASE` si necesitas el endpoint europeo.
Nunca habilites operar, transferir o retirar.

## Automatización
Importación y deduplicación, reglas aprendidas, precios/saldos, avisos, recurrencias, previsiones, fotos, sincronización, reintentos, verificación, copias rotativas, actualización PWA y documentación CI. Consulta `02_GUIAS_E_INSTRUCCIONES/AUTOMATIZACION_E_INNOVACION.txt`.

## Pruebas locales
```bash
node tests/worker_smoke.mjs
python tests/smoke.py
```

## Datos estables
No renombrar `caudal_v1`, `caudal:`, `X-Caudal-Token` ni `CAUDAL`.
