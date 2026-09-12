const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({document:{addEventListener(){}},erAssetBase:'https://example.test/'});
for(const file of ['siteData.js','itemSlots.js','catalogPages.js'])vm.runInContext(fs.readFileSync('src/main/resources/static/js/'+file,'utf8'),ctx);
const catalog=new Map([['1',{code:1,makeMaterial1:2,makeMaterial2:3}],['2',{code:2,makeMaterial1:1}],['3',{code:3}]]);
const html=ctx.erCraftTree(1,catalog,new Map([['Item/Name/1','<script>']]));
assert.equal((html.match(/<li>/g)||[]).length,3);
assert(!html.includes('<script>'));
assert.equal(ctx.erItemStats({attackPower:0,attackSpeedRatio:0.4}).length,1);
assert.equal(ctx.erItemStats({attackSpeedRatio:0.4})[0].value,'40%');
const analysis=ctx.erAnalysisMarkup({rows:[{character:1,mode:3,season:41,games:10,wins:2,top3:4,rank:3,kills:2,rp:null}],builds:[]},1,new Map());
assert.match(analysis,/20%/);assert.match(analysis,/전체 서버 통계가 아닙니다/);assert.match(analysis,/평균 RP<\/small><strong>—/);
console.log('PASS: recursive crafting cycle guard, escaped item names, percent stats, honest sample and missing RP');
assert.equal(ctx.erIsStandardTrait({active:true,traitGroup:'Cobalt',traitType:'Cobalt'}),false);
assert.equal(ctx.erIsStandardTrait({active:false,traitGroup:'Havoc',traitType:'Core'}),false);
assert.equal(ctx.erIsStandardTrait({active:true,traitGroup:'Havoc',traitType:'Core'}),true);
assert.equal(ctx.erIsStandardTrait({active:true,traitGroup:'Chaos',traitType:'Sub2'}),true);
assert.match(ctx.erSkillImage(7000200,'흡혈마'),/data-skill-code="7000200"/);
assert.equal(ctx.erSkillDescription(new Map([['Skill/Group/Desc/7000200','공식 설명']]),7000200),'공식 설명');
console.log('PASS: excludes cobalt and inactive traits, retains standard traits, shares skill tooltip identifiers');

assert.equal(ctx.erSkillDescription(new Map([['Trait/Tooltip/7000201','특성 효과']]),7000200),'특성 효과');
assert.equal(ctx.erSkillDescription(new Map([['Skill/LobbyDesc/1073100','로비 설명'],['Skill/Group/Desc/1073100','효과 {0}']]),1073100),'로비 설명');
assert.equal(ctx.erSkillDescription(new Map([['Skill/Group/Desc/1073100','효과 {0}']]),1073100),'');

const top=ctx.erRankingCharacters({totalGames:100,characterStats:[{characterCode:1,usages:20},{characterCode:2,usages:40},{characterCode:1,usages:10},{characterCode:3,usages:15},{characterCode:4,usages:5}]});
assert.equal(top.length,3);assert.equal(top[0].code,2);assert.equal(top[0].percent,40);assert.equal(top[1].uses,30);
assert.equal(ctx.erRankingCharacters({characterStats:[{characterCode:1,usages:5}]})[0].percent,null);
console.log('PASS: character usage ranking merges duplicate entries and uses total season games as denominator');
const filteredFixture={buckets:{rows:[
 {character:1,season:12,mode:3,tier:3,day:'2026-09-12',games:1,wins:1,rank:1,damage:100,rp:null},
 {character:1,season:12,mode:3,tier:3,day:'2026-09-11',games:9,wins:0,rank:5,damage:200,rp:10,rpCount:2},
 {character:1,season:12,mode:3,tier:1,day:'2026-09-12',games:20,wins:2},
 {character:1,season:11,mode:3,tier:3,day:'2026-09-12',games:30},
 {character:1,season:12,mode:2,tier:-1,day:'2026-09-12',games:40}
],builds:[],items:[]}};
const filters={season:'12',mode:'3',tier:'3',days:'7'},clock=Date.parse('2026-09-12T12:00:00Z');
let filtered=ctx.erFilterStatistics(filteredFixture,filters,clock);
assert.equal(filtered.rows.length,1);assert.equal(filtered.rows[0].games,10);assert.equal(filtered.rows[0].rank,4.6);assert.equal(filtered.rows[0].damage,190);assert.equal(filtered.rows[0].rp,10);
assert.equal(ctx.erFilterStatistics(filteredFixture,{...filters,days:'1'},clock).rows[0].games,1);
assert.equal(ctx.erFilterStatistics(filteredFixture,{...filters,mode:'2'},clock).rows[0].games,40);
assert.equal(ctx.erFilterStatistics(filteredFixture,{...filters,tier:'5'},clock).rows.length,0);
assert.equal(ctx.erFilterStatistics(filteredFixture,{...filters,season:'10'},clock).rows.length,0);
assert.equal(ctx.erFilterStatistics(filteredFixture,{...filters,days:'1'},Date.parse('2026-09-11T16:00:00Z')).rows[0].games,1);
console.log('PASS: intersecting season/mode/tier/date filters, weighted averages, null RP, KST boundary and empty samples');
