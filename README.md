# Finanzas v5

PWA personal para ver patrimonio, cuentas, gastos e inversiones desde ordenador y móvil. Funciona en local, no incluye datos reales ni secretos y no necesita servicios de pago.

## Qué cambia en v5

- **Inicio centrado en lo importante:** patrimonio total separado entre cuentas/efectivo e inversiones, tendencia, resultado acumulado de inversión, resultado diario, ingresos, gastos y balance mensual.
- **Dos experiencias reales:** dashboard analítico de 12 columnas en ordenador; inicio móvil específico, cuatro pestañas esenciales y botón flotante para añadir.
- **Gestos de pulgar:** deslizar desde el borde izquierdo hacia la derecha abre el menú; deslizar entre vistas cambia de pestaña; arrastrar hacia abajo cierra una hoja inferior.
- **Navegación simplificada:** desaparece la pestaña redundante «Más». Cuentas pasa a la barra inferior; Impuestos queda en segundo plano; «Objetivos» se convierte en **Plan**, una herramienta opcional de presupuestos y bolsillos de ahorro.
- **Añadir rehecho:** iconos contenidos, categorías sugeridas y selector completo; ya no aparece una pared de chips.
- **Ajustes por tareas:** apariencia y dispositivos primero; Worker, reglas y opciones avanzadas dentro de grupos desplegables.
- **TOKEN protegido:** se conserva localmente, pero nunca se vuelca ni se muestra en Ajustes. El campo es siempre enmascarado y vacío.
- **Porcentajes honestos:** no se muestra una rentabilidad absurda cuando el punto de partida es casi cero.

## Datos e integraciones

- Bancos, tarjetas y brókeres: CSV, TXT, XLSX, OFX, QFX o QIF, con selector de columnas para formatos desconocidos.
- Inversión y cripto: operaciones o snapshots de posiciones.
- Exchanges automáticos mediante APIs oficiales de solo lectura: Binance, Kraken, KuCoin, OKX y Bybit.
- Precios públicos y gráfico avanzado gratuito de TradingView por activo.
- Copia cifrada AES-GCM entre dispositivos mediante el Worker.

## Estructura

- `index.html`: aplicación completa.
- `worker.js`: Worker de Cloudflare (v3).
- `actualizar.html`: herramienta para aplicar cambios de Gemini/Claude.
- `GUIA_PASO_A_PASO.pdf`: guía para el usuario.
- `INSTRUCCIONES_GEM_Y_CLAUDE.txt`: texto listo para copiar.
- `AGENTS.md`, `CONTEXTO_FINANZAS.md`, `MAPA_DEL_CODIGO.md`: contexto técnico.
- `tests/`: pruebas y datos ficticios.
- `tools/`: generación automática de contexto y mapa.

## Probar

```bash
python tests/smoke.py
node tests/worker_smoke.mjs
```

Los nombres heredados `caudal_v1`, `caudal:`, `X-Caudal-Token` y `CAUDAL` se mantienen para no perder datos existentes.
