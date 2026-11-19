// ===== Conectores automáticos: Exchanges, Open Banking (Enable Banking), Wallets On-Chain y Worker =====
"use strict";

async function api(path, opts = {}) {
  const base = String(state.settings.worker || '').replace(/\/+$/, '');
  if (!base) throw Error('Falta configurar el Worker en Ajustes.');
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), opts.timeout || 20000);
  try {
    const r = await fetch(base + path, { method: opts.method || 'GET', body: opts.body, headers: { 'X-Caudal-Token': state.settings.token || '', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }, signal: ctl.signal });
    const j = await r.json().catch(() => null);
    const httpErr = (msg) => { const e = Error(msg); e.status = r.status; return e; };
    if (r.status === 401) throw httpErr('El código TOKEN no coincide. Revísalo en Ajustes.');
    if (r.status === 403) throw httpErr('Origen bloqueado. En Cloudflare, ALLOWED_ORIGIN debe ser exactamente ' + location.origin + ' (sin barra final). Guarda y vuelve a desplegar el Worker.');
    if (r.status === 404 && !j?.error) throw httpErr('Ruta no disponible en el Worker (actualiza worker.js a w6 en Cloudflare).');
    if (!r.ok) throw httpErr((j && j.error) || ('Error del Worker (' + r.status + ')'));
    return j;
  } catch (e) {
    if (e.name === 'AbortError') throw Error('El Worker no responde.');
    if (e instanceof TypeError) throw Error('No se pudo leer el Worker. Comprueba internet y que ALLOWED_ORIGIN sea exactamente ' + location.origin + ' (sin barra final).');
    throw e;
  } finally { clearTimeout(tm); }
}

const EXCH = { binance: 'Binance', kraken: 'Kraken', kraken_futures: 'Kraken Futures', kucoin: 'KuCoin', okx: 'OKX', bybit: 'Bybit' };
let balBusy = false;

async function syncBalances(manual = false) {
  if (!state.settings.worker || balBusy) return; balBusy = true;
  try {
    const before = clone(state), r = await api('/balances', { timeout: 30000 }), errs = []; let structural = false;
    const derivs = [];
    for (const [ex, data] of Object.entries(r.exchanges || {})) {
      let a = state.accounts.find(x => x.api === ex);
      if (!a) { a = { id: 'a_api_' + ex, name: EXCH[ex] || ex, kind: 'exchange', inst: EXCH[ex] || ex, currency: 'EUR', api: ex, reportsSpain: ex === 'binance' }; state.accounts.push(a); structural = true; }
      const assets = {}; for (const [k, v] of Object.entries(data.assets || {})) { const s = normAsset(k); assets[s] = (assets[s] || 0) + (+v || 0); ensureAsset(s); }
      state.apiBal[a.id] = { ts: Date.now(), assets };
      for (const p of data.positions || []) derivs.push({ ...p, acc: a.id, exchange: p.exchange || ex });
      for (const w of data.warnings || []) errs.push((EXCH[ex] || ex) + ': ' + w);
    }
    for (const [ex, e] of Object.entries(r.errors || {})) errs.push((EXCH[ex] || ex) + ': ' + e);
    state.apiDerivs = derivs; state.apiErrors = errs; state.apiTs = Date.now();
    if (structural) { stampChanges(before); save(); } else save(false);
    await syncOnChainWallets(false);
    await syncConnectedBanks(false);
    await refreshPrices();
    if (manual) toast(errs.length ? 'Actualizado con avisos: ' + errs.join(' · ') : 'Saldos y derivados actualizados');
  } catch (e) { state.apiErrors = [e.message]; if (manual) toast(e.message); }
  finally { balBusy = false; if (ready) render(); }
}

async function syncExchangeHistory(ex) {
  if (!state.settings.worker) return toast('Configura el Worker en Ajustes.');
  try {
    toast('Importando historial de ' + (EXCH[ex] || ex) + '…');
    const r = await api('/history?exchange=' + encodeURIComponent(ex), { timeout: 30000 });
    const rows = r.rows || [];
    if (!rows.length) return toast('No se encontraron operaciones nuevas en ' + (EXCH[ex] || ex));
    let added = 0, dup = 0;
    change(() => {
      let a = state.accounts.find(x => x.api === ex);
      if (!a) { a = { id: 'a_api_' + ex, name: EXCH[ex] || ex, kind: 'exchange', inst: EXCH[ex] || ex, currency: 'EUR', api: ex }; state.accounts.push(a); }
      const seen = new Set(state.ledger.map(lgKey));
      rows.forEach((p, i) => {
        const asset = normAsset(p.asset); ensureAsset(asset);
        const l = { id: 'l_' + uid() + i, acc: a.id, t: p.t, asset, change: p.change, kind: p.kind || 'trade', ref: p.ref || '', note: p.note || '', src: 'api:' + ex };
        const k = lgKey(l); if (seen.has(k)) { dup++; return; } seen.add(k); state.ledger.push(l); added++;
      });
    }, added + ' operaciones de ' + (EXCH[ex] || ex) + ' sincronizadas' + (dup ? ' · ' + dup + ' ya estaban' : ''));
  } catch (e) { toast('Historial ' + ex + ': ' + e.message); }
}

async function syncOnChainWallets(manual = false) {
  const wallets = state.accounts.filter(a => a.kind === 'wallet' && a.chain && a.address);
  if (!wallets.length) return;
  let updated = 0;
  for (const w of wallets) {
    try {
      let data = null;
      if (state.settings.worker) {
        data = await api('/onchain?chain=' + encodeURIComponent(w.chain) + '&address=' + encodeURIComponent(w.address));
      } else if (w.chain === 'btc') {
        const r = await fetch('https://mempool.space/api/address/' + encodeURIComponent(w.address));
        if (r.ok) { const j = await r.json(); const c = (j.chain_stats?.funded_txo_sum || 0) - (j.chain_stats?.spent_txo_sum || 0); data = { assets: { BTC: c / 1e8 } }; }
      }
      if (data && data.assets) {
        const assets = {}; for (const [k, v] of Object.entries(data.assets)) { const s = normAsset(k); assets[s] = (+v || 0); ensureAsset(s); }
        state.apiBal[w.id] = { ts: Date.now(), assets };
        updated++;
      }
    } catch (e) { if (manual) toast(w.name + ': ' + e.message); }
  }
  if (updated) { save(false); if (manual) { await refreshPrices(); toast('Wallets on-chain actualizadas'); } }
}

// ===== Open Banking PSD2 gratuito (Enable Banking) =====
async function openBankConnectModal() {
  const hasEB = !!(state.settings.worker && state.workerInfo?.openBanking);
  modal('Conectar banco automático (PSD2 gratuito)', !state.settings.worker
    ? '<div class="callout info">Para conectar tu banco automáticamente con Open Banking necesitas configurar antes tu Cloudflare Worker en Ajustes.</div><div class="row" style="margin-top:12px">' + btn('Ir a Ajustes', 'data-go="ajustes"', 'primary') + btn('Importar Excel / CSV ahora', 'data-act="import"') + '</div>'
    : !hasEB
      ? '<p>Finanzas soporta conexión bancaria oficial PSD2 gratuita para uso personal mediante <b>Enable Banking</b> (compatible con <b>Banco Santander</b>, Revolut, BBVA, CaixaBank y miles de bancos europeos).</p>'
        + '<div class="callout">Aún no has guardado <code>ENABLE_BANKING_APP_ID</code> y <code>ENABLE_BANKING_PRIVATE_KEY</code> en los secretos de tu Worker de Cloudflare.</div>'
        + '<ol class="steps" style="margin-top:14px"><li><div>Regístrate gratis en <b>enablebanking.com</b> (modo uso personal / cuentas vinculadas).</div></li><li><div>Crea una aplicación restringida a tus cuentas y descarga la clave privada RSA.</div></li><li><div>Añade <code>ENABLE_BANKING_APP_ID</code> y <code>ENABLE_BANKING_PRIVATE_KEY</code> en Cloudflare → Variables and Secrets y vuelve a probar el Worker en Ajustes.</div></li></ol>'
        + '<div class="row" style="margin-top:14px">' + btn('Subir Excel / CSV mientras tanto', 'data-act="import"', 'primary') + btn('Probar Worker en Ajustes', 'data-go="ajustes"') + '</div>'
      : '<p>Elige tu país y banco para autorizar acceso oficial de <b>solo lectura</b> durante 90 días.</p>'
        + '<div class="form"><label class="f">País<select id="eb-country"><option value="ES" selected>España (ES)</option><option value="LT">Lituania · Revolut (LT)</option><option value="DE">Alemania (DE)</option><option value="IE">Irlanda (IE)</option></select></label><label class="f">Filtrar banco<input type="search" id="eb-filter" placeholder="Santander, Revolut, BBVA…"></label></div>'
        + '<div id="eb-list" style="margin-top:12px"><p class="muted">Cargando bancos autorizados…</p></div>');
  if (hasEB) {
    const fetchBanks = async () => {
      try {
        const c = val('eb-country') || 'ES';
        const r = await api('/bank/aspsps?country=' + encodeURIComponent(c));
        const all = r.aspsps || [];
        const paintList = () => {
          const q = val('eb-filter').toLowerCase();
          const list = all.filter(x => !q || String(x.name || '').toLowerCase().includes(q)).slice(0, 30);
          $('eb-list').innerHTML = list.length ? list.map(b => '<button type="button" class="account-line" data-eb-name="' + esc(b.name) + '" data-eb-country="' + esc(b.country || c) + '"><span class="account-mark">' + ico('bank') + '</span><span><b>' + esc(b.name) + '</b><small>' + esc(b.country || c) + ' · Solo lectura PSD2</small></span><span class="tag brand">Conectar →</span></button>').join('') : '<p class="muted">Ningún banco coincide con el filtro.</p>';
          $$('[data-eb-name]', $('eb-list')).forEach(btnEl => {
            btnEl.onclick = () => startBankAuth(btnEl.dataset.ebName, btnEl.dataset.ebCountry);
          });
        };
        $('eb-filter').oninput = paintList;
        paintList();
      } catch (e) { $('eb-list').innerHTML = '<div class="callout err">' + esc(e.message) + '</div>'; }
    };
    $('eb-country').onchange = fetchBanks;
    fetchBanks();
  }
}

async function startBankAuth(aspspName, country) {
  try {
    toast('Preparando autorización oficial con ' + aspspName + '…');
    const redirectUrl = location.origin + location.pathname;
    const st = 'eb_' + uid();
    sessionStorage.setItem('eb_pending', JSON.stringify({ state: st, aspspName, country }));
    const r = await api('/bank/auth', { method: 'POST', body: JSON.stringify({ aspspName, country, redirectUrl, state: st }) });
    if (r.url) location.href = r.url;
    else throw new Error('No se recibió URL de autorización del banco.');
  } catch (e) { toast('Open Banking: ' + e.message); }
}

async function handleBankCallback() {
  const sp = new URLSearchParams(location.search);
  const code = sp.get('code'), st = sp.get('state');
  if (!code || !st || !st.startsWith('eb_')) return;
  history.replaceState(null, '', location.pathname + location.hash);
  let meta = {}; try { meta = JSON.parse(sessionStorage.getItem('eb_pending') || '{}'); sessionStorage.removeItem('eb_pending'); } catch (e) { }
  try {
    toast('Completando conexión con ' + (meta.aspspName || 'tu banco') + '…');
    const r = await api('/bank/session', { method: 'POST', body: JSON.stringify({ code }) });
    const accs = r.accounts || [];
    if (!accs.length) return toast('El banco no devolvió cuentas autorizadas.');
    change(() => {
      for (const ba of accs) {
        const uidB = ba.uid, iban = ba.account_id?.iban || '';
        let a = state.accounts.find(x => x.ebUid === uidB || (iban && x.iban === iban));
        if (!a) {
          a = { id: 'a_' + uid(), name: (meta.aspspName || 'Banco') + (iban ? ' ·' + iban.slice(-4) : ''), kind: 'bank', inst: meta.aspspName || '', currency: ba.currency || 'EUR', iban, manualBal: 0 };
          state.accounts.push(a);
        }
        a.ebUid = uidB; a.ebSessionId = r.session_id || ''; a.ebValidUntil = r.access?.valid_until || addDays(today(), 89);
      }
    }, accs.length + ' cuenta(s) bancaria(s) conectada(s)');
    await syncConnectedBanks(true);
  } catch (e) { toast('Error al finalizar conexión bancaria: ' + e.message); }
}

async function syncConnectedBanks(manual = false) {
  const ebAccs = state.accounts.filter(a => a.ebUid);
  if (!ebAccs.length || !state.settings.worker) return;
  try {
    const r = await api('/bank/sync', { method: 'POST', timeout: 30000, body: JSON.stringify({ accounts: ebAccs.map(a => ({ uid: a.ebUid, currency: a.currency || 'EUR' })), dateFrom: addDays(today(), -60) }) });
    let added = 0;
    change(() => {
      const seen = new Set(state.tx.map(txKey));
      for (const res of r.accounts || []) {
        const a = state.accounts.find(x => x.ebUid === res.uid); if (!a) continue;
        if (res.bal != null && isFinite(res.bal)) a.manualBal = res.bal;
        (res.tx || []).forEach((p, i) => {
          const t = { id: 't_' + uid() + i, acc: a.id, date: p.date, desc: p.desc, amount: round(p.amount), bal: null, ord: i, src: 'enablebanking' };
          t.cat = categorize(t); const k = txKey(t);
          if (!seen.has(k)) { seen.add(k); state.tx.push(t); added++; }
        });
      }
    }, '');
    if (manual) toast(added ? added + ' movimientos bancarios sincronizados' : 'Bancos conectados al día');
  } catch (e) { if (manual) toast('Bancos PSD2: ' + e.message); }
}

function openConnectHub() {
  const ex = state.workerInfo?.exchanges || {}, hasWorker = !!state.settings.worker;
  const badge = on => on ? '<span class="tag ok">Conectado</span>' : '<span class="tag">Sin clave</span>';
  modal('Conectar bancos, exchanges y wallets', '<div style="display:grid;gap:14px">'
    + '<section class="panel" style="padding:14px 16px"><div class="module-title"><b>1. Bancos (Santander, Revolut, BBVA, cualquiera)</b></div>'
    + '<p class="note" style="margin-top:0">Conecta por Open Banking oficial gratuito (PSD2) o sube tu Excel/CSV/captura de pantalla.</p>'
    + '<div class="row" style="margin-top:10px">' + btn(ico('link') + 'Conectar banco automático', 'data-act="bank-connect"', 'primary small') + btn(ico('upload') + 'Subir Excel / CSV', 'data-act="import"', 'small') + btn(ico('brain') + 'Pegar / Captura IA', 'data-act="ai-import"', 'small') + '</div></section>'
    + '<section class="panel" style="padding:14px 16px"><div class="module-title"><b>2. Exchanges (KuCoin, Kraken, Binance, OKX, Bybit)</b></div>'
    + '<p class="note" style="margin-top:0">Solo lectura: saldos spot, earn, margen y futuros perpetuos en vivo.' + (hasWorker ? '' : ' Configura el Worker en Ajustes para activarlos.') + '</p>'
    + '<div class="row" style="gap:8px;margin-top:8px"><span class="chip">KuCoin ' + badge(ex.kucoin) + '</span><span class="chip">Kraken ' + badge(ex.kraken) + '</span><span class="chip">Kraken Fut. ' + badge(ex.kraken_futures) + '</span><span class="chip">Binance ' + badge(ex.binance) + '</span></div>'
    + '<div class="row" style="margin-top:12px">' + (hasWorker ? btn(ico('sync') + 'Sincronizar ahora', 'data-act="refresh"', 'primary small') : '') + (ex.kucoin ? btn('Historial KuCoin', 'data-act="sync-hist" data-id="kucoin"', 'small') : '') + (ex.kraken ? btn('Historial Kraken', 'data-act="sync-hist" data-id="kraken"', 'small') : '') + btn('Configurar claves', 'data-go="ajustes"', 'small') + '</div></section>'
    + '<section class="panel" style="padding:14px 16px"><div class="module-title"><b>3. Wallets On-Chain y Brókeres (Trade Republic, MyInvestor…)</b></div>'
    + '<p class="note" style="margin-top:0">Sigue direcciones públicas gratuitas (BTC, ETH, Arbitrum, Base, Polygon, Solana) o importa un snapshot/CSV de cualquier bróker.</p>'
    + '<div class="row" style="margin-top:10px">' + btn(ico('shield') + 'Añadir wallet on-chain', 'data-act="add-wallet"', 'small') + btn(ico('plus') + 'Añadir cuenta / bróker', 'data-act="add-acc"', 'small') + '</div></section>'
    + '</div>');
}
