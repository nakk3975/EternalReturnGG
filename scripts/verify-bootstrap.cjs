// Real WAR/JSP rendering, deterministic APIs. No live latency claims.
// ER_SITE_URL=http://127.0.0.1:10000 npm run verify:bootstrap
'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {PNG}=require('pngjs');
const {createHash}=require('node:crypto');
const digest=b=>createHash('sha256').update(b).digest('hex');
const {payload,character}=require('./site-page-fixtures.cjs');
const origin=(process.env.ER_SITE_URL||'http://127.0.0.1:10000').replace(/\/$/,'');
const local='/static/vendor/bootstrap-4.0.0/bootstrap.min.css';
const cdn='https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css';
const css=fs.readFileSync('src/main/resources/static/vendor/bootstrap-4.0.0/bootstrap.min.css','utf8');
const pages=[['/er/search/view','.home-route'],['/er/leaderboard','[data-rank-id]'],
 ['/er/characters','#character-picker .character-choice'],['/er/statistics','#stats-table tbody tr'],
 ['/er/items','#item-list tbody tr'],['/er/routes','.route-list-row'],
 ['/er/route-planner','#planner-equipment-open:not([disabled])'],['/er/animal-map','#animal-points [data-add-camp]'],
 ['/er/guide','.guide-card'],['/er/multi','#multi-form'],['/er/favorites','#find-players'],
 ['/er/user/detail/view?userNum=42','#rank-panel .rank-score']];
(async()=>{
 const {default:pixelmatch}=await import('pixelmatch');
 const browser=await chromium.launch({headless:true,
  ...(process.env.ER_CHROMIUM_PATH?{executablePath:process.env.ER_CHROMIUM_PATH,args:['--no-sandbox']}: {})});
 const report=[];
 try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}])
  for(const theme of ['light','dark']) for(const [path,ready] of pages){
   const shots=[],layouts=[];
   for(const baseline of [true,false]){
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    await context.addInitScript(t=>localStorage.setItem('ergg.theme',t),theme);
    const page=await context.newPage(),failed=[],external=[],cssResponses=[],errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(r.resourceType()==='stylesheet'&&new URL(r.url()).origin!==origin)external.push(r.url());});
    page.on('requestfailed',r=>{if(r.resourceType()==='stylesheet')failed.push(r.url());});
    page.on('response',r=>{if(new URL(r.url()).pathname===local)cssResponses.push(r.body().then(body=>({status:r.status(),sha256:digest(body)})));});
    await page.route('**/*',async route=>{
     const req=route.request(),u=new URL(req.url());
     // The baseline recreates the old CDN link with exactly the pinned CSS.
     // This tests cascade/layout equivalence, not CDN reliability or latency.
     if(req.url()===cdn&&baseline)return route.fulfill({contentType:'text/css',body:css});
     if(u.origin!==origin&&req.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="94" height="30"><rect width="94" height="30" fill="gray"/></svg>'});
     if(u.origin!==origin)return route.abort();
     if(req.isNavigationRequest()&&baseline){
      const response=await route.fetch();
      const html=(await response.text()).replace(local,cdn);
      assert(html.includes(cdn),'JSP must contain the local Bootstrap link');
      return route.fulfill({response,body:html});
     }
     if(req.isNavigationRequest()||u.pathname.startsWith('/static/'))return route.continue();
     if(u.pathname==='/er/assets/config')return route.fulfill({json:{baseUrl:origin+'/static/images/'}});
     if(u.pathname==='/er/loadTextFile')return route.fulfill({contentType:'text/plain',body:'Character/Name/'+character.code+'┃검증 실험체'});
     return route.fulfill({json:payload[u.pathname]||{data:[]}});
    });
    await page.goto(origin+path,{waitUntil:'networkidle'});
    await page.locator(ready).first().waitFor({timeout:10000});
    await page.evaluate(()=>document.fonts.ready);
    assert.deepEqual(errors,[],path);
    assert.deepEqual(failed,[],path+' stylesheet failures');
    if(!baseline){
     assert.deepEqual(external,[],path+' external CSS requests');
     assert.deepEqual(await Promise.all(cssResponses),[{status:200,sha256:digest(css)}],path+' packaged CSS status/bytes');
     assert(await page.evaluate(p=>[...document.styleSheets].some(s=>s.href?.endsWith(p)&&s.cssRules.length>0),local));
     assert.equal(await page.locator('header').evaluate(e=>getComputedStyle(e).display),'flex');
    }
    layouts.push(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE','LINK'].includes(e.tagName)).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [e.tagName,e.id,e.className,r.x,r.y,r.width,r.height,s.display,s.fontSize,s.fontWeight,s.lineHeight,s.color,s.backgroundColor];})));
    shots.push(await page.screenshot({fullPage:true,animations:'disabled'}));
    await context.close();
   }
   assert.deepEqual(layouts[0],layouts[1],`${path} ${viewport.width} ${theme}: geometry/style regression`);
   const a=PNG.sync.read(shots[0]),b=PNG.sync.read(shots[1]);
   assert.equal(a.width,b.width);assert.equal(a.height,b.height);
   const differentPixels=pixelmatch(a.data,b.data,null,a.width,a.height,{threshold:0.1,includeAA:false});
   if(differentPixels){fs.writeFileSync('/tmp/bootstrap-before.png',shots[0]);fs.writeFileSync('/tmp/bootstrap-after.png',shots[1]);}
   assert.equal(differentPixels,0,`${path} ${viewport.width} ${theme}: pixel regression`);
   report.push({path,width:viewport.width,theme,identicalGeometry:true,differentPixels,threshold:0.1,includeAA:false,localCssStatus:200,externalCssRequests:0});
  }
  console.log(JSON.stringify({kind:'local WAR with fixture APIs; baseline CDN fulfilled with pinned CSS; deterministic external image fixtures; not live latency',checks:report},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
