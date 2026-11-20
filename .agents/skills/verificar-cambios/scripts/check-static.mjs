import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const JS_MODULES = [
  'js/state.js', 'js/finance.js', 'js/charts.js', 'js/importers.js',
  'js/live.js', 'js/connectors.js', 'js/ai.js',
  'js/views-desktop.js', 'js/views-mobile.js', 'js/app.js'
];

const fails = [];
const ok = (msg) => console.log('  ✓', msg);
const fail = (msg) => {
  console.log('  ✗', msg);
  fails.push(msg);
};
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

console.log('Static checks · Finanzas');

// 1. Sintaxis JS de módulos y Service Worker
const jsContents = {};
let syntaxErrors = 0;
for (const file of [...JS_MODULES, 'sw.js']) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    fail(`Falta archivo ${file}`);
    syntaxErrors++;
    continue;
  }
  const code = fs.readFileSync(fullPath, 'utf8');
  if (file !== 'sw.js') jsContents[file] = code;
  try {
    new vm.Script(code, { filename: file });
  } catch (err) {
    fail(`Error de sintaxis en ${file}: ${err.message}`);
    syntaxErrors++;
  }
}
if (syntaxErrors === 0) ok(`Sintaxis válida en ${JS_MODULES.length} módulos JS y sw.js`);

const jsAll = JS_MODULES.map((m) => jsContents[m] || '').join('\n');

// 2. Funciones duplicadas y reasignadas (parches)
const counts = new Map();
for (const match of jsAll.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
  const name = match[1];
  counts.set(name, (counts.get(name) || 0) + 1);
}
const dup = [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name).sort();
if (dup.length) fail(`Funciones definidas dos veces: ${dup.join(', ')}`);
else ok('Ninguna función duplicada');

const reas = [];
for (const name of [...counts.keys()].sort()) {
  const re = new RegExp(`(?<![\\w$.])(?:window\\.)?${escapeRegExp(name)}\\s*=\\s*(?:async\\s+)?(?:function\\b|\\([^)]*\\)\\s*=>)`);
  if (re.test(jsAll)) reas.push(name);
}
if (reas.length) fail(`Funciones reasignadas (parches): ${reas.join(', ')}`);
else ok('Ninguna función reasignada');

// 3. Enlaces en index.html
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const missingInHtml = [...JS_MODULES, 'css/app.css'].filter((asset) => !html.includes(asset));
if (missingInHtml.length) fail(`Faltan enlaces en index.html: ${missingInHtml.join(', ')}`);
else ok('index.html enlaza css/app.css y los 10 módulos JS');

// 4. manifest.json válido e id estable
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  if (manifest.id === 'finanzas-app') ok('manifest.json válido con id finanzas-app');
  else fail(`manifest.json tiene id inesperado: ${manifest.id}`);
} catch (err) {
  fail(`manifest.json inválido: ${err.message}`);
}

// 5. Coherencia de versiones APP_VERSION y W_VERSION con CONTEXTO_FINANZAS.md
const stateJs = jsContents['js/state.js'] || '';
const workerJs = fs.readFileSync(path.join(ROOT, 'worker.js'), 'utf8');
const ctxMd = fs.existsSync(path.join(ROOT, 'CONTEXTO_FINANZAS.md'))
  ? fs.readFileSync(path.join(ROOT, 'CONTEXTO_FINANZAS.md'), 'utf8')
  : '';
const appVer = stateJs.match(/APP_VERSION\s*=\s*'(v\d+)'/)?.[1];
const appRev = stateJs.match(/APP_REVISION\s*=\s*(\d+)/)?.[1];
const wVer = workerJs.match(/W_VERSION\s*=\s*'(w\d+)'/)?.[1];
const ctxAppVer = ctxMd.match(/Versión actual:\s*\*?\*?(v\d+)/)?.[1];
const ctxWVer = ctxMd.match(/Worker\s+\*\*?(w\d+)\*\*?/)?.[1];

if (appVer && ctxAppVer && appVer === ctxAppVer && wVer && ctxWVer && wVer === ctxWVer) {
  ok(`Versiones coherentes: ${appVer} (rev ${appRev || '?'}) · Worker ${wVer}`);
} else {
  fail(`Desajuste de versiones: state=${appVer}/${appRev}, worker=${wVer}, contexto=${ctxAppVer}/${ctxWVer}`);
}

// 6. Contratos protegidos y máscara de privacidad
const missingMarkers = ["STORE = 'caudal_v1'", "'caudal:'", "'X-Caudal-Token'"].filter((m) => !jsAll.includes(m));
if (missingMarkers.length) fail(`Faltan contratos protegidos: ${missingMarkers.join(', ')}`);
else ok('Contratos caudal_v1, caudal: y X-Caudal-Token conservados');

const css = fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf8');
if (jsAll.includes('<span class="money">') && jsAll.includes('t.bal') && css.includes('.hide-amounts .money')) {
  ok('Máscara de privacidad en importes y saldos conservada');
} else {
  fail('Falta algún marcador de máscara de privacidad');
}

console.log();
if (fails.length) {
  console.log(`FALLOS (${fails.length}):`);
  for (const f of fails) console.log(' -', f);
  process.exit(1);
}
console.log('Static checks: TODO OK');
