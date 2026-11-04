# CONTEXTO · Finanzas

**Versión actual: v5** (revisión de datos 2)

Finanzas es la PWA personal de Diego para reunir bancos, efectivo, inversión tradicional, cripto y derivados sin servicios de pago. El repositorio es público y nunca contiene datos personales ni secretos.

## 1. Prioridades del usuario
- Ver patrimonio total separado entre cuentas/efectivo e inversiones.
- Saber si sube o baja y ver rentabilidad acumulada y diaria de inversiones.
- Ver ingresos, gastos, balance mensual, próximos cargos y avisos útiles.
- Modo oscuro por defecto, cambio inmediato a claro/auto.
- Escritorio y móvil deben sentirse distintos.
- Impuestos en segundo plano; «Objetivos» se rehízo como Plan opcional.
- Español claro para una persona no técnica.

## 2. Fuentes
| Fuente | Método | Automático |
|---|---|---|
| Cualquier banco/tarjeta | CSV, XLSX, OFX, QFX, QIF; detector o selector | Importación |
| Cualquier bróker/app | Operaciones o snapshot CSV/XLSX | Importación |
| Binance | Spot, funding, Earn y futuros USDⓈ-M | Sí |
| Kraken | Saldo oficial | Sí |
| KuCoin | Cuentas oficiales | Sí |
| OKX | API V5 de saldo | Sí |
| Bybit | Cuenta unificada V5 | Sí |
| Precios cripto | Endpoints públicos oficiales | Sí |
| Acciones/ETF/fondos | Cotización pública por ticker | Mientras responda |
| Gráficos | Widget gratuito TradingView | Visual |

Sin API personal oficial y gratuita: importar. No usar agregadores de pago.

## 3. Worker
- `worker.js` v3. Rutas: `/ping`, `/balances`, `/prices`, `/hist`, `/sync/<id>`.
- Obligatorios: `TOKEN` largo y KV `CAUDAL`. Recomendado: `ALLOWED_ORIGIN`.
- Secretos opcionales por exchange. Siempre solo lectura.
- Cabecera heredada: `X-Caudal-Token`.

## 4. Modelo y compatibilidad
- Clave local `caudal_v1`; prefijo de sincronización `caudal:`. No cambiar.
- Listas: `accounts`, `tx`, `ledger`, `derivs`, `rules`, `goals`.
- Mapas: `assets`, `costs`, `budgets`, `dismissed`.
- Cachés: `prices`, `hist`, `snaps`, `apiBal`, `apiDerivs`.
- Mezcla por `_m`, lápidas en `deleted`, marcas en `stamps`.
- AES-GCM en navegador; el Worker guarda solo el blob cifrado.

## 5. Diseño v5
- Grafito/blanco, azul de acción, verde/rojo solo semánticos.
- Escritorio: sidebar por grupos y dashboard de 12 columnas con cuatro KPIs, patrimonio, mes, cuentas, insights, categorías, evolución, cargos, movimientos y avisos.
- Móvil: patrimonio, separación cuentas/inversiones, tres indicadores, cuentas, avisos, cartera y movimientos.
- Tabs móviles: Inicio, Gastos, Invertir, Cuentas. FAB para Añadir.
- Gestos con Pointer Events: borde izquierdo abre menú; swipe cambia vistas; drawer hacia la izquierda cierra; hoja hacia abajo cierra.
- Todos tienen alternativa visible y se respeta `prefers-reduced-motion`.
- Porcentajes de patrimonio con base insuficiente se ocultan para evitar cifras engañosas.
- `investmentSummary()` calcula valor, cambio diario, coste FIFO cubierto, ganancia y porcentaje acumulado.

## 6. Pantallas
- Inicio; Movimientos; Inversiones; Cuentas; Plan; Impuestos; Ajustes.
- «Más» solo se conserva como ruta heredada a Herramientas, ya no es una pestaña principal.
- Plan contiene presupuestos y bolsillos opcionales.
- Ajustes: apariencia/dispositivos visibles; conexiones y avanzado plegables.
- TOKEN: password vacío; nunca se renderiza el valor guardado.

## 7. Importación y análisis
- `readFile`, `detect`, `parseBank`, `parseLedger`, `openMapper`, `parseOFX`, `parseQIF`, `openPositionsImport`.
- Deduplicación por huella; snapshots sustituyen la misma fuente.
- Reglas de categoría aprendidas, gastos fijos, previsión, colchón, alertas, gráfico táctil y TradingView.
- FIFO global orientativo, recompensas, derivados y modelo 721.

## 8. Repositorio
- App: `index.html`, `manifest.json`, `sw.js`, iconos.
- Backend: `worker.js`.
- IA: `actualizar.html`, `AGENTS.md`, este contexto, mapa e instrucciones TXT.
- Usuario: guía PDF.
- Pruebas: `tests/smoke.py`, `tests/worker_smoke.mjs` y ejemplos.
- Automatización: `tools/mapa.py`, `tools/sincronizar_version.py`, workflow.

## 9. Historial
- **v5 · Copilot:** Rediseño completo centrado en patrimonio, cuentas e inversiones; dashboard de escritorio más denso y móvil específico para el pulgar; navegación simplificada, gestos de borde, entre vistas y para cerrar hojas; Plan sustituye a Objetivos como herramienta opcional; Ajustes por tareas y TOKEN siempre enmascarado.
- **v4 · Copilot:** Panel adaptativo inspirado en los principios públicos de Apple, inicio móvil propio, menú desplegable y animaciones accesibles; importación universal CSV/XLSX/OFX/QIF y snapshots; gráficos TradingView por activo; conexiones automáticas oficiales para Binance, Kraken, KuCoin, OKX y Bybit; seguridad y diagnóstico reforzados.
- **v3 · Copilot:** Rediseño completo tipo app de banco e inversión: pestañas Inicio, Gastos, Inversiones y Más; patrimonio con gráfica táctil, tarjetas de cuentas, gasto del mes frente al anterior, «puedes gastar X al día», gasto por día, cartera con colores por activo, hojas que suben desde abajo en el móvil y app instalable de nuevo.
- **v2 · Copilot:** Nueva app «Finanzas»: diseño azul noche y dorado con modo claro, menú lateral, botón rápido para añadir, gráficos interactivos, ideas del mes, previsión, colchón, próximos cargos, objetivos de ahorro, calendario de gastos y sincronización automática por cambios (sin pisar datos entre dispositivos).
- **v1 · Copilot:** Primera versión: cuentas, movimientos con categorías automáticas, importación de Santander/Revolut/Binance/Kraken/KuCoin, cartera con precios en vivo, derivados, fiscalidad FIFO con borrador, presupuestos, alertas, sincronización cifrada y conexión con exchanges por un Worker.

## 10. Límites honestos
- OKX y Bybit están probados con respuestas simuladas; falta validación con claves reales de Diego.
- Los endpoints públicos pueden cambiar o limitar llamadas; se conserva el último precio.
- Un snapshot da valor actual, pero no sustituye el historial para calcular rentabilidad/FIFO.
- La fiscalidad es orientativa y no sustituye asesoramiento profesional.
