# AGENTS.md · Finanzas v7

## Misión
Mejorar la app real sin perder datos ni degradar privacidad, claridad o fiabilidad. Haz cambios en su lugar correcto, ejecuta todas las pruebas y no declares éxito sin `TODO OK`.

## Invariantes
1. No cambiar `caudal_v1`, `caudal:`, `X-Caudal-Token`, el KV `CAUDAL` ni el `id` `finanzas-app`.
2. El TOKEN se pinta vacío y enmascarado; nunca aparece en HTML, logs, capturas ni prompts.
3. Local-first: persistir antes de usar red. Los fallos deben quedar visibles y reintentarse sin perder cambios.
4. No introducir pagos obligatorios. Las credenciales de exchanges son solo lectura.
5. La IA es opt-in, usa mínimos datos, no ejecuta operaciones y no promete rentabilidad.
6. Toda función accesible por gesto tiene botón alternativo. Objetivos táctiles principales: 44 px en móvil.
7. Una aportación, importación inicial o traspaso no puede presentarse como rentabilidad.
8. No rellenar huecos con módulos gigantes: el escritorio es denso; el móvil prioriza y secuencia.

## Arquitectura
- `index.html`: estado, migración, importadores, finanzas, UI, sincronización y Copiloto.
- `worker.js` w5: CORS/origen, precios, exchanges, mercado, IA y KV.
- `sw.js`: caché v7, actualización y modo sin conexión.
- `manifest.json`: identidad PWA estable.
- `actualizar.html`: aplica parches propuestos por IA en una copia y los valida.
- `tests/`: navegador integral y Worker.
- `tools/`: contexto, mapa y guía.

## Jerarquía del producto
- Inicio: posición general → cambios reales → cuentas → activos → flujo → decisiones.
- Mercados: panorama → salud/datos → decisiones → posiciones → exposición → escenarios → radar/noticias.
- Móvil y PC son composiciones distintas; no basta con apilar la cuadrícula de PC.
- Azul: posición/cuentas. Bronce: inversión. Verde petróleo: flujo. Ciruela: inteligencia. Verde/rojo: estado.

## Flujo de cambio obligatorio
1. Lee `CONTEXTO_FINANZAS.md` y `MAPA_DEL_CODIGO.md`.
2. Formula el cambio y sus riesgos para datos, móvil, PC y Worker.
3. Modifica la función original; no añadas parches que reasignen funciones.
4. Actualiza versión/revisión, comentarios, contexto, mapa, pruebas y guía si cambia el uso.
5. Ejecuta `node tests/worker_smoke.mjs` y `python tests/smoke.py`.
6. Renderiza 390×844 y 1440×900 en claro y oscuro; revisa desbordamiento, contraste, densidad y estados vacíos.
7. Solo entonces entrega.

## Comprobaciones críticas
- Importar Santander/Binance/Kraken y reimportar sin duplicados.
- Privacidad oculta importes y saldos de movimientos.
- Historial no incluye salto artificial desde cero.
- Sincronización mezcla cambios simultáneos y respeta borrados.
- HTTP 403 explica cómo corregir `ALLOWED_ORIGIN`.
- Worker w5, Gemini local/real, radar, noticias y análisis técnico.
- Pantallas con y sin inversiones; claro/oscuro; 360–1920 px.
