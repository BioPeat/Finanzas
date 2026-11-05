#!/usr/bin/env python3
import asyncio, functools, http.server, os, re, threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=Path(os.environ.get('CAPTURAS_OUT',ROOT/'capturas_finales'));OUT.mkdir(parents=True,exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
async def main():
    srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    kv={}
    async def worker(route):
        r=route.request;p=r.url.split('worker.test',1)[1]
        if r.headers.get('x-caudal-token')!='TOKEN-PRUEBA':return await route.fulfill(status=401,json={'error':'Código incorrecto'})
        if p.startswith('/ping'):return await route.fulfill(json={'ok':True,'version':'w5','kv':True,'originProtected':True,'ai':{'gemini':True},'exchanges':{'binance':True,'kraken':True,'kucoin':False,'okx':False,'bybit':False}})
        if p.startswith('/balances'):return await route.fulfill(json={'exchanges':{'binance':{'assets':{'BTC':.05,'ETH':1,'USDT':200,'EUR':30},'positions':[{'symbol':'BTCUSDT','amt':.01,'entry':60000,'mark':65000,'pnl':50,'lev':5,'liq':50000}]}},'errors':{}})
        if p.startswith('/prices'):return await route.fulfill(json={'eurusd':1.08,'crypto':{'BTC':{'usd':65000,'chg':2.1},'ETH':{'usd':3000,'chg':-1.0},'USDT':{'usd':1,'chg':0},'SOL':{'usd':150,'chg':9},'BNB':{'usd':600,'chg':.3}},'yahoo':{'VWCE.DE':{'price':120,'cur':'EUR','chg':.5}}})
        if p.startswith('/hist'):
            sym=re.search(r'sym=(\w+)',p).group(1);return await route.fulfill(json={'eur':{'BTC':50000,'ETH':2500,'SOL':120,'USDT':.92}.get(sym,1)})
        if p.startswith('/series'):
            pts=[[f'2026-{m:02d}-01',50000+m*900] for m in range(1,12)];return await route.fulfill(json={'points':pts})
        if p.startswith('/market?trending=1'):
            return await route.fulfill(json={'trending':[{'symbol':'BTC','price':65000,'change':2.1},{'symbol':'ETH','price':3000,'change':-1},{'symbol':'SOL','price':150,'change':9},{'symbol':'BNB','price':600,'change':.3},{'symbol':'LINK','price':18.4,'change':3.2}]})
        if p.startswith('/market'):
            return await route.fulfill(json={'news':[{'title':'Actualización de mercado y volumen del activo','url':'https://example.com','publisher':'Fuente de ejemplo'}]})
        m=re.match(r'/sync/(\w+)',p)
        if m:
            if r.method=='PUT':kv[m.group(1)]=r.post_data;return await route.fulfill(json={'ok':True})
            return await route.fulfill(body=kv[m.group(1)],content_type='application/json') if m.group(1) in kv else await route.fulfill(status=404,json={'error':'No hay copia (404)'})
        return await route.fulfill(status=404,json={'error':'ruta'})
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None)
        ctx=await browser.new_context(viewport={'width':1440,'height':900},locale='es-ES');pg=await ctx.new_page()
        await pg.route('https://worker.test/**',worker);await pg.route('https://s.tradingview.com/**',lambda r:asyncio.ensure_future(r.abort()))
        await pg.clock.set_fixed_time('2026-11-05T20:00:00');await pg.goto(url);await pg.evaluate('localStorage.clear()');await pg.reload();await pg.wait_for_function("document.body.dataset.ready==='true'")
        await pg.set_input_files('#file-in',str(ROOT/'tests/santander_ejemplo.xlsx'));await pg.wait_for_timeout(300);await pg.evaluate("$('imp-ok').click()");await pg.wait_for_timeout(200)
        await pg.evaluate("go('ajustes');$('set-worker').value='https://worker.test';$('set-token').value='TOKEN-PRUEBA';document.querySelector('[data-act=\"worker-test\"]').click()");await pg.wait_for_timeout(800)
        for f,name in [('binance_ejemplo.csv','Binance'),('kraken_ejemplo.csv','Kraken')]:
            await pg.set_input_files('#file-in',str(ROOT/'tests'/f));await pg.wait_for_timeout(250);await pg.evaluate(f"$('imp-acc').value=[...$('imp-acc').options].find(o=>o.text==='{name}')?.value||'__new';$('imp-acc').dispatchEvent(new Event('change'));$('imp-ok').click()");await pg.wait_for_timeout(250)
        await pg.evaluate("$('toast').hidden=true;state.market._trends={rows:[{symbol:'BTC',price:65000,change:2.1},{symbol:'ETH',price:3000,change:-1},{symbol:'SOL',price:150,change:9},{symbol:'BNB',price:600,change:.3},{symbol:'LINK',price:18.4,change:3.2}]};state.settings.theme='dark';save(false);go('resumen')")
        await pg.wait_for_timeout(400);await pg.screenshot(path=str(OUT/'01_PC_OSCURO_POSICION.png'),full_page=True)
        await pg.evaluate("state.settings.theme='light';save(false);render()");await pg.wait_for_timeout(250);await pg.screenshot(path=str(OUT/'02_PC_CLARO_POSICION.png'),full_page=True)
        await pg.evaluate("state.settings.theme='dark';save(false);go('inversiones')");await pg.wait_for_timeout(300);await pg.screenshot(path=str(OUT/'03_PC_OSCURO_MERCADOS.png'),full_page=True)
        await pg.set_viewport_size({'width':390,'height':844});await pg.evaluate("state.settings.theme='dark';save(false);go('resumen')");await pg.wait_for_timeout(300);await pg.screenshot(path=str(OUT/'04_MOVIL_OSCURO_POSICION.png'),full_page=True)
        await pg.evaluate("state.settings.theme='light';save(false);render()");await pg.wait_for_timeout(250);await pg.screenshot(path=str(OUT/'05_MOVIL_CLARO_POSICION.png'),full_page=True)
        await pg.evaluate("go('inversiones');invView='resumen';render()");await pg.wait_for_timeout(250);await pg.screenshot(path=str(OUT/'06_MOVIL_CLARO_MERCADOS.png'),full_page=True)
        await pg.evaluate("invView='explorar';render()");await pg.wait_for_timeout(250);await pg.screenshot(path=str(OUT/'07_MOVIL_CLARO_EXPLORAR.png'),full_page=True)
        await browser.close()
    print('Capturas creadas en',OUT)
asyncio.run(main())
