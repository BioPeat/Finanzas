# CONTEXTO · Finanzas

**Versión actual: v4** (revisión de datos 2)

Finanzas es la app personal de Diego: panel analítico en portátil y app móvil en la misma PWA. Reúne bancos, tarjetas, efectivo, inversión tradicional, cripto, derivados, objetivos e impuestos. El repositorio es público; nunca contiene datos personales ni claves.

## 1. Criterios del usuario
- Español de España y pasos muy sencillos. Diego no programa.
- Automatizar todo lo posible con procesamiento local, APIs oficiales gratuitas y el Worker de Cloudflare ya montado.
- Prohibidos servicios de pago. Si un banco o bróker no ofrece una API personal oficial y gratuita, se usa importación de extractos.
- Sin PIN; datos cifrados y sincronizados entre portátil y móvil. Moneda visible EUR, USD o BTC.
- Cada operación se conserva para auditoría e impuestos; el resumen no debe abrumar.

## 2. Fuentes de datos
| Fuente | Método | Automático |
|---|---|---|
| Cualquier banco/tarjeta | CSV, XLSX, OFX, QFX o QIF; detector o selector de columnas | Importación |
| Cualquier bróker/app | Historial CSV/XLSX con selector de columnas, o snapshot de posiciones | Importación |
| Binance | API oficial: spot, funding, Earn y futuros USDⓈ-M | Sí |
| Kraken | API oficial de saldo | Sí |
| KuCoin | API oficial de cuentas | Sí |
| OKX | API oficial V5 de saldo | Sí |
| Bybit | API oficial V5 de cuenta unificada | Sí |
| Precios cripto | APIs públicas de Binance, KuCoin y Kraken | Sí |
| Acciones/ETF/fondos | Endpoint público de cotización, con ticker indicado por el usuario | Sí, mientras responda |
| Gráficos | Widget gratuito de TradingView integrado por activo | Sí, visual |

No se integra banca abierta de pago. Para Santander, MyInvestor y cualquier entidad sin API personal oficial y gratuita: exportar e importar.

## 3. Worker de Cloudflare
- `worker.js` v2. Rutas autenticadas: `/ping`, `/balances`, `/prices`, `/hist`, `/sync/<id>`.
- Obligatorio: `TOKEN` largo y KV enlazado como `CAUDAL` (nombres heredados). Recomendado: `ALLOWED_ORIGIN` con el origen de GitHub Pages.
- Secretos opcionales: `BINANCE_KEY`/`BINANCE_SECRET`; `KRAKEN_KEY`/`KRAKEN_SECRET`; `KUCOIN_KEY`/`KUCOIN_SECRET`/`KUCOIN_PASSPHRASE`; `OKX_KEY`/`OKX_SECRET`/`OKX_PASSPHRASE`; `BYBIT_KEY`/`BYBIT_SECRET`.
- Todas las claves son solo lectura. Los conectores fallan por separado y tienen timeout.

## 4. Datos y sincronización
- Clave local heredada: `caudal_v1`. No cambiar.
- `accounts`, `tx`, `ledger`, `assets`, `derivs`, `goals`, `costs`, `prices`, `hist`, `snaps`, `apiBal`, `rules`, `budgets`, `settings`, `deleted`, `stamps` y `dirty`.
- Cambios por `change()` y marcas `_m`; `mergeStates()` mezcla elemento a elemento. AES-GCM en el navegador; el Worker solo guarda el blob cifrado.
- Sincroniza al abrir, volver, recuperar conexión, tras cambios y cada minuto. Precios no cuentan como cambio del usuario.

## 5. Importación universal
- `readFile`: JSON, XLSX, CSV/TXT, OFX/QFX y QIF.
- `FORMATS`, `detect`, `parseBank` y `parseLedger`: formatos conocidos.
- `openMapper`: archivos desconocidos. Tipo: banco, operaciones de inversión o snapshot de posiciones.
- `openPositionsImport`: sustituye el snapshot anterior de la misma fuente para evitar duplicados. Un snapshot no sustituye el historial para FIFO.

## 5b. Fiscalidad
- FIFO global por activo, permutas, recompensas y derivados cerrados. Modelo 721 orientativo.
- Exporta CSV y texto para IA/gestor. Siempre «orientativo, no asesoramiento fiscal»; no sustituye a un profesional.

## 6. Diseño v4
- Sistema visual neutro grafito/blanco con azul de acción; verde/rojo solo semánticos. Sin decoración gratuita.
- Principios: claridad, contenido primero, adaptación al dispositivo, targets táctiles, contraste y `prefers-reduced-motion`.
- Escritorio: barra lateral y dashboard de 12 columnas con patrimonio, mes, cuentas, categorías, evolución, cargos y alertas.
- Móvil: `vResumenMobile` propio; patrimonio, dos indicadores esenciales, cuentas, alertas, principales inversiones y últimos movimientos. Cuatro tabs y menú desplegable lateral.
- `assetDetail`: cotización, posición, gráfico TradingView, símbolo corregible y operaciones.

## 7. Pantallas
- Inicio escritorio y móvil, Gastos, Inversiones, Objetivos, Impuestos, Cuentas, Ajustes y Más.
- Modo claro/oscuro, ocultar importes, gráficos táctiles, filtros, reglas aprendidas, presupuestos, previsión, colchón y próximos cargos.

## 8. Estructura del repositorio
- `index.html`: app completa.
- `worker.js`: backend Cloudflare.
- `actualizar.html`: aplica cambios de Gemini/Claude en una caja aislada.
- `AGENTS.md`, este contexto, `MAPA_DEL_CODIGO.md`.
- `GUIA_PASO_A_PASO.txt` e `INSTRUCCIONES_GEM_Y_CLAUDE.txt`.
- `tests/smoke.py`, datos de ejemplo, `tools/` y workflow de GitHub.

## 9. Historial
- **v4 · Copilot:** Panel adaptativo inspirado en los principios públicos de Apple, inicio móvil propio, menú desplegable y animaciones accesibles; importación universal CSV/XLSX/OFX/QIF y snapshots; gráficos TradingView por activo; conexiones automáticas oficiales para Binance, Kraken, KuCoin, OKX y Bybit; seguridad y diagnóstico reforzados.
- **v3 · Copilot:** Rediseño completo tipo app de banco e inversión: pestañas Inicio, Gastos, Inversiones y Más; patrimonio con gráfica táctil, tarjetas de cuentas, gasto del mes frente al anterior, «puedes gastar X al día», gasto por día, cartera con colores por activo, hojas que suben desde abajo en el móvil y app instalable de nuevo.
- **v2 · Copilot:** Nueva app «Finanzas»: diseño azul noche y dorado con modo claro, menú lateral, botón rápido para añadir, gráficos interactivos, ideas del mes, previsión, colchón, próximos cargos, objetivos de ahorro, calendario de gastos y sincronización automática por cambios (sin pisar datos entre dispositivos).
- **v1 · Copilot:** Primera versión: cuentas, movimientos con categorías automáticas, importación de Santander/Revolut/Binance/Kraken/KuCoin, cartera con precios en vivo, derivados, fiscalidad FIFO con borrador, presupuestos, alertas, sincronización cifrada y conexión con exchanges por un Worker.

## 10. Pendiente / límites honestos
- Probar OKX y Bybit con claves reales de Diego; las pruebas automatizadas usan respuestas simuladas.
- Los endpoints públicos de precios pueden cambiar o limitar llamadas. La app conserva el último precio y muestra errores.
- Banca abierta directa solo si aparece una opción personal, oficial y gratuita; no usar proveedores de pago.
- Adaptar importadores específicos cuando haya un archivo real que el selector universal no interprete bien.
