// ===== Importadores universales (XLSX, CSV, OFX, QIF, JSON y extracción IA) =====
"use strict";

async function unzip(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), out = {};
  let e = buf.byteLength - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw Error('El archivo no es un Excel .xlsx válido.');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen)); p += 46 + nlen + xlen + clen;
    if (!/^xl\/(sharedStrings|workbook|worksheets\/sheet\d+)\.xml$/.test(name)) continue;
    const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), data = u8.subarray(start, start + csize);
    if (method === 0) out[name] = new TextDecoder().decode(data);
    else { const s = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')); out[name] = await new Response(s).text(); }
  }
  return out;
}
async function readXlsx(buf) {
  const z = await unzip(buf), xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const shared = z['xl/sharedStrings.xml'] ? [...xml(z['xl/sharedStrings.xml']).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
  const sheets = Object.keys(z).filter(k => k.includes('worksheets/')).sort(); if (!sheets.length) throw Error('El Excel no tiene hojas.');
  const all = sheets.map(sheet => {
    const rows = [];
    for (const r of xml(z[sheet]).getElementsByTagName('row')) {
      const row = [];
      for (const c of r.getElementsByTagName('c')) {
        const ref = c.getAttribute('r') || '', colIdx = [...ref.replace(/\d+/g, '')].reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1, t = c.getAttribute('t');
        const v = c.getElementsByTagName('v')[0]?.textContent, isv = c.getElementsByTagName('is')[0];
        row[colIdx < 0 ? row.length : colIdx] = t === 's' ? shared[+v] : t === 'inlineStr' ? (isv?.textContent || '') : t === 'str' || t === 'b' ? v : v != null && v !== '' ? Number(v) : '';
      }
      rows.push(Array.from(row, x => x ?? ''));
    }
    return rows;
  });
  return all.sort((a, b) => b.filter(r => r.some(c => String(c).trim())).length - a.filter(r => r.some(c => String(c).trim())).length)[0];
}
function parseCSV(text) {
  text = text.replace(/^\ufeff/, '');
  const lines = text.split(/\r?\n/).slice(0, 12).join('\n');
  const sep = [';', ',', '\t'].sort((a, b) => lines.split(b).length - lines.split(a).length)[0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim()));
}
const H = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function findHeader(rows, needles) {
  for (let i = 0; i < Math.min(rows.length, 40); i++) { const hs = rows[i].map(H); if (needles.every(n => hs.some(h => n.some(x => h === x || h.startsWith(x))))) return i; }
  return -1;
}
const FORMATS = {
  santander: { name: 'Santander', type: 'bank', need: [['fechaoperacion'], ['concepto'], ['importe']] },
  bbva: { name: 'BBVA / CaixaBank / genérico', type: 'bank', need: [['fecha'], ['concepto', 'descripcion', 'movimiento'], ['importe']] },
  revolut: { name: 'Revolut', type: 'bank', need: [['type'], ['completeddate', 'starteddate'], ['description'], ['amount'], ['currency']] },
  binance: { name: 'Binance (historial)', type: 'ledger', need: [['utctime'], ['operation'], ['coin'], ['change']] },
  kraken: { name: 'Kraken (ledgers)', type: 'ledger', need: [['refid'], ['time'], ['type'], ['asset'], ['amount']] },
  kucoin: { name: 'KuCoin', type: 'ledger', need: [['currency', 'coin'], ['amount'], ['time', 'timeutc', 'timeutc0800', 'createdat'], ['type', 'side', 'direction', 'bizname', 'remark']] }
};
function detect(rows) {
  for (const [k, f] of Object.entries(FORMATS)) { const i = findHeader(rows, f.need); if (i >= 0) return { fmt: k, head: i }; }
  return { fmt: '', head: -1 };
}
function col(hs, ...names) { for (const n of names) { const i = hs.findIndex(h => h === n); if (i >= 0) return i; } for (const n of names) { const i = hs.findIndex(h => h.startsWith(n)); if (i >= 0) return i; } return -1; }

function parseBank(rows, fmt, head) {
  const hs = rows[head].map(H), out = []; let meta = {};
  if (fmt === 'revolut') {
    const iT = col(hs, 'completeddate', 'starteddate'), iD = col(hs, 'description'), iA = col(hs, 'amount'), iF = col(hs, 'fee'), iB = col(hs, 'balance'), iS = col(hs, 'state'), iC = col(hs, 'currency');
    for (const r of rows.slice(head + 1)) {
      if (iS >= 0 && !/COMPLETED/i.test(r[iS])) continue;
      const a = toNum(r[iA]) - (toNum(r[iF]) || 0); if (!isFinite(a)) continue;
      out.push({ date: toDate(r[iT]).slice(0, 10), desc: String(r[iD] || '').trim(), amount: round(a), bal: iB >= 0 ? toNum(r[iB]) : NaN, cur: r[iC] || 'EUR' });
    }
    meta.inst = 'Revolut'; return { rows: out.filter(x => x.date), meta };
  }
  const iD = col(hs, 'fechaoperacion', 'fecha', 'date'), iC = col(hs, 'concepto', 'descripcion', 'movimiento', 'description'), iA = col(hs, 'importe', 'amount', 'cantidad'), iB = col(hs, 'saldo', 'balance');
  for (const r of rows.slice(head + 1)) {
    const a = toNum(r[iA]), d = toDate(r[iD]); if (!d || !isFinite(a)) continue;
    out.push({ date: d.slice(0, 10), desc: String(r[iC] || '').replace(/\s+/g, ' ').trim(), amount: round(a), bal: iB >= 0 ? toNum(r[iB]) : NaN });
  }
  for (let i = 0; i < head; i++) for (let j = 0; j < rows[i].length; j++) {
    const v = String(rows[i][j] || '');
    if (/^ES\d{2}[\d ]{16,}/.test(v.replace(/\s+/g, ' '))) meta.iban = v.replace(/\s+/g, '');
    if (H(v) === 'saldo' && rows[i + 1]) meta.bal = toNum(rows[i + 1][j]);
    if (H(v) === 'titular' && rows[i + 1]) meta.holder = String(rows[i + 1][j] || '');
  }
  meta.inst = fmt === 'santander' ? 'Santander' : '';
  return { rows: out, meta };
}
function binanceKind(op, acct) {
  const o = String(op || '');
  if (/futures|margin/i.test(acct || '') && /Realized Profit|Funding Fee|Insurance|Liquidation/i.test(o)) return 'deriv';
  if (/Funding Fee|Realized Profit/i.test(o)) return 'deriv';
  if (/Subscription|Redemption|Transfer Between|Main and Funding|Funding Account|Transfer In|Transfer Out|to Pool|Auto-Invest Transfer|Isolated|Cross Margin.*Transfer/i.test(o)) return 'move';
  if (/Withdraw/i.test(o)) return 'withdraw';
  if (/Deposit|P2P|Buy Crypto With Fiat/i.test(o)) return /P2P/i.test(o) ? 'trade' : 'deposit';
  if (/Fee/i.test(o)) return 'fee';
  if (/Interest|Reward|Staking|Distribution|Airdrop|Cashback|Rebate|Launchpool|Megadrop|Bonus|Commission/i.test(o)) return 'reward';
  if (/Buy|Sell|Transaction|Convert|Small Assets|Exchange|OTC|Auto-Invest|Trade/i.test(o)) return 'trade';
  return 'other';
}
function krakenKind(type, sub) {
  const t = String(type).toLowerCase(), s = String(sub || '').toLowerCase();
  if (t === 'trade' || t === 'spend' || t === 'receive') return 'trade';
  if (t === 'deposit') return 'deposit'; if (t === 'withdrawal') return 'withdraw';
  if (t === 'staking' || (t === 'earn' && /reward/.test(s)) || t === 'dividend' || t === 'airdrop') return 'reward';
  if (t === 'earn' || t === 'transfer') return 'move';
  if (t === 'margin' || t === 'rollover' || t === 'settled') return 'deriv';
  return 'other';
}
function parseLedger(rows, fmt, head, map) {
  const hs = rows[head].map(H), out = [];
  if (fmt === 'binance') {
    const iT = col(hs, 'utctime'), iA = col(hs, 'account'), iO = col(hs, 'operation'), iC = col(hs, 'coin'), iX = col(hs, 'change'), iR = col(hs, 'remark');
    for (const r of rows.slice(head + 1)) {
      const ch = toNum(r[iX]), t = toDate(r[iT]); if (!t || !isFinite(ch) || !ch) continue;
      out.push({ t, asset: normAsset(r[iC]), change: ch, kind: binanceKind(r[iO], r[iA]), ref: 'bn|' + t, note: String(r[iO] || '') + (r[iR] ? ' · ' + r[iR] : ''), wallet: String(r[iA] || '') });
    }
  } else if (fmt === 'kraken') {
    const iRef = col(hs, 'refid'), iT = col(hs, 'time'), iTy = col(hs, 'type'), iSu = col(hs, 'subtype'), iA = col(hs, 'asset'), iX = col(hs, 'amount'), iF = col(hs, 'fee');
    for (const r of rows.slice(head + 1)) {
      const t = toDate(r[iT]), ch = toNum(r[iX]), fee = toNum(r[iF]) || 0, asset = normAsset(r[iA]), kind = krakenKind(r[iTy], r[iSu]);
      if (!t || !isFinite(ch)) continue;
      if (ch) out.push({ t, asset, change: ch, kind, ref: 'kr|' + r[iRef], note: r[iTy] + (r[iSu] ? ' · ' + r[iSu] : '') });
      if (fee) out.push({ t, asset, change: -Math.abs(fee), kind: 'fee', ref: 'kr|' + r[iRef], note: 'Comisión' });
    }
  } else {
    const m = map || { t: col(hs, 'timeutc', 'time', 'createdat', 'date', 'fecha'), asset: col(hs, 'currency', 'coin', 'asset', 'activo'), amt: col(hs, 'amount', 'change', 'cantidad'), side: col(hs, 'side', 'direction', 'tipo'), op: col(hs, 'bizname', 'type', 'remark', 'operation'), fee: col(hs, 'fee'), ref: col(hs, 'orderid', 'tradeid', 'refid', 'id') };
    const utc8 = rows[head].some(h => /UTC\+08/i.test(h));
    for (const r of rows.slice(head + 1)) {
      let t = toDate(r[m.t]); if (!t) continue;
      if (utc8) { const d = new Date(t.replace(' ', 'T') + '+08:00'); t = d.toISOString().slice(0, 19).replace('T', ' '); }
      let ch = toNum(r[m.amt]); if (!isFinite(ch) || !ch) continue;
      const side = String(r[m.side] ?? '').toLowerCase(), op = String(r[m.op] ?? '');
      if (ch > 0 && /out|withdraw|sell|spend|retir|salida/.test(side)) ch = -ch;
      let kind = binanceKind(op + ' ' + side, ''); if (kind === 'other') kind = /deposit/.test(side) ? 'deposit' : /withdraw/.test(side) ? 'withdraw' : 'trade';
      out.push({ t, asset: normAsset(r[m.asset]), change: ch, kind, ref: fmt + '|' + (m.ref >= 0 && r[m.ref] ? r[m.ref] : t), note: op || side });
      const fee = m.fee >= 0 ? toNum(r[m.fee]) : 0; if (fee) out.push({ t, asset: normAsset(r[m.asset]), change: -Math.abs(fee), kind: 'fee', ref: fmt + '|' + (m.ref >= 0 && r[m.ref] ? r[m.ref] : t), note: 'Comisión' });
    }
  }
  return out;
}

const txKey = t => t.acc + '|' + t.date + '|' + t.amount + '|' + t.desc.slice(0, 60) + '|' + (isFinite(t.bal) ? t.bal : '');
const lgKey = l => l.acc + '|' + l.t + '|' + l.asset + '|' + l.change + '|' + l.kind + '|' + (l.ref || '');

function parseOFX(text) {
  const clean = String(text).replace(/\r/g, ''), blocks = clean.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || clean.match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>)/gi) || [];
  const get = (b, k) => { const m = b.match(new RegExp('<' + k + '>([^<\n\r]+)', 'i')); return m ? m[1].trim() : ''; };
  const rows = [['fecha', 'concepto', 'importe', 'saldo']];
  for (const b of blocks) {
    const raw = get(b, 'DTPOSTED').slice(0, 8), date = raw.length === 8 ? raw.slice(0, 4) + '-' + raw.slice(4, 6) + '-' + raw.slice(6, 8) : '', amount = get(b, 'TRNAMT'), desc = [get(b, 'NAME'), get(b, 'MEMO')].filter(Boolean).join(' · ');
    if (date && amount) rows.push([date, desc || get(b, 'FITID') || 'Movimiento', amount, '']);
  }
  if (rows.length === 1) throw Error('No encuentro movimientos en el archivo OFX/QFX.');
  return rows;
}
function parseQIF(text) {
  const rows = [['fecha', 'concepto', 'importe', 'saldo']], items = String(text).replace(/\r/g, '').split(/^\^$/m);
  for (const b of items) {
    let d = '', a = '', desc = '';
    for (const line of b.split('\n')) { const k = line[0], v = line.slice(1).trim(); if (k === 'D') d = v.replace(/'/g, '/'); else if (k === 'T' || k === 'U') a = v; else if (k === 'P' || k === 'M') desc += (desc ? ' · ' : '') + v; }
    const date = toDate(d); if (date && a) rows.push([date.slice(0, 10), desc || 'Movimiento', a, '']);
  }
  if (rows.length === 1) throw Error('No encuentro movimientos en el archivo QIF.');
  return rows;
}

async function readFile(file) {
  if (/\.json$/i.test(file.name)) return { json: JSON.parse(await file.text()) };
  if (/\.xlsx$/i.test(file.name)) return { rows: await readXlsx(await file.arrayBuffer()) };
  if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
    const buf = await file.arrayBuffer(), bytes = new Uint8Array(buf);
    let bin = ''; for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
    return { image: { data: btoa(bin), mime: file.type || 'image/png' } };
  }
  if (/\.pdf$/i.test(file.name)) return { pdfText: await file.text() };
  if (/\.xls$/i.test(file.name)) throw Error('Ese archivo es .xls antiguo. Ábrelo y guárdalo como .xlsx o CSV, o pega una captura con Gemini IA.');
  const text = await file.text();
  if (/\.(ofx|qfx)$/i.test(file.name)) return { rows: parseOFX(text), forced: { fmt: 'bbva', head: 0 } };
  if (/\.qif$/i.test(file.name)) return { rows: parseQIF(text), forced: { fmt: 'bbva', head: 0 } };
  return { rows: parseCSV(text), rawText: text };
}

async function importFiles(files) {
  for (const f of files) {
    try {
      const r = await readFile(f);
      if (r.json) { importBackup(r.json); continue; }
      if (r.image) { openAIImportModal({ fileName: f.name, imageBase64: r.image.data, imageMime: r.image.mime }); continue; }
      if (r.pdfText != null) { openAIImportModal({ fileName: f.name, text: '', pdfHint: true }); continue; }
      const det = r.forced || detect(r.rows);
      if (!det.fmt) { openMapper(r.rows, f.name, r.rawText); continue; }
      openImport(r.rows, det, f.name);
    } catch (e) { toast(f.name + ': ' + e.message); }
  }
}

function openImport(rows, det, fname, map) {
  const F = FORMATS[det.fmt] || { name: 'Formato elegido', type: map?.type || 'bank' }, type = F.type;
  let parsed, meta = {};
  try { if (type === 'bank') { const p = parseBank(rows, det.fmt, det.head); parsed = p.rows; meta = p.meta; } else parsed = parseLedger(rows, det.fmt, det.head, map?.cols); }
  catch (e) { toast('No se pudo leer: ' + e.message); return; }
  if (!parsed.length) { toast('No hay movimientos en ' + fname); return; }
  const kinds = type === 'bank' ? ['bank'] : ['exchange', 'broker', 'wallet'];
  const guess = state.accounts.find(a => (meta.iban && a.iban === meta.iban) || (det.fmt && a.fmt === det.fmt && kinds.includes(a.kind)));
  const opts = state.accounts.filter(a => kinds.includes(a.kind)).map(a => '<option value="' + a.id + '"' + (guess?.id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>').join('');
  const dates = parsed.map(p => (p.date || p.t)).sort();
  const defName = meta.inst ? meta.inst + (meta.iban ? ' ·' + meta.iban.slice(-4) : '') : det.fmt ? F.name.split(' ')[0] : fname.replace(/\.\w+$/, '');
  modal('Importar ' + esc(fname), '<p>Formato detectado: <b>' + esc(F.name) + '</b> · ' + parsed.length + ' movimientos del ' + fmtDate(dates[0], { day: 'numeric', month: 'short', year: 'numeric' }) + ' al ' + fmtDate(dates.at(-1), { day: 'numeric', month: 'short', year: 'numeric' }) + '.</p>'
    + '<div class="form"><label class="f wide">Cuenta<select id="imp-acc">' + opts + '<option value="__new"' + (guess ? '' : ' selected') + '>+ Nueva cuenta</option></select></label>'
    + '<label class="f wide" id="imp-new-w"' + (guess ? ' hidden' : '') + '>Nombre de la cuenta nueva<input type="text" id="imp-name" value="' + esc(defName) + '"></label></div>'
    + (guess?.ebUid ? '<div class="callout info" style="margin-top:8px">Esta cuenta está conectada a Enable Banking (PSD2): al sincronizar se priorizarán sus datos en vivo.</div>' : '')
    + '<p class="note">Los movimientos repetidos se ignoran automáticamente, así que puedes reimportar periodos que se solapen sin duplicar nada.</p><div class="row" style="margin-top:12px"><button class="btn primary" type="button" id="imp-ok">Importar</button></div>');
  $('imp-acc').onchange = () => $('imp-new-w').hidden = $('imp-acc').value !== '__new';
  $('imp-ok').onclick = () => {
    let added = 0, dup = 0;
    change(() => {
      let acc = accById($('imp-acc').value);
      if (!acc) { acc = { id: 'a_' + uid(), name: $('imp-name').value.trim() || defName, kind: type === 'bank' ? 'bank' : 'exchange', inst: meta.inst || F.name.split(' ')[0], currency: 'EUR', iban: meta.iban || '', fmt: det.fmt, reportsSpain: det.fmt === 'binance' }; state.accounts.push(acc); }
      if (meta.iban && !acc.iban) acc.iban = meta.iban;
      if (type === 'bank') {
        const seen = new Set(state.tx.map(txKey));
        parsed.forEach((p, i) => { const t = { id: 't_' + uid() + i, acc: acc.id, date: p.date, desc: p.desc, amount: p.amount, bal: isFinite(p.bal) ? p.bal : null, ord: i, src: fname }; t.cat = categorize(t); const k = txKey(t); if (seen.has(k)) { dup++; return; } seen.add(k); state.tx.push(t); added++; });
      } else {
        const seen = new Set(state.ledger.map(lgKey));
        parsed.forEach((p, i) => { const l = { id: 'l_' + uid() + i, acc: acc.id, ...p, src: fname }; const k = lgKey(l); if (seen.has(k)) { dup++; return; } seen.add(k); state.ledger.push(l); added++; });
        for (const a of new Set(parsed.map(p => p.asset))) ensureAsset(a);
      }
    }, '');
    $('modal').close(); toast(added + ' movimientos importados' + (dup ? ' · ' + dup + ' ya estaban' : ''), true);
    if (type !== 'bank') refreshPrices();
  };
}

function openMapper(rows, fname, rawText = '') {
  let head = 0; for (let i = 0; i < Math.min(rows.length, 30); i++) if (rows[i].filter(c => String(c).trim()).length >= 3) { head = i; break; }
  const hs = rows[head], opt = sel => '<option value="-1">—</option>' + hs.map((h, i) => '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(h || ('Columna ' + (i + 1))) + '</option>').join('');
  const g = (...n) => col(hs.map(H), ...n);
  modal('Elegir columnas · ' + esc(fname), '<p>No reconozco automáticamente este archivo. Mapea sus columnas una vez o usa Gemini IA para extraerlo.</p>'
    + '<div class="form"><label class="f wide">Contenido<select id="mp-type"><option value="bank">Movimientos de banco o tarjeta</option><option value="ledger">Operaciones de inversión o cripto</option><option value="positions">Posiciones actuales (snapshot de cartera)</option></select></label>'
    + '<label class="f">Fecha<select id="mp-t">' + opt(g('fecha', 'date', 'time')) + '</select></label>'
    + '<label class="f" data-k="bank">Concepto<select id="mp-d">' + opt(g('concepto', 'descripcion', 'description')) + '</select></label>'
    + '<label class="f">Importe o cantidad<select id="mp-a">' + opt(g('importe', 'amount', 'cantidad', 'change')) + '</select></label>'
    + '<label class="f" data-k="bank">Débito/cargo (opcional)<select id="mp-debit">' + opt(g('debit', 'cargo', 'debe', 'withdrawal')) + '</select></label>'
    + '<label class="f" data-k="bank">Crédito/abono (opcional)<select id="mp-credit">' + opt(g('credit', 'abono', 'haber', 'deposit')) + '</select></label>'
    + '<label class="f" data-k="bank">Saldo (opcional)<select id="mp-b">' + opt(g('saldo', 'balance')) + '</select></label>'
    + '<label class="f" data-k="ledger" hidden>Activo<select id="mp-asset">' + opt(g('currency', 'coin', 'asset', 'activo')) + '</select></label>'
    + '<label class="f" data-k="ledger" hidden>Tipo de operación (opcional)<select id="mp-op">' + opt(g('type', 'operation', 'tipo')) + '</select></label></div>'
    + '<div class="row" style="margin-top:14px"><button class="btn primary" type="button" id="mp-ok">Continuar</button>'
    + '<button class="btn ai" type="button" id="mp-ai">' + ico('brain') + 'Extraer con Gemini IA</button></div>');
  $('mp-type').onchange = () => $$('[data-k]').forEach(e => e.hidden = !(e.dataset.k === $('mp-type').value || (e.dataset.k === 'ledger' && $('mp-type').value === 'positions')));
  $('mp-ok').onclick = () => {
    const v = id => +$(id).value;
    if ($('mp-type').value === 'bank') {
      const nr = [['fecha', 'concepto', 'importe', 'saldo']].concat(rows.slice(head + 1).map(r => { const amount = v('mp-a') >= 0 ? r[v('mp-a')] : (toNum(v('mp-credit') >= 0 ? r[v('mp-credit')] : 0) || 0) - Math.abs(toNum(v('mp-debit') >= 0 ? r[v('mp-debit')] : 0) || 0); return [r[v('mp-t')], r[v('mp-d')], amount, v('mp-b') >= 0 ? r[v('mp-b')] : '']; }));
      openImport(nr, { fmt: 'bbva', head: 0 }, fname);
    } else if ($('mp-type').value === 'positions') openPositionsImport(rows, head, fname, { date: v('mp-t'), asset: v('mp-asset'), qty: v('mp-a') });
    else openImport(rows, { fmt: '', head }, fname, { type: 'ledger', cols: { t: v('mp-t'), asset: v('mp-asset'), amt: v('mp-a'), side: -1, op: v('mp-op'), fee: -1, ref: -1 } });
  };
  $('mp-ai').onclick = () => openAIImportModal({ fileName: fname, text: rawText || rows.slice(0, 200).map(r => r.join(' ; ')).join('\n') });
}

function openPositionsImport(rows, head, fname, map) {
  const parsed = [];
  for (const r of rows.slice(head + 1)) {
    const asset = normAsset(r[map.asset]), qty = toNum(r[map.qty]), date = map.date >= 0 ? toDate(r[map.date]) : today() + ' 12:00:00';
    if (asset && isFinite(qty) && qty) parsed.push({ asset, qty, date: date || today() + ' 12:00:00' });
  }
  if (!parsed.length) return toast('No encuentro posiciones válidas. Revisa las columnas.');
  const opts = state.accounts.filter(a => ['broker', 'exchange', 'wallet'].includes(a.kind)).map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('');
  modal('Importar posiciones', '<p>He encontrado <b>' + parsed.length + ' posiciones</b>. Ideal para cualquier bróker (Trade Republic, MyInvestor, Degiro, IBKR…) que exporte tu cartera actual.</p>'
    + '<div class="form"><label class="f wide">Cuenta<select id="pos-acc">' + opts + '<option value="__new" selected>+ Nueva cuenta</option></select></label><label class="f wide">Nombre<input type="text" id="pos-name" value="' + esc(fname.replace(/\.\w+$/, '')) + '"></label></div>'
    + '<p class="note">Al volver a importar este mismo archivo se sustituye su snapshot anterior; no se duplica.</p><button class="btn primary" type="button" id="pos-ok">Importar snapshot</button>');
  $('pos-acc').onchange = () => $('pos-name').parentElement.hidden = $('pos-acc').value !== '__new';
  $('pos-ok').onclick = () => {
    change(() => {
      let a = accById($('pos-acc').value);
      if (!a) { a = { id: 'a_' + uid(), name: val('pos-name').trim() || 'Cartera', kind: 'broker', inst: '', currency: 'EUR' }; state.accounts.push(a); }
      const src = 'snapshot:' + fname; state.ledger = state.ledger.filter(l => !(l.acc === a.id && l.snapshotSource === src));
      for (const p of parsed) state.ledger.push({ id: 'l_' + uid(), acc: a.id, t: p.date, asset: p.asset, change: p.qty, kind: 'deposit', ref: src + '|' + p.asset, src: fname, note: 'Snapshot importado', snapshotSource: src });
      for (const p of parsed) ensureAsset(p.asset);
    }, 'Posiciones importadas');
    $('modal').close(); refreshPrices();
  };
}

function importBackup(o) {
  if (!o || !Array.isArray(o.accounts)) throw Error('No es una copia de Finanzas.');
  modal('Restaurar copia', '<p>La copia tiene ' + o.accounts.length + ' cuentas, ' + (o.tx || []).length + ' movimientos y ' + (o.ledger || []).length + ' operaciones. Sustituye lo que hay ahora (puedes deshacer).</p><button class="btn primary" type="button" id="bk-ok">Restaurar</button>');
  $('bk-ok').onclick = () => { const keep = clone(state.settings); change(() => { state = migrate(o); state.settings = { ...state.settings, worker: keep.worker, token: keep.token, sync: keep.sync }; }, 'Copia restaurada'); $('modal').close(); };
}

function openAIImportModal(opts = {}) {
  modal('Importador inteligente con Gemini IA', '<p class="muted">' + (opts.pdfHint ? 'Pega aquí el texto copiado de tu PDF o sube una captura de pantalla de tu banco/bróker para que Gemini extraiga movimientos o posiciones.' : opts.imageBase64 ? 'Captura cargada (' + esc(opts.fileName || 'imagen') + '). Pulsa Analizar con Gemini IA para detectar cuentas, movimientos o posiciones.' : 'Pega texto o tabla de cualquier banco, bróker o app y Gemini lo convertirá en movimientos limpios.') + '</p>'
    + (opts.imageBase64 ? '<div class="callout info" style="margin-bottom:10px">Imagen lista para análisis multimodal con Gemini (' + esc(opts.imageMime) + ').</div>' : '')
    + '<label class="f wide">Texto del extracto (opcional si subiste imagen)<textarea id="ai-imp-txt" placeholder="Pega aquí las líneas de tu extracto bancario o cartera…">' + esc(opts.text || '') + '</textarea></label>'
    + '<div class="row" style="margin-top:12px"><button class="btn ai" type="button" id="ai-imp-go">' + ico('brain') + 'Analizar con Gemini IA</button><button class="btn" type="button" onclick="$(\'file-in\').click()">Elegir otro archivo</button></div>'
    + '<div id="ai-imp-res" style="margin-top:14px"></div>');
  $('ai-imp-go').onclick = async () => {
    const btnEl = $('ai-imp-go'); btnEl.disabled = true; btnEl.textContent = 'Analizando con IA…';
    try {
      const parsed = await aiParseImport({ text: val('ai-imp-txt'), imageBase64: opts.imageBase64, imageMime: opts.imageMime });
      const rows = parsed.rows || [];
      if (!rows.length) { $('ai-imp-res').innerHTML = '<div class="callout">La IA no detectó filas importables. Prueba pegando más texto o una captura más nítida.</div>'; return; }
      const type = parsed.type || 'bank';
      const accOpts = state.accounts.map(a => '<option value="' + a.id + '">' + esc(a.name) + '</option>').join('');
      $('ai-imp-res').innerHTML = '<div class="callout ok">Detectados <b>' + rows.length + '</b> registros de tipo <b>' + esc(type) + '</b>.</div>'
        + '<div class="form" style="margin-top:10px"><label class="f">Cuenta<select id="ai-imp-acc">' + accOpts + '<option value="__new" selected>+ Nueva cuenta</option></select></label><label class="f">Nombre cuenta nueva<input type="text" id="ai-imp-name" value="' + esc(parsed.accountName || 'Importado IA') + '"></label></div>'
        + '<div class="scroll" style="max-height:220px;margin-top:10px"><table class="tbl"><tbody>' + rows.slice(0, 15).map(r => '<tr><td>' + esc(r.date || r.t || '') + '</td><td>' + esc(r.desc || r.asset || '') + '</td><td class="r">' + esc(r.amount ?? r.change ?? r.qty ?? '') + '</td></tr>').join('') + '</tbody></table></div>'
        + '<div class="row" style="margin-top:12px"><button class="btn primary" type="button" id="ai-imp-save">Confirmar e importar</button></div>';
      $('ai-imp-save').onclick = () => {
        let added = 0;
        change(() => {
          let acc = accById(val('ai-imp-acc'));
          if (!acc) { acc = { id: 'a_' + uid(), name: val('ai-imp-name').trim() || 'Importado IA', kind: type === 'bank' ? 'bank' : 'broker', inst: parsed.accountName || '', currency: 'EUR' }; state.accounts.push(acc); }
          if (type === 'bank') {
            const seen = new Set(state.tx.map(txKey));
            rows.forEach((r, i) => {
              const t = { id: 't_' + uid() + i, acc: acc.id, date: toDate(r.date).slice(0, 10) || today(), desc: String(r.desc || 'Movimiento IA'), amount: round(+r.amount || 0), bal: r.bal != null && isFinite(+r.bal) ? +r.bal : null, ord: i, src: 'gemini-ia' };
              t.cat = categorize(t); const k = txKey(t); if (!seen.has(k) && t.amount) { seen.add(k); state.tx.push(t); added++; }
            });
          } else if (type === 'positions') {
            for (const r of rows) {
              const asset = normAsset(r.asset), qty = +r.qty; if (!asset || !isFinite(qty) || !qty) continue;
              ensureAsset(asset); state.ledger.push({ id: 'l_' + uid(), acc: acc.id, t: (r.date || today()) + ' 12:00:00', asset, change: qty, kind: 'deposit', ref: 'ia|' + today(), src: 'gemini-ia', note: 'Importado IA' }); added++;
            }
          } else {
            const seen = new Set(state.ledger.map(lgKey));
            rows.forEach((r, i) => {
              const asset = normAsset(r.asset), ch = +r.change; if (!asset || !isFinite(ch) || !ch) return;
              ensureAsset(asset);
              const l = { id: 'l_' + uid() + i, acc: acc.id, t: toDate(r.t) || today() + ' 12:00:00', asset, change: ch, kind: r.kind || 'trade', ref: 'ia|' + i, src: 'gemini-ia', note: r.note || 'Importado IA' };
              const k = lgKey(l); if (!seen.has(k)) { seen.add(k); state.ledger.push(l); added++; }
            });
          }
        }, added + ' registros importados con Gemini IA');
        $('modal').close(); refreshPrices();
      };
    } catch (e) {
      $('ai-imp-res').innerHTML = '<div class="callout err">' + esc(e.message) + '</div>';
    } finally { btnEl.disabled = false; btnEl.innerHTML = ico('brain') + 'Analizar con Gemini IA'; }
  };
}
