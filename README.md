# Finanzas v4

Panel personal para portátil y PWA móvil: bancos, gastos, inversiones, cripto, derivados, objetivos e impuestos.

## Lo importante
- **Sin cuotas:** no usa servicios de pago.
- **Bancos y brókeres:** importa CSV, Excel, OFX, QFX o QIF. Si el formato es desconocido, eliges las columnas.
- **Exchanges automáticos:** APIs oficiales de solo lectura para Binance, Kraken, KuCoin, OKX y Bybit mediante `worker.js`.
- **Gráficos:** TradingView integrado en cada activo, sin cuenta ni clave.
- **Privacidad:** datos locales y copia cifrada AES-GCM en el Worker. El repositorio no lleva datos ni secretos.

Lee `GUIA_PASO_A_PASO.txt` antes de actualizar. Para cambios con IA usa `actualizar.html`, `AGENTS.md`, `CONTEXTO_FINANZAS.md` y `MAPA_DEL_CODIGO.md`.

Prueba local: `python tests/smoke.py`.

Se conservan los nombres internos `caudal_v1`, `caudal:`, `X-Caudal-Token` y `CAUDAL` para no perder datos existentes.
