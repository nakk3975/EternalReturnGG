// Real executable WAR/JSPs, deterministic API fixtures and intentionally held image config.
// Run after starting the application: ER_SITE_URL=http://127.0.0.1:10000 node scripts/verify-site-pages.cjs
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const origin=process.env.ER_SITE_URL||'http://127.0.0.1:10000';
const fixture=name=>JSON.parse(fs.readFileSync('src/test/fixtures/api-2026/'+name+'.json','utf8'));
const characters=fixture('characters'),weapons=fixture('weapons'),armor=fixture('armor'),character=characters.data[0];
const route={id:42,title:'검증 루트',characterCode:character.code,userNickname:'테스트',weaponCodes:String(weapons.data[0].code)};
const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const stats={buckets:{rows:[{day,season:37,mode:3,tier:7,character:character.code,games:10,wins:2,top3:4,rank:4,damage:1000}],items:[],builds:[]}};
const payload={
 '/er/character':characters,'/er/weapon':weapons,'/er/armor':armor,'/er/main':{result:[{recommendWeaponRoute:route}]},
 '/er/statistics/data':stats,'/er/statistics/collection':{status:'waiting'},
 '/er/leaderboard/data':{topRanks:[{nickname:'검증',userId:42,rank:1,mmr:9000}]},
 '/er/userRank':{userStats:[{nickname:'검증',seasonId:37,totalGames:10,totalWins:2,mmr:9000,rank:1,characterStats:[{characterCode:character.code,usages:10,wins:2}]}]},
 '/er/user/detail':{userGames:[]},'/er/search/nickname':{user:{nickname:'검증',userId:42}},'/er/seasons':{data:[]},
 '/er/route-data/Area':{data:[{code:40,name:'Alley',areaType:'Lumia',startingArea:true,modeType:'3'}]}
};
(async()=>{
 const browser=await chromium.launch({headless:true});const report=[];
 try{
 for(const [path,selector] of [
  ['/er/search/view','.home-route'],['/er/characters','#character-picker .character-choice'],['/er/items','#item-list tbody tr'],
  ['/er/routes','.route-list-row'],['/er/leaderboard','[data-rank-id]'],['/er/statistics','#stats-table tbody tr'],
  ['/er/route-planner','#planner-equipment-open:not([disabled])'],['/er/animal-map','#animal-points [data-add-camp]'],
  ['/er/guide','.guide-card'],['/er/favorites','#find-players'],['/er/multi?names=검증','.multi-card'],
  ['/er/user/detail/view?userNum=42','#rank-panel .rank-score']]){
  const context=await browser.newContext(),page=await context.newPage(),errors=[],requests=[];let configRoute;
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.resourceType()==='script')requests.push(new URL(r.url()).pathname)});
  await page.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.origin!==origin)return r.abort();
   if(r.request().isNavigationRequest()||u.pathname.startsWith('/static/'))return r.continue();
   if(u.pathname==='/er/assets/config'){configRoute=r;return;}
   if(u.pathname==='/er/loadTextFile')return r.fulfill({contentType:'text/plain',body:'Character/Name/'+character.code+'┃검증 실험체\nItem/Name/'+weapons.data[0].code+'┃검증 무기'});
   return r.fulfill({json:payload[u.pathname]||{data:[]}});
  });
  const start=Date.now();await page.goto(origin+path,{waitUntil:'domcontentloaded'});
  await page.locator(selector).first().waitFor({timeout:5000});
  const readyMs=Date.now()-start;
  if(!path.includes('animal-map'))assert(!requests.some(p=>/animal(Screen|Map|Timer)\.js/.test(p)),path+' loaded wildlife code');
  assert(!requests.some(p=>/jquery|popper|bootstrap.*\.js/.test(p)),path+' loaded unused library');
  if(configRoute){await configRoute.fulfill({json:{baseUrl:'https://cdn.dak.gg/assets/er/game-assets/12.3.0/'}});await page.waitForFunction(()=>!document.querySelector('img[src*="asset-placeholder.svg?erAsset="]'));}
  if(path==='/er/items'){await page.locator('#item-query').fill('no-such-item');await page.getByText('일치하는 아이템이 없습니다.',{exact:false}).waitFor();}
  if(path==='/er/statistics')await page.locator('#stats-sort').selectOption('winrate');
  if(path==='/er/route-planner'){await page.locator('#planner-equipment-open').click();assert(await page.locator('#planner-picker').isVisible());}
  assert.deepEqual(errors,[],path);report.push({path,readyMs,scripts:requests.length});await context.close();
 }
 console.log(JSON.stringify({kind:'local WAR with fixture API; not live latency',pages:report},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
