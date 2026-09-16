// Synthetic continuous video and real browser OCR, not a real-game accuracy measurement.
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const base=path.resolve('src/main/resources/static');
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost').pathname;
  if(u==='/'){res.setHeader('Content-Type','text/html');return res.end('<main><section class="hunt-clock"></section><div class="animal-map" style="width:400px;height:240px;background:#ddd"></div></main><script src="/static/js/animalMap.js"></script><script src="/static/js/animalTimer.js"></script><script src="/static/js/animalScreen.js"></script>');}
  const file=path.resolve(base,'.'+u.replace(/^\/static/,''));if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(()=>{
   window.screenPositions=[];window.timerObservations=[];window.screenClock={day:1,phase:'day',remaining:90};
   window.fixtureCanvas=document.createElement('canvas');fixtureCanvas.width=400;fixtureCanvas.height=240;
   window.paintFixture=(x=160)=>{const c=fixtureCanvas.getContext('2d');c.fillStyle='#18212c';c.fillRect(0,0,400,240);c.fillStyle='white';c.font='bold 24px Arial';const elapsed=window.timerStarted?Math.floor((performance.now()-timerStarted)/1000):0;c.fillText('01:'+String(31-elapsed).padStart(2,'0'),150,27);c.fillText((120-elapsed)+'s',265,166);
    for(let y=0;y<20;y++)for(let i=0;i<20;i++){c.fillStyle=`rgb(${200-i*6},${y*8},${150+i*4})`;c.fillRect(280+i,190+y,1,1);}
    for(const [ax,ay] of [[40,70],[350,70],[40,210]]){c.fillStyle='#98763a';c.fillRect(ax-12,ay-12,24,24);c.fillStyle='#385b72';c.fillRect(ax,ay,12,12);}
    for(let y=0;y<20;y++)for(let i=0;i<20;i++){c.fillStyle=`rgb(${i*12},${200-y*8},${(i+y)*6})`;c.fillRect(x-10+i,120+y,1,1);}
   };paintFixture();window.fixtureTimer=setInterval(()=>paintFixture(window.iconX??160),100);
   Object.defineProperty(navigator,'mediaDevices',{value:{getDisplayMedia:async()=>{window.fixtureStream=fixtureCanvas.captureStream(10);return fixtureStream;}}});
   window.assist=erStartScreenAssist(document.querySelector('main'),{getTime:()=>screenClock,onTime:t=>screenClock=t,onPosition:p=>screenPositions.push(p),getCamps:()=>[{id:'Mutant:Dog:0',count:3,label:'변이체 들개 캠프'}],onTimer:o=>{timerObservations.push(o);return true;}});
  });
  await page.locator('summary').click();await page.locator('[data-screen=share]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-screen=stop]').disabled);
  const canvas=page.locator('[data-screen=canvas]');await page.waitForFunction(()=>document.querySelector('[data-screen=canvas]').width===400);
  const drag=async(a,b)=>{const r=await canvas.boundingBox();await page.mouse.move(r.x+a[0]/400*r.width,r.y+a[1]/240*r.height);await page.mouse.down();await page.mouse.move(r.x+b[0]/400*r.width,r.y+b[1]/240*r.height);await page.mouse.up();};
  await drag([15,50],[380,230]);
  // Same production map click hook as animalMap.js.
  await page.evaluate(()=>document.querySelector('.animal-map').addEventListener('click',e=>assist.mapClick(e)));
  for(const [x,y] of [[40,70],[350,70],[40,210]]){await drag([x,y],[x,y]);await page.locator('.animal-map').click({position:{x,y}});}
  await drag([160,130],[160,130]);await page.locator('[data-screen=freeze]').click();await page.locator('[data-screen=track]').click();
  await page.waitForFunction(()=>screenPositions.length>0);const initial=await page.evaluate(()=>screenPositions.at(-1).x);
  await page.evaluate(()=>window.iconX=180);await page.waitForFunction(x=>screenPositions.at(-1)?.x>x+3,initial);
  // One minute of moving frames: each position must be freshly observed and mapped.
  for(let step=0;step<30;step++){
   const x=160+(step%8)*4;
   const count=await page.evaluate(x=>{window.iconX=x;return screenPositions.length;},x);
   await page.waitForTimeout(2000);
   await page.waitForFunction(({count,x})=>screenPositions.length>count&&Math.abs(screenPositions.at(-1).x-x/4)<1,{count,x});
  }
  await page.locator('[data-screen=mode]').selectOption('clock');await drag([145,4],[230,32]);await page.locator('[data-screen=read]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-screen=apply]').disabled,null,{timeout:60000});
  assert.match(await page.locator('[data-screen=clock]').innerText(),/1:31/);await page.locator('[data-screen=apply]').click();assert.equal(await page.evaluate(()=>screenClock.remaining),91);
  await page.locator('[data-screen=mode]').selectOption('timer');await drag([259,141],[337,174]);await drag([290,200],[290,200]);
  await page.locator('[data-screen=freeze]').click();await page.evaluate(()=>window.timerStarted=performance.now());
  await page.locator('[data-screen=read]').click();await page.waitForFunction(()=>!document.querySelector('[data-screen=apply]').disabled);await page.locator('[data-screen=apply]').click();
  await page.locator('[data-screen=auto]').check();await page.locator('[data-screen=timer-start]').click();
  await page.waitForFunction(()=>timerObservations.length>0,null,{timeout:30000});
  const observation=await page.evaluate(()=>timerObservations[0]);assert.equal(observation.campId,'Mutant:Dog:0');assert(Math.abs(observation.respawnAt-169)<=3);
  await page.locator('[data-screen=track]').click();
  await page.evaluate(()=>{clearInterval(fixtureTimer);const c=fixtureCanvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,400,240);});
  await page.waitForFunction(()=>document.querySelector('[data-screen=position]').textContent.includes('지도 변경'));
  await page.locator('[data-screen=stop]').click();assert(await page.locator('[data-screen=read]').isDisabled());assert(await page.evaluate(()=>fixtureStream.getTracks().every(t=>t.readyState==='ended')));
  assert.deepEqual(errors,[]);console.log('PASS browser: synthetic video, 60-second continuous icon tracking, bundled clock and camp timer OCR, map-change stop, stream cleanup');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
