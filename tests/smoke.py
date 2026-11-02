# Prueba completa de Caudal. La ejecuta GitHub en cada subida (y puedes ejecutarla tú: python tests/smoke.py).
# Simula el Worker y los servicios de precios: no necesita internet ni claves.
import asyncio, functools, http.server, json, os, re, sys, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAILS = []
def ok(m): print('  ✓', m)
def fail(m): print('  ✗', m); FAILS.append(m)

def static_checks():
    print('1. Comprobaciones del código')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    a = html.index('<script id="app">'); js = html[a:html.index('</script>', a)]
    names = re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', js)
    dup = sorted({n for n in names if names.count(n) > 1})
    fail('Funciones definidas dos veces: ' + ', '.join(dup)) if dup else ok('Ninguna función duplicada')
    extra = [m for m in re.findall(r'<script([^>]*)>([\s\S]*?)</script>', html) if len(m[1]) > 400 and 'id="app"' not in m[0]]
    fail('Hay otro <script> con código fuera de <script id="app">') if extra else ok('Un solo script de la app')
    reas = sorted({n for n in set(names) if re.search(r'(?<![\w$.])(?:window\.)?' + re.escape(n) + r'\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>)', js)})
    fail('Funciones reasignadas (parches): ' + ', '.join(reas)) if reas else ok('Ninguna función reasignada')
    used = set(re.findall(r"\$\('([\w-]+)'\)", js)); ids = set(re.findall(r'id="([\w-]+)"', html))
    miss = sorted(u for u in used if u not in ids)
    print('  · ids creados al pintar:', ', '.join(miss[:30])) if miss else ok('Todos los $(id) existen en el HTML')
    ver = re.search(r"APP_VERSION='(v\d+)'", js); rev = re.search(r'APP_REVISION=(\d+)', js)
    ctx = (ROOT / 'CONTEXTO_CAUDAL.md').read_text(encoding='utf-8') if (ROOT / 'CONTEXTO_CAUDAL.md').exists() else ''
    m = re.search(r'Versión actual:\s*\*?\*?(v\d+)', ctx)
    fail(f'CONTEXTO_CAUDAL.md no coincide con la versión {ver.group(1) if ver else "?"}') if not (ver and m and m.group(1) == ver.group(1)) else ok(f'Versión {ver.group(1)} (revisión {rev.group(1)}) coherente')
    if not re.search(r'\n\s+' + (ver.group(1) if ver else 'v?') + r' · ', js): fail('Falta la línea de la versión en el Registro de cambios')

async def browser_checks():
    from playwright.async_api import async_playwright
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    kv = {}
    async def worker(route):
        r = route.request; p = r.url.split('worker.test', 1)[1]
        if r.headers.get('x-caudal-token') != 'TOKEN-PRUEBA': return await route.fulfill(status=401, json={'error': 'Código incorrecto'})
        if p.startswith('/ping'): return await route.fulfill(json={'ok': True, 'kv': True, 'exchanges': {'binance': True, 'kraken': False, 'kucoin': False}})
        if p.startswith('/balances'): return await route.fulfill(json={'exchanges': {'binance': {'assets': {'BTC': 0.05, 'ETH': 1, 'USDT': 200, 'EUR': 30}, 'positions': [{'symbol': 'BTCUSDT', 'amt': 0.01, 'entry': 60000, 'mark': 65000, 'pnl': 50, 'lev': 5, 'liq': 50000}]}}, 'errors': {}})
        if p.startswith('/prices'): return await route.fulfill(json={'eurusd': 1.08, 'crypto': {'BTC': {'usd': 65000, 'chg': 2.1}, 'ETH': {'usd': 3000, 'chg': -1}, 'USDT': {'usd': 1, 'chg': 0}, 'SOL': {'usd': 150, 'chg': 9}, 'BNB': {'usd': 600, 'chg': 0}}, 'yahoo': {'VWCE.DE': {'price': 120, 'cur': 'EUR', 'chg': 0.5}}})
        if p.startswith('/hist'):
            sym = re.search(r'sym=(\w+)', p).group(1)
            return await route.fulfill(json={'eur': {'BTC': 50000, 'ETH': 2500, 'SOL': 120, 'USDT': 0.92}.get(sym, 1)})
        m = re.match(r'/sync/(\w+)', p)
        if m:
            if r.method == 'PUT': kv[m.group(1)] = r.post_data; return await route.fulfill(json={'ok': True})
            return await route.fulfill(body=kv[m.group(1)], content_type='application/json') if m.group(1) in kv else await route.fulfill(status=404, json={'error': 'No hay copia (404)'})
        await route.fulfill(status=404, json={'error': 'ruta'})
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = await b.new_context(viewport={'width': 1300, 'height': 900}, locale='es-ES')
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('https://worker.test/**', worker)
        await pg.route('https://data-api.binance.vision/**', lambda r: asyncio.ensure_future(r.abort()))
        await pg.clock.set_fixed_time('2026-11-02T20:00:00')
        ev = pg.evaluate
        def check(name):
            if errs: fail(name + ': ' + errs[0][:200]); errs.clear()
        print('2. Arranque vacío')
        await pg.goto(url); await ev("localStorage.clear()"); await pg.reload(); await pg.wait_for_function("document.body.dataset.ready==='true'")
        ok('Arranca y enseña los primeros pasos') if 'empieza en 3 pasos' in (await ev("document.body.innerText")).lower() else fail('No sale el inicio')
        check('Arranque')
        print('3. Importar el Excel de Santander')
        await pg.set_input_files('#file-in', str(ROOT / 'tests' / 'santander_ejemplo.xlsx')); await pg.wait_for_timeout(500)
        await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        r = await ev("({n:state.tx.length,bal:bankBalance(state.accounts[0]),iban:state.accounts[0].iban,otros:state.tx.filter(t=>t.cat==='otros').length,nom:state.tx.find(t=>/NOMINA/.test(t.desc))?.cat})")
        ok(f"{r['n']} movimientos, saldo {r['bal']} €, IBAN leído") if r['n'] == 40 and abs(r['bal'] - 412.94) < .01 and r['iban'] else fail('Importación Santander: ' + str(r))
        ok('Categorías automáticas (nómina reconocida, pocos «otros»)') if r['nom'] == 'nomina' and r['otros'] <= 3 else fail('Categorías: ' + str(r))
        await pg.set_input_files('#file-in', str(ROOT / 'tests' / 'santander_ejemplo.xlsx')); await pg.wait_for_timeout(500)
        await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        ok('Reimportar no duplica') if await ev("state.tx.length") == 40 else fail('Al reimportar se duplican movimientos')
        check('Santander')
        print('4. Categorías que aprende')
        tid = await ev("state.tx.find(t=>/MAXIMA CHINA/.test(t.desc)).id")
        await ev(f"editTx('{tid}')"); await ev("$('tx-cat').value='restaurantes'"); await ev("document.querySelector('[data-act=\"tx-save\"]').click()"); await pg.wait_for_timeout(200)
        r = await ev("state.tx.filter(t=>/MAXIMA CHINA/.test(t.desc)).every(t=>t.cat==='restaurantes')&&state.rules.length===1")
        ok('Cambiar una categoría la aplica a todos los del mismo comercio y crea una regla') if r else fail('Las reglas no se aplican')
        print('5. Worker, exchanges y precios')
        await ev("go('ajustes')"); await ev("$('set-worker').value='https://worker.test';$('set-token').value='TOKEN-PRUEBA'")
        await ev("document.querySelector('[data-act=\"worker-test\"]').click()"); await pg.wait_for_timeout(800)
        r = await ev("({acc:state.accounts.find(a=>a.api==='binance')?.name,btc:priceEUR('BTC'),nw:netWorth().total,der:derivRows().length})")
        ok(f"Binance conectado, patrimonio {round(r['nw'])} €") if r['acc'] == 'Binance' and r['btc'] > 50000 and r['nw'] > 4000 and r['der'] == 1 else fail('Worker/precios: ' + str(r))
        check('Worker')
        print('6. Historial de exchanges e impuestos')
        for f in ['binance_ejemplo.csv', 'kraken_ejemplo.csv']:
            await pg.set_input_files('#file-in', str(ROOT / 'tests' / f)); await pg.wait_for_timeout(400)
            await ev("$('imp-acc').value=[...$('imp-acc').options].find(o=>o.text==='"+('Binance' if 'binance' in f else 'Kraken')+"')?.value||'__new'"); await ev("$('imp-acc').dispatchEvent(new Event('change'))")
            await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        ok('Historiales importados') if await ev("state.ledger.length") >= 17 else fail('No se importan los historiales')
        await ev("go('impuestos')"); await ev("state.settings.taxYear='2025'"); await ev("taxPrefetch()"); await pg.wait_for_timeout(300)
        r = await ev("(()=>{const s=taxSummary('2025');return {gain:s.gain,loss:s.loss,rew:s.rew,der:s.der,n:s.disp.length,gaps:s.r.gaps.length,coins:byCoin(s.disp).length}})()")
        ok(f"FIFO 2025: ganancias {round(r['gain'])} €, staking {round(r['rew'],2)} €, derivados {round(r['der'],2)} €, {r['n']} ventas") if 290 < r['gain'] < 310 + 60 and r['n'] == 2 and r['rew'] > 0 and r['der'] > 0 and r['gaps'] >= 1 else fail('Impuestos: ' + str(r))
        await ev("render()")
        ok('El depósito de SOL sin coste aparece para completarlo') if await ev("!!document.querySelector('[data-cost]')") else fail('No aparece «Completar datos»')
        await ev("const i=document.querySelector('[data-cost]');i.value='300';i.dispatchEvent(new Event('change',{bubbles:true}))")
        ok('Se guarda el coste completado') if await ev("Object.values(state.costs).includes(300)") else fail('No se guarda el coste')
        t = await ev("taxAIText('2025')")
        ok('Texto para la IA o el gestor') if 'FIFO' in t and 'BTC' in t else fail('Texto para IA vacío')
        r = await ev("modelo721('2025')")
        ok(f"Modelo 721: {round(r['total'])} € en exchanges extranjeros") if r['total'] > 0 else fail('Modelo 721: ' + str(r))
        check('Impuestos')
        print('7. Sincronización entre dispositivos')
        await ev("go('ajustes')"); await ev("document.querySelector('[data-act=\"sync-on\"]').click()"); await pg.wait_for_timeout(800)
        link = await ev("pairLink()")
        ok('Copia cifrada subida') if kv and all('data' in v for v in kv.values()) and 'Santander' not in list(kv.values())[0] else fail('La copia no se sube cifrada')
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844}, locale='es-ES'); pg2 = await ctx2.new_page()
        await pg2.route('https://worker.test/**', worker); await pg2.route('https://data-api.binance.vision/**', lambda r: asyncio.ensure_future(r.abort()))
        await pg2.goto(link); await pg2.wait_for_function("document.body.dataset.ready==='true'"); await pg2.wait_for_timeout(1200)
        r = await pg2.evaluate("({n:state.tx.length,l:state.ledger.length,w:state.settings.worker})")
        ok(f"El móvil se vincula con el enlace y recibe {r['n']} movimientos") if r['n'] == 40 and r['l'] >= 17 and r['w'] else fail('Vinculación: ' + str(r))
        await pg2.evaluate("change(()=>state.budgets.super=150,'x')"); await pg2.wait_for_timeout(3500)
        await ev("syncNow()"); await pg.wait_for_timeout(800)
        ok('Un cambio en el móvil llega al portátil') if await ev("state.budgets.super") == 150 else fail('La sincronización no trae los cambios')
        await ctx2.close()
        print('8. Pantallas y botones')
        for v in ['resumen', 'movimientos', 'inversiones', 'impuestos', 'cuentas', 'ajustes', 'mas']:
            await ev(f"go('{v}')"); check('Vista ' + v)
        ok('Todas las vistas se pintan sin errores')
        n = 0
        for v in ['resumen', 'movimientos', 'inversiones', 'impuestos', 'cuentas', 'ajustes']:
            await ev(f"go('{v}')")
            k = await ev("(()=>{let i=0;document.querySelectorAll('main button,main [data-asset],main [data-acc],main [data-op]').forEach(b=>{if(b.offsetParent!==null)b.dataset.t=i++;});return i;})()")
            for i in range(k):
                info = await ev(f"(()=>{{const b=document.querySelector('[data-t=\"{i}\"]');return b?(b.dataset.act||'')+' '+b.textContent.trim().slice(0,25):null}})()")
                if not info or re.search(r'import|export|wipe|del|copy|pair|sync-off|worker-test|tax-csv', info): continue
                try:
                    await ev(f"document.querySelector('[data-t=\"{i}\"]').click()"); await pg.wait_for_timeout(40); n += 1
                    if await ev("$('modal').open"): await ev("$('modal').close()")
                    if await ev("location.pathname") and v != await ev("view") and await ev("view") not in ('ajustes',):
                        await ev(f"go('{v}')")
                except Exception as e: fail(f'Botón «{info}»: {str(e)[:120]}')
                check(f'Botón «{info}»')
        ok(f'{n} botones pulsados sin errores')
        await b.close()

async def main():
    static_checks()
    try: await browser_checks()
    except ModuleNotFoundError: fail('Falta Playwright: pip install playwright && python -m playwright install chromium')
    except Exception as e: fail('La prueba se detuvo: ' + str(e).split('\n')[0][:300])
    print()
    if FAILS: print(f'FALLOS ({len(FAILS)}):'); [print(' -', f) for f in FAILS]; sys.exit(1)
    print('TODO OK')
asyncio.run(main())
