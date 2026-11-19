#!/usr/bin/env python3
import re
from pathlib import Path

MODULES = [
    'js/state.js', 'js/finance.js', 'js/charts.js', 'js/importers.js',
    'js/live.js', 'js/connectors.js', 'js/ai.js',
    'js/views-desktop.js', 'js/views-mobile.js', 'js/app.js'
]
state_txt = Path('js/state.js').read_text(encoding='utf-8')
m = re.search(r"APP_VERSION\s*=\s*'(v\d+)'", state_txt)
v = m.group(1) if m else '?'
out = [f'# MAPA DEL CÓDIGO · Finanzas {v}', '', 'Generado automáticamente a partir de los módulos `js/*.js`.', '']
for mod in MODULES:
    p = Path(mod)
    if not p.exists():
        continue
    out += ['', f'## {mod}']
    for i, line in enumerate(p.read_text(encoding='utf-8').splitlines(), 1):
        sec = re.match(r'\s*// ===== (.+?) =====', line)
        if sec:
            out.append(f'### {sec.group(1)} · línea {i}')
            continue
        fn = re.match(r'\s*(?:async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)', line)
        if fn:
            out.append(f'- `{fn.group(1)}({fn.group(2)[:45]})` · {mod}:{i}')
Path('MAPA_DEL_CODIGO.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
print('MAPA actualizado:', len(out), 'líneas')
