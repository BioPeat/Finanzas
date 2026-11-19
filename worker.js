// Finanzas · Worker de Cloudflare w6 (plan gratuito). Sustituye el código anterior por este archivo entero.
// 1) Saldos e historiales mediante APIs OFICIALES y claves de SOLO LECTURA;
// 2) Precios, velas OHLCV, radar, noticias y balances on-chain gratuitos;
// 3) Open Banking PSD2 gratuito (Enable Banking) para Banco Santander y bancos europeos;
// 4) Copia cifrada entre dispositivos en KV CAUDAL; 5) Copiloto IA (Gemini/OpenAI/Anthropic).
// Obligatorio: TOKEN (>= 20 caracteres) y KV enlazado como CAUDAL. Recomendado: ALLOWED_ORIGIN.
// Exchanges opcionales: BINANCE_*, KRAKEN_*, KRAKEN_FUTURES_*, KUCOIN_*, KUCOIN_FUTURES_*, OKX_*, BYBIT_*.
// Open Banking opcional: ENABLE_BANKING_APP_ID + ENABLE_BANKING_PRIVATE_KEY (PEM PKCS#8).
const W_VERSION = 'w6';
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const b64 = b => {
  const u = new Uint8Array(b); let s = '';
  for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
  return btoa(s);
};
const b64u = b => b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const add = (m, a, v) => { v = +v || 0; if (a && v) m[a] = (m[a] || 0) + v; };

async function hmac(hash, key, msg) {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key, { name: 'HMAC', hash }, false, ['sign']);
  return crypto.subtle.sign('HMAC', k, typeof msg === 'string' ? enc.encode(msg) : msg);
}

async function getJSON(url, init = {}) {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), init.timeout || 18000);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal, headers: { 'User-Agent': 'Finanzas/12 read-only', ...(init.headers || {}) } });
    const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { }
    if (!r.ok) {
      const msg = (j && (j.msg || j.message || j.retMsg || j.error_description || (typeof j.error === 'string' && j.error) || (j.error && j.error.message) || (Array.isArray(j.error) && j.error.join(', ')))) || ('HTTP ' + r.status);
      const err = new Error(msg);
      err.status = r.status;
      throw err;
    }
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
    for (const p of risk || []) if (+p.positionAmt) {
      const amt = +p.positionAmt, lev = +p.leverage || 1, mark = +p.markPrice || +p.entryPrice;
      const margin = +p.isolatedMargin || (Math.abs(amt) * mark / lev);
      positions.push({ symbol: p.symbol, amt, side: amt < 0 ? 'short' : 'long', entry: +p.entryPrice, mark, pnl: +p.unRealizedProfit, lev, liq: +p.liquidationPrice || null, margin, quote: 'USD', exchange: 'binance', type: 'perpetuo' });
    }
  });
  for (const k of Object.keys(assets)) if (/^LD[A-Z0-9]{2,}$/.test(k)) { add(assets, k.slice(2), assets[k]); delete assets[k]; }
  return { assets, positions, warnings };
}

// ---------- Kraken Spot + Margen ----------
async function krakenPrivate(env, path, params = {}) {
  const nonce = String(Date.now() * 1000);
  const body = new URLSearchParams({ nonce, ...params }).toString();
  const sha = await crypto.subtle.digest('SHA-256', enc.encode(nonce + body));
  const msg = new Uint8Array([...enc.encode(path), ...new Uint8Array(sha)]);
  const sig = b64(await hmac('SHA-512', unb64(env.KRAKEN_SECRET), msg));
  const r = await getJSON('https://api.kraken.com' + path, { method: 'POST', body, headers: { 'API-Key': env.KRAKEN_KEY, 'API-Sign': sig, 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (r.error && r.error.length) throw new Error(r.error.join(', '));
  return r.result || {};
}
async function kraken(env) {
  const res = await krakenPrivate(env, '/0/private/Balance');
  const assets = {}, positions = [], warnings = [];
  for (const [k, v] of Object.entries(res)) add(assets, k, v);
  try {
    const op = await krakenPrivate(env, '/0/private/OpenPositions', { docalcs: 'true' });
    for (const [id, p] of Object.entries(op || {})) {
      const vol = (+p.vol || 0) - (+p.vol_closed || 0);
      if (vol <= 0) continue;
      const cost = +p.cost || 0, value = +p.value || cost, entry = cost / vol, mark = value / vol;
      const side = p.type === 'sell' ? 'short' : 'long';
      const margin = +p.margin || 0;
      positions.push({ id, symbol: p.pair, amt: side === 'short' ? -vol : vol, side, entry, mark, pnl: +p.net || 0, lev: margin ? Math.round((cost / margin) * 10) / 10 : null, liq: null, margin, fees: +p.fee || 0, quote: /EUR$/i.test(String(p.pair || '')) ? 'EUR' : 'USD', exchange: 'kraken', type: 'margen' });
    }
  } catch (e) { warnings.push('margen: ' + e.message); }
  return { assets, positions, warnings };
}

// ---------- Kraken Futures (claves propias de futures.kraken.com) ----------
async function krakenFuturesReq(env, path, params = '') {
  const nonce = String(Date.now());
  const msg = params + nonce + path;
  const sha = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  const authent = b64(await hmac('SHA-512', unb64(env.KRAKEN_FUTURES_SECRET), sha));
  const url = 'https://futures.kraken.com' + path + (params ? '?' + params : '');
  const r = await getJSON(url, { headers: { APIKey: env.KRAKEN_FUTURES_KEY, Authent: authent, Nonce: nonce } });
  if (r.result && r.result !== 'success') throw new Error(r.error || 'Error en Kraken Futures');
  return r;
}
async function krakenFutures(env) {
  const assets = {}, positions = [], warnings = [];
  const acc = await krakenFuturesReq(env, '/derivatives/api/v3/accounts');
  const accounts = acc.accounts || {};
  if (accounts.flex && accounts.flex.currencies) {
    for (const [k, v] of Object.entries(accounts.flex.currencies)) add(assets, k.toUpperCase(), v.quantity || v.value);
  }
  for (const [name, a] of Object.entries(accounts)) {
    if (name !== 'flex' && a && a.balances) {
      for (const [k, v] of Object.entries(a.balances)) add(assets, k.toUpperCase(), v);
    }
  }
  try {
    const op = await krakenFuturesReq(env, '/derivatives/api/v3/openpositions');
    for (const p of op.openPositions || []) {
      const sz = +p.size || 0; if (!sz) continue;
      const side = p.side === 'short' ? 'short' : 'long';
      const entry = +p.price || 0, mark = +p.markPrice || entry;
      const pnl = p.pnl != null ? +p.pnl : (mark - entry) * sz * (side === 'short' ? -1 : 1);
      positions.push({ symbol: p.symbol, amt: side === 'short' ? -sz : sz, side, entry, mark, pnl, lev: +p.leverage || null, liq: +p.liquidationThreshold || null, margin: +p.initialMargin || null, funding: +p.unrealizedFunding || 0, quote: 'USD', exchange: 'kraken_futures', type: 'futuro' });
    }
  } catch (e) { warnings.push('posiciones: ' + e.message); }
  return { assets, positions, warnings };
}

// ---------- KuCoin Spot + Earn + Futuros ----------
async function kucoinReq(key, secret, passphrase, base, path, method = 'GET', body = '') {
  const ts = String(Date.now());
  const sign = b64(await hmac('SHA-256', secret, ts + method + path + body));
  const pass = b64(await hmac('SHA-256', secret, passphrase));
  const r = await getJSON(base + path, {
    method,
    body: body || undefined,
    headers: { 'KC-API-KEY': key, 'KC-API-SIGN': sign, 'KC-API-TIMESTAMP': ts, 'KC-API-PASSPHRASE': pass, 'KC-API-KEY-VERSION': '2', 'Content-Type': 'application/json' }
  });
  if (r.code && r.code !== '200000') throw new Error(r.msg || r.code);
  return r;
}
async function kucoin(env) {
  const assets = {}, positions = [], warnings = [];
  const spot = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, 'https://api.kucoin.com', '/api/v1/accounts');
  for (const a of spot.data || []) add(assets, a.currency, a.balance);

  const fk = env.KUCOIN_FUTURES_KEY || env.KUCOIN_KEY;
  const fs = env.KUCOIN_FUTURES_SECRET || env.KUCOIN_SECRET;
  const fp = env.KUCOIN_FUTURES_PASSPHRASE || env.KUCOIN_PASSPHRASE;
  const opt = async (name, fn) => { try { await fn(); } catch (e) { warnings.push(name + ': ' + e.message); } };

  await opt('earn', async () => {
    const er = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, 'https://api.kucoin.com', '/api/v1/earn/hold-assets');
    for (const item of (er.data && er.data.items) || []) add(assets, item.currency, item.holdAmount);
  });
  await opt('futuros saldo', async () => {
    for (const ccy of ['USDT', 'BTC', 'USDC']) {
      try {
        const ov = await kucoinReq(fk, fs, fp, 'https://api-futures.kucoin.com', '/api/v1/account-overview?currency=' + ccy);
        if (ov.data && +ov.data.accountEquity) add(assets, ccy, ov.data.accountEquity);
      } catch (e) { }
    }
  });
  await opt('futuros posiciones', async () => {
    const pos = await kucoinReq(fk, fs, fp, 'https://api-futures.kucoin.com', '/api/v1/positions');
    for (const p of pos.data || []) {
      const qty = +p.currentQty || 0; if (!qty) continue;
      const side = qty < 0 ? 'short' : 'long';
      const amt = p.posCost && p.avgEntryPrice ? Math.abs(+p.posCost / +p.avgEntryPrice) * (qty < 0 ? -1 : 1) : qty;
      positions.push({ symbol: p.symbol, amt, contracts: qty, side, entry: +p.avgEntryPrice || 0, mark: +p.markPrice || +p.avgEntryPrice || 0, pnl: +p.unrealisedPnl || 0, lev: +p.realLeverage || null, liq: +p.liquidationPrice || null, margin: +p.posMargin || +p.maintMargin || null, funding: +p.unrealisedCost || 0, quote: p.settleCurrency || 'USDT', exchange: 'kucoin', type: 'perpetuo' });
    }
  });
  return { assets, positions, warnings };
}

// ---------- OKX V5 ----------
async function okxReq(env, path) {
  const ts = new Date().toISOString(), pre = ts + 'GET' + path;
  const sign = b64(await hmac('SHA-256', env.OKX_SECRET, pre));
  const r = await getJSON('https://www.okx.com' + path, { headers: { 'OK-ACCESS-KEY': env.OKX_KEY, 'OK-ACCESS-SIGN': sign, 'OK-ACCESS-TIMESTAMP': ts, 'OK-ACCESS-PASSPHRASE': env.OKX_PASSPHRASE } });
  if (r.code && r.code !== '0') throw new Error(r.msg || r.code);
  return r;
}
async function okx(env) {
  const r = await okxReq(env, '/api/v5/account/balance');
  const assets = {}, positions = [], warnings = [];
  for (const d of (r.data && r.data[0] && r.data[0].details) || []) add(assets, d.ccy, d.eq || d.cashBal || d.availBal);
  try {
    const pr = await okxReq(env, '/api/v5/account/positions');
    for (const p of pr.data || []) {
      const sz = +p.pos || 0; if (!sz) continue;
      const side = p.posSide === 'short' || sz < 0 ? 'short' : 'long';
      positions.push({ symbol: p.instId, amt: side === 'short' ? -Math.abs(sz) : Math.abs(sz), side, entry: +p.avgPx || 0, mark: +p.markPx || 0, pnl: +p.upl || 0, lev: +p.lever || null, liq: +p.liqPx || null, margin: +p.margin || +p.imr || null, quote: p.ccy || 'USDT', exchange: 'okx', type: 'perpetuo' });
    }
  } catch (e) { warnings.push('posiciones: ' + e.message); }
  return { assets, positions, warnings };
}

// ---------- Bybit V5 ----------
async function bybitReq(env, path, query) {
  const ts = String(Date.now()), recv = '10000';
  const sign = hex(await hmac('SHA-256', env.BYBIT_SECRET, ts + env.BYBIT_KEY + recv + query));
  const base = String(env.BYBIT_BASE || 'https://api.bybit.com').replace(/\/$/, '');
  const r = await getJSON(base + path + '?' + query, { headers: { 'X-BAPI-API-KEY': env.BYBIT_KEY, 'X-BAPI-SIGN': sign, 'X-BAPI-SIGN-TYPE': '2', 'X-BAPI-TIMESTAMP': ts, 'X-BAPI-RECV-WINDOW': recv } });
  if (r.retCode) throw new Error(r.retMsg || String(r.retCode));
  return r;
}
async function bybit(env) {
  const r = await bybitReq(env, '/v5/account/wallet-balance', 'accountType=UNIFIED');
  const assets = {}, positions = [], warnings = [];
  for (const c of (r.result && r.result.list && r.result.list[0] && r.result.list[0].coin) || []) add(assets, c.coin, c.walletBalance || c.equity);
  try {
    const pr = await bybitReq(env, '/v5/position/list', 'category=linear&settleCoin=USDT');
    for (const p of (pr.result && pr.result.list) || []) {
      const sz = +p.size || 0; if (!sz) continue;
      const side = p.side === 'Sell' ? 'short' : 'long';
      positions.push({ symbol: p.symbol, amt: side === 'short' ? -sz : sz, side, entry: +p.avgPrice || 0, mark: +p.markPrice || 0, pnl: +p.unrealisedPnl || 0, lev: +p.leverage || null, liq: +p.liqPrice || null, margin: +p.positionIM || null, quote: 'USDT', exchange: 'bybit', type: 'perpetuo' });
    }
  } catch (e) { warnings.push('posiciones: ' + e.message); }
  return { assets, positions, warnings };
}

const EXCHANGES = {
  binance: { fn: binance, keys: ['BINANCE_KEY', 'BINANCE_SECRET'] },
  kraken: { fn: kraken, keys: ['KRAKEN_KEY', 'KRAKEN_SECRET'] },
  kraken_futures: { fn: krakenFutures, keys: ['KRAKEN_FUTURES_KEY', 'KRAKEN_FUTURES_SECRET'] },
  kucoin: { fn: kucoin, keys: ['KUCOIN_KEY', 'KUCOIN_SECRET', 'KUCOIN_PASSPHRASE'] },
  okx: { fn: okx, keys: ['OKX_KEY', 'OKX_SECRET', 'OKX_PASSPHRASE'] },
  bybit: { fn: bybit, keys: ['BYBIT_KEY', 'BYBIT_SECRET'] }
};

// ---------- Historial automático (Kraken y KuCoin) ----------
function fmtISO(ms) { return new Date(ms).toISOString().slice(0, 19).replace('T', ' '); }
async function exchangeHistory(env, ex) {
  const rows = [], warnings = [];
  if (ex === 'kraken') {
    if (!EXCHANGES.kraken.keys.every(k => env[k])) throw new Error('Faltan claves de Kraken.');
    const r = await krakenPrivate(env, '/0/private/Ledgers', { without_count: 'true' });
    for (const [id, l] of Object.entries(r.ledger || {})) {
      const amt = +l.amount || 0, fee = +l.fee || 0, t = fmtISO((+l.time || 0) * 1000);
      const kindMap = { trade: 'trade', spend: 'trade', receive: 'trade', deposit: 'deposit', withdrawal: 'withdraw', staking: 'reward', dividend: 'reward', earn: 'reward', transfer: 'move', margin: 'deriv', settled: 'deriv', rollover: 'deriv' };
      const kind = kindMap[l.type] || 'other';
      if (amt) rows.push({ t, asset: l.asset, change: amt, kind, ref: 'kr|' + (l.refid || id), note: l.type + (l.subtype ? ' · ' + l.subtype : '') });
      if (fee) rows.push({ t, asset: l.asset, change: -Math.abs(fee), kind: 'fee', ref: 'kr|' + (l.refid || id), note: 'Comisión' });
    }
  } else if (ex === 'kucoin') {
    if (!EXCHANGES.kucoin.keys.every(k => env[k])) throw new Error('Faltan claves de KuCoin.');
    try {
      const lg = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, 'https://api.kucoin.com', '/api/v1/accounts/ledgers?pageSize=50');
      for (const l of (lg.data && lg.data.items) || []) {
        const ch = (l.direction === 'out' ? -1 : 1) * Math.abs(+l.amount || 0);
        const bt = String(l.bizType || '');
        const kind = /DEPOSIT/i.test(bt) ? 'deposit' : /WITHDRAW/i.test(bt) ? 'withdraw' : /TRANSFER/i.test(bt) ? 'move' : /STAKING|REWARD|EARN|BONUS|INTEREST/i.test(bt) ? 'reward' : /TRADE|EXCHANGE|CONVERT/i.test(bt) ? 'trade' : 'other';
        if (ch) rows.push({ t: fmtISO(+l.createdAt), asset: l.currency, change: ch, kind, ref: 'kc|' + (l.id || l.createdAt), note: bt });
        if (+l.fee) rows.push({ t: fmtISO(+l.createdAt), asset: l.currency, change: -Math.abs(+l.fee), kind: 'fee', ref: 'kc|' + (l.id || l.createdAt), note: 'Comisión' });
      }
    } catch (e) { warnings.push('ledgers spot: ' + e.message); }
    try {
      const fills = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, 'https://api.kucoin.com', '/api/v1/fills?pageSize=50');
      for (const f of (fills.data && fills.data.items) || []) {
        const [base, quote] = String(f.symbol || '').split('-');
        if (!base || !quote) continue;
        const t = fmtISO(+f.createdAt), sz = +f.size || 0, funds = +f.funds || (+f.price * sz), dir = f.side === 'buy' ? 1 : -1;
        const ref = 'kcf|' + (f.orderId || f.tradeId);
        rows.push({ t, asset: base, change: dir * sz, kind: 'trade', ref, note: f.side + ' ' + f.symbol });
        rows.push({ t, asset: quote, change: -dir * funds, kind: 'trade', ref, note: f.side + ' ' + f.symbol });
        if (+f.fee && f.feeCurrency) rows.push({ t, asset: f.feeCurrency, change: -Math.abs(+f.fee), kind: 'fee', ref, note: 'Comisión' });
      }
    } catch (e) { warnings.push('fills spot: ' + e.message); }
  } else {
    throw new Error('Historial automático disponible para Kraken y KuCoin; usa CSV para el resto.');
  }
  return { exchange: ex, rows, warnings };
}

// ---------- Precios gratuitos, OHLCV, radar, búsqueda y noticias ----------
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
async function series(url) {
  const sym = (url.searchParams.get('symbol') || '').toUpperCase(), y = url.searchParams.get('yahoo') || '';
  if (!sym) throw new Error('Falta el símbolo');
  if (!y && /^[A-Z0-9]{2,12}$/.test(sym) && !['EUR', 'USD'].includes(sym)) {
    try { const r = await getJSON('https://data-api.binance.vision/api/v3/klines?symbol=' + sym + 'USDT&interval=1d&limit=365'); return { source: 'Binance', points: (r || []).map(x => [new Date(x[0]).toISOString().slice(0, 10), +x[4]]) }; } catch (e) { }
  }
  const ticker = y || sym;
  const r = await getJSON('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?range=1y&interval=1d');
  const x = r.chart && r.chart.result && r.chart.result[0]; if (!x) return { source: 'Yahoo', points: [] };
  const q = x.indicators.quote[0].close || []; return { source: 'Yahoo', points: (x.timestamp || []).map((t, i) => [new Date(t * 1000).toISOString().slice(0, 10), +q[i]]).filter(x => Number.isFinite(x[1])) };
}
async function ohlcv(url) {
  const sym = (url.searchParams.get('symbol') || '').toUpperCase(), y = url.searchParams.get('yahoo') || '';
  const interval = url.searchParams.get('interval') || '1d';
  const limit = Math.min(365, Math.max(20, +(url.searchParams.get('limit') || 120)));
  if (!sym) throw new Error('Falta el símbolo');
  const bnInt = { '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w' }[interval] || '1d';
  if (!y && /^[A-Z0-9]{2,12}$/.test(sym) && !['EUR', 'USD'].includes(sym)) {
    try {
      const r = await getJSON('https://data-api.binance.vision/api/v3/klines?symbol=' + sym + 'USDT&interval=' + bnInt + '&limit=' + limit);
      if (Array.isArray(r) && r.length) return { source: 'Binance', interval: bnInt, candles: r.map(x => [x[0], +x[1], +x[2], +x[3], +x[4], +x[5]]) };
    } catch (e) { }
    try {
      const kcInt = { '15m': '15min', '1h': '1hour', '4h': '4hour', '1d': '1day', '1w': '1week' }[bnInt] || '1day';
      const r = await getJSON('https://api.kucoin.com/api/v1/market/candles?type=' + kcInt + '&symbol=' + sym + '-USDT');
      if (r && Array.isArray(r.data) && r.data.length) {
        const candles = r.data.slice(0, limit).reverse().map(x => [+x[0] * 1000, +x[1], +x[3], +x[4], +x[2], +x[5]]);
        return { source: 'KuCoin', interval: bnInt, candles };
      }
    } catch (e) { }
  }
  const yMap = { '15m': ['5d', '15m'], '1h': ['1mo', '1h'], '4h': ['3mo', '1h'], '1d': ['1y', '1d'], '1w': ['5y', '1wk'] }[bnInt] || ['1y', '1d'];
  const ticker = y || sym;
  const r = await getJSON('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?range=' + yMap[0] + '&interval=' + yMap[1]);
  const x = r.chart && r.chart.result && r.chart.result[0]; if (!x) return { source: 'Yahoo', interval: bnInt, candles: [] };
  const q = x.indicators.quote[0] || {}, ts = x.timestamp || [], out = [];
  for (let i = 0; i < ts.length; i++) {
    const o = +q.open?.[i], h = +q.high?.[i], l = +q.low?.[i], c = +q.close?.[i], v = +q.volume?.[i] || 0;
    if (Number.isFinite(c)) out.push([ts[i] * 1000, Number.isFinite(o) ? o : c, Number.isFinite(h) ? h : c, Number.isFinite(l) ? l : c, c, v]);
  }
  return { source: 'Yahoo', interval: bnInt, candles: out.slice(-limit) };
}
async function market(url) {
  const out = { news: [], trending: [], quotes: [] };
  const sym = (url.searchParams.get('symbol') || '').toUpperCase(), q = url.searchParams.get('q') || '';
  if (url.searchParams.get('trending')) {
    const all = await getJSON('https://data-api.binance.vision/api/v3/ticker/24hr');
    out.trending = (all || []).filter(x => /USDT$/.test(x.symbol) && !/(UP|DOWN|BULL|BEAR)USDT$/.test(x.symbol) && +x.quoteVolume > 5e6).sort((a, b) => Math.abs(+b.priceChangePercent) * Math.log10(+b.quoteVolume) - Math.abs(+a.priceChangePercent) * Math.log10(+a.quoteVolume)).slice(0, 12).map(x => ({ symbol: x.symbol.replace(/USDT$/, ''), price: +x.lastPrice, change: +x.priceChangePercent, volume: +x.quoteVolume }));
  }
  if (q) {
    try {
      const r = await getJSON('https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) + '&quotesCount=10&newsCount=0');
      out.quotes = (r.quotes || []).map(x => ({ symbol: x.symbol, name: x.shortname || x.longname || x.symbol, type: x.quoteType, exchange: x.exchDisp || x.exchange }));
    } catch (e) { }
  }
  if (sym) {
    try { const r = await getJSON('https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(sym) + '&quotesCount=2&newsCount=8'); out.news = (r.news || []).map(n => ({ title: n.title, url: n.link, publisher: n.publisher, published: n.providerPublishTime })).filter(n => n.url); } catch (e) { }
  }
  return out;
}

// ---------- Wallets On-Chain gratuitas (sin API key) ----------
const EVM_CHAINS = {
  eth: { sym: 'ETH', rpc: 'https://ethereum-rpc.publicnode.com', bs: 'https://eth.blockscout.com/api/v2/addresses/' },
  arb: { sym: 'ETH', rpc: 'https://arbitrum-one-rpc.publicnode.com', bs: 'https://arbitrum.blockscout.com/api/v2/addresses/' },
  base: { sym: 'ETH', rpc: 'https://base-rpc.publicnode.com', bs: 'https://base.blockscout.com/api/v2/addresses/' },
  pol: { sym: 'POL', rpc: 'https://polygon-bor-rpc.publicnode.com', bs: 'https://polygon.blockscout.com/api/v2/addresses/' }
};
async function onchain(url) {
  const chain = (url.searchParams.get('chain') || 'eth').toLowerCase();
  const address = (url.searchParams.get('address') || '').trim();
  if (!address) throw new Error('Falta la dirección pública.');
  const assets = {};
  if (chain === 'btc') {
    const r = await getJSON('https://mempool.space/api/address/' + encodeURIComponent(address));
    const c = (r.chain_stats?.funded_txo_sum || 0) - (r.chain_stats?.spent_txo_sum || 0);
    const m = (r.mempool_stats?.funded_txo_sum || 0) - (r.mempool_stats?.spent_txo_sum || 0);
    add(assets, 'BTC', (c + m) / 1e8);
  } else if (chain === 'sol') {
    const r = await getJSON('https://api.mainnet-beta.solana.com', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] }) });
    if (r.error) throw new Error(r.error.message || 'Error RPC Solana');
    add(assets, 'SOL', (+(r.result && r.result.value) || 0) / 1e9);
  } else if (EVM_CHAINS[chain]) {
    const cfg = EVM_CHAINS[chain];
    const r = await getJSON(cfg.rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] }) });
    if (r.error) throw new Error(r.error.message || 'Error RPC EVM');
    add(assets, cfg.sym, Number(BigInt(r.result || '0x0')) / 1e18);
    try {
      const bs = await getJSON(cfg.bs + encodeURIComponent(address) + '/token-balances', { timeout: 8000 });
      for (const item of Array.isArray(bs) ? bs.slice(0, 15) : []) {
        const tk = item.token || {}, dec = +(tk.decimals || 18);
        if (!tk.symbol || !/^[A-Z0-9]{2,10}$/.test(tk.symbol.toUpperCase())) continue;
        const val = Number(item.value || 0) / Math.pow(10, dec);
        if (val > 0.0001) add(assets, tk.symbol.toUpperCase(), val);
      }
    } catch (e) { }
  } else {
    throw new Error('Red no soportada: ' + chain);
  }
  return { chain, address, assets, ts: Date.now() };
}

// ---------- Open Banking PSD2 gratuito via Enable Banking ----------
async function enableBankingJWT(env) {
  if (!env.ENABLE_BANKING_APP_ID || !env.ENABLE_BANKING_PRIVATE_KEY) throw new Error('Enable Banking no está configurado en los secretos del Worker.');
  const pem = String(env.ENABLE_BANKING_PRIVATE_KEY).replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  const key = await crypto.subtle.importKey('pkcs8', unb64(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(Date.now() / 1000);
  const head = b64u(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: env.ENABLE_BANKING_APP_ID })));
  const pay = b64u(enc.encode(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat, exp: iat + 300 })));
  const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(head + '.' + pay)));
  return head + '.' + pay + '.' + sig;
}
async function ebReq(env, path, opts = {}) {
  const jwt = await enableBankingJWT(env);
  return getJSON('https://api.enablebanking.com' + path, { ...opts, headers: { Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
}

// ---------- Copiloto multi-proveedor: chat, análisis, categorización e importación IA ----------
function aiProviders(env) { return { gemini: !!env.GEMINI_API_KEY, openai: !!env.OPENAI_API_KEY, anthropic: !!env.ANTHROPIC_API_KEY, custom: !!(env.AI_BASE_URL && env.AI_API_KEY) }; }
function aiPrompt(payload) {
  const tasks = { brief: 'Da un parte operativo de hoy: hechos, 3 prioridades y 3 preguntas.', spend: 'Analiza ritmo de gasto, categorías, recurrencias y anomalías. Propón comprobaciones concretas.', portfolio: 'Analiza concentración, liquidez, cambio diario, derivados/márgenes y riesgos. No des órdenes de compra o venta; formula escenarios y preguntas.', plan: 'Propón un escenario mensual prudente con caso base, adverso y holgado.', risk: 'Ordena los riesgos a 30 días por impacto y urgencia; distingue liquidez, concentración, liquidación de derivados, datos y gastos.', quality: 'Audita la calidad de los datos: precios, histórico, costes FIFO, copias y elementos que impiden conclusiones fiables.' };
  return 'Eres el copiloto financiero privado de una app de finanzas personales en España. ' + (tasks[payload.kind] || tasks.brief) + ' Separa HECHOS, INTERPRETACIÓN, ACCIONES y DATOS QUE FALTAN. No inventes precios, rentabilidades ni normativa. No prometas beneficios. Recuerda brevemente que no es asesoramiento financiero ni fiscal. Datos agregados JSON:\n' + JSON.stringify(payload);
}
const GEMINI_COOLDOWN = new Map();
async function callAIProvider(env, { provider, model, system, contents, maxTokens = 1800, temperature = 0.25 }) {
  const available = aiProviders(env);
  if (provider === 'auto' || !provider) provider = ['gemini', 'openai', 'anthropic', 'custom'].find(x => available[x]);
  if (!provider || !available[provider]) throw new Error('El proveedor elegido no está configurado en los secretos del Worker.');
  let text = '';
  if (provider === 'gemini') {
    const candidates = [...new Set([model, env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'].filter(Boolean))];
    const now = Date.now();
    const healthy = candidates.filter(m => (GEMINI_COOLDOWN.get(m) || 0) <= now);
    const order = healthy.length ? [...healthy, ...candidates.filter(m => !healthy.includes(m))] : candidates;
    const hasMedia = contents.some(c => (c.parts || []).some(p => p.inlineData));
    const fastMs = (hasMedia || maxTokens > 2000) ? 14000 : 7000;
    const finalMs = (hasMedia || maxTokens > 2000) ? 45000 : 35000;
    const body = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    let lastErr;
    for (let i = 0; i < order.length; i++) {
      const m = order[i];
      try {
        const r = await getJSON('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(m) + ':generateContent?key=' + encodeURIComponent(env.GEMINI_API_KEY), { method: 'POST', timeout: i < order.length - 1 ? fastMs : finalMs, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        text = r.candidates && r.candidates[0] && r.candidates[0].content && r.candidates[0].content.parts.map(x => x.text || '').join('');
        GEMINI_COOLDOWN.delete(m);
        model = m;
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        const st = e && e.status, em = String(e && e.message || e);
        const retryable = (e && e.name === 'AbortError') || [404, 408, 429, 500, 502, 503, 504].includes(st) || /no longer available|not found|high demand|overloaded|unavailable|quota|rate.?limit|resource.?exhausted|too many|capacity|timeout|abort|429|503|404/i.test(em);
        if (!retryable) throw e;
        const ttl = (st === 404 || /no longer available|not found/i.test(em)) ? 3600000 : (st === 429 || /quota|resource.?exhausted|rate.?limit|too many/i.test(em)) ? 900000 : 180000;
        GEMINI_COOLDOWN.set(m, Date.now() + ttl);
      }
    }
    if (lastErr) throw lastErr;
  } else if (provider === 'anthropic') {
    model = model || env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
    const msgs = contents.map(c => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts.map(p => p.text ? { type: 'text', text: p.text } : { type: 'image', source: { type: 'base64', media_type: p.inlineData.mimeType, data: p.inlineData.data } }) }));
    const r = await getJSON('https://api.anthropic.com/v1/messages', { method: 'POST', timeout: 45000, headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: maxTokens, temperature, system: system || '', messages: msgs }) });
    text = (r.content || []).map(x => x.text || '').join('');
  } else {
    const base = provider === 'openai' ? 'https://api.openai.com/v1' : String(env.AI_BASE_URL).replace(/\/$/, '');
    const key = provider === 'openai' ? env.OPENAI_API_KEY : env.AI_API_KEY;
    model = model || (provider === 'openai' ? env.OPENAI_MODEL : env.AI_MODEL) || 'gpt-4o-mini';
    const msgs = [...(system ? [{ role: 'system', content: system }] : []), ...contents.map(c => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts.map(p => p.text || '').join('\n') }))];
    const r = await getJSON(base + '/chat/completions', { method: 'POST', timeout: 45000, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ model, temperature, max_tokens: maxTokens, messages: msgs }) });
    text = r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content;
  }
  if (!text) throw new Error('La IA no devolvió texto.');
  return { text, provider, model };
}
async function askAI(env, req) {
  const mode = req.mode || 'preset';
  if (mode === 'chat') {
    const system = 'Eres el Copiloto de Finanzas personales del usuario en España. Responde en español claro y conciso usando Markdown (listas o tablas si ayudan). Tienes acceso al resumen en tiempo real de sus cuentas, cartera spot, derivados/márgenes/liquidaciones, presupuestos, alertas e impuestos. No inventes datos que no estén en el contexto; si falta algo, indícalo. No ejecutes órdenes ni prometas rentabilidad. CONTEXTO:\n' + JSON.stringify(req.context || {});
    const contents = (req.messages || []).slice(-12).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.text || '') }] }));
    return callAIProvider(env, { provider: req.provider, model: req.model, system, contents, maxTokens: 2000, temperature: 0.3 });
  }
  if (mode === 'categorize') {
    const system = 'Clasifica comercios bancarios en España. Devuelve EXCLUSIVAMENTE JSON válido sin markdown: {"rules":[{"merchant":"...","cat":"..."}]}. Categorías válidas: ' + JSON.stringify(req.categories || []);
    const contents = [{ role: 'user', parts: [{ text: 'Clasifica estos comercios/conceptos: ' + JSON.stringify(req.items || []) }] }];
    return callAIProvider(env, { provider: req.provider, model: req.model, system, contents, maxTokens: 1600, temperature: 0.1 });
  }
  if (mode === 'parse_import') {
    const system = 'Eres un extractor de datos financieros. Analiza el extracto bancario, historial de exchange/broker o captura de pantalla y devuelve EXCLUSIVAMENTE JSON válido sin texto extra ni bloques markdown, con este esquema exacto: {"type":"bank"|"ledger"|"positions","accountName":"nombre sugerido","rows":[...]}. Si type="bank": cada fila {"date":"YYYY-MM-DD","desc":"concepto","amount":numeroConSigno,"bal":numeroONull}. Si type="ledger": cada fila {"t":"YYYY-MM-DD HH:MM:SS","asset":"SIMBOLO","change":numeroConSigno,"kind":"trade"|"deposit"|"withdraw"|"reward"|"fee"|"deriv","note":"detalle"}. Si type="positions": cada fila {"asset":"SIMBOLO","qty":numeroPositivo,"date":"YYYY-MM-DD"}.';
    const parts = [];
    if (req.text) parts.push({ text: 'Extrae todos los movimientos o posiciones de este contenido:\n' + String(req.text).slice(0, 60000) });
    else parts.push({ text: 'Extrae todos los movimientos, operaciones o posiciones visibles en esta imagen.' });
    if (req.imageBase64 && req.imageMime) parts.push({ inlineData: { mimeType: req.imageMime, data: req.imageBase64 } });
    return callAIProvider(env, { provider: req.provider, model: req.model, system, contents: [{ role: 'user', parts }], maxTokens: 4000, temperature: 0.1 });
  }
  const prompt = aiPrompt(req.payload || {});
  return callAIProvider(env, { provider: req.provider, model: req.model, contents: [{ role: 'user', parts: [{ text: prompt }] }], maxTokens: 1400, temperature: 0.25 });
}

function cors(req, env, revealError = false) {
  const origin = (req.headers.get('Origin') || '').replace(/\/$/, ''), allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
  const exposed = revealError && origin ? origin : (allowed || '*');
  return { 'Access-Control-Allow-Origin': exposed, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS', 'Access-Control-Allow-Headers': 'X-Caudal-Token,Content-Type', 'Access-Control-Max-Age': '86400', 'Cache-Control': 'no-store' };
}

export default {
  async fetch(req, env) {
    const origin = (req.headers.get('Origin') || '').replace(/\/$/, ''), allowed = String(env.ALLOWED_ORIGIN || '').replace(/\/$/, '');
    if (allowed && origin && origin !== allowed) {
      const H = cors(req, env, true);
      return new Response(JSON.stringify({ error: 'Origen no permitido', expected: allowed, received: origin, fix: 'ALLOWED_ORIGIN debe coincidir exactamente con el origen de la app, sin barra final.' }), { status: 403, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' } });
    }
    const H = cors(req, env), respond = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
    const url = new URL(req.url);
    if (!env.TOKEN || String(env.TOKEN).length < 20) return respond({ error: 'Falta TOKEN o es demasiado corto (mínimo 20 caracteres).' }, 500);
    if (req.headers.get('X-Caudal-Token') !== env.TOKEN) return respond({ error: 'Código incorrecto' }, 401);
    try {
      if (url.pathname === '/ping') {
        return respond({
          ok: true, version: W_VERSION, kv: !!env.CAUDAL, originProtected: !!allowed, ai: aiProviders(env),
          rollingBackups: !!env.CAUDAL, openBanking: !!(env.ENABLE_BANKING_APP_ID && env.ENABLE_BANKING_PRIVATE_KEY),
          onchain: true, ohlcv: true,
          exchanges: Object.fromEntries(Object.entries(EXCHANGES).map(([k, x]) => [k, x.keys.every(n => env[n])]))
        });
      }
      if (url.pathname === '/balances') {
        const exchanges = {}, errors = {};
        await Promise.all(Object.entries(EXCHANGES).filter(([, x]) => x.keys.every(n => env[n])).map(async ([k, x]) => { try { exchanges[k] = await x.fn(env); } catch (e) { errors[k] = e.message; } }));
        return respond({ exchanges, errors, ts: Date.now() });
      }
      if (url.pathname === '/history') return respond(await exchangeHistory(env, url.searchParams.get('exchange') || ''));
      if (url.pathname === '/prices') return respond(await prices(url));
      if (url.pathname === '/hist') return respond(await hist(url));
      if (url.pathname === '/series') return respond(await series(url));
      if (url.pathname === '/ohlcv') return respond(await ohlcv(url));
      if (url.pathname === '/market') return respond(await market(url));
      if (url.pathname === '/onchain') return respond(await onchain(url));
      if (url.pathname === '/bank/aspsps') {
        const c = (url.searchParams.get('country') || 'ES').toUpperCase();
        return respond(await ebReq(env, '/aspsps?country=' + encodeURIComponent(c)));
      }
      if (url.pathname === '/bank/auth' && req.method === 'POST') {
        const b = JSON.parse(await req.text());
        const valid = new Date(Date.now() + 89 * 864e5).toISOString();
        const r = await ebReq(env, '/auth', { method: 'POST', body: JSON.stringify({ access: { balances: true, transactions: true, valid_until: valid }, aspsp: { name: b.aspspName, country: (b.country || 'ES').toUpperCase() }, psu_type: 'personal', redirect_url: b.redirectUrl, state: b.state || String(Date.now()) }) });
        return respond(r);
      }
      if (url.pathname === '/bank/session' && req.method === 'POST') {
        const b = JSON.parse(await req.text());
        return respond(await ebReq(env, '/sessions', { method: 'POST', body: JSON.stringify({ code: b.code }) }));
      }
      if (url.pathname === '/bank/sync' && req.method === 'POST') {
        const b = JSON.parse(await req.text()), accounts = [], errors = [];
        const from = b.dateFrom ? '?date_from=' + encodeURIComponent(b.dateFrom) : '';
        for (const acc of b.accounts || []) {
          try {
            const [balRes, txRes] = await Promise.all([
              ebReq(env, '/accounts/' + encodeURIComponent(acc.uid) + '/balances'),
              ebReq(env, '/accounts/' + encodeURIComponent(acc.uid) + '/transactions' + from)
            ]);
            const firstBal = (balRes.balances || [])[0];
            const bal = firstBal && firstBal.balance_amount ? +firstBal.balance_amount.amount : null;
            const cur = firstBal && firstBal.balance_amount ? firstBal.balance_amount.currency : (acc.currency || 'EUR');
            const tx = (txRes.transactions || []).map(t => {
              const amt = +(t.transaction_amount && t.transaction_amount.amount || 0);
              const signed = t.credit_debit_indicator === 'DBIT' ? -Math.abs(amt) : t.credit_debit_indicator === 'CRDT' ? Math.abs(amt) : amt;
              const desc = [...(t.remittance_information || []), t.creditor?.name, t.debtor?.name].filter(Boolean).join(' · ') || 'Movimiento bancario';
              return { id: t.entry_reference || t.transaction_id || '', date: (t.booking_date || t.value_date || '').slice(0, 10), desc, amount: signed, currency: (t.transaction_amount && t.transaction_amount.currency) || cur };
            }).filter(x => x.date && Number.isFinite(x.amount));
            accounts.push({ uid: acc.uid, bal, currency: cur, tx });
          } catch (e) { errors.push(acc.uid + ': ' + e.message); }
        }
        return respond({ accounts, errors, ts: Date.now() });
      }
      if (url.pathname === '/ai' && req.method === 'POST') {
        const raw = await req.text();
        if (raw.length > 4500000) return respond({ error: 'Solicitud demasiado grande' }, 413);
        return respond(await askAI(env, JSON.parse(raw)));
      }
      const bm = url.pathname.match(/^\/backups\/([a-f0-9]{20,64})$/);
      if (bm) {
        if (!env.CAUDAL) return respond({ error: 'Falta CAUDAL' }, 500);
        return respond({ items: await env.CAUDAL.get('backup-index:' + bm[1], 'json') || [] });
      }
      const m = url.pathname.match(/^\/sync\/([a-f0-9]{20,64})$/);
      if (m) {
        if (!env.CAUDAL) return respond({ error: 'Falta enlazar el espacio KV como CAUDAL.' }, 500);
        const key = 'sync:' + m[1];
        if (req.method === 'GET') { const v = await env.CAUDAL.get(key); return v ? new Response(v, { headers: { ...H, 'Content-Type': 'application/json' } }) : respond({ error: 'No hay copia (404)' }, 404); }
        if (req.method === 'PUT') {
          const body = await req.text(); if (body.length > 20e6) return respond({ error: 'Copia demasiado grande' }, 413);
          const o = JSON.parse(body); if (!o.data || !o.updated || typeof o.data !== 'string') return respond({ error: 'Copia no válida' }, 400);
          const previousRaw = await env.CAUDAL.get(key); let previous = null; try { previous = previousRaw && JSON.parse(previousRaw); } catch (e) { }
          if (previous && o.baseUpdated != null && +o.baseUpdated !== +previous.updated) return respond({ error: 'Conflicto de sincronización: hay una versión más nueva.', currentUpdated: previous.updated }, 409);
          if (previousRaw && previous && previous.updated) {
            const bkey = 'backup:' + m[1] + ':' + previous.updated; await env.CAUDAL.put(bkey, previousRaw, { expirationTtl: 2592000 });
            const ikey = 'backup-index:' + m[1], old = await env.CAUDAL.get(ikey, 'json') || []; const idx = [{ updated: previous.updated, device: previous.device || '', saved: Date.now() }, ...old.filter(x => x.updated !== previous.updated)].slice(0, 10); await env.CAUDAL.put(ikey, JSON.stringify(idx));
          }
          await env.CAUDAL.put(key, body); return respond({ ok: true, updated: o.updated });
        }
      }
      return respond({ error: 'Ruta desconocida' }, 404);
    } catch (e) { return respond({ error: e.name === 'AbortError' ? 'El servicio externo tardó demasiado.' : e.message }, 500); }
  }
};
