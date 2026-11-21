// ===== Estado, almacenamiento local, sincronización cifrada y utilidades =====
"use strict";
const APP_VERSION = 'v12', APP_REVISION = 17, STORE = 'caudal_v1', APP_NAME = 'Finanzas';

const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const sum = a => a.reduce((s, x) => s + (+x || 0), 0);
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const today = () => localDate(new Date());
function localDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return localDate(d); }
const monthKey = s => String(s || '').slice(0, 7);
function monthAdd(m, n) { const [y, mm] = m.split('-').map(Number), d = new Date(y, mm - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const monthName = m => MONTHS[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4);
const monthLong = m => ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
function fmtDate(s, o = { day: 'numeric', month: 'short' }) { return new Date(String(s).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-ES', o); }
function nf(n, d = 2, min = d) { return Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: min, maximumFractionDigits: d, useGrouping: 'always' }); }
function money(eur, opts = {}) {
  const cur = opts.cur || state.settings.show; let v = eur, s;
  if (opts.d === 0 && Math.abs(eur) < 10 && eur !== 0) opts = { ...opts, d: 2 };
  if (cur === 'USD') { v = eur * fx('USD'); s = nf(v, opts.d ?? 2) + ' $'; }
  else if (cur === 'BTC') { const p = priceEUR('BTC'); v = p ? eur / p : 0; s = nf(v, 6, 4) + ' BTC'; }
  else s = nf(v, opts.d ?? 2) + ' €';
  if (opts.sign && eur > 0) s = '+' + s;
  return '<span class="money num">' + s + '</span>';
}
function moneyBig(eur) {
  if (state.settings.show !== 'EUR') return money(eur, { d: 2 });
  const s = nf(eur, 2), i = s.lastIndexOf(',');
  return '<span class="money num">' + s.slice(0, i) + '<span class="dec">,' + s.slice(i + 1) + ' €</span></span>';
}
const pct = (n, d = 1) => (n > 0 ? '+' : '') + nf(n, d, d) + ' %';
const cls = n => n > 0.0001 ? 'up' : n < -0.0001 ? 'down' : '';
function toNum(v) {
  if (typeof v === 'number') return v;
  let s = String(v ?? '').replace(/[€$\s\u00a0]|EUR|USD/gi, '').trim();
  if (!s) return NaN;
  const neg = /^\(.*\)$/.test(s); if (neg) s = s.slice(1, -1);
  if (/^-?[\d.]+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?[\d,]+\.\d+$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  const n = Number(s); return neg ? -n : n;
}
function toDate(v, dmy = true) {
  if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return d.toISOString().slice(0, 19).replace('T', ' '); }
  const s = String(v ?? '').trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/))) return m[1] + '-' + m[2] + '-' + m[3] + ' ' + (m[4] || '12') + ':' + (m[5] || '00') + ':' + (m[6] || '00');
  if ((m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/))) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3], a = m[1].padStart(2, '0'), b = m[2].padStart(2, '0');
    const [dd, mm] = dmy ? [a, b] : [b, a];
    return y + '-' + mm + '-' + dd + ' ' + (m[4] || '12').padStart(2, '0') + ':' + (m[5] || '00') + ':' + (m[6] || '00');
  }
  return '';
}
const val = id => $(id)?.value ?? '';
const numv = id => { const v = toNum(val(id)); return isFinite(v) ? v : null; };
function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
async function copyText(t, msg = 'Copiado') {
  try { await navigator.clipboard.writeText(t); toast(msg); }
  catch (e) { modal('Copia este texto', '<textarea style="min-height:240px">' + esc(t) + '</textarea>'); }
}
const randKey = n => b64u(crypto.getRandomValues(new Uint8Array(n)));

const ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/>',
  candles: '<path d="M7 4v16M17 4v16M12 7v10"/><rect x="5" y="8" width="4" height="6" rx="1"/><rect x="15" y="7" width="4" height="7" rx="1"/>',
  tax: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 13a8 8 0 0 0 14.6 4.5"/><path d="M5 3v4h4M19 21v-4h-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16" cy="14.5" r="1.2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.6 0-2.7.8-2.7 2s1.2 1.6 2.7 2 2.7.9 2.7 2.1-1.2 2-2.7 2A2.6 2.1 0 0 1 9.3 14M12 6v1.5M12 16.5V18"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  brain: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><circle cx="12" cy="12" r="1.1"/>',
  install: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="18" r="1"/>',
  news: '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'
};
const ico = (n, s = '') => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' + s + '>' + (ICON[n] || '') + '</svg>';
const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)'];

const LISTS = ['accounts', 'tx', 'ledger', 'derivs', 'rules', 'goals', 'aiNotes', 'priceAlerts', 'aiChats'];
const MAPS = ['assets', 'costs', 'budgets', 'dismissed', 'watchlist'];
const SHARED = ['show', 'theme', 'hide', 'lowBal', 'autoMinutes', 'taxYear', 'aiProvider', 'aiModel', 'aiShareDetails'];
const LOCAL_ONLY = ['worker', 'workerFallback', 'workerMirrors', 'token', 'sync', 'lastSync', 'lastRemote', 'lastPush', 'pushed', 'deviceId', 'syncRetries'];

function defaults() {
  return {
    version: 1, appRevision: APP_REVISION, updated: 0, dirty: 0,
    accounts: [],   // {id,name,kind:'bank'|'exchange'|'broker'|'wallet'|'cash',inst,currency,iban,manualBal,reportsSpain,api,chain,address,ebUid,ebSessionId,ebValidUntil,_m}
    tx: [],         // {id,acc,date,desc,amount,bal,cat,note,src,_m}
    ledger: [],     // {id,acc,t,asset,change,kind,ref,note,src,_m}
    assets: {},     // {SYM:{cls,name,yahoo,tv}}
    derivs: [],     // derivados manuales
    goals: [],      // bolsillos de ahorro
    aiNotes: [],    // partes guardados
    priceAlerts: [],// alertas de precio {id,sym,dir:'above'|'below',target,active,_m}
    aiChats: [],    // hilos de chat IA {id,title,msgs:[{role,text,t}],_m}
    costs: {}, prices: {}, hist: {}, snaps: {}, ohlcv: {}, apiBal: {}, apiDerivs: [],
    rules: [], budgets: {}, dismissed: {}, watchlist: {}, market: {},
    deleted: {}, stamps: {},
    settings: { show: 'EUR', theme: 'dark', hide: false, lowBal: 100, worker: '', workerFallback: '', workerMirrors: [], token: '', sync: '', lastSync: 0, lastRemote: 0, lastPush: 0, pushed: 0, autoMinutes: 15, taxYear: 0, gestureHint: true, aiProvider: 'auto', aiModel: '', aiShareDetails: false, deviceId: 'dev_' + uid(), syncRetries: 0 }
  };
}

let state = load();
let view = 'resumen', undoStack = [], toastTimer = 0, ready = false;

function load() {
  let raw = null; try { raw = localStorage.getItem(STORE); } catch (e) { }
  if (!raw) return defaults();
  try { return migrate(JSON.parse(raw)); } catch (e) { console.error(e); return defaults(); }
}
function migrate(o) {
  const d = defaults(), s = { ...d, ...o, settings: { ...d.settings, ...(o.settings || {}) } };
  for (const k of [...LISTS, 'apiDerivs']) if (!Array.isArray(s[k])) s[k] = [];
  for (const k of ['assets', 'costs', 'prices', 'hist', 'snaps', 'ohlcv', 'apiBal', 'budgets', 'dismissed', 'watchlist', 'market', 'deleted', 'stamps']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {};
  for (const r of s.rules) if (!r.id) r.id = 'r:' + r.match;
  for (const t of s.tx) if (t && t.cat === 'otros' && /(?:AJUSTE|SALDO)\s+INICIAL|APERTURA\s+DE\s+CUENTA|REGULARIZACI[OÓ]N\s+INICIAL/i.test(String(t.desc || ''))) t.cat = 'interno';
  s.appRevision = APP_REVISION;
  if (!Array.isArray(s.settings.workerMirrors)) s.settings.workerMirrors = [];
  if (!s.settings.deviceId) s.settings.deviceId = 'dev_' + uid();
  return s;
}
function autoBackup() {
  try {
    if (!state.accounts.length && !state.tx.length && !state.ledger.length) return;
    const key = 'caudal_backup_' + today();
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ created: Date.now(), version: APP_VERSION, data: syncPayload() }));
    Object.keys(localStorage).filter(k => k.startsWith('caudal_backup_')).sort().reverse().slice(7).forEach(k => localStorage.removeItem(k));
  } catch (e) { }
}
function backupInfo() { try { const keys = Object.keys(localStorage).filter(k => k.startsWith('caudal_backup_')).sort().reverse(); return { count: keys.length, last: keys[0]?.slice(14) || '', key: keys[0] || '' }; } catch (e) { return { count: 0, last: '', key: '' }; } }
function restoreAutomaticBackup() {
  const b = backupInfo(); if (!b.key) return toast('Todavía no hay una copia automática.');
  if (!confirm('Se mezclará la última copia automática con tus datos actuales. ¿Continuar?')) return;
  try {
    const o = JSON.parse(localStorage.getItem(b.key)); const keep = {};
    for (const k of LOCAL_ONLY) keep[k] = state.settings[k];
    state = migrate(mergeStates(state, migrate(o.data))); Object.assign(state.settings, keep);
    state.dirty = (state.dirty || 0) + 1; save(); render(); toast('Copia automática recuperada y mezclada.');
  } catch (e) { toast('No se pudo recuperar: ' + e.message); }
}
function save(sync = true) {
  state.updated = Date.now();
  try { localStorage.setItem(STORE, JSON.stringify(state)); autoBackup(); } catch (e) { toast('No se pudo guardar: el navegador está lleno. Exporta una copia.'); }
  if (sync) scheduleSync();
}
function stampChanges(before) {
  const now = Date.now(), strip = x => JSON.stringify({ ...x, _m: 0 });
  for (const k of LISTS) {
    const prev = new Map((before[k] || []).map(x => [x.id, x]));
    const nowIds = new Set();
    for (const x of state[k]) { if (!x.id) continue; nowIds.add(x.id); const p = prev.get(x.id); if (!p || strip(p) !== strip(x)) x._m = Math.max(now, ((p && p._m) || 0) + 1, (state.deleted[x.id] || 0) + 1); }
    for (const [id, p] of prev) if (!nowIds.has(id)) state.deleted[id] = Math.max(now, (p._m || 0) + 1);
  }
  const mark = (grp, key) => { const g = state.stamps[grp] = state.stamps[grp] || {}; g[key] = Math.max(now, (g[key] || 0) + 1); };
  for (const k of MAPS) {
    const a = before[k] || {}, b = state[k] || {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) mark(k, key);
  }
  for (const key of SHARED) if (JSON.stringify(before.settings?.[key]) !== JSON.stringify(state.settings[key])) mark('settings', key);
  state.dirty = (state.dirty || 0) + 1;
}
function change(fn, msg) {
  const before = JSON.stringify(state);
  try { fn(); } catch (e) { state = migrate(JSON.parse(before)); toast(e.message); return false; }
  stampChanges(JSON.parse(before));
  undoStack.push(before); if (undoStack.length > 15) undoStack.shift();
  save(); render(); if (msg) toast(msg, true); return true;
}
function undo() {
  const b = undoStack.pop(); if (!b) return;
  const cur = JSON.parse(JSON.stringify(state));
  state = migrate(JSON.parse(b));
  for (const k of LOCAL_ONLY) state.settings[k] = cur.settings[k];
  for (const k of LISTS) for (const x of state[k]) if (x.id && cur.deleted[x.id]) delete cur.deleted[x.id];
  state.deleted = { ...cur.deleted, ...state.deleted };
  stampChanges(cur); save(); render(); toast('Cambio deshecho');
}
function toast(text, canUndo = false) {
  clearTimeout(toastTimer); $('toast-text').textContent = text; $('toast-undo').hidden = !canUndo; $('toast').hidden = false;
  toastTimer = setTimeout(() => $('toast').hidden = true, canUndo ? 6000 : 4000);
}

// ===== Sincronización cifrada entre dispositivos =====
function b64u(b) { const u = new Uint8Array(b); let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
const ub64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function syncKey() { const raw = ub64(state.settings.sync); return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function syncId() { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('caudal:' + state.settings.sync)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 40); }
function syncPayload() { const o = clone(state); for (const k of LOCAL_ONLY) delete o.settings[k]; delete o.workerInfo; delete o.syncError; return o; }
async function encrypt(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), data = new TextEncoder().encode(JSON.stringify(obj));
  let body = data; if (typeof CompressionStream === 'function') body = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await syncKey(), body);
  return b64u(iv) + '.' + b64u(ct) + '.' + (body === data ? 'r' : 'z');
}
async function decrypt(s) {
  const [iv, ct, mode] = s.split('.'); let pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(iv) }, await syncKey(), ub64(ct)));
  if (mode === 'z') pt = new Uint8Array(await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  return JSON.parse(new TextDecoder().decode(pt));
}
function mergeStates(local, remote) {
  const out = clone(local), st = (o, g, k) => (o.stamps && o.stamps[g] && o.stamps[g][k]) || 0;
  out.deleted = { ...(remote.deleted || {}) }; for (const [k, v] of Object.entries(local.deleted || {})) out.deleted[k] = Math.max(v, out.deleted[k] || 0);
  for (const k of LISTS) {
    const m = new Map(); for (const x of local[k] || []) m.set(x.id || JSON.stringify(x), x);
    for (const x of remote[k] || []) { const key = x.id || JSON.stringify(x), l = m.get(key); if (!l || (x._m || 0) > (l._m || 0)) m.set(key, x); }
    out[k] = [...m.values()].filter(x => !x.id || !(out.deleted[x.id] >= (x._m || 0)));
  }
  out.stamps = clone(local.stamps || {});
  for (const g of [...MAPS, 'settings']) {
    const lo = g === 'settings' ? local.settings : local[g] || {}, re = g === 'settings' ? remote.settings || {} : remote[g] || {}, dst = g === 'settings' ? out.settings : out[g];
    const keys = g === 'settings' ? SHARED : [...new Set([...Object.keys(lo), ...Object.keys(re), ...Object.keys((remote.stamps || {})[g] || {})])];
    for (const key of keys) {
      const rs = st(remote, g, key), ls = st(local, g, key);
      if (rs > ls) { if (re[key] === undefined) delete dst[key]; else dst[key] = clone(re[key]); (out.stamps[g] = out.stamps[g] || {})[key] = rs; }
      else if (!ls && !rs && dst[key] === undefined && re[key] !== undefined) dst[key] = clone(re[key]);
    }
  }
  for (const [k, v] of Object.entries(remote.prices || {})) if (!out.prices[k] || (v.ts || 0) > (out.prices[k].ts || 0)) out.prices[k] = v;
  out.hist = { ...(remote.hist || {}), ...out.hist };
  out.snaps = { ...(remote.snaps || {}), ...out.snaps };
  out.ohlcv = { ...(remote.ohlcv || {}), ...out.ohlcv };
  for (const [k, v] of Object.entries(remote.apiBal || {})) if (!out.apiBal[k] || (v.ts || 0) > (out.apiBal[k].ts || 0)) out.apiBal[k] = v;
  if ((remote.apiTs || 0) > (local.apiTs || 0)) { out.apiDerivs = remote.apiDerivs || []; out.apiTs = remote.apiTs; }
  out.updated = Math.max(local.updated || 0, remote.updated || 0);
  return out;
}
let syncTimer = 0, syncRetryTimer = 0, syncBusy = false, syncAgain = false, syncState = '';
const syncOn = () => !!(state.settings.sync && (state.settings.worker || state.settings.workerFallback || (state.settings.workerMirrors && state.settings.workerMirrors.length)));
function scheduleSync(ms = 1500) { if (!syncOn()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(), ms); }
async function syncNow(manual = false) {
  if (!syncOn()) return;
  if (syncBusy) { syncAgain = true; return; }
  if (navigator.onLine === false) { syncState = 'off'; paintSync(); return; }
  clearTimeout(syncRetryTimer); syncRetryTimer = 0;
  syncBusy = true; syncState = 'busy'; paintSync();
  try {
    const S = state.settings, id = await syncId();
    const keep = {}; for (const k of LOCAL_ONLY) keep[k] = S[k];
    let changed = false, conflictCurrent = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = conflictCurrent || await api('/sync/' + id).catch(e => { if (e.status === 404 || /404|no hay copia/i.test(e.message)) return null; throw e; });
      conflictCurrent = null;
      if (r && r.data && (r.updated || 0) > (keep.lastRemote || 0)) {
        const remote = migrate(await decrypt(r.data));
        state = migrate(mergeStates(state, remote)); Object.assign(state.settings, keep);
        keep.lastRemote = r.updated;
        state.settings.lastRemote = r.updated; changed = true;
        if (typeof filt === 'object' && filt && (!filt.m || !state.tx.some(t => monthKey(t.date) === filt.m)) && state.tx.length) {
          filt.m = state.tx.map(t => monthKey(t.date)).sort().at(-1) || '';
        }
      }
      const needPush = !r || (state.dirty || 0) !== (state.settings.pushed || 0);
      if (!needPush) break;
      const pushing = state.dirty || 0;
      const baseUpdated = (r && r.updated) || 0;
      const up = Math.max(Date.now(), baseUpdated + 1, (keep.lastRemote || 0) + 1);
      try {
        await api('/sync/' + id, { method: 'PUT', body: JSON.stringify({ updated: up, baseUpdated, device: S.deviceId, data: await encrypt(syncPayload()) }) });
        keep.lastRemote = up;
        state.settings.lastRemote = up; state.settings.lastPush = up; state.settings.pushed = pushing;
        break;
      } catch (putErr) {
        if (putErr && putErr.status === 409 && attempt < 2) {
          conflictCurrent = (putErr.data && putErr.data.current) || null;
          continue;
        }
        throw putErr;
      }
    }
    state.settings.lastSync = Date.now(); state.settings.syncRetries = 0; state.syncError = '';
    localStorage.setItem(STORE, JSON.stringify(state));
    syncState = 'ok'; if (changed && ready) render(); if (manual) toast(changed ? 'Sincronizado: hay datos nuevos del otro dispositivo' : 'Sincronizado');
  } catch (e) {
    const rawMsg = String(e.message || e);
    const niceMsg = /AES key|OperationError|atob|invalid character/i.test(rawMsg)
      ? 'La clave de sincronización es inválida o está incompleta. Genera una nueva o vuelve a vincular.'
      : rawMsg;
    syncState = 'err'; state.syncError = niceMsg; state.settings.syncRetries = (state.settings.syncRetries || 0) + 1;
    const waits = [5000, 15000, 60000, 300000], wait = waits[Math.min(state.settings.syncRetries - 1, waits.length - 1)];
    if (syncOn() && navigator.onLine !== false) syncRetryTimer = setTimeout(() => syncNow(false), wait);
    if (/conflicto/i.test(rawMsg) && state.settings.syncRetries <= 3) syncAgain = true;
    if (manual) toast('No se pudo sincronizar: ' + niceMsg + ' · se reintentará automáticamente.');
  } finally { syncBusy = false; paintSync(); if (syncAgain) { syncAgain = false; scheduleSync(450); } }
}
function ago(t) { if (!t) return ''; const s = (Date.now() - t) / 1000; return s < 60 ? 'ahora mismo' : s < 3600 ? 'hace ' + Math.floor(s / 60) + ' min' : s < 86400 ? 'hace ' + Math.floor(s / 3600) + ' h' : 'el ' + fmtDate(localDate(new Date(t))); }
function paintSync() {
  const on = syncOn(), t = state.settings.lastSync;
  const clsDot = !on ? '' : syncState === 'busy' ? 'busy' : syncState === 'err' || syncState === 'off' ? 'err' : t ? 'ok' : '';
  const txt = !on ? 'Solo local' : syncState === 'busy' ? 'Sincronizando…' : syncState === 'err' ? 'Reintentar sync' : syncState === 'off' ? 'Sin conexión' : 'Al día ' + ago(t);
  for (const id of ['sync-side', 'sync-drawer']) if ($(id)) $(id).innerHTML = '<span class="dot ' + clsDot + '"></span>' + txt;
  const topLabel = !on ? 'Local' : syncState === 'busy' ? 'Sync…' : syncState === 'err' ? 'Error' : syncState === 'off' ? 'Offline' : 'Sync';
  for (const id of ['sync-top', 'sync-top-desktop']) if ($(id)) {
    $(id).className = 'sync-pill ' + clsDot;
    $(id).innerHTML = '<span class="dot ' + clsDot + '"></span><span>' + topLabel + '</span>';
    $(id).title = txt;
  }
  $$('[data-syncstate]').forEach(e => e.innerHTML = '<span class="row" style="gap:8px"><span class="dot ' + clsDot + '"></span>' + txt + (syncState === 'err' && state.syncError ? ' · <span class="down">' + esc(state.syncError) + '</span>' : '') + '</span>');
}
function pairLink() {
  const p = { w: state.settings.worker, t: state.settings.token, s: state.settings.sync };
  if (state.settings.workerFallback) p.f = state.settings.workerFallback;
  if (Array.isArray(state.settings.workerMirrors) && state.settings.workerMirrors.length) p.m = state.settings.workerMirrors;
  return location.origin + location.pathname + '#pair=' + b64u(new TextEncoder().encode(JSON.stringify(p)));
}
function readPair() {
  const m = location.hash.match(/#pair=([\w-]+)/); if (!m) return false;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const o = JSON.parse(new TextDecoder().decode(ub64(m[1]))); if (!o.s || (!o.w && !o.f)) throw 0;
    const hasLocal = !!(state.accounts.length || state.tx.length || state.ledger.length || (state.dirty || 0) > 0);
    Object.assign(state.settings, {
      worker: o.w || '',
      workerFallback: o.f || '',
      workerMirrors: Array.isArray(o.m) ? o.m : [],
      token: o.t || '',
      sync: o.s,
      lastSync: 0, lastRemote: 0, lastPush: 0,
      pushed: hasLocal ? -1 : (state.dirty || 0),
      syncRetries: 0
    });
    if (typeof resetWorkerRoute === 'function') resetWorkerRoute();
    state.syncError = '';
    localStorage.setItem(STORE, JSON.stringify(state));
    setTimeout(async () => {
      await syncNow(true);
      if (ready) render();
      if (syncState === 'ok') toast('Dispositivo vinculado: tus datos ya están aquí');
      syncBalances();
    }, 50);
    return true;
  } catch (e) { setTimeout(() => toast('El enlace de vinculación no es válido.'), 50); return false; }
}

const accById = id => state.accounts.find(a => a.id === id);
const accName = id => accById(id)?.name || 'Cuenta';
function instKey(a) {
  const s = String(a?.inst || a?.name || a?.api || '').toLowerCase();
  if (/santander/.test(s)) return 'santander';
  if (/revolut/.test(s)) return 'revolut';
  if (/kucoin/.test(s)) return 'kucoin';
  if (/kraken/.test(s)) return 'kraken';
  if (/binance/.test(s)) return 'binance';
  return '';
}
function assetColor(sym) {
  const K = { BTC: '#f7931a', ETH: '#627eea', SOL: '#14b8a6', USDT: '#26a17b', USDC: '#2775ca', BNB: '#d8a51b', EUR: '#3b82f6', XRP: '#4b5563', ADA: '#0033ad', DOGE: '#c2a633', KCS: '#23af91', DOT: '#e6007a', AVAX: '#e84142', LINK: '#2a5ada' };
  if (K[sym]) return K[sym];
  let h = 0; for (const c of String(sym || '')) h = (h * 31 + c.charCodeAt(0)) % 997;
  return PAL[h % PAL.length];
}
function catInitials(c) {
  const M = { super: 'SP', suscripciones: 'SB', restaurantes: 'RE', hogar: 'HO', combustible: 'CB', movilidad: 'MV', transporte: 'TR', compras: 'CM', salud: 'SL', deporte: 'DP', cuidado: 'CP', ocio: 'OC', bizum_out: 'BZ', bizum_in: 'BZ', nomina: 'NM', ingresos: 'IN', efectivo: 'EF', comisiones: 'CS', otros: 'OT', inversion: 'IV', interno: 'IT' };
  return M[c.id] || c.name.split(/\s+/)[0].slice(0, 2).toUpperCase();
}
function initials(s) { const w = String(s || '').replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9 ]/g, ' ').trim().split(/\s+/).filter(x => x.length > 1); return ((w[0] || '?')[0] + ((w[1] || '')[0] || '')).toUpperCase(); }
