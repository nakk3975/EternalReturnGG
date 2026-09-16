'use strict';
// Experimental, local-only screen observations. Never reads game memory or network traffic.
function erScreenAffine(pairs){
 if(pairs.length!==3)return null;
 const [a,b,c]=pairs.map(p=>p.source),det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);
 if(Math.abs(det)<100)return null;
 return p=>{
  const u=((p.x-a.x)*(c.y-a.y)-(c.x-a.x)*(p.y-a.y))/det;
  const v=((b.x-a.x)*(p.y-a.y)-(p.x-a.x)*(b.y-a.y))/det;
  const [x,y,z]=pairs.map(p=>p.target);
  return {x:x.x+u*(y.x-x.x)+v*(z.x-x.x),y:x.y+u*(y.y-x.y)+v*(z.y-x.y)};
 };
}
function erScreenPatch(frame,p,size=20){
 const x=Math.round(p.x-size/2),y=Math.round(p.y-size/2);
 if(x<0||y<0||x+size>frame.width||y+size>frame.height)return null;
 const data=[];
 for(let j=0;j<size;j+=2)for(let i=0;i<size;i+=2){const k=((y+j)*frame.width+x+i)*4;data.push(frame.data[k],frame.data[k+1],frame.data[k+2]);}
 return {data,size};
}
function erScreenDifference(a,b){if(!a||!b||a.data.length!==b.data.length)return Infinity;return a.data.reduce((n,v,i)=>n+Math.abs(v-b.data[i]),0)/(a.data.length*255);}
function erScreenLocate(frame,roi,template){
 const hits=[],r=template.size/2;
 for(let y=Math.ceil(roi.y+r);y<=roi.y+roi.h-r;y+=2)for(let x=Math.ceil(roi.x+r);x<=roi.x+roi.w-r;x+=2){
  let sum=0,n=0;const left=Math.round(x-r),top=Math.round(y-r),limit=.2*template.data.length*255;
  if(left<0||top<0||left+template.size>frame.width||top+template.size>frame.height)continue;
  sample:for(let j=0;j<template.size;j+=2)for(let i=0;i<template.size;i+=2){
   const k=((top+j)*frame.width+left+i)*4;
   for(let ch=0;ch<3;ch++)sum+=Math.abs(template.data[n++]-frame.data[k+ch]);
   if(sum>limit)break sample;
  }
  const score=sum/(template.data.length*255);if(n===template.data.length&&score<.2)hits.push({x,y,score});
 }
 hits.sort((a,b)=>a.score-b.score);const best=hits[0];if(!best)return null;
 const runner=hits.find(p=>Math.hypot(p.x-best.x,p.y-best.y)>template.size);
 if(best.score>.14||(runner&&runner.score-best.score<.025))return null;
 return {...best,confidence:1-best.score};
}
function erScreenClock(text){
 const m=String(text).trim().match(/^(\d{1,2})\s*:\s*([0-5]\d)$/);
 return m?Number(m[1])*60+Number(m[2]):null;
}
function erScreenClockContinuous(previous,next,elapsed){
 return Number.isInteger(previous)&&Number.isInteger(next)&&elapsed>=0&&elapsed<=5&&next<=previous&&Math.abs(previous-next-elapsed)<=2;
}
function erStartScreenAssist(root,{onPosition,getTime,onTime,getCamps=()=>[],onTimer=()=>false}){
 const panel=document.createElement('section');panel.className='surface screen-assist';
 panel.innerHTML=`<details><summary>내 화면으로 위치 연결 · 실험 기능</summary>
 <p>공유 화면은 이 브라우저에서만 분석하며 서버에 전송하거나 저장하지 않습니다. 지정한 고정 변이체 캠프의 재생성 타이머를 읽어 해당 캠프 전체의 처치·대기 상태를 반영할 수 있습니다.</p>
 <div class="screen-actions"><button data-screen="share">게임 화면 공유</button><label>이미지·영상 열기<input data-screen="file" type="file" accept="image/png,image/jpeg,video/mp4,video/webm"></label><button data-screen="stop" disabled>공유 종료</button><button data-screen="freeze" disabled>화면 고정</button></div>
 <p data-screen="status" role="status">공유할 게임 창을 직접 선택하세요. 설정에는 전체 지도가 펼쳐진 화면을 권장합니다.</p>
 <div class="screen-actions"><label>설정 단계<select data-screen="mode"><option value="map">① 지도 영역 드래그</option><option value="anchor">② 지형 기준점 3쌍 선택</option><option value="self">③ 내 아이콘 중심 선택</option><option value="clock">④ 분:초 숫자 영역 드래그</option><option value="timer">⑤ 동물 타이머 숫자 영역 드래그</option><option value="timer-icon">⑥ 그 타이머의 동물 아이콘 중심 선택</option></select></label><button data-screen="reset">좌표 보정 초기화</button><label>아이콘 크기(px)<input data-screen="size" type="number" min="12" max="48" value="20"></label></div>
 <p>지도 영역을 드래그한 뒤, 떨어져 있는 지형 기준점 3곳을 아래 화면과 사냥 지도에서 번갈아 클릭하세요. 동물·플레이어 아이콘 대신 지형을 선택하세요. 확대·이동·해상도가 바뀌면 다시 보정하세요.</p>
 <canvas data-screen="canvas" width="960" height="540" aria-label="인식할 게임 화면" tabindex="0"></canvas><video data-screen="video" muted playsinline controls hidden></video>
 <div class="screen-actions"><button data-screen="track" disabled>위치 추적 시작</button><button data-screen="read" disabled>시간 읽기</button><button data-screen="apply" disabled>읽은 시간 적용</button><label><input data-screen="auto" type="checkbox">같은 낮·밤 안에서 시간 자동 갱신</label></div>
 <p data-screen="position">위치 미확인</p><p data-screen="clock">시간 미확인 · 일차와 낮/밤은 위의 사냥 시점에서 직접 선택하세요.</p>
 <fieldset><legend>동물 재생성 타이머 자동 인식 · 실험 기능</legend>
 <p>스폰 위치의 동물 아이콘 위 숫자(예: 106s)를 지정하세요. 시간 자동 갱신을 켠 뒤 ⑤ 숫자 영역을 드래그하고 ⑥ 같은 동물 아이콘 중심을 클릭하세요. 카메라 이동은 아이콘 추적으로 보정하며 가림·겹침 때는 기록을 멈춥니다.</p>
 <div class="screen-actions"><label>대상 캠프<select data-screen="timer-camp"></select></label><button data-screen="timer-start" disabled>타이머 자동 인식 시작</button></div>
 <p data-screen="timer-status" role="status">대상 캠프를 직접 지정하세요. 일반 닭·들개·멧돼지·박쥐는 타이머가 없어 자동 인식 대상에서 제외합니다. 고정 변이체 중 화면에 타이머가 표시된 캠프만 연결하세요. 일반 동물은 지도에서 해당 캠프를 선택하고 전체 처치 기록 버튼으로 보정하세요. 한 마리 처치나 아이콘 소실만으로 전체 처리를 하지 않습니다. 무리 전체가 처치된 뒤 표시되는 타이머를 읽어 캠프 전체를 재생성 대기로 반영합니다. 타이머 관측은 이 페이지에서만 유지되며 공유 링크에는 포함되지 않습니다.</p>
 </fieldset>
 <p>기존 동물 표시는 생성·재생성 예상입니다. 직접 확인한 처치만 기록하세요. 시간 인식이 끊기거나 날짜/낮밤이 바뀌면 다시 확인 후 적용해야 합니다. 현재 시간표 밖의 9일차 이후는 자동 연결하지 않습니다.</p>
 </details>`;
 root.querySelector('.hunt-clock').after(panel);
 const q=k=>panel.querySelector('[data-screen="'+k+'"]'),canvas=q('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),video=q('video');
 const raw=document.createElement('canvas'),rx=raw.getContext('2d',{willReadFrequently:true});
 let source=null,stream=null,url=null,roi=null,clockROI=null,pairs=[],pending=null,template=null,frozen=false,tracking=false;
 let drag=null,frame=null,transform=null,lastFrameSize='',lastPosition=null,positionHits=0,worker=null,workerPromise=null,reading=false,readAt=0,clockRead=null,autoBase=null,clockRevision=0;
 let timerROI=null,timerTemplate=null,timerOrigin=null,timerLast=null,timerActive=false,timerAt=0,timerEpoch=0,timerObserver=typeof erAnimalTimerObserver==='function'?erAnimalTimerObserver({maxRemaining:600}):null;
 let disposed=false,session=0,raf=0,lastTick=0,starting=false,workerGeneration=0,tracker=null,trackJob=false,trackEpoch=0;
 const say=s=>q('status').textContent=s;
 const stopTimer=()=>{timerEpoch++;timerActive=false;timerObserver?.reset();q('timer-start').textContent='타이머 자동 인식 시작';};
 const clearClock=()=>{stopTimer();clockRevision++;clockRead=null;autoBase=null;q('apply').disabled=true;q('auto').checked=false;};
 function invalidate(){trackEpoch++;tracking=false;transform=null;pairs=[];pending=null;template=null;positionHits=0;lastPosition=null;q('track').disabled=true;q('track').textContent='위치 추적 시작';q('position').textContent='위치 미확인 · 좌표를 다시 보정하세요.';}
 function stop(){
  stopTimer();timerROI=null;timerTemplate=null;timerOrigin=null;q('timer-start').disabled=true;
  session++;tracker?.terminate();tracker=null;trackJob=false;stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;video.removeAttribute('src');video.load();video.hidden=true;
  if(url)URL.revokeObjectURL(url);url=null;source=null;frame=null;frozen=false;roi=null;clockROI=null;lastFrameSize='';invalidate();clearClock();
  q('stop').disabled=true;q('freeze').disabled=true;q('read').disabled=true;q('freeze').textContent='화면 고정';
  rx.clearRect(0,0,raw.width,raw.height);ctx.clearRect(0,0,canvas.width,canvas.height);
  workerGeneration++;worker?.terminate();worker=null;workerPromise=null;reading=false;say('화면 연결을 종료했습니다.');
 }
 function activate(s){source=s;frozen=s instanceof HTMLImageElement;q('freeze').textContent=frozen?'화면 고정됨':'화면 고정';q('stop').disabled=false;q('freeze').disabled=frozen;say('① 지도 영역을 드래그하세요.');}
 q('share').onclick=async()=>{
  if(starting)return;if(!navigator.mediaDevices?.getDisplayMedia){say('이 브라우저에서 화면 공유를 지원하지 않습니다. HTTPS 데스크톱 브라우저 또는 이미지·영상 파일을 사용하세요.');return;}
  stop();starting=true;q('share').disabled=true;const token=session;
  try{const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:{ideal:5,max:10}},audio:false});
   if(disposed||token!==session){s.getTracks().forEach(t=>t.stop());return;}
   stream=s;video.srcObject=s;await video.play();if(token!==session)return;activate(video);
   s.getVideoTracks()[0].addEventListener('ended',()=>{if(stream===s)stop();},{once:true});
  }catch(e){if(token===session){stop();say(e.name==='NotAllowedError'?'화면 공유가 취소되었거나 허용되지 않았습니다.':'화면을 열지 못했습니다. 게임 창 또는 파일을 다시 선택하세요.');}}
  finally{starting=false;q('share').disabled=false;}
 };
 q('file').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;stop();const token=session;url=URL.createObjectURL(file);
  try{if(file.type.startsWith('image/')){const img=new Image();img.src=url;await img.decode();if(token===session)activate(img);}
   else if(file.type.startsWith('video/')){video.src=url;video.hidden=false;await video.play();if(token===session)activate(video);}
   else throw new Error('unsupported');
  }catch(_){if(token===session){stop();say('이미지 또는 영상을 열지 못했습니다. PNG/JPEG/MP4/WebM 파일을 사용하세요.');}}e.target.value='';
 };
 q('stop').onclick=stop;
 q('freeze').onclick=()=>{frozen=!frozen;tracking=false;clearClock();q('track').textContent='위치 추적 시작';q('freeze').textContent=frozen?'고정 해제':'화면 고정';};
 q('reset').onclick=()=>{invalidate();q('mode').value='map';say('지도 영역과 기준점을 다시 지정하세요.');};
 q('mode').onchange=()=>{tracking=false;pending=null;q('track').textContent='위치 추적 시작';};
 q('size').onchange=()=>{template=null;tracking=false;q('track').disabled=true;say('새 크기로 내 아이콘을 다시 선택하세요.');};
 function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};}
 canvas.onpointerdown=e=>{if(!frame)return;tracking=false;q('track').textContent='위치 추적 시작';if(source===video){frozen=true;clearClock();q('freeze').textContent='고정 해제';}drag=point(e);canvas.setPointerCapture(e.pointerId);};
 canvas.onpointerup=e=>{
  if(!drag||!frame)return;const a=drag,b=point(e);drag=null;const mode=q('mode').value;
  if(mode==='map'||mode==='clock'||mode==='timer'){
   const r={x:Math.max(0,Math.min(a.x,b.x)),y:Math.max(0,Math.min(a.y,b.y)),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};
   r.w=Math.min(r.w,canvas.width-r.x);r.h=Math.min(r.h,canvas.height-r.y);
   if(r.w<12||r.h<8){say('영역을 조금 더 크게 드래그하세요.');return;}
   if(mode==='map'){roi=r;invalidate();q('mode').value='anchor';say('② 화면의 지형 기준점과 아래 사냥 지도의 같은 지점을 번갈아 3쌍 클릭하세요.');}
   else if(mode==='timer'){stopTimer();timerROI=r;timerTemplate=null;q('timer-start').disabled=true;q('mode').value='timer-icon';say('⑥ 같은 타이머 아래 동물 아이콘의 중심을 클릭하세요.');}
   else{clockROI=r;clearClock();q('read').disabled=false;say('분:초 숫자만 포함했는지 확인한 뒤 시간 읽기를 누르세요.');}
  }else if(mode==='anchor'){
   if(!roi||!inside(b,roi)){say('먼저 지도 영역을 지정하고 그 안의 지형을 클릭하세요.');return;}
   if(pairs.length===3)invalidate();const patch=erScreenPatch(frame,b);if(!patch)return;
   pending={source:b,patch};say((pairs.length+1)+'번째 기준점: 아래 사냥 지도에서 같은 지점을 클릭하세요.');
  }else if(mode==='timer-icon'){
   stopTimer();timerOrigin=b;timerLast=b;timerTemplate=timerROI?erScreenPatch(frame,b,20):null;q('timer-start').disabled=!timerTemplate;
   say('타이머와 동물 아이콘을 연결했습니다. 고정을 해제하고 게임 시간 자동 갱신을 켠 뒤 타이머 인식을 시작하세요.');
  }else if(mode==='self'){
   if(!roi||!transform||!inside(b,roi)){say('지도 영역과 지형 기준점 3쌍을 먼저 지정하세요.');return;}
   const size=Math.round(Math.max(12,Math.min(48,Number(q('size').value)||20))/2)*2;
   template=erScreenPatch(frame,b,size);q('track').disabled=!template;lastPosition=null;positionHits=0;say('내 아이콘을 선택했습니다. 위치 추적을 시작하세요.');
  }
 };
 canvas.onpointercancel=()=>drag=null;
 function inside(p,r){return p.x>=r.x&&p.y>=r.y&&p.x<=r.x+r.w&&p.y<=r.y+r.h;}
 function mapClick(e){
  if(!pending)return false;e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();
  pairs.push({...pending,target:{x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100}});pending=null;
  if(pairs.length===3){transform=erScreenAffine(pairs);if(!transform){invalidate();say('세 기준점이 너무 가깝거나 일직선입니다. 떨어진 지점을 선택하세요.');}
   else{q('mode').value='self';say('③ 공유 화면의 지도에서 내 아이콘 중심을 클릭하세요.');}}
  else say('화면에서 '+(pairs.length+1)+'번째 지형 기준점을 선택하세요.');return true;
 }
 q('track').onclick=()=>{trackEpoch++;tracking=!tracking;positionHits=0;lastPosition=null;q('track').textContent=tracking?'위치 추적 멈춤':'위치 추적 시작';};
 async function getWorker(){
  if(worker)return worker;if(workerPromise)return workerPromise;const generation=workerGeneration;
  workerPromise=(async()=>{
   if(!window.Tesseract)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/static/vendor/tesseract-7/tesseract.min.js';s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('OCR load'));};document.head.append(s);});
   const w=await Tesseract.createWorker('eng',1,{workerPath:'/static/vendor/tesseract-7/worker.min.js',corePath:'/static/vendor/tesseract-7/tesseract-core-lstm.wasm.js',langPath:'/static/vendor/tesseract-7',gzip:false});
   if(disposed||generation!==workerGeneration){await w.terminate();throw new Error('stale');}
   await w.setParameters({tessedit_char_whitelist:'0123456789:',tessedit_pageseg_mode:'7'});worker=w;return w;
  })();try{return await workerPromise;}finally{if(generation===workerGeneration)workerPromise=null;}
 }
 async function readClock(){
  if(reading||!clockROI||!frame)return;reading=true;const token=session,revision=clockRevision,at=performance.now(),selected={...getTime()};
  const crop=document.createElement('canvas'),r=clockROI;crop.width=Math.ceil(r.w*3);crop.height=Math.ceil(r.h*3);
  const cx=crop.getContext('2d');cx.drawImage(raw,r.x,r.y,r.w,r.h,0,0,crop.width,crop.height);
  // White HUD text -> black on white; colored HUD backgrounds are suppressed.
  const pixels=cx.getImageData(0,0,crop.width,crop.height);for(let i=0;i<pixels.data.length;i+=4){const [r,g,b]=pixels.data.slice(i,i+3),v=Math.min(r,g,b)>155&&Math.max(r,g,b)-Math.min(r,g,b)<65?0:255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}cx.putImageData(pixels,0,0);
  q('clock').textContent='시간 숫자를 읽는 중입니다…';
  try{const w=await getWorker();await w.setParameters({tessedit_char_whitelist:'0123456789:',tessedit_pageseg_mode:'7'});const {data}=await w.recognize(crop);if(token!==session||revision!==clockRevision||disposed)return;
   const remaining=erScreenClock(data.text),current=getTime(),duration=erHuntPhases[erHuntPhaseIndex(current)];
   if(remaining===null||data.confidence<55||remaining>duration||current.day!==selected.day||current.phase!==selected.phase){clearClock();q('clock').textContent='시간을 확실히 읽지 못했습니다. 숫자 영역과 일차·낮밤을 확인하세요.';return;}
   clockRead={remaining,at,day:current.day,phase:current.phase};q('apply').disabled=false;
   q('clock').textContent=`읽은 시간 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} · ${current.day}일차 ${current.phase==='day'?'낮':'밤'}에 적용 전 확인하세요.`;
   if(q('auto').checked){
    if(!autoBase||autoBase.day!==current.day||autoBase.phase!==current.phase||!erScreenClockContinuous(autoBase.remaining,remaining,(at-autoBase.at)/1000)){clearClock();q('clock').textContent='시간 연속성이 끊겼습니다. 일차·낮밤을 확인하고 시간을 다시 읽어 적용하세요.';}
    else{onTime({...current,remaining});autoBase={...clockRead};}
   }
  }catch(_){if(token===session){clearClock();q('clock').textContent='시간 인식을 불러오지 못했습니다. 수동 시간 설정을 이용하거나 다시 시도하세요.';}}
  finally{if(token===session)reading=false;}
 }
 q('read').onclick=readClock;
 q('apply').onclick=()=>{
  const t=getTime();if(!clockRead||performance.now()-clockRead.at>10000||t.day!==clockRead.day||t.phase!==clockRead.phase){clearClock();say('시간을 다시 읽고 현재 일차·낮밤을 확인하세요.');return;}
  onTime({...t,remaining:clockRead.remaining});autoBase={...clockRead};say('확인한 게임 시간을 적용했습니다.');
 };
 q('auto').onchange=()=>{if(q('auto').checked&&(!autoBase||frozen||source!==video)){q('auto').checked=false;say('움직이는 화면에서 시간을 읽고 적용한 뒤 자동 갱신을 켜세요.');}};
 const timerCamps=getCamps();
 for(const c of timerCamps){const option=document.createElement('option');option.value=c.id;option.textContent=c.label;q('timer-camp').append(option);}
 q('timer-camp').onchange=()=>{stopTimer();timerTemplate=null;timerROI=null;q('timer-start').disabled=true;q('timer-status').textContent='새 캠프의 타이머 영역과 아이콘을 다시 지정하세요.';};
 q('timer-start').onclick=()=>{
  if(timerActive){stopTimer();return;}
  const camp=getCamps().find(c=>c.id===q('timer-camp').value);
  if(!timerObserver||!timerTemplate||!camp||frozen||source!==video||!q('auto').checked||!autoBase){q('timer-status').textContent='움직이는 화면, 게임 시간 자동 갱신과 타이머 영역을 확인하세요.';return;}
  timerObserver.reset();timerEpoch++;timerActive=true;q('timer-start').textContent='타이머 인식 멈춤';q('timer-status').textContent='연속으로 감소하는 재생성 시간을 확인 중입니다…';
 };
 async function readAnimalTimer(now){
  if(!timerActive||reading||!frame||frozen||source!==video)return;
  const game=getTime(),elapsed=autoBase?(now-autoBase.at)/1000:Infinity;
  if(!q('auto').checked||!autoBase||elapsed>5||game.day!==autoBase.day||game.phase!==autoBase.phase||autoBase.remaining<elapsed){stopTimer();q('timer-status').textContent='게임 시간 연결이 끊겼습니다. 시간을 다시 확인하세요.';return;}
  const left=Math.max(0,timerLast.x-96),top=Math.max(0,timerLast.y-96);
  const found=erScreenLocate(frame,{x:left,y:top,w:Math.min(192,frame.width-left),h:Math.min(192,frame.height-top)},timerTemplate);
  if(!found){stopTimer();q('timer-status').textContent='타이머 동물 아이콘 미확인 · 가림 또는 겹침으로 중단. 같은 캠프인지 확인하고 다시 지정하세요.';return;}
  timerLast=found;
  const r={x:timerROI.x+found.x-timerOrigin.x,y:timerROI.y+found.y-timerOrigin.y,w:timerROI.w,h:timerROI.h};
  if(r.x<0||r.y<0||r.x+r.w>frame.width||r.y+r.h>frame.height){timerObserver.reset();return;}
  const token=session,epoch=timerEpoch,revision=clockRevision,campId=q('timer-camp').value,at=erHuntSeconds(autoBase)+elapsed;
  const crop=document.createElement('canvas');crop.width=Math.ceil(r.w*3);crop.height=Math.ceil(r.h*3);const cx=crop.getContext('2d');cx.drawImage(raw,r.x,r.y,r.w,r.h,0,0,crop.width,crop.height);
  reading=true;timerAt=now;
  try{
   const w=await getWorker();await w.setParameters({tessedit_char_whitelist:'0123456789:sS',tessedit_pageseg_mode:'7'});
   const {data}=await w.recognize(crop);
   if(token!==session||epoch!==timerEpoch||revision!==clockRevision||!timerActive||disposed)return;
   if(performance.now()-now>5000){timerObserver.reset();q('timer-status').textContent='인식 지연으로 이번 결과를 버렸습니다.';return;}
   const result=timerObserver.observe({text:data.text,confidence:data.confidence,at,campId,session:token});
   if(result){q('timer-status').textContent=onTimer(result)?'재생성까지 '+result.remaining+'초 · 캠프 전체의 처치와 타이머를 반영했습니다.':'타이머를 읽었으나 현재 시간표 또는 대상 범위에 맞지 않아 반영하지 않았습니다.';}
   else q('timer-status').textContent='타이머 확인 중: '+String(data.text).trim()+' · 연속 감소를 확인한 뒤 반영';
  }catch(_){if(token===session){timerObserver.reset();q('timer-status').textContent='타이머를 읽지 못했습니다. 영역을 다시 지정하세요.';}}
  finally{if(token===session)reading=false;}
 }
 function tick(now){
  if(disposed)return;raf=requestAnimationFrame(tick);if(!panel.isConnected){dispose();return;}if(now-lastTick<500)return;lastTick=now;
  if(!source)return;
  const width=source.videoWidth||source.naturalWidth,height=source.videoHeight||source.naturalHeight;if(!width||!height)return;
  const key=width+'x'+height;if(lastFrameSize&&key!==lastFrameSize){invalidate();roi=null;clockROI=null;clearClock();q('read').disabled=true;say('화면 해상도가 바뀌었습니다. 인식 영역을 다시 지정하세요.');}lastFrameSize=key;
  if(!frozen||!frame){const scale=Math.min(1,1280/width);raw.width=Math.round(width*scale);raw.height=Math.round(height*scale);rx.drawImage(source,0,0,raw.width,raw.height);frame=rx.getImageData(0,0,raw.width,raw.height);canvas.width=raw.width;canvas.height=raw.height;}
  ctx.putImageData(frame,0,0);ctx.lineWidth=2;
  for(const [r,color] of [[roi,'#38bdf8'],[clockROI,'#fbbf24'],[timerROI,'#a78bfa']])if(r){ctx.strokeStyle=color;ctx.strokeRect(r.x,r.y,r.w,r.h);}
  for(const p of pairs){ctx.fillStyle='#fbbf24';ctx.fillRect(p.source.x-3,p.source.y-3,6,6);}
  if(tracking&&transform&&template){
   const stable=pairs.every(p=>erScreenDifference(p.patch,erScreenPatch(frame,p.source))<.09);
   if(!stable){positionHits=0;lastPosition=null;tracking=false;trackEpoch++;q('track').textContent='위치 추적 시작';q('position').textContent='지도 변경 또는 가림 감지 · 추적을 멈추고 다시 보정하세요.';}
   else if(!trackJob){
    if(!tracker){tracker=new Worker('/static/js/animalScreenWorker.js?v=20260916-screen1');
     tracker.onmessage=e=>{trackJob=false;const {found,epoch,token}=e.data;if(!tracking||epoch!==trackEpoch||token!==session)return;
      if(!found){positionHits=0;lastPosition=null;q('position').textContent='내 아이콘 미확인 · 마지막 위치에서 갱신 중지';return;}
      const p=transform(found);if(p.x<0||p.y<0||p.x>100||p.y>100){positionHits=0;lastPosition=null;q('position').textContent='지도 밖 좌표 · 기준점을 다시 확인하세요.';return;}
      positionHits=lastPosition&&Math.hypot(found.x-lastPosition.x,found.y-lastPosition.y)<40?positionHits+1:1;lastPosition=found;
      if(positionHits>=2){onPosition(p);q('position').textContent=`화면에서 추정한 내 위치 · 지도 ${p.x.toFixed(1)}%, ${p.y.toFixed(1)}% · 생존 여부 미확인`;}
     };
     tracker.onerror=()=>{tracker?.terminate();tracker=null;trackJob=false;tracking=false;q('track').textContent='위치 추적 시작';q('position').textContent='위치 인식을 실행하지 못했습니다. 다시 시작하세요.';};
    }
    trackJob=true;tracker.postMessage({frame:{data:frame.data,width:frame.width,height:frame.height},roi,template,epoch:trackEpoch,token:session});
   }
   if(lastPosition){ctx.strokeStyle='#4ade80';ctx.strokeRect(lastPosition.x-template.size/2,lastPosition.y-template.size/2,template.size,template.size);}

  }
  if(q('auto').checked&&!frozen&&source===video&&now-readAt>1500&&!reading){readAt=now;readClock();}
  else if(timerActive&&!reading&&now-timerAt>1500)readAnimalTimer(now);
 }
 function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);stop();window.removeEventListener('pagehide',dispose);}
 window.addEventListener('pagehide',dispose);raf=requestAnimationFrame(tick);return {mapClick,dispose,invalidateTime(){clearClock();q('clock').textContent='사냥 시점을 변경했습니다. 화면 시간을 다시 읽고 적용하세요.';}};
}
