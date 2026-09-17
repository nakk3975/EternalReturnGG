// Compare a supplied previous animalMap.js against the working implementation.
// node scripts/benchmark-hunt.cjs /tmp/animalMap-before.js
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
function load(file){const c=vm.createContext({});for(const p of ['src/main/resources/static/js/routePlanner.js',file])vm.runInContext(fs.readFileSync(p,'utf8'),c);return c;}
const before=load(process.argv[2]),after=load('src/main/resources/static/js/animalMap.js');
const scenarios=[{day:1,remaining:90},{day:1,phase:'night',remaining:110},{day:2,remaining:130},{day:5,phase:'night',remaining:60,survivors:true}];
for(const time of scenarios){
 const source=`(()=>{const camps=erWildlifeCamps();camps[3].cleared=true;camps[30].events=[{at:70,kind:'kill'}];return erRecommendHunt({x:50,y:50},camps,{time:${JSON.stringify(time)},steps:5,blocked:['항구']});})()`;
 assert.equal(JSON.stringify(vm.runInContext(source,before)),JSON.stringify(vm.runInContext(source,after)));
 const measure=c=>{vm.runInContext(source,c);const samples=[];for(let i=0;i<7;i++){const at=performance.now();vm.runInContext(source,c);samples.push(performance.now()-at);}return samples.sort((a,b)=>a-b)[3];};
 const a=measure(before),b=measure(after);console.log(JSON.stringify({time,beforeMedianMs:+a.toFixed(2),afterMedianMs:+b.toFixed(2),speedup:+(a/b).toFixed(2),identical:true}));
}
