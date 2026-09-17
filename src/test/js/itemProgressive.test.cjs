const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',value:'',setAttribute(){},addEventListener(){},insertAdjacentHTML(){},querySelectorAll:()=>[],querySelector:node});return nodes.get(key);};
 const root=node('root');let finishStats;
 const ctx=vm.createContext({document:{addEventListener(){},querySelector:node},window:{addEventListener(){}},location:{pathname:'/er/items'},loadAssetConfig:()=>new Promise(()=>{}),erDictionary:async()=>new Map(),erStatic:url=>url.endsWith('/materials')?new Promise(()=>{}):url.includes('statistics')?new Promise(r=>finishStats=r):Promise.resolve({data:url.endsWith('weapon')?[{code:1,name:'검',weaponType:'Glove'}]:[]}),erText:String,erNumber:v=>v??'—',erGradeNames:{},erItemHtml:()=>'',erApplyItemGrades(){}});
 vm.runInContext(fs.readFileSync('src/main/resources/static/js/catalogPages.js','utf8'),ctx);
 ctx.erPageShell=()=>root;ctx.erFitCraftTree=()=>{};ctx.erItemStats=()=>[];ctx.erCraftTree=()=>'';
 await Promise.race([ctx.erItemsPage(),new Promise((_,reject)=>setTimeout(()=>reject(Error('optional assets/materials/statistics blocked items')),500))]);
 assert(node('#item-list').innerHTML.includes('검'));
 assert(node('#item-sample-stats').innerHTML.includes('불러오는 중'));
 finishStats({items:[]});await new Promise(r=>setImmediate(r));
 console.log('PASS: item list usable with indefinitely pending images, materials and statistics');
})().catch(e=>{console.error(e);process.exitCode=1;});
