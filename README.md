# Finanzas

Panel de finanzas personales (portátil) y app (móvil) en una sola web: cuentas, gastos, inversiones, cripto, derivados, objetivos e impuestos.

- **Datos:** solo en el navegador de tus dispositivos. La sincronización guarda una copia **cifrada** en tu Worker; nadie más puede leerla. Este repositorio no contiene datos ni claves.
- **Worker de Cloudflare:** `worker.js` (exchanges con claves de solo lectura, precios y sincronización).
- **Cambios con IA:** `actualizar.html` + reglas en `AGENTS.md` y contexto en `CONTEXTO_FINANZAS.md`.
- **Prueba completa:** `python tests/smoke.py` (la ejecuta GitHub en cada subida).
- Nombres internos heredados de «Caudal» (clave `caudal_v1`, prefijo `caudal:`, cabecera `X-Caudal-Token`, KV `CAUDAL`): no se cambian para no perder datos.
