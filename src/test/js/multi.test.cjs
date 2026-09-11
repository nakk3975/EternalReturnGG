const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={document:{}};vm.createContext(context);
for(const name of ['siteData.js','multi.js'])vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+name,'utf8'),context);
const rows=[{matchingMode:2,gameRank:1,damageToPlayer:99999},...Array.from({length:12},(_,i)=>({matchingMode:3,gameRank:i+1,teamKill:10,damageToPlayer:i===0?null:1000}))];
const result=context.erMultiSummary(rows,3);
assert.equal(result.games.length,10);assert.equal(result.rank,5.5);assert.equal(result.tk,10);assert.equal(result.damage,1000);
assert.equal(context.erMultiSummary(rows,6).rank,null);
assert.equal(context.erMultiSummary([{matchingMode:6,totalFieldKill:4}],6).tk,4);
console.log('PASS: mode filtering, latest ten limit, missing statistics and TK fallback');
