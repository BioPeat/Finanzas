// ===== Estado de interfaz y gráficos interactivos SVG (propios, sin librerías) =====
"use strict";

let filt = { q: '', m: '', cat: '', acc: '', type: 'out', day: '' };
let range = '1M', invView = 'resumen', invTab = 'spot', marketShock = -10, lastView = '';
let selectedSymbol = 'BTC', chartMode = 'candles', chartInterval = '1d', movView = 'list';
let activeAccId = '', activeChatId = '', taxBusy = false, taxExtra = 0, m721 = null;

const CHARTS = {};
const narrow = () => innerWidth < 1024;
const RANGES = [['1S', 7], ['1M', 30], ['6M', 180], ['1A', 365], ['Máx', 3650]];
const rangeDays = () => (RANGES.find(r => r[0] === range) || RANGES[2])[1];
const RANGE_TXT = { '1S': 'esta semana', '1M': 'en 30 días', '6M': 'en 6 meses', '1A': 'en un año', 'Máx': 'desde el principio' };
function rangeBtns() { return '<div class="ranges" role="group" aria-label="Periodo">' + RANGES.map(([r]) => '<button type="button" data-range="' + r + '" aria-pressed="' + (range === r) + '">' + r + '</button>').join('') + '</div>'; }

function fmtChartMoney(eur, d = 0, sign = false) {
  const cur = state.settings.show;
  let txt;
  if (cur === 'USD') txt = nf(eur * fx('USD'), d) + ' $';
  else if (cur === 'BTC') { const p = priceEUR('BTC'); txt = nf(p ? eur / p : 0, 4, 3) + ' BTC'; }
  else txt = nf(eur, d) + ' €';
  return (sign && eur > 0 ? '+' : '') + txt;
}

function svgLine(pts, { h, w, id = 'nw', col, axis = true } = {}) {
  w = w || (narrow() ? 360 : 720); h = h || (narrow() ? 130 : 185);
  if (!pts || pts.length < 2) return '<div class="empty-compact"><b>Histórico en construcción</b><span>La evolución diaria aparecerá conforme se acumulen jornadas o velas de mercado.</span></div>';
  const ys = pts.map(p => p[1]), min = Math.min(...ys), max = Math.max(...ys);
  const spanY = max - min, ref = Math.max(Math.abs(max), Math.abs(min), 1), pad = Math.max(spanY * 0.22, ref * 0.03, 15), lo = min - pad, hi = max + pad;
  const ts = pts.map(p => Date.parse(String(p[0]).slice(0, 10) + 'T12:00:00')), t0 = ts[0], t1 = ts.at(-1), span = t1 - t0;
  const X = i => span > 0 ? ((ts[i] - t0) / span) * w : (i / (pts.length - 1) * w), Yv = v => h - (v - lo) / (hi - lo) * h;
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Yv(p[1]).toFixed(1)).join(' ');
  col = col || (Math.abs(pts.at(-1)[1] - pts[0][1]) / ref < 0.005 ? 'var(--ink2)' : pts.at(-1)[1] >= pts[0][1] ? 'var(--up)' : 'var(--down)');
  CHARTS[id] = { type: 'line', pts, ts, t0, span, X, Yv, w, h };
  const grid = '<line x1="0" x2="' + w + '" y1="' + (h * 0.5).toFixed(1) + '" y2="' + (h * 0.5).toFixed(1) + '" stroke="var(--line)" stroke-dasharray="3 4" opacity="0.65"/>';
  const midDate = span > 0 ? localDate(new Date((t0 + t1) / 2)) : pts[Math.floor(pts.length / 2)][0];
  const scaleTicks = '<span class="chart-tick top money num">' + fmtChartMoney(hi, 0) + '</span><span class="chart-tick bot money num">' + fmtChartMoney(lo, 0) + '</span>';
  return '<div class="ichart" data-chart="' + id + '"><svg viewBox="0 0 ' + w + ' ' + (h + 4) + '" preserveAspectRatio="none" role="img" aria-label="Evolución" style="height:' + h + 'px">'
    + '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".14"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>'
    + grid
    + '<path d="' + d + ' L' + w + ' ' + (h + 4) + ' L0 ' + (h + 4) + 'Z" fill="url(#g' + id + ')"/>'
    + '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'
    + '<line class="cur" x1="0" x2="0" y1="0" y2="' + h + '" stroke="var(--ink3)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" visibility="hidden"/>'
    + '</svg>' + scaleTicks + '<span class="cdot" style="position:absolute;width:9px;height:9px;border-radius:50%;background:' + col + ';border:2px solid var(--panel);transform:translate(-50%,-50%);left:100%;top:' + (Yv(pts.at(-1)[1]) / (h + 4) * 100).toFixed(2) + '%;pointer-events:none"></span><div class="tip" hidden></div></div>'
    + (axis ? '<div class="axis"><span>' + fmtDate(pts[0][0], { day: 'numeric', month: 'short' }) + '</span><span>' + fmtDate(midDate, { day: 'numeric', month: 'short' }) + '</span><span>' + fmtDate(pts.at(-1)[0], { day: 'numeric', month: 'short' }) + '</span></div>' : '');
}

function svgCandles(candles, { h, w, id = 'ohlcv', sym = 'BTC', showSma = true } = {}) {
  w = w || (narrow() ? 360 : 760); h = h || (narrow() ? 210 : 310);
  if (!candles || candles.length < 5) return '<div class="empty"><b>Sin velas para ' + esc(sym) + '</b><p class="note">Pulsa actualizar o revisa su ticker en Ajustar activo.</p></div>';
  const div = (state.settings.show === 'EUR' && isCryptoish(sym)) ? (fx('USD') || 1.08) : 1;
  const unit = state.settings.show === 'EUR' ? '€' : '$';
  const allScaled = div === 1 ? candles : candles.map(c => [c[0], c[1] / div, c[2] / div, c[3] / div, c[4] / div, c[5]]);
  const visN = allScaled.length > 75 ? 65 : allScaled.length, off = allScaled.length - visN;
  const scaled = allScaled.slice(off);
  const n = scaled.length, axisW = narrow() ? 58 : 74, plotW = w - axisW, priceH = h * 0.78, volTop = h * 0.82, volH = h * 0.18;
  const highs = scaled.map(c => c[2]), lows = scaled.map(c => c[3]), vols = scaled.map(c => c[5] || 0);
  const liveNow = (state.settings.show === 'EUR' ? priceEUR(sym) : (state.prices[sym]?.usd || priceEUR(sym) * (fx('USD') || 1.08))) || 0;
  const allHi = liveNow ? Math.max(...highs, liveNow) : Math.max(...highs), allLo = liveNow ? Math.min(...lows, liveNow) : Math.min(...lows);
  const pad = (allHi - allLo) * 0.14 || allHi * 0.02 || 1;
  const hi = allHi + pad, lo = Math.max(0, allLo - pad), maxV = Math.max(1, ...vols);
  const bw = plotW / n, X = i => (i + 0.5) * bw, Yv = p => priceH - (p - lo) / (hi - lo) * priceH;

  const ly = (liveNow && liveNow >= lo && liveNow <= hi) ? Yv(liveNow) : null;
  const gridLines = [0.12, 0.31, 0.50, 0.69, 0.88].map(f => {
    const y = (priceH * f).toFixed(1), valP = hi - (hi - lo) * f;
    const hideTxt = ly != null && Math.abs(Number(y) - ly) < 14;
    return '<line x1="0" x2="' + plotW + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-dasharray="2 4"/>'
      + (hideTxt ? '' : '<text x="' + (w - 3) + '" y="' + (Number(y) + 3.5) + '" text-anchor="end" style="font-size:10px;fill:var(--ink3)">' + nf(valP, valP < 10 ? 4 : 0) + ' ' + unit + '</text>');
  }).join('');
  const liveLine = ly != null
    ? '<line x1="0" x2="' + plotW + '" y1="' + ly.toFixed(1) + '" y2="' + ly.toFixed(1) + '" stroke="var(--ink3)" stroke-width="1" stroke-dasharray="3 3" opacity="0.75"/>'
      + '<rect x="' + (plotW + 2) + '" y="' + (ly - 8.5).toFixed(1) + '" width="' + (axisW - 3) + '" height="17" rx="4" fill="var(--cta-bg)" stroke="var(--line2)" stroke-width="0.8"/>'
      + '<text x="' + (w - 4) + '" y="' + (ly + 3.5).toFixed(1) + '" text-anchor="end" style="font-size:9.8px;font-weight:700;fill:var(--cta-ink)">' + nf(liveNow, liveNow < 10 ? 4 : 0) + ' ' + unit + '</text>'
    : '';

  const smaPath = period => {
    if (allScaled.length < period) return '';
    const pts = [];
    for (let i = 0; i < n; i++) {
      const gi = off + i;
      if (gi < period - 1) continue;
      let s = 0; for (let j = gi - period + 1; j <= gi; j++) s += allScaled[j][4];
      pts.push((pts.length ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Yv(s / period).toFixed(1));
    }
    return pts.length >= 2 ? pts.join(' ') : '';
  };

  let shapes = '';
  for (let i = 0; i < n; i++) {
    const [, o, hiC, loC, c, v] = scaled[i], up = c >= o, col = up ? 'var(--up)' : 'var(--down)';
    const x = X(i), yH = Yv(hiC), yL = Yv(loC), yO = Yv(o), yC = Yv(c);
    const bodyTop = Math.min(yO, yC), bodyH = Math.max(1.5, Math.abs(yC - yO)), cw = Math.max(2, bw * 0.64);
    shapes += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + yH.toFixed(1) + '" y2="' + yL.toFixed(1) + '" stroke="' + col + '" stroke-width="1.2"/>'
      + '<rect x="' + (x - cw / 2).toFixed(1) + '" y="' + bodyTop.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + bodyH.toFixed(1) + '" rx="1" fill="' + col + '"/>';
    const vh = (v / maxV) * volH;
    shapes += '<rect x="' + (x - cw / 2).toFixed(1) + '" y="' + (volTop + volH - vh).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + Math.max(1, vh).toFixed(1) + '" fill="' + col + '" opacity="0.32"/>';
  }
  const s20 = showSma ? smaPath(20) : '', s50 = showSma ? smaPath(50) : '';
  const s50Lbl = !s50 ? 'SMA 50 (pocos datos)' : off < 49 ? 'SMA 50 (desde vela 50)' : 'SMA 50';
  CHARTS[id] = { type: 'candles', candles: scaled, unit, plotW, X, Yv, bw, w, h, sym };

  const last = scaled.at(-1), mid = scaled[Math.floor(n / 2)], first = scaled[0], dDec = last[4] < 10 ? 4 : 2;
  const fd = ts => fmtDate(new Date(ts).toISOString().slice(0, 10), { day: 'numeric', month: 'short' });
  return '<div class="ohlc-bar" id="ohlc-readout-' + id + '"><span>' + fmtDate(new Date(last[0]).toISOString().slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) + '</span><span>O <b>' + nf(last[1], dDec) + ' ' + unit + '</b></span><span>H <b>' + nf(last[2], dDec) + ' ' + unit + '</b></span><span>L <b>' + nf(last[3], dDec) + ' ' + unit + '</b></span><span>C <b class="' + (last[4] >= last[1] ? 'up' : 'down') + '">' + nf(last[4], dDec) + ' ' + unit + '</b></span></div>'
    + '<div class="ichart" data-chart="' + id + '"><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Velas OHLCV" style="height:' + h + 'px">'
    + gridLines + liveLine + shapes
    + (s20 ? '<path d="' + s20 + '" fill="none" stroke="var(--c1)" stroke-width="1.8" opacity="0.95"/>' : '')
    + (s50 ? '<path d="' + s50 + '" fill="none" stroke="var(--c5)" stroke-width="1.8" opacity="0.95"/>' : '')
    + '<line class="cur" x1="0" x2="0" y1="0" y2="' + h + '" stroke="var(--ink3)" stroke-dasharray="3 3" visibility="hidden"/>'
    + '</svg><div class="tip" hidden></div></div>'
    + '<div class="axis" style="padding-right:' + axisW + 'px"><span>' + fd(first[0]) + '</span><span>' + fd(mid[0]) + '</span><span>' + fd(last[0]) + '</span></div>'
    + '<div class="legend"><span><i style="background:var(--c1)"></i>SMA 20</span><span><i style="background:var(--c5)"></i>' + s50Lbl + '</span><span class="faint">Volumen inferior</span></div>';
}

function svgCompare(m) {
  const pm = monthAdd(m, -1), t = today(), n = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate(), pn = new Date(+pm.slice(0, 4), +pm.slice(5, 7), 0).getDate();
  const cum = (mm, len, until) => { const ds = dailySpend(mm), out = []; let s = 0; for (let d = 1; d <= len; d++) { const k = mm + '-' + String(d).padStart(2, '0'); if (until && k > until) break; s += ds[k] || 0; out.push(s); } return out; };
  const a = cum(m, n, t), b = cum(pm, pn), hasB = b.some(v => v > 0), N = Math.max(n, pn), w = narrow() ? 360 : 420, h = narrow() ? 72 : 78;
  const rawMax = Math.max(1, ...a, ...(hasB ? b : [0])), max = rawMax * 1.1;
  const padT = 6, padB = 5, plotH = h - padT - padB;
  const X = i => i / (N - 1) * w, Y = v => padT + plotH - (v / max) * plotH, P = arr => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
  CHARTS.cmp = { type: 'cmp', a, b, X, w, N, m, pm };
  const baseY = (padT + plotH).toFixed(1), midY = (padT + plotH * 0.5).toFixed(1);
  const cmpMeta = (hasB && b.at(-1) > 0) ? pct(((a.at(-1) || 0) - b.at(-1)) / b.at(-1) * 100, 0) + ' vs. ' + MONTHS[+pm.slice(5) - 1] : 'Día 1–' + Math.max(1, a.length);
  return '<div class="cmp-wrap">'
    + '<div class="cmp-head"><span>Acumulado diario (' + MONTHS[+m.slice(5) - 1] + (hasB ? ' vs. ' + MONTHS[+pm.slice(5) - 1] : '') + ')</span><span class="faint num">' + cmpMeta + '</span></div>'
    + '<div class="ichart" data-chart="cmp"><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="height:' + h + 'px" role="img" aria-label="Gasto acumulado">'
    + '<defs><linearGradient id="gcmp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--ink)" stop-opacity=".08"/><stop offset="1" stop-color="var(--ink)" stop-opacity="0"/></linearGradient></defs>'
    + '<line x1="0" x2="' + w + '" y1="' + midY + '" y2="' + midY + '" stroke="var(--line)" stroke-dasharray="2 4"/>'
    + '<line x1="0" x2="' + w + '" y1="' + baseY + '" y2="' + baseY + '" stroke="var(--line)"/>'
    + (hasB ? '<path d="' + P(b) + '" fill="none" stroke="var(--ink3)" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>' : '')
    + (a.length ? '<path d="' + P(a) + ' L' + X(a.length - 1).toFixed(1) + ' ' + baseY + ' L0 ' + baseY + 'Z" fill="url(#gcmp)"/><path d="' + P(a) + '" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' : '')
    + '<line class="cur" x1="0" x2="0" y1="0" y2="' + h + '" stroke="var(--ink3)" stroke-dasharray="3 3" vector-effect="non-scaling-stroke" visibility="hidden"/>'
    + '</svg><div class="tip" hidden></div></div>'
    + '<div class="axis"><span>Día 1</span><span>Día ' + Math.round(N / 2) + '</span><span>Día ' + N + '</span></div></div>';
}

function svgDays(m) {
  const ds = dailySpend(m), n = new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate(), w = narrow() ? 360 : 720, h = narrow() ? 88 : 98, vals = Object.values(ds).filter(v => v > 0), max = Math.max(1, ...vals, 0), bw = w / n, t = today();
  const avg = vals.length ? sum(vals) / vals.length : 0;
  const avgY = avg > 0 ? Math.max(4, Math.min(h - 4, h - (avg / max) * h)) : null;
  const data = []; let bars = '';
  for (let d = 1; d <= n; d++) {
    const k = m + '-' + String(d).padStart(2, '0'), v = ds[k] || 0, bh = v ? Math.max(6, v / max * h) : 2, sel = filt.day === k, isPeak = v > 0 && v === max; data.push([k, v]);
    const fill = sel ? 'var(--ink)' : k > t ? 'var(--panel2)' : isPeak ? 'var(--ink2)' : v ? 'var(--line2)' : 'var(--panel2)';
    bars += '<g data-day="' + k + '" data-i="' + (d - 1) + '" style="cursor:pointer"><rect x="' + ((d - 1) * bw) + '" y="0" width="' + bw + '" height="' + h + '" fill="transparent"/><rect x="' + ((d - 1) * bw + bw * 0.2) + '" y="' + (h - bh) + '" width="' + (bw * 0.6) + '" height="' + bh + '" rx="' + Math.min(2, bw * 0.25) + '" fill="' + fill + '"/></g>';
  }
  const avgLine = avgY != null ? '<line x1="0" x2="' + w + '" y1="' + avgY.toFixed(1) + '" y2="' + avgY.toFixed(1) + '" stroke="var(--ink3)" stroke-width="1" stroke-dasharray="3 4" opacity="0.65" pointer-events="none"/>' : '';
  CHARTS.days = { type: 'days', data, w, n };
  return '<div class="days-meta"><span>Gasto por día</span><span class="num">' + (avg > 0 ? 'Media ' + fmtChartMoney(avg, 0) + ' · ' : '') + 'Máx ' + fmtChartMoney(max, 0) + '</span></div>'
    + '<div class="ichart" data-chart="days"><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="height:' + h + 'px" role="img" aria-label="Gasto por día">' + avgLine + bars + '</svg><div class="tip" hidden></div></div><div class="axis"><span>1</span><span>15</span><span>' + n + '</span></div>';
}

function svgMonths(months) {
  const data = months.map(m => ({ m, ...monthTotals(m) })), w = narrow() ? 360 : 680, h = narrow() ? 120 : 150, max = Math.max(1, ...data.map(d => Math.max(d.inc, d.exp))), bw = w / data.length;
  CHARTS.months = { type: 'bars', data, bw, w };
  const bars = data.map((d, i) => { const x = i * bw, hi = d.inc / max * h, he = d.exp / max * h; return '<g data-i="' + i + '" data-month="' + d.m + '" style="cursor:pointer"><rect x="' + x + '" y="0" width="' + bw + '" height="' + h + '" fill="transparent"/><rect x="' + (x + bw * 0.18) + '" y="' + (h - hi) + '" width="' + (bw * 0.3) + '" height="' + Math.max(hi, 1) + '" rx="3" fill="var(--up)"/><rect x="' + (x + bw * 0.52) + '" y="' + (h - he) + '" width="' + (bw * 0.3) + '" height="' + Math.max(he, 1) + '" rx="3" fill="var(--ink2)"/></g>'; }).join('');
  return '<div class="ichart" data-chart="months"><svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="height:' + h + 'px" role="img" aria-label="Ingresos y gastos por mes">' + bars + '</svg><div class="tip" hidden></div></div><div class="axis">' + data.map(d => '<span style="flex:1;text-align:center">' + MONTHS[+d.m.slice(5) - 1] + '</span>').join('') + '</div><div class="legend"><span><i style="background:var(--up)"></i>Ingresos</span><span><i style="background:var(--ink2)"></i>Gastos</span><span class="faint">Toca un mes para abrirlo</span></div>';
}

function spendCalendarHTML(m) {
  const ds = dailySpend(m), y = +m.slice(0, 4), mo = +m.slice(5, 7) - 1;
  const firstDow = (new Date(y, mo, 1).getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const max = Math.max(1, ...Object.values(ds));
  let cells = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => '<div class="cal-head">' + d + '</div>').join('');
  for (let i = 0; i < firstDow; i++) cells += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const k = m + '-' + String(d).padStart(2, '0'), v = ds[k] || 0, ratio = v / max;
    const lvl = !v ? '' : ratio > 0.65 ? 'lvl3' : ratio > 0.28 ? 'lvl2' : 'lvl1';
    cells += '<button type="button" class="cal-day ' + lvl + (filt.day === k ? ' sel' : '') + '" data-day="' + k + '"><span>' + d + '</span>' + (v ? '<small class="money">' + nf(v, 0) + '€</small>' : '') + '</button>';
  }
  return '<div class="cal-grid">' + cells + '</div><div class="cal-legend"><span>Menor gasto</span><i class="cal-sw"></i><i class="cal-sw lvl1"></i><i class="cal-sw lvl2"></i><i class="cal-sw lvl3"></i><span>Mayor gasto</span></div><p class="note">Toca cualquier día para filtrar sus movimientos debajo.</p>';
}

function donut(entries, { id = 'cats', label = 'Gastado', total } = {}) {
  const T = total ?? sum(entries.map(e => e[1])), r = 64, c = 2 * Math.PI * r; let off = 0;
  CHARTS[id] = { type: 'donut', entries, total: T, label };
  const segs = entries.map(([k, v, col], i) => { const len = T ? v / T * c : 0, s = '<circle data-seg="' + i + '" cx="82" cy="82" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="12" stroke-linecap="butt" stroke-dasharray="' + Math.max(0, len - 3) + ' ' + c + '" stroke-dashoffset="' + (-off) + '"></circle>'; off += len; return s; }).join('');
  return '<div class="donut" data-chart="' + id + '"><svg viewBox="0 0 164 164"><circle cx="82" cy="82" r="' + r + '" fill="none" stroke="var(--panel2)" stroke-width="12"/>' + segs + '</svg><div class="center"><b class="money num">' + fmtChartMoney(T, 0) + '</b><small>' + esc(label) + '</small></div></div>';
}

function allocBar(parts) {
  const e = Object.entries(parts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  return '<div class="legend">' + e.map(([k, v]) => '<span><i style="background:var(' + CLASS_COLOR[k] + ')"></i>' + CLASS_NAMES[k] + ' <b>' + money(v, { d: 0 }) + '</b></span>').join('') + '</div>';
}

function bindCharts(root = document) {
  for (const el of root.querySelectorAll('.ichart:not([data-b])')) {
    el.dataset.b = '1'; const C = CHARTS[el.dataset.chart], tip = el.querySelector('.tip'), svg = el.querySelector('svg'); if (!C) continue;
    const at = ev => { const rc = svg.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - rc.left) / rc.width)); };
    const cur = cx => { const c = svg.querySelector('.cur'); if (c) { c.setAttribute('x1', cx); c.setAttribute('x2', cx); c.setAttribute('visibility', 'visible'); } };
    const place = f => { tip.style.left = Math.max(14, Math.min(86, f * 100)) + '%'; tip.hidden = false; };
    const show = ev => {
      const x = at(ev);
      if (C.type === 'line') {
        let i = Math.round(x * (C.pts.length - 1));
        if (C.span > 0) { const targetT = C.t0 + x * C.span; let bestD = Infinity; C.ts.forEach((t, idx) => { const d = Math.abs(t - targetT); if (d < bestD) { bestD = d; i = idx; } }); }
        const p = C.pts[i]; cur(C.X(i));
        const dot = el.querySelector('.cdot'); if (dot) { dot.style.left = (C.X(i) / C.w * 100) + '%'; dot.style.top = (C.Yv(p[1]) / (C.h + 4) * 100) + '%'; }
        const d0 = p[1] - C.pts[0][1];
        tip.innerHTML = '<span class="money">' + fmtChartMoney(p[1], 0) + '</span><small>' + fmtDate(p[0], { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + fmtChartMoney(d0, 0, true) + '</small>';
        place(C.X(i) / C.w);
      } else if (C.type === 'candles') {
        const px = Math.min(1, x * (C.w / (C.plotW || C.w)));
        const i = Math.min(C.candles.length - 1, Math.max(0, Math.floor(px * C.candles.length))), k = C.candles[i];
        cur(C.X(i));
        const dt = new Date(k[0]).toISOString().slice(0, 16).replace('T', ' '), ch = k[1] ? ((k[4] / k[1] - 1) * 100) : 0, u = C.unit || '€';
        const ro = $('ohlc-readout-' + el.dataset.chart);
        if (ro) ro.innerHTML = '<span>' + dt + '</span><span>O <b>' + nf(k[1], k[1] < 10 ? 4 : 2) + ' ' + u + '</b></span><span>H <b>' + nf(k[2], k[2] < 10 ? 4 : 2) + '</b></span><span>L <b>' + nf(k[3], k[3] < 10 ? 4 : 2) + '</b></span><span>C <b class="' + (k[4] >= k[1] ? 'up' : 'down') + '">' + nf(k[4], k[4] < 10 ? 4 : 2) + ' ' + u + ' (' + pct(ch) + ')</b></span>';
        tip.innerHTML = '<b>' + nf(k[4], k[4] < 10 ? 4 : 2) + ' ' + u + '</b><small>' + dt + ' · ' + pct(ch) + '</small>';
        place(C.X(i) / C.w);
      } else if (C.type === 'cmp') {
        const i = Math.round(x * (C.N - 1)), a = C.a[i], b = C.b[i]; cur(C.X(i));
        tip.innerHTML = '<span class="money">Día ' + (i + 1) + ': ' + (a != null ? fmtChartMoney(a, 0) : '—') + '</span><small>Mes pasado: ' + (b != null ? fmtChartMoney(b, 0) : '—') + '</small>';
        place(C.X(i) / C.w);
      } else if (C.type === 'days') {
        const i = Math.min(C.n - 1, Math.floor(x * C.n)), d = C.data[i];
        tip.innerHTML = '<span class="money">' + fmtChartMoney(d[1], 2) + '</span><small>' + fmtDate(d[0], { weekday: 'short', day: 'numeric', month: 'short' }) + '</small>';
        place((i + 0.5) / C.n);
      } else {
        const i = Math.min(C.data.length - 1, Math.floor(x * C.data.length)), d = C.data[i];
        tip.innerHTML = '<span class="money">' + fmtChartMoney(d.inc, 0, true) + ' · −' + fmtChartMoney(d.exp, 0) + '</span><small>' + monthLong(d.m) + ' · ' + (d.inc - d.exp >= 0 ? 'ahorro ' : '') + fmtChartMoney(d.inc - d.exp, 0) + '</small>';
        place((i + 0.5) / C.data.length);
        svg.querySelectorAll('g[data-i]').forEach(g => g.style.opacity = +g.dataset.i === i ? 1 : 0.45);
      }
    };
    const hide = () => {
      tip.hidden = true; svg.querySelectorAll('g[data-i]').forEach(g => g.style.opacity = 1);
      const c = svg.querySelector('.cur'); if (c) c.setAttribute('visibility', 'hidden');
      if (C.type === 'line') { const dot = el.querySelector('.cdot'); if (dot) { dot.style.left = '100%'; dot.style.top = (C.Yv(C.pts.at(-1)[1]) / (C.h + 4) * 100) + '%'; } }
    };
    el.addEventListener('pointermove', show); el.addEventListener('pointerdown', show); el.addEventListener('pointerleave', hide); el.addEventListener('pointercancel', hide);
  }
  for (const el of root.querySelectorAll('.donut:not([data-b])')) {
    el.dataset.b = '1'; const C = CHARTS[el.dataset.chart]; if (!C) continue;
    const b = el.querySelector('.center b'), s = el.querySelector('.center small');
    const pick = i => {
      el.classList.toggle('focus', i != null); el.querySelectorAll('circle[data-seg]').forEach(c => c.classList.toggle('on', +c.dataset.seg === i));
      if (i == null) { b.textContent = fmtChartMoney(C.total, 0); s.textContent = C.label; return; }
      const e = C.entries[i]; b.textContent = fmtChartMoney(e[1], 0); s.textContent = e[3] + ' · ' + nf(C.total ? e[1] / C.total * 100 : 0, 0, 0) + ' %';
    };
    el.querySelectorAll('circle[data-seg]').forEach(c => { c.style.cursor = 'pointer'; c.addEventListener('pointerenter', () => pick(+c.dataset.seg)); c.addEventListener('click', () => pick(+c.dataset.seg)); });
    el.addEventListener('pointerleave', () => pick(null));
  }
}
