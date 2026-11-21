// ===== Conectores automáticos: Exchanges, Open Banking (Enable Banking), Wallets On-Chain y Worker =====
"use strict";

let activeWorkerBase = '';
const normBase = u => String(u || '').trim().replace(/\/+$/, '');
function resetWorkerRoute() { activeWorkerBase = ''; }
function workerEndpoints() {
  const raw = [activeWorkerBase, state.settings.worker, state.settings.workerFallback, ...(Array.isArray(state.settings.workerMirrors) ? state.settings.workerMirrors : [])];
  const seen = new Set(), out = [];
  for (const u of raw) { const n = normBase(u); if (n && !seen.has(n)) { seen.add(n); out.push(n); } }
  return out;
}
function rememberWorkerMirrors(info) {
  if (!info || !Array.isArray(info.mirrors)) return;
  const main = normBase(state.settings.worker);
  const next = [...new Set(info.mirrors.map(normBase).filter(u => u && u !== main))];
  const cur = Array.isArray(state.settings.workerMirrors) ? state.settings.workerMirrors : [];
  if (JSON.stringify(cur) !== JSON.stringify(next)) {
    state.settings.workerMirrors = next;
    save(false);
  }
}

async function api(path, opts = {}) {
  const bases = workerEndpoints();
  if (!bases.length) throw Error('Falta configurar el Worker en Ajustes.');
  const httpErr = (msg, status, data = null) => { const e = Error(msg); e.status = status; e.data = data; return e; };
  let lastNetErr = null;
  for (let i = 0; i < bases.length; i++) {
    const base = bases[i], hasMore = i < bases.length - 1;
    const ms = hasMore ? Math.min(opts.timeout || 20000, 7500) : (opts.timeout || 20000);
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(base + path, { method: opts.method || 'GET', body: opts.body, headers: { 'X-Caudal-Token': state.settings.token || '', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }, signal: ctl.signal });
      if (r.status >= 520 && r.status <= 530 && hasMore) continue;
      const j = await r.json().catch(() => null);
      if (r.status === 401) throw httpErr((j && j.error) || 'El código TOKEN no coincide. Revísalo en Ajustes.', r.status, j);
      if (r.status === 403) throw httpErr('Origen bloqueado. En Cloudflare, ALLOWED_ORIGIN debe ser exactamente ' + location.origin + ' (sin barra final). Guarda y vuelve a desplegar el Worker.', r.status, j);
      if (r.status === 404 && !j?.error) throw httpErr('Ruta no disponible en el Worker (actualiza worker.js a w6 en Cloudflare).', r.status, j);
      if (!r.ok) throw httpErr((j && j.error) || ('Error del Worker (' + r.status + ')'), r.status, j);
      activeWorkerBase = base;
      if (path === '/ping' || path === '/credentials') rememberWorkerMirrors(j);
      return j;
    } catch (e) {
      if (e.name === 'AbortError' || e instanceof TypeError) {
        lastNetErr = e;
        if (hasMore) continue;
        const hint = bases.length === 1
          ? ' Si usas *.workers.dev desde España durante bloqueos de red/operadora a Cloudflare, añade una URL de respaldo en Ajustes.'
          : ' Comprueba tu conexión o las URLs del servidor en Ajustes.';
        throw Error((e.name === 'AbortError' ? 'El servidor no responde (tiempo agotado).' : 'No se pudo conectar con el servidor.') + hint);
      }
      throw e;
    } finally { clearTimeout(tm); }
  }
  throw lastNetErr || Error('No se pudo conectar con el servidor.');
}

const EXCH = { binance: 'Binance', kraken: 'Kraken', kraken_futures: 'Kraken Futures', kucoin: 'KuCoin', okx: 'OKX', bybit: 'Bybit' };
let balBusy = false;

async function syncBalances(manual = false) {
  if (!workerEndpoints().length || balBusy) return; balBusy = true;
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
    ? '<div class="callout info">Para conectar tu banco automáticamente con Open Banking necesitas configurar antes tu Cloudflare Worker en Ajustes.</div><div class="row ch-actions">' + btn('Ir a Ajustes', 'data-go="ajustes"', 'primary') + btn('Importar Excel / CSV ahora', 'data-act="import"') + '</div>'
    : !hasEB
      ? '<p class="ch-note">Finanzas soporta conexión bancaria oficial PSD2 mediante <b>Enable Banking</b> (compatible con <b>Banco Santander, Revolut, BBVA, CaixaBank, ING, Sabadell, N26 y +2.500 bancos europeos</b>).</p>'
        + '<div class="callout">Guarda tu <code>ENABLE_BANKING_APP_ID</code> y <code>ENABLE_BANKING_PRIVATE_KEY</code> directamente desde el Centro de conexiones sin salir de la app.</div>'
        + '<div class="row ch-actions">' + btn('Configurar PSD2 en la app', 'id="eb-go-hub"', 'primary') + btn('Subir Excel / CSV mientras tanto', 'data-act="import"') + '</div>'
      : '<p class="ch-note">Elige el país y tu entidad para autorizar acceso oficial PSD2 de <b>solo lectura</b> durante 90 días (Santander, Revolut, BBVA, CaixaBank, ING, Sabadell, N26 y +2.500 bancos).</p>'
        + '<div class="form"><label class="f ch-field"><span class="ch-label">País</span><select id="eb-country" class="ch-input"><option value="ES" selected>España (ES)</option><option value="LT">Lituania · Revolut (LT)</option><option value="DE">Alemania · N26 (DE)</option><option value="IE">Irlanda (IE)</option><option value="FR">Francia (FR)</option><option value="PT">Portugal (PT)</option><option value="IT">Italia (IT)</option><option value="NL">Países Bajos (NL)</option></select></label><label class="f ch-field"><span class="ch-label">Buscar entidad</span><input type="search" id="eb-filter" class="ch-input" placeholder="Santander, Revolut, BBVA, CaixaBank, ING…"></label></div>'
        + '<div id="eb-list" class="ch-bank-list"><p class="muted">Cargando bancos autorizados…</p></div>');
  if (!hasEB && $('eb-go-hub')) {
    $('eb-go-hub').onclick = () => openConnectHub('bancos');
  }
  if (hasEB) {
    const fetchBanks = async () => {
      try {
        const c = val('eb-country') || 'ES';
        const r = await api('/bank/aspsps?country=' + encodeURIComponent(c));
        const all = r.aspsps || [];
        const paintList = () => {
          const q = val('eb-filter').toLowerCase();
          const list = all.filter(x => !q || String(x.name || '').toLowerCase().includes(q)).slice(0, 40);
          $('eb-list').innerHTML = list.length ? list.map(b => '<button type="button" class="account-line ch-bank-item" data-eb-name="' + esc(b.name) + '" data-eb-country="' + esc(b.country || c) + '"><span class="account-mark">' + ico('bank') + '</span><span><b>' + esc(b.name) + '</b><small>' + esc(b.country || c) + ' · PSD2</small></span><span class="tag brand">Autorizar →</span></button>').join('') : '<p class="muted">Ningún banco coincide con el filtro.</p>';
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

const VAULT_GROUPS = {
  eb: {
    label: 'Open Banking PSD2',
    tab: 'bancos',
    fields: [
      ['vc-eb-id', 'ENABLE_BANKING_APP_ID'],
      ['vc-eb-key', 'ENABLE_BANKING_PRIVATE_KEY']
    ],
    required: ['ENABLE_BANKING_APP_ID', 'ENABLE_BANKING_PRIVATE_KEY']
  },
  kucoin: {
    label: 'KuCoin',
    tab: 'kucoin',
    fields: [
      ['vc-kc-key', 'KUCOIN_KEY'],
      ['vc-kc-sec', 'KUCOIN_SECRET'],
      ['vc-kc-pass', 'KUCOIN_PASSPHRASE'],
      ['vc-kcf-key', 'KUCOIN_FUTURES_KEY'],
      ['vc-kcf-sec', 'KUCOIN_FUTURES_SECRET'],
      ['vc-kcf-pass', 'KUCOIN_FUTURES_PASSPHRASE']
    ],
    required: ['KUCOIN_KEY', 'KUCOIN_SECRET', 'KUCOIN_PASSPHRASE']
  },
  kraken: {
    label: 'Kraken',
    tab: 'kraken',
    fields: [
      ['vc-kr-key', 'KRAKEN_KEY'],
      ['vc-kr-sec', 'KRAKEN_SECRET'],
      ['vc-krf-key', 'KRAKEN_FUTURES_KEY'],
      ['vc-krf-sec', 'KRAKEN_FUTURES_SECRET']
    ],
    required: []
  },
  okx: {
    label: 'OKX',
    tab: 'okx',
    fields: [
      ['vc-okx-key', 'OKX_KEY'],
      ['vc-okx-sec', 'OKX_SECRET'],
      ['vc-okx-pass', 'OKX_PASSPHRASE']
    ],
    required: ['OKX_KEY', 'OKX_SECRET', 'OKX_PASSPHRASE']
  },
  binance: {
    label: 'Binance',
    tab: 'binance-bybit',
    fields: [
      ['vc-bn-key', 'BINANCE_KEY'],
      ['vc-bn-sec', 'BINANCE_SECRET']
    ],
    required: ['BINANCE_KEY', 'BINANCE_SECRET']
  },
  bybit: {
    label: 'Bybit',
    tab: 'binance-bybit',
    fields: [
      ['vc-bb-key', 'BYBIT_KEY'],
      ['vc-bb-sec', 'BYBIT_SECRET']
    ],
    required: ['BYBIT_KEY', 'BYBIT_SECRET']
  }
};

async function saveVaultCredentials(group, opts = {}) {
  const cfg = VAULT_GROUPS[group];
  if (!cfg) return;
  if (!state.settings.worker) return toast('Configura primero la URL de tu Worker en Ajustes.');
  try {
    let forceReset = !!opts.forceReset;
    if (state.workerInfo?.vaultLocked && !forceReset) {
      if (!opts.skipConfirm && typeof confirm === 'function' && !confirm('Bóveda bloqueada tras cambiar el TOKEN. ¿Deseas reemplazar la copia anterior de la bóveda?')) return;
      forceReset = true;
    }
    if (opts.clear === true) {
      if (!opts.skipConfirm && typeof confirm === 'function' && !confirm('¿Seguro que deseas desconectar ' + cfg.label + ' y eliminar sus claves de la bóveda del Worker?')) return;
      const clear = cfg.fields.map(([, envKey]) => envKey);
      const info = await api('/credentials', { method: 'POST', body: JSON.stringify({ clear, ...(forceReset ? { forceReset: true } : {}) }) });
      state.workerInfo = info;
      save(false);
      cfg.fields.forEach(([id]) => { const el = $(id); if (el) el.value = ''; });
      toast(cfg.label + ' desconectado del Worker.');
      openConnectHub(cfg.tab);
      if (ready) render();
      return;
    }
    const set = {};
    for (const [inputId, envKey] of cfg.fields) {
      const v = val(inputId);
      if (v) set[envKey] = v;
    }
    if (group === 'kraken') {
      const hasSpot = !!(set.KRAKEN_KEY && set.KRAKEN_SECRET);
      const hasFut = !!(set.KRAKEN_FUTURES_KEY && set.KRAKEN_FUTURES_SECRET);
      if (!hasSpot && !hasFut) return toast('Introduce API Key y Secret de Kraken Spot o de Kraken Futures.');
    } else if (!cfg.required.every(k => set[k])) {
      return toast('Completa todos los campos obligatorios de ' + cfg.label + '.');
    }
    toast('Guardando credenciales de ' + cfg.label + ' en el Worker…');
    let info;
    try {
      info = await api('/credentials', { method: 'POST', body: JSON.stringify({ set, ...(forceReset ? { forceReset: true } : {}) }) });
    } catch (err) {
      if (err && err.status === 409) {
        state.workerInfo = { ...(state.workerInfo || {}), vaultLocked: true };
        if (typeof confirm === 'function' && confirm('Bóveda bloqueada tras cambiar el TOKEN. ¿Confirmas sobrescribir la bóveda anterior con estas nuevas claves?')) {
          info = await api('/credentials', { method: 'POST', body: JSON.stringify({ set, forceReset: true }) });
        } else return;
      } else throw err;
    }
    state.workerInfo = info;
    save(false);
    cfg.fields.forEach(([id]) => { const el = $(id); if (el) el.value = ''; });
    if (group === 'eb') {
      toast('Enable Banking activado. Elige tu banco para autorizar PSD2.');
      openBankConnectModal();
      if (ready) render();
    } else {
      toast(cfg.label + ' conectado. Sincronizando saldos y derivados…');
      openConnectHub(cfg.tab);
      await syncBalances(true);
    }
  } catch (e) {
    toast(cfg.label + ': ' + e.message);
  }
}

function openConnectHub(initialTab = 'bancos') {
  const ex = state.workerInfo?.exchanges || {};
  const src = state.workerInfo?.credentialSources || {};
  const hasWorker = !!state.settings.worker;
  const ebOn = !!state.workerInfo?.openBanking;
  const vaultLocked = !!state.workerInfo?.vaultLocked;
  const ebAccCount = state.accounts.filter(a => a.ebUid).length;
  const wallets = state.accounts.filter(a => a.kind === 'wallet' && a.address);
  const secAttrs = 'value="" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off"';
  const badge = (on, prefix = '') => '<span class="tag ch-status-pill' + (on ? ' ok' : '') + '">' + (prefix ? prefix + ': ' : '') + (on ? 'Conectado ✓' : 'Pendiente') + '</span>';
  const dot = on => '<span class="ch-dot' + (on ? ' on' : '') + '" style="background:' + (on ? 'var(--up)' : 'var(--line2)') + '"></span>';
  const isVault = (p, on) => ('credentialSources' in (state.workerInfo || {})) ? src[p] === 'vault' : !!on;
  const isEnv = p => src[p] === 'env';
  const envTag = p => isEnv(p) ? '<span class="tag">Configurado en Cloudflare (secretos del Worker)</span>' : '';
  const wrapCreds = (isOn, title, inner) => isOn
    ? '<details class="ch-details"><summary>' + title + '</summary><div class="ch-details-body">' + inner + '</div></details>'
    : inner;

  const tabs = [
    { id: 'bancos', label: 'Bancos · PSD2', on: ebOn || ebAccCount > 0 },
    { id: 'kucoin', label: 'KuCoin', on: !!ex.kucoin },
    { id: 'kraken', label: 'Kraken', on: !!(ex.kraken || ex.kraken_futures) },
    { id: 'okx', label: 'OKX', on: !!ex.okx },
    { id: 'binance-bybit', label: 'Binance / Bybit', on: !!(ex.binance || ex.bybit) },
    { id: 'wallets', label: 'Wallets On-Chain', on: wallets.length > 0 }
  ];
  const curTab = tabs.some(t => t.id === initialTab) ? initialTab : 'bancos';

  const workerBanner = hasWorker ? '' : '<div class="callout info">Para guardar claves de lectura en tu bóveda cifrada KV (<code>CAUDAL</code>) y sincronizar en automático, configura primero tu Worker en Ajustes. La importación por CSV/Excel funciona sin Worker.<div class="row ch-actions">' + btn('Configurar Worker en Ajustes', 'data-go="ajustes"', 'primary small') + btn('Subir Excel / CSV', 'data-act="import"', 'small') + '</div></div>';
  const lockedBanner = vaultLocked ? '<div class="callout warn"><b>Bóveda bloqueada tras cambiar el TOKEN.</b> Vuelve a introducir tus claves; al guardar reemplazarás la copia anterior.</div>' : '';

  const tabBar = '<div class="ch-tabs" role="tablist">'
    + tabs.map(t => {
      const active = t.id === curTab;
      return '<button type="button" class="ch-tab' + (active ? ' on' : '') + '" role="tab" aria-selected="' + (active ? 'true' : 'false') + '" data-hub-tab="' + t.id + '">' + t.label + dot(t.on) + '</button>';
    }).join('')
    + '</div>';

  const ebCanClear = isVault('eb', ebOn);
  const ebCredsForm = '<div class="ch-head"><b>Credenciales PSD2 de Enable Banking (bóveda privada del Worker)</b> <a href="https://enablebanking.com" target="_blank" rel="noopener">enablebanking.com ↗</a></div>'
    + '<p class="ch-note">1) Regístrate en <b>enablebanking.com</b> · 2) Crea una aplicación PSD2 personal y descarga tu App ID y clave RSA (<code>.pem</code>) · 3) Guárdalos aquí:</p>'
    + '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">ENABLE_BANKING_APP_ID</span><input type="password" class="ch-input" id="vc-eb-id" ' + secAttrs + ' placeholder="UUID de tu aplicación Enable Banking…"></label>'
    + '<label class="f ch-field" style="grid-column:1/-1"><span class="ch-label">ENABLE_BANKING_PRIVATE_KEY (PEM PKCS#8)</span><textarea class="ch-textarea" id="vc-eb-key" rows="3" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" placeholder="-----BEGIN PRIVATE KEY-----&#10;…&#10;-----END PRIVATE KEY-----"></textarea></label>'
    + '</div>'
    + '<div class="row ch-actions">'
    + btn(ico('check') + 'Guardar y elegir banco', 'data-vault-save="eb"', 'primary small')
    + (ebCanClear ? btn('Desconectar PSD2', 'data-vault-clear="eb"', 'small') : '')
    + envTag('eb')
    + '</div>';

  const paneBancos = '<div data-hub-pane="bancos"' + (curTab === 'bancos' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>Open Banking PSD2 · Cualquier banco europeo</b><div class="ch-note">Enable Banking (0 € uso personal) · Acceso oficial de solo lectura</div></div><div class="row">' + envTag('eb') + badge(ebOn) + '</div></div>'
    + '<p class="ch-note">Conecta automáticamente <b>Banco Santander, Revolut, BBVA, CaixaBank, ING, Sabadell, N26 y +2.500 bancos europeos</b>, o importa tus extractos por archivo o captura.</p>'
    + (ebOn
      ? '<div class="callout ok"><b>Enable Banking activo en tu Worker.</b>'
        + (ebAccCount ? ' Tienes <b>' + ebAccCount + ' cuenta(s)</b> conectada(s).' : ' Autoriza tu entidad bancaria oficial PSD2 en segundos.')
        + '<div class="row ch-actions">'
        + btn(ico('bank') + 'Elegir banco y autorizar', 'data-act="bank-connect"', 'primary')
        + (ebAccCount ? btn(ico('sync') + 'Sincronizar bancos ahora', 'data-hub-act="sync-banks"', 'small') : '')
        + '</div></div>'
      : '')
    + '<div class="row ch-actions">'
    + (!ebOn ? btn(ico('bank') + 'Elegir banco y autorizar', 'data-act="bank-connect"', 'primary small') : '')
    + btn(ico('upload') + 'Subir Excel / CSV', 'data-act="import"', 'small')
    + btn(ico('brain') + 'Pegar o captura con IA', 'data-act="ai-import"', 'small')
    + '</div>'
    + wrapCreds(ebOn, 'Cambiar credenciales PSD2 (Enable Banking)', ebCredsForm)
    + '</div>';

  const kcCanClear = isVault('kucoin', ex.kucoin);
  const kcForm = '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">API Key (Spot / General)</span><input type="password" class="ch-input" id="vc-kc-key" ' + secAttrs + ' placeholder="KUCOIN_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">API Secret</span><input type="password" class="ch-input" id="vc-kc-sec" ' + secAttrs + ' placeholder="KUCOIN_SECRET…"></label>'
    + '<label class="f ch-field"><span class="ch-label">API Passphrase</span><input type="password" class="ch-input" id="vc-kc-pass" ' + secAttrs + ' placeholder="Contraseña de la API (Passphrase)…"></label>'
    + '</div>'
    + '<details class="ch-details"><summary>Claves dedicadas de KuCoin Futures (opcional si difieren de Spot)</summary>'
    + '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">Futures API Key</span><input type="password" class="ch-input" id="vc-kcf-key" ' + secAttrs + ' placeholder="KUCOIN_FUTURES_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Futures API Secret</span><input type="password" class="ch-input" id="vc-kcf-sec" ' + secAttrs + ' placeholder="KUCOIN_FUTURES_SECRET…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Futures Passphrase</span><input type="password" class="ch-input" id="vc-kcf-pass" ' + secAttrs + ' placeholder="KUCOIN_FUTURES_PASSPHRASE…"></label>'
    + '</div></details>'
    + '<div class="row ch-actions">'
    + btn(ico('sync') + 'Guardar y sincronizar ahora', 'data-vault-save="kucoin"', 'primary')
    + btn('Importar historial API', 'data-act="sync-hist" data-id="kucoin"', 'small')
    + (kcCanClear ? btn('Desconectar', 'data-vault-clear="kucoin"', 'small') : '')
    + '</div>';

  const paneKucoin = '<div data-hub-pane="kucoin"' + (curTab === 'kucoin' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>KuCoin · Spot, Earn y Futuros Perpetuos</b><div class="ch-note">API v2 oficial · Saldos, earn, margen, futuros e historial</div></div><div class="row">' + envTag('kucoin') + badge(ex.kucoin) + '</div></div>'
    + '<div class="callout"><b>Solo lectura:</b> En KuCoin → <i>API Management</i>, activa únicamente <b>General (Read-Only)</b>. <b>Nunca</b> marques <i>Spot/Futures Trading</i> ni <i>Withdraw</i>.</div>'
    + (ex.kucoin ? '<div class="row ch-actions">' + btn(ico('sync') + 'Sincronizar ahora', 'data-act="refresh"', 'primary small') + btn('Importar historial API', 'data-act="sync-hist" data-id="kucoin"', 'small') + (kcCanClear ? btn('Desconectar', 'data-vault-clear="kucoin"', 'small') : '') + '</div>' : '')
    + wrapCreds(!!ex.kucoin, 'Cambiar credenciales de KuCoin', kcForm)
    + '</div>';

  const krOn = !!(ex.kraken || ex.kraken_futures);
  const krCanClear = ('credentialSources' in (state.workerInfo || {})) ? (src.kraken === 'vault' || src.kraken_futures === 'vault') : krOn;
  const krEnvHtml = (src.kraken === 'env' || src.kraken_futures === 'env') ? '<span class="tag">Configurado en Cloudflare (secretos del Worker)</span>' : '';
  const krForm = '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">Kraken Spot API Key</span><input type="password" class="ch-input" id="vc-kr-key" ' + secAttrs + ' placeholder="KRAKEN_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Kraken Spot Private Key (Secret)</span><input type="password" class="ch-input" id="vc-kr-sec" ' + secAttrs + ' placeholder="KRAKEN_SECRET…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Kraken Futures API Key (opcional)</span><input type="password" class="ch-input" id="vc-krf-key" ' + secAttrs + ' placeholder="KRAKEN_FUTURES_KEY (futures.kraken.com)…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Kraken Futures Secret (opcional)</span><input type="password" class="ch-input" id="vc-krf-sec" ' + secAttrs + ' placeholder="KRAKEN_FUTURES_SECRET…"></label>'
    + '</div>'
    + '<div class="row ch-actions">'
    + btn(ico('sync') + 'Guardar y sincronizar ahora', 'data-vault-save="kraken"', 'primary')
    + btn('Importar historial API', 'data-act="sync-hist" data-id="kraken"', 'small')
    + (krCanClear ? btn('Desconectar', 'data-vault-clear="kraken"', 'small') : '')
    + '</div>';

  const paneKraken = '<div data-hub-pane="kraken"' + (curTab === 'kraken' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>Kraken · Spot, Margen y Kraken Futures</b><div class="ch-note">API oficial Kraken Pro &amp; Kraken Futures</div></div><div class="row">' + krEnvHtml + badge(ex.kraken, 'Spot') + badge(ex.kraken_futures, 'Futures') + '</div></div>'
    + '<div class="callout"><b>Solo lectura:</b> En Kraken Pro → <i>Settings → API</i>, marca únicamente <b>Query Funds</b>, <b>Query Open Orders &amp; Trades</b> y <b>Query Ledger Entries</b>. <b>Nunca</b> actives retirar fondos ni crear órdenes.</div>'
    + (krOn ? '<div class="row ch-actions">' + btn(ico('sync') + 'Sincronizar ahora', 'data-act="refresh"', 'primary small') + btn('Importar historial API', 'data-act="sync-hist" data-id="kraken"', 'small') + (krCanClear ? btn('Desconectar', 'data-vault-clear="kraken"', 'small') : '') + '</div>' : '')
    + wrapCreds(krOn, 'Cambiar credenciales de Kraken', krForm)
    + '</div>';

  const okxCanClear = isVault('okx', ex.okx);
  const okxForm = '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">OKX API Key</span><input type="password" class="ch-input" id="vc-okx-key" ' + secAttrs + ' placeholder="OKX_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">OKX Secret Key</span><input type="password" class="ch-input" id="vc-okx-sec" ' + secAttrs + ' placeholder="OKX_SECRET…"></label>'
    + '<label class="f ch-field"><span class="ch-label">OKX Passphrase</span><input type="password" class="ch-input" id="vc-okx-pass" ' + secAttrs + ' placeholder="OKX_PASSPHRASE…"></label>'
    + '</div>'
    + '<div class="row ch-actions">'
    + btn(ico('sync') + 'Guardar y sincronizar ahora', 'data-vault-save="okx"', 'primary')
    + (okxCanClear ? btn('Desconectar', 'data-vault-clear="okx"', 'small') : '')
    + '</div>';

  const paneOkx = '<div data-hub-pane="okx"' + (curTab === 'okx' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>OKX · Cuenta Unificada V5, Spot y Perpetuos</b><div class="ch-note">API V5 oficial · Balance unificado y posiciones de derivados</div></div><div class="row">' + envTag('okx') + badge(ex.okx) + '</div></div>'
    + '<div class="callout"><b>Solo lectura:</b> En OKX → <i>API → Create V5 API Key</i>, selecciona exclusivamente el permiso <b>Read</b>. <b>Nunca</b> marques <i>Trade</i> ni <i>Withdraw</i>.</div>'
    + (ex.okx ? '<div class="row ch-actions">' + btn(ico('sync') + 'Sincronizar ahora', 'data-act="refresh"', 'primary small') + (okxCanClear ? btn('Desconectar', 'data-vault-clear="okx"', 'small') : '') + '</div>' : '')
    + wrapCreds(!!ex.okx, 'Cambiar credenciales de OKX', okxForm)
    + '</div>';

  const bnCanClear = isVault('binance', ex.binance);
  const bnForm = '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">Binance API Key</span><input type="password" class="ch-input" id="vc-bn-key" ' + secAttrs + ' placeholder="BINANCE_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Binance Secret Key</span><input type="password" class="ch-input" id="vc-bn-sec" ' + secAttrs + ' placeholder="BINANCE_SECRET…"></label>'
    + '</div>'
    + '<div class="row ch-actions">'
    + btn(ico('sync') + 'Guardar y sincronizar ahora', 'data-vault-save="binance"', 'primary small')
    + (bnCanClear ? btn('Desconectar', 'data-vault-clear="binance"', 'small') : '')
    + '</div>';

  const bbCanClear = isVault('bybit', ex.bybit);
  const bbForm = '<div class="form">'
    + '<label class="f ch-field"><span class="ch-label">Bybit API Key</span><input type="password" class="ch-input" id="vc-bb-key" ' + secAttrs + ' placeholder="BYBIT_KEY…"></label>'
    + '<label class="f ch-field"><span class="ch-label">Bybit Secret Key</span><input type="password" class="ch-input" id="vc-bb-sec" ' + secAttrs + ' placeholder="BYBIT_SECRET…"></label>'
    + '</div>'
    + '<div class="row ch-actions">'
    + btn(ico('sync') + 'Guardar y sincronizar ahora', 'data-vault-save="bybit"', 'primary small')
    + (bbCanClear ? btn('Desconectar', 'data-vault-clear="bybit"', 'small') : '')
    + '</div>';

  const paneBinanceBybit = '<div data-hub-pane="binance-bybit"' + (curTab === 'binance-bybit' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>Binance · Spot, Fondos, Simple Earn y Futuros USDⓈ-M</b><div class="ch-note">Permiso exclusivo: Enable Reading (sin trading ni retiradas)</div></div><div class="row">' + envTag('binance') + badge(ex.binance) + '</div></div>'
    + (ex.binance ? '<div class="row ch-actions">' + btn(ico('sync') + 'Sincronizar Binance', 'data-act="refresh"', 'primary small') + (bnCanClear ? btn('Desconectar', 'data-vault-clear="binance"', 'small') : '') + '</div>' : '')
    + wrapCreds(!!ex.binance, 'Cambiar credenciales de Binance', bnForm)
    + '<div class="ch-head" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><div><b>Bybit · Cuenta Unificada V5 y Perpetuos USDT</b><div class="ch-note">Permiso exclusivo: Read-Only (Contract &amp; Spot, sin órdenes ni retiradas)</div></div><div class="row">' + envTag('bybit') + badge(ex.bybit) + '</div></div>'
    + (ex.bybit ? '<div class="row ch-actions">' + btn(ico('sync') + 'Sincronizar Bybit', 'data-act="refresh"', 'primary small') + (bbCanClear ? btn('Desconectar', 'data-vault-clear="bybit"', 'small') : '') + '</div>' : '')
    + wrapCreds(!!ex.bybit, 'Cambiar credenciales de Bybit', bbForm)
    + '</div>';

  const paneWallets = '<div data-hub-pane="wallets"' + (curTab === 'wallets' ? '' : ' style="display:none"') + '>'
    + '<div class="ch-head"><div><b>Wallets On-Chain y Brókeres</b><div class="ch-note">Bitcoin, Ethereum, Arbitrum, Base, Polygon, Solana y brókeres tradicionales</div></div><span class="tag ch-status-pill ok">Sin API key</span></div>'
    + '<p class="ch-note">Sigue direcciones públicas en modo de <b>solo lectura</b> (nunca se pide semilla ni clave privada) o añade cuentas de brókeres como Trade Republic, MyInvestor, Indexa o Interactive Brokers.</p>'
    + (wallets.length ? '<div class="list">' + wallets.map(w => '<div class="account-line"><span class="account-mark">' + ico('shield') + '</span><span><b>' + esc(w.name) + '</b><small>' + esc(String(w.chain || '').toUpperCase()) + ' · ' + esc(String(w.address || '').slice(0, 10) + '…' + String(w.address || '').slice(-6)) + '</small></span><span class="tag ok">Activa</span></div>').join('') + '</div>' : '')
    + '<div class="row ch-actions">'
    + btn(ico('shield') + 'Añadir wallet on-chain', 'data-act="add-wallet"', 'primary small')
    + btn(ico('plus') + 'Añadir cuenta / bróker', 'data-act="add-acc"', 'small')
    + btn(ico('upload') + 'Subir Excel / CSV', 'data-act="import"', 'small')
    + '</div></div>';

  modal('Conectar bancos, exchanges y wallets', workerBanner + lockedBanner + tabBar + paneBancos + paneKucoin + paneKraken + paneOkx + paneBinanceBybit + paneWallets);

  const mb = $('modal-body') || $('modalBody');
  if (!mb) return;
  $$('[data-hub-tab]', mb).forEach(tabBtn => {
    tabBtn.onclick = () => {
      const target = tabBtn.dataset.hubTab;
      $$('[data-hub-tab]', mb).forEach(b => {
        const isOn = b.dataset.hubTab === target;
        b.classList.toggle('on', isOn);
        b.setAttribute('aria-selected', isOn ? 'true' : 'false');
      });
      $$('[data-hub-pane]', mb).forEach(p => { p.style.display = p.dataset.hubPane === target ? '' : 'none'; });
    };
  });
  $$('[data-vault-save]', mb).forEach(saveBtn => {
    saveBtn.onclick = () => saveVaultCredentials(saveBtn.dataset.vaultSave);
  });
  $$('[data-vault-clear]', mb).forEach(clearBtn => {
    clearBtn.onclick = () => saveVaultCredentials(clearBtn.dataset.vaultClear, { clear: true });
  });
  $$('[data-hub-act="sync-banks"]', mb).forEach(syncBtn => {
    syncBtn.onclick = () => syncConnectedBanks(true);
  });
}
