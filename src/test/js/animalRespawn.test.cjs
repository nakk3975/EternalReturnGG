const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({});vm.runInContext(fs.readFileSync('src/main/resources/static/js/animalMap.js','utf8'),c);
const t=(day,phase,remaining,extra={})=>({day,phase,remaining,...extra});
const camp=type=>({id:type+':0',type,region:'a',count:1,x:1,y:1,variant:0,cleared:false,events:[]});
const at=seconds=>c.erHuntAt(seconds);
// Every seconds-based camp: after a recorded kill, never first-spawn + interval.
for(const [type,delay,time] of [['Chicken',120,t(1,'day',90)],['Bat',150,t(1,'day',90)],['Boar',130,t(1,'day',80)],['Dog',140,t(1,'day',90)],['AttackDrone',210,t(1,'night',100)]]){
 const a=camp(type),k=c.erHuntSeconds(time);
 assert(c.erHuntRecord(a,time,'kill'));assert(!c.erHuntRecord(a,time,'kill'),'duplicate kill rejected');
 assert(c.erHuntAvailable(a,at(k-1)),'rewind before kill restores availability');
 assert(!c.erHuntAvailable(a,at(k+delay-1)),type+' not ready one second early');
 assert(c.erHuntAvailable(a,at(k+delay)),type+' ready at exact respawn');
 assert(c.erHuntRecord(a,at(k+delay),'kill'),'can kill the next generation');
 assert(!c.erHuntAvailable(a,at(k+delay+1)));
 assert(c.erHuntAvailable(a,at(k+2*delay)));
 const restored=camp(type);c.erHuntRestoreCamp(restored,JSON.parse(JSON.stringify(a)),at(k+delay+1),3);
 assert.equal(JSON.stringify(restored.events),JSON.stringify(a.events));
 assert(!c.erHuntAvailable(restored,at(k+delay+1)));
 a.cleared=true;assert(!c.erHuntAvailable(a,at(k+2*delay)),'persistent exclusion survives respawn');
}
for(const [type,kill,next] of [['Wolf',t(1,'day',50),t(2,'day',140)],['Bear',t(1,'night',100),t(2,'night',130)]]){
 const a=camp(type),boundary=c.erHuntSeconds(next);assert(c.erHuntRecord(a,kill,'kill'));
 assert(!c.erHuntAvailable(a,{...at(boundary-1),survivors:true}),'survivor option cannot undo a recorded kill');
 assert(c.erHuntAvailable(a,next));assert(c.erHuntRecord(a,next,'kill'));
 assert(!c.erHuntAvailable(a,{...next,remaining:129}),'kill at wave boundary waits for a later wave');
}
// Guaranteed groups: first-spawn and kill-relative respawn boundaries for every species.
for(const [type,first,delay] of [['Chicken',140,180],['Boar',140,180],['Dog',140,180],['Wolf',250,210],['Bear',390,240]]){
 const a={...camp(type),id:'Mutant:'+type+':0',fixedVariant:1};
 assert(!c.erHuntAvailable(a,at(first-1)));assert(c.erHuntAvailable(a,at(first)));
 assert(c.erHuntRecord(a,at(first+5),'kill'));assert(!c.erHuntAvailable(a,at(first+delay+4)));
 assert(c.erHuntAvailable(a,at(first+delay+5)));assert.equal(c.erHuntState(a,at(first+delay+5)).variant,1);
 const restored={...camp(type),fixedVariant:1};c.erHuntRestoreCamp(restored,JSON.parse(JSON.stringify(a)),at(first+6),3);
 assert(!c.erHuntAvailable(restored,at(first+6)));assert(c.erHuntAvailable(restored,at(first+delay+5)));
 assert.equal(c.erRecommendHunt({x:0,y:0},[a],{time:at(first),steps:8}).credits,c.erHuntValue({...a,variant:1}));
 assert(!c.erHuntRecord(a,at(first),'variant',2));
}
assert.equal(c.erHuntSeconds(t(2,'night',130)),390);
const fixedWolf={...camp('Wolf'),fixedVariant:1};
assert(c.erHuntAvailable(fixedWolf,t(2,'night',130)),'un-killed mutant wolf survives into night without survivor option');
assert(!c.erHuntRecord(camp('Chicken'),t(1,'day',90),'variant',1));
const a=camp('Chicken');c.erHuntRecord(a,t(1,'day',90),'kill');c.erHuntRecord(a,t(2,'day',80),'kill');
assert(c.erHuntRecord(a,t(1,'day',100),'kill'));assert.equal(a.events.length,1,'historical edits remove conflicting later history');
const legacy=camp('Wolf');c.erHuntRestoreCamp(legacy,{count:2,variant:1,cleared:true},t(2,'day',90),2);
assert(legacy.cleared,'legacy combined kill/exclude remains a persistent exclusion');
const invalid=camp('Bat');c.erHuntRestoreCamp(invalid,{events:[null,{at:-1,kind:'kill',variant:0},{at:1,kind:'kill',variant:0},{at:999999,kind:'kill',variant:0},{at:50,kind:'variant',variant:99}]},t(1,'day',90),3);
assert.equal(invalid.events.length,0,'malformed events and pre-spawn kills rejected');
assert.equal(c.erHuntTime({day:8,phase:'night',remaining:999}).phase,'day');
assert.equal(c.erHuntTime(t(7,'day',999)).remaining,200);
console.log('PASS: recorded kills, all interval respawns, phase boundaries, rewind, fixed mutants, migration, invalid imports and recommendation consistency');

vm.runInContext(fs.readFileSync('src/main/resources/static/js/routePlanner.js','utf8'),c);
const all=c.erWildlifeCamps(),fixed=all.filter(a=>a.fixedVariant===1);
assert.equal(all.length,179);assert.equal(fixed.length,16);assert.equal(new Set(all.map(a=>a.id)).size,179);
for(const [time,count] of [[t(1,'day',1),0],[t(1,'night',110),11],[t(2,'day',140),13],[t(2,'night',130),16]])assert.equal(fixed.filter(a=>c.erHuntAvailable(a,time)).length,count);
assert.equal(fixed.reduce((sum,a)=>sum+a.count,0),58);
const forged=all.find(a=>a.id==='Chicken:0');c.erHuntRestoreCamp(forged,{variant:1,events:[{at:50,kind:'variant',variant:1}]},t(2,'day',140),3);assert.equal(c.erHuntState(forged,t(2,'day',140)).variant,0);
