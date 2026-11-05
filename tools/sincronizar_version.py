#!/usr/bin/env python3
import re
from pathlib import Path
idx=Path('index.html').read_text(encoding='utf-8')
p=Path('CONTEXTO_FINANZAS.md'); ctx=p.read_text(encoding='utf-8')
v=re.search(r"APP_VERSION='(v\d+)'",idx).group(1); rev=re.search(r'APP_REVISION=(\d+)',idx).group(1)
w=re.search(r"W_VERSION\s*=\s*'(w\d+)'",Path('worker.js').read_text(encoding='utf-8')).group(1)
new=re.sub(r'\*\*Versión actual: v\d+\*\* · revisión \d+ · Worker \*\*w\d+\*\*',f'**Versión actual: {v}** · revisión {rev} · Worker **{w}**',ctx,count=1)
if new!=ctx:p.write_text(new,encoding='utf-8');print('CONTEXTO actualizado:',v,rev,w)
else:print('CONTEXTO ya estaba actualizado')
