# Caudal

Panel de finanzas personales (portátil) y app (móvil) en una sola web: cuentas, gastos, inversiones, cripto, derivados e impuestos.

- **Datos:** solo en el navegador de tus dispositivos. La sincronización guarda una copia **cifrada** en tu Worker; nadie más puede leerla. Este repositorio no contiene datos ni claves.
- **Puesta en marcha:** `GUIA_PUESTA_EN_MARCHA.md`.
- **Worker de Cloudflare:** `worker.js` (exchanges con claves de solo lectura, precios y sincronización).
- **Cambios con IA:** `actualizar.html` + reglas en `AGENTS.md` y contexto en `CONTEXTO_CAUDAL.md`.
- **Prueba completa:** `python tests/smoke.py` (la ejecuta GitHub en cada subida).
