// ===== Navegación, ventanas modales, acciones, gestos y arranque =====
"use strict";

const VIEWS = [
  ['resumen', 'Inicio', 'home'],
  ['movimientos', 'Movimientos', 'list'],
  ['inversiones', 'Mercados', 'chart'],
  ['cuentas', 'Cuentas', 'bank'],
  ['copiloto', 'Copiloto IA', 'brain'],
  ['objetivos', 'Plan y Alertas', 'target'],
  ['impuestos', 'Impuestos', 'tax'],
  ['ajustes', 'Ajustes', 'gear']
];
const TABS = [
  ['resumen', 'Inicio', 'home'],
  ['movimientos', 'Movimientos', 'list'],
  ['inversiones', 'Mercados', 'chart'],
  ['cuentas', 'Cuentas', 'bank'],
  ['copiloto', 'Copiloto', 'brain']
];
const CORE_VIEWS = TABS.map(x => x[0]);

const vResumen = () => narrow() ? vResumenMobile() : vResumenDesktop();
const vMovs = () => narrow() ? vMovsMobile() : vMovsDesktop();
const vInv = () => narrow() ? vInvMobile() : vInvDesktop();
const vCuentas = () => narrow() ? vCuentasMobile() : vCuentasDesktop();
const vCopilot = () => narrow() ? vCopilotMobile() : vCopilotDesktop();
const vGoals = () => vGoalsDesktop();
const vMas = () => vMasDesktop();

function go(v, f) {
  closeDrawer();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, old = view;
  if (f) filt = { ...filt, day: '', ...f };
  else if (v === 'movimientos' && view !== 'movimientos') {
    filt.day = ''; filt.cat = ''; filt.acc = ''; filt.q = '';
    if (!filt.type) filt.type = 'out';
  }
  if (v !== 'cuentas') activeAccId = '';
  view = v;
  render();
  window.scrollTo({ top: 0 });
  try { history.replaceState(null, '', '#' + v); } catch (e) { }
  if (v === 'inversiones' && chartMode === 'candles') loadOHLCV(selectedSymbol, chartInterval);
  if (!reduce && old !== v && $('main').animate) {
    $('main').animate([{ opacity: .82 }, { opacity: 1 }], { duration: 140, easing: 'ease-out' });
  }
}

function navBtn(id, n, i, clsName = 'nav') {
  const alCount = id === 'objetivos' ? (state.priceAlerts || []).filter(x => x.active).length : 0;
  return '<button class="' + clsName + '" type="button" data-go="' + id + '"' + (view === id ? ' aria-current="page"' : '') + '>' + ico(i) + '<span>' + n + '</span>' + (alCount ? '<span class="nav-badge">' + alCount + '</span>' : '') + '</button>';
}
function sideNav() {
  return '<div class="nav-group-label">Principal</div>'
    + navBtn('resumen', 'Inicio', 'home')
    + navBtn('movimientos', 'Movimientos', 'list')
    + navBtn('inversiones', 'Mercados', 'chart')
    + navBtn('cuentas', 'Cuentas', 'bank')
    + navBtn('copiloto', 'Copiloto', 'brain')
    + '<div class="nav-group-label">Control</div>'
    + navBtn('objetivos', 'Plan y Alertas', 'target')
    + navBtn('impuestos', 'Impuestos', 'tax')
    + navBtn('ajustes', 'Ajustes', 'gear');
}
function sideAccountsHTML() {
  if (!state.accounts.length) return '';
  const nw = netWorth();
  const isB = a => a.kind === 'bank' || a.kind === 'cash';
  const accs = state.accounts.slice().sort((a, b) => (isB(b) - isB(a)) || (accValue(b, nw.rows) - accValue(a, nw.rows))).slice(0, 8);
  return '<div class="nav-group-label side-acc-head"><span>Cuentas</span><button type="button" class="side-add-btn" data-act="connect-hub" title="Conectar cuenta" aria-label="Conectar cuenta">+</button></div>'
    + accs.map(a => {
      const ik = instKey(a), cur = view === 'cuentas' && activeAccId === a.id;
      return '<button type="button" class="side-acc" data-acc="' + a.id + '"' + (cur ? ' aria-current="true"' : '') + '>'
        + '<i class="cat-dot sm k-' + a.kind + (ik ? ' inst-' + ik : '') + '"></i>'
        + '<span class="side-acc-name">' + esc(a.name) + '</span>'
        + '<span class="side-acc-val">' + money(accValue(a, nw.rows), { d: 0 }) + '</span>'
        + '</button>';
    }).join('');
}
function drawerNav() { return sideNav(); }

function renderNav() {
  $('nav-side').innerHTML = sideNav() + sideAccountsHTML();
  if ($('nav-drawer')) $('nav-drawer').innerHTML = drawerNav();
  $('nav-tabs').innerHTML = TABS.map(([id, n, i]) => '<button type="button" data-go="' + id + '"' + (view === id ? ' aria-current="page"' : '') + '>' + ico(i) + '<span>' + n + '</span></button>').join('');
  const dark = document.documentElement.dataset.theme !== 'light', hid = !!state.settings.hide;
  for (const id of ['theme-side', 'theme-top', 'theme-top-desktop']) if ($(id)) $(id).innerHTML = ico(dark ? 'sun' : 'moon');
  for (const id of ['hide-side', 'hide-top', 'hide-top-desktop']) if ($(id)) $(id).innerHTML = ico(hid ? 'eyeoff' : 'eye');
  if ($('ver-side')) $('ver-side').textContent = APP_VERSION;
  if ($('ver-badge')) $('ver-badge').textContent = APP_VERSION;
  if ($('ver-drawer')) $('ver-drawer').textContent = APP_VERSION;
  if ($('mobile-title')) $('mobile-title').textContent = (VIEWS.find(x => x[0] === view) || ['', 'Finanzas'])[1];
  paintSync();
}

function render() {
  const th = state.settings.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : state.settings.theme;
  document.documentElement.dataset.theme = th;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', th === 'light' ? '#f6f5f1' : '#09090b');
  document.body.classList.toggle('hide-amounts', !!state.settings.hide);
  document.body.dataset.view = view;
  renderNav();
  if (!narrow()) renderDesktopTopbar();
  if ($('ai-drawer')?.classList.contains('open')) renderAIDrawer();
  const f = { resumen: vResumen, movimientos: vMovs, inversiones: vInv, copiloto: vCopilot, objetivos: vGoals, impuestos: vTax, cuentas: vCuentas, ajustes: vAjustes, mas: vMas }[view] || vResumen;
  $('main').innerHTML = f();
  afterRender();
}

// ===== PWA =====
let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });
addEventListener('appinstalled', () => { installPrompt = null; toast('Finanzas instalada. Ábrela desde tus aplicaciones.'); });
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function installState() { return isStandalone() ? 'instalada' : installPrompt ? 'disponible' : 'navegador'; }
async function installApp() {
  if (isStandalone()) return toast('Ya estás usando la app instalada.');
  if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; return; }
  modal('Instalar o recuperar la app', '<ol class="steps"><li><div><b>Busca Finanzas en el cajón de aplicaciones.</b><br><span class="muted">Si Android dice «ya existe», la PWA sigue instalada aunque hayas quitado su icono.</span></div></li><li><div><b>Si no aparece:</b> Chrome → ⋮ → Información de la aplicación → Desinstalar.</div></li><li><div>Vuelve a esta web, recarga y pulsa <b>Instalar app</b>. El identificador se mantiene estable.</div></li></ol>');
}
async function repairPWA() {
  if (!confirm('Esto limpia solo la caché de la app y recarga. Tus datos financieros guardados no se borran. ¿Continuar?')) return;
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); for (const k of await caches.keys()) if (k.startsWith('finanzas-')) await caches.delete(k); } catch (e) { }
  location.reload();
}

// ===== Modales de edición, derivados, wallets, watchlist, detalle y búsqueda =====
function modal(title, html) {
  $('modal').classList.remove('asset-dialog');
  $('modal-title').innerHTML = title;
  $('modal-body').innerHTML = html;
  if (!$('modal').open) $('modal').showModal();
  $('modal-body').scrollTop = 0;
}

function editTx(id) {
  const t = state.tx.find(x => x.id === id); if (!t) return quickAdd();
  const mer = merchantOf(t.desc), same = state.tx.filter(x => merchantOf(x.desc) === mer).length;
  modal(esc(mer), '<div class="big ' + (t.amount > 0 ? 'up' : '') + ' mb-10">' + money(t.amount, { sign: true }) + '</div><p class="muted m-0">' + fmtDate(t.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + esc(accName(t.acc)) + '</p><p class="faint mt-4 mb-12">' + esc(t.desc) + '</p>'
    + '<div class="label mt-0">Categoría</div><div class="catgrid" id="tx-cats">' + CATS.map(c => '<button type="button" class="chip" data-pick="' + c.id + '" aria-pressed="' + (c.id === t.cat) + '"><i style="background:var(' + c.color + ')"></i>' + esc(c.name) + '</button>').join('') + '</div><input type="hidden" id="tx-cat" value="' + t.cat + '">'
    + (same > 1 ? '<label class="row mt-12"><input type="checkbox" id="tx-all" checked> Aplicar a los ' + same + ' movimientos de «' + esc(mer) + '» y a los futuros</label>' : '')
    + '<label class="f mt-12">Nota<input type="text" id="tx-note" value="' + esc(t.note || '') + '" placeholder="Opcional"></label>'
    + '<details class="mt-12"><summary>Editar importe, fecha o concepto</summary><div class="form mt-10"><label class="f">Importe (€)<input type="number" step="any" id="tx-amt" value="' + t.amount + '"></label><label class="f">Fecha<input type="date" id="tx-date" value="' + t.date.slice(0, 10) + '"></label><label class="f wide">Concepto<input type="text" id="tx-desc" value="' + esc(t.desc) + '"></label></div></details>'
    + '<div class="row mt-16">' + btn('Guardar', 'data-act="tx-save" data-id="' + t.id + '"', 'primary') + btn('Eliminar', 'data-act="tx-del" data-id="' + t.id + '"', 'danger') + '</div>');
}

let qType = 'out';
function quickAdd() {
  const accs = state.accounts.filter(a => a.kind === 'bank' || a.kind === 'cash');
  if (qType === 'xfer' && accs.length < 2) qType = 'out';
  const kind = qType === 'out' ? 'expense' : 'income', cats = CATS.filter(c => c.kind === kind);
  const recent = [...new Set(state.tx.filter(t => catById(t.cat).kind === kind).sort((a, b) => b.date.localeCompare(a.date)).map(t => t.cat))];
  const suggested = [...recent, ...cats.map(c => c.id)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 6), selected = suggested[0] || cats[0].id;
  const title = qType === 'out' ? 'Añadir gasto' : qType === 'in' ? 'Añadir ingreso' : 'Traspaso entre cuentas';
  const tabs = '<div class="quick' + (accs.length >= 2 ? ' cols-3' : '') + '"><button type="button" data-qtype="out" aria-pressed="' + (qType === 'out') + '">' + ico('coin') + 'Gasto</button><button type="button" data-qtype="in" aria-pressed="' + (qType === 'in') + '">' + ico('trend') + 'Ingreso</button>' + (accs.length >= 2 ? '<button type="button" data-qtype="xfer" aria-pressed="' + (qType === 'xfer') + '">' + ico('repeat') + 'Traspaso</button>' : '') + '</div>';
  const catFields = qType === 'xfer'
    ? '<div class="form mt-12"><label class="f">Cuenta origen<select id="q-acc">' + accs.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('') + '</select></label><label class="f">Cuenta destino<select id="q-acc-to">' + accs.map((a, i) => '<option value="' + a.id + '"' + (i === 1 ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select></label><label class="f wide">Fecha<input type="date" id="q-date" value="' + today() + '"></label></div>'
    : '<div class="label">Categoría</div><div class="quick-cats">' + suggested.map(id => { const c = catById(id); return '<button type="button" class="quick-cat" data-qcat="' + c.id + '" aria-pressed="' + (c.id === selected) + '"><i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(' + c.color + ');margin-right:6px"></i>' + esc(c.name) + '</button>'; }).join('') + '</div>'
      + '<label class="f mt-8">Todas las categorías<select id="q-cat">' + cats.map(c => '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></label>'
      + '<div class="form mt-12"><label class="f">Fecha<input type="date" id="q-date" value="' + today() + '"></label><label class="f">Cuenta<select id="q-acc">' + accs.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('') + '<option value="__cash">' + (accs.some(a => a.kind === 'cash') ? '+ Otra de efectivo' : 'Efectivo (nueva)') + '</option></select></label></div>';
  modal(title, tabs
    + '<input type="text" inputmode="decimal" id="q-amt" class="amount-in" placeholder="0,00 €" autocomplete="off" aria-label="Importe">'
    + '<label class="f mt-12">Concepto<input type="text" id="q-desc" placeholder="' + (qType === 'out' ? 'Ej.: café, cena, taxi…' : qType === 'in' ? 'Ej.: venta, regalo…' : 'Traspaso entre cuentas') + '"></label>'
    + catFields
    + '<button type="button" class="btn primary full mt-16" data-act="q-save">Guardar ' + (qType === 'out' ? 'gasto' : qType === 'in' ? 'ingreso' : 'traspaso') + '</button>'
    + '<div class="row mt-10 center">' + btn(ico('upload') + 'Importar extracto', 'data-act="import"', 'ghost small') + btn(ico('chart') + 'Operación inversión', 'data-act="add-op"', 'ghost small') + btn(ico('trend') + 'Derivado', 'data-act="add-deriv"', 'ghost small') + '</div>');
  setTimeout(() => $('q-amt')?.focus(), 60);
}

function editOp(id) {
  const l = state.ledger.find(x => x.id === id), accs = state.accounts.filter(a => a.kind !== 'bank');
  const v = l || { acc: accs[0]?.id || '', t: today() + ' 12:00:00', asset: '', change: 0, kind: 'trade' };
  modal(l ? 'Operación' : 'Añadir operación', (accs.length ? '' : '<p class="callout">Primero crea una cuenta de exchange, bróker o monedero en Cuentas.</p>') + '<div class="form">'
    + '<label class="f">Cuenta<select id="op-acc">' + accs.map(a => '<option value="' + a.id + '"' + (a.id === v.acc ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('') + '</select></label>'
    + '<label class="f">Fecha<input type="date" id="op-date" value="' + v.t.slice(0, 10) + '"></label>'
    + (l ? '<label class="f">Activo<input type="text" id="op-asset" value="' + esc(v.asset) + '"></label><label class="f">Cambio (con signo)<input type="number" step="any" id="op-qty" value="' + v.change + '"></label><label class="f wide">Tipo<select id="op-kind">' + Object.entries(OPK).map(([k, n]) => '<option value="' + k + '"' + (k === v.kind ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>'
      : '<label class="f">Tipo<select id="op-kind"><option value="buy">Compra</option><option value="sell">Venta</option><option value="deposit">Ya lo tenía / depósito</option><option value="reward">Recompensa (staking, interés)</option><option value="withdraw">Retirada</option></select></label>'
        + '<label class="f">Activo<input type="text" id="op-asset" placeholder="BTC, ETH, VWCE…"></label><label class="f">Cantidad<input type="number" step="any" id="op-qty"></label>'
        + '<label class="f">Importe total en euros<input type="number" step="any" id="op-eur" placeholder="Lo que pagaste o cobraste"></label><label class="f">Comisión (€)<input type="number" step="any" id="op-fee" value="0"></label>')
    + '</div><div class="row" style="margin-top:12px">' + btn('Guardar', 'data-act="op-save" data-id="' + (l ? l.id : '') + '"', 'primary') + (l ? btn('Eliminar', 'data-act="op-del" data-id="' + l.id + '"', 'danger') : '') + '</div>');
}

function editDeriv(id) {
  const d = state.derivs.find(x => x.id === id) || { id: '', acc: '', instr: '', type: 'perpetuo', side: 'long', size: '', entry: '', lev: '', margin: '', liq: '', markSym: '', quote: 'USD' };
  const f = (k, l, t = 'number', x = '') => '<label class="f">' + l + '<input type="' + t + '" step="any" id="dv-' + k + '" value="' + esc(d[k] ?? '') + '" ' + x + '></label>';
  modal(d.id ? esc(d.instr) : 'Nueva posición de derivado', '<div class="form">' + f('instr', 'Instrumento', 'text', 'placeholder="BTCUSDT perpetuo, ETHUSDTM, AAPL call…"')
    + '<label class="f">Tipo<select id="dv-type">' + ['perpetuo', 'futuro', 'margen', 'opción', 'CFD', 'otro'].map(x => '<option' + (x === d.type ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>'
    + '<label class="f">Lado<select id="dv-side"><option value="long"' + (d.side === 'long' ? ' selected' : '') + '>Largo (Long)</option><option value="short"' + (d.side === 'short' ? ' selected' : '') + '>Corto (Short)</option></select></label>'
    + f('size', 'Tamaño (unidades del subyacente)') + f('entry', 'Precio de entrada') + f('lev', 'Apalancamiento (ej. 5)') + f('margin', 'Margen bloqueado') + f('liq', 'Precio de liquidación (opcional)')
    + '<label class="f">Moneda<select id="dv-quote"><option' + (d.quote !== 'EUR' ? ' selected' : '') + '>USD</option><option' + (d.quote === 'EUR' ? ' selected' : '') + '>EUR</option></select></label>'
    + f('markSym', 'Precio en directo de (símbolo)', 'text', 'placeholder="BTC"') + f('mark', 'O precio actual manual')
    + f('closeDate', 'Fecha de cierre (si ya cerró)', 'date') + f('exit', 'Precio de salida') + f('fees', 'Comisiones y funding')
    + '</div><div class="row" style="margin-top:14px">' + btn('Guardar', 'data-act="dv-save" data-id="' + d.id + '"', 'primary') + (d.id ? btn('Eliminar', 'data-act="dv-del" data-id="' + d.id + '"', 'danger') : '') + '</div>');
}
function closeDerivModal(id) {
  const d = state.derivs.find(x => x.id === id); if (!d) return;
  const sym = d.markSym || baseSym(d.instr), live = d.quote === 'EUR' ? priceEUR(sym) : state.prices[sym]?.usd;
  modal('Cerrar ' + esc(d.instr), '<div class="form"><label class="f">Fecha de cierre<input type="date" id="dvc-date" value="' + today() + '"></label><label class="f">Precio de salida<input type="number" step="any" id="dvc-exit" value="' + esc(live || d.mark || d.entry) + '"></label><label class="f wide">Comisiones / funding totales<input type="number" step="any" id="dvc-fees" value="' + esc(d.fees || 0) + '"></label></div><p class="note">Al cerrarlo pasa al historial fiscal del ejercicio correspondiente.</p><div class="row" style="margin-top:14px">' + btn('Confirmar cierre', 'data-act="dv-close-save" data-id="' + d.id + '"', 'primary') + '</div>');
}

function editAcc(id) {
  const a = accById(id) || { id: '', name: '', kind: 'wallet', inst: '', currency: 'EUR', manualBal: '' };
  modal(a.id ? esc(a.name) : 'Nueva cuenta', '<div class="form"><label class="f wide">Nombre<input type="text" id="ac-name" value="' + esc(a.name) + '"></label>'
    + '<label class="f">Tipo<select id="ac-kind">' + Object.entries(KIND_NAMES).map(([k, n]) => '<option value="' + k + '"' + (k === a.kind ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>'
    + '<label class="f">Entidad<input type="text" id="ac-inst" value="' + esc(a.inst || '') + '" placeholder="Santander, KuCoin, Kraken, Revolut…"></label>'
    + '<label class="f" id="ac-bal-w">Saldo inicial o manual (€)<input type="number" step="any" id="ac-bal" value="' + esc(a.manualBal ?? '') + '"></label>'
    + '<label class="f wide row" style="gap:8px"><input type="checkbox" id="ac-rs"' + (a.reportsSpain ? ' checked' : '') + '> Esta plataforma informa a Hacienda (entidad española). Si no, cuenta para el modelo 721.</label>'
    + (a.api ? '<label class="f wide row" style="gap:8px"><input type="checkbox" id="ac-api"' + (a.useApi !== false ? ' checked' : '') + '> Usar los saldos de la API</label>' : '')
    + '</div><div class="row" style="margin-top:12px">' + btn('Guardar', 'data-act="acc-save" data-id="' + a.id + '"', 'primary') + (a.id ? btn('Eliminar con sus datos', 'data-act="acc-del" data-id="' + a.id + '"', 'danger') : '') + '</div>');
}

function editWalletModal() {
  modal('Añadir wallet On-Chain (gratis)', '<p class="muted">Consulta balances públicos en bloque sin claves privadas ni comisiones.</p><div class="form">'
    + '<label class="f">Red<select id="wl-chain"><option value="btc">Bitcoin (mempool.space)</option><option value="eth">Ethereum (EVM + tokens)</option><option value="arb">Arbitrum</option><option value="base">Base</option><option value="pol">Polygon</option><option value="sol">Solana</option></select></label>'
    + '<label class="f">Nombre<input type="text" id="wl-name" placeholder="Ej.: Ledger BTC, MetaMask…"></label>'
    + '<label class="f wide">Dirección pública<input type="text" id="wl-addr" placeholder="bc1… / 0x… / dirección Solana"></label>'
    + '</div><div class="row" style="margin-top:14px">' + btn('Guardar y consultar saldo', 'data-act="wallet-save"', 'primary') + '</div>');
}

function editGoal(id) {
  const g = state.goals.find(x => x.id === id) || { id: '', name: '', target: '', saved: '', acc: '', date: '' };
  modal(g.id ? esc(g.name) : 'Nuevo bolsillo', '<div class="form"><label class="f wide">Nombre<input type="text" id="g-name" value="' + esc(g.name) + '" placeholder="Viaje a Japón, colchón, coche…"></label>'
    + '<label class="f">Cuánto quieres reunir (€)<input type="number" step="any" id="g-target" value="' + esc(g.target) + '"></label><label class="f">Para cuándo (opcional)<input type="date" id="g-date" value="' + esc(g.date || '') + '"></label>'
    + '<label class="f wide">Cómo se mide lo ahorrado<select id="g-acc"><option value="">Lo apunto yo a mano</option>' + state.accounts.map(a => '<option value="' + a.id + '"' + (a.id === g.acc ? ' selected' : '') + '>Saldo de «' + esc(a.name) + '»</option>').join('') + '</select></label>'
    + '<label class="f wide" id="g-saved-w">Lo que llevas ahorrado (€)<input type="number" step="any" id="g-saved" value="' + esc(g.saved) + '"></label></div>'
    + '<div class="row" style="margin-top:16px">' + btn('Guardar', 'data-act="goal-save" data-id="' + g.id + '"', 'primary') + (g.id ? btn('Eliminar', 'data-act="goal-del" data-id="' + g.id + '"', 'danger') : '') + '</div>');
  const syncW = () => { $('g-saved-w').hidden = !!$('g-acc').value; }; $('g-acc').onchange = syncW; syncW();
}

function editPriceAlertModal(defaultSym = selectedSymbol || 'BTC') {
  const p = priceEUR(defaultSym);
  modal('Nueva alerta de precio en directo', '<div class="form">'
    + '<label class="f">Activo<input type="text" id="pa-sym" value="' + esc(defaultSym) + '" placeholder="BTC, ETH, VWCE.DE…"></label>'
    + '<label class="f">Condición<select id="pa-dir"><option value="above">Cuando suba a (≥ €)</option><option value="below">Cuando baje a (≤ €)</option></select></label>'
    + '<label class="f wide">Precio objetivo en €<input type="number" step="any" id="pa-target" value="' + (p ? round(p * 1.05, p < 1 ? 4 : 2) : '') + '"></label>'
    + '</div><p class="note">Se evalúa al instante con el stream en directo y con cada actualización de precios.</p><div class="row" style="margin-top:14px">' + btn('Crear alerta', 'data-act="pa-save"', 'primary') + '</div>');
}

function openAddWatchModal() {
  modal('Buscar y seguir activo', '<div class="search">' + ico('search') + '<input type="search" id="wl-q" placeholder="BTC, SOL, VWCE.DE, AAPL, SAN.MC…" autofocus></div><div id="wl-res" style="margin-top:12px"></div>');
  const run = async () => {
    const q = val('wl-q').trim() || 'BTC';
    const items = await searchTickers(q);
    $('wl-res').innerHTML = (items.length ? items : [{ symbol: q.toUpperCase(), name: q.toUpperCase(), cls: 'stock' }]).map(x => '<button type="button" class="account-line" data-pick-watch="' + esc(x.symbol) + '" data-watch-cls="' + esc(x.cls || 'crypto') + '" data-watch-name="' + esc(x.name || x.symbol) + '"><span class="account-mark">' + esc(x.symbol.slice(0, 4)) + '</span><span><b>' + esc(x.symbol) + '</b><small>' + esc(x.name || '') + '</small></span><span class="tag brand">Seguir</span></button>').join('');
    $$('[data-pick-watch]', $('wl-res')).forEach(b => {
      b.onclick = () => {
        const sym = b.dataset.pickWatch.toUpperCase();
        change(() => {
          state.assets[sym] = state.assets[sym] || { cls: b.dataset.watchCls || 'crypto', name: b.dataset.watchName || sym, yahoo: sym.includes('.') ? sym : '' };
          state.watchlist[sym] = { sym, added: Date.now() };
          selectedSymbol = sym;
        }, sym + ' añadido a seguimiento');
        $('modal').close(); refreshPrices(true); loadOHLCV(sym, chartInterval, true);
      };
    });
  };
  $('wl-q').oninput = () => { clearTimeout($('wl-q')._t); $('wl-q')._t = setTimeout(run, 250); };
  run();
}

function assetIntelHTML(sym) {
  const d = state.market[sym];
  if (!d) return '<div class="row" style="margin-top:12px">' + btn(ico('gauge') + 'Cargar técnico y noticias', 'data-act="asset-intel" data-id="' + esc(sym) + '"', 'primary small') + '</div>';
  const t = calcTechnical((d.series || []).map(x => +x[1]));
  return '<section style="margin-top:16px"><div class="module-title"><b>Lectura técnica diaria</b></div><div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">'
    + '<div class="stat"><small>RSI 14</small><b>' + nf(t.rsi, 0) + '</b></div><div class="stat"><small>SMA 20</small><b>' + nf(t.sma20 || 0, 2) + '</b></div><div class="stat"><small>SMA 50</small><b>' + nf(t.sma50 || 0, 2) + '</b></div><div class="stat"><small>Volatilidad</small><b>' + nf(t.vol, 0) + ' %</b></div><div class="stat"><small>Máx. caída</small><b class="down">' + nf(t.dd, 0) + ' %</b></div></div><p class="note">' + esc(t.trend) + '</p></section>'
    + (d.news?.length ? '<section style="margin-top:14px"><div class="module-title"><b>Noticias recientes</b></div>' + d.news.slice(0, 6).map(n => '<a class="account-line" href="' + esc(n.url) + '" target="_blank" rel="noopener noreferrer"><span class="account-mark">' + ico('news') + '</span><span><b>' + esc(n.title) + '</b><small>' + esc(n.publisher || 'Fuente externa') + '</small></span>' + ico('ext') + '</a>').join('') + '</section>' : '');
}

function assetDetail(sym) {
  const a = state.assets[sym] || {}, rows = positionRows().filter(r => r.asset === sym), cb = costBasis()[sym], ops = state.ledger.filter(l => l.asset === sym).sort((x, y) => y.t.localeCompare(x.t)), pr = priceEUR(sym), chg = state.prices[sym]?.chg;
  modal(esc(a.name || sym), '<div class="quote-head"><div><span class="tag ok">Tiempo real</span><div class="big" data-live-price="' + esc(sym) + '">' + (pr ? money(pr, { d: pr < 1 ? 4 : 2 }) : 'Sin precio') + '</div>' + (chg != null ? '<span class="pill ' + cls(chg) + '" data-live-chg="' + esc(sym) + '">' + pct(chg) + ' hoy</span>' : '') + '</div><div style="text-align:right"><b>' + money(sum(rows.map(r => r.eur)), { d: 0 }) + '</b><small class="faint" style="display:block">tu posición</small><div class="row" style="margin-top:6px;justify-content:flex-end">' + btn(ico('bell') + 'Alerta', 'data-act="add-price-alert" data-id="' + esc(sym) + '"', 'small') + '</div></div></div>'
    + '<iframe class="tv-frame" title="Gráfico en tiempo real de ' + esc(sym) + '" loading="lazy" referrerpolicy="origin" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="' + esc(tradingViewURL(sym)) + '"></iframe>'
    + assetIntelHTML(sym)
    + '<div class="kv" style="margin-top:16px">' + rows.map(r => '<dt>' + esc(accName(r.acc)) + '</dt><dd>' + nf(r.qty, 8, 0) + ' · ' + money(r.eur) + '</dd>').join('') + '</div>'
    + (cb ? '<p class="note">Coste FIFO restante: ' + money(cb.cost) + ' por ' + nf(cb.qty, 8, 0) + ' (' + nf(cb.qty ? cb.cost / cb.qty : 0, 4, 2) + ' €/u).' + (cb.missing ? ' Falta coste en algún depósito.' : '') + '</p>' : '')
    + '<details style="margin-top:16px"><summary>Ajustar activo y símbolo</summary><div class="form" style="margin-top:12px"><label class="f">Tipo de activo<select id="as-cls">' + ['crypto', 'stable', 'etf', 'fund', 'stock', 'bond', 'other'].map(c => '<option value="' + c + '"' + (assetCls(sym) === c ? ' selected' : '') + '>' + CLASS_NAMES[c] + '</option>').join('') + '</select></label>'
    + '<label class="f">Ticker Yahoo<input type="text" id="as-yahoo" value="' + esc(a.yahoo || '') + '" placeholder="Ej.: VWCE.DE, AAPL"></label><label class="f">Símbolo TradingView<input type="text" id="as-tv" value="' + esc(a.tv || tvSymbol(sym)) + '" placeholder="Ej.: BINANCE:BTCUSDT"></label><label class="f">Nombre<input type="text" id="as-name" value="' + esc(a.name || '') + '"></label></div><div class="row" style="margin-top:10px">' + btn('Guardar', 'data-act="asset-save" data-id="' + esc(sym) + '"', 'primary') + '</div></details>'
    + '<details style="margin-top:16px"><summary>Operaciones (' + ops.length + ')</summary>' + opsTable(ops) + '</details>');
  $('modal').classList.add('asset-dialog');
}

function openCommandPalette() {
  modal('Ir a o buscar…', '<div class="search">' + ico('search') + '<input type="search" id="cmd-in" placeholder="Escribe pantalla, cuenta, activo o acción…" autofocus></div><div class="cmd-list" id="cmd-list"></div>');
  const items = [
    ...VIEWS.map(([id, n]) => ({ t: n, sub: 'Pantalla', run: () => go(id) })),
    ...state.accounts.map(a => ({ t: a.name, sub: KIND_NAMES[a.kind] || 'Cuenta', run: () => { activeAccId = a.id; go('cuentas'); } })),
    ...trackedAssets().map(s => ({ t: s + (state.assets[s]?.name ? ' · ' + state.assets[s].name : ''), sub: 'Activo / Gráfico', run: () => { selectedSymbol = s; go('inversiones'); } })),
    { t: 'Añadir gasto, ingreso o traspaso', sub: 'Acción rápida', run: () => quickAdd() },
    { t: 'Nuevo derivado / posición', sub: 'Acción rápida', run: () => editDeriv('') },
    { t: 'Conectar banco, exchange o wallet', sub: 'Conexiones', run: () => openConnectHub() },
    { t: 'Importar archivo o captura', sub: 'Importador', run: () => $('file-in').click() },
    { t: 'Cambiar tema claro u oscuro', sub: 'Preferencia', run: () => act('theme', document.body) },
    { t: 'Activar u ocultar modo privacidad', sub: 'Privacidad', run: () => act('hide', document.body) },
    { t: 'Exportar movimientos filtrados (CSV)', sub: 'Exportar', run: () => act('export-tx-csv', document.body) },
    { t: 'Descargar copia de seguridad (JSON)', sub: 'Copia local', run: () => act('export', document.body) }
  ];
  let sel = 0, curList = [];
  const syncSel = () => {
    const btns = $$('[data-cmd-i]', $('cmd-list'));
    btns.forEach((b, i) => b.classList.toggle('on', i === sel));
    btns[sel]?.scrollIntoView({ block: 'nearest' });
  };
  const paint = () => {
    const q = val('cmd-in').toLowerCase();
    curList = items.filter(x => !q || x.t.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q)).slice(0, 12);
    sel = 0;
    $('cmd-list').innerHTML = curList.map((x, i) => '<button type="button" class="cmd-item' + (i === 0 ? ' on' : '') + '" data-cmd-i="' + i + '"><b>' + esc(x.t) + '</b><small>' + esc(x.sub) + '</small></button>').join('') || '<p class="muted">Sin coincidencias.</p>';
    $$('[data-cmd-i]', $('cmd-list')).forEach(b => {
      b.onclick = () => { $('modal').close(); curList[+b.dataset.cmdI].run(); };
    });
  };
  $('cmd-in').oninput = paint;
  $('cmd-in').onkeydown = e => {
    if (!curList.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % curList.length; syncSel(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + curList.length) % curList.length; syncSel(); }
    else if (e.key === 'Enter') { e.preventDefault(); $('modal').close(); curList[sel]?.run(); }
  };
  paint();
  setTimeout(() => $('cmd-in')?.focus(), 40);
}

// ===== Drawer móvil, Drawer IA y Gestos =====
function toggleAIDrawer(force) {
  const d = $('ai-drawer'), b = $('ai-drawer-backdrop'); if (!d || !b) return;
  const open = force != null ? force : !d.classList.contains('open');
  d.classList.toggle('open', open); b.classList.toggle('open', open);
  d.setAttribute('aria-hidden', String(!open));
  if (open) renderAIDrawer();
}
function resetDrawerGesture() { const d = $('mobile-drawer'), s = $('drawer-scrim'); if (!d) return; d.classList.remove('gesture'); s.classList.remove('gesture'); d.style.transform = ''; s.style.opacity = ''; }
function openDrawer() { const d = $('mobile-drawer'), s = $('drawer-scrim'); if (!d) return; resetDrawerGesture(); d.classList.add('open'); s.classList.add('open'); d.setAttribute('aria-hidden', 'false'); document.querySelector('[data-act=drawer]')?.setAttribute('aria-expanded', 'true'); }
function closeDrawer() { const d = $('mobile-drawer'), s = $('drawer-scrim'); if (!d) return; resetDrawerGesture(); d.classList.remove('open'); s.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); document.querySelector('[data-act=drawer]')?.setAttribute('aria-expanded', 'false'); }

let gesture = null, lastSwipe = 0;
function gestureStart(e) {
  if (innerWidth >= 1024 || e.isPrimary === false || (e.pointerType === 'mouse' && e.buttons === 0)) return;
  const modalOpen = $('modal')?.open, target = e.target;
  if (modalOpen) {
    if (!target.closest('input,select,textarea,.tv-frame') && (target.closest('.dlg-h') || ($('modal-body')?.scrollTop || 0) <= 2)) gesture = { mode: 'sheet', x: e.clientX, y: e.clientY, id: e.pointerId };
    return;
  }
  if ($('mobile-drawer')?.classList.contains('open')) { gesture = { mode: 'drawer', x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
  if (e.clientX <= 48) { gesture = { mode: 'edge', x: e.clientX, y: e.clientY, id: e.pointerId }; return; }
  if (e.pointerType === 'mouse' || target.closest('input,select,textarea,.ichart,.m-carousel,.scroll,.months,.catgrid,.quick-cats,.ai-suggestions')) return;
  gesture = { mode: 'page', x: e.clientX, y: e.clientY, id: e.pointerId };
}
function gestureMove(e) {
  if (!gesture || (gesture.id != null && e.pointerId != null && e.pointerId !== gesture.id)) return;
  const dx = e.clientX - gesture.x, dy = e.clientY - gesture.y; gesture.dx = dx; gesture.dy = dy;
  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
  if (gesture.mode === 'page' && dx > 14 && Math.abs(dx) > Math.abs(dy) * 1.25 && (CORE_VIEWS.indexOf(view) <= 0)) gesture.mode = 'edge';
  if (gesture.mode === 'edge') {
    if (dx <= 0 || Math.abs(dy) > Math.abs(dx) * 1.25) return; e.preventDefault(); gesture.swiped = true;
    const d = $('mobile-drawer'), w = d.offsetWidth || 320, x = Math.min(w, dx);
    d.classList.add('gesture'); $('drawer-scrim').classList.add('gesture', 'open'); d.style.transform = 'translateX(' + (-w + x) + 'px)'; $('drawer-scrim').style.opacity = String(x / w * 0.9);
  } else if (gesture.mode === 'drawer') {
    if (dx >= 0 || Math.abs(dy) > Math.abs(dx) * 1.25) return; e.preventDefault(); gesture.swiped = true;
    const d = $('mobile-drawer'), w = d.offsetWidth || 320, x = Math.max(-w, dx);
    d.classList.add('gesture'); $('drawer-scrim').classList.add('gesture'); d.style.transform = 'translateX(' + x + 'px)'; $('drawer-scrim').style.opacity = String(Math.max(0, 1 + x / w));
  } else if (gesture.mode === 'sheet') {
    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return; e.preventDefault(); gesture.swiped = true;
    $('modal').classList.add('dragging'); $('modal').style.transform = 'translateY(' + Math.min(220, dy) + 'px)';
  } else if (gesture.mode === 'page' && Math.abs(dx) > Math.abs(dy) * 1.25) {
    e.preventDefault(); gesture.swiped = true;
    $('main').style.transition = 'none'; $('main').style.transform = 'translateX(' + Math.max(-44, Math.min(44, dx * 0.25)) + 'px)';
  }
}
function gestureEnd(e) {
  if (!gesture || (gesture.id != null && e.pointerId != null && e.pointerId !== gesture.id)) return;
  const g = gesture; gesture = null; $('main').style.transition = ''; $('main').style.transform = '';
  if (g.swiped) lastSwipe = Date.now();
  if (g.mode === 'edge') { if ((g.dx || 0) > 56) openDrawer(); else closeDrawer(); }
  else if (g.mode === 'drawer') { if ((g.dx || 0) < -56) closeDrawer(); else openDrawer(); }
  else if (g.mode === 'sheet') { const m = $('modal'); m.classList.remove('dragging'); m.style.transform = ''; if ((g.dy || 0) > 72) m.close(); }
  else if (g.mode === 'page' && Math.abs(g.dx || 0) > 64 && Math.abs(g.dx) > Math.abs(g.dy || 0) * 1.25) {
    const i = CORE_VIEWS.indexOf(view), n = g.dx < 0 ? i + 1 : i - 1;
    if (n >= 0 && n < CORE_VIEWS.length) go(CORE_VIEWS[n]);
  }
}

// ===== Acciones centralizadas =====
function confirmTwice(el) { if (el.dataset.sure) return true; el.dataset.sure = '1'; el.textContent = 'Toca otra vez para confirmar'; setTimeout(() => { delete el.dataset.sure; }, 4000); return false; }

async function act(a, el) {
  const id = el.dataset.id;
  switch (a) {
    case 'drawer': openDrawer(); break;
    case 'drawer-close': closeDrawer(); break;
    case 'ai-drawer-toggle': toggleAIDrawer(); break;
    case 'ai-drawer-close': toggleAIDrawer(false); break;
    case 'cmd-open': openCommandPalette(); break;
    case 'connect-hub': openConnectHub(el.dataset.tab); break;
    case 'bank-connect': await openBankConnectModal(); break;
    case 'install': await installApp(); break;
    case 'repair-pwa': await repairPWA(); break;
    case 'backup-restore': restoreAutomaticBackup(); break;
    case 'ai-run': try { el.disabled = true; el.textContent = 'Analizando…'; await runAI(id); } catch (e) { toast('No se pudo analizar: ' + e.message); } finally { el.disabled = false; } break;
    case 'ai-new-chat': change(() => { const th = { id: 'ch_' + uid(), title: 'Nuevo chat', msgs: [] }; state.aiChats.unshift(th); activeChatId = th.id; }); break;
    case 'ai-cat': try { await aiCategorizeUnknowns(); } catch (e) { toast('IA categorías: ' + e.message); } break;
    case 'ai-import': openAIImportModal({}); break;
    case 'ai-copy': if (state.aiNotes[0]) copyText(state.aiNotes[0].text, 'Análisis copiado'); break;
    case 'ai-delete': change(() => { state.aiNotes = state.aiNotes.filter(x => x.id !== id); }, 'Análisis eliminado'); break;
    case 'ai-settings': change(() => { state.settings.aiProvider = val('set-ai-provider'); state.settings.aiModel = val('set-ai-model').trim(); state.settings.aiShareDetails = !!$('set-ai-details')?.checked; }, 'Copiloto configurado'); break;
    case 'asset-intel': try { await loadAssetIntel(id); } catch (e) { toast(e.message); } break;
    case 'market-radar': try { await loadRadar(); } catch (e) { toast(e.message); } break;
    case 'load-ohlcv': await loadOHLCV(id || selectedSymbol, chartInterval, true); break;
    case 'add-watch': openAddWatchModal(); break;
    case 'import': $('file-in').click(); break;
    case 'refresh': await syncBalances(true); break;
    case 'sync-hist': await syncExchangeHistory(id); break;
    case 'prices': await refreshPrices(true); toast('Precios actualizados'); break;
    case 'clear-filt': filt = { q: '', m: filt.m, cat: '', acc: '', type: '', day: '' }; render(); break;
    case 'add-tx': case 'quick': quickAdd(); break;
    case 'q-save': {
      const amt = Math.abs(numv('q-amt') || 0);
      if (!amt) return toast('Escribe el importe.');
      if (qType === 'xfer') {
        const from = val('q-acc'), to = val('q-acc-to'), dt = val('q-date') || today();
        if (!from || !to || from === to) return toast('Elige dos cuentas distintas.');
        const desc = val('q-desc').trim() || ('Traspaso · ' + accName(from) + ' → ' + accName(to));
        change(() => {
          state.tx.push(
            { id: 't_' + uid(), acc: from, date: dt, desc, amount: round(-amt), bal: null, cat: 'interno', note: '', src: 'manual' },
            { id: 't_' + uid(), acc: to, date: dt, desc, amount: round(amt), bal: null, cat: 'interno', note: '', src: 'manual' }
          );
        }, 'Traspaso guardado');
        $('modal').close(); break;
      }
      const desc = val('q-desc').trim() || catById(val('q-cat')).name;
      change(() => {
        let acc = val('q-acc');
        if (acc === '__cash') { const newA = { id: 'a_' + uid(), name: 'Efectivo', kind: 'cash', inst: '', currency: 'EUR', manualBal: 0 }; state.accounts.push(newA); acc = newA.id; }
        state.tx.push({ id: 't_' + uid(), acc, date: val('q-date') || today(), desc, amount: round(qType === 'out' ? -amt : amt), bal: null, cat: val('q-cat'), note: '', src: 'manual' });
      }, (qType === 'out' ? 'Gasto' : 'Ingreso') + ' añadido');
      $('modal').close(); break;
    }
    case 'goal-new': editGoal(''); break;
    case 'goal-save': {
      const name = val('g-name').trim(), target = numv('g-target'); if (!name || !target) return toast('Pon un nombre y una cantidad.');
      change(() => { let g = state.goals.find(x => x.id === id); if (!g) { g = { id: 'g_' + uid() }; state.goals.push(g); } Object.assign(g, { name, target, date: val('g-date'), acc: val('g-acc'), saved: numv('g-saved') || 0 }); }, 'Bolsillo guardado');
      $('modal').close(); break;
    }
    case 'goal-del': change(() => { state.goals = state.goals.filter(x => x.id !== id); }, 'Bolsillo eliminado'); $('modal').close(); break;
    case 'add-price-alert': editPriceAlertModal(id || selectedSymbol); break;
    case 'pa-save': {
      const sym = normAsset(val('pa-sym')), target = numv('pa-target'); if (!sym || !target) return toast('Indica activo y precio.');
      change(() => { ensureAsset(sym); state.priceAlerts.unshift({ id: 'pa_' + uid(), sym, dir: val('pa-dir'), target, active: true }); }, 'Alerta de precio creada');
      $('modal').close(); break;
    }
    case 'pa-toggle': change(() => { const pa = (state.priceAlerts || []).find(x => x.id === id); if (pa) pa.active = !pa.active; }, 'Alerta actualizada'); break;
    case 'pa-del': change(() => { state.priceAlerts = state.priceAlerts.filter(x => x.id !== id); }, 'Alerta eliminada'); break;
    case 'rm-watch': change(() => { delete state.watchlist[id]; if (selectedSymbol === id) selectedSymbol = watchlistSymbols(buildPortfolioContext().list)[0] || 'BTC'; }, id + ' quitado de seguimiento'); break;
    case 'export-tx-csv': {
      const rows = filtered();
      if (!rows.length) return toast('No hay movimientos para exportar.');
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const csv = '\uFEFFFecha;Cuenta;Comercio;Concepto;Categoría;Importe;Saldo;Nota\n'
        + rows.map(t => [t.date, accName(t.acc), merchantOf(t.desc), t.desc, catById(t.cat).name, t.amount, t.bal ?? '', t.note || ''].map(q).join(';')).join('\n');
      download('Movimientos_' + (filt.m || 'todos') + '.csv', csv, 'text/csv;charset=utf-8');
      toast(rows.length + ' movimientos exportados a CSV'); break;
    }
    case 'theme': change(() => { state.settings.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; }); break;
    case 'hide': change(() => { state.settings.hide = !state.settings.hide; }); break;
    case 'menu': go('ajustes'); break;
    case 'forecast': {
      const f = forecast();
      modal('Previsión a fin de mes', '<div class="kv"><dt>Saldo de hoy (banco y efectivo)</dt><dd>' + money(f.bal) + '</dd>' + (f.salary ? '<dt>Nómina pendiente</dt><dd class="up">' + money(f.salary, { sign: true }) + '</dd>' : '') + '<dt>Cargos fijos pendientes</dt><dd>' + money(-f.fixed) + '</dd><dt>Gasto variable previsto (' + Math.round(f.left) + ' días)</dt><dd>' + money(-f.variable) + '</dd><dt><b>Saldo estimado</b></dt><dd><b>' + money(f.end) + '</b></dd></div>');
      break;
    }
    case 'tx-save': {
      const cat = val('tx-cat'), note = val('tx-note').trim(), newAmt = numv('tx-amt'), newDate = val('tx-date'), newDesc = val('tx-desc').trim();
      const t = state.tx.find(x => x.id === id), mer = merchantOf(t.desc), all = $('tx-all')?.checked;
      change(() => {
        t.cat = cat; t.note = note;
        if (isFinite(newAmt) && newAmt !== 0) t.amount = round(newAmt);
        if (newDate) t.date = newDate;
        if (newDesc) t.desc = newDesc;
        if (all) { state.rules = state.rules.filter(r => r.match !== mer); state.rules.unshift({ id: 'r:' + mer, match: mer, cat }); for (const x of state.tx) if (merchantOf(x.desc) === mer) x.cat = cat; }
      }, all ? 'Categoría aplicada a «' + mer + '» (y futuros)' : 'Guardado');
      $('modal').close(); break;
    }
    case 'tx-del': change(() => { state.tx = state.tx.filter(x => x.id !== id); }, 'Movimiento eliminado'); $('modal').close(); break;
    case 'add-op': editOp(''); break;
    case 'op-save': {
      const acc = val('op-acc'), date = val('op-date') + ' 12:00:00', asset = normAsset(val('op-asset')), qty = numv('op-qty');
      if (!acc || !asset || !qty) return toast('Completa cuenta, activo y cantidad.');
      if (id) { change(() => { const l = state.ledger.find(x => x.id === id); Object.assign(l, { acc, t: l.t.slice(0, 10) === val('op-date') ? l.t : date, asset, change: qty, kind: val('op-kind') }); }, 'Operación guardada'); }
      else {
        const k = val('op-kind'), eur = numv('op-eur'), fee = numv('op-fee') || 0, ref = 'man|' + uid();
        change(() => {
          ensureAsset(asset);
          const pushL = o => state.ledger.push({ id: 'l_' + uid(), acc, t: date, ref, src: 'manual', note: 'Manual', ...o });
          if (k === 'buy') { pushL({ asset, change: Math.abs(qty), kind: 'trade' }); pushL({ asset: 'EUR', change: -Math.abs(eur || 0) - fee, kind: 'trade' }); }
          else if (k === 'sell') { pushL({ asset, change: -Math.abs(qty), kind: 'trade' }); pushL({ asset: 'EUR', change: Math.abs(eur || 0) - fee, kind: 'trade' }); }
          else if (k === 'deposit') { const l = { id: 'l_' + uid(), acc, t: date, ref, asset, change: Math.abs(qty), kind: 'deposit', src: 'manual', note: 'Manual' }; state.ledger.push(l); if (eur != null) state.costs[l.id] = Math.abs(eur) + fee; }
          else if (k === 'reward') pushL({ asset, change: Math.abs(qty), kind: 'reward' });
          else pushL({ asset, change: -Math.abs(qty), kind: 'withdraw' });
        }, 'Operación añadida');
        refreshPrices();
      }
      $('modal').close(); break;
    }
    case 'op-del': {
      const l = state.ledger.find(x => x.id === id);
      const paired = l && /^man\|/.test(l.ref || '') && state.ledger.filter(x => x.ref === l.ref).length > 1;
      change(() => {
        state.ledger = paired ? state.ledger.filter(x => x.ref !== l.ref) : state.ledger.filter(x => x.id !== id);
      }, paired ? 'Operación y contrapartida eliminadas' : 'Operación eliminada');
      $('modal').close(); break;
    }
    case 'asset-save': change(() => { const x = state.assets[id] = state.assets[id] || {}; x.cls = val('as-cls'); x.yahoo = val('as-yahoo').trim(); x.tv = val('as-tv').trim(); x.name = val('as-name').trim(); }, 'Activo guardado'); $('modal').close(); refreshPrices(); break;
    case 'add-deriv': editDeriv(''); break;
    case 'dv-save': {
      const g = k => val('dv-' + k), n = k => numv('dv-' + k);
      const d = { id: id || 'd_' + uid(), instr: g('instr').trim(), type: g('type'), side: g('side'), size: n('size'), entry: n('entry'), lev: n('lev'), margin: n('margin'), liq: n('liq'), quote: g('quote'), markSym: normAsset(g('markSym')), mark: n('mark'), closeDate: g('closeDate'), exit: n('exit'), fees: n('fees') };
      if (!d.instr || !d.size || !d.entry) return toast('Pon instrumento, tamaño y precio de entrada.');
      change(() => { const i = state.derivs.findIndex(x => x.id === d.id); if (i >= 0) state.derivs[i] = d; else state.derivs.push(d); }, 'Posición de derivado guardada');
      $('modal').close(); if (d.markSym) refreshPrices(); break;
    }
    case 'dv-close': closeDerivModal(id); break;
    case 'dv-close-save': {
      const exPrice = numv('dvc-exit'); if (!exPrice) return toast('Indica el precio de salida.');
      change(() => { const d = state.derivs.find(x => x.id === id); if (d) Object.assign(d, { closeDate: val('dvc-date') || today(), exit: exPrice, fees: numv('dvc-fees') || 0 }); }, 'Posición cerrada y registrada en fiscalidad');
      $('modal').close(); break;
    }
    case 'dv-del': change(() => { state.derivs = state.derivs.filter(x => x.id !== id); state.deleted[id] = Date.now(); }, 'Posición eliminada'); $('modal').close(); break;
    case 'add-acc': editAcc(''); break;
    case 'edit-acc': editAcc(id); break;
    case 'acc-back': activeAccId = ''; render(); break;
    case 'add-wallet': editWalletModal(); break;
    case 'wallet-save': {
      const addr = val('wl-addr').trim(), chain = val('wl-chain'); if (!addr) return toast('Pega la dirección pública.');
      change(() => { state.accounts.push({ id: 'a_' + uid(), name: val('wl-name').trim() || ('Wallet ' + chain.toUpperCase()), kind: 'wallet', inst: chain.toUpperCase(), currency: 'EUR', chain, address: addr }); }, 'Wallet añadida');
      $('modal').close(); await syncOnChainWallets(true); break;
    }
    case 'acc-save': {
      const name = val('ac-name').trim(); if (!name) return toast('Ponle un nombre.');
      change(() => { let a = accById(id); if (!a) { a = { id: 'a_' + uid(), currency: 'EUR' }; state.accounts.push(a); } Object.assign(a, { name, kind: val('ac-kind'), inst: val('ac-inst').trim(), manualBal: numv('ac-bal'), reportsSpain: $('ac-rs').checked }); if ($('ac-api')) a.useApi = $('ac-api').checked; }, 'Cuenta guardada');
      $('modal').close(); break;
    }
    case 'acc-del': if (!confirmTwice(el)) return; change(() => { state.accounts = state.accounts.filter(a => a.id !== id); state.tx = state.tx.filter(t => t.acc !== id); state.ledger = state.ledger.filter(l => l.acc !== id); delete state.apiBal[id]; state.deleted[id] = Date.now(); if (activeAccId === id) activeAccId = ''; }, 'Cuenta eliminada'); $('modal').close(); break;
    case 'rule-del': change(() => state.rules.splice(+id, 1), 'Regla quitada'); break;
    case 'export': download('Finanzas_copia_' + today() + '.json', JSON.stringify(syncPayload(), null, 1)); break;
    case 'wipe': if (!confirmTwice(el)) return; { const keep = clone(state.settings); change(() => { state = defaults(); state.settings = keep; }, 'Datos borrados'); } break;
    case 'gen-token': $('set-token').value = randKey(24); $('set-token').dataset.fresh = '1'; toast('TOKEN nuevo generado y enmascarado. Cópialo y cámbialo también en Cloudflare.'); break;
    case 'copy-token': { const t = val('set-token'); if (!t) return toast('Primero genera o pega un TOKEN nuevo.'); await copyText(t, 'TOKEN nuevo copiado. Pégalo como secreto TOKEN en Cloudflare.'); break; }
    case 'copy-worker': try { const r = await fetch('worker.js', { cache: 'no-store' }); if (!r.ok) throw 0; await copyText(await r.text(), 'Código del Worker copiado.'); } catch (e) { toast('No encuentro worker.js junto a la app.'); } break;
    case 'worker-test': {
      state.settings.worker = val('set-worker').trim().replace(/\/+$/, '');
      if ($('set-worker-fallback')) state.settings.workerFallback = val('set-worker-fallback').trim().replace(/\/+$/, '');
      if (val('set-token').trim()) state.settings.token = val('set-token').trim();
      if (typeof resetWorkerRoute === 'function') resetWorkerRoute();
      save(false);
      $('worker-res').innerHTML = '<p class="muted">Probando conexión…</p>';
      try { state.workerInfo = await api('/ping'); } catch (e) { state.workerInfo = { error: e.message }; }
      $('worker-res').innerHTML = workerInfoHTML(state.workerInfo);
      if (!state.workerInfo.error) { syncBalances(); if (state.settings.sync) syncNow(); }
      break;
    }
    case 'sync-on': state.settings.sync = randKey(32); state.settings.lastSync = 0; state.settings.lastRemote = 0; state.settings.lastPush = 0; state.settings.pushed = -1; save(false); await syncNow(true); render(); break;
    case 'sync-off': state.settings.sync = ''; save(false); render(); break;
    case 'sync-now': {
      if ($('set-worker')?.value.trim()) state.settings.worker = $('set-worker').value.trim().replace(/\/+$/, '');
      if ($('set-worker-fallback')) state.settings.workerFallback = $('set-worker-fallback').value.trim().replace(/\/+$/, '');
      if ($('set-token')?.value.trim()) state.settings.token = $('set-token').value.trim();
      save(false);
      if (!syncOn()) { go('ajustes'); toast('Activa la sincronización en Ajustes.'); break; }
      await syncNow(true); if (workerEndpoints().length) syncBalances(); break;
    }
    case 'pair-copy': {
      if ($('set-worker')?.value.trim()) state.settings.worker = $('set-worker').value.trim().replace(/\/+$/, '');
      if ($('set-worker-fallback')) state.settings.workerFallback = $('set-worker-fallback').value.trim().replace(/\/+$/, '');
      if ($('set-token')?.value.trim()) state.settings.token = $('set-token').value.trim();
      if (!state.settings.sync) state.settings.sync = randKey(32);
      state.settings.pushed = -1; save(false);
      copyText(pairLink(), 'Enlace copiado. Subiendo copia cifrada para el móvil…');
      syncNow(true);
      break;
    }
    case 'pair-share': {
      if ($('set-worker')?.value.trim()) state.settings.worker = $('set-worker').value.trim().replace(/\/+$/, '');
      if ($('set-worker-fallback')) state.settings.workerFallback = $('set-worker-fallback').value.trim().replace(/\/+$/, '');
      if ($('set-token')?.value.trim()) state.settings.token = $('set-token').value.trim();
      if (!state.settings.sync) state.settings.sync = randKey(32);
      state.settings.pushed = -1; save(false);
      navigator.share({ title: 'Finanzas', text: 'Vincular Finanzas', url: pairLink() }).catch(() => { });
      syncNow(true);
      break;
    }
    case 'tax-prices': { taxBusy = true; render(); try { const n = await taxPrefetch((i, t) => { const b = document.querySelector('[data-act="tax-prices"]'); if (b) b.textContent = 'Precios ' + i + ' de ' + t + '…'; }); toast(n ? 'Precios históricos descargados: ' + n : 'Ya estaban todos los precios'); } catch (e) { toast(e.message); } taxBusy = false; render(); break; }
    case 'tax-csv': taxCSV(String(state.settings.taxYear || val('tax-year'))); break;
    case 'tax-ai': copyText(taxAIText(val('tax-year')), 'Copiado: pégalo en el Copiloto IA o en tu gestor.'); break;
    case 'tax-721': { const y = val('tax-year'); el.textContent = 'Calculando…'; const r = await modelo721(y); m721 = { ...r, year: y }; render(); break; }
  }
}

document.addEventListener('click', async e => {
  if (Date.now() - lastSwipe < 350) { e.preventDefault(); return; }
  const ask = e.target.closest('[data-chat-ask]');
  if (ask) { sendChatMessage(ask.dataset.chatAsk); return; }
  const t = e.target.closest('[data-go],[data-act],[data-tx],[data-range],[data-dismiss],[data-asset],[data-acc],[data-deriv],[data-op],[data-set],[data-invview],[data-invtab],[data-select-sym],[data-chartmode],[data-interval],[data-movview],[data-fcat],[data-day],[data-qtype],[data-pick],[data-goal],[data-month],[data-ftype],[data-qcat],[data-scenario],[data-chat-id]');
  if (!t) return;
  const d = t.dataset;
  if (d.act) { e.preventDefault(); await act(d.act, t); return; }
  if (d.go) { if ($('modal').open) $('modal').close(); if (d.invDeriv) { invView = 'derivs'; invTab = 'derivs'; } go(d.go, d.gof ? JSON.parse(d.gof) : null); return; }
  if (d.tx) { editTx(d.tx); return; }
  if (d.fcat != null) { filt.cat = d.fcat; render(); return; }
  if (d.day) { filt.day = filt.day === d.day ? '' : d.day; filt.m = d.day.slice(0, 7); render(); return; }
  if (d.qtype) { qType = d.qtype; const keep = { a: val('q-amt'), d: val('q-desc'), dt: val('q-date'), acc: val('q-acc') }; quickAdd(); if ($('q-amt')) $('q-amt').value = keep.a; if ($('q-desc')) $('q-desc').value = keep.d; if ($('q-date')) $('q-date').value = keep.dt; if ($('q-acc') && keep.acc && keep.acc !== '__cash') $('q-acc').value = keep.acc; return; }
  if (d.qcat) { $('q-cat').value = d.qcat; $$('[data-qcat]').forEach(b => b.setAttribute('aria-pressed', String(b === t))); return; }
  if (d.pick) { const box = t.parentElement; box.querySelectorAll('[data-pick]').forEach(b => b.setAttribute('aria-pressed', String(b === t))); const h = box.nextElementSibling; if (h && h.type === 'hidden') h.value = d.pick; return; }
  if (d.goal) { editGoal(d.goal); return; }
  if (d.month != null) { if (view !== 'movimientos') go('movimientos', { m: d.month, all: !d.month, type: 'out', cat: '' }); else { filt.m = d.month; filt.all = !d.month; filt.day = ''; render(); } return; }
  if (d.ftype != null) { filt.type = d.ftype; render(); return; }
  if (d.range) { range = d.range; render(); return; }
  if (d.invview) { invView = d.invview; render(); return; }
  if (d.invtab) { invTab = d.invtab; render(); return; }
  if (d.selectSym) { selectedSymbol = d.selectSym; if (view !== 'inversiones') go('inversiones'); else { render(); if (chartMode === 'candles') loadOHLCV(selectedSymbol, chartInterval); } return; }
  if (d.chartmode) { chartMode = d.chartmode; render(); if (chartMode === 'candles') loadOHLCV(selectedSymbol, chartInterval); return; }
  if (d.interval) { chartInterval = d.interval; render(); loadOHLCV(selectedSymbol, chartInterval); return; }
  if (d.movview) { movView = d.movview; render(); return; }
  if (d.scenario) { marketShock = +d.scenario; render(); return; }
  if (d.dismiss) { state.dismissed[d.dismiss] = Date.now(); save(false); render(); return; }
  if (d.asset) { assetDetail(d.asset); return; }
  if (d.acc) { activeAccId = d.acc; go('cuentas'); return; }
  if (d.deriv) { editDeriv(d.deriv); return; }
  if (d.op) { editOp(d.op); return; }
  if (d.chatId) { activeChatId = d.chatId; render(); return; }
  if (d.set) { let v = d.val; if (v === 'true' || v === 'false') v = v === 'true'; change(() => { state.settings[d.set] = v; }); if (d.set === 'show') refreshPrices(); }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-chat-form]');
  if (!form) return;
  e.preventDefault();
  const inp = form.querySelector('input');
  if (inp && inp.value.trim()) { const txt = inp.value; inp.value = ''; sendChatMessage(txt); }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'f-q') { filt.q = t.value; clearTimeout(t._tm); t._tm = setTimeout(() => { const pos = t.selectionStart; render(); const n = $('f-q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 250); }
});
document.addEventListener('change', e => {
  const t = e.target, m = { 'f-m': 'm', 'f-cat': 'cat', 'f-type': 'type', 'f-acc': 'acc' }[t.id];
  if (m) { filt[m] = t.value; render(); return; }
  if (t.id === 'tax-year') { state.settings.taxYear = t.value; m721 = null; save(false); render(); return; }
  if (t.id === 'tax-extra') { taxExtra = toNum(t.value) || 0; render(); return; }
  if (t.id === 'set-low') { change(() => { state.settings.lowBal = toNum(t.value) || 0; }); return; }
  if (t.dataset.budget) { const v = toNum(t.value); change(() => { if (v > 0) state.budgets[t.dataset.budget] = v; else delete state.budgets[t.dataset.budget]; }); return; }
  if (t.dataset.cost) { const v = toNum(t.value); change(() => { if (isFinite(v)) state.costs[t.dataset.cost] = v; else delete state.costs[t.dataset.cost]; }, 'Coste guardado'); return; }
  if (t.id === 'file-in') { importFiles([...t.files]); t.value = ''; }
});

function afterRender() {
  bindCharts();
  const drop = $('drop');
  if (drop && !drop._b) {
    drop._b = 1;
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('on'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('on'); }));
    drop.addEventListener('drop', e => importFiles([...e.dataTransfer.files]));
  }
}

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { if (!e.target.closest('#drop')) { e.preventDefault(); if (e.dataTransfer?.files?.length) importFiles([...e.dataTransfer.files]); } });
$('modal-close').onclick = () => { $('modal').close(); $('modal').classList.remove('asset-dialog'); };
document.addEventListener('pointerdown', gestureStart, { passive: true });
document.addEventListener('pointermove', gestureMove, { passive: false });
document.addEventListener('pointerup', gestureEnd, { passive: true });
document.addEventListener('pointercancel', gestureEnd, { passive: true });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawer(); toggleAIDrawer(false); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(); }
});
$('toast-undo').onclick = undo;
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.settings.theme === 'auto') render(); });
let lastNarrow = narrow();
addEventListener('resize', () => { const n = narrow(); if (ready && n !== lastNarrow) { lastNarrow = n; render(); } });

function refreshAll(force) {
  snapshot();
  if (syncOn()) syncNow();
  if (workerEndpoints().length) { if (force || Date.now() - (state.apiTs || 0) > 5 * 60e3) syncBalances(); }
  else if (state.accounts.length) refreshPrices();
  startLiveStream();
}

function init() {
  const paired = readPair();
  addEventListener('hashchange', () => {
    if (location.hash.startsWith('#pair=')) { readPair(); return; }
    const ch = location.hash.slice(1);
    if (VIEWS.some(v => v[0] === ch) && view !== ch) go(ch);
  });
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => { });
    }
  } catch (e) { }
  const h = location.hash.slice(1); if (VIEWS.some(v => v[0] === h) || h === 'mas') view = h;
  if (h === 'quick') view = 'resumen';
  filt.m = state.tx.map(t => monthKey(t.date)).sort().at(-1) || '';
  ready = true; snapshot(); autoBackup(); render();
  document.body.dataset.ready = 'true';
  handleBankCallback();
  if (state.accounts.length) refreshPrices();
  startLiveStream();
  if (workerEndpoints().length) { if (!paired) { syncNow(); syncBalances(); } api('/ping').then(x => { state.workerInfo = x; save(false); if (view === 'ajustes') render(); }).catch(() => { }); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); else stopLiveStream(); });
  addEventListener('online', () => refreshAll());
  addEventListener('focus', () => { if (syncOn()) syncNow(); });
  setInterval(() => { if (document.visibilityState === 'visible' && syncOn()) syncNow(); paintSync(); }, 60e3);
  setInterval(() => { if (document.visibilityState !== 'visible') return; if (workerEndpoints().length) syncBalances(); else if (state.accounts.length) refreshPrices(); snapshot(); }, Math.max(5, +state.settings.autoMinutes || 15) * 60e3);
}
init();
