# Mantiene CONTEXTO_CAUDAL.md al día con index.html. Lo ejecuta GitHub solo en cada subida.
#  - «Versión actual» y «revisión de datos» = APP_VERSION y APP_REVISION.
#  - «## 9. Historial»: las 8 últimas líneas del Registro de cambios de index.html.
import re, pathlib
idx = pathlib.Path('index.html').read_text(encoding='utf-8')
p = pathlib.Path('CONTEXTO_CAUDAL.md'); ctx = p.read_text(encoding='utf-8')
v = re.search(r"APP_VERSION\s*=\s*.(v\d+)", idx); r = re.search(r"APP_REVISION\s*=\s*(\d+)", idx)
new = re.sub(r"(\*\*Versión actual:\s*)v\d+(\*\*)", lambda m: m.group(1) + v.group(1) + m.group(2), ctx, count=1)
if r: new = re.sub(r"(revisión de datos\s*)\d+", lambda m: m.group(1) + r.group(1), new, count=1)
a = idx.find('Registro de cambios'); log = []
if a >= 0:
    for line in idx[a:idx.find('*/', a)].split('\n')[1:]:
        m = re.match(r'\s*(v\d+)\s*·\s*([^·]+?)\s*·\s*(.+)$', line)
        if m: log.append(f'- **{m.group(1)} · {m.group(2)}:** {m.group(3).strip()}')
        if len(log) == 8: break
if log: new = re.sub(r'(^## 9\. Historial[^\n]*\n)(.*?)(?=^## 10\.)', lambda m: m.group(1) + '\n'.join(log) + '\n\n', new, count=1, flags=re.M | re.S)
if new != ctx: p.write_text(new, encoding='utf-8'); print('CONTEXTO actualizado a', v.group(1))
else: print('CONTEXTO ya estaba en', v.group(1))
