// Prueba del Worker (sin internet): simula los exchanges y comprueba TOKEN, origen, KV, precios y saldos.
// La ejecuta GitHub en cada subida: node tests/worker_smoke.mjs
import { readFile } from 'node:fs/promises';
// Se carga worker.js como módulo aunque la versión de Node no detecte «export» en archivos .js.
const src = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const TOKEN = 'TOKEN-DE-PRUEBA-0123456789';
const kv = new Map();
const env = { TOKEN, ALLOWED_ORIGIN: 'https://usuario.github.io', CAUDAL: { get: async k => kv.get(k) ?? null, put: async (k, v) => kv.set(k, v) },
  BINANCE_KEY: 'k', BINANCE_SECRET: 's', KRAKEN_KEY: 'k', KRAKEN_SECRET: btoa('x'), KUCOIN_KEY: 'k', KUCOIN_SECRET: 's', KUCOIN_PASSPHRASE: 'p',
  OKX_KEY: 'k', OKX_SECRET: 's', OKX_PASSPHRASE: 'p', BYBIT_KEY: 'k', BYBIT_SECRET: 's' };
const seen = {};
globalThis.fetch = async (u, init = {}) => {
  u = String(u); const h = init.headers || {}; let body;
  if (u.includes('/api/v3/account')) { seen.binance = !!h['X-MBX-APIKEY'] && /signature=/.test(u); body = { balances: [{ asset: 'BTC', free: '0.1', locked: '0' }, { asset: 'LDETH', free: '1', locked: '0' }] }; }
  else if (u.includes('get-funding-asset')) body = [{ asset: 'USDT', free: '10', locked: '0', freeze: '0', withdrawing: '0' }];
  else if (u.includes('simple-earn')) body = { rows: [] };
  else if (u.includes('/fapi/v2/account')) body = { assets: [{ asset: 'USDT', marginBalance: '100' }] };
  else if (u.includes('positionRisk')) body = [{ symbol: 'BTCUSDT', positionAmt: '0.01', entryPrice: '60000', markPrice: '65000', unRealizedProfit: '50', leverage: '5', liquidationPrice: '50000' }];
  else if (u.includes('kraken.com/0/private')) { seen.kraken = !!h['API-Sign']; body = { error: [], result: { XXBT: '0.2' } }; }
  else if (u.includes('kucoin.com/api/v1/accounts')) { seen.kucoin = !!h['KC-API-SIGN']; body = { code: '200000', data: [{ currency: 'KCS', balance: '5' }] }; }
  else if (u.includes('okx.com/api/v5/account/balance')) { seen.okx = !!h['OK-ACCESS-SIGN']; body = { code: '0', data: [{ details: [{ ccy: 'OKB', eq: '3' }] }] }; }
  else if (u.includes('/v5/account/wallet-balance')) { seen.bybit = !!h['X-BAPI-SIGN']; body = { retCode: 0, result: { list: [{ coin: [{ coin: 'SOL', walletBalance: '4' }] }] } }; }
  else if (u.includes('ticker/24hr')) body = { lastPrice: '65000', priceChangePercent: '1.5' };
  else if (u.includes('ticker/price')) body = { price: '1.08' };
  else if (u.includes('klines')) body = [[0, '60000']];
  else if (u.includes('yahoo')) body = { chart: { result: [{ meta: { regularMarketPrice: 120, chartPreviousClose: 118, currency: 'EUR' } }] } };
  else return new Response('nf', { status: 404 });
  return new Response(JSON.stringify(body), { status: 200 });
};
const call = async (p, { m = 'GET', b, token = TOKEN, origin = env.ALLOWED_ORIGIN } = {}) => {
  const r = await worker.fetch(new Request('https://w.dev' + p, { method: m, body: b, headers: { 'X-Caudal-Token': token, Origin: origin } }), env);
  return [r.status, await r.json().catch(() => null)];
};
console.log('Worker');
let [s, j] = await call('/ping');
ok(s === 200 && j.version === 'w3' && j.kv && j.originProtected && Object.values(j.exchanges).every(Boolean), 'Ping w3 con KV, origen protegido y 5 exchanges');
ok((await call('/ping', { token: 'malo' }))[0] === 401, 'TOKEN incorrecto rechazado');
ok((await call('/ping', { origin: 'https://otra.web' }))[0] === 403, 'Origen no permitido rechazado');
[s, j] = await call('/balances');
ok(s === 200 && Object.keys(j.exchanges).length === 5 && !Object.keys(j.errors).length, 'Saldos de los 5 exchanges');
ok(Object.values(seen).every(Boolean) && Object.keys(seen).length === 5, 'Todas las peticiones van firmadas');
ok(j.exchanges.binance.assets.ETH === 1 && j.exchanges.binance.positions.length === 1, 'Binance: Earn (LD…) y futuros');
[s, j] = await call('/prices?crypto=BTC,USDT&yahoo=VWCE.DE');
ok(s === 200 && j.crypto.BTC.usd === 65000 && j.yahoo['VWCE.DE'].price === 120, 'Precios cripto y ETF');
[s, j] = await call('/hist?sym=BTC&t=1700000000000');
ok(s === 200 && j.eur > 0, 'Precio histórico');
const id = 'a'.repeat(40);
ok((await call('/sync/' + id))[0] === 404, 'Sin copia todavía (404)');
ok((await call('/sync/' + id, { m: 'PUT', b: JSON.stringify({ updated: 1, data: 'cifrado' }) }))[0] === 200, 'Guardar copia cifrada');
[s, j] = await call('/sync/' + id);
ok(s === 200 && j.data === 'cifrado', 'Leer copia cifrada');
console.log(fails ? '\nFALLOS: ' + fails : '\nTODO OK');
process.exit(fails ? 1 : 0);
