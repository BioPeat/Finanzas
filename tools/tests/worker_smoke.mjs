import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const worker=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).default;

class KV {
  constructor(){ this.m=new Map(); }
  async get(k,type){ const v=this.m.get(k); return type==='json'&&v?JSON.parse(v):v??null; }
  async put(k,v){ this.m.set(k,String(v)); }
}
const kv=new KV();
const env={TOKEN:'TOKEN-DE-PRUEBA-MUY-LARGO',CAUDAL:kv,ALLOWED_ORIGIN:'https://example.test'};
const req=(path,init={})=>new Request('https://worker.test'+path,{...init,headers:{Origin:'https://example.test','X-Caudal-Token':env.TOKEN,'Content-Type':'application/json',...(init.headers||{})}});

let r=await worker.fetch(req('/ping'),env); assert.equal(r.status,200); let j=await r.json();
assert.equal(j.version,'w4'); assert.equal(j.kv,true); assert.equal(j.rollingBackups,true);

r=await worker.fetch(req('/sync/aaaaaaaaaaaaaaaaaaaa'),env); assert.equal(r.status,404);
const one={updated:100,baseUpdated:0,device:'a',data:'iv.cipher.r'};
r=await worker.fetch(req('/sync/aaaaaaaaaaaaaaaaaaaa',{method:'PUT',body:JSON.stringify(one)}),env); assert.equal(r.status,200);
let got=await (await worker.fetch(req('/sync/aaaaaaaaaaaaaaaaaaaa'),env)).json(); assert.equal(got.updated,100);

const stale={updated:101,baseUpdated:0,device:'b',data:'iv.other.r'};
r=await worker.fetch(req('/sync/aaaaaaaaaaaaaaaaaaaa',{method:'PUT',body:JSON.stringify(stale)}),env); assert.equal(r.status,409);
const two={updated:102,baseUpdated:100,device:'b',data:'iv.second.r'};
r=await worker.fetch(req('/sync/aaaaaaaaaaaaaaaaaaaa',{method:'PUT',body:JSON.stringify(two)}),env); assert.equal(r.status,200);
const backups=await (await worker.fetch(req('/backups/aaaaaaaaaaaaaaaaaaaa'),env)).json(); assert.equal(backups.items.length,1); assert.equal(backups.items[0].updated,100);

r=await worker.fetch(new Request('https://worker.test/ping',{headers:{Origin:'https://evil.test','X-Caudal-Token':env.TOKEN}}),env); assert.equal(r.status,403);
r=await worker.fetch(new Request('https://worker.test/ping',{headers:{Origin:'https://example.test','X-Caudal-Token':'bad'}}),env); assert.equal(r.status,401);

console.log('worker_smoke: TODO OK · auth, origen, w4, conflicto, verificación y copia rolling');
