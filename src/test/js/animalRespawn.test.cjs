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
for(const [type,kill,next] of [['Wolf',t(1,'day',50),t(2,'day',130)],['Bear',t(1,'night',100),t(2,'night',130)]]){
 const a=camp(type),boundary=c.erHuntSeconds(next);assert(c.erHuntRecord(a,kill,'kill'));
 assert(!c.erHuntAvailable(a,{...at(boundary-1),survivors:true}),'survivor option cannot undo a recorded kill');
 assert(c.erHuntAvailable(a,next));assert(c.erHuntRecord(a,next,'kill'));
 assert(!c.erHuntAvailable(a,{...next,remaining:129}),'kill at wave boundary waits for a later wave');
}
const purple=t(1,'day',90,{weather:'purple'}),mutant=camp('Chicken');
assert(!c.erHuntRecord(mutant,t(1,'day',90),'variant',1));
assert(c.erHuntRecord(mutant,purple,'variant',1));assert.equal(c.erHuntState(mutant,purple).variant,1);
assert(c.erHuntRecord(mutant,purple,'kill'));assert.equal(mutant.events.length,2,'same-time observation is retained before kill');
assert.equal(c.erHuntState(mutant,{...at(c.erHuntSeconds(purple)+120),weather:'purple'}).variant,0,'next spawn is not automatically a mutant');
const nest=camp('Bear'),nestTime=t(2,'day',100);
assert(c.erHuntRecord(nest,nestTime,'variant',2));assert(c.erHuntAvailable(nest,nestTime),'confirmed nest overrides ordinary bear phase visibility');
assert(c.erHuntRecord(nest,nestTime,'kill'));assert(!c.erHuntAvailable(nest,t(4,'night',0)),'fog nest does not use normal bear respawn');
const restoredNest=camp('Bear');c.erHuntRestoreCamp(restoredNest,JSON.parse(JSON.stringify(nest)),nestTime,3);
assert(!c.erHuntAvailable(restoredNest,t(4,'night',0)),'nest kill survives sharing');
assert(c.erHuntRecord(nest,t(3,'night',80),'variant',2),'a later manually confirmed activated nest can appear');
assert(c.erHuntAvailable(nest,t(3,'night',80)));
assert(!c.erHuntRecord(camp('Boar'),nestTime,'variant',2),'unsupported variant rejected');
const a=camp('Chicken');c.erHuntRecord(a,t(1,'day',90),'kill');c.erHuntRecord(a,t(2,'day',80),'kill');
assert(c.erHuntRecord(a,t(1,'day',100),'kill'));assert.equal(a.events.length,1,'historical edits remove conflicting later history');
const legacy=camp('Wolf');c.erHuntRestoreCamp(legacy,{count:2,variant:1,cleared:true},t(2,'day',90),2);
assert(legacy.cleared,'legacy combined kill/exclude remains a persistent exclusion');
const invalid=camp('Bat');c.erHuntRestoreCamp(invalid,{events:[null,{at:-1,kind:'kill',variant:0},{at:1,kind:'kill',variant:0},{at:999999,kind:'kill',variant:0},{at:50,kind:'variant',variant:99}]},t(1,'day',90),3);
assert.equal(invalid.events.length,0,'malformed events and pre-spawn kills rejected');
const eligible=camp('Chicken');c.erHuntRecord(eligible,purple,'variant',1);
const recommendation=c.erRecommendHunt({x:0,y:0},[eligible],{time:purple,steps:8});
assert.equal(recommendation.credits,2,'recommendation values resolved variant, not stale camp.variant');assert.equal(recommendation.route.length,1);
c.erHuntRecord(eligible,purple,'kill');assert.equal(c.erRecommendHunt({x:0,y:0},[eligible],{time:purple}).route.length,0);
assert.equal(c.erHuntTime({day:8,phase:'night',remaining:999}).phase,'day');
assert.equal(c.erHuntTime(t(7,'day',999)).remaining,200);
console.log('PASS: recorded kills, all interval respawns, phase boundaries, rewind, variants/nests, migration, invalid imports and recommendation consistency');
