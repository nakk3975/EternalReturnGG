const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {validate}=require('../../../scripts/api-contract.cjs');
const game=require('../fixtures/api-2026/game.json');
const schema=require('../../../contracts/game.json');
assert.deepEqual(validate(game,schema).errors,[]);
assert.equal(Object.keys(schema.fields).length,200);
for(const [key,rule] of Object.entries(schema.fields)){
 const missing={...game};delete missing[key];
 assert.equal(validate(missing,schema).errors.length,rule.required?1:0,key);
 const malformed={...game,[key]:rule.types.includes('string')?{}:'wrong-type'};
 assert(validate(malformed,schema).errors.some(e=>e.startsWith('$.'+key+':')),key);
}
const context={document:{addEventListener(){}},erAssetBase:'https://example.test/'};vm.createContext(context);
for(const file of ['siteData','weaponMetadata','player','matchTabs'])vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+file+'.js','utf8'),context);
for(const row of [game,Object.fromEntries(Object.entries(game).filter(([k])=>schema.fields[k].required))]){
 assert(!context.erPlayerCard(row).includes('NaN'));
 const state={teams:[[row]],own:row,graphMode:'earned',hiddenTeams:new Set()};
 for(const tab of ['rank','build','kills','graph','traits','credit','cube']){
  const html=context.erRenderDetailTab(state,tab);
  assert(!/NaN|undefined/.test(html),tab);
 }
}
const stats=context.erDetailBuild({...game,coolDownReduction:0.27});
assert(stats.includes('0.27'));
assert(!fs.readFileSync('src/main/resources/static/js/matchTabs.js','utf8').includes("['cooldownReduction'"));
const chars=require('../fixtures/api-2026/characters.json');
assert.equal(chars.code,200);assert.equal(chars.data.length,3);
for(const c of chars.data)assert(Number.isInteger(c.code)&&typeof c.name==='string');
console.log('PASS: live 2026 fixture, 200 field deletion/type mutations, seven tabs with sparse data, cooldown casing');
for(const name of ['characters','skins','weapons','armor','traits']){
 const data=require('../fixtures/api-2026/'+name+'.json').data;
 const schema=require('../../../contracts/'+name+'.json');
 for(const row of data)assert.deepEqual(validate(row,schema).errors,[],name);
}
console.log('PASS: five live catalog fixtures and observed field types');
