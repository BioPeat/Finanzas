#!/usr/bin/env python3
import re
from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8').splitlines()
v=next((re.search(r"APP_VERSION='(v\d+)'",x).group(1) for x in src if "APP_VERSION='" in x),'?')
out=[f'# MAPA DEL CÓDIGO · Finanzas {v}','','Generado automáticamente. Busca por función; las líneas cambian.','']
for i,line in enumerate(src,1):
    sec=re.match(r'\s*// ===== (.+?) =====',line)
    if sec:out += ['',f'## {sec.group(1)} · línea {i}'];continue
    fn=re.match(r'\s*(?:async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)',line)
    if fn:out.append(f'- `{fn.group(1)}({fn.group(2)[:45]})` · línea {i}')
Path('MAPA_DEL_CODIGO.md').write_text('\n'.join(out)+'\n',encoding='utf-8')
print('MAPA actualizado:',len(out),'líneas')
