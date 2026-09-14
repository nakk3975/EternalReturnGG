const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const saved=new Map();let calls=0,now=1000;
 const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
 const create=()=>{const c=vm.createContext({sessionStorage:storage,Date:{now:()=>now},AbortSignal,fetch:async url=>{calls++;return {ok:true,json:async()=>({code:200,data:[{code:1}]}),text:async()=>'Item/Name/1┃검'};},document:{addEventListener(){}}});vm.runInContext(fs.readFileSync('src/main/resources/static/js/siteData.js','utf8'),c);return c;};
 let a=create();await Promise.all([a.erStatic('/er/weapon'),a.erStatic('/er/weapon')]);await a.erDictionary();assert.equal(calls,2);
 let b=create();await b.erStatic('/er/weapon');assert.equal((await b.erDictionary()).get('Item/Name/1'),'검');assert.equal(calls,2,'menu navigation reuses metadata');
 await b.erStatic('/er/statistics/data');await create().erStatic('/er/statistics/data');assert.equal(calls,4,'statistics are not persisted as static metadata');
 now+=900001;await create().erStatic('/er/weapon');assert.equal(calls,5,'expired metadata refetched');
 storage.getItem=()=>{throw Error('disabled')};storage.setItem=()=>{throw Error('quota')};await create().erStatic('/er/weapon');assert.equal(calls,6);
 console.log('PASS: cross-page cache, request deduplication, TTL, dynamic data exclusion and disabled storage');
})().catch(e=>{console.error(e);process.exitCode=1;});
