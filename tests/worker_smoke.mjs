// Prueba local del Worker sin internet ni claves reales.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const src=await readFile(new URL('../worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const seen=[];
globalThis.fetch=async(url,init={})=>{
  url=String(url);seen.push({url,headers:init.headers||{}});
  const j=o=>new Response(JSON.stringify(o),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('/api/v3/account'))return j({balances:[{asset:'BTC',free:'0.1',locked:'0'}]});
  if(url.includes('get-funding-asset'))return j([]);
  if(url.includes('simple-earn'))return j({rows:[]});
  if(url.includes('/fapi/v2/account'))return j({assets:[]});
  if(url.includes('/fapi/v2/positionRisk'))return j([]);
  if(url.includes('api.kraken.com/0/private/Balance'))return j({error:[],result:{XXBT:'0.2'}});
  if(url.includes('api.kucoin.com/api/v1/accounts'))return j({code:'200000',data:[{currency:'ETH',balance:'2'}]});
  if(url.includes('okx.com/api/v5/account/balance'))return j({code:'0',data:[{details:[{ccy:'SOL',eq:'3'}]}]});
  if(url.includes('/v5/account/wallet-balance'))return j({retCode:0,result:{list:[{coin:[{coin:'USDC',walletBalance:'25'}]}]}});
  return j({});
};
const kv=new Map(),CAUDAL={get:k=>kv.get(k)||null,put:(k,v)=>{kv.set(k,v)}};
const env={TOKEN:'TOKEN-DE-PRUEBA-MUY-LARGO',ALLOWED_ORIGIN:'https://usuario.github.io',CAUDAL,
 BINANCE_KEY:'k',BINANCE_SECRET:'s',KRAKEN_KEY:'k',KRAKEN_SECRET:btoa('secret'),KUCOIN_KEY:'k',KUCOIN_SECRET:'s',KUCOIN_PASSPHRASE:'p',OKX_KEY:'k',OKX_SECRET:'s',OKX_PASSPHRASE:'p',BYBIT_KEY:'k',BYBIT_SECRET:'s'};
const call=async(path,extra={})=>worker.fetch(new Request('https://worker.test'+path,{headers:{Origin:'https://usuario.github.io','X-Caudal-Token':env.TOKEN,...(extra.headers||{})},method:extra.method||'GET',body:extra.body}),env);
let r=await call('/ping');assert.equal(r.status,200);let x=await r.json();assert.equal(x.version,'w2');assert.equal(Object.keys(x.exchanges).length,5);
r=await call('/balances');assert.equal(r.status,200);x=await r.json();assert.equal(x.exchanges.binance.assets.BTC,.1);assert.equal(x.exchanges.kraken.assets.XXBT,.2);assert.equal(x.exchanges.kucoin.assets.ETH,2);assert.equal(x.exchanges.okx.assets.SOL,3);assert.equal(x.exchanges.bybit.assets.USDC,25);
assert.ok(seen.find(x=>x.url.includes('okx.com')).headers['OK-ACCESS-SIGN']);assert.ok(seen.find(x=>x.url.includes('wallet-balance')).headers['X-BAPI-SIGN']);
r=await worker.fetch(new Request('https://worker.test/ping',{headers:{Origin:'https://otro.example','X-Caudal-Token':env.TOKEN}}),env);assert.equal(r.status,403);
r=await worker.fetch(new Request('https://worker.test/ping',{headers:{Origin:'https://usuario.github.io','X-Caudal-Token':'mal'}}),env);assert.equal(r.status,401);
const id='a'.repeat(40),body=JSON.stringify({updated:1,data:'cifrado.opaco.z'});r=await call('/sync/'+id,{method:'PUT',body,headers:{'Content-Type':'application/json'}});assert.equal(r.status,200);r=await call('/sync/'+id);assert.equal(await r.text(),body);
console.log('WORKER OK · 5 exchanges, autenticación, origen y KV');
