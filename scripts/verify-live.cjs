'use strict';
// Read-only. No response bodies, nicknames, user identifiers or API keys are written to the report.
const fs=require('node:fs');
const {validate}=require('./api-contract.cjs');
const gameSchema=require('../contracts/game.json');
const nickname=process.env.ER_VERIFY_NICKNAME;
const direct=!process.env.ER_VERIFY_BASE_URL;
const key=process.env.ETERNAL_RETURN_API_KEY;
const base=direct?'https://open-api.bser.io':process.env.ER_VERIFY_BASE_URL.replace(/\/$/,'');
const report={checkedAt:new Date().toISOString(),mode:direct?'official-key':'deployed-proxy-may-use-cache',checks:[],limitations:['A single player and recent games are not all modes/seasons.','Catalog presence does not prove release status or successful image rendering.','Nested log semantics require separate fixtures.']};
async function request(label,path){
 await new Promise(r=>setTimeout(r,1100));
 const started=Date.now();
 const r=await fetch(base+path,{headers:direct?{'x-api-key':key}:{},signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw new Error(label+': HTTP '+r.status);
 const b=await r.json();
 if(![0,200].includes(Number(b.code)))throw new Error(label+': API code '+b.code);
 report.checks.push({label,milliseconds:Date.now()-started,status:'ok'});return b;
}
function checkRows(label,rows){
 if(!Array.isArray(rows)||!rows.length)throw new Error(label+': empty rows');
 const checks=rows.map(r=>validate(r,gameSchema));
 const errors=checks.flatMap(x=>x.errors);
 report.checks.push({label,rows:rows.length,errors:[...new Set(errors)],missingOptional:[...new Set(checks.flatMap(x=>x.missingOptional))]});
 if(errors.length)throw new Error(label+': contract mismatch');
}
(async()=>{
 if(!nickname)throw new Error('Set ER_VERIFY_NICKNAME');
 if(direct&&!key)throw new Error('Set ETERNAL_RETURN_API_KEY or ER_VERIFY_BASE_URL');
 const n=await request('nickname',direct?'/v1/user/nickname?query='+encodeURIComponent(nickname):'/er/search/nickname?nickname='+encodeURIComponent(nickname));
 const user=n.user||n.data;const uid=user?.userId||user?.uid||user?.userNum;
 if(!uid)throw new Error('nickname: missing user identifier');
 const games=await request('recent-games',direct?'/v1/user/games/uid/'+encodeURIComponent(uid):'/er/user/detail?userNum='+encodeURIComponent(uid));
 checkRows('recent-contract',games.userGames);
 const ids=[...new Set(games.userGames.slice(0,10).map(g=>g.gameId))];
 if(ids.length!==10)throw new Error('Need a player with at least ten recent games');
 for(let i=0;i<ids.length;i++){
  const b=await request('detail-'+(i+1),direct?'/v1/games/'+ids[i]:'/er/game?gameId='+ids[i]);
  checkRows('detail-contract-'+(i+1),b.userGames);
 }
 for(const [name,route] of [['Character','character'],['CharacterSkin','skin/info'],['ItemWeapon','weapon'],['ItemArmor','armor'],['Trait','trait'],['WeaponTypeInfo','weapon-types']]){
  const b=await request(name,direct?'/v2/data/'+name:'/er/'+route);
  if(!Array.isArray(b.data)||!b.data.length)throw new Error(name+': missing catalog');
  const contractFile={Character:'characters',CharacterSkin:'skins',ItemWeapon:'weapons',ItemArmor:'armor',Trait:'traits'}[name];
  if(contractFile){const schema=require('../contracts/'+contractFile+'.json');const errors=[...new Set(b.data.flatMap(row=>validate(row,schema).errors))];if(errors.length)throw new Error(name+': catalog contract mismatch '+errors.join(';'));}
  report.checks.push({label:name+'-catalog',rows:b.data.length,lastCodes:b.data.slice(-5).map(x=>x.code)});
 }
 report.status='passed';
})().catch(e=>{report.status='failed';report.error=e.message;process.exitCode=1;}).finally(()=>{
 const path=process.env.ER_VERIFY_REPORT||'live-verification.json';fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,checks:report.checks.length,report:path,error:report.error}));
});
