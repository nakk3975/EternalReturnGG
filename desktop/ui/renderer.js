'use strict';
const $=id=>document.getElementById(id),bridge=window.desktop;
const isSettings=new URLSearchParams(location.search).get('view')==='settings';
const esc=erText;
const mapBackground=Object.entries(erRoutePolygons).map(([,points])=>'<polygon points="'+points.map(([x,y])=>x/9.03+','+y/9.36).join(' ')+'" fill="#172b40" stroke="#344960" stroke-width=".25"/>').join('');
function mapSvg(data){return mapBackground+'<polyline points="'+[data.start,...data.route].map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="#5eead4" stroke-width=".7"/>'+data.route.map((p,i)=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="2.5" fill="#5eead4"/><text x="'+p.x+'" y="'+(p.y+1)+'" text-anchor="middle" fill="#071322" font-size="3">'+(i+1)+'</text>').join('')+'<circle cx="'+data.start.x+'" cy="'+data.start.y+'" r="2" fill="#fbbf24"/>';}
let hudSignature='';
function renderHud(data){if(!data)return;const signature=JSON.stringify(data);if(signature===hudSignature)return;hudSignature=signature;$('hud-body').innerHTML='<div>'+data.team.map(p=>'<div class="team-row"><strong>'+esc(p.nickname)+'</strong><span>'+esc(p.error||p.rank)+'</span></div>').join('')+'</div><div class="hud-clock">'+esc(data.clock)+'</div><svg class="mini-map" viewBox="0 0 100 100">'+mapSvg(data)+'</svg>'+data.route.map((c,i)=>'<div class="route-row"><b>'+(i+1)+'</b><span>'+esc(c.label)+'</span><em>+'+c.credits+'</em></div>').join('')+'<p class="hint">'+(data.route.length?'생존 미확인 · 예상 동선':'설정 창에서 출발점과 동선을 선택하세요.')+'</p>'+data.timers.slice(0,5).map(t=>'<div class="timer-row"><span>'+esc(t.label)+'</span><strong>'+esc(t.remaining)+'초</strong></div>').join('');}
bridge.onMode(m=>{document.body.classList.toggle('editing',m.editing);$('mode').textContent=m.editing?'위치·크기 편집':'클릭 통과';});
if(!isSettings){bridge.onSnapshot(renderHud);bridge.snapshot().then(renderHud);}
else{
 document.body.classList.add('settings');$('settings').hidden=false;
 const camps=erWildlifeCamps();let time=erHuntTime(),start={x:50,y:50},route=[],team=[],running=false,base=0,baseAt=0,assist,lastAuto=0;
 const active=new Set(Object.keys(erAnimals));let publishedSignature='',mapSignature='';
 const notice=text=>$('notice').textContent=text;
 for(let day=1;day<=8;day++)$('day').add(new Option(day+'일차',day));
 for(const name of Object.keys(erRoutePositions))$('region').add(new Option(name,name));
 for(const c of camps)$('camp').add(new Option(c.region+' · '+(c.fixedVariant?'변이체 ':'')+erAnimals[c.type].name+' · '+c.id,c.id));
 $('filters').innerHTML=Object.entries(erAnimals).map(([key,a])=>'<label><input type="checkbox" data-type="'+key+'" checked>'+a.name+'</label>').join('');
 const label=c=>c.region+' '+(c.fixedVariant?'변이 ':'')+erAnimals[c.type].name;
 function syncInputs(){$('day').value=time.day;$('phase').value=time.phase;$('phase').disabled=time.day===8;$('remaining').value=time.remaining;}
 function publish(){const now=erHuntSeconds(time);route=route.filter(c=>active.has(c.type)&&erHuntAvailable(c,time));
  const timers=camps.map(c=>{const s=erHuntState(c,time),deadline=s.timerNext??(s.waiting?s.next:null);return deadline!==null&&Number.isFinite(deadline)&&deadline>now?{label:label(c),remaining:Math.ceil(deadline-now)}:null;}).filter(Boolean).sort((a,b)=>a.remaining-b.remaining);
  const data={clock:erHuntLabel(time)+(running?' · 진행':''),start,team,route:route.map(c=>({x:c.x,y:c.y,label:label(c),credits:erHuntValue(c,time)})),timers};
  const signature=JSON.stringify(data);if(signature===publishedSignature)return;publishedSignature=signature;
  $('clock-label').textContent=data.clock;const geometry=JSON.stringify([data.start,data.route.map(c=>[c.x,c.y])]);
  if(geometry!==mapSignature){mapSignature=geometry;document.querySelector('#map svg').innerHTML=mapSvg(data);}
  bridge.publish(data);renderHud(data);
 }
 function recommend(){route=erRecommendHunt(start,camps.filter(c=>active.has(c.type)),{time,steps:Number($('steps').value)}).route;publish();}
 function pause(){running=false;$('clock-run').textContent='시계 시작';}
 $('apply-time').onclick=()=>{pause();assist?.invalidateTime();time=erHuntTime({day:$('day').value,phase:$('phase').value,remaining:$('remaining').value});syncInputs();publish();};
 $('clock-run').onclick=()=>{if(running)pause();else{assist?.invalidateTime();base=erHuntSeconds(time);baseAt=performance.now();running=true;$('clock-run').textContent='시계 멈춤';}publish();};
 $('new-match').onclick=()=>{pause();assist?.dispose();assist=null;document.querySelector('.screen-assist')?.remove();camps.forEach(c=>{c.events=[];c.timerObservations=[];});route=[];time=erHuntTime({day:1,remaining:140});syncInputs();startAssist();publish();notice('새 경기 · 처치 기록과 화면 연결을 초기화했습니다.');};
 $('region').onchange=()=>{const p=erRoutePositions[$('region').value];start={x:p[0],y:p[1]};recommend();};
 $('recommend').onclick=recommend;$('filters').onchange=e=>{if(e.target.dataset.type){e.target.checked?active.add(e.target.dataset.type):active.delete(e.target.dataset.type);recommend();}};
 $('map').onclick=e=>{if(assist?.mapClick(e))return;const r=$('map').getBoundingClientRect();start={x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};recommend();};
 $('kill').onclick=()=>{const c=camps.find(c=>c.id===$('camp').value);notice(erHuntRecord(c,time,'kill')?'전체 처치를 기록했습니다.':'미생성 또는 대기 중인 캠프는 기록할 수 없습니다.');publish();};
 $('undo-kill').onclick=()=>{const c=camps.find(c=>c.id===$('camp').value);c.events=[];c.timerObservations=[];publish();};
 $('settings').addEventListener('click',e=>{if(e.target.dataset.action)bridge.action(e.target.dataset.action).catch(e=>notice(e.message));});
 $('opacity').oninput=()=>bridge.action('opacity',Number($('opacity').value)/100);
 $('team-form').onsubmit=async e=>{e.preventDefault();const names=$('names').value.split(',').map(s=>s.trim()).filter(Boolean);if(!names.length||names.length>3)return notice('닉네임 1~3명을 쉼표로 구분해 입력하세요.');const button=e.target.querySelector('button');button.disabled=true;notice('팀 정보 조회 중 · 서버 첫 접속은 시간이 걸릴 수 있습니다.');try{const rows=await bridge.team(names);team=rows.map(p=>({nickname:p.nickname,error:p.error,rank:p.stats?(erTier(p.stats)?.name||'랭크 기록 없음')+' · '+erNumber(p.stats.mmr)+' RP':'랭크 기록 없음'}));publish();notice('팀 정보 조회 완료 · 오류가 있는 팀원은 다시 조회하세요.');}catch(err){notice(err.message);}finally{button.disabled=false;}};
 $('sources').onclick=async()=>{try{const sources=await bridge.sources();$('source').replaceChildren(new Option('공유할 창 선택',''));sources.forEach(s=>$('source').add(new Option(s.name,s.id)));await bridge.selectSource('');}catch(e){notice(e.message);}};
 $('source').onchange=()=>bridge.selectSource($('source').value).catch(e=>notice(e.message));bridge.onWarning(notice);
 function startAssist(){assist=erStartScreenAssist($('settings'),{getTime:()=>({...time}),onTime:t=>{pause();time=erHuntTime(t);syncInputs();publish();},onPosition:p=>{start=p;if($('follow').checked&&performance.now()-lastAuto>3000){lastAuto=performance.now();recommend();}else publish();},getCamps:()=>camps.filter(erHuntTimerSupported).map(c=>({id:c.id,count:c.count,label:label(c)+' · '+c.id})),onTimer:o=>{const c=camps.find(c=>c.id===o.campId);const accepted=c&&erHuntObserveTimer(c,o);if(accepted)publish();return !!accepted;}});}
 setInterval(()=>{if(!running)return;{const total=erHuntPhases.reduce((a,b)=>a+b,0),now=Math.min(total,base+Math.floor((performance.now()-baseAt)/1000));time=erHuntAt(now);if(now===total)pause();syncInputs();}publish();},1000);
 syncInputs();startAssist();publish();window.overlayReady=true;
}
