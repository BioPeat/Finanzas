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
let krakenLastNonce = 0, krakenFuturesLastNonce = 0;
async function krakenPrivate(env, path, params = {}) {
  const nonce = String(krakenLastNonce = Math.max(Date.now() * 1000, krakenLastNonce + 1));
  const key = String(env.KRAKEN_KEY || '').trim(), sec = String(env.KRAKEN_SECRET || '').trim();
  const body = new URLSearchParams({ nonce, ...params }).toString();
  const sha = await crypto.subtle.digest('SHA-256', enc.encode(nonce + body));
  const msg = new Uint8Array([...enc.encode(path), ...new Uint8Array(sha)]);
  const sig = b64(await hmac('SHA-512', unb64(sec), msg));
  const r = await getJSON('https://api.kraken.com' + path, { method: 'POST', body, headers: { 'API-Key': key, 'API-Sign': sig, 'Content-Type': 'application/x-www-form-urlencoded' } });
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
  const nonce = String(krakenFuturesLastNonce = Math.max(Date.now(), krakenFuturesLastNonce + 1));
  const key = String(env.KRAKEN_FUTURES_KEY || '').trim(), sec = String(env.KRAKEN_FUTURES_SECRET || '').trim();
  const signPath = path.replace(/^\/derivatives(?=\/)/, '');
  const msg = params + nonce + signPath;
  const sha = await crypto.subtle.digest('SHA-256', enc.encode(msg));
  const authent = b64(await hmac('SHA-512', unb64(sec), sha));
  const url = 'https://futures.kraken.com' + path + (params ? '?' + params : '');
  const r = await getJSON(url, { headers: { APIKey: key, Authent: authent, Nonce: nonce } });
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
  const k = String(key || '').trim(), sec = String(secret || '').trim(), passRaw = String(passphrase || '').trim();
  const ts = String(Date.now());
  const sign = b64(await hmac('SHA-256', sec, ts + method + path + body));
  const pass = b64(await hmac('SHA-256', sec, passRaw));
  const r = await getJSON(base + path, {
    method,
    body: body || undefined,
    headers: { 'KC-API-KEY': k, 'KC-API-SIGN': sign, 'KC-API-TIMESTAMP': ts, 'KC-API-PASSPHRASE': pass, 'KC-API-KEY-VERSION': '2', 'Content-Type': 'application/json' }
  });
  if (r.code && r.code !== '200000') {
    const err = new Error(r.msg || r.code);
    err.kcCode = String(r.code);
    throw err;
  }
  return r;
}
function isKucoinAuthErr(e) {
  return (e && e.status === 401) || /400003|400004|Invalid KC-API-KEY/i.test(String(e && (e.kcCode || e.message) || ''));
}
async function kucoin(env) {
  const assets = {}, positions = [], warnings = [];
  let kcBase = String(env.KUCOIN_BASE || 'https://api.kucoin.com').replace(/\/$/, '');
  let spot;
  try {
    spot = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/accounts');
  } catch (e) {
    if (!env.KUCOIN_BASE && isKucoinAuthErr(e)) {
      kcBase = 'https://api.kucoin.eu';
      spot = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/accounts');
    } else throw e;
  }
  for (const a of spot.data || []) add(assets, a.currency, a.balance);

  const fk = env.KUCOIN_FUTURES_KEY || env.KUCOIN_KEY;
  const fs = env.KUCOIN_FUTURES_SECRET || env.KUCOIN_SECRET;
  const fp = env.KUCOIN_FUTURES_PASSPHRASE || env.KUCOIN_PASSPHRASE;
  const futBase = String(env.KUCOIN_FUTURES_BASE || 'https://api-futures.kucoin.com').replace(/\/$/, '');
  const opt = async (name, fn) => { try { await fn(); } catch (e) { warnings.push(name + ': ' + e.message); } };

  await opt('earn', async () => {
    const er = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/earn/hold-assets');
    for (const item of (er.data && er.data.items) || []) add(assets, item.currency, item.holdAmount);
  });
  await opt('futuros saldo', async () => {
    for (const ccy of ['USDT', 'BTC', 'USDC']) {
      try {
        const ov = await kucoinReq(fk, fs, fp, futBase, '/api/v1/account-overview?currency=' + ccy);
        if (ov.data && +ov.data.accountEquity) add(assets, ccy, ov.data.accountEquity);
      } catch (e) { }
    }
  });
  await opt('futuros posiciones', async () => {
    const pos = await kucoinReq(fk, fs, fp, futBase, '/api/v1/positions');
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
async function okxReq(env, path, base = '') {
  const root = (base || env.OKX_BASE || 'https://www.okx.com').replace(/\/$/, '');
  const key = String(env.OKX_KEY || '').trim(), sec = String(env.OKX_SECRET || '').trim(), pass = String(env.OKX_PASSPHRASE || '').trim();
  const ts = new Date().toISOString(), pre = ts + 'GET' + path;
  const sign = b64(await hmac('SHA-256', sec, pre));
  const r = await getJSON(root + path, { headers: { 'OK-ACCESS-KEY': key, 'OK-ACCESS-SIGN': sign, 'OK-ACCESS-TIMESTAMP': ts, 'OK-ACCESS-PASSPHRASE': pass } });
  if (r.code && r.code !== '0') {
    const err = new Error(r.msg || r.code);
    err.okxCode = String(r.code);
    throw err;
  }
  return r;
}
function isOkxRegionErr(e) {
  return (e && e.status === 401) || /50119|50111|50101|API key doesn't exist|Invalid OK-ACCESS-KEY/i.test(String(e && (e.okxCode || e.message) || ''));
}
async function okx(env) {
  let okxBase = String(env.OKX_BASE || 'https://www.okx.com').replace(/\/$/, '');
  let r;
  try {
    r = await okxReq(env, '/api/v5/account/balance', okxBase);
  } catch (e) {
    if (!env.OKX_BASE && isOkxRegionErr(e)) {
      okxBase = 'https://eea.okx.com';
      r = await okxReq(env, '/api/v5/account/balance', okxBase);
    } else throw e;
  }
  const assets = {}, positions = [], warnings = [];
  for (const d of (r.data && r.data[0] && r.data[0].details) || []) add(assets, d.ccy, d.eq || d.cashBal || d.availBal);
  try {
    const fr = await okxReq(env, '/api/v5/asset/balances', okxBase);
    for (const d of fr.data || []) add(assets, d.ccy, d.bal != null ? d.bal : ((+d.availBal || 0) + (+d.frozenBal || 0)));
  } catch (e) { warnings.push('fondos: ' + e.message); }
  try {
    const pr = await okxReq(env, '/api/v5/account/positions', okxBase);
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
    let kcBase = String(env.KUCOIN_BASE || 'https://api.kucoin.com').replace(/\/$/, '');
    try {
      let lg;
      try {
        lg = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/accounts/ledgers?pageSize=50');
      } catch (e) {
        if (!env.KUCOIN_BASE && isKucoinAuthErr(e)) {
          kcBase = 'https://api.kucoin.eu';
          lg = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/accounts/ledgers?pageSize=50');
        } else throw e;
      }
      for (const l of (lg.data && lg.data.items) || []) {
        const ch = (l.direction === 'out' ? -1 : 1) * Math.abs(+l.amount || 0);
        const bt = String(l.bizType || '');
        const kind = /DEPOSIT/i.test(bt) ? 'deposit' : /WITHDRAW/i.test(bt) ? 'withdraw' : /TRANSFER/i.test(bt) ? 'move' : /STAKING|REWARD|EARN|BONUS|INTEREST/i.test(bt) ? 'reward' : /TRADE|EXCHANGE|CONVERT/i.test(bt) ? 'trade' : 'other';
        if (ch) rows.push({ t: fmtISO(+l.createdAt), asset: l.currency, change: ch, kind, ref: 'kc|' + (l.id || l.createdAt), note: bt });
        if (+l.fee) rows.push({ t: fmtISO(+l.createdAt), asset: l.currency, change: -Math.abs(+l.fee), kind: 'fee', ref: 'kc|' + (l.id || l.createdAt), note: 'Comisión' });
      }
    } catch (e) { warnings.push('ledgers spot: ' + e.message); }
    try {
      const fills = await kucoinReq(env.KUCOIN_KEY, env.KUCOIN_SECRET, env.KUCOIN_PASSPHRASE, kcBase, '/api/v1/fills?pageSize=50');
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
function derLen(n) {
  return n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, (n >> 8) & 0xff, n & 0xff];
}
function pkcs1ToPkcs8(der) {
  const b = der instanceof Uint8Array ? der : new Uint8Array(der);
  const ver = [0x02, 0x01, 0x00];
  const algId = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const octHead = [0x04, ...derLen(b.length)];
  const innerLen = ver.length + algId.length + octHead.length + b.length;
  const seqHead = [0x30, ...derLen(innerLen)];
  const out = new Uint8Array(seqHead.length + innerLen);
  let off = 0;
  for (const part of [seqHead, ver, algId, octHead, b]) { out.set(part, off); off += part.length; }
  return out;
}
async function enableBankingJWT(env) {
  if (!env.ENABLE_BANKING_APP_ID || !env.ENABLE_BANKING_PRIVATE_KEY) throw new Error('Enable Banking no está configurado en los secretos del Worker.');
  const appId = String(env.ENABLE_BANKING_APP_ID).trim().replace(/^["']|["']$/g, '');
  const rawPem = String(env.ENABLE_BANKING_PRIVATE_KEY).trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
  const isPkcs1 = /-----BEGIN RSA PRIVATE KEY-----/i.test(rawPem);
  const pem = rawPem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');
  let der = unb64(pem);
  if (isPkcs1) der = pkcs1ToPkcs8(der);
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(Date.now() / 1000);
  const head = b64u(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: appId })));
  const pay = b64u(enc.encode(JSON.stringify({ iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat, exp: iat + 300 })));
  const sig = b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(head + '.' + pay)));
  return head + '.' + pay + '.' + sig;
}
async function ebReq(env, path, opts = {}) {
  const jwt = await enableBankingJWT(env);
  const hdrs = { Authorization: 'Bearer ' + jwt, ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) };
  return getJSON('https://api.enablebanking.com' + path, { ...opts, headers: hdrs });
}
function ebPsuHeaders(req) {
  const h = {};
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  const ua = String(req.headers.get('user-agent') || '').trim().slice(0, 256);
  if (ip) h['Psu-Ip-Address'] = ip;
  if (ua) h['Psu-User-Agent'] = ua;
  return h;
}
function parseEbBalanceAmount(b) {
  const raw = b?.balance_amount?.amount;
  if (raw == null || raw === '') return null;
  const n = +raw;
  if (!Number.isFinite(n)) return null;
  return String(b?.credit_debit_indicator || '').toUpperCase() === 'DBIT' && n > 0 ? -n : n;
}
function pickEnableBankingBalance(bals) {
  if (!Array.isArray(bals) || !bals.length) return null;
  const order = ['ITAV', 'XPCD', 'ITBD', 'CLAV', 'CLBD', 'FWAV', 'OPAV', 'OPBD'];
  const stamp = b => String(b?.last_change_date_time || b?.reference_date || '');
  for (const tp of order) {
    const matches = bals.filter(x => x && x.balance_type === tp && parseEbBalanceAmount(x) != null);
    if (matches.length) return matches.sort((a, b) => stamp(b).localeCompare(stamp(a)))[0];
  }
  return bals.find(x => x && parseEbBalanceAmount(x) != null) || bals[0];
}
async function fetchEbTransactions(effEnv, uid, dateFrom, strategy, psuHeaders) {
  const run = async (df, strat) => {
    const qs = new URLSearchParams();
    if (df) qs.set('date_from', df);
    if (strat && strat !== 'default') qs.set('strategy', strat);
    const qStr = qs.toString();
    const first = await ebReq(effEnv, '/accounts/' + encodeURIComponent(uid) + '/transactions' + (qStr ? '?' + qStr : ''), { headers: psuHeaders });
    const raw = [...(first?.transactions || [])];
    const warnings = [];
    let cont = first?.continuation_key || '', page = 1;
    while (cont && page < 8) {
      try {
        const pqs = new URLSearchParams();
        if (df) pqs.set('date_from', df);
        pqs.set('continuation_key', cont);
        const nextTx = await ebReq(effEnv, '/accounts/' + encodeURIComponent(uid) + '/transactions?' + pqs.toString(), { headers: psuHeaders });
        raw.push(...(nextTx?.transactions || []));
        cont = nextTx?.continuation_key || '';
        page++;
      } catch (pageErr) {
        warnings.push('Movimientos (pág. ' + (page + 1) + '): ' + formatEbError(pageErr));
        break;
      }
    }
    return { raw, warnings };
  };
  try {
    return await run(dateFrom, strategy);
  } catch (e) {
    const isPeriodErr = e?.status === 422 || /WRONG_TRANSACTIONS_PERIOD|out of bound|period/i.test(String(e?.message || ''));
    if (!isPeriodErr) throw e;
    const d30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    try {
      return await run(d30, 'default');
    } catch (e2) {
      const isPeriodErr2 = e2?.status === 422 || /WRONG_TRANSACTIONS_PERIOD|out of bound|period/i.test(String(e2?.message || ''));
      if (!isPeriodErr2) throw e2;
      return await run('', 'default');
    }
  }
}
function formatEbError(err) {
  const msg = String(err?.message || err || 'Error desconocido');
  if (/\b(401|403)\b|EXPIRED|UNAUTHORIZED|INVALID_SESSION/i.test(msg)) return msg + ' (sesión PSD2 caducada: vuelve a autorizar el banco en Conectar)';
  if (/\b429\b|RATE_LIMIT|ACCESS_EXCEEDED/i.test(msg)) return msg + ' (límite temporal del banco PSD2; reintenta más tarde)';
  return msg;
}
async function resolveEbValidUntil(env, aspspName, country, maxValidSec, psuHeaders) {
  let maxSec = +maxValidSec || 0;
  if (!maxSec && aspspName) {
    try {
      const list = await ebReq(env, '/aspsps?country=' + encodeURIComponent(country), { headers: psuHeaders });
      const target = String(aspspName).trim().toLowerCase();
      const found = (list?.aspsps || []).find(x => String(x?.name || '').trim().toLowerCase() === target);
      if (found && +found.maximum_consent_validity > 0) maxSec = +found.maximum_consent_validity;
    } catch (e) { }
  }
  const safeSec = maxSec > 0 ? Math.max(86400, Math.min(maxSec - 3600, 180 * 86400 - 3600)) : 89 * 86400;
  return new Date(Date.now() + safeSec * 1000).toISOString();
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

function parseAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
}
function isOriginAllowed(origin, allowedList) {
  if (!allowedList.length || !origin) return true;
  const o = origin.toLowerCase();
  return allowedList.some(a => a.toLowerCase() === o);
}
function workerMirrors(env) {
  return String(env.FALLBACK_URLS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
}
function cors(req, env, revealError = false) {
  const origin = (req.headers.get('Origin') || '').replace(/\/$/, ''), allowedList = parseAllowedOrigins(env);
  const matched = origin && allowedList.find(a => a.toLowerCase() === origin.toLowerCase());
  const exposed = (revealError && origin) ? origin : (matched || allowedList[0] || '*');
  return { 'Access-Control-Allow-Origin': exposed, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS', 'Access-Control-Allow-Headers': 'X-Caudal-Token,Content-Type', 'Access-Control-Max-Age': '86400', 'Cache-Control': 'no-store' };
}

const VAULT_ALLOWLIST = [
  'KUCOIN_KEY', 'KUCOIN_SECRET', 'KUCOIN_PASSPHRASE',
  'KUCOIN_FUTURES_KEY', 'KUCOIN_FUTURES_SECRET', 'KUCOIN_FUTURES_PASSPHRASE',
  'KRAKEN_KEY', 'KRAKEN_SECRET',
  'KRAKEN_FUTURES_KEY', 'KRAKEN_FUTURES_SECRET',
  'OKX_KEY', 'OKX_SECRET', 'OKX_PASSPHRASE',
  'BINANCE_KEY', 'BINANCE_SECRET',
  'BYBIT_KEY', 'BYBIT_SECRET',
  'ENABLE_BANKING_APP_ID', 'ENABLE_BANKING_PRIVATE_KEY',
  'GEMINI_API_KEY'
];

const PROVIDER_KEYS = {
  eb: ['ENABLE_BANKING_APP_ID', 'ENABLE_BANKING_PRIVATE_KEY'],
  kucoin: EXCHANGES.kucoin.keys,
  kraken: EXCHANGES.kraken.keys,
  kraken_futures: EXCHANGES.kraken_futures.keys,
  okx: EXCHANGES.okx.keys,
  binance: EXCHANGES.binance.keys,
  bybit: EXCHANGES.bybit.keys
};

async function safeEq(a, b) {
  const sa = String(a || ''), sb = String(b || '');
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(sa)),
    crypto.subtle.digest('SHA-256', enc.encode(sb))
  ]);
  const ua = new Uint8Array(ha), ub = new Uint8Array(hb);
  let diff = sa.length ^ sb.length;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

async function sha256Hex(s) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(String(s || ''))));
}

async function checkToken(tok, env, origin, allowedOk, isSyncPath) {
  const t = String(tok || '');
  if (t.length < 20) return false;
  if (await safeEq(t, env.TOKEN)) {
    if (isSyncPath && env.CAUDAL) {
      const cur = await env.CAUDAL.get('auth:owner_sha256');
      if (!cur) await env.CAUDAL.put('auth:owner_sha256', await sha256Hex(t));
    }
    return true;
  }
  if (!env.CAUDAL || !allowedOk) return false;
  const tokHash = await sha256Hex(t);
  let ownerHash = await env.CAUDAL.get('auth:owner_sha256');
  if (!ownerHash && isSyncPath) {
    await env.CAUDAL.put('auth:owner_sha256', tokHash);
    ownerHash = tokHash;
  }
  return !!ownerHash && (await safeEq(tokHash, ownerHash));
}

async function vaultKey(env) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('caudal-vault-v1:' + String(env.TOKEN || '')));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function writeVault(env, obj) {
  const k = await vaultKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, enc.encode(JSON.stringify(obj || {})));
  await env.CAUDAL.put('vault:credentials', JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) }));
}

async function readVault(env) {
  if (!env.CAUDAL) return { data: {}, locked: false };
  let stored = null;
  try {
    stored = await env.CAUDAL.get('vault:credentials', 'json');
  } catch (e) {
    return { data: {}, locked: false };
  }
  if (!stored || typeof stored !== 'object') return { data: {}, locked: false };
  if (stored.v === 1 && typeof stored.iv === 'string' && typeof stored.ct === 'string') {
    try {
      const k = await vaultKey(env);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(stored.iv) }, k, unb64(stored.ct));
      const dec = JSON.parse(new TextDecoder().decode(pt));
      return { data: (dec && typeof dec === 'object') ? dec : {}, locked: false };
    } catch (e) {
      return { data: {}, locked: true };
    }
  }
  const clean = Object.fromEntries(Object.entries(stored).filter(([k, v]) => VAULT_ALLOWLIST.includes(k) && typeof v === 'string' && v.trim()));
  try { await writeVault(env, clean); } catch (e) { }
  return { data: clean, locked: false };
}

async function withVault(env) {
  const { data: vault, locked } = await readVault(env);
  const fromVault = {};
  for (const [k, v] of Object.entries(vault)) {
    if (typeof v === 'string' && v.trim() && !(typeof env[k] === 'string' && env[k].trim())) {
      fromVault[k] = v.trim();
    }
  }
  return { ...env, ...fromVault, __vaultLocked: !!locked };
}

function credentialSources(rawEnv, effEnv) {
  const hasVal = (o, k) => typeof o[k] === 'string' && o[k].trim().length > 0;
  return Object.fromEntries(Object.entries(PROVIDER_KEYS).map(([p, keys]) => {
    if (!keys.every(k => hasVal(effEnv, k))) return [p, null];
    if (keys.every(k => hasVal(rawEnv, k))) return [p, 'env'];
    return [p, 'vault'];
  }));
}

export default {
  async fetch(req, env) {
    const origin = (req.headers.get('Origin') || '').replace(/\/$/, ''), allowedList = parseAllowedOrigins(env);
    const originAllowed = isOriginAllowed(origin, allowedList);
    if (allowedList.length && origin && !originAllowed) {
      const H = cors(req, env, true);
      return new Response(JSON.stringify({ error: 'Origen no permitido', expected: allowedList[0], allowedOrigins: allowedList, received: origin, fix: 'ALLOWED_ORIGIN debe coincidir exactamente con el origen de la app, sin barra final.' }), { status: 403, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' } });
    }
    const H = cors(req, env), respond = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...H, 'Content-Type': 'application/json; charset=utf-8' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: H });
    const url = new URL(req.url);
    if (!env.TOKEN || String(env.TOKEN).length < 20) return respond({ error: 'Falta TOKEN o es demasiado corto (mínimo 20 caracteres).' }, 500);
    const tok = req.headers.get('X-Caudal-Token') || '';
    const isSyncPath = /^\/sync\/[a-f0-9]{20,64}$/.test(url.pathname);
    const allowedOk = allowedList.length > 0 && !!origin && originAllowed;
    if (!(await checkToken(tok, env, origin, allowedOk, isSyncPath))) {
      return respond({ error: 'TOKEN no coincide. En Ajustes → Vincular otro dispositivo abre el enlace desde tu sesión principal o introduce el TOKEN configurado en Cloudflare.' }, 401);
    }
    let _effEnv = null;
    const getEffEnv = async () => _effEnv || (_effEnv = await withVault(env));
    const mirrors = workerMirrors(env);
    try {
      if (url.pathname === '/ping' || (url.pathname === '/credentials' && req.method === 'GET')) {
        const effEnv = await getEffEnv();
        return respond({
          ok: true, version: W_VERSION, kv: !!effEnv.CAUDAL, originProtected: allowedList.length > 0, ai: aiProviders(effEnv),
          rollingBackups: !!effEnv.CAUDAL, openBanking: !!(effEnv.ENABLE_BANKING_APP_ID && effEnv.ENABLE_BANKING_PRIVATE_KEY),
          onchain: true, ohlcv: true, vaultLocked: !!effEnv.__vaultLocked, mirrors,
          credentialSources: credentialSources(env, effEnv),
          exchanges: Object.fromEntries(Object.entries(EXCHANGES).map(([k, x]) => [k, x.keys.every(n => effEnv[n])]))
        });
      }
      if (url.pathname === '/credentials' && req.method === 'POST') {
        if (!env.CAUDAL) return respond({ error: 'Falta enlazar el espacio KV como CAUDAL.' }, 500);
        const allow = new Set(VAULT_ALLOWLIST);
        const body = JSON.parse((await req.text()) || '{}');
        const current = await readVault(env);
        if (current.locked && !body.forceReset) {
          return respond({ error: 'La bóveda cifrada requiere confirmación para sobrescribirse tras cambiar el TOKEN.', vaultLocked: true }, 409);
        }
        const vault = current.locked ? {} : { ...current.data };
        if (body.set && typeof body.set === 'object') {
          for (const [k, v] of Object.entries(body.set)) {
            if (allow.has(k) && typeof v === 'string' && v.trim()) vault[k] = v.trim();
          }
        }
        if (Array.isArray(body.clear)) {
          for (const k of body.clear) {
            if (allow.has(k)) delete vault[k];
          }
        } else if (body.clear && typeof body.clear === 'object') {
          for (const [k, v] of Object.entries(body.clear)) {
            if (v && allow.has(k)) delete vault[k];
          }
        }
        await writeVault(env, vault);
        const merged = await withVault(env);
        return respond({
          ok: true, version: W_VERSION, kv: !!merged.CAUDAL, originProtected: allowedList.length > 0, ai: aiProviders(merged),
          rollingBackups: !!merged.CAUDAL, openBanking: !!(merged.ENABLE_BANKING_APP_ID && merged.ENABLE_BANKING_PRIVATE_KEY),
          onchain: true, ohlcv: true, vaultLocked: !!merged.__vaultLocked, mirrors,
          credentialSources: credentialSources(env, merged),
          exchanges: Object.fromEntries(Object.entries(EXCHANGES).map(([k, x]) => [k, x.keys.every(n => merged[n])]))
        });
      }
      if (url.pathname === '/balances') {
        const effEnv = await getEffEnv();
        const exchanges = {}, errors = {};
        await Promise.all(Object.entries(EXCHANGES).filter(([, x]) => x.keys.every(n => effEnv[n])).map(async ([k, x]) => { try { exchanges[k] = await x.fn(effEnv); } catch (e) { errors[k] = e.message; } }));
        return respond({ exchanges, errors, ts: Date.now() });
      }
      if (url.pathname === '/history') return respond(await exchangeHistory(await getEffEnv(), url.searchParams.get('exchange') || ''));
      if (url.pathname === '/prices') return respond(await prices(url));
      if (url.pathname === '/hist') return respond(await hist(url));
      if (url.pathname === '/series') return respond(await series(url));
      if (url.pathname === '/ohlcv') return respond(await ohlcv(url));
      if (url.pathname === '/market') return respond(await market(url));
      if (url.pathname === '/onchain') return respond(await onchain(url));
      if (url.pathname === '/bank/aspsps') {
        const c = (url.searchParams.get('country') || 'ES').toUpperCase();
        return respond(await ebReq(await getEffEnv(), '/aspsps?country=' + encodeURIComponent(c)));
      }
      if (url.pathname === '/bank/auth' && req.method === 'POST') {
        const effEnv = await getEffEnv();
        const psuHeaders = ebPsuHeaders(req);
        const b = JSON.parse(await req.text());
        const country = (b.country || 'ES').toUpperCase();
        const valid = await resolveEbValidUntil(effEnv, b.aspspName, country, +b.maxValidSec || 0, psuHeaders);
        const r = await ebReq(effEnv, '/auth', { method: 'POST', headers: psuHeaders, body: JSON.stringify({ access: { balances: true, transactions: true, valid_until: valid }, aspsp: { name: b.aspspName, country }, psu_type: 'personal', redirect_url: b.redirectUrl, state: b.state || String(Date.now()) }) });
        return respond(r);
      }
      if (url.pathname === '/bank/session' && req.method === 'POST') {
        const b = JSON.parse(await req.text());
        const ses = await ebReq(await getEffEnv(), '/sessions', { method: 'POST', headers: ebPsuHeaders(req), body: JSON.stringify({ code: b.code }) });
        if (ses && !ses.accounts?.length && Array.isArray(ses.accounts_data)) ses.accounts = ses.accounts_data;
        return respond(ses);
      }
      if (url.pathname === '/bank/sync' && req.method === 'POST') {
        const effEnv = await getEffEnv();
        const psuHeaders = ebPsuHeaders(req);
        const b = JSON.parse(await req.text()), accounts = [], errors = [];
        await Promise.all((b.accounts || []).map(async acc => {
          try {
            const df = acc.dateFrom ?? b.dateFrom ?? '';
            const strat = acc.strategy || b.strategy || 'default';
            const [balSettled, txSettled] = await Promise.allSettled([
              ebReq(effEnv, '/accounts/' + encodeURIComponent(acc.uid) + '/balances', { headers: psuHeaders }),
              fetchEbTransactions(effEnv, acc.uid, df, strat, psuHeaders)
            ]);
            if (balSettled.status === 'rejected' && txSettled.status === 'rejected') {
              errors.push(acc.uid + ': ' + formatEbError(balSettled.reason));
              return;
            }
            const warnings = [];
            let bal = null, cur = acc.currency || 'EUR', balanceType = '', referenceDate = '';
            if (balSettled.status === 'fulfilled') {
              const firstBal = pickEnableBankingBalance(balSettled.value?.balances || []);
              bal = parseEbBalanceAmount(firstBal);
              cur = firstBal?.balance_amount?.currency || cur;
              balanceType = firstBal?.balance_type || '';
              referenceDate = firstBal?.reference_date || '';
            } else {
              warnings.push('Saldo: ' + formatEbError(balSettled.reason));
            }
            const rawTx = [];
            if (txSettled.status === 'fulfilled') {
              rawTx.push(...(txSettled.value?.raw || []));
              if (txSettled.value?.warnings?.length) warnings.push(...txSettled.value.warnings);
            } else {
              warnings.push('Movimientos: ' + formatEbError(txSettled.reason));
            }
            const tx = rawTx
              .filter(t => String(t?.status || '').toUpperCase() !== 'PDNG')
              .map(t => {
                const amt = +(t.transaction_amount && t.transaction_amount.amount || 0);
                const signed = t.credit_debit_indicator === 'DBIT' ? -Math.abs(amt) : t.credit_debit_indicator === 'CRDT' ? Math.abs(amt) : amt;
                const rem = Array.isArray(t.remittance_information) ? t.remittance_information : (t.remittance_information ? [t.remittance_information] : []);
                const desc = [...rem, t.creditor?.name, t.debtor?.name, t.additional_information].filter(Boolean).join(' · ') || 'Movimiento bancario';
                const rawAfter = t.balance_after_transaction?.amount;
                const balAfter = rawAfter != null && rawAfter !== '' && Number.isFinite(+rawAfter) ? +rawAfter : null;
                return { id: t.entry_reference || t.transaction_id || '', date: (t.booking_date || t.value_date || t.transaction_date || '').slice(0, 10), desc, amount: signed, bal: balAfter, currency: (t.transaction_amount && t.transaction_amount.currency) || cur };
              }).filter(x => x.date && Number.isFinite(x.amount));
            accounts.push({ uid: acc.uid, bal, currency: cur, balanceType, referenceDate, tx, warnings });
          } catch (e) { errors.push(acc.uid + ': ' + formatEbError(e)); }
        }));
        return respond({ accounts, errors, ts: Date.now() });
      }
      if (url.pathname === '/ai' && req.method === 'POST') {
        const raw = await req.text();
        if (raw.length > 4500000) return respond({ error: 'Solicitud demasiado grande' }, 413);
        return respond(await askAI(await getEffEnv(), JSON.parse(raw)));
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
          if (previous && o.baseUpdated != null && +o.baseUpdated !== +previous.updated) return respond({ error: 'Conflicto de sincronización: hay una versión más nueva.', currentUpdated: previous.updated, current: previous }, 409);
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
