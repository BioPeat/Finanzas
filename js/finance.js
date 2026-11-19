// ===== Categorías, finanzas, cartera, derivados, análisis y fiscalidad España =====
"use strict";

const CATS = [
  ['nomina', 'Nómina', 'income', '--c1'], ['ingresos', 'Otros ingresos', 'income', '--c5'], ['bizum_in', 'Bizum recibido', 'income', '--c8'],
  ['super', 'Supermercado', 'expense', '--c5'], ['restaurantes', 'Restaurantes y bares', 'expense', '--c2'], ['transporte', 'Transporte', 'expense', '--c3'],
  ['movilidad', 'Movilidad compartida', 'expense', '--c8'], ['combustible', 'Combustible', 'expense', '--c7'], ['compras', 'Compras online', 'expense', '--c6'],
  ['salud', 'Salud y farmacia', 'expense', '--c4'], ['deporte', 'Deporte', 'expense', '--c1'], ['cuidado', 'Cuidado personal', 'expense', '--c4'],
  ['ocio', 'Ocio y eventos', 'expense', '--c2'], ['suscripciones', 'Suscripciones', 'expense', '--c6'], ['hogar', 'Hogar y facturas', 'expense', '--c3'],
  ['bizum_out', 'Bizum enviado', 'expense', '--c7'], ['efectivo', 'Efectivo', 'expense', '--c5'], ['comisiones', 'Comisiones', 'expense', '--c7'],
  ['otros', 'Otros gastos', 'expense', '--c3'], ['inversion', 'Inversión (a exchanges o brokers)', 'internal', '--c1'], ['interno', 'Entre tus cuentas', 'internal', '--c3']
].map(([id, name, kind, color]) => ({ id, name, kind, color }));

const catById = id => CATS.find(c => c.id === id) || CATS.find(c => c.id === 'otros');
const catColor = id => 'var(' + catById(id).color + ')';

const RULES_BASE = [
  [/N[OÓ]MINA|TR NOMINA|PAGO DE N[OÓ]MINA/, 'nomina'],
  [/BINANCE|KRAKEN|KUCOIN|COINBASE|BITPANDA|BIT2ME|MYINVESTOR|TRADE REPUBLIC|INDEXA|DEGIRO|INTERACTIVE BROKERS/, 'inversion'],
  [/TRASPASO|TRANSFERENCIA A FAVOR DE .*(PROPIA|MISMO TITULAR)|REVOLUT/, 'interno'],
  [/^BIZUM DE/, 'bizum_in'], [/^BIZUM A FAVOR/, 'bizum_out'],
  [/MERCADONA|CARREFOUR|\bDIA\b|LIDL|ALDI|ALCAMPO|EROSKI|HIPERCOR|AHORRAMAS|CONSUM|SUPERCOR|MAXIMA CHINA|ALIMENTACI/, 'super'],
  [/FARMACI|IHERB|DENTAL|CLINICA|HOSPITAL|OPTICA|SANITAS|ADESLAS/, 'salud'],
  [/REPSOL|WAYLET|SHELL|CEPSA|GALP|\bBP\b|GASOLINER|PETRONOR|PLENOIL|BALLENOIL/, 'combustible'],
  [/FREE2MOVE|WIB |VOLTIO|MOVILIDAD MMD|ACCIONA|LIME|BOLT|CABIFY|UBER|SHARE NOW|ZITY|GOTO|EMOV|YEGO|COOLTRA/, 'movilidad'],
  [/RENFE|METRO|EMT|CRTM|ALSA|IBERIA|VUELING|RYANAIR|AENA|PARKING|PEAJE|TAXI/, 'transporte'],
  [/AMAZON|PAY\.AMAZON|ALIEXPRESS|SHEIN|ZALANDO|EBAY|TEMU|PCCOMPONENTES|EL CORTE INGLES/, 'compras'],
  [/GIMNASIO|DEPORTIV|BASIC.?FIT|DECATHLON|PADEL|FITNESS|MCFIT|VIVAGYM|ALTAFIT/, 'deporte'],
  [/PELUQU|BARBER|ESTETICA/, 'cuidado'],
  [/NETFLIX|SPOTIFY|HBO|DISNEY|PRIME VIDEO|APPLE\.COM|GOOGLE \*|YOUTUBE|DAZN|MOVISTAR\+|CHATGPT|OPENAI|ICLOUD|CLAUDE/, 'suscripciones'],
  [/IBERDROLA|ENDESA|NATURGY|HOLALUZ|VODAFONE|ORANGE|MOVISTAR|DIGI|JAZZTEL|MASMOVIL|SIMYO|CANAL DE ISABEL|ALQUILER|COMUNIDAD/, 'hogar'],
  [/RESTAUR|BAR |CAFE|CAFETER|BURGER|MCDONALD|TELEPIZZA|GLOVO|JUST EAT|UBER EATS|DOMINO|KFC|STARBUCKS|TABERNA|CERVECER/, 'restaurantes'],
  [/ENTRADAS|TICKETMASTER|CINE|TEATRO|CONCIERTO|STEAM|PLAYSTATION|XBOX/, 'ocio'],
  [/CAJERO|REINTEGRO|DISPOSICI[OÓ]N/, 'efectivo'],
  [/COMISI[OÓ]N|MANTENIMIENTO|CUOTA TARJETA/, 'comisiones']
];

function merchantOf(desc) {
  const d = String(desc || '').toUpperCase().replace(/\s+/g, ' ').trim(); let m;
  if ((m = d.match(/^BIZUM (?:A FAVOR DE|DE) (.+?)(?: CONCEPTO|$)/))) return 'BIZUM ' + m[1].trim();
  if ((m = d.match(/^(?:COMPRA(?: INTERNET EN)?|PAGO MOVIL EN|PAGO EN) (.+?)(?:,|$)/))) return m[1].replace(/\*.*$/, '').replace(/\s\d{4,}.*$/, '').trim();
  if ((m = d.match(/^RECIBO (.+?)(?: N[ºO] RECIBO|,|$)/))) return m[1].trim();
  if ((m = d.match(/^TRANSFERENCIA (?:DE|A FAVOR DE) (.+?)(?:, CONCEPTO|,|$)/))) return m[1].trim();
  return d.split(/[,*]/)[0].slice(0, 40).trim();
}
function fmtMerchant(s) {
  return String(s || '').toLowerCase().replace(/(^|[\s/-])\S/g, c => c.toUpperCase());
}
function fmtFreq(days) {
  const d = +days || 30;
  if (d >= 27 && d <= 32) return 'Mensual';
  if (d >= 6 && d <= 8) return 'Semanal';
  if (d >= 13 && d <= 16) return 'Quincenal';
  if (d >= 85 && d <= 95) return 'Trimestral';
  if (d >= 360 && d <= 370) return 'Anual';
  return 'Cada ' + d + ' días';
}
const INIT_ADJUST_RE = /(?:AJUSTE|SALDO)\s+INICIAL|APERTURA\s+DE\s+CUENTA|REGULARIZACI[OÓ]N\s+INICIAL/i;
function categorize(t) {
  const d = String(t.desc || '').toUpperCase(), mer = merchantOf(t.desc);
  if (INIT_ADJUST_RE.test(d)) return 'interno';
  for (const r of state.rules) if (r.match && (mer === r.match || d.includes(r.match))) return r.cat;
  if (/INGRESO EN CAJERO|INGRESO EN EFECTIVO/.test(d)) return 'ingresos';
  for (const [re, c] of RULES_BASE) if (re.test(d)) { if (c === 'inversion' || c === 'interno' || (catById(c).kind === 'expense' && t.amount < 0) || (catById(c).kind === 'income' && t.amount > 0)) return c; }
  if (/^TRANSFERENCIA DE/.test(d)) return 'ingresos';
  return t.amount > 0 ? 'ingresos' : 'otros';
}
const isInternal = t => catById(t.cat).kind === 'internal' || INIT_ADJUST_RE.test(String(t?.desc || ''));

// ===== Activos, divisas y normalización =====
const FIAT = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'TRY', 'BRL', 'ARS', 'MXN', 'PLN', 'SEK', 'NOK', 'DKK'];
const STABLE = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'DAI', 'TUSD', 'USDP', 'PYUSD', 'USDE', 'EURC', 'EURI', 'EURT', 'USD1'];
const CLASS_NAMES = { cash: 'Efectivo y cuentas', crypto: 'Cripto', stable: 'Stablecoins', etf: 'ETF', fund: 'Fondos', stock: 'Acciones', bond: 'Renta fija', deriv: 'Derivados', other: 'Otros' };
const CLASS_COLOR = { cash: '--c3', crypto: '--c2', stable: '--c8', etf: '--c1', fund: '--c5', stock: '--c6', bond: '--c4', deriv: '--c7', other: '--c3' };
const KIND_NAMES = { bank: 'Banco', exchange: 'Exchange', broker: 'Bróker / fondos', wallet: 'Monedero / On-chain', cash: 'Efectivo' };
const KIND_ICON = { bank: 'bank', exchange: 'coin', broker: 'chart', wallet: 'shield', cash: 'wallet' };

function normAsset(a) {
  let s = String(a || '').toUpperCase().trim().replace(/\.(S|M|F|B|P)$/, '').replace(/^LD(?=[A-Z]{2,})/, '');
  const K = { XXBT: 'BTC', XBT: 'BTC', XETH: 'ETH', XXRP: 'XRP', XLTC: 'LTC', XXLM: 'XLM', XXDG: 'DOGE', XDG: 'DOGE', XETC: 'ETC', XXMR: 'XMR', XZEC: 'ZEC', ZEUR: 'EUR', ZUSD: 'USD', ZGBP: 'GBP', ZJPY: 'JPY', ZCAD: 'CAD', ETH2: 'ETH' };
  return K[s] || s;
}
function baseSym(instr) {
  let s = String(instr || '').toUpperCase().replace(/^(PF_|PI_|FI_)/, '').replace(/[-/_]/g, '');
  s = s.replace(/(USDTM|USDM|USDT|USDC|EUR|USD|PERP|\d{6})$/, '');
  if (s === 'XBT' || s === 'XXBT') return 'BTC';
  if (s === 'XETH') return 'ETH';
  return normAsset(s || instr);
}
function ensureAsset(sym) { if (!sym || state.assets[sym]) return; state.assets[sym] = { cls: FIAT.includes(sym) ? 'fiat' : STABLE.includes(sym) ? 'stable' : 'crypto' }; }
const assetCls = sym => FIAT.includes(sym) ? 'fiat' : state.assets[sym]?.cls || (STABLE.includes(sym) ? 'stable' : 'crypto');
function fx(cur) { if (cur === 'EUR') return 1; if (cur === 'USD') return state.prices.EURUSD?.rate || state.prices.EURUSD?.eur || 1.08; return state.prices['EUR' + cur]?.rate || 0; }
function priceEUR(sym) {
  if (sym === 'EUR') return 1;
  if (FIAT.includes(sym)) { const r = fx(sym); return r ? 1 / r : 0; }
  return state.prices[sym]?.eur || 0;
}
const isCryptoish = s => { const c = assetCls(s); return c === 'crypto' || c === 'stable'; };
function trackedAssets() {
  const s = new Set(['BTC', 'ETH', 'SOL']);
  for (const r of positionRows()) if (r.asset !== 'EUR') s.add(r.asset);
  for (const d of state.derivs) if (d.markSym) s.add(d.markSym);
  for (const p of state.apiDerivs || []) if (p.symbol) s.add(baseSym(p.symbol));
  for (const k of Object.keys(state.watchlist || {})) s.add(k);
  return [...s];
}

// ===== Cartera, saldos y derivados en tiempo real =====
function bankBalance(a) {
  const txs = state.tx.filter(t => t.acc === a.id).sort((x, y) => x.date.localeCompare(y.date) || ((y.ord ?? 0) - (x.ord ?? 0)));
  if (!txs.length) return +a.manualBal || 0;
  let base = null, idx = -1;
  for (let i = txs.length - 1; i >= 0; i--) if (txs[i].bal != null && isFinite(txs[i].bal)) { base = txs[i].bal; idx = i; break; }
  if (base == null) return (+a.manualBal || 0) + sum(txs.map(t => t.amount));
  return base + sum(txs.slice(idx + 1).map(t => t.amount));
}
function positionRows() {
  const rows = [];
  for (const a of state.accounts) {
    if (a.kind === 'bank' || a.kind === 'cash') { rows.push({ acc: a.id, asset: a.currency || 'EUR', qty: bankBalance(a), bank: true }); continue; }
    const api = state.apiBal[a.id]; let q = {};
    if (api && api.assets && a.useApi !== false) q = { ...api.assets };
    else for (const l of state.ledger) if (l.acc === a.id) q[l.asset] = (q[l.asset] || 0) + l.change;
    for (const [asset, qty] of Object.entries(q)) if (Math.abs(qty) > 1e-9) rows.push({ acc: a.id, asset, qty });
  }
  for (const r of rows) { const p = priceEUR(r.asset); r.eur = r.qty * p; r.priced = !!p || r.asset === 'EUR'; const c = assetCls(r.asset); r.cls = c === 'fiat' ? 'cash' : c; }
  return rows;
}
function accValue(a, rows) { return sum(rows.filter(r => r.acc === a.id).map(r => r.eur)); }

function derivRows() {
  const out = [], usdFx = fx('USD') || 1.08;
  for (const d of state.derivs.filter(d => !d.closeDate)) {
    const sym = d.markSym || baseSym(d.instr);
    const liveUsd = d.quote === 'EUR' ? priceEUR(sym) : state.prices[sym]?.usd;
    const mark = (d.markSym && liveUsd) ? liveUsd : (+d.mark || liveUsd || d.entry || 0);
    const dir = d.side === 'short' ? -1 : 1;
    const pnl = mark ? (mark - d.entry) * d.size * dir : 0;
    const qDiv = d.quote === 'EUR' ? 1 : usdFx;
    const pnlEUR = pnl / qDiv;
    const notional = Math.abs(d.size) * (mark || d.entry);
    const margin = +d.margin || (d.lev ? notional / d.lev : 0);
    const marginEUR = margin / qDiv;
    const notionalEUR = notional / qDiv;
    const liq = +d.liq || (d.lev && d.lev > 1 ? (dir > 0 ? d.entry * (1 - 0.9 / d.lev) : d.entry * (1 + 0.9 / d.lev)) : null);
    const liqDistPct = (liq && mark) ? ((dir > 0 ? (mark - liq) : (liq - mark)) / mark * 100) : null;
    const riskLevel = liqDistPct == null ? 'none' : liqDistPct < 8 ? 'danger' : liqDistPct < 18 ? 'warn' : 'ok';
    out.push({ ...d, markSym: sym, mark, pnl, pnlEUR, margin, marginEUR, notionalEUR, roiPct: marginEUR > 0 ? (pnlEUR / marginEUR * 100) : null, liq, liqDistPct, riskLevel, api: false });
  }
  for (const p of state.apiDerivs || []) {
    const sym = baseSym(p.symbol);
    const side = p.side || (p.amt < 0 ? 'short' : 'long');
    const dir = side === 'short' ? -1 : 1;
    const size = Math.abs(+p.amt || 0);
    const liveUsd = state.prices[sym]?.usd;
    const mark = (liveUsd && p.mark && Math.abs(liveUsd - p.mark) / Math.max(1, p.mark) < 0.25) ? liveUsd : (+p.mark || liveUsd || +p.entry || 0);
    const pnl = (mark && p.entry) ? (mark - p.entry) * size * dir : (+p.pnl || 0);
    const qDiv = p.quote === 'EUR' ? 1 : usdFx;
    const pnlEUR = pnl / qDiv;
    const notional = size * (mark || +p.entry || 0);
    const margin = +p.margin || (p.lev ? notional / p.lev : 0);
    const marginEUR = margin / qDiv;
    const notionalEUR = notional / qDiv;
    const liq = +p.liq || null;
    const liqDistPct = (liq && mark) ? ((dir > 0 ? (mark - liq) : (liq - mark)) / mark * 100) : null;
    const riskLevel = liqDistPct == null ? 'none' : liqDistPct < 8 ? 'danger' : liqDistPct < 18 ? 'warn' : 'ok';
    out.push({ id: p.id || ('api_' + p.symbol), instr: p.symbol, markSym: sym, type: p.type || 'perpetuo', side, size, entry: +p.entry || 0, mark, lev: +p.lev || null, margin, marginEUR, notionalEUR, pnl, pnlEUR, roiPct: marginEUR > 0 ? (pnlEUR / marginEUR * 100) : null, api: true, acc: p.acc, exchange: p.exchange || accById(p.acc)?.api || '', inBalance: true, liq, liqDistPct, riskLevel, funding: +p.funding || 0, quote: p.quote || 'USD' });
  }
  return out;
}
function derivSummary() {
  const rows = derivRows();
  const totalPnlEUR = sum(rows.map(d => d.pnlEUR));
  const totalMarginEUR = sum(rows.map(d => d.marginEUR));
  const equityEUR = totalMarginEUR + totalPnlEUR;
  const manualEquityEUR = sum(rows.filter(d => !d.inBalance).map(d => (+d.marginEUR || 0) + d.pnlEUR));
  const grossNotionalEUR = sum(rows.map(d => d.notionalEUR));
  const netExposureEUR = sum(rows.map(d => d.notionalEUR * (d.side === 'short' ? -1 : 1)));
  const dists = rows.map(d => d.liqDistPct).filter(x => x != null && isFinite(x));
  return { count: rows.length, totalPnlEUR, totalMarginEUR, equityEUR, manualEquityEUR, grossNotionalEUR, netExposureEUR, minLiqDist: dists.length ? Math.min(...dists) : null, atRiskCount: rows.filter(d => d.riskLevel === 'danger' || d.riskLevel === 'warn').length };
}

function netWorth() {
  const rows = positionRows(), parts = {};
  for (const r of rows) parts[r.cls] = (parts[r.cls] || 0) + r.eur;
  const dv = sum(derivRows().filter(d => !d.inBalance).map(d => (+d.marginEUR || 0) + d.pnlEUR));
  if (dv) parts.deriv = (parts.deriv || 0) + dv;
  return { total: sum(Object.values(parts)), parts, rows, unpriced: rows.filter(r => !r.priced && Math.abs(r.qty) > 0) };
}
function investmentSummary() {
  const rows = positionRows().filter(r => !r.bank), value = sum(rows.map(r => r.eur)), by = {};
  for (const r of rows) { const x = by[r.asset] = by[r.asset] || { qty: 0, eur: 0 }; x.qty += r.qty; x.eur += r.eur; }
  const cb = costBasis(), parts = []; let covered = 0, cost = 0, day = 0;
  for (const [asset, x] of Object.entries(by)) {
    const p = state.prices[asset]; if (p && p.chg != null) day += x.eur - x.eur / (1 + p.chg / 100);
    const c = cb[asset]; if (!c || c.missing || !c.qty || Math.abs(c.qty - x.qty) > Math.max(Math.abs(x.qty) * 0.05, 1e-8)) continue;
    const proportional = c.cost * (x.qty / c.qty); covered += x.eur; cost += proportional;
    parts.push({ asset, value: x.eur, cost: proportional, gain: x.eur - proportional });
  }
  const gain = covered - cost, pctGain = cost > 0 ? gain / cost * 100 : null;
  return { value, day, covered, cost, gain, pct: pctGain, coverage: value > 0 ? covered / value * 100 : 0, parts };
}
function snapshot() {
  if (!state.accounts.length) return;
  const nw = netWorth(), d = today(), prev = state.snaps[d];
  const v = { total: round(nw.total), ...Object.fromEntries(Object.entries(nw.parts).map(([k, x]) => [k, round(x)])) };
  if (!prev || JSON.stringify(prev) !== JSON.stringify(v)) { state.snaps[d] = v; save(false); }
}
function bankHistory(days = 365) {
  const out = {}, first = state.tx.map(t => t.date).sort()[0] || today(), start = [addDays(today(), -days), addDays(first, -1)].sort().at(-1);
  for (const a of state.accounts.filter(a => a.kind === 'bank')) {
    const txs = state.tx.filter(t => t.acc === a.id).sort((x, y) => x.date.localeCompare(y.date) || ((y.ord ?? 0) - (x.ord ?? 0)));
    let bal = bankBalance(a); const ends = {};
    for (let i = txs.length - 1; i >= 0; i--) { if (!(txs[i].date in ends)) ends[txs[i].date] = bal; bal -= txs[i].amount; }
    let cur = bal; for (const d of Object.keys(ends).sort()) if (d < start) cur = ends[d];
    for (let d = start; d <= today(); d = addDays(d, 1)) { if (d in ends) cur = ends[d]; out[d] = (out[d] || 0) + cur; }
  }
  return out;
}
function reliableHistory(points) {
  const pts = points.filter(x => x && x[0] && Number.isFinite(+x[1])).map(x => [x[0], +x[1]]);
  if (pts.length < 2) return pts;
  let cut = 0;
  for (let i = 1; i < Math.min(pts.length, 8); i++) {
    const prev = Math.abs(pts[i - 1][1]), now = Math.abs(pts[i][1]), jump = Math.abs(pts[i][1] - pts[i - 1][1]);
    if (now >= 100 && prev <= Math.max(5, now * 0.025) && jump >= now * 0.90) cut = i;
    else if (cut) break;
  }
  return pts.slice(cut);
}
function netSeries(days) {
  const since = addDays(today(), -days), snapDates = Object.keys(state.snaps).sort(), nw = netWorth();
  if (snapDates.length >= 2) {
    const inWin = snapDates.filter(d => d >= since);
    const anchor = snapDates.filter(d => d < since).at(-1);
    const dates = inWin.length >= 2 ? inWin : [...(anchor ? [anchor] : []), ...inWin];
    const pts = dates.map(d => [d, +state.snaps[d].total || 0]);
    return { pts: reliableHistory(pts), src: 'snap' };
  }
  const b = bankHistory(days), bankNow = sum(nw.rows.filter(r => r.bank).map(r => r.eur)), nonBank = nw.total - bankNow;
  const pts = Object.keys(b).sort().map(d => [d, b[d] + nonBank]).filter((p, i, a) => i % Math.max(1, Math.floor(a.length / 120)) === 0 || i === a.length - 1);
  return { pts: reliableHistory(pts), src: 'bank' };
}
function changeWindow(days) {
  const pts = netSeries(3650).pts; if (pts.length < 2) return null;
  const endPt = pts.at(-1), end = endPt[1], endMs = Date.parse(endPt[0]), targetMs = endMs - days * 864e5;
  let best = null, bestDiff = Infinity;
  for (const p of pts.slice(0, -1)) {
    const diff = Math.abs(Date.parse(p[0]) - targetMs);
    if (diff < bestDiff) { bestDiff = diff; best = p; }
  }
  const maxGapDays = days <= 1 ? 2 : Math.max(4, Math.round(days * 0.5));
  if (!best || bestDiff / 864e5 > maxGapDays) {
    if (days <= 1) {
      const invDay = investmentSummary().day;
      if (Math.abs(invDay) > 0.01 && Math.abs(end) > 1) return { value: invDay, pct: invDay / Math.abs(end - invDay) * 100, from: today(), approx: true };
    }
    return null;
  }
  const base = best[1];
  if (!Number.isFinite(base) || Math.abs(base) < 1) return null;
  return { value: end - base, pct: (end - base) / Math.abs(base) * 100, from: best[0] };
}
function invSeries(days) {
  const from = addDays(today(), -days);
  const snaps = Object.keys(state.snaps).sort().filter(d => d >= from).map(d => { const s = state.snaps[d]; return [d, (s.total || 0) - (s.cash || 0)]; });
  if (snaps.length >= 2) return snaps;
  // Si aún no hay snapshots diarios, reconstruye valoración con velas históricas 1d en caché
  const rows = positionRows().filter(r => !r.bank), usdFx = fx('USD') || 1.08;
  const byDate = {}; let anySeries = false;
  for (const r of rows) {
    const o = state.ohlcv?.[r.asset + '|1d']?.candles;
    if (!o || o.length < 2) continue;
    anySeries = true;
    const isC = isCryptoish(r.asset);
    for (const c of o) {
      const d = new Date(c[0]).toISOString().slice(0, 10);
      if (d < from) continue;
      const eur = r.asset === 'EUR' ? c[4] : isC ? c[4] / usdFx : c[4];
      byDate[d] = (byDate[d] || 0) + r.qty * eur;
    }
  }
  if (!anySeries) return snaps;
  return Object.keys(byDate).sort().map(d => [d, round(byDate[d])]);
}

// ===== Flujo mensual, previsiones y alertas =====
function monthTotals(m = monthKey(today())) {
  const t = state.tx.filter(x => monthKey(x.date) === m && !isInternal(x));
  const inc = sum(t.filter(x => x.amount > 0 && catById(x.cat).kind === 'income').map(x => x.amount));
  const exp = -sum(t.filter(x => x.amount < 0).map(x => x.amount));
  const byCat = {}; for (const x of t) if (x.amount < 0) byCat[x.cat] = (byCat[x.cat] || 0) - x.amount;
  return { inc, exp, save: inc - exp, rate: inc ? (inc - exp) / inc * 100 : null, byCat, n: t.length };
}
function lastMonths(n) { const m = monthKey(today()), out = []; for (let i = n - 1; i >= 0; i--) out.push(monthAdd(m, -i)); return out; }
const REC_EXCLUDE = new Set(['super', 'restaurantes', 'combustible', 'compras', 'movilidad', 'efectivo', 'otros']);
function recurring() {
  const by = {};
  for (const t of state.tx) if (t.amount < 0 && !isInternal(t) && !REC_EXCLUDE.has(t.cat)) { const k = merchantOf(t.desc); (by[k] = by[k] || []).push(t); }
  const out = [];
  for (const [k, ts] of Object.entries(by)) {
    const months = new Set(ts.map(t => monthKey(t.date))); if (months.size < 2) continue;
    const amts = ts.map(t => -t.amount).sort((a, b) => a - b), med = amts[Math.floor(amts.length / 2)];
    if (amts.every(a => Math.abs(a - med) <= Math.max(2, med * 0.15)) && ts.length <= months.size + 1) out.push({ name: k, amount: med, months: months.size, last: ts.map(t => t.date).sort().at(-1), cat: ts[0].cat });
  }
  return out.sort((a, b) => b.amount - a.amount);
}
const isLiquid = r => r.bank || r.cls === 'cash' || r.cls === 'stable';
function liquidity() { return sum(netWorth().rows.filter(isLiquid).map(r => r.eur)); }
function avgMonthlyExpense() {
  const closed = lastMonths(4).slice(0, 3).map(monthTotals).filter(t => t.n >= 3 && t.exp > 0);
  const ms = closed.length >= 2 ? closed : lastMonths(3).map(monthTotals).filter(t => t.exp > 0);
  return ms.length ? sum(ms.map(t => t.exp)) / ms.length : monthTotals(monthKey(today())).exp;
}
function cushion() { const e = avgMonthlyExpense(), bankCash = sum(netWorth().rows.filter(r => r.bank).map(r => r.eur)); return e > 0 ? bankCash / e : null; }
function pace() {
  const t = today(), d = +t.slice(8), m = monthKey(t), pm = monthAdd(m, -1), lim = pm + '-' + String(d).padStart(2, '0');
  const spent = (mm, until) => -sum(state.tx.filter(x => monthKey(x.date) === mm && x.amount < 0 && !isInternal(x) && (!until || x.date <= until)).map(x => x.amount));
  const now = spent(m, t), prev = spent(pm, lim); return { now, prev, diff: prev ? (now - prev) / prev * 100 : null };
}
function upcoming(days = 31) {
  const t = today(), out = [];
  for (const r of recurring()) {
    const ts = state.tx.filter(x => merchantOf(x.desc) === r.name && x.amount < 0).map(x => x.date).sort();
    if (ts.length < 2) continue;
    const gaps = ts.slice(1).map((d, i) => (Date.parse(d) - Date.parse(ts[i])) / 864e5).filter(g => g > 20);
    const every = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 30;
    let next = addDays(ts.at(-1), every);
    while (next < t) next = addDays(next, every);
    if (next <= addDays(t, days)) out.push({ ...r, next, every });
  }
  return out.sort((a, b) => a.next.localeCompare(b.next));
}
function forecast() {
  const t = today(), m = monthKey(t), end = monthAdd(m, 1) + '-01', left = Math.max(0, (Date.parse(end) - Date.parse(t)) / 864e5 - 1);
  const bal = sum(state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash').map(bankBalance));
  const fixed = sum(upcoming(left + 1).filter(u => u.next < end).map(u => u.amount));
  const rec = new Set(recurring().map(r => r.name)), ms = lastMonths(4).slice(0, 3);
  const varSpend = sum(state.tx.filter(x => ms.includes(monthKey(x.date)) && x.amount < 0 && !isInternal(x) && !rec.has(merchantOf(x.desc))).map(x => -x.amount));
  const days = new Set(state.tx.filter(x => ms.includes(monthKey(x.date))).map(x => monthKey(x.date))).size * 30 || 30;
  const daily = varSpend / days;
  const paid = state.tx.some(x => monthKey(x.date) === m && x.cat === 'nomina'), lastNom = state.tx.filter(x => x.cat === 'nomina').sort((a, b) => b.date.localeCompare(a.date))[0];
  const salary = !paid && lastNom ? lastNom.amount : 0;
  return { bal, fixed, variable: daily * left, salary, end: bal - fixed - daily * left + salary, left };
}
function safeToSpend() {
  const f = forecast(), floor = +state.settings.lowBal || 0, left = Math.max(1, Math.round(f.left) + 1);
  const m = monthKey(today()), mt = monthTotals(m), refInc = mt.inc || f.salary || 0;
  const monthRoom = refInc > 0 ? Math.max(0, refInc - mt.exp - f.fixed) : Math.max(0, avgMonthlyExpense() - mt.exp - f.fixed);
  const capByBal = Math.max(0, f.bal + f.salary - f.fixed - floor);
  return { per: Math.min(monthRoom, capByBal) / left, left, floor, f };
}
function topMerchants(m, n = 5) { const by = {}; for (const x of state.tx) if (monthKey(x.date) === m && x.amount < 0 && !isInternal(x)) { const k = merchantOf(x.desc); by[k] = by[k] || { name: k, total: 0, n: 0, cat: x.cat }; by[k].total -= x.amount; by[k].n++; } return Object.values(by).sort((a, b) => b.total - a.total).slice(0, n); }
function dailySpend(m) { const out = {}; for (const x of state.tx) if (monthKey(x.date) === m && x.amount < 0 && !isInternal(x)) out[x.date] = (out[x.date] || 0) - x.amount; return out; }
function goalSaved(g) { if (g.acc) { const a = accById(g.acc); if (a) return sum(positionRows().filter(r => r.acc === a.id).map(r => r.eur)); } return +g.saved || 0; }

function alerts() {
  const out = [], m = monthKey(today()), mt = monthTotals(m), add = (id, lvl, txt) => { if (!state.dismissed[id]) out.push({ id, lvl, txt }); };
  for (const a of state.accounts.filter(a => a.kind === 'bank')) { const b = bankBalance(a); if (b < (+state.settings.lowBal || 0)) add('low|' + a.id + '|' + today(), 'err', a.name + ': saldo bajo (' + nf(b) + ' €).'); }
  for (const [c, lim] of Object.entries(state.budgets)) { const g = mt.byCat[c] || 0; if (lim > 0 && g >= lim * 0.9) add('bud|' + c + '|' + m, g > lim ? 'err' : 'warn', 'Presupuesto de ' + catById(c).name + ': ' + nf(g, 0) + ' de ' + nf(lim, 0) + ' €.'); }
  for (const d of derivRows()) {
    if (d.liqDistPct != null && d.liqDistPct < 15) add('liq|' + d.id + '|' + today(), d.liqDistPct < 8 ? 'err' : 'warn', d.instr + ' (' + d.side + '): precio a ' + nf(d.liqDistPct, 1) + ' % de liquidación.');
  }
  for (const pa of state.priceAlerts || []) {
    if (!pa.active) continue;
    const p = priceEUR(pa.sym);
    if (p && ((pa.dir === 'above' && p >= pa.target) || (pa.dir === 'below' && p <= pa.target))) add('pa|' + pa.id + '|' + today(), 'info', 'Alerta de precio ' + pa.sym + ': ' + nf(p, p < 1 ? 4 : 2) + ' € (' + (pa.dir === 'above' ? '≥' : '≤') + ' ' + nf(pa.target, 2) + ' €).');
  }
  const hist = {}; for (const t of state.tx) if (t.amount < 0 && !isInternal(t) && t.date < addDays(today(), -30)) (hist[t.cat] = hist[t.cat] || []).push(-t.amount);
  for (const t of state.tx.filter(t => t.amount < -50 && t.date >= addDays(today(), -10) && !isInternal(t))) { const h = (hist[t.cat] || []).sort((a, b) => a - b), med = h[Math.floor(h.length / 2)]; if (h.length >= 4 && -t.amount > med * 3) add('odd|' + t.id, 'warn', 'Gasto poco habitual: ' + merchantOf(t.desc) + ' · ' + nf(-t.amount) + ' € (' + fmtDate(t.date) + ').'); }
  const nw = netWorth();
  for (const r of nw.rows) { const p = state.prices[r.asset]; if (p && p.chg != null && Math.abs(p.chg) >= 8 && r.eur > nw.total * 0.05) add('mv|' + r.asset + '|' + today(), p.chg < 0 ? 'err' : 'ok', r.asset + ' ' + pct(p.chg) + ' en 24 h (' + nf(r.eur, 0) + ' € en ' + accName(r.acc) + ').'); }
  if (nw.unpriced.length) add('np|' + nw.unpriced.map(r => r.asset).join(), 'info', 'Sin precio: ' + [...new Set(nw.unpriced.map(r => r.asset))].join(', ') + '. Revisa su ticker en Mercados.');
  for (const e of state.apiErrors || []) add('api|' + e, 'err', 'Conexión: ' + e);
  if (state.settings.sync && syncState === 'err') add('sync|err', 'err', 'La sincronización falló: ' + (state.syncError || ''));
  const lastTx = state.tx.map(t => t.date).sort().at(-1); if (state.accounts.some(a => a.kind === 'bank') && lastTx && lastTx < addDays(today(), -20)) add('old|' + monthKey(today()), 'info', 'El último movimiento bancario es del ' + fmtDate(lastTx) + '. Actualiza o importa el extracto.');
  return out;
}

// ===== Fiscalidad España (FIFO, base del ahorro, Modelo 721) =====
const TRAMOS_AHORRO = [[6000, .19], [50000, .21], [200000, .23], [300000, .27], [Infinity, .30]];
function cuotaAhorro(base) { let rest = Math.max(0, base), prev = 0, t = 0; for (const [lim, r] of TRAMOS_AHORRO) { const x = Math.min(rest, lim - prev); if (x <= 0) break; t += x * r; rest -= x; prev = lim; } return t; }
function matchTransfers(L) {
  const w = L.filter(l => l.kind === 'withdraw' && isCryptoish(l.asset)), d = L.filter(l => l.kind === 'deposit' && isCryptoish(l.asset)), used = new Set(), pairs = new Set();
  for (const x of w) for (const y of d) {
    if (used.has(y.id) || x.asset !== y.asset || x.acc === y.acc) continue;
    const dt = (Date.parse(y.t.replace(' ', 'T')) - Date.parse(x.t.replace(' ', 'T'))) / 864e5;
    if (dt >= -.1 && dt <= 5 && Math.abs(Math.abs(x.change) - y.change) <= Math.abs(x.change) * 0.02) { used.add(y.id); pairs.add(x.id); pairs.add(y.id); break; }
  }
  return pairs;
}
function taxGroups() {
  const L = state.ledger.slice().sort((a, b) => a.t.localeCompare(b.t)), transfers = matchTransfers(L), groups = new Map();
  for (const l of L) { if (l.kind === 'move' || transfers.has(l.id)) continue; const k = l.kind === 'trade' || l.kind === 'fee' ? l.acc + '|' + l.ref : l.id; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); }
  return { groups: [...groups.values()], transfers };
}
async function taxPrefetch(onStep) {
  const { groups } = taxGroups(), need = [];
  for (const g of groups) {
    const t = g[0].t, hasEUR = g.some(l => l.asset === 'EUR' && l.kind !== 'fee');
    for (const l of g) { if (l.asset === 'EUR') continue; if (g[0].kind === 'trade' && hasEUR && l.kind !== 'fee') continue; need.push([l.asset, t]); }
  }
  const todo = need.filter(([s, t]) => !state.hist[s + '|' + t.slice(0, 13).replace(' ', 'T')]);
  for (let i = 0; i < todo.length; i++) { await priceAt(...todo[i]); if (onStep && i % 5 === 0) onStep(i, todo.length); }
  save(false); return todo.length;
}
const histEUR = (s, t) => s === 'EUR' ? 1 : state.hist[s + '|' + t.slice(0, 13).replace(' ', 'T')] || null;
function taxCompute() {
  const { groups } = taxGroups(), lots = {}, years = {}, missingPrice = new Set(), gaps = [];
  const Y = y => years[y] = years[y] || { disp: [], rewards: [], derivs: [], gain: 0, loss: 0, rew: 0, der: 0 };
  const consume = (asset, qty, t, refId) => {
    let need = qty, cost = 0, missing = 0; const q = lots[asset] = lots[asset] || [];
    while (need > 1e-12 && q.length) { const lot = q[0], take = Math.min(need, lot.qty); cost += lot.cpu * take; if (lot.missing) missing += take; lot.qty -= take; need -= take; if (lot.qty <= 1e-12) q.shift(); }
    if (need > 1e-9) { missing += need; gaps.push({ type: 'sin_compra', asset, qty: need, t, id: refId }); }
    return { cost, missing };
  };
  const addLot = (asset, qty, cost, t, missing = false) => { (lots[asset] = lots[asset] || []).push({ qty, cpu: qty ? cost / qty : 0, t, missing }); };
  for (const g of groups) {
    const t = g[0].t, y = t.slice(0, 4), kind = g.some(l => l.kind === 'trade') ? 'trade' : g[0].kind;
    if (kind === 'trade') {
      const main = g.filter(l => l.kind !== 'fee'), fees = g.filter(l => l.kind === 'fee');
      const eurLegs = main.filter(l => l.asset === 'EUR'), neg = main.filter(l => l.change < 0 && l.asset !== 'EUR'), pos = main.filter(l => l.change > 0 && l.asset !== 'EUR');
      let V = eurLegs.length ? Math.abs(sum(eurLegs.map(l => l.change))) : null;
      if (V == null) { for (const l of [...pos, ...neg]) { const p = histEUR(l.asset, t); if (p) { V = Math.abs(l.change) * p; break; } } }
      if (V == null) { [...pos, ...neg].forEach(l => missingPrice.add(l.asset)); continue; }
      let feeEUR = 0; for (const f of fees) { const p = f.asset === 'EUR' ? 1 : histEUR(f.asset, t) || 0; feeEUR += Math.abs(f.change) * p; }
      const fiatOut = eurLegs.length && sum(eurLegs.map(l => l.change)) < 0;
      const negV = neg.map(l => Math.abs(l.change) * (histEUR(l.asset, t) || 1)), nv = sum(negV) || 1;
      neg.forEach((l, i) => {
        if (FIAT.includes(l.asset)) return; const share = negV[i] / nv, proceeds = V * share - (pos.length ? 0 : feeEUR * share), c = consume(l.asset, Math.abs(l.change), t, l.id);
        const row = { t, asset: l.asset, qty: Math.abs(l.change), proceeds, cost: c.cost, gain: proceeds - c.cost, missing: c.missing, contra: eurLegs.length ? 'fiat' : 'cripto', acc: l.acc };
        Y(y).disp.push(row); row.gain >= 0 ? Y(y).gain += row.gain : Y(y).loss += row.gain;
      });
      const posV = pos.map(l => Math.abs(l.change) * (histEUR(l.asset, t) || 1)), pv = sum(posV) || 1;
      pos.forEach((l, i) => { if (FIAT.includes(l.asset)) return; addLot(l.asset, l.change, V * posV[i] / pv + (fiatOut ? feeEUR * posV[i] / pv : 0), t); });
      for (const f of fees) if (f.asset !== 'EUR' && !FIAT.includes(f.asset)) consume(f.asset, Math.abs(f.change), t, f.id);
    } else if (kind === 'reward') {
      for (const l of g) { if (l.change <= 0 || FIAT.includes(l.asset)) continue; const p = histEUR(l.asset, t); if (!p) { missingPrice.add(l.asset); continue; } const v = l.change * p; addLot(l.asset, l.change, v, t); Y(y).rewards.push({ t, asset: l.asset, qty: l.change, eur: v, note: l.note }); Y(y).rew += v; }
    } else if (kind === 'deposit') {
      for (const l of g) { if (FIAT.includes(l.asset) || l.change <= 0) continue; const c = state.costs[l.id]; if (c == null) gaps.push({ type: 'deposito', asset: l.asset, qty: l.change, t, id: l.id }); addLot(l.asset, l.change, +c || 0, t, c == null); }
    } else if (kind === 'fee') {
      for (const l of g) if (!FIAT.includes(l.asset) && l.change < 0) consume(l.asset, -l.change, t, l.id);
    } else if (kind === 'deriv') {
      for (const l of g) { const p = l.asset === 'EUR' ? 1 : histEUR(l.asset, t); if (!p) { missingPrice.add(l.asset); continue; } const v = l.change * p; Y(y).derivs.push({ t, asset: l.asset, qty: l.change, eur: v, note: l.note }); Y(y).der += v; }
    }
  }
  for (const d of state.derivs.filter(d => d.closeDate && d.exit)) {
    const y = d.closeDate.slice(0, 4), dir = d.side === 'short' ? -1 : 1, pnl = (d.exit - d.entry) * d.size * dir - (+d.fees || 0), v = pnl / (d.quote === 'EUR' ? 1 : fx('USD'));
    Y(y).derivs.push({ t: d.closeDate, asset: d.instr, qty: d.size, eur: v, note: 'Cerrado a mano' }); Y(y).der += v;
  }
  return { years, lots, gaps, missingPrice: [...missingPrice] };
}
function costBasis() { const r = taxCompute(), out = {}; for (const [a, ls] of Object.entries(r.lots)) { const q = sum(ls.map(l => l.qty)); out[a] = { qty: q, cost: sum(ls.map(l => l.qty * l.cpu)), missing: ls.some(l => l.missing && l.qty > 1e-9) }; } return out; }
function balancesAt(date) { const out = {}; for (const l of state.ledger) if (l.t.slice(0, 10) <= date) { const k = l.acc + '|' + l.asset; out[k] = (out[k] || 0) + l.change; } return out; }
async function modelo721(year) {
  const d = year + '-12-31', b = balancesAt(d), rows = [];
  for (const [k, q] of Object.entries(b)) { const [acc, asset] = k.split('|'), a = accById(acc); if (!a || a.kind !== 'exchange' || a.reportsSpain || q <= 1e-9 || FIAT.includes(asset)) continue; const p = await priceAt(asset, d + ' 23:00:00'); rows.push({ acc: a.name, asset, qty: q, eur: p ? q * p : null }); }
  save(false);
  return { rows, total: sum(rows.map(r => r.eur || 0)), unknown: rows.filter(r => r.eur == null).length };
}
function taxSummary(year, extra = 0) {
  const r = taxCompute(), y = r.years[year] || { disp: [], rewards: [], derivs: [], gain: 0, loss: 0, rew: 0, der: 0 };
  const gp = y.gain + y.loss + y.der, base = Math.max(0, gp) + y.rew + (+extra || 0);
  return { ...y, gp, base, cuota: cuotaAhorro(base), r };
}
function byCoin(disp) { const m = {}; for (const d of disp) { const k = d.asset + '|' + d.contra; const x = m[k] = m[k] || { asset: d.asset, contra: d.contra, proceeds: 0, cost: 0, gain: 0, n: 0 }; x.proceeds += d.proceeds; x.cost += d.cost; x.gain += d.gain; x.n++; } return Object.values(m).sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain)); }
function taxCSV(year) {
  const s = taxSummary(year, taxExtra), q = v => '"' + String(v).replace(/"/g, '""') + '"', n = v => nf(v, 2, 2).replace(/\./g, '');
  const L = [['Bloque', 'Fecha', 'Moneda', 'Contraprestación', 'Cantidad', 'Valor de transmisión (€)', 'Valor de adquisición (€)', 'Resultado (€)'].map(q).join(';')];
  for (const c of byCoin(s.disp)) L.push(['Resumen por moneda', '', c.asset, c.contra === 'fiat' ? 'Fiat' : 'Moneda virtual', '', n(c.proceeds), n(c.cost), n(c.gain)].map(q).join(';'));
  for (const d of s.disp) L.push(['Operación', d.t.slice(0, 10), d.asset, d.contra === 'fiat' ? 'Fiat' : 'Moneda virtual', nf(d.qty, 8, 0), n(d.proceeds), n(d.cost), n(d.gain)].map(q).join(';'));
  for (const r of s.rewards) L.push(['Recompensa', r.t.slice(0, 10), r.asset, '', nf(r.qty, 8, 0), '', '', n(r.eur)].map(q).join(';'));
  for (const r of s.derivs) L.push(['Derivados', r.t.slice(0, 10), r.asset, '', nf(r.qty, 8, 0), '', '', n(r.eur)].map(q).join(';'));
  download('Finanzas_renta_' + year + '.csv', '\ufeff' + L.join('\n'), 'text/csv');
}
function taxAIText(year) {
  const s = taxSummary(year, taxExtra), coins = byCoin(s.disp), gaps = s.r.gaps.filter(g => g.t.slice(0, 4) <= year);
  return ['Eres asesor fiscal en España. Prepara un borrador de la declaración de la renta (IRPF) del ejercicio ' + year + ' con estos datos de inversiones, calculados por mi app con el método FIFO. Dime en qué apartado de Renta Web va cada importe (monedas virtuales, derivados, rendimientos del capital mobiliario), qué datos me faltan, si debo presentar el modelo 721 y la cuota aproximada. Responde en español y avisa de cualquier supuesto dudoso.', '',
    'RESUMEN ' + year + ': ganancias ' + nf(s.gain) + ' €, pérdidas ' + nf(s.loss) + ' €, derivados ' + nf(s.der) + ' €, recompensas (staking/intereses) ' + nf(s.rew) + ' €, otras rentas del ahorro declaradas por mí ' + nf(taxExtra || 0) + ' €.', '',
    'POR MONEDA Y CONTRAPRESTACIÓN (valor de transmisión / valor de adquisición / resultado):', ...coins.map(c => '- ' + c.asset + ' · ' + (c.contra === 'fiat' ? 'fiat' : 'otra moneda virtual') + ': ' + nf(c.proceeds) + ' / ' + nf(c.cost) + ' / ' + nf(c.gain) + ' € (' + c.n + ' operaciones)'), '',
    'RECOMPENSAS:', ...s.rewards.slice(0, 60).map(r => '- ' + r.t.slice(0, 10) + ' ' + r.asset + ' ' + nf(r.qty, 8, 0) + ' = ' + nf(r.eur) + ' € (' + (r.note || '') + ')'), '',
    'DERIVADOS:', ...s.derivs.slice(0, 60).map(r => '- ' + r.t.slice(0, 10) + ' ' + r.asset + ' ' + nf(r.eur) + ' €'), '',
    'DATOS QUE FALTAN (' + gaps.length + '):', ...gaps.slice(0, 40).map(g => '- ' + g.t.slice(0, 10) + ' ' + g.asset + ' ' + nf(g.qty, 8, 0) + ' · ' + (g.type === 'deposito' ? 'depósito sin coste de adquisición' : 'venta sin compra previa registrada')), '',
    'CUENTAS: ' + state.accounts.filter(a => a.kind !== 'bank').map(a => a.name + (a.reportsSpain ? ' (informa a Hacienda)' : ' (extranjero)')).join(', ') + (m721 && m721.year === year ? '. Saldo a 31/12 en exchanges extranjeros: ' + nf(m721.total) + ' €.' : '')].join('\n');
}
