const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const events=new Map(),nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',addEventListener:(event,fn)=>events.set(id+':'+event,fn)});return nodes.get(id);};
 const pending=new Promise(()=>{}),location={href:''};
 const ctx={document:{addEventListener:(event,fn)=>events.set(event,fn),querySelector:node},location,
  loadAssetConfig:()=>pending,erLoadEquipment:()=>pending,erAssetImage:file=>'/placeholder?'+file,
  erStatic:async url=>url==='/er/main'?{result:[{recommendWeaponRoute:{id:1,title:'추천 검',characterCode:1}}]}:{data:[{code:1,name:'Jackie'}]},
  erDictionary:async()=>new Map([['Character/Name/1','재키']]),erRequest:async()=>({user:{userId:42}})};
 vm.runInNewContext(fs.readFileSync('src/main/resources/static/js/home.js','utf8'),ctx);
 events.get('DOMContentLoaded')();
 assert.equal(typeof events.get('#searchForm:submit'),'function');
 await new Promise(r=>setImmediate(r));
 assert.match(node('#recommendRouteBox').innerHTML,/추천 검/);
 assert.match(node('#recommendRouteBox').innerHTML,/재키/);
 node('#searchInput').value='테스트';await events.get('#searchForm:submit')({preventDefault(){}});
 assert.equal(location.href,'/er/user/detail/view?userNum=42');assert.equal(node('#searchBtn').disabled,false);
 console.log('PASS: home routes and search usable with images/equipment pending, without jQuery');
})().catch(e=>{console.error(e);process.exitCode=1;});
