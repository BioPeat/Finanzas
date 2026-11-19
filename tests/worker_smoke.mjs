import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const source = await fs.readFile(new URL('../worker.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const worker = mod.default;
const store = new Map();
const CAUDAL = {
  async get(k, type) { const v = store.get(k) ?? null; return type === 'json' && v ? JSON.parse(v) : v; },
  async put(k, v) { store.set(k, v); }
};
const env = { TOKEN: 'TOKEN-DE-PRUEBA-1234567890', ALLOWED_ORIGIN: 'https://usuario.github.io', CAUDAL };
const call = async (path, { method = 'GET', origin = env.ALLOWED_ORIGIN, token = env.TOKEN, body } = {}) =>
  worker.fetch(new Request('https://worker.test' + path, { method, headers: { Origin: origin, 'X-Caudal-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body }), env);

let r = await call('/ping');
assert.equal(r.status, 200); let j = await r.json();
assert.equal(j.version, 'w6'); assert.equal(j.kv, true); assert.equal(j.originProtected, true);
assert.equal(j.onchain, true); assert.equal(j.ohlcv, true);
assert.equal('kraken_futures' in j.exchanges, true); assert.equal('kucoin' in j.exchanges, true);

r = await call('/ping', { origin: 'https://otra.example' }); j = await r.json();
assert.equal(r.status, 403); assert.equal(r.headers.get('access-control-allow-origin'), 'https://otra.example');
assert.match(j.fix, /ALLOWED_ORIGIN/); assert.equal(j.expected, env.ALLOWED_ORIGIN);

r = await call('/ping', { token: 'incorrecto' }); assert.equal(r.status, 401);
r = await call('/ping', { method: 'OPTIONS', token: '' }); assert.equal(r.status, 204);

const id = 'a'.repeat(32), payload = { updated: 100, baseUpdated: 0, device: 'pc', data: 'CIFRADO_SIN_DATOS_REALES' };
r = await call('/sync/' + id, { method: 'PUT', body: JSON.stringify(payload) }); assert.equal(r.status, 200);
r = await call('/sync/' + id); j = await r.json(); assert.equal(j.data, payload.data); assert.equal(JSON.stringify(j).includes('Santander'), false);
r = await call('/sync/' + id, { method: 'PUT', body: JSON.stringify({ ...payload, updated: 101, baseUpdated: 99 }) }); assert.equal(r.status, 409);

r = await call('/backups/' + id); assert.equal(r.status, 200);

for (const body of [
  { mode: 'preset', provider: 'auto', payload: { kind: 'quality' } },
  { mode: 'chat', provider: 'auto', messages: [{ role: 'user', text: 'Hola' }], context: {} },
  { mode: 'categorize', provider: 'auto', items: ['MERCADONA'], categories: [] },
  { mode: 'parse_import', provider: 'auto', text: '01/11/2026 CAFE -2,50' }
]) {
  r = await call('/ai', { method: 'POST', body: JSON.stringify(body) });
  assert.equal(r.status, 500); j = await r.json(); assert.match(j.error, /proveedor/i);
}

r = await call('/bank/aspsps?country=ES'); assert.equal(r.status, 500);
r = await call('/history?exchange=otro'); assert.equal(r.status, 500);
r = await call('/onchain?chain=eth'); assert.equal(r.status, 500);

// Fast failover & cooldown tests for Gemini
const origFetch = globalThis.fetch;
try {
  const envGemini = { ...env, GEMINI_API_KEY: 'AIzaTestKey' };
  const tried1 = [], tried2 = [], tried3 = [], tried4 = [];
  globalThis.fetch = async (url) => {
    const m = String(url).match(/models\/([^:]+):/)?.[1] || '';
    tried1.push(m);
    if (m === 'gemini-3.8-flash') return new Response(JSON.stringify({ error: { message: 'This model is currently experiencing high demand.' } }), { status: 503 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK_FAST_FALLBACK' }] } }] }), { status: 200 });
  };
  r = await call('/ai', { method: 'POST', body: JSON.stringify({ mode: 'chat', provider: 'gemini', messages: [{ role: 'user', text: 'Hola' }], context: {} }) });
  assert.equal(r.status, 500); // smoke check env without GEMINI_API_KEY still 500

  r = await worker.fetch(new Request('https://worker.test/ai', { method: 'POST', headers: { Origin: envGemini.ALLOWED_ORIGIN, 'X-Caudal-Token': envGemini.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat', provider: 'gemini', messages: [{ role: 'user', text: 'Hola' }], context: {} }) }), envGemini);
  j = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(tried1, ['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  assert.equal(j.model, 'gemini-3.5-flash-lite');

  globalThis.fetch = async (url) => {
    const m = String(url).match(/models\/([^:]+):/)?.[1] || '';
    tried2.push(m);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK_COOLDOWN' }] } }] }), { status: 200 });
  };
  r = await worker.fetch(new Request('https://worker.test/ai', { method: 'POST', headers: { Origin: envGemini.ALLOWED_ORIGIN, 'X-Caudal-Token': envGemini.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat', provider: 'gemini', messages: [{ role: 'user', text: 'Hola 2' }], context: {} }) }), envGemini);
  j = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(tried2, ['gemini-3.5-flash-lite']);
  assert.equal(j.model, 'gemini-3.5-flash-lite');

  globalThis.fetch = async (url) => {
    const m = String(url).match(/models\/([^:]+):/)?.[1] || '';
    tried3.push(m);
    if (m === 'gemini-custom-429') return new Response(JSON.stringify({ error: { message: 'RESOURCE_EXHAUSTED' } }), { status: 429 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'OK_429' }] } }] }), { status: 200 });
  };
  r = await worker.fetch(new Request('https://worker.test/ai', { method: 'POST', headers: { Origin: envGemini.ALLOWED_ORIGIN, 'X-Caudal-Token': envGemini.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat', provider: 'gemini', model: 'gemini-custom-429', messages: [{ role: 'user', text: 'Hola 3' }], context: {} }) }), envGemini);
  j = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(tried3, ['gemini-custom-429', 'gemini-3.5-flash-lite']);
  assert.equal(j.model, 'gemini-3.5-flash-lite');

  globalThis.fetch = async (url) => {
    const m = String(url).match(/models\/([^:]+):/)?.[1] || '';
    tried4.push(m);
    return new Response(JSON.stringify({ error: { message: 'API key not valid. Please pass a valid API key.' } }), { status: 400 });
  };
  r = await worker.fetch(new Request('https://worker.test/ai', { method: 'POST', headers: { Origin: envGemini.ALLOWED_ORIGIN, 'X-Caudal-Token': envGemini.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'chat', provider: 'gemini', messages: [{ role: 'user', text: 'Hola 4' }], context: {} }) }), envGemini);
  j = await r.json();
  assert.equal(r.status, 500);
  assert.deepEqual(tried4, ['gemini-3.5-flash-lite']);
  assert.match(j.error, /API key not valid/);
} finally {
  globalThis.fetch = origFetch;
}

console.log('Worker smoke: TODO OK');
