# CONTEXTO · Caudal

**Versión actual: v1** (revisión de datos 1)

Caudal es la app personal de finanzas de Diego: un panel en el portátil y una app en el móvil, en la misma web. Reúne cuenta corriente, gastos, ingresos, inversiones, cripto, derivados e impuestos. Solo la usa Diego (no es pública), pero el repositorio sí es público: **nunca** van datos, claves ni nombres reales en el código.

## 1. Diego y cómo quiere la app
- Español de España, explicaciones muy sencillas y paso a paso. No programa: copia y pega.
- Quiere lo más automático posible: que se actualice sola y hacer el mínimo trabajo.
- Estética profesional que **no parezca hecha por IA**: nada de degradados morados, sombras en todo, tarjetas iguales en fila ni emojis como iconos (ver apartado 6).
- Sin contraseña ni PIN al abrir. Datos sincronizados entre portátil y móvil (cifrados).
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
- Secretos: `TOKEN`; `BINANCE_KEY`/`BINANCE_SECRET`; `KRAKEN_KEY`/`KRAKEN_SECRET`; `KUCOIN_KEY`/`KUCOIN_SECRET`/`KUCOIN_PASSPHRASE`. KV enlazado como `CAUDAL`.
- Binance: spot, cuenta de fondos, Simple Earn (flexible y bloqueado) y futuros USDⓈ-M (saldo con resultado no realizado y posiciones).
- Las claves de los exchanges **nunca** están en la app ni en GitHub, solo como secretos del Worker.

## 5. Datos de la app (`state`, guardado en `localStorage` con la clave `caudal_v1`)
- `accounts` (kind: bank, exchange, broker, wallet, cash; `api` = binance/kraken/kucoin; `reportsSpain` = la plataforma informa a Hacienda), `tx` (movimientos bancarios), `ledger` (cambios de activos: trade, deposit, withdraw, fee, reward, move, deriv), `assets` (clase y ticker de Yahoo), `derivs` (posiciones a mano), `costs` (coste que completa el usuario), `prices`, `hist` (precios históricos), `snaps` (patrimonio diario), `apiBal`, `rules` (categorías aprendidas), `budgets`, `settings`, `deleted` (lápidas para la sincronización).
- **Sincronización:** el estado se cifra en el navegador (AES-GCM) con `settings.sync` (clave aleatoria que solo está en los dispositivos) y se guarda en el KV. Mezcla por id (`mergeStates`). `worker`, `token`, `sync` y `lastSync` nunca se sincronizan. Vincular el móvil = abrir el enlace `#pair=…`.

## 5b. Fiscalidad (España)
- Método **FIFO** global por activo (`taxCompute`). Permutas cripto-cripto tributan. Retiradas y depósitos entre cuentas propias se emparejan (`matchTransfers`) y no tributan.
- Recompensas (staking, intereses) = rendimiento a valor de mercado; también crean coste de adquisición.
- Derivados: resultado realizado (futuros de Binance por CSV y posiciones cerradas a mano).
- Base del ahorro: 19 % hasta 6.000 €, 21 % hasta 50.000 €, 23 % hasta 200.000 €, 27 % hasta 300.000 €, 30 % más.
- Borrador agrupado por moneda y tipo de contraprestación (fiat / otra moneda virtual), CSV y texto para la IA o el gestor. Modelo 721 si el saldo a 31/12 en exchanges extranjeros supera 50.000 €.
- Siempre «orientativo, no es asesoramiento fiscal».

## 6. Aspecto
- Dirección «papel y tinta» (prensa financiera): fondo `#f5f3ee`, tinta `#1b1a17`, marca verde `#0f5c49`; modo oscuro cálido `#121211`. Títulos y cifras grandes en serif (`--serif`), texto en la fuente del sistema, cifras tabulares.
- Bordes de 1 px, radio 6 px, **sin sombras ni degradados**. Etiquetas pequeñas en mayúsculas con espaciado. Iconos de línea propios (`ico()`), nunca emojis.
- Portátil: barra lateral + rejilla de 12 columnas. Móvil (<1024 px): pestañas abajo (Resumen, Gastos, Inversiones, Cuentas, Más) y ventanas como hoja inferior.

## 7. Pantallas
- **Resumen:** patrimonio neto con evolución (1M, 6M, 1A, Todo) y reparto; mes en curso (ingresos, gastos, ahorro); avisos; gastos por categoría; presupuestos; cuentas; 12 meses de ingresos y gastos; últimos movimientos; gastos fijos detectados.
- **Movimientos:** búsqueda y filtros, por días; tocar = cambiar categoría (aprende para el mismo comercio).
- **Inversiones:** por activo, por cuenta u operaciones; coste FIFO y resultado; derivados.
- **Impuestos:** resumen, por moneda, cada operación, completar datos, 721, CSV y texto para IA.
- **Cuentas** y **Ajustes** (tema, moneda, Worker, sincronización, presupuestos, reglas, copia de seguridad).

## 8. Cómo está hecho el código
- Un solo `index.html` con un único `<script id="app">` y un `<style id="app-style">` que acaba en `</style><!--FIN-CSS-->`.
- Todo cambio de datos con `change(()=>{…},'mensaje')` (permite deshacer). `render()` repinta la vista actual.
- `actualizar.html` aplica los cambios de la IA y prueba la app en una caja aislada. `tests/smoke.py` prueba todo en GitHub.

## 9. Historial (una línea por versión, máximo 8)
- **v1 · Copilot:** Primera versión: cuentas, movimientos con categorías automáticas, importación de Santander/Revolut/Binance/Kraken/KuCoin, cartera con precios en vivo, derivados, fiscalidad FIFO con borrador, presupuestos, alertas, sincronización cifrada y conexión con exchanges por un Worker.

## 10. Pendiente / ideas
- Conexión directa con el banco (banca abierta) si aparece una opción fiable y barata.
- Importadores específicos de MyInvestor y otros brókeres cuando Diego los use.
- Objetivos de ahorro y simulador de interés compuesto.
