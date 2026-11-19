// ===== Vistas de Escritorio (Centro de Control + Terminal Mercados) y componentes compartidos =====
"use strict";

const btn = (txt, attrs, clsName = '') => '<button type="button" class="btn ' + clsName + '" ' + attrs + '>' + txt + '</button>';
function head(title, sub, actions = '') { return '<div class="head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="actions">' + actions + '</div></div>'; }
function compactEmpty(title, text, action = '') { return '<div class="empty-compact"><b>' + title + '</b><span>' + text + '</span>' + action + '</div>'; }
function changeCell(days, label) {
  const c = changeWindow(days);
  return '<div class="change-cell"><small>' + label + '</small>' + (c ? '<b class="' + cls(c.value) + '">' + money(c.value, { sign: true, d: 0 }) + '</b><span class="' + cls(c.pct) + '">' + pct(c.pct) + '</span>' : '<b>Sin base</b><span>falta historial</span>') + '</div>';
}
function changeGridHTML(tag = 'div', attrs = '') {
  const c1 = changeWindow(1), c7 = changeWindow(7), c30 = changeWindow(30), c180 = changeWindow(180);
  const noShort = (!c1 || Math.abs(c1.value) < 0.05) && (!c7 || Math.abs(c7.value) < 0.05);
  if (noShort) {
    const second = range === '1M'
      ? '<div class="change-cell"><small>Últimos 7 días</small><b>Sin variación</b><span>sin cambios netos</span></div>'
      : changeCell(30, '30 días');
    const first = range === '1M'
      ? '<div class="change-cell"><small>Últimas 24 h</small><b>Sin variación</b><span>sin cambios netos</span></div>'
      : '<div class="change-cell"><small>Últimos 7 días</small><b>Sin variación</b><span>sin cambios netos</span></div>';
    return '<' + tag + ' class="change-grid cols-2"' + (attrs ? ' ' + attrs : '') + '>' + first + second + '</' + tag + '>';
  }
  const cell1 = changeCell(1, 'Patrimonio 24h');
  const cell2 = range === '1S' ? changeCell(30, '30 días') : changeCell(7, '7 días');
  let cell3 = '';
  if (range !== '1M' && range !== '1S') cell3 = changeCell(30, '30 días');
  else if (c180 && (!c30 || c180.from !== c30.from)) cell3 = changeCell(180, '6 meses');
  else {
    const inv = investmentSummary();
    cell3 = inv.cost > 0
      ? '<div class="change-cell"><small>Plusvalía FIFO</small><b class="' + cls(inv.gain) + '">' + money(inv.gain, { sign: true, d: 0 }) + '</b><span class="' + cls(inv.pct || 0) + '">' + (inv.pct != null ? pct(inv.pct) : 'coste base') + '</span></div>'
      : changeCell(180, '6 meses');
  }
  return '<' + tag + ' class="change-grid"' + (attrs ? ' ' + attrs : '') + '>' + cell1 + cell2 + cell3 + '</' + tag + '>';
}
function accountLine(a, rows) {
  const v = accValue(a, rows), auto = !!(state.apiBal[a.id] || a.ebUid), kind = KIND_NAMES[a.kind] || 'Cuenta', ik = instKey(a);
  const badge = { santander: 'SAN', revolut: 'REV', kucoin: 'KC', kraken: 'KRK', binance: 'BNB' }[ik] || ico(KIND_ICON[a.kind] || 'wallet');
  return '<button class="account-line" type="button" data-acc="' + a.id + '"><span class="account-mark k-' + a.kind + (ik ? ' inst-' + ik : '') + '">' + badge + '</span><span><b>' + esc(a.name) + '</b><small>' + esc(kind) + (auto ? ' · auto' : '') + '</small></span><strong>' + money(v, { d: 0 }) + '</strong></button>';
}
function homeAssets(rows) {
  const by = {}; for (const r of rows.filter(x => !x.bank)) { const x = by[r.asset] = by[r.asset] || { asset: r.asset, qty: 0, eur: 0 }; x.qty += r.qty; x.eur += r.eur; }
  return Object.values(by).filter(x => Math.abs(x.eur) >= .5 || !priceEUR(x.asset)).sort((a, b) => b.eur - a.eur);
}
function txItem(t) {
  const rawC = catById(t.cat), c = isInternal(t) && t.cat === 'otros' ? catById('interno') : (t.amount > 0 && rawC.kind === 'expense' ? catById('ingresos') : rawC);
  const incoming = t.amount > 0, mer = merchantOf(t.desc);
  return '<button class="item" type="button" data-tx="' + t.id + '"><span class="av" style="background:var(' + c.color + ')">' + esc(initials(mer)) + '</span><b>' + esc(fmtMerchant(mer)) + '</b><span class="amt ' + (incoming ? 'up' : '') + '">' + money(t.amount, { sign: true }) + '</span><small>' + esc(c.name) + (state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash').length > 1 ? ' · ' + esc(accName(t.acc)) : '') + '</small><small class="faint num tx-bal">' + (t.bal != null ? '<span class="money">' + nf(t.bal) + ' €</span>' : '') + '</small></button>';
}
function catRow(k, v, max, total, attrs) {
  const c = catById(k), sh = total ? nf(v / total * 100, 0) + '\u00A0% · ' : '';
  return '<button type="button" class="crow" ' + attrs + '><span class="av" style="background:var(' + c.color + ')">' + esc(catInitials(c)) + '</span><b>' + esc(c.name) + '</b><span class="amt"><small class="faint crow-sh">' + sh + '</small>' + money(v, { d: 0 }) + '</span><span class="bar"><i style="width:' + Math.max(2, v / max * 100) + '%;background:var(' + c.color + ')"></i></span></button>';
}
function goalRow(g) {
  const saved = goalSaved(g), pc = g.target ? Math.min(100, saved / g.target * 100) : 0, left = Math.max(0, g.target - saved);
  const months = g.date ? Math.max(1, Math.round((Date.parse(g.date) - Date.now()) / (30.4 * 864e5))) : null;
  return '<div class="goal" data-goal="' + g.id + '"><div class="row" style="gap:14px;flex-wrap:nowrap"><span class="ring" style="--p:' + pc.toFixed(0) + '" data-l="' + nf(pc, 0, 0) + '%"></span><div style="flex:1;min-width:0"><b>' + esc(g.name) + '</b><div class="faint" style="font-size:12.5px">' + money(saved, { d: 0 }) + ' de ' + money(g.target, { d: 0 }) + (left > 0 && months ? ' · ' + money(left / months, { d: 0 }) + '/mes hasta ' + fmtDate(g.date, { month: 'short', year: 'numeric' }) : left <= 0 ? ' · ✓ conseguido' : '') + '</div></div></div></div>';
}
function holdingRow(x) {
  const p = state.prices[x.asset], g = x.cost != null && !x.costMissing ? x.eur - x.cost : null, pr = priceEUR(x.asset);
  return '<button type="button" class="hold" data-asset="' + esc(x.asset) + '"><span class="av" style="background:' + assetColor(x.asset) + '">' + esc(x.asset.slice(0, 4)) + '</span><b>' + esc(state.assets[x.asset]?.name || x.asset) + '</b><span class="r"><b>' + money(x.eur, { d: 0 }) + '</b></span><small>' + nf(x.qty, x.qty < 1 ? 6 : 2, 0) + ' ' + esc(x.asset) + (pr ? ' · <span data-live-price="' + esc(x.asset) + '">' + money(pr, { d: pr < 1 ? 4 : 2 }) + '</span>' : ' · sin precio') + '</small><small class="r">' + (p?.chg != null ? '<span data-live-chg="' + esc(x.asset) + '" class="' + cls(p.chg) + '">' + pct(p.chg) + ' hoy</span>' : '') + (g != null ? ' · <span class="' + cls(g) + '">' + money(g, { sign: true, d: 0 }) + ' FIFO</span>' : '') + '</small></button>';
}
function accCard(a, rows) {
  const v = accValue(a, rows), n = a.kind === 'bank' || a.kind === 'cash' ? 0 : rows.filter(r => r.acc === a.id && !r.bank).length;
  const iban4 = a.iban ? a.iban.slice(-4) : '', hasIbanInName = iban4 && String(a.name || '').includes(iban4);
  const lastTx = (a.kind === 'bank' || a.kind === 'cash') ? state.tx.filter(t => t.acc === a.id).map(t => t.date).sort().at(-1) : '';
  const ik = instKey(a), auto = !!(state.apiBal[a.id] || a.ebUid);
  const sub = (iban4 && !hasIbanInName) ? '•••• ' + iban4 : a.address ? a.address.slice(0, 6) + '…' + a.address.slice(-4) : n ? n + ' ' + (n === 1 ? 'activo' : 'activos') : lastTx ? 'Últ. mov. ' + fmtDate(lastTx, { day: 'numeric', month: 'short' }) : auto ? 'Sincronizado en vivo' : 'Saldo verificado';
  return '<button type="button" class="acard k-' + a.kind + (ik ? ' inst-' + ik : '') + '" data-acc="' + a.id + '"><span class="top"><span>' + esc(a.name) + '</span>' + (auto ? '<span class="tag ok">auto</span>' : '<span class="tag">' + esc(KIND_NAMES[a.kind] || '') + '</span>') + '</span><span><span class="val">' + money(v, { d: 0 }) + '</span><br><span class="sub">' + esc(sub) + '</span></span></button>';
}
function derivCardHTML(d) {
  const col = d.riskLevel === 'danger' ? 'var(--down)' : d.riskLevel === 'warn' ? 'var(--warn)' : 'var(--up)';
  const meterW = d.liqDistPct == null ? 0 : Math.min(100, Math.max(8, 100 - d.liqDistPct * 2));
  const qUnit = d.quote === 'EUR' ? '\u00A0€' : d.quote === 'USDT' ? '\u00A0USDT' : '\u00A0$';
  return '<article class="deriv-card">'
    + '<div class="deriv-head"><div><b>' + esc(d.instr) + '</b> <span class="tag ' + (d.side === 'short' ? 'err' : 'ok') + '">' + (d.side === 'short' ? 'Corto' : 'Largo') + (d.lev ? ' ' + d.lev + '×' : '') + '</span> <span class="tag">' + esc(EXCH[d.exchange] || d.exchange || d.type || 'manual') + '</span></div>'
    + '<b data-live-dpnl="' + esc(d.id) + '" class="' + cls(d.pnlEUR) + '">' + money(d.pnlEUR, { sign: true }) + '</b></div>'
    + '<div class="deriv-metrics">'
    + '<div><small>Entrada</small><b>' + nf(d.entry, d.entry < 10 ? 4 : 2) + qUnit + '</b></div>'
    + '<div><small>Precio actual</small><b>' + (d.mark ? nf(d.mark, d.mark < 10 ? 4 : 2) + qUnit : '—') + '</b></div>'
    + '<div><small>Margen / ROI</small><b>' + (d.marginEUR ? money(d.marginEUR, { d: 0 }) : '—') + (d.roiPct != null ? ' <span class="' + cls(d.roiPct) + '">(' + pct(d.roiPct, 1) + ')</span>' : '') + '</b></div>'
    + '</div>'
    + (d.liq ? '<div><div class="row" style="justify-content:space-between;font-size:12px"><span class="muted">Liquidación: <b>' + nf(d.liq, d.liq < 10 ? 4 : 2) + qUnit + '</b></span><span style="color:' + col + ';font-weight:650;white-space:nowrap">' + (d.liqDistPct != null ? 'A ' + nf(d.liqDistPct, 1) + '\u00A0% · ' + (d.liqDistPct < 10 ? 'Riesgo' : 'Holgado') : '') + '</span></div><div class="liq-meter"><i style="width:' + meterW + '%;background:' + col + '"></i></div></div>' : '')
    + '<div class="row" style="justify-content:space-between">'
    + '<div class="row">' + (d.api ? '' : btn('Editar', 'data-deriv="' + esc(d.id) + '"', 'small') + btn('Cerrar', 'data-act="dv-close" data-id="' + esc(d.id) + '"', 'small')) + btn('Gráfico', 'data-select-sym="' + esc(d.markSym) + '"', 'small') + '</div>'
    + '<a class="btn ghost small" href="' + esc(exchangeTradeURL(d.exchange, d.instr)) + '" target="_blank" rel="noopener noreferrer">Abrir exchange ' + ico('ext') + '</a>'
    + '</div></article>';
}
const OPK = { trade: 'Compra/venta', deposit: 'Depósito', withdraw: 'Retirada', fee: 'Comisión', reward: 'Recompensa', move: 'Interno', deriv: 'Derivados', other: 'Otro' };
function opsTable(ops, hideAcc = false) {
  if (!ops.length) return compactEmpty('Sin operaciones registradas', 'Importa el historial de KuCoin/Kraken o añade una operación.', btn('Añadir operación', 'data-act="add-op"', 'small'));
  return '<div class="scroll"><table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Activo</th><th class="r">Cambio</th>' + (hideAcc ? '' : '<th class="hide-m">Cuenta</th>') + '<th class="hide-m">Detalle</th></tr></thead><tbody>'
    + ops.slice(0, 250).map(l => '<tr data-open data-op="' + l.id + '"><td class="num">' + l.t.slice(0, 16) + '</td><td>' + (OPK[l.kind] || l.kind) + '</td><td><b>' + esc(l.asset) + '</b></td><td class="r ' + cls(l.change) + '">' + (l.change > 0 ? '+' : '') + nf(l.change, 8, 0) + (l.asset === 'EUR' ? ' €' : '') + '</td>' + (hideAcc ? '' : '<td class="hide-m">' + esc(accName(l.acc)) + '</td>') + '<td class="hide-m faint">' + esc(l.note || '') + '</td></tr>').join('') + '</tbody></table></div>';
}
function invDonut(list) {
  const pos = list.filter(x => x.eur > 0), top = pos.slice(0, 6).map(x => [x.asset, x.eur, assetColor(x.asset), x.asset]);
  if (pos.length > 6) top.push(['_o', sum(pos.slice(6).map(x => x.eur)), 'var(--c8)', 'Resto']);
  return top;
}
function workerInfoHTML(i) {
  if (i.error) return '<div class="callout err">' + esc(i.error) + '</div>';
  const ex = Object.entries(i.exchanges || {});
  return '<div class="callout ok">Worker conectado' + (i.version ? ' · <b>' + esc(i.version) + '</b>' : '') + (i.kv ? ' · copia cifrada lista' : ' · <b>falta enlazar el KV «CAUDAL»</b>')
    + (i.openBanking ? ' · Open Banking PSD2 activo' : '')
    + '<br>' + (ex.length ? 'Exchanges: ' + ex.map(([k, v]) => (EXCH[k] || k) + (v ? ' ✓' : ' (sin claves)')).join(' · ') : '') + '</div>';
}
function onboarding() {
  const has = x => x ? ' class="done"' : '';
  return '<div class="grid"><section class="panel span7"><h2>Empieza en 3 pasos</h2><ol class="steps">'
    + '<li' + has(state.tx.length) + '><div><b>Importa o conecta tu banco.</b><br><span class="muted">Santander (Excel/CSV), Revolut, o conexión PSD2 automática.</span><div class="row" style="margin-top:10px">' + btn(ico('upload') + 'Importar archivo', 'data-act="import"', 'primary') + btn(ico('link') + 'Conectar cuentas', 'data-act="connect-hub"') + '</div></div></li>'
    + '<li' + has(state.settings.worker) + '><div><b>Conecta KuCoin, Kraken y Gemini IA.</b><br><span class="muted">Saldos spot, futuros perpetuos, velas en directo e IA conversacional con coste 0 €.</span><div class="row" style="margin-top:10px">' + btn('Configurar Worker', 'data-go="ajustes"') + '</div></div></li>'
    + '<li' + has(state.settings.sync) + '><div><b>Sincroniza ordenador y móvil.</b><br><span class="muted">Los mismos datos cifrados de extremo a extremo entre todos tus dispositivos.</span></div></li></ol></section>'
    + '<section class="panel span5"><h2>Arrastra aquí tus extractos</h2><div class="drop" id="drop" data-act="import">' + ico('upload', 'style="width:28px;height:28px;color:var(--brand)"') + '<br><b>Excel, CSV, OFX, QIF o captura de pantalla</b><br><span class="faint">Santander, Revolut, KuCoin, Kraken, Binance, Trade Republic…</span></div><p class="note">Todo se procesa primero en tu navegador. Si el formato no es estándar, Gemini IA puede extraerlo automáticamente.</p></section></div>';
}

// ===== Barra superior Command Header y Drawer IA de Escritorio =====
function renderDesktopTopbar() {
  const el = $('desktop-topbar'); if (!el) return;
  const navItems = [
    ['resumen', 'Inicio', 'home'],
    ['movimientos', 'Movimientos', 'list'],
    ['inversiones', 'Mercados', 'chart'],
    ['cuentas', 'Cuentas', 'bank'],
    ['objetivos', 'Plan', 'target'],
    ['impuestos', 'Impuestos', 'tax'],
    ['ajustes', 'Ajustes', 'gear'],
    ['copiloto', 'Copiloto', 'brain']
  ];
  const alCount = (state.priceAlerts || []).filter(x => x.active).length;
  const navHTML = navItems.map(([id, n, ic]) => {
    const badge = id === 'objetivos' && alCount ? '<span class="nav-badge">' + alCount + '</span>' : '';
    const isAi = id === 'copiloto' ? ' top-nav-ai' : '';
    return '<button type="button" class="top-nav-btn' + isAi + '" data-go="' + id + '"' + (view === id ? ' aria-current="page"' : '') + '>' + ico(ic) + '<span>' + n + '</span>' + badge + '</button>';
  }).join('');
  const btcP = state.prices.BTC, btcEur = priceEUR('BTC');
  const btcPill = '<button type="button" class="live-pill" data-select-sym="BTC" title="Mercados en directo"><span class="live-dot ' + (liveConnected ? 'on' : '') + '"></span><b>BTC</b><span data-live-price="BTC">' + (btcEur ? money(btcEur, { d: 0 }) : '—') + '</span>' + (btcP?.chg != null ? '<span data-live-chg="BTC" class="top-chg ' + cls(btcP.chg) + '">' + pct(btcP.chg) + '</span>' : '') + '</button>';
  const dark = document.documentElement.dataset.theme !== 'light', hid = !!state.settings.hide;
  el.innerHTML = '<div class="top-left">'
    + '<button type="button" class="top-brand" data-go="resumen"><img src="icon-192.png" alt="" width="24" height="24"><b>Finanzas</b></button>'
    + '<nav class="top-nav" aria-label="Principal">' + navHTML + '</nav>'
    + '</div>'
    + '<div class="top-right">'
    + btcPill
    + '<button type="button" class="cmd-trigger" data-act="cmd-open" title="Buscar (Ctrl+K)">' + ico('search') + '<span>Buscar</span><kbd>Ctrl+K</kbd></button>'
    + btn(ico('link') + '<span>Conectar</span>', 'data-act="connect-hub"', 'small top-act-btn')
    + btn(ico('plus') + '<span>Apuntar</span>', 'data-act="quick"', 'primary small top-act-btn')
    + '<button type="button" id="sync-top-desktop" class="sync-pill" data-act="sync-now" aria-label="Estado de sincronización"></button>'
    + '<button type="button" id="hide-top-desktop" class="iconbtn" data-act="hide" aria-label="Privacidad" title="Privacidad">' + ico(hid ? 'eyeoff' : 'eye') + '</button>'
    + '<button type="button" id="theme-top-desktop" class="iconbtn" data-act="theme" aria-label="Cambiar tema" title="Cambiar tema">' + ico(dark ? 'sun' : 'moon') + '</button>'
    + '</div>';
  paintSync();
}

function renderAIDrawer() {
  const el = $('ai-drawer'); if (!el) return;
  const th = getActiveChat();
  const prov = state.settings.aiProvider === 'local' ? 'Local' : state.settings.worker ? 'Gemini / Worker' : 'Local';
  el.innerHTML = '<div class="ai-drawer-head"><div><b>Copiloto IA</b><small class="faint" style="display:block">' + esc(prov) + ' · lee posiciones y márgenes</small></div><div class="row">' + btn('Pantalla completa', 'data-go="copiloto"', 'ghost small') + '<button class="iconbtn" type="button" data-act="ai-drawer-close" aria-label="Cerrar IA">' + ico('x') + '</button></div></div>'
    + '<div class="ai-messages">' + (th.msgs.length ? th.msgs.map(m => '<div class="ai-msg ' + (m.role === 'user' ? 'user' : 'assistant') + '">' + (m.role === 'user' ? esc(m.text) : renderMarkdown(m.text)) + '</div>').join('') : '<div class="empty"><b>Pregunta lo que quieras</b><p class="note">Ejemplo: «¿Qué posiciones abiertas y márgenes tengo?», «¿Cuánto llevo gastado este mes?»</p></div>') + (aiChatBusy ? '<div class="ai-msg assistant">Analizando datos en tiempo real…</div>' : '') + '</div>'
    + '<div class="ai-suggestions">'
    + '<button type="button" class="chip" data-chat-ask="¿Qué posiciones abiertas tengo y cómo están mis márgenes y liquidación?">Posiciones y márgenes</button>'
    + '<button type="button" class="chip" data-chat-ask="Hazme un resumen de mi patrimonio, liquidez y gastos de este mes.">Resumen hoy</button>'
    + '</div>'
    + '<form class="ai-composer" data-chat-form><input type="text" placeholder="Pregunta al Copiloto…" aria-label="Pregunta al Copiloto"><button class="btn ai small" type="submit">' + ico('send') + '</button></form>';
}

// ===== 1. Inicio Escritorio (Centro de Control Bento — Sin duplicidades) =====
function vResumenDesktop() {
  if (!state.accounts.length) return head('Bienvenido a Finanzas', 'Todo tu patrimonio, bancos, exchanges, derivados e IA en un solo sitio.') + onboarding();
  const nw = netWorth(), inv = investmentSummary(), ds = derivSummary(), ser = netSeries(rangeDays()), pts = ser.pts;
  const cw = range === 'Máx' ? null : changeWindow(rangeDays());
  const chg = cw ? cw.value : (pts.length > 1 ? pts.at(-1)[1] - pts[0][1] : null);
  const m = monthKey(today()), mt = monthTotals(m), s = safeToSpend(), cash = sum(nw.rows.filter(r => r.bank).map(r => r.eur)), derivEq = nw.parts.deriv || 0, al = alerts().slice(0, 3), up = upcoming(31).slice(0, 3);
  const last = state.tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (a.ord ?? 0) - (b.ord ?? 0)).slice(0, 6);
  const cats = Object.entries(mt.byCat).sort((a, b) => b[1] - a[1]), maxCat = cats[0]?.[1] || 1;
  const isB = a => a.kind === 'bank' || a.kind === 'cash';
  const accs = state.accounts.slice().sort((a, b) => (isB(b) - isB(a)) || (accValue(b, nw.rows) - accValue(a, nw.rows))), assets = homeAssets(nw.rows), ders = derivRows();
  const monthWord = monthLong(m).split(' ')[0];
  const monthCap = monthWord.replace(/^./, c => c.toUpperCase());
  const dersLbl = ders.length === 1 ? '1 derivado abierto' : ders.length + ' derivados abiertos';
  const hasSpot = assets.length > 0 || Math.abs(inv.value) >= 1;
  const hasDerivs = ders.length > 0 || Math.abs(derivEq) >= 1;
  const hasInv = hasSpot || hasDerivs;
  const derivVal = ds.equityEUR || derivEq || ds.totalMarginEUR;
  const totRef = Math.max(1, Math.abs(cash) + (hasSpot ? Math.abs(inv.value) : 0) + (hasDerivs ? Math.abs(derivVal) : 0));
  const cashPct = Math.max(0, Math.min(100, cash / totRef * 100));
  const spotPct = hasSpot ? Math.max(2, Math.min(100, Math.abs(inv.value) / totRef * 100)) : 0;
  const derivPct = hasDerivs ? Math.max(2, Math.min(100, Math.abs(derivVal) / totRef * 100)) : 0;
  const cush = cushion(), avgExp = avgMonthlyExpense();
  const expRatio = mt.inc > 0 ? Math.min(100, Math.round(mt.exp / mt.inc * 100)) : (mt.exp > 0 ? 100 : 0);

  const allocStrip = hasInv
    ? '<div class="alloc-strip">'
      + '<div class="alloc-track">'
      + '<i style="width:' + cashPct.toFixed(1) + '%;background:var(--brand)"></i>'
      + (hasSpot ? '<i style="width:' + spotPct.toFixed(1) + '%;background:var(--inv)"></i>' : '')
      + (hasDerivs ? '<i style="width:' + derivPct.toFixed(1) + '%;background:var(--ai)"></i>' : '')
      + '</div>'
      + '<div class="alloc-items">'
      + '<button type="button" class="alloc-item" data-go="cuentas"><i style="background:var(--brand)"></i><span>Liquidez</span><b>' + money(cash, { d: 0 }) + '</b><small>' + nf(nw.total ? cash / nw.total * 100 : 100, 0) + '\u00A0%</small></button>'
      + (hasSpot ? '<button type="button" class="alloc-item" data-go="inversiones"><i style="background:var(--inv)"></i><span>Spot</span><b>' + money(inv.value, { d: 0 }) + '</b><small>' + nf(nw.total ? inv.value / nw.total * 100 : 0, 0) + '\u00A0%</small><small class="' + cls(inv.day) + '">(' + money(inv.day, { sign: true, d: 0 }) + ' en spot hoy)</small></button>' : '')
      + (hasDerivs ? '<button type="button" class="alloc-item" data-go="inversiones" data-inv-deriv="1"><i style="background:var(--ai)"></i><span>Derivados (' + ds.count + ')</span><b>' + money(derivVal, { d: 0 }) + '</b><small>margen ' + money(ds.totalMarginEUR, { d: 0 }) + '</small><small class="' + cls(ds.totalPnlEUR) + '">· PyG ' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</small></button>' : '')
      + '</div></div>'
    : '';

  const col3 = hasInv
    ? '<section class="panel span4 home-col-extra"><div class="module-title"><b>Cartera y derivados</b>' + btn('Mercados →', 'data-go="inversiones"', 'ghost small') + '</div>'
      + (ders.length ? '<div class="callout ' + (ds.atRiskCount ? 'err' : 'ok') + ' deriv-banner"><b>' + dersLbl + ' (' + money(derivVal, { d: 0 }) + '):</b> margen ' + money(ds.totalMarginEUR, { d: 0 }) + ' · PyG ' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + (ds.minLiqDist != null ? ' · liq.\u00A0' + nf(ds.minLiqDist, 1) + '\u00A0%' : '') + '</div>' : '')
      + (assets.length ? '<div class="home-assets-list">' + assets.slice(0, 5).map(x => '<button type="button" class="asset-line" data-asset="' + esc(x.asset) + '"><i style="background:' + assetColor(x.asset) + '">' + esc(x.asset.slice(0, 4)) + '</i><span><b>' + esc(state.assets[x.asset]?.name || x.asset) + '</b><small>' + nf(x.qty, x.qty < 1 ? 6 : 2, 0) + ' ' + esc(x.asset) + '</small></span><strong>' + money(x.eur, { d: 0 }) + '<small data-live-chg="' + esc(x.asset) + '" class="' + cls(state.prices[x.asset]?.chg) + '">' + (state.prices[x.asset]?.chg != null ? pct(state.prices[x.asset].chg) : '') + '</small></strong></button>').join('') + '</div>' : '')
      + '</section>'
    : '<section class="panel span4 home-col-extra"><div class="module-title"><b>Gastos de ' + monthWord + '</b>' + btn('Detalle →', 'data-go="movimientos"', 'ghost small') + '</div>'
      + (cats.length ? cats.slice(0, 4).map(([k, v]) => catRow(k, v, maxCat, mt.exp, 'data-go="movimientos"')).join('') : compactEmpty('Sin gastos este mes', 'Importa un extracto para ver el desglose por categorías.'))
      + '<div class="panel-foot">' + svgCompare(m) + '</div></section>';

  const maxUp = Math.max(0, 3 - al.length);
  const upSlice = up.slice(0, maxUp);
  const extraCatsCount = hasInv ? Math.max(0, 2 - al.length) : 0;
  const flowMiddle = '<div class="flow-extra">'
    + al.map(a => '<div class="decision-line"><b>' + esc(a.txt) + '</b><button type="button" data-dismiss="' + esc(a.id) + '" aria-label="Descartar">×</button></div>').join('')
    + (upSlice.length ? '<div class="label">Próximos cargos</div>' + upSlice.map(x => '<div class="upcoming-line"><time>' + fmtDate(x.next, { day: 'numeric', month: 'short' }) + '</time><span><b>' + esc(fmtMerchant(x.name)) + '</b><small>' + esc(fmtFreq(x.every)) + '</small></span><strong>' + money(-x.amount, { d: 0 }) + '</strong></div>').join('') : '')
    + (extraCatsCount > 0 && cats.length ? '<div class="label">Principales gastos</div>' + cats.slice(0, extraCatsCount).map(([k, v]) => { const c = catById(k); return '<div class="mini-cat-line"><span class="mini-cat-name"><i style="background:var(' + c.color + ')"></i>' + esc(c.name) + '</span><span class="num"><b>' + money(v, { d: 0 }) + '</b> <small class="faint">' + nf(mt.exp ? v / mt.exp * 100 : 0, 0) + '\u00A0%</small></span></div>'; }).join('') : '')
    + '</div>';

  const thirdFlowCell = (!hasInv && Math.round(s.f.end) === Math.round(cash))
    ? '<div class="change-cell"><small>Media mensual</small><b>' + money(avgExp, { d: 0 }) + '</b><span>gasto habitual</span></div>'
    : '<div class="change-cell"><small>Fin de mes</small><b>' + money(s.f.end, { d: 0 }) + '</b><span>liquidez est.</span></div>';
  const chartH = hasInv ? 185 : 148;

  return '<div class="grid">'
    + '<section class="panel span8 hero-main">'
    + '<div class="hero-top"><div class="position-eyebrow"><span>Patrimonio neto</span><span class="faint">· ' + fmtDate(today(), { day: 'numeric', month: 'short', year: 'numeric' }) + '</span></div>'
    + '<div class="hero-controls">' + rangeBtns() + btn(ico('sync'), state.settings.worker ? 'data-act="refresh" title="Actualizar"' : 'data-act="prices" title="Actualizar precios"', 'ghost small') + btn(ico('upload') + 'Importar', 'data-act="import"', 'small') + '</div></div>'
    + '<div class="hero-val-row"><div class="position-value" data-live-nw>' + moneyBig(nw.total) + '</div>'
    + (chg == null ? '<span class="pill">Base inicial</span>' : '<span class="pill ' + cls(chg) + '">' + money(chg, { sign: true, d: 0 }) + ' ' + RANGE_TXT[range] + '</span>')
    + (!hasInv ? '<button type="button" class="alloc-cta" data-act="connect-hub" data-tab="okx">' + ico('plus') + '<span>Conectar inversión / exchange</span></button>' : '')
    + '</div>'
    + allocStrip
    + '<div class="position-chart">' + svgLine(pts, { id: 'nw', h: chartH }) + '</div>'
    + '<div class="panel-foot">' + changeGridHTML('div') + '</div>'
    + '</section>'
    + '<aside class="panel span4 hero-flow"><div class="module-title"><b>Flujo de ' + monthCap + '</b><button type="button" class="btn ghost small" data-go="movimientos">Movimientos →</button></div>'
    + '<div class="flow-summary">'
    + '<div class="flow-summary-nums">'
    + '<div><small>Ingresos</small><b class="up">' + money(mt.inc, { d: 0 }) + '</b></div>'
    + '<div><small>Gastos</small><b>' + money(mt.exp, { d: 0 }) + '</b></div>'
    + '<div><small>Balance</small><b class="' + cls(mt.save) + '">' + money(mt.save, { sign: true, d: 0 }) + '</b></div>'
    + '</div>'
    + '<div class="bar" title="Gastos sobre ingresos (' + expRatio + '%)"><i style="width:' + Math.max(mt.exp > 0 ? 4 : 0, expRatio) + '%;background:' + (mt.inc > 0 && mt.exp > mt.inc ? 'var(--down)' : 'var(--flow)') + '"></i></div>'
    + '</div>'
    + '<div class="change-grid flow-kpis">'
    + '<div class="change-cell"><small>Margen/día</small><b>' + money(s.per, { d: 0 }) + '/día</b><span>ritmo mes</span></div>'
    + '<div class="change-cell"><small>Colchón</small><b>' + (cush != null ? nf(cush, 1) + '\u00A0m' : '—') + '</b><span>' + (avgExp ? 'media ' + money(avgExp, { d: 0 }) : 'liquidez') + '</span></div>'
    + thirdFlowCell
    + '</div>'
    + flowMiddle
    + '<div class="panel-foot"><button type="button" class="btn ai small full" data-go="copiloto">' + ico('brain') + 'Revisar ' + monthWord + ' con Copiloto IA</button></div>'
    + '</aside>'
    + '<section class="panel span4 home-col-acc"><div class="module-title"><b>Cuentas</b><button type="button" class="btn ghost small" data-go="cuentas">Ver todas (' + accs.length + ') →</button></div>'
    + '<div class="acc-list-wrap">' + accs.slice(0, 6).map(a => accountLine(a, nw.rows)).join('') + '</div>'
    + '<div class="panel-foot">' + btn(ico('link') + '+ Conectar banco o exchange', 'data-act="connect-hub"', 'small full') + '</div>'
    + '</section>'
    + '<section class="panel span4 home-col-tx"><div class="module-title"><b>Movimientos recientes</b>' + btn('Ver todos →', 'data-go="movimientos"', 'ghost small') + '</div>'
    + (last.map(txItem).join('') || compactEmpty('Sin movimientos', 'Importa tu extracto bancario.'))
    + '</section>'
    + col3
    + '</div>';
}

// ===== 2. Terminal de Mercados, Velas en directo y Derivados (Escritorio) =====
function buildPortfolioContext() {
  const nw = netWorth(), rows = nw.rows.filter(r => !r.bank), by = {};
  for (const r of rows) { const x = by[r.asset] = by[r.asset] || { asset: r.asset, qty: 0, eur: 0, accs: [], cls: r.cls }; x.qty += r.qty; x.eur += r.eur; x.accs.push(r.acc); }
  const list = Object.values(by).filter(x => Math.abs(x.eur) >= .5 || !priceEUR(x.asset)).sort((a, b) => b.eur - a.eur);
  const total = sum(list.map(x => x.eur)), cb = costBasis(), ders = derivRows(), ds = derivSummary();
  let cost = 0, costOk = 0;
  for (const x of list) { const c = cb[x.asset]; if (c && !FIAT.includes(x.asset) && Math.abs(c.qty - x.qty) <= Math.max(Math.abs(x.qty) * .05, 1e-8)) { x.cost = c.cost * (x.qty / c.qty); x.costMissing = c.missing; if (!c.missing) { cost += x.cost; costOk += x.eur; } } }
  const day = sum(list.map(x => { const p = state.prices[x.asset]; return p && p.chg != null ? x.eur - x.eur / (1 + p.chg / 100) : 0; }));
  const pm = portfolioMetrics(list, total), dn = invDonut(list), gain = costOk - cost, coverage = pm.total ? costOk / pm.total * 100 : 0;
  return { list, total, day, pm, dn, gain, coverage, ders, ds, ops: state.ledger.slice().sort((a, b) => b.t.localeCompare(a.t)) };
}
function portfolioMetrics(list, total) {
  const positive = list.filter(x => x.eur > 0), gross = sum(positive.map(x => x.eur)), top = positive[0] || { eur: 0 }, day = gross ? sum(positive.map(x => x.eur * (state.prices[x.asset]?.chg || 0))) / gross : 0, classes = {};
  for (const x of positive) classes[x.cls || assetCls(x.asset)] = (classes[x.cls || assetCls(x.asset)] || 0) + x.eur;
  const stable = sum(positive.filter(x => assetCls(x.asset) === 'stable' || FIAT.includes(x.asset)).map(x => x.eur));
  return { total: gross, top: gross ? top.eur / gross * 100 : 0, day, classes, stable: gross ? stable / gross * 100 : 0, count: positive.length };
}
function watchlistSymbols(list) {
  const set = new Set([...list.map(x => x.asset), ...Object.keys(state.watchlist || {}), 'BTC', 'ETH', 'SOL']);
  return [...set].filter(s => s && !FIAT.includes(s)).slice(0, 20);
}
function marketChartDeck(sym) {
  const pr = priceEUR(sym), chg = state.prices[sym]?.chg, ohlcv = state.ohlcv?.[sym + '|' + chartInterval], pts = invSeries(rangeDays());
  const closes = (ohlcv?.candles || []).map(c => c[4]), tech = closes.length >= 15 ? calcTechnical(closes) : null;
  const intervals = ['15m', '1h', '4h', '1d', '1w'];
  return '<section class="panel">'
    + '<div class="chart-toolbar">'
    + '<div class="row" style="gap:12px;' + (narrow() ? 'width:100%;justify-content:space-between;flex-wrap:nowrap' : '') + '"><div class="row" style="gap:12px;flex-wrap:nowrap"><span style="width:36px;height:36px;border-radius:10px;background:' + assetColor(sym) + ';color:#fff;display:grid;place-items:center;font-weight:800;font-size:12px">' + esc(sym.slice(0, 4)) + '</span><div><b style="font-size:17px">' + esc(state.assets[sym]?.name || sym) + '</b> <span class="faint">' + esc(sym) + '</span><div class="row" style="gap:8px"><b class="num" style="font-size:20px" data-live-price="' + esc(sym) + '">' + (pr ? money(pr, { d: pr < 1 ? 4 : 2 }) : '—') + '</b>' + (chg != null ? '<span class="pill ' + cls(chg) + '" data-live-chg="' + esc(sym) + '">' + pct(chg) + '</span>' : '') + '</div></div></div>' + (narrow() ? btn('Detalle', 'data-asset="' + esc(sym) + '"', 'small') : '') + '</div>'
    + '<div class="row"><div class="seg"><button type="button" data-chartmode="candles" aria-pressed="' + (chartMode === 'candles') + '">' + ico('candles') + 'Velas</button><button type="button" data-chartmode="tv" aria-pressed="' + (chartMode === 'tv') + '">TradingView</button><button type="button" data-chartmode="portfolio" aria-pressed="' + (chartMode === 'portfolio') + '">Cartera</button></div>'
    + (narrow() ? '' : btn('Detalle', 'data-asset="' + esc(sym) + '"', 'small')) + '</div></div>'
    + (chartMode === 'tv'
      ? '<iframe class="tv-frame" title="TradingView ' + esc(sym) + '" loading="lazy" referrerpolicy="origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="' + esc(tradingViewURL(sym)) + '"></iframe>'
      : chartMode === 'portfolio'
        ? svgLine(pts, { id: 'inv', h: 250 }) + '<div style="margin-top:8px">' + rangeBtns() + '</div>'
        : '<div class="row" style="justify-content:space-between;margin-bottom:8px"><div class="seg">' + intervals.map(iv => '<button type="button" data-interval="' + iv + '" aria-pressed="' + (chartInterval === iv) + '">' + iv + '</button>').join('') + '</div>'
          + (tech ? '<span class="faint" style="font-size:12px">RSI 14: <b>' + nf(tech.rsi, 0) + '</b> · Vol: <b>' + nf(tech.vol, 0) + '%</b> · Max DD: <b class="down">' + nf(tech.dd, 0) + '%</b></span>' : btn('Cargar velas', 'data-act="load-ohlcv" data-id="' + esc(sym) + '"', 'small')) + '</div>'
          + (ohlcv?.candles?.length ? svgCandles(ohlcv.candles, { id: 'ohlcv', sym, h: 270 }) : '<div class="empty"><b>Cargando gráfico de velas para ' + esc(sym) + '</b><p class="note">Pulsa «Cargar velas» o cambia a «TradingView» si quieres ver cualquier ticker al instante.</p>' + btn('Cargar velas ahora', 'data-act="load-ohlcv" data-id="' + esc(sym) + '"', 'primary small') + '</div>'))
    + '</section>';
}

function vInvDesktop() {
  const ctx = buildPortfolioContext(), { list, total, day, pm, dn, gain, coverage, ders, ds, ops } = ctx;
  const wl = watchlistSymbols(list), trends = state.market._trends?.rows || [];
  const acts = (state.settings.worker ? btn(ico('sync') + 'Actualizar', 'data-act="refresh"', 'small') : btn(ico('sync') + 'Precios', 'data-act="prices"', 'small'))
    + btn(ico('plus') + 'Operación', 'data-act="add-op"', invTab === 'spot' ? 'primary small' : 'small')
    + btn(ico('plus') + 'Derivado', 'data-act="add-deriv"', invTab === 'derivs' ? 'primary small' : 'small')
    + btn(ico('bell') + 'Alerta precio', 'data-act="add-price-alert"', 'small');

  const stressLiqHits = ders.filter(d => {
    if (!d.liq || !d.mark) return false;
    const newMark = d.mark * (1 + marketShock / 100);
    return d.side === 'long' ? newMark <= d.liq : newMark >= d.liq;
  });
  const spotShock = total * marketShock / 100;
  const derivShock = sum(ders.map(d => d.notionalEUR * (d.side === 'short' ? -1 : 1) * marketShock / 100));
  const stressImpact = spotShock + derivShock;
  const posLbl = ds.count === 1 ? '1 posición' : ds.count + ' posiciones';

  let tabBody = '';
  if (invTab === 'derivs') {
    tabBody = '<div class="kpi-strip" style="margin-bottom:14px">'
      + '<div class="kpi-card"><small>PyG abierto en vivo</small><b class="' + cls(ds.totalPnlEUR) + '">' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</b><span>' + posLbl + ' · capital ' + money(ds.equityEUR, { d: 0 }) + '</span></div>'
      + '<div class="kpi-card"><small>Margen utilizado</small><b>' + money(ds.totalMarginEUR, { d: 0 }) + '</b><span>Exposición bruta ' + money(ds.grossNotionalEUR, { d: 0 }) + '</span></div>'
      + '<div class="kpi-card"><small>Exposición neta</small><b class="' + cls(ds.netExposureEUR) + '">' + money(ds.netExposureEUR, { sign: true, d: 0 }) + '</b><span>Largo − Corto</span></div>'
      + '<div class="kpi-card"><small>Menor dist. liquidación</small><b class="' + (ds.minLiqDist != null && ds.minLiqDist < 12 ? 'down' : '') + '">' + (ds.minLiqDist != null ? nf(ds.minLiqDist, 1) + '\u00A0%' : '—') + '</b><span>' + (ds.atRiskCount ? ds.atRiskCount + ' en zona de atención' : 'Margen holgado') + '</span></div></div>'
      + '<div class="grid"><section class="panel span8"><div class="module-title"><b>Posiciones de Derivados y Márgenes</b>' + btn(ico('plus') + 'Añadir posición manual', 'data-act="add-deriv"', 'primary small') + '</div>'
      + (ders.length ? '<div class="deriv-grid">' + ders.map(derivCardHTML).join('') + '</div>' : compactEmpty('Sin derivados abiertos', 'Conecta KuCoin/Kraken Futures en solo lectura o registra una posición manual para monitorizar margen y distancia a liquidación.', btn('+ Nuevo derivado', 'data-act="add-deriv"', 'primary small')))
      + '</section><section class="panel span4"><div class="module-title"><b>Simulador de cartera (Spot + Derivados)</b></div><p class="note" style="margin-top:0">Impacto si el mercado se mueve:</p><div class="seg" style="width:100%;justify-content:space-between;margin:10px 0">' + [-20, -10, 10, 20].map(n => '<button type="button" class="' + (marketShock === n ? 'on' : '') + '" data-scenario="' + n + '" aria-pressed="' + (marketShock === n) + '">' + (n > 0 ? '+' : '') + n + '%</button>').join('') + '</div><div class="stat"><small>Spot (' + money(spotShock, { sign: true, d: 0 }) + ') + Derivados (' + money(derivShock, { sign: true, d: 0 }) + ')</small><b class="' + cls(stressImpact) + '">' + money(stressImpact, { sign: true, d: 0 }) + '</b></div>'
      + (stressLiqHits.length ? '<div class="callout err" style="margin-top:10px"><b>Riesgo de liquidación (' + stressLiqHits.length + '):</b> ' + stressLiqHits.map(x => esc(x.instr)).join(', ') + '</div>' : '<p class="note">Ningún derivado registrado alcanza su precio de liquidación en este escenario.</p>')
      + '</section></div>';
  } else if (invTab === 'ops') {
    tabBody = '<section class="panel"><div class="module-title"><b>Historial completo de operaciones (' + ops.length + ')</b><div class="row">' + (state.workerInfo?.exchanges?.kucoin ? btn('Importar KuCoin API', 'data-act="sync-hist" data-id="kucoin"', 'small') : '') + (state.workerInfo?.exchanges?.kraken ? btn('Importar Kraken API', 'data-act="sync-hist" data-id="kraken"', 'small') : '') + btn('+ Operación manual', 'data-act="add-op"', 'primary small') + '</div></div>' + opsTable(ops) + '</section>';
  } else if (invTab === 'radar') {
    const intel = state.market[selectedSymbol];
    tabBody = '<div class="grid"><section class="panel span6"><div class="module-title"><b>Radar de mercado 24 h</b>' + btn(trends.length ? 'Actualizar' : 'Cargar radar', 'data-act="market-radar"', 'small') + '</div>'
      + (trends.length ? '<table class="tbl"><thead><tr><th>Símbolo</th><th class="r">Precio</th><th class="r">24 h</th></tr></thead><tbody>' + trends.slice(0, 10).map(x => '<tr data-open data-select-sym="' + esc(x.symbol) + '"><td><b>' + esc(x.symbol) + '</b></td><td class="r">' + nf(x.price, x.price < 1 ? 5 : 2) + ' $</td><td class="r ' + cls(x.change) + '">' + pct(x.change) + '</td></tr>').join('') + '</tbody></table>' : compactEmpty('Radar sin cargar', 'Pulsa «Cargar radar» para ver los activos con mayor volumen y movimiento.', btn('Cargar radar', 'data-act="market-radar"', 'small')))
      + '</section><section class="panel span6"><div class="module-title"><b>Noticias de ' + esc(selectedSymbol) + '</b>' + btn('Cargar noticias', 'data-act="asset-intel" data-id="' + esc(selectedSymbol) + '"', 'small') + '</div>'
      + (intel?.news?.length ? intel.news.slice(0, 6).map(n => '<a class="account-line" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer"><span class="account-mark">' + ico('news') + '</span><span><b>' + esc(n.title) + '</b><small>' + esc(n.publisher || 'Fuente externa') + '</small></span>' + ico('ext') + '</a>').join('') : compactEmpty('Sin noticias cargadas', 'Pulsa «Cargar noticias» para consultar titulares recientes de ' + esc(selectedSymbol) + '.'))
      + '</section></div>';
  } else {
    tabBody = '<div class="grid"><section class="panel span7"><div class="module-title"><b>Posiciones en cartera (' + list.length + ')</b><span class="faint">' + (coverage >= 80 ? 'Coste FIFO ' + nf(coverage, 0) + '% · ' + money(gain, { sign: true, d: 0 }) : 'Coste parcial · importa historial') + '</span></div>'
      + (list.length ? list.map(holdingRow).join('') : compactEmpty('Cartera spot vacía', 'Importa un CSV o conecta KuCoin/Kraken.', btn('Importar', 'data-act="import"', 'small')))
      + '</section><section class="panel span5"><div class="module-title"><b>Exposición por activo</b></div>'
      + (dn.length ? '<div class="donutwrap">' + donut(dn, { id: 'inv', label: 'cartera', total: pm.total }) + '<div>' + dn.map(([k, v, col, n]) => '<div class="exposure-row"><i style="background:' + col + '"></i><span>' + esc(n) + '</span><b>' + nf(pm.total ? v / pm.total * 100 : 0, 1) + '\u00A0%</b></div>').join('') + '</div></div>' : compactEmpty('Sin exposición', 'Añade activos para ver la distribución.'))
      + '</section></div>';
  }

  const dersLbl = ders.length === 1 ? '1 derivado abierto' : ders.length + ' derivados abiertos';
  const fmtSigned = v => (v > 0 ? '+' : '') + nf(v, 0) + ' €';
  const tabBar = '<div class="row" style="margin:0 0 14px;justify-content:space-between">'
    + '<div class="seg"><button type="button" data-invtab="spot" aria-pressed="' + (invTab === 'spot') + '">Cartera Spot (' + list.length + ')</button><button type="button" data-invtab="derivs" aria-pressed="' + (invTab === 'derivs') + '">Derivados y Márgenes (' + ders.length + ')</button><button type="button" data-invtab="ops" aria-pressed="' + (invTab === 'ops') + '">Operaciones (' + ops.length + ')</button><button type="button" data-invtab="radar" aria-pressed="' + (invTab === 'radar') + '">Radar y Noticias</button></div>'
    + '<div class="row" style="gap:8px"><span class="faint" style="font-size:12px;font-weight:600">Simular cartera:</span><div class="seg">' + [-10, 10, 20].map(n => '<button type="button" class="' + (marketShock === n ? 'on' : '') + '" data-scenario="' + n + '" aria-pressed="' + (marketShock === n) + '">' + (n > 0 ? '+' : '−') + Math.abs(n) + '%</button>').join('') + '</div><span class="pill ' + cls(stressImpact) + '" title="Spot ' + esc(fmtSigned(spotShock)) + ' · Derivados ' + esc(fmtSigned(derivShock)) + '">' + money(stressImpact, { sign: true, d: 0 }) + '</span></div>'
    + '</div>';

  const marketHeader = invTab === 'spot'
    ? '<div class="market-terminal" style="margin-bottom:18px">'
      + marketChartDeck(selectedSymbol)
      + '<aside class="panel"><div class="module-title"><b>Seguimiento</b>' + btn('+ Activo', 'data-act="add-watch"', 'ghost small') + '</div>'
      + '<div class="watchlist-panel">' + wl.map(s => {
        const p = state.prices[s], eur = priceEUR(s);
        return '<button type="button" class="wl-row" data-select-sym="' + esc(s) + '" aria-current="' + (selectedSymbol === s) + '"><i style="background:' + assetColor(s) + '">' + esc(s.slice(0, 4)) + '</i><span><b>' + esc(s) + '</b><small>' + esc(state.assets[s]?.name || { USDT: 'Tether (USDT)', USDC: 'USD Coin' }[s] || CLASS_NAMES[assetCls(s)] || '') + '</small></span><span class="r"><b data-live-price="' + esc(s) + '">' + (eur ? money(eur, { d: eur < 1 ? 4 : 2 }) : '—') + '</b><small data-live-chg="' + esc(s) + '" class="' + cls(p?.chg) + '">' + (p?.chg != null ? pct(p.chg) : '') + '</small></span></button>';
      }).join('') + '</div></aside></div>'
    : '';

  return head('Mercados y Derivados', 'Cartera total: ' + money(total, { d: 0 }) + ' · ' + money(day, { sign: true, d: 0 }) + ' hoy · ' + (ders.length ? dersLbl + ' (' + money(ds.equityEUR, { d: 0 }) + ' · PyG ' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + ')' : 'sin derivados abiertos'), acts)
    + (invTab === 'spot' ? marketHeader + tabBar : tabBar)
    + tabBody;
}

// ===== 3. Movimientos (Escritorio) =====
function filtered() {
  const q = filt.q.toLowerCase();
  return state.tx.filter(t => (!filt.m || monthKey(t.date) === filt.m) && (!filt.day || t.date === filt.day) && (!filt.cat || t.cat === filt.cat) && (!filt.acc || t.acc === filt.acc) && (!filt.type || (filt.type === 'out' ? t.amount < 0 && !isInternal(t) : filt.type === 'in' ? t.amount > 0 && !isInternal(t) : isInternal(t))) && (!q || (t.desc + ' ' + (t.note || '')).toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date) || (a.ord ?? 0) - (b.ord ?? 0));
}
function vMovsDesktop() {
  if (!state.tx.length) return head('Movimientos', 'Ingresos, gastos, suscripciones y flujo mensual') + '<div class="panel"><div class="empty"><b>Aún no hay movimientos</b>Importa el extracto de tu banco o conecta Santander por Open Banking.<div class="row" style="justify-content:center;margin-top:14px">' + btn(ico('upload') + 'Importar extracto', 'data-act="import"', 'primary') + btn(ico('link') + 'Conectar banco', 'data-act="bank-connect"') + '</div></div></div>';
  const months = [...new Set(state.tx.map(t => monthKey(t.date)))].sort().reverse();
  if ((filt.m && !months.includes(filt.m)) || (!filt.m && !filt.all)) filt.m = months[0];
  const rows = filtered(), base = state.tx.filter(t => (!filt.m || monthKey(t.date) === filt.m) && !isInternal(t));
  const inc = sum(base.filter(t => t.amount > 0).map(t => t.amount)), exp = -sum(base.filter(t => t.amount < 0).map(t => t.amount));
  const prevExp = filt.m ? monthTotals(monthAdd(filt.m, -1)).exp : 0;
  const byCat = {}; for (const t of base) if (t.amount < 0) byCat[t.cat] = (byCat[t.cat] || 0) - t.amount;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]), maxCat = cats[0]?.[1] || 1;
  const byDay = {}; for (const t of rows.slice(0, 500)) (byDay[t.date] = byDay[t.date] || []).push(t);
  const chipSrc = filt.type === 'out' ? base.filter(t => t.amount < 0) : filt.type === 'in' ? base.filter(t => t.amount > 0) : base;
  const usedCats = [...new Set(chipSrc.map(t => t.cat))].map(catById), mName = filt.m ? monthLong(filt.m) : 'todo el historial';
  const tseg = [['out', 'Gastos'], ['in', 'Ingresos'], ['', 'Todo'], ['int', 'Internos']];
  const recs = recurring().slice(0, 5), otrosCount = state.tx.filter(t => t.cat === 'otros').length;

  return head('Movimientos', 'Actividad de ' + mName,
    (otrosCount ? btn(ico('brain') + 'Categorizar ' + otrosCount + ' con IA', 'data-act="ai-cat"', 'ai small') : '') + btn(ico('upload') + 'Importar extracto', 'data-act="import"', 'primary small'))
    + '<div class="months" style="margin-bottom:14px">' + months.map(m => '<button type="button" data-month="' + m + '" aria-pressed="' + (filt.m === m) + '">' + MONTHS[+m.slice(5) - 1] + (m.slice(0, 4) !== today().slice(0, 4) ? ' ' + m.slice(2, 4) : '') + '</button>').join('') + '<button type="button" data-month="" aria-pressed="' + (!filt.m) + '">Todo</button></div>'
    + '<div class="grid">'
    + '<section class="panel span8"><div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:14px"><div><div class="faint" style="font-size:12.5px;font-weight:600">' + (filt.type === 'in' ? 'Ingresado' : 'Gastado') + ' en ' + mName + '</div><div class="big" style="margin-top:4px">' + moneyBig(filt.type === 'in' ? inc : exp) + '</div>'
    + (filt.m && prevExp ? '<div class="position-status"><span class="pill ' + (exp <= prevExp ? 'up' : 'down') + '">' + (exp <= prevExp ? '▼ ' : '▲ ') + nf(Math.abs((exp - prevExp) / prevExp * 100), 0, 0) + ' %</span><span>vs. ' + monthLong(monthAdd(filt.m, -1)).split(' ')[0] + ' (' + money(prevExp, { d: 0 }) + ')</span></div>' : '') + '</div>'
    + '<div class="row"><div class="stats" style="grid-template-columns:repeat(2,auto);gap:10px"><div class="stat"><small>Ingresos</small><b class="up">' + money(inc, { d: 0 }) + '</b></div><div class="stat"><small>Balance</small><b class="' + cls(inc - exp) + '">' + money(inc - exp, { sign: true, d: 0 }) + '</b></div></div>'
    + (filt.m ? '<div class="seg"><button type="button" data-movview="list" aria-pressed="' + (movView === 'list') + '">Barras</button><button type="button" data-movview="cal" aria-pressed="' + (movView === 'cal') + '">Calendario</button></div>' : '') + '</div></div>'
    + (filt.m ? (movView === 'cal' ? spendCalendarHTML(filt.m) : svgDays(filt.m) + '<p class="note">' + (filt.day ? 'Día ' + (+filt.day.slice(8)) + ' seleccionado · toca otra vez para quitarlo' : 'Toca una barra para filtrar por día') + '</p>') : svgMonths(months.slice(0, 12).reverse()))
    + '</section>'
    + '<aside class="panel span4"><div class="module-title"><b>Por categoría</b></div>' + (cats.length ? cats.slice(0, 5).map(([k, v]) => catRow(k, v, maxCat, exp, 'data-fcat="' + (filt.cat === k ? '' : k) + '" style="' + (filt.cat && filt.cat !== k ? 'opacity:.45' : '') + '"')).join('') : '<p class="muted">Sin gastos.</p>')
    + (recs.length ? '<div class="label">Gastos recurrentes</div>' + recs.map(r => { const rc = catById(r.cat); return '<div class="upcoming-line" style="grid-template-columns:32px minmax(0,1fr) auto"><span style="width:32px;height:32px;border-radius:9px;background:var(' + rc.color + ');color:#fff;display:grid;place-items:center;font-size:10.5px;font-weight:750">' + esc(catInitials(rc)) + '</span><span style="min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(fmtMerchant(r.name)) + '</b><small>' + esc(rc.name) + ' · ' + r.months + ' meses</small></span><strong>' + money(-r.amount, { d: 0 }) + '</strong></div>'; }).join('') : '') + '</aside>'
    + '<section class="panel span12"><div class="row" style="gap:10px;margin-bottom:12px"><div class="search" style="flex:1;min-width:220px">' + ico('search') + '<input type="search" id="f-q" value="' + esc(filt.q) + '" placeholder="Buscar comercio, persona, concepto…" aria-label="Buscar"></div>'
    + (state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash').length > 1 ? '<select id="f-acc" aria-label="Filtrar por cuenta" style="width:auto;min-width:165px"><option value="">Todas las cuentas</option>' + state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash').map(a => '<option value="' + a.id + '"' + (filt.acc === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select>' : '')
    + '<div class="seg">' + tseg.map(([k, n]) => '<button type="button" data-ftype="' + k + '" aria-pressed="' + (filt.type === k) + '">' + n + '</button>').join('') + '</div></div>'
    + (usedCats.length > 1 ? '<div class="catgrid" style="margin-bottom:10px"><button type="button" class="chip" data-fcat="" aria-pressed="' + !filt.cat + '">Todas</button>' + usedCats.map(c => '<button type="button" class="chip" data-fcat="' + c.id + '" aria-pressed="' + (filt.cat === c.id) + '"><i style="background:var(' + c.color + ')"></i>' + esc(c.name) + '</button>').join('') + '</div>' : '')
    + (rows.length ? Object.entries(byDay).map(([d, ts]) => '<div class="day"><span>' + fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: d.slice(0, 4) === today().slice(0, 4) ? undefined : 'numeric' }) + '</span><span class="num">' + money(sum(ts.map(t => t.amount)), { sign: true }) + '</span></div>' + ts.map(txItem).join('')).join('') : '<div class="empty">Nada con estos filtros.' + '<div class="row" style="justify-content:center;margin-top:10px">' + btn('Quitar filtros', 'data-act="clear-filt"', 'small') + '</div></div>')
    + '</section></div>';
}

// ===== 4. Cuentas y Detalle de Cuenta =====
function vAccountDetail(accId) {
  const a = accById(accId); if (!a) { activeAccId = ''; return vCuentasDesktop(); }
  const nw = netWorth(), valAcc = accValue(a, nw.rows), rows = nw.rows.filter(r => r.acc === a.id).sort((x, y) => y.eur - x.eur);
  const txs = state.tx.filter(t => t.acc === a.id).sort((x, y) => y.date.localeCompare(x.date) || ((x.ord ?? 0) - (y.ord ?? 0)));
  const ops = state.ledger.filter(l => l.acc === a.id).sort((x, y) => y.t.localeCompare(x.t));
  const ders = derivRows().filter(d => d.acc === a.id);
  const isCash = a.kind === 'bank' || a.kind === 'cash';
  const apiSyncTs = state.apiBal[a.id]?.ts;
  const acts = btn('← Todas', 'data-act="acc-back"', 'small') + btn('Editar cuenta', 'data-act="edit-acc" data-id="' + a.id + '"', 'small')
    + (isCash ? btn(ico('upload') + 'Importar extracto', 'data-act="import"', 'primary small') : (a.api ? btn(ico('sync') + 'Sincronizar', 'data-act="refresh"', 'primary small') : btn('+ Operación', 'data-act="add-op"', 'primary small')));

  return head(esc(a.name), (KIND_NAMES[a.kind] || 'Cuenta') + (a.iban ? ' · ' + esc(a.iban) : '') + (a.address ? ' · ' + esc(a.address.slice(0, 10) + '…' + a.address.slice(-6)) : ''), acts)
    + '<div class="grid">'
    + '<section class="panel span4"><div class="position-eyebrow">Saldo actual en cuenta</div><div class="position-value">' + moneyBig(valAcc) + '</div><div class="position-status">' + (state.apiBal[a.id] ? '<span class="tag ok">Sincronización API</span>' : a.ebUid ? '<span class="tag ok">Open Banking PSD2</span>' : '<span class="tag">Manual / Importada</span>') + (apiSyncTs ? ' <small class="faint">' + fmtDate(new Date(apiSyncTs).toISOString().slice(0, 10)) + '</small>' : '') + '</div>'
    + (!isCash ? '<div class="label">Activos en cartera (' + rows.length + ')</div>' + (rows.length ? '<div class="kv">' + rows.map(r => '<dt>' + esc(r.asset) + ' <span class="faint">' + nf(r.qty, r.qty < 1 ? 6 : 2, 0) + '</span></dt><dd>' + money(r.eur, { d: 0 }) + '</dd>').join('') + '</div>' : '<p class="muted">Sin activos registrados.</p>') : '')
    + (ders.length ? '<div class="label">Derivados en esta cuenta (' + ders.length + ')</div>' + ders.map(d => '<div class="upcoming-line" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="tag ' + (d.side === 'short' ? 'err' : 'ok') + '">' + (d.side === 'short' ? 'Corto' : 'Largo') + (d.lev ? ' ' + d.lev + '×' : '') + '</span><span><b>' + esc(d.instr) + '</b><small>Margen ' + money(d.marginEUR, { d: 0 }) + '</small></span><strong class="' + cls(d.pnlEUR) + '">' + money(d.pnlEUR, { sign: true }) + '</strong></div>').join('') : '')
    + (!isCash && state.apiBal[a.id] && !ops.length ? '<div class="callout info" style="margin-top:12px">Los saldos vienen en vivo de la API. Importa tu historial CSV si quieres calcular el coste FIFO.</div>' : '')
    + '</section>'
    + '<section class="panel span8"><div class="module-title"><b>' + (isCash ? 'Movimientos (' + txs.length + ')' : 'Operaciones registradas (' + ops.length + ')') + '</b>' + (!isCash ? btn(ico('upload') + 'Importar CSV', 'data-act="import"', 'ghost small') : '') + '</div>'
    + (isCash ? (txs.length ? txs.slice(0, 80).map(txItem).join('') : compactEmpty('Sin movimientos', 'Importa un extracto o apunta un gasto.')) : opsTable(ops, true))
    + '</section></div>';
}

function vCuentasDesktop() {
  if (activeAccId) return vAccountDetail(activeAccId);
  const nw = netWorth(), groups = [['bank', 'Bancos'], ['cash', 'Efectivo'], ['exchange', 'Exchanges'], ['broker', 'Brókeres y fondos'], ['wallet', 'Monederos y On-Chain']];
  if (!state.accounts.length) return head('Cuentas', 'Conecta tus bancos, exchanges, brókeres y wallets.', btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary')) + '<div class="panel"><div class="empty"><b>Sin cuentas todavía</b>Pulsa «Conectar» para añadir Santander, KuCoin, Kraken, Revolut o cualquier wallet/bróker.</div></div>';
  return head('Cuentas', state.accounts.length + ' cuentas · ' + money(nw.total, { d: 0 }) + ' · toca cualquier tarjeta para ver su detalle',
    btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary small') + btn(ico('plus') + 'Wallet On-Chain', 'data-act="add-wallet"', 'small') + btn(ico('plus') + 'Manual', 'data-act="add-acc"', 'small'))
    + groups.filter(([k]) => state.accounts.some(a => a.kind === k)).map(([k, t]) => {
      const accs = state.accounts.filter(a => a.kind === k).sort((a, b) => accValue(b, nw.rows) - accValue(a, nw.rows)), tot = sum(accs.map(a => accValue(a, nw.rows)));
      return '<div class="row" style="justify-content:space-between;margin:18px 2px 10px"><h2 style="margin:0;font-size:16px">' + t + '</h2><b class="num">' + money(tot, { d: 0 }) + '</b></div><div class="cards-grid">' + accs.map(a => accCard(a, nw.rows)).join('') + '</div>';
    }).join('');
}

// ===== 5. Plan, Presupuestos y Alertas de precio =====
function vGoalsDesktop() {
  const m = monthKey(today()), mt = monthTotals(m), avg = {};
  for (const mm of lastMonths(4).slice(0, 3)) { const t = monthTotals(mm); for (const [k, v] of Object.entries(t.byCat)) avg[k] = (avg[k] || 0) + v / 3; }
  return head('Plan, Presupuestos y Alertas', 'Controla límites mensuales de gasto, bolsillos de ahorro y alertas de precio en tiempo real.',
    btn(ico('plus') + 'Nuevo bolsillo', 'data-act="goal-new"', 'primary small') + btn(ico('bell') + 'Alerta de precio', 'data-act="add-price-alert"', 'small'))
    + '<div class="grid">'
    + '<section class="panel span6"><div class="module-title"><b>Bolsillos de ahorro</b></div>' + (state.goals.length ? state.goals.map(goalRow).join('') : compactEmpty('Sin bolsillos creados', 'Separa dinero para un objetivo o colchón de emergencia.', btn('Crear bolsillo', 'data-act="goal-new"', 'small')))
    + '<div class="module-title" style="margin-top:20px"><b>Alertas de precio en directo</b>' + btn('+ Nueva', 'data-act="add-price-alert"', 'ghost small') + '</div>'
    + ((state.priceAlerts || []).length ? state.priceAlerts.map(pa => '<div class="decision-line"><b>' + esc(pa.sym) + ' ' + (pa.dir === 'above' ? '≥' : '≤') + ' ' + nf(pa.target, pa.target < 1 ? 4 : 2) + ' € <span class="faint">(ahora ' + nf(priceEUR(pa.sym), 2) + ' €)</span></b><button type="button" data-act="pa-del" data-id="' + pa.id + '">×</button></div>').join('') : '<p class="muted">Sin alertas de precio configuradas.</p>')
    + '</section>'
    + '<section class="panel span6"><div class="module-title"><b>Presupuestos de ' + monthLong(m).split(' ')[0] + '</b><span class="faint">Media 3 últimos meses</span></div><div class="list">'
    + CATS.filter(c => c.kind === 'expense').map(c => {
      const lim = state.budgets[c.id] || 0, g = mt.byCat[c.id] || 0, pp = lim ? g / lim * 100 : 0;
      return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 115px;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><div style="min-width:0"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><i style="display:inline-block;width:9px;height:9px;border-radius:3px;background:var(' + c.color + ');margin-right:7px"></i>' + esc(c.name) + '</span><small class="faint num">' + nf(g, 0) + (lim ? ' / ' + nf(lim, 0) : '') + ' € · media ' + nf(avg[c.id] || 0, 0) + '</small></div>' + (lim ? '<div class="bar" style="margin-top:6px"><i style="width:' + Math.min(100, pp) + '%;background:' + (pp > 100 ? 'var(--down)' : pp > 85 ? 'var(--warn)' : 'var(--up)') + '"></i></div>' : '') + '</div><input type="number" min="0" step="5" data-budget="' + c.id + '" value="' + (lim || '') + '" placeholder="Sin límite" aria-label="Límite de ' + esc(c.name) + '"></div>';
    }).join('') + '</div></section></div>';
}

// ===== 6. Impuestos España =====
function vTax() {
  const years = [...new Set([...state.ledger.map(l => l.t.slice(0, 4)), ...state.derivs.filter(d => d.closeDate).map(d => d.closeDate.slice(0, 4))])].sort().reverse();
  const yNow = String(new Date().getFullYear()), year = String(state.settings.taxYear || (years.includes(String(+yNow - 1)) ? +yNow - 1 : years[0] || yNow));
  if (!state.ledger.length && !state.derivs.length) return head('Impuestos', 'Cálculo FIFO orientativo (España) y Modelo 721.') + '<div class="panel"><div class="empty"><b>Sin operaciones de inversión</b>Importa el historial de KuCoin, Kraken o Binance para calcular tus ganancias FIFO.<div class="row" style="justify-content:center;margin-top:12px">' + btn(ico('upload') + 'Importar historial', 'data-act="import"', 'primary') + '</div></div></div>';
  const s = taxSummary(year, taxExtra), coins = byCoin(s.disp), gaps = s.r.gaps.filter(g => g.t.slice(0, 4) <= year);
  return head('Impuestos · ' + year, 'Borrador orientativo de IRPF (España). No es asesoramiento fiscal.',
    '<label class="f" style="min-width:110px">Ejercicio<select id="tax-year">' + [...new Set([...years, yNow])].sort().reverse().map(y => '<option' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select></label>' + btn(taxBusy ? 'Descargando precios…' : 'Recalcular precios', 'data-act="tax-prices"' + (taxBusy ? ' disabled' : '')))
    + '<div class="grid">'
    + (s.r.missingPrice.length ? '<div class="span12 callout">Faltan precios históricos de ' + esc(s.r.missingPrice.join(', ')) + '. Pulsa «Recalcular precios».</div>' : '')
    + '<section class="panel span8"><h2>Resumen del ejercicio</h2><div class="stats">'
    + '<div class="stat"><small>Ganancias</small><b class="up">' + money(s.gain, { d: 0 }) + '</b></div><div class="stat"><small>Pérdidas</small><b class="down">' + money(s.loss, { d: 0 }) + '</b></div><div class="stat"><small>Derivados</small><b class="' + cls(s.der) + '">' + money(s.der, { d: 0 }) + '</b></div>'
    + '<div class="stat"><small>Staking e intereses</small><b>' + money(s.rew, { d: 0 }) + '</b></div><div class="stat"><small>Base del ahorro</small><b>' + money(s.base, { d: 0 }) + '</b></div><div class="stat"><small>Cuota estimada</small><b>' + money(s.cuota, { d: 0 }) + '</b></div></div>'
    + '<label class="f" style="margin-top:14px;max-width:340px">Otras rentas del ahorro (dividendos, intereses…)<input type="number" step="any" id="tax-extra" value="' + (taxExtra || '') + '" placeholder="0"></label>'
    + '<p class="note">Tramos base del ahorro: 19% hasta 6.000 €, 21% hasta 50.000 €, 23% hasta 200.000 €, 27% hasta 300.000 € y 30% en adelante.</p></section>'
    + '<section class="panel span4"><h2>Borrador y Modelo 721</h2><div class="row">' + btn('Descargar CSV', 'data-act="tax-csv"', 'primary') + btn('Copiar texto IA / gestor', 'data-act="tax-ai"') + '</div>'
    + '<div style="margin-top:16px"><div class="label" style="margin-top:0">Modelo 721 (cripto extranjero)</div>' + (m721 && m721.year === year ? ('<p style="margin:0">Saldo a 31/12 en exchanges extranjeros: <b>' + money(m721.total, { d: 0 }) + '</b>. ' + (m721.total > 50000 ? '<span class="tag err">Supera 50.000 €</span>' : '<span class="tag ok">No supera 50.000 €</span>') + '</p>') : btn('Comprobar 721', 'data-act="tax-721"', 'small')) + '</div></section>'
    + '<section class="panel span12"><h2>Por moneda</h2>' + (coins.length ? '<div class="scroll"><table class="tbl"><thead><tr><th>Moneda</th><th>Contraprestación</th><th class="r">Ventas</th><th class="r">Transmisión</th><th class="r">Adquisición</th><th class="r">Resultado</th></tr></thead><tbody>' + coins.map(c => '<tr><td><b>' + esc(c.asset) + '</b></td><td>' + (c.contra === 'fiat' ? 'Fiat' : 'Otra cripto') + '</td><td class="r">' + c.n + '</td><td class="r">' + money(c.proceeds) + '</td><td class="r">' + money(c.cost) + '</td><td class="r ' + cls(c.gain) + '"><b>' + money(c.gain, { sign: true }) + '</b></td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">Sin ventas ni permutas en ' + year + '.</p>')
    + (s.disp.length ? '<details style="margin-top:12px"><summary>Ver cada operación (' + s.disp.length + ')</summary><div class="scroll"><table class="tbl"><thead><tr><th>Fecha</th><th>Moneda</th><th class="r">Cantidad</th><th class="r">Transmisión</th><th class="r">Adquisición</th><th class="r">Resultado</th></tr></thead><tbody>' + s.disp.map(d => '<tr><td class="num">' + d.t.slice(0, 10) + '</td><td>' + esc(d.asset) + (d.missing ? ' <span class="tag warn">sin coste</span>' : '') + '</td><td class="r">' + nf(d.qty, 8, 0) + '</td><td class="r">' + nf(d.proceeds) + '</td><td class="r">' + nf(d.cost) + '</td><td class="r ' + cls(d.gain) + '">' + nf(d.gain) + '</td></tr>').join('') + '</tbody></table></div></details>' : '') + '</section>'
    + '<section class="panel span12"><h2>Completar datos (' + gaps.length + ')</h2>' + (gaps.length ? '<div class="scroll"><table class="tbl"><thead><tr><th>Fecha</th><th>Detalle</th><th>Moneda</th><th class="r">Cantidad</th><th class="r">Coste en €</th></tr></thead><tbody>' + gaps.slice(0, 100).map(g => '<tr><td class="num">' + g.t.slice(0, 10) + '</td><td>' + (g.type === 'deposito' ? 'Depósito sin coste' : 'Venta sin compra previa') + '</td><td>' + esc(g.asset) + '</td><td class="r">' + nf(g.qty, 8, 0) + '</td><td class="r">' + (g.type === 'deposito' ? '<input type="number" step="any" data-cost="' + g.id + '" value="' + (state.costs[g.id] ?? '') + '" style="max-width:130px" placeholder="€">' : '<span class="faint">importa compra</span>') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted">No falta ningún dato de compra.</p>') + '</section></div>';
}

// ===== 7. Copiloto IA Studio (Escritorio) =====
function vCopilotDesktop() {
  const th = getActiveChat(), prov = state.settings.aiProvider === 'local' ? 'Modo local (sin API)' : state.settings.worker ? 'Gemini conectado' : 'Modo local automático';
  const presetBtn = (k, t) => '<button type="button" class="ai-preset" data-act="ai-run" data-id="' + k + '"><span>' + t + '</span><span>→</span></button>';
  return head('Copiloto IA', 'Conversa con Gemini sobre tus cuentas, cartera, derivados, márgenes y gastos.', btn(ico('plus') + 'Nuevo chat', 'data-act="ai-new-chat"', 'small') + btn(ico('gear') + 'Configurar IA', 'data-go="ajustes"', 'small'))
    + '<div class="ai-studio"><aside class="ai-sidebar">'
    + '<div class="tag ai" style="justify-content:center;padding:6px">' + esc(prov) + '</div>'
    + '<div class="label" style="margin-top:8px">Conversaciones</div>'
    + state.aiChats.slice(0, 8).map(c => '<button type="button" class="ai-thread" data-chat-id="' + c.id + '" aria-current="' + (c.id === th.id) + '">' + esc(c.title || 'Chat') + '</button>').join('')
    + '<div class="label">Informes en 1 clic</div>'
    + presetBtn('brief', 'Posición hoy') + presetBtn('portfolio', 'Cartera y derivados') + presetBtn('spend', 'Análisis de gasto') + presetBtn('plan', 'Previsión de mes') + presetBtn('risk', 'Riesgos 30 días') + presetBtn('quality', 'Calidad de datos')
    + '</aside><section class="ai-chat-main">'
    + '<div class="ai-messages">' + (th.msgs.length ? th.msgs.map(m => '<div class="ai-msg ' + (m.role === 'user' ? 'user' : 'assistant') + '">' + (m.role === 'user' ? esc(m.text) : renderMarkdown(m.text)) + '</div>').join('') : '<div class="empty" style="margin:auto"><b>¿Qué quieres analizar hoy?</b><p class="note">Puedo revisar tus posiciones abiertas, márgenes de derivados, liquidaciones, gastos o darte consejos de riesgo. La IA no opera ni garantiza beneficios.</p></div>') + (aiChatBusy ? '<div class="ai-msg assistant">Analizando tus datos…</div>' : '') + '</div>'
    + '<div class="ai-suggestions">'
    + '<button type="button" class="chip" data-chat-ask="¿Qué posiciones tengo abiertas ahora y cuál es mi riesgo de liquidación?">Posiciones y liquidación</button>'
    + '<button type="button" class="chip" data-chat-ask="¿En qué estoy gastando más este mes y cuánto puedo gastar al día?">Gastos este mes</button>'
    + '<button type="button" class="chip" data-chat-ask="¿Qué riesgos principales ves en mi patrimonio y cartera?">Consejos de riesgo</button>'
    + '</div>'
    + '<form class="ai-composer" data-chat-form><input type="text" placeholder="Escribe tu pregunta a Gemini sobre tus finanzas…" aria-label="Escribe tu pregunta"><button class="btn ai" type="submit">' + ico('send') + 'Enviar</button></form>'
    + '</section></div>';
}

// ===== 8. Ajustes =====
const WORKER_STEPS = ['Entra en <b>dash.cloudflare.com</b> → Workers y Pages.', 'Abre tu Worker <code>finanzas</code> → <b>Edit code</b>, pega el contenido de <code>worker.js</code> (w6) y pulsa <b>Deploy</b>.', 'Conserva el KV enlazado como <code>CAUDAL</code> y el secreto <code>TOKEN</code>.', 'En <b>Settings → Variables and Secrets</b> comprueba <code>ALLOWED_ORIGIN</code> con <code>' + location.origin + '</code> (sin barra final).', 'Añade como secretos tus claves de solo lectura: KuCoin (<code>KUCOIN_KEY</code>, <code>KUCOIN_SECRET</code>, <code>KUCOIN_PASSPHRASE</code>), Kraken (<code>KRAKEN_KEY</code>, <code>KRAKEN_SECRET</code>) y <code>GEMINI_API_KEY</code>.', 'Pulsa <b>Guardar y probar</b> aquí debajo para confirmar <b>w6</b>.'];
function vAjustes() {
  const s = state.settings, on = s.worker && s.token;
  const seg = (k, opts) => '<div class="seg">' + opts.map(([v, n]) => '<button type="button" data-set="' + k + '" data-val="' + v + '" aria-pressed="' + (s[k] === v) + '">' + n + '</button>').join('') + '</div>';
  return head('Ajustes', 'Preferencias, sincronización privada, conexiones automáticas y Gemini IA.') + '<div class="grid">'
    + '<section class="panel span5"><h2>Apariencia y privacidad</h2><div class="settings-stack">'
    + '<div class="settings-row"><span><b>Tema</b><small>Oscuro, claro o según el dispositivo</small></span>' + seg('theme', [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']]) + '</div>'
    + '<div class="settings-row"><span><b>Moneda visible</b><small>No modifica los datos reales</small></span>' + seg('show', [['EUR', '€'], ['USD', '$'], ['BTC', 'BTC']]) + '</div>'
    + '<div class="settings-row"><span><b>Privacidad rápida</b><small>Difumina importes y saldos</small></span>' + seg('hide', [[false, 'Visible'], [true, 'Oculto']]) + '</div>'
    + '<div class="settings-row"><span><b>Aviso de saldo bajo (€)</b><small>Alerta por cuenta bancaria</small></span><input type="number" id="set-low" value="' + (s.lowBal ?? 100) + '" style="max-width:130px"></div>'
    + '</div></section>'
    + '<section class="panel span7"><h2>Sincronización entre dispositivos</h2><p data-syncstate class="muted" style="margin-top:0"></p>'
    + ((s.sync && (state.syncError || syncState === 'err')) ? '<div class="callout err" style="margin-bottom:10px"><b>Sincronización detenida:</b> ' + esc(state.syncError || 'No se pudo conectar con tu servidor.') + '<div class="row" style="margin-top:8px">' + btn('Reintentar ahora', 'data-act="sync-now"', 'small') + '</div></div>' : '')
    + (!on ? '<p class="muted">Conecta primero tu servidor gratuito debajo para sincronizar tus datos cifrados entre ordenador y móvil.</p>' : s.sync ? '<p>Tus datos se cifran en este dispositivo con tu clave privada antes de guardarse en la nube.</p><div class="row">' + btn('Vincular otro dispositivo', 'data-act="pair-copy"', 'primary') + (navigator.share ? btn('Enviar al móvil', 'data-act="pair-share"') : '') + btn('Sincronizar ahora', 'data-act="sync-now"') + btn('Desactivar aquí', 'data-act="sync-off"', 'small') + '</div><p class="note">El enlace de vinculación contiene tu clave de descifrado: compártelo solo contigo.</p>' : '<p>Activa la sincronización cifrada para ver lo mismo en PC y móvil en tiempo real.</p>' + btn('Activar sincronización', 'data-act="sync-on"', 'primary'))
    + '</section>'
    + '<section class="span12"><details class="settings-group"' + (on && state.workerInfo?.version === 'w6' ? '' : ' open') + '><summary>Conexiones automáticas: Bancos PSD2, KuCoin y Kraken</summary><div class="settings-body"><p class="muted">Servidor personal gratuito en Cloudflare Workers para sincronizar PC/móvil, leer tus exchanges, bancos y conectar Gemini IA sin coste.</p>'
    + '<div class="form"><label class="f">Dirección del Worker<input type="url" id="set-worker" value="' + esc(s.worker) + '" placeholder="https://finanzas.tu-nombre.workers.dev"></label><label class="f">Código TOKEN<input type="password" id="set-token" value="" autocomplete="new-password" placeholder="' + (s.token ? 'Guardado · déjalo vacío para conservarlo' : 'Pega o genera uno nuevo') + '"></label></div>'
    + '<p class="note"><b>Si aparece HTTP 403:</b> en Cloudflare, <code>ALLOWED_ORIGIN</code> debe ser exactamente <code>' + location.origin + '</code> (sin barra final). El TOKEN nunca se muestra por seguridad.</p>'
    + '<div class="row" style="margin-top:10px">' + btn('Guardar y probar', 'data-act="worker-test"', 'primary') + btn('Generar TOKEN nuevo', 'data-act="gen-token"') + btn('Copiar TOKEN nuevo', 'data-act="copy-token"') + btn('Copiar worker.js', 'data-act="copy-worker"') + '</div>'
    + '<div id="worker-res" style="margin-top:10px">' + (state.workerInfo ? workerInfoHTML(state.workerInfo) : '') + '</div>'
    + '<details style="margin-top:14px"><summary><b>Guía rápida de secretos (solo lectura)</b></summary><ol class="steps" style="margin-top:12px">' + WORKER_STEPS.map(x => '<li><div>' + x + '</div></li>').join('') + '</ol>'
    + '<div class="kv" style="margin-top:12px"><dt>KuCoin (Spot + Futuros)</dt><dd><code>KUCOIN_KEY</code> + <code>KUCOIN_SECRET</code> + <code>KUCOIN_PASSPHRASE</code></dd><dt>Kraken Spot</dt><dd><code>KRAKEN_KEY</code> + <code>KRAKEN_SECRET</code></dd><dt>Kraken Futures</dt><dd><code>KRAKEN_FUTURES_KEY</code> + <code>KRAKEN_FUTURES_SECRET</code></dd><dt>Binance / OKX / Bybit</dt><dd><code>BINANCE_KEY/SECRET</code> · <code>OKX_*</code> · <code>BYBIT_*</code></dd><dt>Bancos PSD2 (Enable Banking)</dt><dd><code>ENABLE_BANKING_APP_ID</code> + <code>ENABLE_BANKING_PRIVATE_KEY</code></dd></div></details></div></details></section>'
    + '<section class="panel span7"><h2>Copiloto Gemini IA</h2><p class="muted">' + (on ? 'Para usar Gemini real (además del análisis local), guarda tu clave gratuita de Google AI Studio como secreto <code>GEMINI_API_KEY</code> en Cloudflare.' : 'Funciona gratis en modo local sin configurar nada, y mejora con Gemini añadiendo <code>GEMINI_API_KEY</code> en tu Worker.') + '</p><div class="form"><label class="f">Proveedor<select id="set-ai-provider"><option value="auto"' + (s.aiProvider === 'auto' ? ' selected' : '') + '>Automático (Gemini primero)</option><option value="local"' + (s.aiProvider === 'local' ? ' selected' : '') + '>Local · sin API</option><option value="gemini"' + (s.aiProvider === 'gemini' ? ' selected' : '') + '>Gemini</option><option value="openai"' + (s.aiProvider === 'openai' ? ' selected' : '') + '>OpenAI</option><option value="anthropic"' + (s.aiProvider === 'anthropic' ? ' selected' : '') + '>Anthropic</option><option value="custom"' + (s.aiProvider === 'custom' ? ' selected' : '') + '>Compatible OpenAI</option></select></label><label class="f">Modelo opcional<input id="set-ai-model" type="text" value="' + esc(s.aiModel || '') + '" placeholder="gemini-3.8-flash"></label><label class="f wide row"><input type="checkbox" id="set-ai-details"' + (s.aiShareDetails ? ' checked' : '') + '><span>Permitir enviar los últimos 30 movimientos (comercio, fecha, importe y categoría).</span></label></div><div class="row" style="margin-top:12px">' + btn('Guardar IA', 'data-act="ai-settings"', 'primary') + btn('Abrir Copiloto', 'data-go="copiloto"') + '</div></section>'
    + '<section class="panel span5"><h2>Instalación y copias de seguridad</h2><p class="note" style="margin-top:0">App: <b>' + ({ instalada: 'Instalada', disponible: 'Lista para instalar', navegador: 'Navegador web' }[installState()]) + '</b> · Copias locales: <b>' + backupInfo().count + ' / 7</b></p><div class="row" style="margin-top:12px">' + btn(ico('install') + 'Instalar app', 'data-act="install"', 'small') + btn('Descargar copia', 'data-act="export"', 'small') + btn('Recuperar copia', 'data-act="backup-restore"', 'small') + btn('Actualizar caché', 'data-act="repair-pwa"', 'small') + '</div>'
    + '<div class="row" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);justify-content:space-between"><span class="faint" style="font-size:12px">Reiniciar este dispositivo</span>' + btn('Borrar todos los datos', 'data-act="wipe"', 'danger small') + '</div>'
    + (state.rules.length ? '<div class="label">Reglas aprendidas (' + state.rules.length + ')</div><div style="max-height:140px;overflow:auto">' + state.rules.map((r, i) => '<div class="decision-line"><b>' + esc(r.match) + ' → ' + esc(catById(r.cat).name) + '</b><button type="button" data-act="rule-del" data-id="' + i + '">×</button></div>').join('') + '</div>' : '') + '</section>'
    + '</div>';
}
function vMasDesktop() { return vAjustes(); }
