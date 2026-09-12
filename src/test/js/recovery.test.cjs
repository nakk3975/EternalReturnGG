const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 let namesCalls=0,gearCalls=0;
 const ctx=vm.createContext({AbortSignal,AbortController,setTimeout,clearTimeout,document:{addEventListener(){}},fetch:async url=>{
  if(url.includes('loadTextFile')){if(++namesCalls===1)throw Error('offline');return {ok:true,text:async()=>'Item/Name/1┃검'};}
  gearCalls++;
  if(gearCalls===1)throw Error('offline');
  return {ok:true,json:async()=>({code:200,data:[{code:url.endsWith('weapon')?1:2}]})};
 }});
 for(const file of ['siteData','itemSlots'])vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+file+'.js','utf8'),ctx);
 assert.equal((await ctx.erDictionary()).size,0);
 assert.equal((await ctx.erDictionary()).get('Item/Name/1'),'검');
 await ctx.erDictionary();assert.equal(namesCalls,2);
 assert.equal((await ctx.erLoadEquipment()).size,1);
 const recovered=await Promise.all([ctx.erLoadEquipment(),ctx.erLoadEquipment()]);
 assert.equal(recovered[0].size,2);assert.equal(gearCalls,4);
 await ctx.erLoadEquipment();assert.equal(gearCalls,4);
 assert.equal(ctx.erIsPlainClick({button:0}),true);
 for(const key of ['ctrlKey','metaKey','shiftKey','altKey'])assert.equal(ctx.erIsPlainClick({button:0,[key]:true}),false);
 assert.equal(ctx.erIsPlainClick({button:1}),false);
 ctx.fetch=async()=>({ok:false,json:async()=>{throw Error('Unexpected token <');}});
 await assert.rejects(ctx.erRequest('/test'),/잠시 후 다시 시도/);
 let ready;const controls={hidden:true,append(button){this.button=button;}},status={};
 const page=vm.createContext({document:{addEventListener:(event,fn)=>ready=fn,querySelector:id=>id==='#explorer-controls'?controls:status,createElement:()=>({})}});
 vm.runInContext(fs.readFileSync('src/main/resources/static/js/explorer.js','utf8'),page);
 vm.runInContext('startExplorer=async()=>{throw new Error("일시적인 조회 실패")}',page);
 ready();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(controls.hidden,false);assert.equal(controls.button.textContent,'다시 시도');assert.equal(status.textContent,'일시적인 조회 실패');
 console.log('PASS: transient dictionary/equipment failures recover, successful loads stay cached, modified clicks preserved, invalid JSON has readable error');
})().catch(e=>{console.error(e);process.exitCode=1;});
