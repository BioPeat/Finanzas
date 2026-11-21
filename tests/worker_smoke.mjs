import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const source = await fs.readFile(new URL('../worker.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const worker = mod.default;
const store = new Map();
const CAUDAL = {
  async get(k, type) { const v = store.get(k) ?? null; return type === 'json' && v ? JSON.parse(v) : v; },
  async put(k, v) { store.set(k, v); },
  async delete(k) { store.delete(k); }
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
const conflictBody = await r.json();
assert.equal(conflictBody.currentUpdated, 100);
assert.equal(conflictBody.current?.data, payload.data);

r = await call('/backups/' + id); assert.equal(r.status, 200);

// Unknown >= 24-char token from ALLOWED_ORIGIN MUST be rejected with 401 once owner is bound
const unknownLongToken = 'TOKEN-DESCONOCIDO-LARGO-2026-XYZ-999';
r = await call('/ping', { token: unknownLongToken }); assert.equal(r.status, 401);
r = await call('/sync/' + id, { token: unknownLongToken }); assert.equal(r.status, 401);
assert.equal(await CAUDAL.get('auth:tokens'), null);

// Single-owner TOFU binding on first /sync/<id> when auth:owner_sha256 is unset
store.delete('auth:owner_sha256');
const ownerBrowserToken = 'USER-BROWSER-TOKEN-2026-ABCDEF123';
r = await call('/sync/' + id, { token: ownerBrowserToken }); assert.equal(r.status, 200);
r = await call('/ping', { token: ownerBrowserToken }); assert.equal(r.status, 200);
r = await call('/ping', { token: 'OTHER-UNKNOWN-TOKEN-2026-XYZ987' }); assert.equal(r.status, 401);
r = await call('/sync/' + id, { token: 'OTHER-UNKNOWN-TOKEN-2026-XYZ987' }); assert.equal(r.status, 401);

// KV Credentials Vault (AES-GCM encrypted at rest in CAUDAL + env > KV precedence + zero secret leak)
const testSecrets = {
  OKX_KEY: 'okx_key_secret_value_111',
  OKX_SECRET: 'okx_sec_secret_value_222',
  OKX_PASSPHRASE: 'okx_pass_secret_value_333',
  KUCOIN_KEY: 'kc_key_secret_value_444',
  KUCOIN_SECRET: 'kc_sec_secret_value_555',
  KUCOIN_PASSPHRASE: 'kc_pass_secret_value_666'
};
r = await call('/credentials', { method: 'POST', body: JSON.stringify({ set: testSecrets }) });
assert.equal(r.status, 200);
j = await r.json();
assert.equal(j.exchanges.okx, true);
assert.equal(j.exchanges.kucoin, true);
for (const secVal of Object.values(testSecrets)) {
  assert.equal(JSON.stringify(j).includes(secVal), false);
}
const rawVaultStr = await CAUDAL.get('vault:credentials');
assert.equal(typeof rawVaultStr, 'string');
for (const secVal of Object.values(testSecrets)) {
  assert.equal(rawVaultStr.includes(secVal), false);
}
const rawVaultObj = await CAUDAL.get('vault:credentials', 'json');
assert.equal(rawVaultObj.v, 1);
assert.equal(typeof rawVaultObj.iv, 'string');
assert.equal(typeof rawVaultObj.ct, 'string');
assert.equal('OKX_KEY' in rawVaultObj, false);

r = await call('/ping');
assert.equal(r.status, 200);
j = await r.json();
assert.equal(j.exchanges.okx, true);
assert.equal(j.exchanges.kucoin, true);
for (const secVal of Object.values(testSecrets)) {
  assert.equal(JSON.stringify(j).includes(secVal), false);
}

r = await call('/credentials');
assert.equal(r.status, 200);
j = await r.json();
assert.equal(j.exchanges.okx, true);
assert.equal(j.vaultLocked, false);
assert.equal(j.credentialSources.okx, 'vault');
assert.equal(j.credentialSources.kucoin, 'vault');
assert.equal(j.credentialSources.bybit, null);
for (const secVal of Object.values(testSecrets)) {
  assert.equal(JSON.stringify(j).includes(secVal), false);
}

// Verify env > KV precedence in credentialSources ('env' when configured in Cloudflare env)
const envWithBinance = { ...env, BINANCE_KEY: 'env_bn_key', BINANCE_SECRET: 'env_bn_sec' };
r = await worker.fetch(new Request('https://worker.test/ping', { headers: { Origin: env.ALLOWED_ORIGIN, 'X-Caudal-Token': env.TOKEN } }), envWithBinance);
j = await r.json();
assert.equal(r.status, 200);
assert.equal(j.credentialSources.binance, 'env');
assert.equal(j.credentialSources.okx, 'vault');

// Verify automatic migration of legacy plaintext vault JSON on read -> encrypted { v: 1, iv, ct }
await CAUDAL.put('vault:credentials', JSON.stringify({ BYBIT_KEY: 'legacy_bb_key_999', BYBIT_SECRET: 'legacy_bb_sec_999' }));
r = await call('/ping');
j = await r.json();
assert.equal(r.status, 200);
assert.equal(j.exchanges.bybit, true);
assert.equal(j.credentialSources.bybit, 'vault');
assert.equal(j.vaultLocked, false);
const migratedRaw = await CAUDAL.get('vault:credentials');
assert.equal(migratedRaw.includes('legacy_bb_key_999'), false);
const migratedObj = await CAUDAL.get('vault:credentials', 'json');
assert.equal(migratedObj.v, 1);

// Verify rotated TOKEN exposes vaultLocked: true on /ping, returns 409 on POST /credentials without forceReset, and succeeds with forceReset: true
const envRotated = { ...env, TOKEN: 'TOKEN-ROTADO-NUEVO-9876543210-ABCDEF' };
r = await worker.fetch(new Request('https://worker.test/ping', { headers: { Origin: envRotated.ALLOWED_ORIGIN, 'X-Caudal-Token': envRotated.TOKEN } }), envRotated);
j = await r.json();
assert.equal(r.status, 200);
assert.equal(j.vaultLocked, true);
assert.equal(j.exchanges.bybit, false);

r = await worker.fetch(new Request('https://worker.test/credentials', { method: 'POST', headers: { Origin: envRotated.ALLOWED_ORIGIN, 'X-Caudal-Token': envRotated.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ set: testSecrets }) }), envRotated);
j = await r.json();
assert.equal(r.status, 409);
assert.equal(j.vaultLocked, true);

r = await worker.fetch(new Request('https://worker.test/credentials', { method: 'POST', headers: { Origin: envRotated.ALLOWED_ORIGIN, 'X-Caudal-Token': envRotated.TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ set: testSecrets, forceReset: true }) }), envRotated);
j = await r.json();
assert.equal(r.status, 200);
assert.equal(j.vaultLocked, false);
assert.equal(j.exchanges.okx, true);
assert.equal(j.credentialSources.okx, 'vault');

// Restore vault encrypted under original env.TOKEN for subsequent tests
r = await call('/credentials', { method: 'POST', body: JSON.stringify({ set: testSecrets, forceReset: true }) });
assert.equal(r.status, 200);

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

// Mirrors, multi-origin ALLOWED_ORIGIN, Enable Banking PKCS#1 + PKCS#8, OKX EEA failover + Funding, and Kraken monotonic nonce
const envMirrors = {
  ...env,
  ALLOWED_ORIGIN: 'https://usuario.github.io, https://otro.github.io',
  FALLBACK_URLS: 'https://backup1.netlify.app/, https://backup2.example'
};
r = await worker.fetch(new Request('https://worker.test/ping', { headers: { Origin: 'https://otro.github.io', 'X-Caudal-Token': env.TOKEN } }), envMirrors);
j = await r.json();
assert.equal(r.status, 200);
assert.equal(r.headers.get('access-control-allow-origin'), 'https://otro.github.io');
assert.deepEqual(j.mirrors, ['https://backup1.netlify.app', 'https://backup2.example']);

try {
  // Enable Banking PKCS#8 and PKCS#1 JWT verification
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pkcs8Pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const pkcs1Pem = privateKey.export({ type: 'pkcs1', format: 'pem' });
  const verifiedJwts = [];
  globalThis.fetch = async (url, init) => {
    const auth = init?.headers?.Authorization || '';
    assert.match(auth, /^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const token = auth.slice(7);
    const [h, p, s] = token.split('.');
    const valid = crypto.verify('RSA-SHA256', Buffer.from(h + '.' + p), publicKey, Buffer.from(s, 'base64url'));
    assert.equal(valid, true);
    verifiedJwts.push(JSON.parse(Buffer.from(h, 'base64url').toString('utf8')).kid);
    return new Response(JSON.stringify({ aspsps: [{ name: 'Santander', country: 'ES' }] }), { status: 200 });
  };
  for (const pem of [pkcs8Pem, pkcs1Pem, pkcs1Pem.replace(/\n/g, '\\n')]) {
    const envEb = { ...env, ENABLE_BANKING_APP_ID: ' app-id-eb ', ENABLE_BANKING_PRIVATE_KEY: pem };
    r = await worker.fetch(new Request('https://worker.test/bank/aspsps?country=ES', { headers: { Origin: env.ALLOWED_ORIGIN, 'X-Caudal-Token': env.TOKEN } }), envEb);
    assert.equal(r.status, 200);
    j = await r.json();
    assert.equal(j.aspsps[0].name, 'Santander');
  }
  assert.deepEqual(verifiedJwts, ['app-id-eb', 'app-id-eb', 'app-id-eb']);

  // OKX EEA failover (50119 on www.okx.com -> eea.okx.com + Funding wallet) & Kraken monotonic nonces
  const okxUrls = [], krakenNonces = [];
  const krSec = Buffer.from('secret_bytes_kraken').toString('base64');
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.startsWith('https://www.okx.com')) {
      okxUrls.push(u);
      return new Response(JSON.stringify({ code: '50119', msg: "API key doesn't exist" }), { status: 200 });
    }
    if (u === 'https://eea.okx.com/api/v5/account/balance') {
      okxUrls.push(u);
      return new Response(JSON.stringify({ code: '0', data: [{ details: [{ ccy: 'BTC', eq: '0.25' }] }] }), { status: 200 });
    }
    if (u === 'https://eea.okx.com/api/v5/asset/balances') {
      okxUrls.push(u);
      return new Response(JSON.stringify({ code: '0', data: [{ ccy: 'EUR', bal: '500' }] }), { status: 200 });
    }
    if (u === 'https://eea.okx.com/api/v5/account/positions') {
      okxUrls.push(u);
      return new Response(JSON.stringify({ code: '0', data: [] }), { status: 200 });
    }
    if (u.startsWith('https://api.kraken.com/0/private/')) {
      const sp = new URLSearchParams(String(init?.body || ''));
      krakenNonces.push(BigInt(sp.get('nonce')));
      return new Response(JSON.stringify({ error: [], result: u.endsWith('/Balance') ? { ZEUR: '120' } : {} }), { status: 200 });
    }
    throw new Error('Unexpected fetch URL in smoke test: ' + u);
  };
  const envEx = {
    ...env,
    OKX_KEY: ' okx_k ', OKX_SECRET: 'okx_s', OKX_PASSPHRASE: 'okx_p',
    KRAKEN_KEY: ' kr_k ', KRAKEN_SECRET: krSec
  };
  r = await worker.fetch(new Request('https://worker.test/balances', { headers: { Origin: env.ALLOWED_ORIGIN, 'X-Caudal-Token': env.TOKEN } }), envEx);
  j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.exchanges.okx.assets.BTC, 0.25);
  assert.equal(j.exchanges.okx.assets.EUR, 500);
  assert.equal(okxUrls.includes('https://www.okx.com/api/v5/account/balance'), true);
  assert.equal(okxUrls.includes('https://eea.okx.com/api/v5/account/balance'), true);
  assert.equal(okxUrls.includes('https://eea.okx.com/api/v5/asset/balances'), true);
  assert.equal(j.exchanges.kraken.assets.ZEUR, 120);
  assert.equal(krakenNonces.length, 2);
  assert.equal(krakenNonces[1] > krakenNonces[0], true);
} finally {
  globalThis.fetch = origFetch;
}

console.log('Worker smoke: TODO OK');
