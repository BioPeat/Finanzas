# AGENTS.md · Finanzas v6

## Regla principal
Haz cambios en el código real, ejecuta todas las pruebas y no declares éxito sin `TODO OK`. Conserva datos, privacidad y compatibilidad.

## Invariantes
1. No cambiar `caudal_v1`, `caudal:`, `X-Caudal-Token` ni el KV `CAUDAL`.
2. El TOKEN se pinta siempre vacío, enmascarado y nunca se copia a HTML, logs o prompts.
3. Primero local: un cambio debe persistir antes de usar red.
4. No introducir servicios obligatorios de pago ni claves con permisos de escritura.
5. Toda IA es opt-in, minimiza datos y no puede ejecutar operaciones.
6. Mantener alternativas visibles a los gestos y objetivos táctiles de 44 px en móvil.
7. No ocultar fallos de sincronización; mostrar estado y reintentar sin perder la cola local.

## Flujo de diseño obligatorio
`concepto → 3 direcciones → elección → diseño → render PC/móvil → crítica → refinado`.
Evita tarjetas redondeadas repetitivas, gradientes decorativos, jerarquía débil y plantillas genéricas. El concepto actual es **Atlas financiero**.

## Antes de terminar
- `node tests/worker_smoke.mjs`
- `python tests/smoke.py`
- Probar oscuro/claro, 390×844 y escritorio ≥1280 px.
- Confirmar que privacidad oculta importe y saldo de cada movimiento.
- Confirmar Worker w4 al abrir Ajustes.
- Simular cambios simultáneos, borrado, desconexión, conflicto y recuperación.
- Revisar que v6 coincide en `index.html`, contexto, mapa, guía y service worker.

## Automatización e innovación
En cada versión, inventaría tareas manuales. Automatiza gratis las seguras; si una requiere credenciales, decisión financiera o permiso del sistema, redúcela a un toque y documenta el límite. Evalúa explícitamente automatización e innovación preventiva en el consejo de calidad.
