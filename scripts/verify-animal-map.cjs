// Run with Playwright installed: node scripts/verify-animal-map.cjs
// Serves the real JS/CSS in a deterministic browser fixture; no game API is mocked as live evidence.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.hostname!=='hunt.test')return route.abort();
  if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>:root{--line:#ccc;--ink:#eee;--muted:#aaa;--panel:#202228;--panel-alt:#303238}body{background:#181a20;color:#eee;margin:20px}.surface{background:#202228}.planner-map-image{width:100%}</style><link rel="stylesheet" href="/css/animalMap.css"><div id="explorer-status"></div><main id="root"></main><script>function erPageShell(){return document.querySelector('#root')} function erText(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;')}</script><script src="/js/routePlanner.js"></script><script src="/js/animalMap.js"></script><script>startAnimalMap()</script>`});
  const path='src/main/resources/static'+u.pathname;
  return route.fulfill({contentType:u.pathname.endsWith('.js')?'text/javascript':'text/css',body:fs.readFileSync(path,'utf8')});
 });
 const clock=async(day,phase,remaining)=>{
  await page.locator('#hunt-day').selectOption(String(day));
  if(day<8)await page.locator('#hunt-phase').selectOption(phase);
  await page.locator('#hunt-minute').fill(String(Math.floor(remaining/60)));
  await page.locator('#hunt-second').fill(String(remaining%60));
  await page.locator('#hunt-second').dispatchEvent('change');
 };
 await page.goto('http://hunt.test/');
 assert.equal(await page.locator('#animal-points [data-add-camp^="Wolf:"]').count(),0);
 assert.equal(await page.locator('#animal-points [data-add-camp^="Bear:"]').count(),0);
 await page.locator('#animal-points [data-add-camp="Chicken:0"]').click({force:true});
 await page.locator('[data-kill="Chicken:0"]').click();
 assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),0);
 assert.equal(await page.locator('#hunt-route li').count(),0);
 assert.match(await page.locator('[data-kill="Chicken:0"]').locator('xpath=../..').innerText(),/재생성: 1일차 밤 1:20/);
 await clock(1,'night',81);assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),0);
 await clock(1,'night',80);assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),1);
 await clock(1,'day',91);assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),1);
 await clock(1,'day',90);assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),0);
 await page.locator('#hunt-share').click();const shared=page.url();assert.match(shared,/#hunt=/);
 await page.reload();assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),0);
 await clock(1,'night',80);assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),1);
 await page.locator('#animal-points [data-add-camp="Chicken:0"]').click({force:true});
 await page.locator('[data-cleared="Chicken:0"]').check();
 await page.locator('#hunt-reset-camps').click();assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').count(),0,'reset kills preserves explicit exclusion');
 await page.locator('[data-cleared="Chicken:0"]').uncheck();
 await clock(1,'day',90);await page.locator('#hunt-weather').selectOption('purple');
 await page.locator('[data-variant="Chicken:0"]').selectOption('1');
 assert(await page.locator('#animal-points [data-add-camp="Chicken:0"]').evaluate(el=>el.classList.contains('is-variant')));
 await page.locator('[data-kill="Chicken:0"]').click();await clock(1,'night',80);
 assert.equal(await page.locator('#animal-points [data-add-camp="Chicken:0"]').evaluate(el=>el.classList.contains('is-variant')),false);
 await clock(2,'day',100);
 // Locate a bear's region from the same shipped data, then confirm an activated nest.
 const region=await page.evaluate(()=>erWildlifeCamps().find(c=>c.id==='Bear:0').region);
 await page.locator('#hunt-start').selectOption(region);await page.locator('[data-variant="Bear:0"]').selectOption('2');
 assert.equal(await page.locator('#animal-points [data-add-camp="Bear:0"]').count(),1);
 await page.locator('[data-kill="Bear:0"]').click();await clock(3,'night',90);
 assert.equal(await page.locator('#animal-points [data-add-camp="Bear:0"]').count(),0);
 await page.locator('#hunt-recommend').click();
 const ids=await page.locator('#animal-points .is-selected').evaluateAll(els=>els.map(e=>e.dataset.addCamp));assert.equal(ids.length,new Set(ids).size);assert(!ids.includes('Bear:0'));
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'no mobile page overflow');
 assert.deepEqual(errors,[]);
 console.log('PASS browser: kill/respawn boundary, rewind, share reload, exclusion, purple variants, activated nests, recommendation, mobile width; external images intentionally not loaded');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
