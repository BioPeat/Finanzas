// ===== Vistas Móviles (Editorial Táctil) =====
"use strict";

function vResumenMobile() {
  if (!state.accounts.length) {
    return '<div class="mobile-home v12-mobile">'
      + '<section class="mobile-hero"><div class="position-eyebrow">Finanzas personales</div><div class="position-value">Todo tu dinero en directo</div><p class="muted mt-8">Conecta Santander, OKX, KuCoin, Kraken o importa tu primer archivo en segundos.</p>'
      + '<div class="row mt-16">' + btn(ico('upload') + 'Importar archivo', 'data-act="import"', 'primary') + btn(ico('link') + 'Conectar cuentas', 'data-act="connect-hub"') + '</div></section>'
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
  const expRatio = mt.inc > 0 ? Math.min(100, Math.round(mt.exp / mt.inc * 100)) : (mt.exp > 0 ? 100 : 0);
  const insight = (s.per > 0 ? 'Margen ' + money(s.per, { d: 0 }) + '/día' : 'Gasto mes ' + money(mt.exp, { d: 0 }))
    + (cush != null ? ' · Colchón ' + nf(cush, 1) + ' m' : avgExp ? ' · Media ' + money(avgExp, { d: 0 }) : '');
  const thirdFlowCell = (!hasInv && Math.round(s.f.end) === Math.round(cash))
    ? '<div class="change-cell"><small>Media mensual</small><b>' + money(avgExp, { d: 0 }) + '</b><span>gasto habitual</span></div>'
    : '<div class="change-cell"><small>Fin de mes</small><b>' + money(s.f.end, { d: 0 }) + '</b><span>liquidez est.</span></div>';

  return '<div class="mobile-home v12-mobile v7-mobile">'
    + '<section class="mobile-hero">'
    + '<div class="m-hero-top"><div class="position-eyebrow"><span>Patrimonio neto · ' + fmtDate(today(), { day: 'numeric', month: 'short' }) + '</span></div>'
    + (chg == null ? '<span class="pill">Base inicial</span>' : '<span class="pill ' + cls(chg) + '">' + money(chg, { sign: true, d: 0 }) + ' · ' + RANGE_TXT[range] + '</span>') + '</div>'
    + '<div class="position-value" data-live-nw>' + moneyBig(nw.total) + '</div>'
    + '<p class="hero-insight">' + insight + '</p>'
    + (hasInv
      ? '<div class="alloc-track mt-10"><i style="width:' + cashPct.toFixed(1) + '%;background:var(--brand)"></i>' + (hasSpot ? '<i style="width:' + spotPct.toFixed(1) + '%;background:var(--inv)"></i>' : '') + (hasDerivs ? '<i style="width:' + derivPct.toFixed(1) + '%;background:var(--ai)"></i>' : '') + '</div>'
      : '')
    + '<div class="position-chart m-hero-chart">' + svgLine(pts, { id: 'nw', h: 112, axis: false }) + '</div>'
    + rangeBtns()
    + '</section>'
    + changeGridHTML('section', 'aria-label="Cambios reales"')
    + (hasInv
      ? '<section class="panel m-flat-panel">'
        + '<button type="button" class="m-flat-row" data-go="cuentas"><span><b>En bancos (líquido)</b><small>' + nf(nw.total ? cash / nw.total * 100 : 0, 1) + '\u00A0% del patrimonio</small></span><strong>' + money(cash, { d: 0 }) + '</strong></button>'
        + '<button type="button" class="m-flat-row" data-go="inversiones"><span><b>Cartera Spot</b><small>' + nf(nw.total ? inv.value / nw.total * 100 : 0, 1) + '\u00A0% · ' + money(inv.day, { sign: true, d: 0 }) + ' hoy</small></span><strong>' + money(inv.value, { d: 0 }) + '</strong></button>'
        + (ds.count ? '<button type="button" class="m-flat-row" data-go="inversiones" data-inv-deriv="1"><span><b>' + (ds.count === 1 ? '1 derivado abierto' : ds.count + ' derivados abiertos') + '</b><small>Margen ' + money(ds.totalMarginEUR, { d: 0 }) + ' · PyG <em class="m-em ' + cls(ds.totalPnlEUR) + '">' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</em>' + (ds.minLiqDist != null ? ' · liq.\u00A0' + nf(ds.minLiqDist, 1) + '\u00A0%' : '') + '</small></span><strong>' + money(derivVal, { d: 0 }) + '</strong></button>' : '')
        + '</section>'
      : '')
    + '<section class="m-section"><div class="section-title"><h2>Tus cuentas</h2><button type="button" data-go="cuentas">Ver todas</button></div>'
    + '<div class="m-carousel">' + accs.slice(0, 8).map(a => accCard(a, nw.rows)).join('') + '</div></section>'
    + '<section class="panel"><div class="section-title"><h2>Flujo de ' + monthCap + '</h2><button type="button" data-go="movimientos">Ver todo</button></div>'
    + '<div class="flow-number"><span><small>Ingresos</small><b class="up">' + money(mt.inc, { d: 0 }) + '</b></span><span><small>Gastos</small><b>' + money(mt.exp, { d: 0 }) + '</b></span><span><small>Balance</small><b class="' + cls(mt.save) + '">' + money(mt.save, { sign: true, d: 0 }) + '</b></span></div>'
    + '<div class="bar mt-10" title="Gastos sobre ingresos (' + expRatio + '%)"><i style="width:' + Math.max(mt.exp > 0 ? 4 : 0, expRatio) + '%;background:' + (mt.inc > 0 && mt.exp > mt.inc ? 'var(--down)' : 'var(--ink2)') + '"></i></div>'
    + '<div class="change-grid mt-10"><div class="change-cell"><small>Margen/día</small><b>' + money(s.per, { d: 0 }) + '/día</b><span>ritmo mes</span></div><div class="change-cell"><small>Colchón</small><b>' + (cush == null ? '—' : nf(cush, 1) + '\u00A0m') + '</b><span>media ' + money(avgExp, { d: 0 }) + '</span></div>' + thirdFlowCell + '</div>'
    + (up.length ? '<div class="label">Próximos cargos</div>' + up.map(x => '<div class="upcoming-line"><time>' + fmtDate(x.next) + '</time><span><b>' + esc(fmtMerchant(x.name)) + '</b><small>' + esc(fmtFreq(x.every)) + '</small></span><strong>' + money(-x.amount, { d: 0 }) + '</strong></div>').join('') : '')
    + '</section>'
    + (hasInv
      ? (assets.length ? '<section class="panel"><div class="section-title"><h2>Activos en vivo</h2><button type="button" data-go="inversiones">Mercados</button></div>' + assets.slice(0, 5).map(x => '<button type="button" class="asset-line" data-asset="' + esc(x.asset) + '"><span class="cat-dot" style="background:' + assetColor(x.asset) + '"></span><span class="asset-main"><b>' + esc(state.assets[x.asset]?.name || x.asset) + '</b><small>' + nf(x.qty, x.qty < 1 ? 6 : 2, 0) + ' ' + esc(x.asset) + '</small></span><strong>' + money(x.eur, { d: 0 }) + '<small data-live-chg="' + esc(x.asset) + '" class="' + cls(state.prices[x.asset]?.chg) + '">' + (state.prices[x.asset]?.chg != null ? pct(state.prices[x.asset].chg) : '') + '</small></strong></button>').join('') + '</section>' : '')
      : '<section class="panel"><div class="section-title"><h2>Gastos de ' + monthWord + '</h2><button type="button" data-go="movimientos">Detalle</button></div>' + (cats.length ? cats.slice(0, 4).map(([k, v]) => catRow(k, v, maxCat, mt.exp, 'data-go="movimientos" data-gof=\'' + esc(JSON.stringify({ cat: k, m, type: 'out' })) + '\'')).join('') : compactEmpty('Sin gastos este mes', 'Importa un extracto para ver categorías.')) + '<div class="panel-foot">' + svgCompare(m) + '</div></section>')
    + (al.length ? '<section class="panel"><div class="section-title"><h2>Avisos (' + al.length + ')</h2></div>' + al.map(a => '<div class="decision-line"><b>' + esc(a.txt) + '</b><button type="button" data-dismiss="' + esc(a.id) + '" aria-label="Descartar">×</button></div>').join('') + '</section>' : '')
    + '<section class="panel"><div class="section-title"><h2>Movimientos recientes</h2><button type="button" data-go="movimientos">Ver todos</button></div>' + (last.map(txItem).join('') || compactEmpty('Sin movimientos', 'Importa tu extracto.')) + '</section>'
    + (state.settings.gestureHint ? '<div class="gesture-hint"><span><b>Gestos con el pulgar:</b> desliza a los lados para cambiar de pestaña o abrir el menú.</span><button type="button" data-set="gestureHint" data-val="false">Entendido</button></div>' : '')
    + '</div>';
}

function vInvMobile() {
  const ctx = buildPortfolioContext(), { list, total, day, pm, dn, gain, coverage, ders, ds, ops } = ctx;
  const wl = watchlistSymbols(list), trends = state.market._trends?.rows || [];
  const tabs = '<div class="market-tabs" role="tablist">'
    + [['resumen', 'En directo'], ['activos', 'Cartera (' + list.length + ')'], ['derivs', 'Derivados (' + ders.length + ')']].map(([k, n]) => '<button type="button" data-invview="' + k + '" aria-pressed="' + (invView === k) + '">' + n + '</button>').join('')
    + '</div>';
  const refreshBtn = btn(ico('sync'), state.settings.worker ? 'data-act="refresh" aria-label="Actualizar"' : 'data-act="prices" aria-label="Actualizar precios"', 'ghost iconbtn');
  const primaryAct = invView === 'derivs'
    ? btn(ico('plus') + 'Derivado', 'data-act="add-deriv"', 'primary small')
    : btn(ico('plus') + 'Operación', 'data-act="add-op"', 'primary small');
  const acts = refreshBtn + primaryAct;

  let body = '';
  if (invView === 'derivs') {
    const stressLiqHits = ders.filter(d => {
      if (!d.liq || !d.mark) return false;
      const newMark = d.mark * (1 + marketShock / 100);
      return d.side === 'long' ? newMark <= d.liq : newMark >= d.liq;
    });
    const riskSpot = sum(list.filter(x => !FIAT.includes(x.asset) && assetCls(x.asset) !== 'stable').map(x => x.eur));
    const spotShock = riskSpot * marketShock / 100;
    const derivShock = sum(ders.map(d => d.notionalEUR * (d.side === 'short' ? -1 : 1) * marketShock / 100));
    const stressImpact = spotShock + derivShock;
    body = '<div class="kpi-strip">'
      + '<div class="kpi-card"><small>PyG abierto</small><b class="' + cls(ds.totalPnlEUR) + '">' + money(ds.totalPnlEUR, { sign: true, d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Margen usado</small><b>' + money(ds.totalMarginEUR, { d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Exposición neta</small><b class="' + cls(ds.netExposureEUR) + '">' + money(ds.netExposureEUR, { sign: true, d: 0 }) + '</b></div>'
      + '<div class="kpi-card"><small>Menor dist. liq.</small><b class="' + (ds.minLiqDist != null && ds.minLiqDist < 12 ? 'down' : '') + '">' + (ds.minLiqDist != null ? nf(ds.minLiqDist, 1) + '\u00A0%' : '—') + '</b></div></div>'
      + '<section class="panel"><div class="module-title"><b>Posiciones abiertas (' + ders.length + ')</b></div>'
      + (ders.length ? '<div class="deriv-grid">' + ders.map(derivCardHTML).join('') + '</div>' : compactEmpty('Sin derivados abiertos', 'Conecta KuCoin/Kraken Futures o pulsa + Derivado arriba.')) + '</section>'
      + '<section class="panel"><div class="module-title"><b>Simulador de escenario</b></div><div class="seg seg-full">' + [-20, -10, 10, 20].map(n => '<button type="button" class="' + (marketShock === n ? 'on' : '') + '" data-scenario="' + n + '" aria-pressed="' + (marketShock === n) + '">' + (n > 0 ? '+' : '−') + Math.abs(n) + '%</button>').join('') + '</div><div class="stat mt-10"><small>Spot (' + money(spotShock, { sign: true, d: 0 }) + ') + Derivados (' + money(derivShock, { sign: true, d: 0 }) + ')</small><b class="' + cls(stressImpact) + '">' + money(stressImpact, { sign: true, d: 0 }) + '</b></div>'
      + (stressLiqHits.length ? '<div class="callout err mt-12"><b>Riesgo de liquidación (' + stressLiqHits.length + '):</b> ' + stressLiqHits.map(x => esc(x.instr)).join(', ') + '</div>' : '<p class="note">Ningún derivado alcanza su precio de liquidación en este escenario.</p>')
      + '</section>';
  } else if (invView === 'activos') {
    body = '<section class="panel"><div class="position-eyebrow">Cartera Spot</div><div class="position-value">' + moneyBig(total) + '</div><div class="position-status"><b class="' + cls(day) + '">' + money(day, { sign: true, d: 0 }) + '</b><span>hoy</span>' + (coverage >= 80 ? '<b class="' + cls(gain) + '">' + money(gain, { sign: true, d: 0 }) + '</b><span>FIFO</span>' : '') + '</div></section>'
      + '<section class="panel"><div class="module-title"><b>Posiciones (' + list.length + ')</b></div>' + (list.length ? list.map(holdingRow).join('') : compactEmpty('Cartera vacía', 'Importa CSV o conecta un exchange.', btn('Importar', 'data-act="import"', 'small'))) + '</section>'
      + (dn.length ? '<section class="panel"><div class="module-title"><b>Exposición</b></div><div class="donutwrap">' + donut(dn, { id: 'inv', label: 'cartera', total: pm.total }) + '<div>' + dn.map(([k, v, col, n]) => '<div class="exposure-row"><i style="background:' + col + '"></i><span>' + esc(n) + '</span><b>' + nf(pm.total ? v / pm.total * 100 : 0, 1) + ' %</b></div>').join('') + '</div></div></section>' : '')
      + '<section class="panel"><div class="module-title"><b>Últimas operaciones</b></div>' + opsTable(ops.slice(0, 40)) + '</section>';
  } else {
    body = '<div class="months wl-strip">' + wl.map(s => '<button type="button" data-select-sym="' + esc(s) + '" aria-pressed="' + (selectedSymbol === s) + '">' + esc(s) + (state.prices[s]?.chg != null ? ' <span class="' + cls(state.prices[s].chg) + '">' + pct(state.prices[s].chg, 1) + '</span>' : '') + '</button>').join('') + '<button type="button" data-act="add-watch">+ Ticker</button></div>'
      + marketChartDeck(selectedSymbol)
      + '<section class="panel"><div class="module-title"><b>Radar 24 h</b>' + btn(trends.length ? 'Actualizar' : 'Cargar', 'data-act="market-radar"', 'ghost small') + '</div>'
      + (trends.length ? trends.slice(0, 6).map(x => '<button type="button" class="account-line" data-select-sym="' + esc(x.symbol) + '"><span class="account-mark"><i class="cat-dot"></i></span><span><b>' + esc(x.symbol) + '</b><small>' + nf(x.price, x.price < 1 ? 5 : 2) + ' $</small></span><strong class="' + cls(x.change) + '">' + pct(x.change) + '</strong></button>').join('') : compactEmpty('Radar sin cargar', 'Pulsa Cargar para ver activos más movidos en 24 h.')) + '</section>';
  }

  return head('Mercados', 'Precios en directo, velas y derivados.', acts) + tabs + '<div class="market-mobile">' + body + '</div>';
}

function vMovsMobile() {
  if (!state.tx.length) {
    return head('Movimientos', 'Ingresos y gastos')
      + '<div class="panel"><div class="empty"><b>Aún no hay movimientos</b>Importa tu extracto de Santander o conecta Open Banking.<div class="row mt-12 center">' + btn(ico('upload') + 'Importar', 'data-act="import"', 'primary') + '</div></div></div>';
  }
  const months = [...new Set(state.tx.map(t => monthKey(t.date)))].sort().reverse();
  if ((filt.m && !months.includes(filt.m)) || (!filt.m && !filt.all)) filt.m = months[0];
  const rows = filtered(), base = state.tx.filter(t => (!filt.m || monthKey(t.date) === filt.m) && !isInternal(t));
  const inc = sum(base.filter(t => t.amount > 0 && catById(t.cat).kind === 'income').map(t => t.amount)), exp = -sum(base.filter(t => t.amount < 0).map(t => t.amount));
  const intMoved = sum(state.tx.filter(t => (!filt.m || monthKey(t.date) === filt.m) && isInternal(t) && t.amount < 0).map(t => -t.amount));
  const heroLbl = filt.type === 'in' ? 'Ingresado' : filt.type === 'int' ? 'Traspasos internos' : 'Gastado';
  const heroVal = filt.type === 'in' ? inc : filt.type === 'int' ? intMoved : exp;
  const byCat = {}; for (const t of base) if (t.amount < 0) byCat[t.cat] = (byCat[t.cat] || 0) - t.amount;
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]), maxCat = cats[0]?.[1] || 1;
  const byDay = {}; for (const t of rows.slice(0, 250)) (byDay[t.date] = byDay[t.date] || []).push(t);
  const prevExp = filt.m ? monthTotals(monthAdd(filt.m, -1)).exp : 0;
  const otrosCount = state.tx.filter(t => t.cat === 'otros').length;
  const bankAccs = state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash');
  const activeBadges = (filt.cat ? '<button type="button" class="chip" aria-pressed="true" data-fcat="">' + esc(catById(filt.cat).name) + ' ×</button>' : '')
    + (filt.day ? '<button type="button" class="chip" aria-pressed="true" data-day="' + filt.day + '">Día ' + (+filt.day.slice(8)) + ' ×</button>' : '');

  return head('Movimientos', filt.m ? monthLong(filt.m) : 'Historial',
    (otrosCount ? btn(ico('brain') + 'IA (' + otrosCount + ')', 'data-act="ai-cat"', 'ghost small') : '')
    + btn(ico('upload') + 'Importar', 'data-act="import"', 'small'))
    + '<div class="months mb-10">' + months.map(m => '<button type="button" data-month="' + m + '" aria-pressed="' + (filt.m === m) + '">' + MONTHS[+m.slice(5) - 1] + '</button>').join('') + '<button type="button" data-month="" aria-pressed="' + (!filt.m) + '">Todo</button></div>'
    + '<div class="grid">'
    + '<section class="panel"><div class="mov-hero-head mb-10"><div><small class="muted">' + heroLbl + '</small><div class="big mt-4">' + moneyBig(heroVal) + '</div>' + (filt.m && prevExp && filt.type !== 'in' && filt.type !== 'int' ? '<div class="position-status mt-4"><span class="pill ' + (exp <= prevExp ? 'up' : 'down') + '">' + (exp <= prevExp ? '▼ ' : '▲ ') + nf(Math.abs((exp - prevExp) / prevExp * 100), 0, 0) + '\u00A0%</span><span>vs.\u00A0' + MONTHS[+monthAdd(filt.m, -1).slice(5) - 1] + ' (' + money(prevExp, { d: 0 }) + ')</span></div>' : '') + '</div>'
    + (filt.m ? '<div class="seg"><button type="button" data-movview="list" aria-pressed="' + (movView === 'list') + '">Barras</button><button type="button" data-movview="cal" aria-pressed="' + (movView === 'cal') + '">Cal.</button></div>' : '') + '</div>'
    + '<div class="flow-number mb-12"><span><small>Ingresos</small><b class="up">' + money(inc, { d: 0 }) + '</b></span><span><small>Gastado</small><b>' + money(exp, { d: 0 }) + '</b></span><span><small>Balance</small><b class="' + cls(inc - exp) + '">' + money(inc - exp, { sign: true, d: 0 }) + '</b></span></div>'
    + (filt.m ? (movView === 'cal' ? spendCalendarHTML(filt.m) : svgDays(filt.m)) : svgMonths(months.slice(0, 8).reverse())) + '</section>'
    + (cats.length ? '<section class="panel"><div class="module-title"><b>Categorías</b>' + (filt.cat ? '<button type="button" class="link-btn" data-fcat="">Todas</button>' : '') + '</div>' + cats.slice(0, 5).map(([k, v]) => catRow(k, v, maxCat, exp, 'data-fcat="' + (filt.cat === k ? '' : k) + '"' + (filt.cat && filt.cat !== k ? ' style="opacity:.42"' : ''))).join('') + '</section>' : '')
    + '<section class="panel"><div class="search mb-10">' + ico('search') + '<input type="search" id="f-q" value="' + esc(filt.q) + '" placeholder="Buscar comercio o concepto…"></div>'
    + (bankAccs.length > 1 ? '<select id="f-acc" aria-label="Filtrar por cuenta" class="mb-10"><option value="">Todas las cuentas</option>' + bankAccs.map(a => '<option value="' + a.id + '"' + (filt.acc === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select>' : '')
    + '<div class="seg seg-full mb-10">' + [['out', 'Gastos'], ['in', 'Ingresos'], ['', 'Todo'], ['int', 'Internos']].map(([k, n]) => '<button type="button" data-ftype="' + k + '" aria-pressed="' + (filt.type === k) + '">' + n + '</button>').join('') + '</div>'
    + (activeBadges ? '<div class="row mb-10">' + activeBadges + '</div>' : '')
    + (rows.length ? Object.entries(byDay).map(([d, ts]) => '<div class="day"><span>' + fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' }) + '</span><span class="num">' + money(sum(ts.map(t => t.amount)), { sign: true }) + '</span></div>' + ts.map(txItem).join('')).join('') + (rows.length > 250 ? '<p class="note trunc-note">Mostrando 250 de ' + rows.length + ' movimientos. Filtra para acotar.</p>' : '') : '<div class="empty">Nada con estos filtros.' + btn('Limpiar', 'data-act="clear-filt"', 'small') + '</div>')
    + '</section></div>';
}

function vCuentasMobile() {
  if (activeAccId) return vAccountDetail(activeAccId);
  const nw = netWorth();
  if (!state.accounts.length) {
    return head('Cuentas', 'Conecta bancos, exchanges y wallets', btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary small'))
      + '<div class="panel"><div class="empty"><b>Sin cuentas</b>Pulsa Conectar para empezar.</div></div>';
  }
  return head('Cuentas', money(nw.total, { d: 0 }) + ' en ' + state.accounts.length + ' cuentas', btn(ico('plus') + 'Manual', 'data-act="add-acc"', 'small') + btn(ico('link') + 'Conectar', 'data-act="connect-hub"', 'primary small'))
    + '<div class="acc-mobile-list">' + state.accounts.slice().sort((a, b) => accValue(b, nw.rows) - accValue(a, nw.rows)).map(a => accCard(a, nw.rows)).join('') + '</div>';
}

function vCopilotMobile() {
  const th = getActiveChat();
  return head('Copiloto', '', btn('Resumen hoy', 'data-act="ai-run" data-id="brief"', 'ghost small') + btn(ico('plus') + 'Nuevo', 'data-act="ai-new-chat"', 'primary small'))
    + '<div class="ai-studio"><section class="ai-chat-main">'
    + '<div class="ai-messages">' + (th.msgs.length ? th.msgs.map(m => '<div class="ai-msg ' + (m.role === 'user' ? 'user' : 'assistant') + '">' + (m.role === 'user' ? esc(m.text) : renderMarkdown(m.text)) + '</div>').join('') : '<div class="empty ai-empty"><b>Hola, soy tu Copiloto</b><p class="note">Pregúntame qué posiciones tienes abiertas, cómo están tus márgenes o revisa tus gastos.</p></div>') + (aiChatBusy ? '<div class="ai-msg assistant">Pensando…</div>' : '') + '</div>'
    + (!th.msgs.length ? '<div class="ai-suggestions">'
      + '<button type="button" class="chip" data-chat-ask="¿Qué posiciones abiertas tengo y cómo están mis márgenes?">Posiciones y márgenes</button>'
      + '<button type="button" class="chip" data-chat-ask="Resumen de mi mes y cuánto puedo gastar hoy">Gastos del mes</button>'
      + '<button type="button" class="chip" data-chat-ask="¿Qué riesgos principales ves en mi cartera?">Riesgos</button>'
      + '</div>' : '')
    + '<form class="ai-composer" data-chat-form><input type="text" placeholder="Pregunta a Gemini…" aria-label="Pregunta"><button class="btn primary small" type="submit">' + ico('send') + '</button></form>'
    + '</section></div>';
}
