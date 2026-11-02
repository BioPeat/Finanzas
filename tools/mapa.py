# Genera MAPA_DEL_CODIGO.md: secciones y funciones de index.html con su línea. Lo ejecuta GitHub solo.
import re, pathlib
src = pathlib.Path('index.html').read_text(encoding='utf-8').split('\n')
v = next((re.search(r"APP_VERSION='(v\d+)'", l).group(1) for l in src if "APP_VERSION='" in l), '?')
out = [f'# MAPA DEL CÓDIGO · Caudal {v}', '', 'Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.', '']
for i, l in enumerate(src, 1):
    s = re.match(r'\s*// ===== (.+?) =====', l)
    if s: out += ['', f'## {s.group(1)} (línea {i})']; continue
    f = re.match(r'\s*(?:async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)', l)
    if f: out.append(f'- `{f.group(1)}({f.group(2)[:40]})` · línea {i}'); continue
    c = re.match(r'^const ([A-Z_][A-Z0-9_]+)\s*=', l)
    if c: out.append(f'- constante `{c.group(1)}` · línea {i}')
pathlib.Path('MAPA_DEL_CODIGO.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('MAPA_DEL_CODIGO.md actualizado:', len(out), 'líneas')
