// Finanzas · Worker de Cloudflare (plan gratuito). Sustituye el código anterior por este archivo entero.
// 1) Saldos mediante APIs OFICIALES y claves de SOLO LECTURA; 2) precios; 3) copia cifrada entre dispositivos.
// Obligatorio: TOKEN y KV enlazado como CAUDAL. Recomendado: ALLOWED_ORIGIN (p. ej. https://usuario.github.io).
// Exchanges opcionales: BINANCE_*, KRAKEN_*, KUCOIN_*, OKX_* y BYBIT_* (consulta README.md).
const W_VERSION = 'w3';
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const add = (m, a, v) => { v = +v || 0; if (a && v) m[a] = (m[a] || 0) + v; };
async function hmac(hash, key, msg) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key, { name: 'HMAC', hash }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, typeof msg === 'string' ? enc.encode(msg) : msg);
}
async function getJSON(url, init = {}) {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 18000);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal, headers: { 'User-Agent': 'Finanzas/5 read-only', ...(init.headers || {}) } });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { }
    if (!r.ok) throw new Error((j && (j.msg || j.message || j.retMsg || j.error_description || (Array.isArray(j.error) && j.error.join(', ')))) || ('HTTP ' + r.status));
    return j;
  } finally { clearTimeout(tm); }
}

// ---------- Binance: spot, fondos, Simple Earn y futuros USDⓈ-M ----------
async function binanceSigned(env, base, path, method = 'GET', extra = '') {
  const q = (extra ? extra + '&' : '') + 'recvWindow=10000&timestamp=' + Date.now();
  const sig = hex(await hmac('SHA-256', env.BINANCE_SECRET, q));
  return getJSON(base + path + '?' + q + '&signature=' + sig, { method, headers: { 'X-MBX-APIKEY': env.BINANCE_KEY } });
}
async function binance(env) {
  const assets = {}, positions = [], warnings = [];
  const spot = await binanceSigned(env, 'https://api.binance.com', '/api/v3/account', 'GET', 'omitZeroBalances=true');
  for (const b of spot.balances || []) add(assets, b.asset, (+b.free) + (+b.locked));
  const opt = async (name, fn) => { try { await fn(); } catch (e) { warnings.push(name + ': ' + e.message); } };
  await opt('fondos', async () => { const r = await binanceSigned(env, 'https://api.binance.com', '/sapi/v1/asset/get-funding-asset', 'POST'); for (const x of r || []) add(assets, x.asset, (+x.free) + (+x.locked) + (+x.freeze) + (+x.withdrawing)); });
  await opt('Earn flexible', async () => { const r = await binanceSigned(env, 'https://api.binance.com', '/sapi/v1/simple-earn/flexible/position', 'GET', 'size=100'); for (const x of r.rows || []) add(assets, x.asset, x.totalAmount); });
  await opt('Earn bloqueado', async () => { const r = await binanceSigned(env, 'https://api.binance.com', '/sapi/v1/simple-earn/locked/position', 'GET', 'size=100'); for (const x of r.rows || []) add(assets, x.asset, x.amount); });
  await opt('futuros', async () => {
    const acc = await binanceSigned(env, 'https://fapi.binance.com', '/fapi/v2/account');
    for (const x of acc.assets || []) add(assets, x.asset, x.marginBalance);
    const risk = await binanceSigned(env, 'https://fapi.binance.com', '/fapi/v2/positionRisk');
    for (const p of risk || []) if (+p.positionAmt) positions.push({ symbol: p.symbol, amt: +p.positionAmt, entry: +p.entryPrice, mark: +p.markPrice, pnl: +p.unRealizedProfit, lev: +p.leverage, liq: +p.liquidationPrice || null });
  });
  for (const k of Object.keys(assets)) if (/^LD[A-Z0-9]{2,}$/.test(k)) { add(assets, k.slice(2), assets[k]); delete assets[k]; }
  return { assets, positions, warnings };
}

// ---------- Kraken ----------
async function kraken(env) {
  const path = '/0/private/Balance', nonce = String(Date.now() * 1000), body = 'nonce=' + nonce;
  const sha = await crypto.subtle.digest('SHA-256', enc.encode(nonce + body));
  const msg = new Uint8Array([...enc.encode(path), ...new Uint8Array(sha)]);
  const sig = b64(await hmac('SHA-512', unb64(env.KRAKEN_SECRET), msg));
  const r = await getJSON('https://api.kraken.com' + path, { method: 'POST', body, headers: { 'API-Key': env.KRAKEN_KEY, 'API-Sign': sig, 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (r.error && r.error.length) throw new Error(r.error.join(', '));
  const assets = {}; for (const [k, v] of Object.entries(r.result || {})) add(assets, k, v);
  return { assets, positions: [] };
}

// ---------- KuCoin ----------
async function kucoin(env) {
  const path = '/api/v1/accounts', ts = String(Date.now());
  const sign = b64(await hmac('SHA-256', env.KUCOIN_SECRET, ts + 'GET' + path));
  const pass = b64(await hmac('SHA-256', env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE));
  const r = await getJSON('https://api.kucoin.com' + path, { headers: { 'KC-API-KEY': env.KUCOIN_KEY, 'KC-API-SIGN': sign, 'KC-API-TIMESTAMP': ts, 'KC-API-PASSPHRASE': pass, 'KC-API-KEY-VERSION': '2' } });
  if (r.code && r.code !== '200000') throw new Error(r.msg || r.code);
  const assets = {}; for (const a of r.data || []) add(assets, a.currency, a.balance);
  return { assets, positions: [] };
}

// ---------- OKX V5 ----------
async function okx(env) {
  const path = '/api/v5/account/balance', ts = new Date().toISOString(), pre = ts + 'GET' + path;
  const sign = b64(await hmac('SHA-256', env.OKX_SECRET, pre));
  const r = await getJSON('https://www.okx.com' + path, { headers: { 'OK-ACCESS-KEY': env.OKX_KEY, 'OK-ACCESS-SIGN': sign, 'OK-ACCESS-TIMESTAMP': ts, 'OK-ACCESS-PASSPHRASE': env.OKX_PASSPHRASE } });
  if (r.code && r.code !== '0') throw new Error(r.msg || r.code);
  const assets = {}; for (const d of (r.data && r.data[0] && r.data[0].details) || []) add(assets, d.ccy, d.eq || d.cashBal || d.availBal);
  return { assets, positions: [] };
}

// ---------- Bybit V5 (cuenta unificada) ----------
async function bybit(env) {
  const query = 'accountType=UNIFIED', ts = String(Date.now()), recv = '10000';
  const sign = hex(await hmac('SHA-256', env.BYBIT_SECRET, ts + env.BYBIT_KEY + recv + query));
  const base = String(env.BYBIT_BASE || 'https://api.bybit.com').replace(/\/$/, '');
  const r = await getJSON(base + '/v5/account/wallet-balance?' + query, { headers: { 'X-BAPI-API-KEY': env.BYBIT_KEY, 'X-BAPI-SIGN': sign, 'X-BAPI-SIGN-TYPE': '2', 'X-BAPI-TIMESTAMP': ts, 'X-BAPI-RECV-WINDOW': recv } });
  if (r.retCode) throw new Error(r.retMsg || String(r.retCode));
  const assets = {}; for (const c of (r.result && r.result.list && r.result.list[0] && r.result.list[0].coin) || []) add(assets, c.coin, c.walletBalance || c.equity);
  return { assets, positions: [] };
}

const EXCHANGES = {
  binance: { fn: binance, keys: ['BINANCE_KEY', 'BINANCE_SECRET'] },
  kraken: { fn: kraken, keys: ['KRAKEN_KEY', 'KRAKEN_SECRET'] },
  kucoin: { fn: kucoin, keys: ['KUCOIN_KEY', 'KUCOIN_SECRET', 'KUCOIN_PASSPHRASE'] },
  okx: { fn: okx, keys: ['OKX_KEY', 'OKX_SECRET', 'OKX_PASSPHRASE'] },
  bybit: { fn: bybit, keys: ['BYBIT_KEY', 'BYBIT_SECRET'] }
};

// ---------- Precios gratuitos, sin clave: APIs públicas de los mercados y fallback público ----------
async function cryptoPrice(sym) {
  if (['USDT', 'USDC', 'FDUSD', 'DAI', 'BUSD', 'TUSD', 'USDP', 'PYUSD', 'EURC', 'EURI'].includes(sym)) return { usd: 1, chg: 0 };
  try { const t = await getJSON('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=' + sym + 'USDT'); return { usd: +t.lastPrice, chg: +t.priceChangePercent }; } catch (e) { }
  try { const t = await getJSON('https://api.kucoin.com/api/v1/market/stats?symbol=' + sym + '-USDT'); if (t.data && +t.data.last) return { usd: +t.data.last, chg: +t.data.changeRate * 100 }; } catch (e) { }
  try { const t = await getJSON('https://api.kraken.com/0/public/Ticker?pair=' + sym + 'USD'); const v = Object.values(t.result || {})[0]; if (v) return { usd: +v.c[0], chg: (+v.c[0] / +v.o - 1) * 100 }; } catch (e) { }
  return null;
}
async function yahoo(sym) {
  const j = await getJSON('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=5d&interval=1d');
  const m = j.chart.result[0].meta, prev = m.chartPreviousClose || m.previousClose;
  return { price: m.regularMarketPrice, cur: m.currency, chg: prev ? (m.regularMarketPrice / prev - 1) * 100 : null, name: m.longName || m.shortName || '' };
}
async function eurusd() {
  try { const t = await getJSON('https://data-api.binance.vision/api/v3/ticker/price?symbol=EURUSDT'); return +t.price; } catch (e) { }
  try { const y = await yahoo('EURUSD=X'); return y.price; } catch (e) { return null; }
}
async function prices(url) {
  const list = k => (url.searchParams.get(k) || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 40);
  const out = { eurusd: await eurusd(), crypto: {}, yahoo: {} };
  await Promise.all(list('crypto').map(async s => { out.crypto[s] = await cryptoPrice(s); }));
  await Promise.all(list('yahoo').map(async s => { try { out.yahoo[s] = await yahoo(s); } catch (e) { out.yahoo[s] = null; } }));
  return out;
}
async function hist(url) {
  const sym = (url.searchParams.get('sym') || '').toUpperCase(), t = +url.searchParams.get('t'); if (!sym || !t) throw new Error('Faltan sym o t');
  const k = async s => { try { const r = await getJSON('https://data-api.binance.vision/api/v3/klines?symbol=' + s + '&interval=1h&startTime=' + t + '&limit=1'); return r[0] ? +r[0][1] : null; } catch (e) { return null; } };
  const eu = await k('EURUSDT'); let usd = ['USDT', 'USDC', 'FDUSD', 'DAI', 'BUSD', 'TUSD'].includes(sym) || sym === 'USD' ? 1 : await k(sym + 'USDT');
  if (!usd) { try { const sec = Math.floor(t / 1000), r = await getJSON('https://api.kucoin.com/api/v1/market/candles?type=1hour&symbol=' + sym + '-USDT&startAt=' + sec + '&endAt=' + (sec + 3600)); const c = (r.data || []).at(-1); if (c) usd = +c[1]; } catch (e) { } }
  return { eur: usd && eu ? usd / eu : null };
}

function cors(req, env) {
  const o = req.headers.get('Origin') || '', allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
  return { 'Access-Control-Allow-Origin': allowed || '*', 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS', 'Access-Control-Allow-Headers': 'X-Caudal-Token,Content-Type', 'Access-Control-Max-Age': '86400', 'Cache-Control': 'no-store' };
}
export default {
  async fetch(req, env) {
    const H = cors(req, env), respond = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' } });
    const origin = (req.headers.get('Origin') || '').replace(/\/$/, ''), allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    if (allowed && origin && origin !== allowed) return respond({ error: 'Origen no permitido' }, 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
    const url = new URL(req.url);
    if (!env.TOKEN || String(env.TOKEN).length < 20) return respond({ error: 'Falta TOKEN o es demasiado corto (mínimo 20 caracteres).' }, 500);
    if (req.headers.get('X-Caudal-Token') !== env.TOKEN) return respond({ error: 'Código incorrecto' }, 401);
    try {
      if (url.pathname === '/ping') return respond({ ok: true, version: W_VERSION, kv: !!env.CAUDAL, originProtected: !!allowed, exchanges: Object.fromEntries(Object.entries(EXCHANGES).map(([k, x]) => [k, x.keys.every(n => env[n])])) });
      if (url.pathname === '/balances') {
        const exchanges = {}, errors = {};
        await Promise.all(Object.entries(EXCHANGES).filter(([, x]) => x.keys.every(n => env[n])).map(async ([k, x]) => { try { exchanges[k] = await x.fn(env); } catch (e) { errors[k] = e.message; } }));
        return respond({ exchanges, errors, ts: Date.now() });
      }
      if (url.pathname === '/prices') return respond(await prices(url));
      if (url.pathname === '/hist') return respond(await hist(url));
      const m = url.pathname.match(/^\/sync\/([a-f0-9]{20,64})$/);
      if (m) {
        if (!env.CAUDAL) return respond({ error: 'Falta enlazar el espacio KV como CAUDAL.' }, 500);
        const key = 'sync:' + m[1];
        if (req.method === 'GET') { const v = await env.CAUDAL.get(key); return v ? new Response(v, { headers: { ...H, 'Content-Type': 'application/json' } }) : respond({ error: 'No hay copia (404)' }, 404); }
        if (req.method === 'PUT') {
          const body = await req.text(); if (body.length > 20e6) return respond({ error: 'Copia demasiado grande' }, 413);
          const o = JSON.parse(body); if (!o.data || !o.updated || typeof o.data !== 'string') return respond({ error: 'Copia no válida' }, 400);
          await env.CAUDAL.put(key, body); return respond({ ok: true });
        }
      }
      return respond({ error: 'Ruta desconocida' }, 404);
    } catch (e) { return respond({ error: e.name === 'AbortError' ? 'El servicio externo tardó demasiado.' : e.message }, 500); }
  }
};
