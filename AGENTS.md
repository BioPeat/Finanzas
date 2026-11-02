# AGENTS.md · Reglas para la IA que programa Caudal

Lo usan el Gem de Gemini «Caudal Dev» y el proyecto de Claude «Caudal Dev». Escribe siempre en español de España, claro y corto. Diego no programa: nunca le pidas que edite código a mano.

## 1. Cómo funciona el flujo
1. Diego descarga en `actualizar.html` (Paso 1) un archivo enfocado con los trozos del código relacionados con su petición. Si te falta una función, no la inventes: pide su nombre.
2. Respondes con bloques `@@@ BUSCAR n` / `@@@ CAMBIAR POR` / `@@@ FIN` dentro de un único bloque de código.
3. `actualizar.html` aplica los bloques sobre una copia, comprueba las reglas y arranca la app en una caja aislada recorriendo todas las pantallas.
4. Si sale rojo, Diego te pega un mensaje que empieza por **CORREGIR**: entrega solo los bloques que cambian, con su mismo número, empezando por `@@@ SOLO CORREGIDOS`.
5. Diego sube el `index.html` con GitHub Desktop. GitHub vuelve a probarlo todo (`tests/smoke.py`) y actualiza solo `CONTEXTO_CAUDAL.md` (versión e historial) y `MAPA_DEL_CODIGO.md`.

## 2. Reglas del código
- Todo el JavaScript va dentro de `<script id="app">`; todo el CSS dentro de `<style id="app-style">`. **Prohibido** otro `<script>` u otro `<style>`. Para CSS nuevo: BUSCAR `</style><!--FIN-CSS-->` y pon tu CSS delante.
- Cada función se define una sola vez. Prohibido «envolver» funciones (`x=function…`, `window.x=…`): cámbialas en su sitio.
- Sube `APP_VERSION` exactamente 1 y añade la línea en el «Registro de cambios»: `   vNN · Gemini · (qué cambia, una frase).` con 3 espacios delante. GitHub la copia al historial.
- Si cambias la forma de los datos guardados, sube `APP_REVISION` y adapta `migrate()` para que los datos antiguos sigan funcionando.
- Todo cambio de datos dentro de `change(()=>{…},'mensaje')`. Los cachés (precios) usan `save(false)`.
- Nunca cambies ni quites: `STORE='caudal_v1'`, `migrate`, `save`, `render`, `syncNow`, `mergeStates`, `taxCompute`, `LOCAL_ONLY`, el prefijo `'caudal:'` de `syncId`.
- Nunca pongas datos reales, claves ni nombres de personas en el código: el repositorio es público.
- Líneas cortas; sin plantillas con comillas invertidas anidadas dentro de `${}`; construye trozos con `+`.
- Fechas en formato `AAAA-MM-DD` (y `AAAA-MM-DD HH:MM:SS` en `ledger.t`). Importes en euros salvo que se indique.

## 3. Datos (resumen; detalle en CONTEXTO_CAUDAL.md)
- Movimientos bancarios en `state.tx` con categoría (`CATS`, `categorize`, `state.rules`).
- Inversiones como cambios de activos en `state.ledger` (`kind`: trade, deposit, withdraw, fee, reward, move, deriv). Las operaciones de una misma compra/venta comparten `ref` y cuenta.
- Saldos en vivo de los exchanges en `state.apiBal` (vienen del Worker). Precios en `state.prices` (`priceEUR`), históricos en `state.hist` (`priceAt`).
- Formatos de importación en `FORMATS` + `parseBank` / `parseLedger`. Para un banco o exchange nuevo, añade su detección ahí; no escribas otro importador.
- Impuestos: `taxCompute` (FIFO), `taxSummary`, `byCoin`, `modelo721`. Siempre «orientativo».

## 4. Aspecto (que no parezca hecho por IA)
- Paleta «papel y tinta»: usa siempre las variables `--bg`, `--panel`, `--ink`, `--ink2`, `--brand`, `--up`, `--down`, `--warn`, `--c1…--c8`. Funciona solo en modo claro y oscuro.
- Sin degradados, sin sombras, sin emojis como iconos (usa `ico(nombre)` y añade iconos de línea a `ICON`). Bordes de 1 px, radio `var(--r)`.
- Cifras con `money()`, `nf()`, `pct()`; títulos de panel con `<h2>` dentro de `.panel` (salen en mayúsculas pequeñas).
- Móvil primero en el uso: botones de al menos 36-44 px, nada importante solo con «hover». Comprueba que se ve bien por debajo de 1024 px (pestañas abajo).
- Textos directos, en segunda persona, sin relleno: cifras primero.

## 5. En cada cambio
- Respuestas cortas: como máximo 10 bloques y ~200 líneas. Si es más grande, divídelo en PARTES («PARTE 1 de N»); solo la parte 1 sube la versión.
- Autocomprobación antes de entregar: paréntesis, llaves, comillas y backticks cerrados; cada BUSCAR copiado literalmente y único; ningún bloque se solapa.
