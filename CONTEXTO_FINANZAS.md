# CONTEXTO · Finanzas

**Versión actual: v3** (revisión de datos 2)

Finanzas (antes «Caudal») es la app personal de finanzas de Diego: un panel en el portátil y una app en el móvil, en la misma web. Reúne cuenta corriente, gastos, ingresos, inversiones, cripto, derivados e impuestos. Solo la usa Diego (no es pública), pero el repositorio sí es público: **nunca** van datos, claves ni nombres reales en el código.

## 1. Diego y cómo quiere la app
- Español de España, explicaciones muy sencillas y paso a paso. No programa: copia y pega.
- Quiere lo más automático posible: que se actualice sola y hacer el mínimo trabajo.
- Estética como BioPeat: azul noche y dorado, modo claro, bonita, sencilla e interactiva; ver la situación de un vistazo.
- Sin contraseña ni PIN al abrir. Datos sincronizados **solos** entre portátil y móvil (cifrados), sin pisar cambios.
- Ver todo en euros, con opción de USD o BTC.
- Cada operación de inversión guardada, aunque no se vea a simple vista.

## 2. Dónde tiene el dinero (hoy y en el futuro)
- **Banco:** Santander (cuenta y tarjeta). En el futuro, quizá Revolut u otros.
- **Cripto:** Binance, KuCoin, Kraken y otros exchanges. TradingView solo para gráficos (no da datos de cartera).
- **Futuro:** MyInvestor u otros brókeres (fondos, ETF), derivados, futuros y más instrumentos.

## 3. Cómo llegan los datos
| Fuente | Cómo | Automático |
|---|---|---|
| Banco (Santander, Revolut…) | Importar el Excel/CSV del banco (se reconoce solo; si no, se eligen columnas una vez). Los repetidos se ignoran. | Semi (descargar e importar) |
| Exchanges (Binance, Kraken, KuCoin) | Saldos por el **Worker** con claves de solo lectura; historial por CSV para impuestos | Sí (saldos) |
| Precios cripto | Worker o servidor público de Binance (`data-api.binance.vision`) | Sí |
| Precios ETF, fondos, acciones | Worker → Yahoo Finance (ticker en el activo) | Sí |
| Derivados | Futuros USDⓈ-M de Binance por API; el resto a mano | Sí / manual |
- La banca abierta gratuita para particulares (GoCardless/Nordigen) está cerrada a nuevos usuarios; las alternativas (Enable Banking «restricted production», open-banking.io ~3 €/mes) se estudiarán más adelante.

## 4. El Worker de Cloudflare (`worker.js`)
- Gratis (100.000 peticiones/día). Rutas: `/ping`, `/balances`, `/prices`, `/hist`, `/sync/<id>`. Todas exigen la cabecera `X-Caudal-Token` = secreto `TOKEN`.
- El Worker de Diego se llama «finanzas» en Cloudflare; el KV está enlazado como `CAUDAL` (nombre antiguo, se mantiene).
- Secretos: `TOKEN`; `BINANCE_KEY`/`BINANCE_SECRET`; `KRAKEN_KEY`/`KRAKEN_SECRET`; `KUCOIN_KEY`/`KUCOIN_SECRET`/`KUCOIN_PASSPHRASE`. KV enlazado como `CAUDAL`.
- Binance: spot, cuenta de fondos, Simple Earn (flexible y bloqueado) y futuros USDⓈ-M (saldo con resultado no realizado y posiciones).
- Las claves de los exchanges **nunca** están en la app ni en GitHub, solo como secretos del Worker.

## 5. Datos de la app (`state`, guardado en `localStorage` con la clave `caudal_v1`, nombre antiguo que se mantiene)
- `accounts` (kind: bank, exchange, broker, wallet, cash), `tx` (movimientos bancarios), `ledger` (cambios de activos), `assets`, `derivs`, `goals` (objetivos de ahorro: name, target, saved o acc, date), `costs`, `prices`, `hist`, `snaps` (patrimonio diario), `apiBal`, `rules` (id `r:COMERCIO`), `budgets`, `settings`, `deleted` (lápidas), `stamps` (fechas de cambio de mapas y ajustes), `dirty` (contador de cambios sin subir).
- **Sincronización (v2):** cifrado AES-GCM en el navegador con `settings.sync`. `change()` → `stampChanges()` pone `_m` a cada elemento cambiado (siempre mayor que el anterior, aunque los relojes no coincidan). `mergeStates()` mezcla elemento a elemento (gana el `_m` mayor), clave a clave en `MAPS` y en los ajustes `SHARED`; lo borrado se queda borrado. `syncNow()`: baja si la versión de la nube cambió, mezcla y sube solo si hay cambios locales (`dirty` ≠ `pushed`). Se lanza al abrir, al volver a la app, al recuperar internet, 1,5 s después de cada cambio y cada minuto. `LOCAL_ONLY` (worker, token, sync, lastSync, lastRemote, lastPush, pushed) nunca se sube. Vincular = abrir el enlace `#pair=…`.

## 5b. Fiscalidad (España)
- Método **FIFO** global por activo (`taxCompute`). Permutas cripto-cripto tributan. Retiradas y depósitos entre cuentas propias se emparejan (`matchTransfers`) y no tributan.
- Recompensas (staking, intereses) = rendimiento a valor de mercado; también crean coste de adquisición.
- Derivados: resultado realizado (futuros de Binance por CSV y posiciones cerradas a mano).
- Base del ahorro: 19 % hasta 6.000 €, 21 % hasta 50.000 €, 23 % hasta 200.000 €, 27 % hasta 300.000 €, 30 % más.
- Borrador agrupado por moneda y tipo de contraprestación (fiat / otra moneda virtual), CSV y texto para la IA o el gestor. Modelo 721 si el saldo a 31/12 en exchanges extranjeros supera 50.000 €.
- Siempre «orientativo, no es asesoramiento fiscal».

## 6. Aspecto
- Estilo de app de banco + inversión (Revolut, Trade Republic): fondo azul noche (#0a1020), tarjetas planas, un solo acento dorado (#e8b75a) y verde/rojo solo para subir/bajar. Modo claro. Cifras grandes con los céntimos más pequeños (moneyBig). Iconos de línea (ico()), sin emojis.
- Logo: tres barras doradas que suben y una línea verde de tendencia sobre fondo azul noche.
- Portátil: barra lateral + rejilla de 12 columnas. Móvil (<1024 px): barra superior mínima (sincronización, ocultar importes, tema) y 4 pestañas abajo: Inicio, Gastos, Inversiones, Más. Sin botón «+»: los gastos llegan al importar el extracto. Las ventanas son hojas que suben desde abajo.
- Gráficos táctiles (arrastrar el dedo): svgLine (patrimonio e inversiones), svgCompare (gasto acumulado del mes frente al pasado), svgDays (gasto por día), svgMonths (12 meses), donut.

## 7. Pantallas
- **Inicio:** patrimonio con gráfica y periodos (1S, 1M, 6M, 1A, Máx); tarjeta del mes (gastado, comparación con el mes pasado, «puedes gastar X € al día», ingresos, previsión, colchón); tarjetas de cuentas deslizables; «Lo importante» en fichas; en qué gastas; ingresos y gastos 12 meses; próximos cargos; últimos movimientos; avisos.
- **Gastos:** meses en botones, gastado/ingresos/balance, barras por día (tocar un día filtra), categorías (tocar filtra), buscador, tipo (gastos, ingresos, todo, internos) y lista por días. Tocar un movimiento = cambiar categoría (aprende para el mismo comercio).
- **Inversiones:** valor, cambio de hoy y resultado total; gráfica del valor (fotos diarias); reparto; activos con color propio, 24 h y resultado; por cuenta; historial; derivados.
- **Más:** Objetivos (metas y presupuestos), Impuestos, Cuentas, Importar, Ajustes, Copia; sincronizar y apuntar un gasto en efectivo (quickAdd).
- Cálculos: liquidity, cushion, pace, forecast, safeToSpend, upcoming, topMerchants, dailySpend, insights, invSeries.

## 8. Cómo está hecho el código
- Un solo `index.html` con un único `<script id="app">` y un `<style id="app-style">` que acaba en `</style><!--FIN-CSS-->`.
- Todo cambio de datos con `change(()=>{…},'mensaje')` (permite deshacer). `render()` repinta la vista actual.
- `actualizar.html` aplica los cambios de la IA y prueba la app en una caja aislada. `tests/smoke.py` prueba todo en GitHub.

## 9. Historial (una línea por versión, máximo 8)
- **v3 · Copilot:** Rediseño completo tipo app de banco e inversión: pestañas Inicio, Gastos, Inversiones y Más; patrimonio con gráfica táctil, tarjetas de cuentas, gasto del mes frente al anterior, «puedes gastar X al día», gasto por día, cartera con colores por activo, hojas que suben desde abajo en el móvil y app instalable de nuevo.
- **v2 · Copilot:** Nueva app «Finanzas»: diseño azul noche y dorado con modo claro, menú lateral, botón rápido para añadir, gráficos interactivos, ideas del mes, previsión, colchón, próximos cargos, objetivos de ahorro, calendario de gastos y sincronización automática por cambios (sin pisar datos entre dispositivos).
- **v1 · Copilot:** Primera versión: cuentas, movimientos con categorías automáticas, importación de Santander/Revolut/Binance/Kraken/KuCoin, cartera con precios en vivo, derivados, fiscalidad FIFO con borrador, presupuestos, alertas, sincronización cifrada y conexión con exchanges por un Worker.

## 10. Pendiente / ideas
- Conexión directa con el banco (banca abierta) si aparece una opción fiable y barata.
- Importadores específicos de MyInvestor y otros brókeres cuando Diego los use.
- Objetivos de ahorro y simulador de interés compuesto.
