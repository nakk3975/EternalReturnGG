// DOM/lifecycle integration test. Run: npm install --no-save jsdom@26.1.0
// Real screen picker and video decoding still require desktop browser acceptance.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const dom=new JSDOM('<main><section class="hunt-clock"></section><div class="animal-map"></div></main>',{url:'https://hunt.test',runScripts:'outside-only'}),w=dom.window;
const raf=new Map();let next=0;w.requestAnimationFrame=f=>{raf.set(++next,f);return next;};w.cancelAnimationFrame=i=>raf.delete(i);
const frame={width:200,height:120,data:new Uint8ClampedArray(200*120*4)};
for(let y=50;y<70;y++)for(let x=60;x<80;x++){const i=(y*200+x)*4;frame.data[i]=(x-60)*12;frame.data[i+1]=200-(y-50)*8;frame.data[i+2]=(x+y)%180;frame.data[i+3]=255;}
let trackingWorkerStops=0;w.Worker=class{postMessage(data){queueMicrotask(()=>this.onmessage?.({data:{found:w.erScreenLocate(data.frame,data.roi,data.template),epoch:data.epoch,token:data.token}}));}terminate(){trackingWorkerStops++;}};
const context={clearRect(){},drawImage(){},putImageData(){},strokeRect(){},fillRect(){},getImageData(){return {...frame,data:new Uint8ClampedArray(frame.data)};}};
w.HTMLCanvasElement.prototype.getContext=()=>context;w.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
w.HTMLCanvasElement.prototype.getBoundingClientRect=()=>({left:0,top:0,width:200,height:120});
w.HTMLMediaElement.prototype.play=async()=>{};w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
w.URL.createObjectURL=()=> 'blob:local';let revoked=0;w.URL.revokeObjectURL=()=>revoked++;
let trackStops=0,ended,resolvePicker;
Object.defineProperty(w.navigator,'mediaDevices',{value:{getDisplayMedia:()=>new Promise(r=>resolvePicker=r)}});
const fakeStream=()=>({getTracks:()=>[{stop(){trackStops++}}],getVideoTracks:()=>[{addEventListener(type,f){ended=f;}}]});
for(const name of ['animalMap','animalTimer','animalScreen'])require('node:vm').runInContext(fs.readFileSync('src/main/resources/static/js/'+name+'.js','utf8'),dom.getInternalVMContext());
let tickNow=0;Object.defineProperty(w.performance,'now',{value:()=>tickNow});
let clock={day:1,phase:'day',remaining:90},updates=[],timerUpdates=[];const api=w.erStartScreenAssist(w.document.querySelector('main'),{getTime:()=>clock,onTime:t=>clock=t,onPosition:p=>updates.push(p),getCamps:()=>[{id:'Mutant:Dog:0',count:3,label:'변이체 들개 캠프'}],onTimer:o=>{timerUpdates.push(o);return true;}});
const q=k=>w.document.querySelector('[data-screen="'+k+'"]'),video=q('video');Object.defineProperties(video,{videoWidth:{value:200},videoHeight:{value:120}});
const step=async n=>{tickNow=n;const jobs=[...raf.values()];raf.clear();jobs.forEach(f=>f(n));for(let i=0;i<20;i++)await Promise.resolve();};
const pointer=(x,y,type)=>q('canvas')['onpointer'+type]({clientX:x,clientY:y,pointerId:1});
const rect=(x,y,a,b)=>{pointer(x,y,'down');pointer(a,b,'up');};
(async()=>{
 // Late permission result must be stopped after user cancels / leaves.
 const opening=q('share').onclick();q('stop').onclick();resolvePicker(fakeStream());await opening;assert.equal(trackStops,1);assert(q('stop').disabled);
 const active=q('share').onclick();resolvePicker(fakeStream());await active;await step(1000);assert(!q('stop').disabled);
 rect(0,0,190,110);assert.equal(q('mode').value,'anchor');
 const ref=w.document.querySelector('.animal-map');ref.getBoundingClientRect=()=>({left:0,top:0,width:100,height:100});
 for(const [x,y,tx,ty] of [[20,20,10,10],[170,20,90,10],[20,90,10,90]]){
  rect(x,y,x,y);let stopped=false;assert(api.mapClick({currentTarget:ref,clientX:tx,clientY:ty,preventDefault(){},stopPropagation(){stopped=true;}}));assert(stopped);
 }
 assert.equal(q('mode').value,'self');rect(70,60,70,60);assert(!q('track').disabled);
 q('track').onclick();await step(1600);await step(2200);assert.equal(updates.length,1,'two matching frames publish calibrated location');assert(Math.abs(updates[0].x-36.6667)<.01);
 // OCR result applies only on explicit confirmation. No auto guessing day/night.
 q('mode').value='clock';rect(80,4,120,20);
 let workerStops=0;w.Tesseract={createWorker:async()=>({setParameters:async()=>{},recognize:async()=>({data:{text:'01:31',confidence:92}}),terminate(){workerStops++}})};
 await q('read').onclick();assert(!q('apply').disabled);assert.equal(clock.remaining,90);q('apply').onclick();assert.equal(clock.remaining,91);
 q('auto').checked=true;q('auto').onchange();assert(!q('auto').checked,'frozen preview cannot auto advance time');
 clock={day:2,phase:'night',remaining:100};q('apply').onclick();assert(q('apply').disabled,'old OCR cannot apply to another phase');
 // A camp timer is accepted only while game time is synchronized and moving.
 clock={day:1,phase:'day',remaining:90};
 q('mode').value='timer';rect(80,4,120,20);assert.equal(q('mode').value,'timer-icon');rect(70,60,70,60);
 assert(!q('timer-start').disabled);q('timer-start').onclick();assert(q('timer-status').textContent.includes('확인하세요'));
 q('freeze').onclick();
 // Reuse the loaded OCR worker, but return a real countdown for each configured whitelist.
 q('stop').onclick();
 const again=q('share').onclick();resolvePicker(fakeStream());await again;await step(3000);
 q('mode').value='timer';rect(80,4,120,20);rect(70,60,70,60);
 q('mode').value='clock';rect(80,4,120,20);q('freeze').onclick();
 let whitelist='';w.Tesseract.createWorker=async()=>({setParameters:async p=>{whitelist=p.tessedit_char_whitelist;},recognize:async()=>({data:{text:whitelist.includes('s')?(120-Math.floor((tickNow-3000)/1000))+'s':'01:'+String(30-Math.floor((tickNow-3000)/1000)).padStart(2,'0'),confidence:95}}),terminate(){workerStops++;}});
 await q('read').onclick();q('apply').onclick();q('auto').checked=true;q('auto').onchange();assert(q('auto').checked);q('timer-start').onclick();
 for(let n=3500;n<=11000;n+=500)await step(n);
 assert.equal(timerUpdates.length,1,'continuous camp countdown publishes one observation');assert.equal(timerUpdates[0].campId,'Mutant:Dog:0');assert(Math.abs(timerUpdates[0].respawnAt-170)<=1);
 api.invalidateTime();assert(!q('auto').checked);assert(q('apply').disabled);assert.equal(q('timer-start').textContent,'타이머 자동 인식 시작');
 q('freeze').onclick();for(let n=11500;n<=13500;n+=500)await step(n);assert.equal(timerUpdates.length,1,'frozen screen stops automatic timer writes');
 // Track ended clears the entire frame/calibration and terminates OCR.
 ended();assert(q('stop').disabled);assert(q('track').disabled);assert(q('read').disabled);assert.equal(workerStops,2);assert.equal(trackingWorkerStops,1);assert(trackStops>=2);
 // Source errors are handled without leaking a rejected event handler promise.
 Object.defineProperty(q('file'),'files',{value:[{type:'application/pdf'}]});await q('file').onchange({target:q('file')});assert(revoked>=1);
 api.dispose();assert.equal(raf.size,0);
 console.log('PASS DOM: late screen permission cancellation, calibration clicks, manual clock confirmation, phase mismatch, frozen auto guard, track end, file failure, cleanup');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>dom.window.close());
