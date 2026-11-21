# Prueba completa de Finanzas v12. La ejecuta GitHub en cada subida (y puedes ejecutarla tú: python tests/smoke.py).
# Simula el Worker w6 y los servicios de precios: no necesita internet ni claves.
import asyncio, functools, http.server, json, os, re, sys, threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAILS = []
JS_MODULES = [
    'js/state.js', 'js/finance.js', 'js/charts.js', 'js/importers.js',
    'js/live.js', 'js/connectors.js', 'js/ai.js',
    'js/views-desktop.js', 'js/views-mobile.js', 'js/app.js'
]
def ok(m): print('  ✓', m)
def fail(m): print('  ✗', m); FAILS.append(m)

def static_checks():
    print('1. Comprobaciones del código modular')
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'css' / 'app.css').read_text(encoding='utf-8')
    js_all = '\n'.join((ROOT / m).read_text(encoding='utf-8') for m in JS_MODULES)
    names = re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', js_all)
    dup = sorted({n for n in names if names.count(n) > 1})
    fail('Funciones definidas dos veces: ' + ', '.join(dup)) if dup else ok('Ninguna función duplicada')
    reas = sorted({n for n in set(names) if re.search(r'(?<![\w$.])(?:window\.)?' + re.escape(n) + r'\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>)', js_all)})
    fail('Funciones reasignadas (parches): ' + ', '.join(reas)) if reas else ok('Ninguna función reasignada')
    for m in JS_MODULES:
        if m not in html: fail(f'Falta script {m} en index.html')
    if 'css/app.css' not in html: fail('Falta css/app.css en index.html')
    else: ok('Shell HTML y módulos JS/CSS enlazados')

    state_js = (ROOT / 'js' / 'state.js').read_text(encoding='utf-8')
    ver = re.search(r"APP_VERSION\s*=\s*'(v\d+)'", state_js)
    rev = re.search(r"APP_REVISION\s*=\s*(\d+)", state_js)
    ctx = (ROOT / 'CONTEXTO_FINANZAS.md').read_text(encoding='utf-8') if (ROOT / 'CONTEXTO_FINANZAS.md').exists() else ''
    mc = re.search(r'Versión actual:\s*\*?\*?(v\d+)', ctx)
    fail(f'CONTEXTO_FINANZAS.md no coincide con la versión {ver.group(1) if ver else "?"}') if not (ver and mc and mc.group(1) == ver.group(1)) else ok(f'Versión {ver.group(1)} (revisión {rev.group(1)}) coherente')

    markers = ["STORE = 'caudal_v1'", "'caudal:'", "'X-Caudal-Token'"]
    if all(x in js_all for x in markers): ok('Contratos caudal_v1, caudal: y X-Caudal-Token conservados')
    else: fail('Falta un contrato interno protegido')
    ok('Saldo de movimiento protegido por el modo privacidad') if '<span class="money">' in js_all and 't.bal' in js_all and '.hide-amounts .money' in css else fail('El saldo de movimiento no usa la máscara de privacidad')

async def browser_checks():
    from playwright.async_api import async_playwright
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    kv = {}
    sync_opts = {'fail_primary': False, 'stale_get': None, 'conflict_current': None, 'put_count': 0}
    async def worker(route):
        r = route.request
        if sync_opts['fail_primary'] and r.url.startswith('https://worker.test/'):
            return await route.abort()
        p = re.split(r'worker(?:-backup)?\.test', r.url, 1)[1]
        if r.headers.get('x-caudal-token') != 'TOKEN-PRUEBA': return await route.fulfill(status=401, json={'error': 'Código incorrecto'})
        if p.startswith('/ping'): return await route.fulfill(json={'ok': True, 'version': 'w6', 'kv': True, 'originProtected': True, 'openBanking': True, 'onchain': True, 'ohlcv': True, 'ai': {'gemini': True}, 'mirrors': [], 'exchanges': {'binance': True, 'kraken': True, 'kraken_futures': True, 'kucoin': True, 'okx': False, 'bybit': False}})
        if p.startswith('/balances'): return await route.fulfill(json={'exchanges': {
            'binance': {'assets': {'BTC': 0.05, 'ETH': 1, 'USDT': 200, 'EUR': 30}, 'positions': [{'symbol': 'BTCUSDT', 'amt': 0.01, 'side': 'long', 'entry': 60000, 'mark': 65000, 'pnl': 50, 'lev': 5, 'liq': 50000, 'margin': 130, 'exchange': 'binance'}]},
            'kucoin': {'assets': {'KCS': 40, 'USDT': 350}, 'positions': [{'symbol': 'ETHUSDTM', 'amt': 0.5, 'side': 'long', 'entry': 2900, 'mark': 3000, 'pnl': 50, 'lev': 4, 'liq': 2300, 'margin': 375, 'exchange': 'kucoin'}]},
            'kraken': {'assets': {'ETH': 0.3, 'EUR': 150}, 'positions': []}
        }, 'errors': {}})
        if p.startswith('/prices'): return await route.fulfill(json={'eurusd': 1.08, 'crypto': {'BTC': {'usd': 65000, 'chg': 2.1}, 'ETH': {'usd': 3000, 'chg': -1}, 'USDT': {'usd': 1, 'chg': 0}, 'SOL': {'usd': 150, 'chg': 9}, 'KCS': {'usd': 11.5, 'chg': 3.4}}, 'yahoo': {'VWCE.DE': {'price': 120, 'cur': 'EUR', 'chg': 0.5}}})
        if p.startswith('/ohlcv'):
            candles = [[1760000000000 + i * 86400000, 62000 + i * 50, 62400 + i * 50, 61700 + i * 50, 62200 + i * 50, 1200] for i in range(60)]
            return await route.fulfill(json={'source': 'Binance', 'interval': '1d', 'candles': candles})
        if p.startswith('/hist'):
            sym = re.search(r'sym=(\w+)', p).group(1)
            return await route.fulfill(json={'eur': {'BTC': 50000, 'ETH': 2500, 'SOL': 120, 'USDT': 0.92}.get(sym, 1)})
        if p.startswith('/market'):
            return await route.fulfill(json={'trending': [{'symbol': 'BTC', 'price': 65000, 'change': 2.1}, {'symbol': 'SOL', 'price': 150, 'change': 9}], 'news': [{'title': 'Resumen del mercado', 'url': 'https://example.com', 'publisher': 'Fuente'}], 'quotes': []})
        if p.startswith('/ai'):
            return await route.fulfill(json={'text': '### Análisis Gemini\n- Posiciones abiertas verificadas correctamente.', 'provider': 'gemini', 'model': 'gemini-2.5-flash'})
        m = re.match(r'/sync/(\w+)', p)
        if m:
            if r.method == 'PUT':
                sync_opts['put_count'] += 1
                if sync_opts['conflict_current'] is not None:
                    cur = sync_opts['conflict_current']; sync_opts['conflict_current'] = None
                    kv[m.group(1)] = cur
                    cur_obj = json.loads(cur)
                    return await route.fulfill(status=409, json={'error': 'Conflicto de sincronización', 'currentUpdated': cur_obj['updated'], 'current': cur_obj})
                kv[m.group(1)] = r.post_data; return await route.fulfill(json={'ok': True, 'updated': json.loads(r.post_data).get('updated', 1)})
            if sync_opts['stale_get'] is not None:
                st = sync_opts['stale_get']; sync_opts['stale_get'] = None
                return await route.fulfill(body=st, content_type='application/json')
            return await route.fulfill(body=kv[m.group(1)], content_type='application/json') if m.group(1) in kv else await route.fulfill(status=404, json={'error': 'No hay copia (404)'})
        await route.fulfill(status=404, json={'error': 'ruta'})

    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx = await b.new_context(viewport={'width': 1300, 'height': 900}, locale='es-ES')
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.route('https://worker.test/**', worker)
        await pg.route('https://worker-backup.test/**', worker)
        await pg.route('https://data-api.binance.vision/**', lambda r: asyncio.ensure_future(r.abort()))
        await pg.route('https://s.tradingview.com/**', lambda r: asyncio.ensure_future(r.abort()))
        await pg.clock.set_fixed_time('2026-11-02T20:00:00')
        ev = pg.evaluate
        def check(name):
            if errs: fail(name + ': ' + errs[0][:200]); errs.clear()

        print('2. Arranque vacío')
        await pg.goto(url); await ev("localStorage.clear()"); await pg.reload(); await pg.wait_for_function("document.body.dataset.ready==='true'")
        ok('Arranca y enseña los primeros pasos') if 'empieza en 3 pasos' in (await ev("document.body.innerText")).lower() else fail('No sale el inicio')
        check('Arranque')

        print('3. Importar Santander .xlsx')
        await pg.set_input_files('#file-in', str(ROOT / 'tests' / 'santander_ejemplo.xlsx')); await pg.wait_for_timeout(500)
        await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        r = await ev("({n:state.tx.length,bal:bankBalance(state.accounts[0]),iban:state.accounts[0].iban,otros:state.tx.filter(t=>t.cat==='otros').length,nom:state.tx.find(t=>/NOMINA/.test(t.desc))?.cat})")
        ok(f"{r['n']} movimientos, saldo {r['bal']} €, IBAN leído") if r['n'] == 40 and abs(r['bal'] - 412.94) < .01 and r['iban'] else fail('Importación Santander: ' + str(r))
        ok('Categorías automáticas') if r['nom'] == 'nomina' and r['otros'] <= 3 else fail('Categorías: ' + str(r))
        await pg.set_input_files('#file-in', str(ROOT / 'tests' / 'santander_ejemplo.xlsx')); await pg.wait_for_timeout(500)
        await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        ok('Reimportar no duplica') if await ev("state.tx.length") == 40 else fail('Al reimportar se duplican movimientos')
        await ev("go('resumen')"); await pg.wait_for_timeout(150)
        r_bal = await ev("({save: monthTotals().save, txt: document.body.innerText})")
        ok('Balance mensual visible en Inicio') if abs(r_bal['save']) < 0.01 or 'Balance\n0 €' not in r_bal['txt'].replace(' ', ' ') else fail('Balance mensual erróneo (0 €)')
        inc_ok = await ev("(()=>{const m=monthKey(today()),b=monthTotals(m).inc;state.tx.push({id:'t_adj',acc:state.accounts[0].id,date:today(),desc:'AJUSTE INICIAL',amount:500,cat:'otros'});const a=monthTotals(m).inc;state.tx.pop();return Math.abs(a-b)<0.01})()")
        ok('Ajuste inicial positivo no infla ingresos del mes') if inc_ok else fail('Ajuste inicial infló monthTotals().inc')
        check('Santander')

        print('4. Reglas aprendidas')
        tid = await ev("state.tx.find(t=>/MAXIMA CHINA/.test(t.desc)).id")
        await ev(f"editTx('{tid}')"); await ev("$('tx-cat').value='restaurantes'"); await ev("document.querySelector('[data-act=\"tx-save\"]').click()"); await pg.wait_for_timeout(200)
        r = await ev("state.tx.filter(t=>/MAXIMA CHINA/.test(t.desc)).every(t=>t.cat==='restaurantes')&&state.rules.length===1")
        ok('Reglas por comercio') if r else fail('Las reglas no se aplican')

        print('5. Worker w6, KuCoin, Kraken, Binance y Derivados')
        await ev("go('ajustes')"); await ev("$('set-worker').value='https://worker.test';$('set-token').value='TOKEN-PRUEBA'")
        await ev("document.querySelector('[data-act=\"worker-test\"]').click()"); await pg.wait_for_timeout(800)
        r = await ev("({acc:state.accounts.find(a=>a.api==='kucoin')?.name,btc:priceEUR('BTC'),nw:netWorth().total,der:derivRows().length,version:state.workerInfo?.version==='w6'})")
        ok(f"Worker w6 conectado, patrimonio {round(r['nw'])} €, {r['der']} derivados") if r['version'] and r['acc'] == 'KuCoin' and r['btc'] > 50000 and r['der'] == 2 else fail('Worker w6: ' + str(r))
        check('Worker')

        print('6. Historiales e impuestos FIFO')
        for f in ['binance_ejemplo.csv', 'kraken_ejemplo.csv']:
            await pg.set_input_files('#file-in', str(ROOT / 'tests' / f)); await pg.wait_for_timeout(400)
            await ev("$('imp-acc').value=[...$('imp-acc').options].find(o=>o.text==='"+('Binance' if 'binance' in f else 'Kraken')+"')?.value||'__new'"); await ev("$('imp-acc').dispatchEvent(new Event('change'))")
            await ev("$('imp-ok').click()"); await pg.wait_for_timeout(300)
        await ev("go('impuestos')"); await ev("state.settings.taxYear='2025'"); await ev("taxPrefetch()"); await pg.wait_for_timeout(300)
        r = await ev("(()=>{const s=taxSummary('2025');return {gain:s.gain,n:s.disp.length,gaps:s.r.gaps.length}})()")
        ok(f"FIFO 2025: ganancias {round(r['gain'])} €, {r['n']} ventas") if 290 < r['gain'] < 370 and r['n'] == 2 and r['gaps'] >= 1 else fail('Impuestos: ' + str(r))
        check('Impuestos')

        print('7. Sincronización cifrada y versión móvil')
        await ev("go('ajustes')"); await ev("state.settings.workerFallback='https://worker-backup.test';save(false)"); await ev("document.querySelector('[data-act=\"sync-on\"]').click()"); await pg.wait_for_timeout(800)
        link = await ev("pairLink()")
        ctx2 = await b.new_context(viewport={'width': 390, 'height': 844}, locale='es-ES'); pg2 = await ctx2.new_page()
        await pg2.route('https://worker.test/**', worker); await pg2.route('https://worker-backup.test/**', worker); await pg2.route('https://data-api.binance.vision/**', lambda r: asyncio.ensure_future(r.abort()))
        await pg2.route('https://s.tradingview.com/**', lambda r: asyncio.ensure_future(r.abort()))
        sync_opts['put_count'] = 0
        await pg2.goto(link); await pg2.wait_for_function("document.body.dataset.ready==='true'"); await pg2.wait_for_timeout(1200)
        r = await pg2.evaluate("({home:!!document.querySelector('.mobile-home'),tabs:document.querySelectorAll('#nav-tabs button').length,fb:state.settings.workerFallback,tx:state.tx.length,ss:syncState,minTap:Math.min(...[...document.querySelectorAll('#nav-tabs button,.mobile-fab,.topbar .iconbtn')].filter(x=>x.offsetParent!==null).map(x=>Math.min(x.getBoundingClientRect().width,x.getBoundingClientRect().height)))})")
        ok('Móvil propio, 5 pestañas y controles >= 44 px') if r['home'] and r['tabs'] == 5 and r['minTap'] >= 44 else fail('Diseño móvil: ' + str(r))
        ok('Vinculación conserva respaldo y móvil vacío no fuerza PUT') if r['fb'] == 'https://worker-backup.test' and r['tx'] == 40 and r['ss'] == 'ok' and sync_opts['put_count'] == 0 else fail('Vinculación móvil: ' + str(r) + ' puts=' + str(sync_opts['put_count']))
        await pg2.evaluate("""(()=>{const fire=(t,x,y)=>document.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true,clientX:x,clientY:y}));fire('pointerdown',4,360);fire('pointermove',125,362);fire('pointerup',125,362)})()""")
        ok('Gesto borde izquierdo abre menú') if await pg2.evaluate("document.querySelector('#mobile-drawer').classList.contains('open')") else fail('Gesto borde falló')
        await ctx2.close()

        sync_opts['fail_primary'] = True
        r_fo = await ev("(async()=>{await syncNow(true);return {ss:syncState,base:activeWorkerBase,err:state.syncError}})()")
        sync_opts['fail_primary'] = False; await ev("resetWorkerRoute()")
        ok('Failover automático al respaldo si el Worker principal falla') if r_fo['ss'] == 'ok' and r_fo['base'] == 'https://worker-backup.test' and not r_fo['err'] else fail('Failover falló: ' + str(r_fo))

        sid = await ev("syncId()")
        stale_obj = json.loads(kv[sid]); stale_obj['updated'] = 1
        sync_opts['stale_get'] = json.dumps(stale_obj)
        sync_opts['conflict_current'] = await ev("""(async()=>{
          const p=syncPayload();
          p.aiNotes=[...(p.aiNotes||[]),{id:'ai_rem_1',kind:'brief',title:'Remota',text:'OK',t:Date.now(),_m:Date.now()+5000}];
          return JSON.stringify({updated:(state.settings.lastRemote||Date.now())+5000,baseUpdated:0,device:'rem',data:await encrypt(p)});
        })()""")
        await ev("(async()=>{change(()=>{state.aiNotes.push({id:'ai_loc_1',kind:'brief',title:'Local',text:'OK',t:Date.now()})});await syncNow(true)})()")
        r_409 = await ev("({ss:syncState,err:state.syncError,ids:state.aiNotes.map(n=>n.id)})")
        ok('Conflicto 409 + KV obsoleto se fusiona y reintenta en silencio') if r_409['ss'] == 'ok' and not r_409['err'] and 'ai_rem_1' in r_409['ids'] and 'ai_loc_1' in r_409['ids'] else fail('Merge 409 falló: ' + str(r_409))

        print('8. Mercados velas, Derivados, Copiloto Chat y Responsive')
        await ev("go('inversiones')"); await pg.wait_for_timeout(300)
        ok('Velas OHLCV renderizadas') if await ev("!!document.querySelector('[data-chart=ohlcv]')") else fail('Falta gráfico de velas')
        await ev("invTab='derivs';render()"); await ev("editDeriv('')"); await ev("$('dv-instr').value='SOLUSDT';$('dv-size').value='10';$('dv-entry').value='140';$('dv-lev').value='5';document.querySelector('[data-act=\"dv-save\"]').click()")
        ok('Derivado manual creado') if await ev("state.derivs.length===1&&derivRows().length===3") else fail('Derivado manual falló')
        await ev("state.settings.aiProvider='local';save(false);go('copiloto');sendChatMessage('¿Qué posiciones abiertas tengo?')"); await pg.wait_for_timeout(200)
        ok('Chat Copiloto local responde con posiciones') if await ev("state.aiChats[0].msgs.length===2&&state.aiChats[0].msgs[1].text.includes('Posiciones abiertas')") else fail('Chat local falló')
        for width, height in [(360, 800), (390, 844), (412, 915), (768, 1024), (1024, 768), (1440, 900), (1920, 1080)]:
            await pg.set_viewport_size({'width': width, 'height': height}); await ev("go('resumen')")
            r = await ev("({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,hero:parseFloat(getComputedStyle(document.querySelector('.position-value')).fontSize),body:parseFloat(getComputedStyle(document.body).fontSize)})")
            if r['overflow'] > 1: fail(f'Desbordamiento a {width}px: {r}')
            if width < 1024 and r['hero'] < r['body'] * 2.5: fail(f'Jerarquía móvil débil a {width}px: {r}')
        ok('Responsive 360–1920 px sin desbordamiento')
        await b.close()

async def main():
    static_checks()
    try: await browser_checks()
    except ModuleNotFoundError: fail('Falta Playwright')
    except Exception as e: fail('Error: ' + str(e).split('\n')[0][:300])
    print()
    if FAILS: print(f'FALLOS ({len(FAILS)}):'); [print(' -', f) for f in FAILS]; sys.exit(1)
    print('TODO OK')
asyncio.run(main())
