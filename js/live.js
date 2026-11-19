// ===== Datos en directo (WebSocket, precios, velas OHLCV, técnico, radar y TradingView) =====
"use strict";

let pricesBusy = false, liveWS = null, liveConnected = false, liveReconnectTimer = 0, lastWSRestart = 0;

function startLiveStream() {
  if (typeof WebSocket !== 'function' || navigator.onLine === false || window.__NO_LIVE_WS__) return;
  if (/^https:\/\/worker\.test/.test(state.settings.worker || '')) return;
  const syms = trackedAssets().filter(s => isCryptoish(s) && !FIAT.includes(s) && !STABLE.includes(s)).slice(0, 18);
  if (!syms.length) return;
  const streams = ['eurusdt@miniTicker', ...syms.map(s => s.toLowerCase() + 'usdt@miniTicker')].join('/');
  try {
    if (liveWS) { liveWS.onclose = null; liveWS.close(); liveWS = null; }
    const ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streams);
    liveWS = ws;
    ws.onopen = () => {
      liveConnected = true;
      $$('.live-dot').forEach(d => d.classList.add('on'));
    };
    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data), d = msg.data; if (!d || !d.s) return;
        const rawSym = d.s, last = +d.c, open = +d.o;
        if (!isFinite(last) || last <= 0) return;
        if (rawSym === 'EURUSDT') { state.prices.EURUSD = { rate: last, ts: Date.now() }; return; }
        const sym = rawSym.replace(/USDT$/, '');
        const prevEur = state.prices[sym]?.eur || 0;
        const eurusdRate = fx('USD') || 1.08;
        const eur = last / eurusdRate;
        const chg = open ? ((last / open - 1) * 100) : (state.prices[sym]?.chg ?? null);
        state.prices[sym] = { usd: last, eur, chg, ts: Date.now() };
        patchLiveDOM(sym, eur, chg, prevEur);
        checkPriceAlertsLive(sym, eur);
      } catch (e) { }
    };
    ws.onerror = () => { liveConnected = false; };
    ws.onclose = () => {
      liveConnected = false;
      $$('.live-dot').forEach(d => d.classList.remove('on'));
      clearTimeout(liveReconnectTimer);
      if (document.visibilityState === 'visible') liveReconnectTimer = setTimeout(startLiveStream, 12000);
    };
  } catch (e) { liveConnected = false; }
}
function stopLiveStream() {
  clearTimeout(liveReconnectTimer);
  if (liveWS) { try { liveWS.onclose = null; liveWS.close(); } catch (e) { } liveWS = null; }
  liveConnected = false;
}
function patchLiveDOM(sym, eur, chg, prevEur) {
  const dir = prevEur && Math.abs(eur - prevEur) / prevEur > 0.0001 ? (eur > prevEur ? 'tick-up' : 'tick-down') : '';
  for (const el of document.querySelectorAll('[data-live-price="' + sym + '"]')) {
    el.innerHTML = money(eur, { d: eur < 1 ? 4 : 2 });
    if (dir) { el.classList.remove('tick-up', 'tick-down'); void el.offsetWidth; el.classList.add(dir); }
  }
  if (chg != null) {
    for (const el of document.querySelectorAll('[data-live-chg="' + sym + '"]')) {
      el.textContent = pct(chg); el.className = 'num ' + cls(chg);
    }
  }
  for (const el of document.querySelectorAll('[data-live-nw]')) {
    el.innerHTML = moneyBig(netWorth().total);
  }
  for (const d of derivRows()) {
    if (d.markSym === sym) {
      const pEl = document.querySelector('[data-live-dpnl="' + d.id + '"]');
      if (pEl) { pEl.innerHTML = money(d.pnlEUR, { sign: true }); pEl.className = 'num ' + cls(d.pnlEUR); }
    }
  }
}
const firedAlertsToday = new Set();
function checkPriceAlertsLive(sym, eur) {
  for (const pa of state.priceAlerts || []) {
    if (!pa.active || pa.sym !== sym) continue;
    const key = pa.id + '|' + today(); if (firedAlertsToday.has(key)) continue;
    if ((pa.dir === 'above' && eur >= pa.target) || (pa.dir === 'below' && eur <= pa.target)) {
      firedAlertsToday.add(key);
      toast('Alerta ' + sym + ': ' + nf(eur, eur < 1 ? 4 : 2) + ' € (' + (pa.dir === 'above' ? '≥' : '≤') + ' ' + nf(pa.target, 2) + ' €)');
    }
  }
}

async function refreshPrices(force = false) {
  if (pricesBusy && !force) return; pricesBusy = true;
  try {
    const syms = trackedAssets(), cryptos = syms.filter(s => isCryptoish(s) && !FIAT.includes(s)), yahoo = syms.filter(s => !isCryptoish(s) && !FIAT.includes(s)).map(s => state.assets[s]?.yahoo || s);
    let res = null;
    if (state.settings.worker) { try { res = await api('/prices?crypto=' + encodeURIComponent(cryptos.join(',')) + '&yahoo=' + encodeURIComponent(yahoo.join(','))); } catch (e) { console.warn(e); } }
    if (!res) res = await directPrices(cryptos);
    const now = Date.now();
    if (res.eurusd) state.prices.EURUSD = { rate: res.eurusd, ts: now };
    for (const [k, v] of Object.entries(res.crypto || {})) if (v && v.usd) state.prices[k] = { usd: v.usd, eur: v.usd / (res.eurusd || fx('USD')), chg: v.chg ?? null, ts: now };
    for (const s of syms.filter(s => !isCryptoish(s) && !FIAT.includes(s))) {
      const y = res.yahoo?.[state.assets[s]?.yahoo || s];
      if (y && y.price) { const eur = y.cur === 'EUR' ? y.price : y.cur === 'GBp' ? y.price / 100 / fx('GBP') : y.price / (fx(y.cur) || fx('USD')); state.prices[s] = { eur, chg: y.chg ?? null, ts: now, cur: y.cur }; }
    }
    save(false); if (ready) render();
    if (Date.now() - lastWSRestart > 60000) { lastWSRestart = Date.now(); startLiveStream(); }
  } finally { pricesBusy = false; }
}
async function directPrices(cryptos) {
  const base = 'https://data-api.binance.vision/api/v3/ticker/24hr?symbol=', out = { crypto: {} };
  const get = async s => { try { const r = await fetch(base + s); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } };
  const eu = await get('EURUSDT'); if (eu) out.eurusd = +eu.lastPrice;
  await Promise.all(cryptos.map(async c => { if (STABLE.includes(c)) { out.crypto[c] = { usd: 1, chg: 0 }; return; } const t = await get(c + 'USDT'); if (t) out.crypto[c] = { usd: +t.lastPrice, chg: +t.priceChangePercent }; }));
  return out;
}
async function priceAt(sym, t) {
  if (sym === 'EUR') return 1;
  const hour = t.slice(0, 13).replace(' ', 'T'), key = sym + '|' + hour;
  if (state.hist[key]) return state.hist[key];
  const ms = Date.parse(hour + ':00:00Z'); let v = null;
  try {
    if (state.settings.worker) { const r = await api('/hist?sym=' + sym + '&t=' + ms); v = r && r.eur; }
    else {
      const k = async s => { const r = await fetch('https://data-api.binance.vision/api/v3/klines?symbol=' + s + '&interval=1h&startTime=' + ms + '&limit=1'); if (!r.ok) return null; const j = await r.json(); return j[0] ? +j[0][1] : null; };
      const eu = await k('EURUSDT'), p = STABLE.includes(sym) && sym !== 'EURC' ? 1 : FIAT.includes(sym) ? null : await k(sym + 'USDT');
      if (eu && p) v = p / eu; else if (sym === 'USD' && eu) v = 1 / eu;
    }
  } catch (e) { }
  if (v) state.hist[key] = v;
  return v;
}

async function loadOHLCV(sym, interval = chartInterval, force = false) {
  const key = sym + '|' + interval, cached = state.ohlcv[key];
  const ttl = (interval === '15m' || interval === '1h') ? 180e3 : 900e3;
  if (!force && cached && Date.now() - (cached.ts || 0) < ttl && cached.candles?.length) return cached;
  let res = null;
  try {
    if (state.settings.worker) {
      res = await api('/ohlcv?symbol=' + encodeURIComponent(sym) + '&interval=' + encodeURIComponent(interval) + '&limit=180&yahoo=' + encodeURIComponent(state.assets[sym]?.yahoo || ''));
    } else if (isCryptoish(sym) && !STABLE.includes(sym)) {
      const r = await fetch('https://data-api.binance.vision/api/v3/klines?symbol=' + sym + 'USDT&interval=' + interval + '&limit=180');
      if (r.ok) { const arr = await r.json(); res = { source: 'Binance', interval, candles: arr.map(x => [x[0], +x[1], +x[2], +x[3], +x[4], +x[5]]) }; }
    }
    if (res && res.candles?.length) {
      state.ohlcv[key] = { ts: Date.now(), source: res.source || 'Mercado', candles: res.candles };
      save(false);
      if (ready && (view === 'inversiones' || $('modal')?.open)) render();
    }
  } catch (e) { console.warn('ohlcv', e.message); }
  return state.ohlcv[key] || null;
}

function calcTechnical(closes) {
  const a = closes.filter(Number.isFinite), last = a.at(-1) || 0, sma = k => a.length >= k ? sum(a.slice(-k)) / k : null;
  let gains = 0, loss = 0;
  for (let i = Math.max(1, a.length - 14); i < a.length; i++) { const d = a[i] - a[i - 1]; if (d > 0) gains += d; else loss -= d; }
  const rsi = loss ? 100 - (100 / (1 + gains / loss)) : gains ? 100 : 50;
  const rets = []; for (let i = 1; i < a.length; i++) rets.push(a[i] / a[i - 1] - 1);
  const mean = rets.length ? sum(rets) / rets.length : 0;
  const vol = rets.length ? Math.sqrt(sum(rets.map(x => (x - mean) ** 2)) / rets.length) * Math.sqrt(365) * 100 : 0;
  let peak = 0, dd = 0; for (const x of a) { peak = Math.max(peak, x); if (peak) dd = Math.min(dd, x / peak - 1); }
  return { last, sma20: sma(20), sma50: sma(50), rsi, vol, dd: dd * 100, trend: sma(20) && sma(50) ? (sma(20) > sma(50) ? 'Impulso positivo (SMA20 > SMA50)' : 'Impulso débil (SMA20 < SMA50)') : 'Historial insuficiente' };
}
async function loadAssetIntel(sym) {
  toast('Cargando velas, análisis técnico y noticias…');
  const tasks = [loadOHLCV(sym, '1d', true)];
  if (state.settings.worker) {
    tasks.push(api('/series?symbol=' + encodeURIComponent(sym) + '&yahoo=' + encodeURIComponent(state.assets[sym]?.yahoo || '')));
    tasks.push(api('/market?symbol=' + encodeURIComponent(sym)));
  }
  const [ohlcv, ser, mkt] = await Promise.all(tasks);
  const pts = ser?.points?.length ? ser.points : (ohlcv?.candles || []).map(c => [new Date(c[0]).toISOString().slice(0, 10), c[4]]);
  state.market[sym] = { ts: Date.now(), series: pts, news: mkt?.news || [] };
  save(false);
  if ($('modal')?.open) assetDetail(sym);
  else if (ready) render();
}
async function loadRadar() {
  let rows = [];
  if (state.settings.worker) {
    const r = await api('/market?trending=1');
    rows = r.trending || [];
  } else {
    const r = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr');
    if (r.ok) {
      const all = await r.json();
      rows = (all || []).filter(x => /USDT$/.test(x.symbol) && !/(UP|DOWN|BULL|BEAR)USDT$/.test(x.symbol) && +x.quoteVolume > 5e6)
        .sort((a, b) => Math.abs(+b.priceChangePercent) * Math.log10(+b.quoteVolume) - Math.abs(+a.priceChangePercent) * Math.log10(+a.quoteVolume))
        .slice(0, 12).map(x => ({ symbol: x.symbol.replace(/USDT$/, ''), price: +x.lastPrice, change: +x.priceChangePercent, volume: +x.quoteVolume }));
    }
  }
  state.market._trends = { ts: Date.now(), rows };
  save(false); render();
}
async function searchTickers(q) {
  q = String(q || '').trim(); if (!q) return [];
  const defaults = [
    { symbol: 'BTC', name: 'Bitcoin', cls: 'crypto' }, { symbol: 'ETH', name: 'Ethereum', cls: 'crypto' }, { symbol: 'SOL', name: 'Solana', cls: 'crypto' },
    { symbol: 'XRP', name: 'Ripple', cls: 'crypto' }, { symbol: 'KCS', name: 'KuCoin Token', cls: 'crypto' }, { symbol: 'ADA', name: 'Cardano', cls: 'crypto' },
    { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World ETF', cls: 'etf' }, { symbol: 'AAPL', name: 'Apple Inc.', cls: 'stock' }, { symbol: 'NVDA', name: 'NVIDIA Corp.', cls: 'stock' }, { symbol: 'SAN.MC', name: 'Banco Santander', cls: 'stock' }
  ];
  const localMatches = defaults.filter(x => x.symbol.toLowerCase().includes(q.toLowerCase()) || x.name.toLowerCase().includes(q.toLowerCase()));
  if (!state.settings.worker) return localMatches;
  try {
    const r = await api('/market?q=' + encodeURIComponent(q));
    return [...localMatches, ...(r.quotes || []).map(x => ({ symbol: x.symbol, name: x.name, cls: x.type === 'ETF' ? 'etf' : x.type === 'CRYPTOCURRENCY' ? 'crypto' : 'stock', yahoo: x.symbol }))].slice(0, 10);
  } catch (e) { return localMatches; }
}

function tvSymbol(sym) {
  const a = state.assets[sym] || {}; if (a.tv) return a.tv;
  if (isCryptoish(sym) && !FIAT.includes(sym)) return 'BINANCE:' + sym + 'USDT';
  const y = (a.yahoo || sym).toUpperCase(), suffix = { '.MC': 'BME:', '.DE': 'XETR:', '.AS': 'EURONEXT:', '.L': 'LSE:', '.PA': 'EURONEXT:', '.MI': 'MIL:' };
  for (const [k, v] of Object.entries(suffix)) if (y.endsWith(k)) return v + y.slice(0, -k.length);
  return y.includes(':') ? y : 'NASDAQ:' + y;
}
function tradingViewURL(sym) {
  const q = new URLSearchParams({ symbol: tvSymbol(sym), interval: 'D', theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark', style: '1', locale: 'es', timezone: 'Europe/Madrid', withdateranges: '1', hide_side_toolbar: '0', allow_symbol_change: '1', save_image: '0' });
  return 'https://s.tradingview.com/widgetembed/?' + q;
}
function exchangeTradeURL(ex, sym) {
  const s = baseSym(sym);
  if (ex === 'kucoin') return 'https://www.kucoin.com/trade/' + s + '-USDT';
  if (ex === 'kraken' || ex === 'kraken_futures') return 'https://pro.kraken.com/app/trade/' + s.toLowerCase() + '-eur';
  if (ex === 'binance') return 'https://www.binance.com/es/trade/' + s + '_USDT';
  if (ex === 'santander') return 'https://www.bancosantander.es/particulares';
  if (ex === 'revolut') return 'https://app.revolut.com';
  return 'https://es.tradingview.com/chart/?symbol=' + encodeURIComponent(tvSymbol(s));
}
