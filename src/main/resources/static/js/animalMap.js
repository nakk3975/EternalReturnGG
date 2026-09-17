'use strict';
// Values transcribed from the visible DAK.GG animal-map information table, 2026-09-14.
// Individual camp locations are a manually transcribed approximation of the reference map.
const erAnimals={Wolf:{name:'늑대',icon:'Wolf',credits:[2,6,10],first:'1일차 01:00',respawn:'낮마다',count:2},Bear:{name:'곰',icon:'Bear',credits:[5,10,20],first:'1일차 01:50',respawn:'밤마다',count:1},Chicken:{name:'닭',icon:'Chicken',credits:[1,2,3],first:'1일차 02:20',respawn:'120초',count:2},Bat:{name:'박쥐',icon:'Bat',credits:[1,2,null],first:'1일차 02:00',respawn:'150초',count:1},Boar:{name:'멧돼지',icon:'Boar',credits:[2,3,null],first:'1일차 01:30',respawn:'130초',count:1},Dog:{name:'들개',icon:'Dog',credits:[2,2,5],first:'1일차 02:00',respawn:'140초',count:3},AttackDrone:{name:'공격 드론',icon:'AttackDrone',credits:[3,null,null],first:'1일차 01:50',respawn:'210초',count:3}};
const erAnimalRegionIds={'항구':'10','창고':'20','연못':'30','개울':'40','모래사장':'50','고급 주택가':'60','골목길':'70','주유소':'80','호텔':'90','경찰서':'100','소방서':'110','병원':'120','절':'130','양궁장':'140','묘지':'150','숲':'160','공장':'170','성당':'180','학교':'190','바지선':'200'};
// DAK.GG's day/night icons are significant: bear and drone first spawn at NIGHT 1 01:50.
// Countdown thresholds, not time elapsed since match start. Other players' kills are a planning assumption.
const erAnimalSpawns={Chicken:{phase:'day',remaining:140,respawn:120},Bat:{phase:'day',remaining:120,respawn:150},Boar:{phase:'day',remaining:90,respawn:130},Dog:{phase:'day',remaining:120,respawn:140},Wolf:{phase:'day',remaining:60,wave:'day'},Bear:{phase:'night',remaining:110,wave:'night'},AttackDrone:{phase:'night',remaining:110,respawn:210}};
// Squad phase durations assembled from official 1.43, 1.45, 11.0 and 12.0 patch notes.
// Keep this table versioned: countdowns must not be treated as elapsed match time.
const erHuntClockVersion='squad-12.0-fixed-20260915';
const erHuntPhases=[140,110,140,130,130,110,100,110,80,80,70,50,200,60,150];
function erHuntTime(value={}){
 const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.floor(Number(v)))):fallback;
 const day=number(value.day??1,1,1,8),phase=day===8?'day':value.phase==='night'?'night':'day';
 const duration=erHuntPhases[(day-1)*2+(phase==='night'?1:0)];
 return {day,phase,remaining:number(value.remaining??90,90,0,duration),survivors:value.survivors===true};
}
function erHuntPhaseIndex(value){const t=erHuntTime(value);return (t.day-1)*2+(t.phase==='night'?1:0);}
function erHuntSeconds(value){const t=erHuntTime(value),i=erHuntPhaseIndex(t);return erHuntPhases.slice(0,i+1).reduce((a,b)=>a+b,0)-t.remaining;}
function erHuntAt(seconds){
 let left=Math.max(0,seconds);
 for(let i=0;i<erHuntPhases.length;i++){if(left<erHuntPhases[i]||i===erHuntPhases.length-1)return erHuntTime({day:Math.floor(i/2)+1,phase:i%2?'night':'day',remaining:Math.max(0,erHuntPhases[i]-left)});left-=erHuntPhases[i];}
}
function erHuntLabel(t){return `${t.day}일차 ${t.phase==='day'?'낮':'밤'} ${Math.floor(t.remaining/60)}:${String(t.remaining%60).padStart(2,'0')} 남음`;}
function erHuntFirst(type){const r=erAnimalSpawns[type];return erHuntSeconds({day:1,phase:r.phase,remaining:r.remaining});}
function erHuntRespawn(type,at){
 const r=erAnimalSpawns[type];if(!r.wave)return at+r.respawn;
 // Strictly later boundary: a kill at the start of a wave waits for the next wave.
 let boundary=0;
 for(let i=0;i<erHuntPhases.length;i++){if(i>=2&&boundary>at&&(i%2===0?'day':'night')===r.wave)return boundary;boundary+=erHuntPhases[i];}
 return Infinity;
}
function erHuntSpawned(type,value){
 const time=erHuntTime(value),rule=erAnimalSpawns[type];if(!rule)return false;
 if(erHuntSeconds(time)<erHuntFirst(type))return false;
 return time.survivors||!rule.wave||time.phase===rule.wave;
}
// Guaranteed groups have independent timers, including mutant wolves and bears.
// Squad baseline: official 1.43 / 1.45 / 8.4 notes; 10.0 preserves mutant timers.
const erFixedMutantRules={Chicken:{first:140,respawn:180},Boar:{first:140,respawn:180},Dog:{first:140,respawn:180},Wolf:{first:250,respawn:210},Bear:{first:390,respawn:240}};
function erHuntState(camp,value){
 const time=erHuntTime(value),now=erHuntSeconds(time),fixed=camp.fixedVariant===1;
 const rule=fixed?erFixedMutantRules[camp.type]:erAnimalSpawns[camp.type];
 if(!rule)return {available:false,variant:0,waiting:false,next:Infinity};
 let next=fixed?rule.first:erHuntFirst(camp.type),lastKill=null;
 for(const event of (camp.events||[]).filter(e=>e.at<=now).slice().sort((a,b)=>a.at-b.at)){
  if(event.kind==='kill'&&event.at>=next){next=fixed?event.at+rule.respawn:erHuntRespawn(camp.type,event.at);lastKill=event.at;}
 }
 const waiting=lastKill!==null&&now<next;
 const observations=(camp.timerObservations||[]).filter(o=>o.observedAt<=now&&o.respawnAt>now);
 const dead=observations.length?camp.count:0,remainingCount=dead?0:camp.count;
 return {available:!camp.cleared&&!waiting&&remainingCount>0&&now>=next&&(fixed||erHuntSpawned(camp.type,time)),variant:fixed?1:0,waiting,next,lastKill,remainingCount,timerDead:dead,timerNext:observations.length?Math.min(...observations.map(o=>o.respawnAt)):null};
}
function erHuntTimerSupported(camp){return camp.fixedVariant===1&&Object.hasOwn(erFixedMutantRules,camp.type);}
function erHuntObserveTimer(camp,observation){
 if(!erHuntTimerSupported(camp))return false;
 const {observedAt,respawnAt}=observation||{},total=erHuntPhases.reduce((a,b)=>a+b,0);
 if(!Number.isFinite(observedAt)||!Number.isFinite(respawnAt)||observedAt<erFixedMutantRules[camp.type].first||respawnAt<=observedAt||respawnAt-observedAt>erFixedMutantRules[camp.type].respawn+2||respawnAt>total)return false;
 // The game shows this timer only after the entire camp is cleared.
 // Preserve the observed deadline without inventing an exact historical kill time.
 const old=camp.timerObservations?.[0];if(old&&old.observedAt>=observedAt)return false;
 camp.timerObservations=[{observedAt,respawnAt}];return true;
}
function erHuntCount(camp,time){return erHuntState(camp,time).remainingCount??camp.count;}
function erHuntRecord(camp,value,kind){
 const state=erHuntState(camp,value),at=erHuntSeconds(value);
 if(kind!=='kill'||!state.available)return false;
 camp.events=camp.events||[];if(camp.events.length>=200)return false;
 // Editing an earlier moment replaces later history.
 camp.events=camp.events.filter(e=>e.at<at);
 camp.events.push({at,kind:'kill',variant:state.variant});camp.timerObservations=[];return true;
}
function erHuntRestoreCamp(camp,saved,time,version){
 camp.count=Math.max(1,Math.min(10,Math.floor(Number(saved.count)||camp.defaultCount||1)));camp.cleared=saved.cleared===true;camp.events=[];
 if(version>=3){
  const total=erHuntPhases.reduce((a,b)=>a+b,0);
  const events=(Array.isArray(saved.events)?saved.events:[]).slice(0,200).filter(e=>e&&Number.isInteger(e.at)&&e.at>=0&&e.at<=total&&e.kind==='kill'&&e.variant===(camp.fixedVariant===1?1:0)).sort((a,b)=>a.at-b.at);
  for(const e of events){
   const wasExcluded=camp.cleared;camp.cleared=false;
   if(erHuntState(camp,{...erHuntAt(e.at),survivors:true}).available)camp.events.push({...e});
   camp.cleared=wasExcluded;
  }
 }
 // Imported variant flags cannot turn ordinary camps into random variants or nests.
 camp.variant=camp.fixedVariant===1?1:0;return camp;
}
function erHuntAvailable(camp,time,blocked=[]){
 return !blocked.includes(camp.region)&&(time?erHuntState(camp,time).available:!camp.cleared);
}
// Normal camps transcribed from the visible DAK.GG map on 2026-09-14.
// Screen coordinates: canvas origin (134,58), size 732 x 926. Coordinates are approximate map positions, not world navigation nodes.
const erWildlifePoints={
 Wolf:[[405,170],[477,166],[542,178],[302,234],[594,228],[381,309],[366,395],[484,352],[676,359],[778,363],[235,416],[632,419],[246,523],[317,564],[427,521],[612,483],[762,571],[409,658],[373,701],[584,599],[521,694],[758,643],[461,784],[582,812],[688,796],[636,887]],
 Chicken:[[418,208],[479,188],[580,228],[652,232],[360,312],[476,319,3],[722,285],[721,378],[288,419],[595,412],[638,516],[741,537],[282,615],[409,516],[399,571],[340,667],[370,729],[574,679],[670,602],[723,718],[501,730],[562,774],[607,840],[560,876]],
 Dog:[[423,142],[624,255],[496,319],[445,405],[254,478],[711,588],[571,621],[730,650],[700,742],[507,809],[585,845]],
 Bat:[[366,182],[530,152],[576,166],[286,278],[436,244],[503,299],[394,333],[362,375],[504,360],[625,331],[713,277],[759,331],[676,370],[644,402],[734,418],[772,491],[226,435],[299,451],[384,497],[337,566],[422,572],[638,488],[727,554],[513,600],[555,623],[689,602],[690,624],[355,674],[565,684],[650,743],[661,760],[512,738],[441,759],[589,777],[644,798],[652,855]],
 Boar:[[549,147],[283,255],[302,253],[416,314],[571,268],[560,306],[574,316],[723,247],[742,266],[673,294],[779,337],[703,384],[688,402],[773,515],[400,505],[432,566],[413,580],[231,582],[300,610],[324,649],[410,678],[542,578],[539,608],[491,634],[669,575],[645,607],[632,618],[426,747],[582,794],[674,774],[649,814],[679,828],[568,887]],
 Bear:[[414,195],[454,249],[567,150],[262,267],[321,303],[344,320],[522,289],[610,246],[582,286],[694,231],[776,284],[321,438],[282,497],[235,594],[257,611],[389,534],[613,415],[701,435,2],[629,498],[562,572],[720,514],[611,651],[703,610],[755,700],[712,780],[339,737],[422,788,2],[512,852],[555,848],[555,905]],
 AttackDrone:[[484,405],[417,473],[549,473]]
};
// Fixed mutant camps: visible DAK.GG map, 2026-09-15; same coordinate reference.
const erFixedMutantPoints={
 Chicken:[[531,412,6],[651,668,6],[477,716,6]],
 Boar:[[452,134,3],[608,170,3],[644,344,3],[416,436,3]],
 Dog:[[210,440,4],[796,540,4],[467,578,4],[298,704,4]],
 Wolf:[[268,300,3],[746,742,3]],
 Bear:[[801,334,2],[202,552,2],[578,925,2]]
};
function erPointInRegion(x,y,polygon){
 let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;
}
function erWildlifeCamps(){return [[erWildlifePoints,0],[erFixedMutantPoints,1]].flatMap(([data,fixedVariant])=>Object.entries(data).flatMap(([type,points])=>points.map(([sx,sy,count],i)=>{
 const x=(sx-134)/732*100,y=(sy-58)/926*100;
 const region=Object.entries(erAnimalRegionIds).find(([,id])=>erPointInRegion(x*9.03,y*9.36,erRoutePolygons[id]))?.[0]||Object.keys(erAnimalRegionIds).sort((a,b)=>Math.hypot(x-erRoutePositions[a][0],y-erRoutePositions[a][1])-Math.hypot(x-erRoutePositions[b][0],y-erRoutePositions[b][1]))[0];
 return {id:(fixedVariant?'Mutant:':'')+type+':'+i,region,type,count:count||erAnimals[type].count,defaultCount:count||erAnimals[type].count,fixedVariant,variant:fixedVariant,x,y,cleared:false,events:[]};
})));}
function erHuntValue(camp,time){return Math.max(0,Number(time?erHuntCount(camp,time):camp.count)||0)*(erAnimals[camp.type]?.credits[camp.variant||0]||0);}
// Compare credit per estimated effort. Coordinates are region centers, not walkable paths.
function erRecommendHunt(start,camps,{steps=5,travelWeight=1,killCost=8,blocked=[],time=null}={}){
 // A recommendation uses one immutable time snapshot; evaluate each camp once.
 const counts=new Map(),values=new Map(),available=[];
 for(const c of camps){
  const state=time?erHuntState(c,time):null,count=state?.remainingCount??c.count;
  const value=Math.max(0,Number(count)||0)*(erAnimals[c.type]?.credits[(state?state.variant:c.variant)||0]||0);
  counts.set(c,count);values.set(c,value);
  if(!blocked.includes(c.region)&&(state?state.available:!c.cleared)&&value>0)available.push(c);
 }let beam=[{route:[],point:start,credits:0,cost:0}];
 for(let depth=0;depth<Math.min(10,Math.max(1,steps));depth++){
  const next=[];for(const state of beam)for(const c of available){if(state.route.some(v=>v.id===c.id))continue;const distance=Math.hypot(c.x-state.point.x,c.y-state.point.y);next.push({route:[...state.route,c],point:c,credits:state.credits+values.get(c),cost:state.cost+distance*Math.max(.1,travelWeight)+Math.max(1,killCost)*counts.get(c)});}
  if(!next.length)break;next.sort((a,b)=>b.credits/Math.max(1,b.cost)-a.credits/Math.max(1,a.cost)||b.credits-a.credits);beam=next.slice(0,80);
 }
 return beam[0]||{route:[],credits:0,cost:0};
}
async function startAnimalMap(){
 const root=erPageShell('야생동물 지도 · 사냥 동선','게임 시간과 출발 위치를 정하고 사냥할 동물을 선택하세요.');root.className='animal-page';
 document.title='야생동물 지도 · ER.GG';document.querySelector('#explorer-status').textContent='';
 let start=null,route=[],blocked=[],active=new Set(Object.keys(erAnimals)),time=erHuntTime(),selectedRegion='';
 const camps=erWildlifeCamps();let screenAssist=null;
 const icon=type=>'https://cdn.dak.gg/er/images/assets/animal-map-icon/Ico_DetailedMap_'+erAnimals[type].icon+'.png';
 const variants=['일반','확정 변이체'];
 root.innerHTML=`<p class="animal-scope">동물 아이콘을 누르면 해당 지역의 사냥 목표가 열리고 동선에 추가됩니다. 일반 동물은 목표 카드에서 캠프 전체 처치를 기록하세요. 한 마리만 처치했을 때는 전체 처치를 기록하지 마세요. 지도 빈 곳을 누르면 그 위치에서 출발합니다.</p>
 <section class="surface hunt-clock" aria-label="사냥 시간 설정">
  <div class="hunt-clock-heading"><strong>사냥 시점</strong><span id="hunt-clock-summary" aria-live="polite"></span></div>
  <div class="hunt-clock-fields">
   <label>일차<select id="hunt-day">${Array.from({length:8},(_,i)=>`<option value="${i+1}">${i+1}일차</option>`).join('')}</select></label>
   <label>시간대<select id="hunt-phase"><option value="day">낮</option><option value="night">밤</option></select></label>
   <fieldset class="hunt-countdown"><legend>남은 시간</legend><label><input id="hunt-minute" type="number" min="0" max="9" value="1" aria-label="남은 분"><span>분</span></label><label><input id="hunt-second" type="number" min="0" max="59" value="30" aria-label="남은 초"><span>초</span></label></fieldset>
   <label class="hunt-survivors">이전 시간대 늑대·곰<select id="hunt-survivors"><option value="false">처치된 것으로 가정</option><option value="true">살아 있으면 포함</option></select></label>
  </div>
  <div class="hunt-presets"><button data-hunt-preset="early">1일차 낮 1:30</button><button data-hunt-preset="wolf">늑대 출현 · 낮 1:00</button><button data-hunt-preset="bear">곰 출현 · 밤 1:50</button></div>
  <p class="data-note">게임에 표시되는 남은 시간을 입력하세요. 기본 설정은 이전 시간대의 늑대·곰을 처치했다고 가정합니다. 실제 생존 여부는 자동으로 알 수 없습니다. 시간을 되돌려 처치를 수정하면 해당 캠프의 이후 기록이 교체됩니다.</p>
 </section>
 <div class="animal-layout"><section class="surface animal-main"><div class="animal-toolbar"><button id="hunt-undo">되돌리기</button><button id="hunt-clear">동선 초기화</button><button id="hunt-share">동선 링크 복사</button><button id="hunt-zoom-out" aria-label="지도 축소">−</button><button id="hunt-zoom-in" aria-label="지도 확대">＋</button><button id="hunt-reset-camps">처치 기록 초기화</button><span id="hunt-status" role="status">지도에서 출발 위치를 선택하세요.</span></div>
 <div class="animal-map-scroll"><div class="planner-map animal-map"><img class="planner-map-image" src="https://cdn.dak.gg/er/images/routes/map_v2.png?q=20260430" alt="루미아 섬 지도"><svg class="animal-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg><div id="animal-points"></div><div id="hunt-start-pin"></div></div></div><ol id="hunt-route"></ol></section>
 <aside class="animal-settings surface"><h2>추천 사냥 동선</h2><label>시작 지역<select id="hunt-start"><option value="">지도에서 선택</option>${Object.keys(erAnimalRegionIds).map(n=>'<option>'+erText(n)+'</option>').join('')}</select></label><label>사냥 목표 수<select id="hunt-steps"><option>3</option><option selected>5</option><option>8</option></select></label><label>추천 성향<select id="hunt-weight"><option value="1">균형</option><option value="3">이동 최소화</option><option value="0.3">크레딧 우선</option></select></label><button id="hunt-recommend" class="hunt-primary">사냥 동선 추천</button>
 <h3>동물 필터</h3><div id="animal-filters">${Object.entries(erAnimals).map(([key,a])=>`<label><input type="checkbox" data-animal-filter="${key}" checked><img alt="" src="${icon(key)}">${a.name}</label>`).join('')}</div>
 <h3 id="hunt-region-title">지역을 선택하세요</h3><div id="hunt-camps"></div><label class="hunt-check hunt-block-label"><input id="hunt-block" type="checkbox" disabled><span>선택 지역 제외 <small>금지 구역·경쟁</small></span></label><p id="hunt-total">계획 크레딧 0</p></aside></div>
 <section class="surface animal-reference"><h2>동물 정보</h2><div class="animal-table-scroll"><table class="data-table"><thead><tr><th>동물</th><th>일반</th><th>변이체</th><th>잠식 변이체</th><th>일반 최초 생성</th><th>일반 재생성</th></tr></thead><tbody>${Object.entries(erAnimals).map(([type,a])=>'<tr><td>'+a.name+'</td>'+a.credits.map(v=>'<td>'+(v??'—')+'</td>').join('')+'<td>1일차 '+(erAnimalSpawns[type].phase==='night'?'밤':'낮')+' '+a.first.split(' ')[1]+'</td><td>'+a.respawn+'</td></tr>').join('')}</tbody></table></div>
 <p class="data-note">크레딧은 1마리 기준입니다. 확정 변이체 캠프만 표시합니다. 닭·멧돼지·들개 무리는 1일차 밤부터 생성되어 처치 후 180초, 변이체 늑대는 2일차 낮부터 210초, 변이체 곰은 2일차 밤부터 240초 후 재생성됩니다. 변이체는 시간대가 바뀌어도 처치 전까지 유지됩니다. 랜덤 변이와 안개 둥지는 포함하지 않습니다. 개별 제외는 직접 해제할 때까지 유지됩니다. 시간은 스쿼드 기준이며 패치에 따라 달라질 수 있습니다. 캠프 좌표는 근사치이며 추천선은 방문 순서입니다. 벽을 따라 이동하는 길찾기와 실시간 생존 상태는 제공하지 않습니다. <a href="https://dak.gg/er/guide/animal-map?hl=ko" target="_blank" rel="noopener">출현 시간 참고: DAK.GG</a> · <a href="https://event.playeternalreturn.com/S10/Royal/Roadmap?hl=ko-KR" target="_blank" rel="noopener">낮·밤 재생성 및 변이 규칙: 공식 안내</a></p></section>`;
 const info=root.querySelector('#hunt-status');
 const isVisible=c=>active.has(c.type)&&erHuntAvailable(c,time,blocked);
 const timeLabel=()=>erHuntLabel(time);
 function syncClock(){
  root.querySelector('#hunt-day').value=String(time.day);root.querySelector('#hunt-phase').value=time.phase;
  root.querySelector('#hunt-minute').value=Math.floor(time.remaining/60);root.querySelector('#hunt-second').value=time.remaining%60;root.querySelector('#hunt-survivors').value=String(time.survivors);root.querySelector('#hunt-phase').disabled=time.day===8;
 }
 function setRegion(region){
  selectedRegion=region;root.querySelector('#hunt-region-title').textContent=region+' 사냥 목표';
  const block=root.querySelector('#hunt-block');block.disabled=false;block.checked=blocked.includes(region);
  const targets=camps.filter(c=>c.region===region&&active.has(c.type));
  root.querySelector('#hunt-camps').innerHTML=targets.map(c=>`<article class="hunt-camp ${!isVisible(c)?'is-cleared':''}">
   <div class="hunt-camp-heading"><img src="${icon(c.type)}" alt=""><strong>${erAnimals[c.type].name}</strong><span>+${erHuntValue(c,time)} 크레딧</span></div>
   <div class="hunt-camp-fields"><label>개체 수<input type="number" min="1" max="10" value="${c.count}" data-count="${c.id}" aria-label="${erAnimals[c.type].name} ${c.id} 목표 개체 수"></label><span>${variants[c.fixedVariant||0]}</span></div>
   <p class="hunt-camp-state">${campStatus(c)}</p><p class="data-note">${erHuntTimerSupported(c)?'고정 변이체 · 화면 타이머 연결 가능':'수동 보정 · 전체 처치를 직접 확인한 경우에만 기록'}</p>
   <div class="hunt-camp-actions"><button data-kill="${c.id}" ${!isVisible(c)?'disabled':''}>캠프 전체 처치 기록</button><button data-reset-history="${c.id}" ${!c.events.length&&!c.timerObservations?.length?'disabled':''}>기록 지우기</button></div>
   <div class="hunt-camp-actions"><label class="hunt-check"><input type="checkbox" data-cleared="${c.id}" ${c.cleared?'checked':''}><span>계속 제외</span></label><button data-add-camp="${c.id}" ${!isVisible(c)||route.includes(c)?'disabled':''}>${route.includes(c)?'추가됨':'동선 추가'}</button></div></article>`).join('')||'<p class="empty-state">현재 시간과 필터에 맞는 동물이 없습니다.</p>';
 }
 function campStatus(c){
  const state=erHuntState(c,time);
  if(c.cleared)return '직접 제외됨';
  if(state.timerDead)return `타이머 관측: 캠프 전체 ${c.count}마리 처치됨 · 재생성 ${erHuntLabel(erHuntAt(state.timerNext))}`;
  if(state.waiting)return `처치: ${erHuntLabel(erHuntAt(state.lastKill))} · ${Number.isFinite(state.next)?'재생성: '+erHuntLabel(erHuntAt(state.next)):'자동 재생성 없음'}`;
  if(!state.available)return '현재 시점에 표시되지 않음';
  return state.lastKill!==null?'재생성 예상 · 현재 상태 미확인':'생성 예상 · 현재 상태 미확인';
 }
 function draw(){
  camps.forEach(c=>{c.variant=erHuntState(c,time).variant;});
  route=route.filter(isVisible);
  const shown=camps.filter(isVisible);
  root.querySelector('#hunt-clock-summary').textContent=timeLabel()+' · '+shown.length+'개 캠프';
  root.querySelector('#animal-points').innerHTML=shown.map(c=>`<button class="animal-point ${route.includes(c)?'is-selected':''} ${c.variant?'is-variant':''}" data-add-camp="${c.id}" style="left:${c.x}%;top:${c.y}%" aria-label="${erText(c.region)} ${variants[c.variant]} ${erAnimals[c.type].name} ${erHuntCount(c,time)}마리 동선 추가" title="${erText(c.region)} · ${variants[c.variant]} ${erAnimals[c.type].name} ${erHuntCount(c,time)}마리 · ${erHuntValue(c,time)} 크레딧"><img alt="" src="${icon(c.type)}"><b>${route.includes(c)?route.indexOf(c)+1:erHuntCount(c,time)>1?erHuntCount(c,time):''}</b></button>`).join('');
  root.querySelector('#hunt-start-pin').innerHTML=start?'<span class="hunt-start-pin" style="left:'+start.x+'%;top:'+start.y+'%">출발</span>':'';
  const points=start?[start,...route]:route;root.querySelector('.animal-lines').innerHTML='<polyline points="'+points.map(p=>p.x+','+p.y).join(' ')+'"/>';
  root.querySelector('#hunt-route').innerHTML=route.map((c,i)=>'<li><b>'+(i+1)+'</b><span>'+erText(c.region)+' · '+(c.variant?variants[c.variant]+' ':'')+erAnimals[c.type].name+' '+erHuntCount(c,time)+'마리</span><strong>+'+erHuntValue(c,time)+'</strong><button data-remove-hunt="'+i+'" aria-label="'+(i+1)+'번째 목표 삭제">×</button></li>').join('');
  root.querySelector('#hunt-total').textContent='계획 크레딧 '+route.reduce((n,c)=>n+erHuntValue(c,time),0)+' · '+route.reduce((n,c)=>n+erHuntCount(c,time),0)+'마리';root.querySelector('#hunt-undo').disabled=!route.length;
  root.querySelectorAll('[data-animal-filter]').forEach(el=>{el.closest('label').classList.toggle('is-unavailable',!camps.some(c=>c.type===el.dataset.animalFilter&&erHuntAvailable(c,time,blocked)));});
  if(selectedRegion)setRegion(selectedRegion);
 }
 function changeTime(next){
  const normalized=erHuntTime(next);if(JSON.stringify(normalized)===JSON.stringify(time))return;
  time=normalized;syncClock();
  const before=route.length;draw();info.textContent=timeLabel()+' 기준으로 갱신했습니다.'+(before>route.length?' 현재 사냥할 수 없는 목표는 동선에서 제외했습니다.':'');
 }
 function chooseStart(region){const p=erRoutePositions[region];if(!p)return;start={region,x:p[0],y:p[1]};root.querySelector('#hunt-start').value=region;selectedRegion=region;info.textContent=region+'에서 출발 · 추천 버튼을 누르세요.';draw();}
 root.querySelector('#hunt-start').onchange=e=>{if(e.target.value)chooseStart(e.target.value);else{start=null;draw();}};
 root.querySelector('#hunt-recommend').onclick=()=>{
  if(!start){info.textContent='출발 위치를 먼저 선택해 주세요.';return;}
  if(blocked.includes(start.region)){info.textContent='제외하지 않은 지역을 출발지로 선택하세요.';return;}
  route=erRecommendHunt(start,camps.filter(c=>active.has(c.type)),{steps:Number(root.querySelector('#hunt-steps').value),travelWeight:Number(root.querySelector('#hunt-weight').value),blocked,time}).route;
  info.textContent=route.length?timeLabel()+' · '+route.length+'개 목표 추천':'현재 시간과 필터에 맞는 사냥 목표가 없습니다.';draw();
 };
 root.querySelector('#hunt-undo').onclick=()=>{route.pop();draw();};root.querySelector('#hunt-clear').onclick=()=>{route=[];draw();};
 root.querySelector('#hunt-block').onchange=e=>{blocked=blocked.filter(v=>v!==selectedRegion);if(e.target.checked)blocked.push(selectedRegion);draw();};
 root.addEventListener('click',e=>{
  const kill=e.target.closest('[data-kill]');if(kill){const c=camps.find(c=>c.id===kill.dataset.kill);if(c&&isVisible(c)&&erHuntRecord(c,time,'kill')){info.textContent=timeLabel()+' · 캠프 전체 처치를 기록했습니다. 이후 시점의 기존 기록은 다시 입력하세요.';draw();}}
  const reset=e.target.closest('[data-reset-history]');if(reset){const c=camps.find(c=>c.id===reset.dataset.resetHistory);if(c){c.events=[];c.timerObservations=[];draw();}}
  const preset=e.target.closest('[data-hunt-preset]');if(preset){screenAssist?.invalidateTime();const key=preset.dataset.huntPreset;changeTime({...time,day:1,phase:key==='bear'?'night':'day',remaining:key==='early'?90:key==='wolf'?60:110});}
  const add=e.target.closest('[data-add-camp]');if(add){const c=camps.find(c=>c.id===add.dataset.addCamp);if(c&&isVisible(c)&&!route.includes(c)){if(!start)chooseStart(c.region);route.push(c);selectedRegion=c.region;}draw();}
  const remove=e.target.closest('[data-remove-hunt]');if(remove){route.splice(Number(remove.dataset.removeHunt),1);draw();}
 });
 root.addEventListener('change',e=>{
  const t=e.target;
  if(['hunt-day','hunt-phase','hunt-minute','hunt-second','hunt-survivors'].includes(t.id)){
   screenAssist?.invalidateTime();
   const clamp=(value,max)=>Math.max(0,Math.min(max,Number(value)||0));
   const remaining=t.id==='hunt-phase'?erHuntPhases[(Number(root.querySelector('#hunt-day').value)-1)*2+(t.value==='night'?1:0)]:clamp(root.querySelector('#hunt-minute').value,9)*60+clamp(root.querySelector('#hunt-second').value,59);
   changeTime({day:root.querySelector('#hunt-day').value,phase:root.querySelector('#hunt-phase').value,remaining,survivors:root.querySelector('#hunt-survivors').value==='true'});return;
  }
  if(t.dataset.animalFilter){t.checked?active.add(t.dataset.animalFilter):active.delete(t.dataset.animalFilter);draw();}
  for(const field of ['count','cleared'])if(t.dataset[field]){const c=camps.find(c=>c.id===t.dataset[field]);if(c){c[field]=field==='cleared'?t.checked:Math.max(1,Math.min(10,Math.floor(Number(t.value)||1)));draw();}}
 });
 root.querySelector('#hunt-share').onclick=async()=>{
  const url=new URL(location.href);url.hash='hunt='+encodeURIComponent(JSON.stringify({version:3,clock:erHuntClockVersion,time,active:[...active],start:start?.region,point:start?{x:start.x,y:start.y}:null,blocked,route:route.map(c=>({id:c.id,count:c.count,variant:c.variant})),camps:camps.filter(c=>c.cleared||c.events.length||c.count!==c.defaultCount).map(c=>({id:c.id,count:c.count,variant:c.variant,cleared:c.cleared,events:c.events}))}));if(url.hash.length>=200000){info.textContent='공유 기록이 너무 깁니다. 필요 없는 캠프 기록을 지운 뒤 다시 공유하세요.';return;}history.replaceState(null,'',url);
  try{await navigator.clipboard.writeText(url.href);info.textContent='시간 설정과 동선을 함께 복사했습니다.';}catch(_){info.textContent='주소창의 링크를 복사해 공유하세요.';}
 };
 try{if(location.hash.startsWith('#hunt=')&&location.hash.length<200000){
  const saved=JSON.parse(decodeURIComponent(location.hash.slice(6)));if(saved.version>=3&&saved.clock!==erHuntClockVersion)throw new Error('clock version');time=erHuntTime(saved.time||{day:2,phase:'day',remaining:120,survivors:true});
  blocked=(Array.isArray(saved.blocked)?saved.blocked:[]).filter(n=>Object.hasOwn(erAnimalRegionIds,n));
  if(Array.isArray(saved.active))active=new Set(saved.active.filter(n=>Object.hasOwn(erAnimals,n)));
  const apply=r=>{const c=camps.find(c=>c.id===r?.id);return c?erHuntRestoreCamp(c,r,time,saved.version):null;};
  for(const c of (Array.isArray(saved.camps)?saved.camps:[]).slice(0,camps.length))apply(c);
  if(Object.hasOwn(erAnimalRegionIds,saved.start))chooseStart(saved.start);
  if(start&&Number.isFinite(saved.point?.x)&&Number.isFinite(saved.point?.y)&&saved.point.x>=0&&saved.point.x<=100&&saved.point.y>=0&&saved.point.y<=100){start.x=saved.point.x;start.y=saved.point.y;}
  for(const r of (Array.isArray(saved.route)?saved.route:[]).slice(0,20)){const c=camps.find(c=>c.id===r?.id);if(c){if(!saved.version)apply(r);if(isVisible(c)&&!route.includes(c))route.push(c);}}
 }}catch(_){info.textContent='공유 동선을 읽지 못했습니다. 링크 형식 또는 시간표 버전을 확인하세요.';}
 let zoom=1;
 const zoomMap=delta=>{zoom=Math.max(1,Math.min(2.5,zoom+delta));root.querySelector('.animal-map').style.width=(zoom*100)+'%';};
 root.querySelector('#hunt-zoom-in').onclick=()=>zoomMap(.25);root.querySelector('#hunt-zoom-out').onclick=()=>zoomMap(-.25);
 root.querySelector('#hunt-reset-camps').onclick=()=>{camps.forEach(c=>{c.events=[];c.timerObservations=[];});draw();};
 root.querySelector('.animal-map').addEventListener('click',e=>{
  if(screenAssist?.mapClick(e))return;
  if(e.target.closest('button'))return;
  const box=e.currentTarget.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*100,y=(e.clientY-box.top)/box.height*100;
  const region=Object.entries(erAnimalRegionIds).find(([,id])=>erPointInRegion(x*9.03,y*9.36,erRoutePolygons[id]))?.[0]||Object.keys(erAnimalRegionIds).sort((a,b)=>Math.hypot(x-erRoutePositions[a][0],y-erRoutePositions[a][1])-Math.hypot(x-erRoutePositions[b][0],y-erRoutePositions[b][1]))[0];
  chooseStart(region);start={region,x,y};info.textContent=region+' 근처 선택 위치에서 출발';draw();
 });
 screenAssist=typeof erStartScreenAssist==='function'?erStartScreenAssist(root,{
  getTime:()=>({...time}),onTime:changeTime,
  getCamps:()=>camps.filter(erHuntTimerSupported).map(c=>({id:c.id,count:c.count,label:c.region+' · '+(c.fixedVariant?'변이체 ':'')+erAnimals[c.type].name+' · '+c.id})),
  onTimer:o=>{const c=camps.find(c=>c.id===o.campId);if(c&&erHuntObserveTimer(c,{observedAt:o.observedAt,respawnAt:o.respawnAt})){draw();info.textContent=erAnimals[c.type].name+' 캠프 전체 처치와 재생성 타이머를 반영했습니다.';return true;}return false;},
  onPosition:p=>{
   const region=Object.entries(erAnimalRegionIds).find(([,id])=>erPointInRegion(p.x*9.03,p.y*9.36,erRoutePolygons[id]))?.[0];
   if(!region)return;
   start={region,x:p.x,y:p.y};root.querySelector('#hunt-start').value=region;draw();
  }
 }):null;
 syncClock();draw();
}
