const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('hunt evaluates each camp once per recommendation and observes subsequent edits',()=>{
 const c=vm.createContext({});for(const name of ['routePlanner','animalMap'])vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+name+'.js','utf8'),c);
 const result=vm.runInContext(`(()=>{const original=erHuntState;let calls=0;erHuntState=(...args)=>{calls++;return original(...args);};const camps=erWildlifeCamps(),time={day:3,phase:'night',remaining:60,survivors:true};const first=erRecommendHunt({x:50,y:50},camps,{time});const count=calls;const removed=first.route[0];removed.cleared=true;const second=erRecommendHunt({x:50,y:50},camps,{time});return {count,total:camps.length,removed:removed.id,ids:second.route.map(c=>c.id)};})()`,c);
 assert.equal(result.count,result.total);assert(!result.ids.includes(result.removed));
});
