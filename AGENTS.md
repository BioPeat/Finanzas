# AGENTS.md · Reglas para la IA que programa Finanzas

Lo usan el Gem de Gemini «Finanzas Dev» y el proyecto de Claude «Finanzas Dev». Responde siempre en español de España, de forma clara. Diego no programa: nunca le pidas que edite código a mano.

## 1. Flujo de cambios
1. Diego descarga desde `actualizar.html` un archivo enfocado y lo adjunta a la IA.
2. Entrega bloques `@@@ BUSCAR n` / `@@@ CAMBIAR POR` / `@@@ FIN` dentro de un único bloque de código.
3. `actualizar.html` aplica los bloques sobre una copia, protege los datos y recorre las pantallas en una caja aislada.
4. Si Diego pega un mensaje que empieza por **CORREGIR**, devuelve solo los bloques corregidos con el mismo número y empieza por `@@@ SOLO CORREGIDOS`.
5. GitHub ejecuta `tests/smoke.py` y actualiza `CONTEXTO_FINANZAS.md` y `MAPA_DEL_CODIGO.md`.

## 2. Reglas técnicas
- Todo el JavaScript va dentro de `<script id="app">`; todo el CSS dentro de `<style id="app-style">`. No añadas otro script o style.
- Define cada función una sola vez. No reasignes ni envuelvas funciones existentes.
- Sube `APP_VERSION` exactamente 1 y añade `   vNN · Gemini · resumen` al Registro de cambios. Sube `APP_REVISION` solo si cambia el modelo de datos y adapta `migrate()`.
- Todo cambio de datos pasa por `change(()=>{…},'mensaje')`. Los cachés usan `save(false)`.
- No cambies `STORE='caudal_v1'`, `migrate`, `save`, `render`, `syncNow`, `mergeStates`, `stampChanges`, `taxCompute`, `LOCAL_ONLY` ni el prefijo `'caudal:'`.
- Una lista sincronizada nueva con `id` va en `LISTS`; un mapa en `MAPS`; un ajuste compartido en `SHARED`.
- Nunca pongas datos personales, claves API o nombres reales en el repositorio público.
- Fechas: `AAAA-MM-DD` o `AAAA-MM-DD HH:MM:SS`. Importes base en euros.
- No prometas exactitud fiscal ni asesoramiento: los cálculos son orientativos y deben poder auditarse.

## 3. Regla obligatoria: cero servicios de pago
- Primero usa procesamiento local, importación de extractos o APIs oficiales/públicas desde la app o el Worker ya existente.
- No añadas servicios de pago, pruebas que luego cobren, suscripciones ni planes «freemium» que necesiten tarjeta.
- Si una conexión bancaria o de bróker no tiene API personal oficial y gratuita, mantenla por importación CSV/XLSX/OFX/QFX/QIF. Explícalo sin prometer automatización.
- Un servicio externo solo se admite si es gratuito. Si requiere configuración, actualiza `GUIA_PASO_A_PASO.txt` con instrucciones de clic a clic para principiantes.
- Claves de exchanges: siempre solo lectura y solo como secretos de Cloudflare. Nunca permisos de operar, transferir o retirar.

## 4. Datos e integraciones
- Bancos: `state.tx`. Importación universal mediante `readFile`, `detect`, `parseBank`, `openMapper`, `parseOFX` y `parseQIF`; sin duplicados.
- Inversiones: `state.ledger`; operaciones o snapshots de posiciones. Los snapshots sustituyen el snapshot anterior de la misma fuente y no sirven por sí solos para impuestos.
- APIs automáticas oficiales en `worker.js`: Binance, Kraken, KuCoin, OKX y Bybit. Añade conectores nuevos en `EXCHANGES`, aísla fallos y conserva los demás.
- Precios: `state.prices`; históricos: `state.hist`. Las llamadas externas deben tener timeout y fallback.
- Gráficos: `assetDetail`, `tvSymbol` y `tradingViewURL`. TradingView es visual; la app sigue siendo responsable de saldos y costes.
- Sincronización: copia cifrada AES-GCM. Nunca subas texto financiero sin cifrar.

## 5. Diseño v4
- Estética deliberada, no «AI slop»: jerarquía tipográfica, espacio, alineación y una acción principal; evita degradados decorativos, tarjetas repetidas sin función, brillos, blobs, emojis y textos de relleno.
- Sigue principios públicos de Apple: claridad, deferencia al contenido, profundidad solo cuando ayuda, adaptación real al dispositivo, controles táctiles, contraste, estados perceptibles y respeto por `prefers-reduced-motion`.
- Paleta: usa variables (`--bg`, `--panel`, `--ink`, `--brand`, `--up`, `--down`, etc.). Comprueba modo claro y oscuro.
- Escritorio: barra lateral y panel analítico denso. Móvil: `vResumenMobile`, cuatro pestañas abajo y menú lateral `drawer`; no copies el dashboard de escritorio en una columna.
- Táctil: objetivo mínimo de 44 px, feedback de pulsación, nada importante solo en hover. Animaciones cortas y funcionales; sin animación si el usuario reduce movimiento.
- Iconos de línea con `ico()`, no emojis. Cifras con `money()`, `nf()` y `pct()`.

## 6. En cada entrega
- Máximo 10 bloques y unas 200 líneas; divide en partes si hace falta.
- Comprueba sintaxis, modo claro/oscuro, escritorio/móvil, teclado, menú, importación, sincronización, activos y todas las vistas.
- Actualiza pruebas cuando añadas una función importante.
- No digas que una API real funciona si solo la has probado con respuestas simuladas; indícalo expresamente.
