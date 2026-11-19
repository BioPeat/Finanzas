// ===== Copiloto de IA: Chat conversacional (Gemini / Local), análisis, categorización y extracción =====
"use strict";

function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  let html = '', inUl = false, inOl = false, tableRows = [];
  const flushList = () => { if (inUl) { html += '</ul>'; inUl = false; } if (inOl) { html += '</ol>'; inOl = false; } };
  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.filter(r => !/^[\s|:-]+$/.test(r));
    if (rows.length) {
      html += '<table>' + rows.map((r, idx) => {
        const cells = r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const tag = idx === 0 ? 'th' : 'td';
        return '<tr>' + cells.map(c => '<' + tag + '>' + fmt(c) + '</' + tag + '>').join('') + '</tr>';
      }).join('') + '</table>';
    }
    tableRows = [];
  };
  for (const raw of lines) {
    const l = raw.trim();
    if (/^\|.*\|$/.test(l)) { flushList(); tableRows.push(l); continue; }
    flushTable();
    if (!l) { flushList(); continue; }
    if (/^#{1,3}\s+/.test(l)) { flushList(); html += '<h4>' + fmt(l.replace(/^#{1,3}\s+/, '')) + '</h4>'; continue; }
    if (/^[-•*]\s+/.test(l)) { if (inOl) { html += '</ol>'; inOl = false; } if (!inUl) { html += '<ul>'; inUl = true; } html += '<li>' + fmt(l.replace(/^[-•*]\s+/, '')) + '</li>'; continue; }
    if (/^\d+\.\s+/.test(l)) { if (inUl) { html += '</ul>'; inUl = false; } if (!inOl) { html += '<ol>'; inOl = true; } html += '<li>' + fmt(l.replace(/^\d+\.\s+/, '')) + '</li>'; continue; }
    flushList();
    html += '<p>' + fmt(l) + '</p>';
  }
  flushTable(); flushList();
  return html;
}

function portfolioMetricsFromPayload(rows) {
  const pos = rows.filter(x => x.value > 0), total = sum(pos.map(x => x.value)), top = pos.length && total ? pos[0].value / total * 100 : 0, day = total ? sum(pos.map(x => x.value * (x.change24h || 0))) / total : 0;
  return { total, top, day };
}

function aiPayload(kind) {
  const m = monthKey(today()), mt = monthTotals(m), nw = netWorth(), inv = investmentSummary(), ds = derivSummary(), cats = Object.entries(mt.byCat).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const base = {
    kind, date: today(), currency: 'EUR',
    summary: { netWorth: round(nw.total), cash: round(nw.total - inv.value), investments: round(inv.value), monthIncome: round(mt.inc), monthExpense: round(mt.exp), monthBalance: round(mt.save), safePerDay: round(safeToSpend().per), emergencyMonths: cushion() },
    accounts: state.accounts.map(a => ({ name: a.name, kind: a.kind, inst: a.inst || '', valueEUR: round(accValue(a, nw.rows)) })),
    categories: cats.map(([id, value]) => ({ name: catById(id).name, value: round(value), budget: state.budgets[id] || null })),
    portfolio: positionRows().filter(r => !r.bank).map(r => ({ asset: r.asset, qty: round(r.qty, 6), value: round(r.eur), change24h: state.prices[r.asset]?.chg ?? null })).sort((a, b) => b.value - a.value).slice(0, 20),
    derivatives: {
      summary: { count: ds.count, totalPnlEUR: round(ds.totalPnlEUR), totalMarginEUR: round(ds.totalMarginEUR), netExposureEUR: round(ds.netExposureEUR), minLiqDistPct: ds.minLiqDist != null ? round(ds.minLiqDist, 1) : null },
      positions: derivRows().map(d => ({ instr: d.instr, exchange: d.exchange || 'manual', type: d.type, side: d.side, size: d.size, entry: d.entry, mark: d.mark, lev: d.lev, marginEUR: round(d.marginEUR), pnlEUR: round(d.pnlEUR), roiPct: d.roiPct != null ? round(d.roiPct, 1) : null, liq: d.liq, liqDistPct: d.liqDistPct != null ? round(d.liqDistPct, 1) : null }))
    },
    upcomingCharges: upcoming(21).slice(0, 6).map(u => ({ name: u.name, amount: round(u.amount), next: u.next })),
    alerts: alerts().slice(0, 10).map(a => a.txt)
  };
  if (state.settings.aiShareDetails) base.recentTransactions = state.tx.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map(t => ({ date: t.date, merchant: merchantOf(t.desc), amount: t.amount, category: catById(t.cat).name }));
  return base;
}
function aiContext() { return aiPayload('chat'); }

function localAdvice(kind) {
  const p = aiPayload(kind), s = p.summary, top = p.categories[0], pm = portfolioMetricsFromPayload(p.portfolio), f = forecast(), lines = [];
  const fact = (k, v) => lines.push(k + ' · ' + v);
  if (kind === 'brief') {
    lines.push('LECTURA DE POSICIÓN'); fact('Patrimonio', nf(s.netWorth, 0) + ' €'); fact('Balance del mes', nf(s.monthBalance, 0) + ' €'); fact('Previsión fin de mes', nf(f.end, 0) + ' €');
    if (p.derivatives.summary.count) fact('Derivados abiertos', p.derivatives.summary.count + ' · PyG ' + nf(p.derivatives.summary.totalPnlEUR, 2) + ' €');
    if (p.alerts.length) lines.push('', 'PRIORIDADES', ...p.alerts.slice(0, 3).map((x, i) => (i + 1) + '. ' + x)); else lines.push('', 'Sin alertas urgentes.');
  }
  if (kind === 'spend') {
    lines.push('REVISIÓN DE GASTO'); if (top) fact('Mayor categoría', top.name + ' · ' + nf(top.value, 0) + ' €'); fact('Gasto del mes', nf(s.monthExpense, 0) + ' €'); fact('Balance', nf(s.monthBalance, 0) + ' €');
    lines.push('', top ? 'Comprueba si los tres cargos mayores de ' + top.name.toLowerCase() + ' son recurrentes, excepcionales o reducibles.' : 'Importa al menos dos meses para comparar patrones.');
  }
  if (kind === 'portfolio') {
    lines.push('REVISIÓN DE CARTERA'); fact('Valor', nf(s.investments, 0) + ' €'); fact('Mayor posición', nf(pm.top, 0) + ' %'); fact('Cambio ponderado 24 h', pct(pm.day || 0));
    if (pm.top > 35) lines.push('', 'RIESGO · La concentración supera el 35 %. Antes de añadir capital, revisa si es deliberada.');
    else if (pm.total) lines.push('', 'La concentración principal no supera el umbral de revisión del 35 %.');
  }
  if (kind === 'plan') {
    lines.push('ESCENARIO DE MES'); fact('Disponible previsto', nf(f.end, 0) + ' €'); fact('Cargos fijos pendientes', nf(f.fixed, 0) + ' €'); fact('Gasto variable previsto', nf(f.variable, 0) + ' €'); lines.push('', f.end < 0 ? 'Prioridad: evita nuevos compromisos y revisa cargos pendientes.' : 'Separa primero pagos pendientes y colchón; decide después cuánto invertir.');
  }
  if (kind === 'risk') {
    lines.push('RIESGOS A 30 DÍAS'); fact('Colchón', s.emergencyMonths == null ? 'sin base' : nf(s.emergencyMonths, 1) + ' meses'); fact('Alertas activas', String(p.alerts.length)); fact('Concentración', pm.total ? nf(pm.top, 0) + ' %' : 'sin cartera');
    if (p.derivatives.summary.minLiqDist != null) fact('Menor distancia a liquidación', nf(p.derivatives.summary.minLiqDist, 1) + ' %');
    lines.push('', ...p.alerts.slice(0, 5).map(x => '• ' + x));
  }
  if (kind === 'quality') {
    const unpriced = netWorth().unpriced.length, coverage = investmentSummary().coverage; lines.push('AUDITORÍA DE DATOS'); fact('Activos sin precio', String(unpriced)); fact('Coste FIFO cubierto', nf(coverage, 0) + ' %'); fact('Histórico de patrimonio', netSeries(365).pts.length + ' puntos'); fact('Copias locales', backupInfo().count + ' de 7');
    lines.push('', unpriced ? 'Completa símbolos o precios antes de interpretar la rentabilidad.' : 'No se detectan activos sin precio.');
  }
  lines.push('', 'Modo local: cálculo determinista en este dispositivo. No envía datos, no opera y no garantiza rentabilidad.'); return lines.join('\n');
}

function localChatReply(q) {
  const ctx = aiContext(), s = ctx.summary, txt = q.toLowerCase();
  const out = [];
  if (/derivad|futur|margen|liquidaci|posicion|abiert|perp|apalanc/.test(txt)) {
    const ds = ctx.derivatives.summary, pos = ctx.derivatives.positions;
    out.push('### Posiciones abiertas y márgenes');
    if (!pos.length) {
      out.push('Actualmente **no tienes derivados abiertos** registrados.');
    } else {
      out.push('- **Posiciones abiertas:** ' + ds.count + ' · **Margen usado:** ' + nf(ds.totalMarginEUR, 2) + ' € · **PyG abierto:** ' + (ds.totalPnlEUR >= 0 ? '+' : '') + nf(ds.totalPnlEUR, 2) + ' €');
      if (ds.minLiqDistPct != null) out.push('- **Menor distancia a liquidación:** ' + nf(ds.minLiqDistPct, 1) + ' %');
      out.push('', '| Instrumento | Lado | Apal. | Margen (€) | PyG (€) | Dist. liq. |', '|---|---|---:|---:|---:|---:|');
      for (const p of pos) out.push('| ' + p.instr + ' | ' + p.side + ' | ' + (p.lev ? p.lev + '×' : '—') + ' | ' + nf(p.marginEUR, 2) + ' | ' + (p.pnlEUR >= 0 ? '+' : '') + nf(p.pnlEUR, 2) + ' | ' + (p.liqDistPct != null ? nf(p.liqDistPct, 1) + ' %' : '—') + ' |');
    }
    if (ctx.portfolio.length) {
      out.push('', '### Cartera Spot principal');
      for (const a of ctx.portfolio.slice(0, 6)) out.push('- **' + a.asset + '**: ' + nf(a.qty, 4) + ' (' + nf(a.value, 0) + ' €)');
    }
  } else if (/gast|mes|categor|presupuest|ahorr|flujo|fin de mes|previsi/.test(txt)) {
    const f = forecast();
    out.push('### Resumen del mes');
    out.push('- **Ingresos:** ' + nf(s.monthIncome, 2) + ' € · **Gastos:** ' + nf(s.monthExpense, 2) + ' € · **Balance:** ' + nf(s.monthBalance, 2) + ' €');
    out.push('- **Puedes gastar hoy aprox.:** ' + nf(s.safePerDay, 2) + ' €/día · **Previsión fin de mes en banco:** ' + nf(f.end, 0) + ' €');
    if (ctx.categories.length) {
      out.push('', '### Top categorías de gasto');
      for (const c of ctx.categories.slice(0, 5)) out.push('- **' + c.name + '**: ' + nf(c.value, 0) + ' €' + (c.budget ? ' (límite ' + nf(c.budget, 0) + ' €)' : ''));
    }
  } else if (/riesgo|alerta|peligro|consej|recomend|que hago/.test(txt)) {
    out.push('### Diagnóstico rápido de riesgos');
    out.push('- **Colchón de emergencia:** ' + (s.emergencyMonths != null ? nf(s.emergencyMonths, 1) + ' meses' : 'sin base de gastos suficiente'));
    out.push('- **Alertas activas (' + ctx.alerts.length + '):**');
    if (ctx.alerts.length) for (const a of ctx.alerts) out.push('- ' + a);
    else out.push('- Ninguna alerta urgente detectada.');
  } else if (/impuest|renta|721|fifo|hacienda/.test(txt)) {
    const y = String(state.settings.taxYear || new Date().getFullYear() - 1);
    const ts = taxSummary(y, taxExtra);
    out.push('### Resumen fiscal orientativo (' + y + ')');
    out.push('- **Ganancias:** ' + nf(ts.gain, 2) + ' € · **Pérdidas:** ' + nf(ts.loss, 2) + ' € · **Derivados:** ' + nf(ts.der, 2) + ' €');
    out.push('- **Staking/intereses:** ' + nf(ts.rew, 2) + ' € · **Cuota ahorro estimada:** ' + nf(ts.cuota, 2) + ' €');
    out.push('- **Huecos FIFO pendientes:** ' + ts.r.gaps.length);
  } else {
    out.push('### Tu posición financiera hoy');
    out.push('- **Patrimonio neto:** ' + nf(s.netWorth, 0) + ' € (' + nf(s.cash, 0) + ' € disponible · ' + nf(s.investments, 0) + ' € invertido)');
    out.push('- **Balance este mes:** ' + nf(s.monthBalance, 0) + ' € (ingresos ' + nf(s.monthIncome, 0) + ' € · gastos ' + nf(s.monthExpense, 0) + ' €)');
    if (ctx.accounts.length) {
      out.push('', '### Cuentas conectadas');
      for (const a of ctx.accounts.slice(0, 6)) out.push('- **' + a.name + '** (' + a.kind + '): ' + nf(a.valueEUR, 0) + ' €');
    }
    if (ctx.derivatives.summary.count) out.push('', '- **Derivados abiertos:** ' + ctx.derivatives.summary.count + ' · PyG ' + nf(ctx.derivatives.summary.totalPnlEUR, 2) + ' €');
  }
  out.push('', '_Modo local sin API: conecta `GEMINI_API_KEY` en tu Worker para respuestas conversacionales libres._');
  return out.join('\n');
}

function getActiveChat() {
  let th = state.aiChats.find(c => c.id === activeChatId) || state.aiChats[0];
  if (!th) {
    th = { id: 'ch_' + uid(), title: 'Conversación actual', msgs: [] };
    state.aiChats.unshift(th);
  }
  activeChatId = th.id;
  return th;
}

let aiChatBusy = false;
async function sendChatMessage(text) {
  text = String(text || '').trim();
  if (!text || aiChatBusy) return;
  const th = getActiveChat();
  if (!th.msgs.length) th.title = text.slice(0, 38);
  change(() => { th.msgs.push({ role: 'user', text, t: Date.now() }); });
  aiChatBusy = true; render();
  try {
    let reply = '';
    if (!state.settings.worker || state.settings.aiProvider === 'local') {
      reply = localChatReply(text);
    } else {
      const r = await api('/ai', {
        method: 'POST', timeout: 55000,
        body: JSON.stringify({ mode: 'chat', provider: state.settings.aiProvider || 'auto', model: state.settings.aiModel || '', context: aiContext(), messages: th.msgs })
      });
      reply = r.text || '';
    }
    change(() => { th.msgs.push({ role: 'assistant', text: reply, t: Date.now() }); });
  } catch (e) {
    const fallback = localChatReply(text) + '\n\n> Nota: No se pudo conectar con la IA remota (' + e.message + '), te muestro el cálculo local.';
    change(() => { th.msgs.push({ role: 'assistant', text: fallback, t: Date.now() }); });
  } finally {
    aiChatBusy = false; render();
    const box = document.querySelector('.ai-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }
}

async function runAI(kind) {
  const title = { brief: 'Lectura de posición', spend: 'Revisión de gasto', portfolio: 'Revisión de cartera', plan: 'Escenario del mes', risk: 'Riesgos a 30 días', quality: 'Auditoría de datos' }[kind] || 'Análisis';
  let text = '';
  if (!state.settings.worker || state.settings.aiProvider === 'local') text = localAdvice(kind);
  else {
    const body = { mode: 'preset', provider: state.settings.aiProvider || 'auto', model: state.settings.aiModel || '', payload: aiPayload(kind) };
    const r = await api('/ai', { method: 'POST', body: JSON.stringify(body), timeout: 60000 }); text = r.text || '';
  }
  const th = getActiveChat();
  change(() => {
    state.aiNotes.unshift({ id: 'ai_' + uid(), kind, title, text, t: Date.now() });
    if (state.aiNotes.length > 20) state.aiNotes.length = 20;
    th.msgs.push({ role: 'user', text: 'Análisis rápido: ' + title, t: Date.now() });
    th.msgs.push({ role: 'assistant', text, t: Date.now() });
  }, 'Análisis guardado');
  go('copiloto');
}

function parseJSONSafe(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const m = clean.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : clean);
}

async function aiCategorizeUnknowns() {
  const unknownTxs = state.tx.filter(t => t.cat === 'otros');
  if (!unknownTxs.length) return toast('No tienes movimientos pendientes en «Otros gastos».');
  const merchants = [...new Set(unknownTxs.map(t => merchantOf(t.desc)).filter(Boolean))].slice(0, 40);
  if (!state.settings.worker || state.settings.aiProvider === 'local') {
    return toast('Para auto-categorizar comercios desconocidos con IA, configura tu Worker + GEMINI_API_KEY en Ajustes.');
  }
  toast('Consultando Gemini IA para ' + merchants.length + ' comercios…');
  const r = await api('/ai', {
    method: 'POST', timeout: 45000,
    body: JSON.stringify({
      mode: 'categorize', provider: state.settings.aiProvider || 'auto', model: state.settings.aiModel || '',
      categories: CATS.filter(c => c.kind === 'expense').map(c => ({ id: c.id, name: c.name })),
      items: merchants
    })
  });
  const j = parseJSONSafe(r.text);
  const rules = Array.isArray(j.rules) ? j.rules : [];
  if (!rules.length) return toast('La IA no propuso nuevas categorías.');
  let applied = 0;
  change(() => {
    for (const rule of rules) {
      const cat = CATS.some(c => c.id === rule.cat) ? rule.cat : '';
      if (!cat || cat === 'otros' || !rule.merchant) continue;
      state.rules = state.rules.filter(x => x.match !== rule.merchant);
      state.rules.unshift({ id: 'r:' + rule.merchant, match: rule.merchant, cat });
      for (const t of state.tx) if (t.cat === 'otros' && merchantOf(t.desc) === rule.merchant) { t.cat = cat; applied++; }
    }
  }, applied + ' movimientos categorizados con IA');
}

async function aiParseImport(payload) {
  if (!state.settings.worker || state.settings.aiProvider === 'local') {
    throw new Error('Configura tu Worker y GEMINI_API_KEY en Ajustes para usar el extractor inteligente IA.');
  }
  const r = await api('/ai', {
    method: 'POST', timeout: 60000,
    body: JSON.stringify({ mode: 'parse_import', provider: state.settings.aiProvider || 'auto', model: state.settings.aiModel || '', ...payload })
  });
  return parseJSONSafe(r.text);
}
