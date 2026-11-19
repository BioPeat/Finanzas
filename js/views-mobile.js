// ===== Vistas Móviles (experiencia táctil inspirada en Revolut, Santander y TradingView móvil) =====
"use strict";

function vResumenMobile() {
  if (!state.accounts.length) {
    return '<div class="mobile-home v12-mobile">'
      + '<section class="mobile-hero"><div class="position-eyebrow">Finanzas personales</div><div class="position-value" style="font-size:32px;margin-top:8px">Todo tu dinero en directo</div><p class="muted" style="margin:8px 0 0">Conecta Santander, OKX, KuCoin, Kraken o importa tu primer archivo en segundos.</p>'
      + '<div class="row" style="margin-top:16px">' + btn(ico('upload') + 'Importar archivo', 'data-act="import"', 'primary') + btn(ico('link') + 'Conectar cuentas', 'data-act="connect-hub"') + '</div></section>'
      + onboarding() + '</div>';
  }
  const nw = netWorth(), inv = investmentSummary(), ds = derivSummary(), ser = netSeries(rangeDays()), pts = ser.pts;
  const cw = range === 'Máx' ? null : changeWindow(rangeDays());
  const chg = cw ? cw.value : (pts.length > 1 ? pts.at(-1)[1] - pts[0][1] : null);
  const isB = a => a.kind === 'bank' || a.kind === 'cash';
  const accs = state.accounts.slice().sort((a, b) => (isB(b) - isB(a)) || (accValue(b, nw.rows) - accValue(a, nw.rows))), assets = homeAssets(nw.rows), ders = derivRows(), cash = sum(nw.rows.filter(r => r.bank).map(r => r.eur)), derivEq = nw.parts.deriv || 0;
  const m = monthKey(today()), mt = monthTotals(m), s = safeToSpend(), up = upcoming(31).slice(0, 3), al = alerts().slice(0, 3);
  const last = state.tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (a.ord ?? 0) - (b.ord ?? 0)).slice(0, 4);
  const cats = Object.entries(mt.byCat).sort((a, b) => b[1] - a[1]), maxCat = cats[0]?.[1] || 1;
  const monthWord = monthLong(m).split(' ')[0], monthCap = monthWord.replace(/^./, c => c.toUpperCase());
  const hasSpot = assets.length > 0 || Math.abs(inv.value) >= 1;
  const hasDerivs = ders.length > 0 || Math.abs(derivEq) >= 1;
  const hasInv = hasSpot || hasDerivs;
  const derivVal = ds.equityEUR || derivEq || ds.totalMarginEUR;
  const totRef = Math.max(1, Math.abs(cash) + (hasSpot ? Math.abs(inv.value) : 0) + (hasDerivs ? Math.abs(derivVal) : 0));
  const cashPct = Math.max(0, Math.min(100, cash / totRef * 100));
  const spotPct = hasSpot ? Math.max(2, Math.min(100, Math.abs(inv.value) / totRef * 100)) : 0;
  const derivPct = hasDerivs ? Math.max(2, Math.min(100, Math.abs(derivVal) / totRef * 100)) : 0;
  const cush = cushion(), avgExp = avgMonthlyExpense();
  const thirdFlowCell = (!hasInv && Math.round(s.f.end) === Math.round(cash))
    ? '<div class="change-cell"><small>Media mensual</small><b>' + money(avgExp, { d: 0 }) + '</b><span>gasto habitual</span></div>'
    : '<div class="change-cell"><small>Fin de mes</small><b>' + money(s.f.end, { d: 0 }) + '</b><span>liquidez est.</span></div>';

  return '<div class="mobile-home v12-mobile v7-mobile">'
    + '<section class="mobile-hero">'
    + '<div class="m-hero-top"><div class="position-eyebrow"><span>Patrimonio neto · ' + fmtDate(today(), { day: 'numeric', month: 'short' }) + '</span></div>'
    + (chg == null ? '<span class="pill">Base inicial</span>' : '<span class="pill ' + cls(chg) + '">' + money(chg, { sign: true, d: 0 }) + ' · ' + RANGE_TXT[range] + '</span>') + '</div>'
    + '<div class="position-value" data-live-nw>' + moneyBig(nw.total) + '</div>'
    + (hasInv
      ? '<div class="alloc-track" style="margin-top:10px"><i style="width:' + cashPct.toFixed(1) + '%;background:var(--brand)"></i>' + (hasSpot ? '<i style="width:' + spotPct.toFixed(1) + '%;background:var(--inv)"></i>' : '') + (hasDerivs ? '<i style="width:' + derivPct.toFixed(1) + '%;background:var(--ai)"></i>' : '') + '</div>'
      : '<div style="margin-top:8px"><button type="button" class="alloc-cta" data-act="connect-hub" data-tab="okx">' + ico('plus') + '<span>Conectar inversión / exchange</span></button></div>')
    + '<div class="position-chart m-hero-chart">' + svgLine(pts, { id: 'nw', h: 112, axis: false }) + '</div>'
    + rangeBtns()
    + '<div class="m-quick-actions">'
    + '<button type="button" class="m-qbtn primary" data-act="quick"><span>' + ico('plus') + '</span><small>Apuntar</small></button>'
    + '<button type="button" class="m-qbtn" data-act="import"><span>' + ico('upload') + '</span><small>Importar</small></button>'
    + '<button type="button" class="m-qbtn" data-act="connect-hub"><span>' + ico('link') + '</span><small>Conectar</small></button>'
    + '<button type="button" class="m-qbtn ai" data-go="copiloto"><span>' + ico('brain') + '</span><small>Copiloto</small></button>'
    + '</div></section>'
    + changeGridHTML('section', 'aria-label="Cambios reales"')
    + (hasInv
      ? '<section class="panel m-flat-panel">'
        + '<button type="button" class="m-flat-row" data-go="cuentas"><span><b>En bancos (líquido)</b><small>' + nf(nw.total ? cash / nw.total * 100 : 0, 1) + '\u00A0% del patrimonio</small></span><strong>' + money(cash, { d: 0 }) + '</strong></button>'
        + '<button type="button" class="m-flat-row" data-go="inversiones"><span><b>Cartera Spot</b><small>' + nf(nw.total ? inv.value / nw.total * 100 : 0, 1) + '\u00A0% · ' + money(inv.day, { sign: true, d: 0 }) + ' en spot hoy</small></span><strong>' + money(inv.value, { d: 0 }) + '</strong></button>'
        + (ds.count ? '<button type="button" class="m-flat-row" data-go="inversiones" data-inv-deriv="1"><span><b>' + (ds.count === 1 ? '1 derivado abierto' : ds.count + ' derivados abiertos') + '</b><small>Margen ' + money(ds.totalMarginEUR, { d: 0 }) + ' · PyG <em class="m-em ' + cls(ds.totalPnlEUR) + '">' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</em>' + (ds.minLiqDist != null ? ' · liq.\u00A0' + nf(ds.minLiqDist, 1) + '\u00A0%' : '') + '</small></span><strong>' + money(derivVal, { d: 0 }) + '</strong></button>' : '')
        + '</section>'
      : '')
    + '<section class="m-section"><div class="section-title"><h2>Tus cuentas</h2><button type="button" data-go="cuentas">Ver todas</button></div>'
    + '<div class="m-carousel">' + accs.slice(0, 8).map(a => accCard(a, nw.rows)).join('') + '<button type="button" class="acard acard-add" data-act="connect-hub">' + ico('plus') + '<span class="sub">Conectar</span></button></div></section>'
    + '<section class="panel"><div class="section-title"><h2>Flujo de ' + monthCap + '</h2><button type="button" data-go="movimientos">Movimientos →</button></div>'
    + '<div class="flow-number"><span><small>Ingresos</small><b class="up">' + money(mt.inc, { d: 0 }) + '</b></span><span><small>Gastos</small><b>' + money(mt.exp, { d: 0 }) + '</b></span><span><small>Balance</small><b class="' + cls(mt.save) + '">' + money(mt.save, { sign: true, d: 0 }) + '</b></span></div>'
    + '<div class="change-grid" style="margin-top:8px"><div class="change-cell"><small>Margen/día</small><b>' + money(s.per, { d: 0 }) + '/día</b><span>ritmo mes</span></div><div class="change-cell"><small>Colchón</small><b>' + (cush == null ? '—' : nf(cush, 1) + '\u00A0m') + '</b><span>media ' + money(avgExp, { d: 0 }) + '</span></div>' + thirdFlowCell + '</div>'
    + (up.length ? '<div class="label">Próximos cargos</div>' + up.map(x => '<div class="upcoming-line"><time>' + fmtDate(x.next) + '</time><span><b>' + esc(fmtMerchant(x.name)) + '</b><small>' + esc(fmtFreq(x.every)) + '</small></span><strong>' + money(-x.amount, { d: 0 }) + '</strong></div>').join('') : '')
    + '<div style="margin-top:10px">' + btn(ico('brain') + 'Revisar ' + monthWord + ' con Copiloto IA', 'data-go="copiloto"', 'ai full') + '</div></section>'
    + (hasInv
      ? (assets.length ? '<section class="panel"><div class="section-title"><h2>Activos en vivo</h2><button type="button" data-go="inversiones">Mercados →</button></div>' + assets.slice(0, 5).map(x => '<button type="button" class="asset-line" data-asset="' + esc(x.asset) + '"><i style="background:' + assetColor(x.asset) + '">' + esc(x.asset.slice(0, 4)) + '</i><span><b>' + esc(state.assets[x.asset]?.name || x.asset) + '</b><small>' + nf(x.qty, x.qty < 1 ? 6 : 2, 0) + ' ' + esc(x.asset) + '</small></span><strong>' + money(x.eur, { d: 0 }) + '<small data-live-chg="' + esc(x.asset) + '" class="' + cls(state.prices[x.asset]?.chg) + '">' + (state.prices[x.asset]?.chg != null ? pct(state.prices[x.asset].chg) : '') + '</small></strong></button>').join('') + '</section>' : '')
      : '<section class="panel"><div class="section-title"><h2>Gastos de ' + monthWord + '</h2><button type="button" data-go="movimientos">Detalle →</button></div>' + (cats.length ? cats.slice(0, 4).map(([k, v]) => catRow(k, v, maxCat, mt.exp, 'data-go="movimientos"')).join('') : compactEmpty('Sin gastos este mes', 'Importa un extracto para ver categorías.')) + '<div class="panel-foot">' + svgCompare(m) + '</div></section>')
    + (al.length ? '<section class="panel"><div class="section-title"><h2>Avisos (' + al.length + ')</h2><button type="button" data-go="copiloto">Preguntar IA</button></div>' + al.map(a => '<div class="decision-line"><b>' + esc(a.txt) + '</b><button type="button" data-dismiss="' + esc(a.id) + '" aria-label="Descartar">×</button></div>').join('') + '</section>' : '')
    + '<section class="panel"><div class="section-title"><h2>Movimientos recientes</h2><button type="button" data-go="movimientos">Ver todos →</button></div>' + (last.map(txItem).join('') || compactEmpty('Sin movimientos', 'Importa tu extracto.')) + '</section>'
    + (state.settings.gestureHint ? '<div class="gesture-hint"><span><b>Gestos con el pulgar:</b> desliza a los lados para cambiar de pestaña o abrir el menú.</span><button type="button" data-set="gestureHint" data-val="false">Entendido</button></div>' : '')
    + '</div>';
}

function vInvMobile() {
  const ctx = buildPortfolioContext(), { list, total, day, pm, dn, gain, coverage, ders, ds, ops } = ctx;
  const wl = watchlistSymbols(list), trends = state.market._trends?.rows || [];
  const tabs = '<div class="market-tabs" role="tablist">'
    + [['resumen', 'En directo'], ['activos', 'Cartera (' + list.length + ')'], ['derivs', 'Derivados (' + ders.length + ')']].map(([k, n]) => '<button type="button" data-invview="' + k + '" aria-pressed="' + (invView === k) + '">' + n + '</button>').join('')
    + '</div>';
  const acts = (state.settings.worker ? btn(ico('sync') + 'Actualizar', 'data-act="refresh"', 'small') : btn(ico('sync') + 'Precios', 'data-act="prices"', 'small'))
    + btn(ico('plus') + 'Op.', 'data-act="add-op"', invView === 'activos' ? 'primary small' : 'small')
    + btn(ico('plus') + 'Derivado', 'data-act="add-deriv"', invView === 'derivs' ? 'primary small' : 'small');

  let body = '';
  if (invView === 'derivs') {
    body = '<div class="kpi-strip">'
      + '<div class="kpi-card"><small>PyG abierto</small><b class="' + cls(ds.totalPnlEUR) + '">' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Margen usado</small><b>' + money(ds.totalMarginEUR, { d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Exposición neta</small><b class="' + cls(ds.netExposureEUR) + '">' + money(ds.netExposureEUR, { sign: true, d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Menor dist. liq.</small><b class="' + (ds.minLiqDist != null && ds.minLiqDist < 12 ? 'down' : '') + '">' + (ds.minLiqDist != null ? nf(ds.minLiqDist, 1) + '\u00A0%' : '—') + '</b></div></div>'
      + '<section class="panel"><div class="module-title"><b>Posiciones abiertas (' + ders.length + ')</b></div>'
      + (ders.length ? '<div style="display:grid;gap:12px">' + ders.map(derivCardHTML).join('') + '</div>' : compactEmpty('Sin derivados abiertos', 'Añade uno manual o conecta KuCoin/Kraken Futures.', btn('+ Nuevo derivado', 'data-act="add-deriv"', 'primary small'))) + '</section>'
      + '<section class="panel"><div class="module-title"><b>Simulador de cartera</b></div><div class="seg" style="width:100%">' + [-20, -10, 10, 20].map(n => '<button style="flex:1" type="button" class="' + (marketShock === n ? 'on' : '') + '" data-scenario="' + n + '" aria-pressed="' + (marketShock === n) + '">' + (n > 0 ? '+' : '') + n + '%</button>').join('') + '</div><div class="stat" style="margin-top:10px"><small>Impacto en cartera + derivados</small><b class="' + cls(total * marketShock / 100) + '">' + money((total + ds.netExposureEUR) * marketShock / 100, { sign: true, d: 0 }) + '</b></div></section>';
  } else if (invView === 'activos') {
    body = '<section class="panel"><div class="position-eyebrow">Cartera Spot</div><div class="position-value">' + moneyBig(total) + '</div><div class="position-status"><b class="' + cls(day) + '">' + money(day, { sign: true, d: 0 }) + '</b><span>hoy</span>' + (coverage >= 80 ? '<b class="' + cls(gain) + '">' + money(gain, { sign: true, d: 0 }) + '</b><span>FIFO</span>' : '') + '</div></section>'
      + '<section class="panel"><div class="module-title"><b>Posiciones (' + list.length + ')</b></div>' + (list.length ? list.map(holdingRow).join('') : compactEmpty('Cartera vacía', 'Importa CSV o conecta un exchange.', btn('Importar', 'data-act="import"', 'small'))) + '</section>'
      + (dn.length ? '<section class="panel"><div class="module-title"><b>Exposición</b></div><div class="donutwrap">' + donut(dn, { id: 'inv', label: 'cartera', total: pm.total }) + '<div>' + dn.map(([k, v, col, n]) => '<div class="exposure-row"><i style="background:' + col + '"></i><span>' + esc(n) + '</span><b>' + nf(pm.total ? v / pm.total * 100 : 0, 1) + ' %</b></div>').join('') + '</div></div></section>' : '')
      + '<section class="panel"><div class="module-title"><b>Últimas operaciones</b></div>' + opsTable(ops.slice(0, 40)) + '</section>';
  } else {
    body = '<div class="months" style="margin-bottom:2px;mask-image:linear-gradient(90deg,#000 88%,transparent);-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent)">' + wl.map(s => '<button type="button" style="padding:0 11px;font-size:12.5px" data-select-sym="' + esc(s) + '" aria-pressed="' + (selectedSymbol === s) + '">' + esc(s) + (state.prices[s]?.chg != null ? ' <span class="' + cls(state.prices[s].chg) + '" style="font-weight:700">' + pct(state.prices[s].chg, 1) + '</span>' : '') + '</button>').join('') + '<button type="button" data-act="add-watch">+ Ticker</button></div>'
      + marketChartDeck(selectedSymbol)
      + '<section class="panel"><div class="module-title"><b>Radar 24 h</b>' + btn(trends.length ? 'Actualizar' : 'Cargar', 'data-act="market-radar"', 'ghost small') + '</div>'
      + (trends.length ? trends.slice(0, 6).map(x => '<button type="button" class="account-line" data-select-sym="' + esc(x.symbol) + '"><span class="account-mark">' + esc(x.symbol.slice(0, 4)) + '</span><span><b>' + esc(x.symbol) + '</b><small>' + nf(x.price, x.price < 1 ? 5 : 2) + ' $</small></span><strong class="' + cls(x.change) + '">' + pct(x.change) + '</strong></button>').join('') : compactEmpty('Radar sin cargar', 'Pulsa Cargar para ver activos más movidos en 24 h.')) + '</section>';
  }

  return head('Mercados', 'Precios en directo, velas y derivados.', acts) + tabs + '<div class="market-mobile" style="display:grid;gap:14px">' + body + '</div>';
}

function vMovsMobile() {
  if (!state.tx.length) return head('Movimientos', 'Ingresos y gastos') + '<div class="panel"><div class="empty"><b>Aún no hay movimientos</b>Importa tu extracto de Santander o conecta Open Banking.<div class="row" style="justify-content:center;margin-top:12px">' + btn(ico('upload') + 'Importar', 'data-act="import"', 'primary') + '</div></div></div>';
  const months = [...new Set(state.tx.map(t => monthKey(t.date)))].sort().reverse();
  if ((filt.m && !months.includes(filt.m)) || (!filt.m && !filt.all)) filt.m = months[0];
  const rows = filtered(), base = state.tx.filter(t => (!filt.m || monthKey(t.date) === filt.m) && !isInternal(t));
  const inc = sum(base.filter(t => t.amount > 0 && catById(t.cat).kind === 'income').map(t => t.amount)), exp = -sum(base.filter(t => t.amount < 0).map(t => t.amount));
  const byCat = {}; for (const t of base) if (t.amount < 0) byCat[t.cat] = (byCat[t.cat] || 0) - t.amount;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]), maxCat = cats[0]?.[1] || 1;
  const byDay = {}; for (const t of rows.slice(0, 250)) (byDay[t.date] = byDay[t.date] || []).push(t);
  const prevExp = filt.m ? monthTotals(monthAdd(filt.m, -1)).exp : 0;
  const otrosCount = state.tx.filter(t => t.cat === 'otros').length;
  const bankAccs = state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash');

  return head('Movimientos', filt.m ? monthLong(filt.m) : 'Historial', (otrosCount ? btn(ico('brain') + 'IA (' + otrosCount + ')', 'data-act="ai-cat"', 'ai small') : '') + btn(ico('upload') + 'Importar', 'data-act="import"', 'small') + btn(ico('plus') + 'Apuntar', 'data-act="quick"', 'primary small'))
    + '<div class="months" style="margin-bottom:10px">' + months.map(m => '<button type="button" data-month="' + m + '" aria-pressed="' + (filt.m === m) + '">' + MONTHS[+m.slice(5) - 1] + '</button>').join('') + '<button type="button" data-month="" aria-pressed="' + (!filt.m) + '">Todo</button></div>'
    + '<div class="grid">'
    + '<section class="panel"><div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><small class="muted">' + (filt.type === 'in' ? 'Ingresado' : 'Gastado') + '</small><div class="big" style="font-size:32px">' + moneyBig(filt.type === 'in' ? inc : exp) + '</div>' + (filt.m && prevExp ? '<div class="position-status" style="margin-top:4px"><span class="pill ' + (exp <= prevExp ? 'up' : 'down') + '">' + (exp <= prevExp ? '▼ ' : '▲ ') + nf(Math.abs((exp - prevExp) / prevExp * 100), 0, 0) + '\u00A0%</span><span style="font-size:12px">vs.\u00A0' + MONTHS[+monthAdd(filt.m, -1).slice(5) - 1] + ' (' + money(prevExp, { d: 0 }) + ')</span></div>' : '') + '</div>'
    + (filt.m ? '<div class="seg"><button type="button" data-movview="list" aria-pressed="' + (movView === 'list') + '">Barras</button><button type="button" data-movview="cal" aria-pressed="' + (movView === 'cal') + '">Cal.</button></div>' : '') + '</div>'
    + '<div class="flow-number" style="margin-bottom:12px"><span><small>Ingresos</small><b class="up">' + money(inc, { d: 0 }) + '</b></span><span><small>Gastado</small><b>' + money(exp, { d: 0 }) + '</b></span><span><small>Balance</small><b class="' + cls(inc - exp) + '">' + money(inc - exp, { sign: true, d: 0 }) + '</b></span></div>'
    + (filt.m ? (movView === 'cal' ? spendCalendarHTML(filt.m) : svgDays(filt.m)) : svgMonths(months.slice(0, 8).reverse())) + '</section>'
    + (cats.length ? '<section class="panel"><div class="module-title"><b>Categorías</b></div>' + cats.slice(0, 5).map(([k, v]) => catRow(k, v, maxCat, exp, 'data-fcat="' + (filt.cat === k ? '' : k) + '"')).join('') + '</section>' : '')
    + '<section class="panel"><div class="search" style="margin-bottom:10px">' + ico('search') + '<input type="search" id="f-q" value="' + esc(filt.q) + '" placeholder="Buscar comercio o concepto…"></div>'
    + (bankAccs.length > 1 ? '<select id="f-acc" aria-label="Filtrar por cuenta" style="margin-bottom:10px"><option value="">Todas las cuentas</option>' + bankAccs.map(a => '<option value="' + a.id + '"' + (filt.acc === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select>' : '')
    + '<div class="seg" style="width:100%;margin-bottom:10px">' + [['out', 'Gastos'], ['in', 'Ingresos'], ['', 'Todo'], ['int', 'Internos']].map(([k, n]) => '<button style="flex:1" type="button" data-ftype="' + k + '" aria-pressed="' + (filt.type === k) + '">' + n + '</button>').join('') + '</div>'
    + (rows.length ? Object.entries(byDay).map(([d, ts]) => '<div class="day"><span>' + fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' }) + '</span><span class="num">' + money(sum(ts.map(t => t.amount)), { sign: true }) + '</span></div>' + ts.map(txItem).join('')).join('') : '<div class="empty">Nada con estos filtros.' + btn('Limpiar', 'data-act="clear-filt"', 'small') + '</div>')
    + '</section></div>';
}

function vCuentasMobile() {
  if (activeAccId) return vAccountDetail(activeAccId);
  const nw = netWorth();
  if (!state.accounts.length) return head('Cuentas', 'Conecta bancos, exchanges y wallets', btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary small')) + '<div class="panel"><div class="empty"><b>Sin cuentas</b>Pulsa Conectar para empezar.</div></div>';
  return head('Cuentas', money(nw.total, { d: 0 }) + ' en ' + state.accounts.length + ' cuentas', btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary small') + btn('+ Manual', 'data-act="add-acc"', 'small'))
    + '<div style="display:grid;gap:12px">' + state.accounts.slice().sort((a, b) => accValue(b, nw.rows) - accValue(a, nw.rows)).map(a => accCard(a, nw.rows)).join('') + '</div>';
}

function vCopilotMobile() {
  const th = getActiveChat();
  return head('Copiloto IA', '', btn(ico('plus') + 'Nuevo', 'data-act="ai-new-chat"', 'small') + btn('Resumen hoy', 'data-act="ai-run" data-id="brief"', 'ai small') + btn(ico('gear'), 'data-go="ajustes" aria-label="Configurar IA"', 'small'))
    + '<div class="ai-studio"><section class="ai-chat-main">'
    + '<div class="ai-messages">' + (th.msgs.length ? th.msgs.map(m => '<div class="ai-msg ' + (m.role === 'user' ? 'user' : 'assistant') + '">' + (m.role === 'user' ? esc(m.text) : renderMarkdown(m.text)) + '</div>').join('') : '<div class="empty" style="margin:auto"><b>Hola, soy tu Copiloto</b><p class="note">Pregúntame qué posiciones tienes abiertas, cómo están tus márgenes o revisa tus gastos.</p></div>') + (aiChatBusy ? '<div class="ai-msg assistant">Pensando…</div>' : '') + '</div>'
    + '<div class="ai-suggestions" style="overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none">'
    + '<button type="button" class="chip" data-chat-ask="¿Qué posiciones abiertas tengo y cómo están mis márgenes?">Posiciones y márgenes</button>'
    + '<button type="button" class="chip" data-chat-ask="Resumen de mi mes y cuánto puedo gastar hoy">Gastos del mes</button>'
    + '<button type="button" class="chip" data-chat-ask="¿Qué riesgos principales ves en mi cartera?">Riesgos</button>'
    + '</div>'
    + '<form class="ai-composer" data-chat-form><input type="text" placeholder="Pregunta a Gemini…" aria-label="Pregunta"><button class="btn ai small" type="submit" style="min-height:44px;min-width:44px">' + ico('send') + '</button></form>'
    + '</section></div>';
}
