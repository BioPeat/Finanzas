# AGENTS.md · Reglas para la IA que programa Finanzas

Lo usan el Gem de Gemini «Finanzas Dev» y el proyecto de Claude «Finanzas Dev». Responde en español de España. Diego no programa: no le pidas que edite código manualmente.

## 1. Flujo
1. Diego descarga desde `actualizar.html` un archivo enfocado.
2. La IA devuelve bloques `@@@ BUSCAR n` / `@@@ CAMBIAR POR` / `@@@ FIN`.
3. `actualizar.html` aplica y prueba sobre una copia.
4. GitHub ejecuta `tests/smoke.py`, `tests/worker_smoke.mjs` y regenera contexto/mapa.

## 2. Reglas que protegen datos
- JavaScript dentro de `<script id="app">`; CSS dentro de `<style id="app-style">`.
- Una sola definición de cada función; nada de parches, reasignaciones o scripts paralelos.
- Sube `APP_VERSION` exactamente 1 y añade una línea al Registro de cambios. `APP_REVISION` solo cambia si cambia el modelo de datos y existe migración.
- Todo cambio de usuario pasa por `change()`. Cachés: `save(false)`.
- No cambies `STORE='caudal_v1'`, el prefijo `caudal:`, `X-Caudal-Token`, el KV `CAUDAL`, `migrate`, `save`, `render`, `syncNow`, `mergeStates`, `stampChanges`, `taxCompute` ni `LOCAL_ONLY`.
- Nunca incluyas datos personales, extractos, claves, TOKEN ni enlaces de vinculación.
- El TOKEN puede permanecer en `state.settings.token`, pero **nunca se imprime en HTML**. `set-token` debe ser `type="password"`, vacío y conservar el secreto existente cuando no se introduce otro.

## 3. Cero servicios de pago
- Prioridad: procesamiento local, extractos y APIs oficiales/públicas gratuitas.
- Prohibidos suscripciones, tarjetas, pruebas de pago y agregadores bancarios comerciales.
- Si no hay API personal oficial y gratuita, se mantiene CSV/XLSX/OFX/QFX/QIF.
- Claves de exchange: solo lectura y solo como secretos del Worker. Nunca operar, transferir o retirar.

## 4. Datos e integraciones
- Bancos: `state.tx`; inversión: `state.ledger`; snapshots sustituyen la misma fuente.
- Worker: Binance, Kraken, KuCoin, OKX y Bybit; fallos aislados y timeout.
- Precios en `state.prices`; históricos en `state.hist`; TradingView solo visual.
- Sincronización AES-GCM; el Worker recibe un blob ilegible.
- Fiscalidad siempre orientativa, auditable y con límites explicados.

## 5. Diseño v5
- Prioridades: patrimonio; separación cuentas/inversiones; subida/bajada; resultado acumulado de inversión; ingresos y gastos.
- Modo oscuro por defecto, cambio sencillo.
- Ordenador: dashboard denso con KPIs y detalle simultáneo. Móvil: vista específica para pulgar, no el escritorio apilado.
- Navegación móvil principal: Inicio, Gastos, Invertir y Cuentas. Impuestos y Plan son secundarios. No reintroduzcas una pantalla «Más» redundante.
- Gestos existentes: borde izquierdo → menú; horizontal → vistas principales; hoja hacia abajo → cerrar. Todo gesto necesita alternativa visible por botón.
- Targets de 44 px cuando sea posible, foco visible, teclado, contraste y `prefers-reduced-motion`.
- Animación breve para continuidad y feedback, no decoración. Sin brillos, blobs, degradados gratuitos, emojis ni tarjetas repetidas sin función.
- Evita porcentajes engañosos con bases casi cero. Distingue rentabilidad de movimientos de efectivo siempre que los datos lo permitan.

## 6. En cada entrega
- Actualiza pruebas cuando cambie una función importante.
- Comprueba escritorio y móvil, temas, teclado, gestos, Añadir, importación, precios, activos, sincronización y todas las vistas.
- No afirmes que una API real funciona si solo se ha simulado.
- Mantén `actualizar.html`, contexto, mapa, guía e instrucciones alineados con la versión.
