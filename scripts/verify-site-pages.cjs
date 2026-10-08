// Real executable WAR/JSPs, deterministic API fixtures and intentionally held image config.
// Run after starting the application: ER_SITE_URL=http://127.0.0.1:10000 node scripts/verify-site-pages.cjs
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const origin=process.env.ER_SITE_URL||'http://127.0.0.1:10000';
const {payload,character,weapons}=require('./site-page-fixtures.cjs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ER_CHROMIUM_PATH?{executablePath:process.env.ER_CHROMIUM_PATH,args:['--no-sandbox']}: {})});const report=[];
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
  if(path.startsWith('/er/multi'))await page.locator('#multi-form button[type=submit]').click();
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
