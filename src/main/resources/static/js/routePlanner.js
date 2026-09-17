'use strict';
// Expand recipes with shared leftovers from multi-output crafts.
function erRouteMaterials(targets,catalog){
 const required=new Map(),surplus=new Map(),invalid=new Set();
 function visit(code,count,path){
  code=String(code);if(count<=0)return;
  if(path.has(code)||path.size>24){invalid.add(code);return;}
  const saved=Math.min(count,surplus.get(code)||0);count-=saved;surplus.set(code,(surplus.get(code)||0)-saved);if(!count)return;
  const row=catalog.get(code);if(!row){invalid.add(code);required.set(code,(required.get(code)||0)+count);return;}
  const parts=[row.makeMaterial1,row.makeMaterial2].filter(v=>Number(v)>0);
  if(!parts.length){required.set(code,(required.get(code)||0)+count);return;}
  const output=Math.max(1,Number(row.initialCount)||1),batches=Math.ceil(count/output);
  surplus.set(code,(surplus.get(code)||0)+batches*output-count);
  const next=new Set(path);next.add(code);parts.forEach(part=>visit(part,batches,next));
 }
 targets.filter(Boolean).forEach(code=>visit(code,1,new Set()));return {required,invalid};
}
function erRouteCoverage(required,route,areas){
 return [...required].map(([code,quantity])=>{let available=0,first=null;
  [...new Set(route)].forEach((id,index)=>{const supply=areas.find(a=>String(a.id)===String(id))?.items.find(i=>String(i.code)===String(code));if(supply){available+=Number(supply.quantity)||0;if(first===null&&available>=quantity)first=index+1;}});
  return {code,quantity,available,step:first,covered:available>=quantity};
 });
}
const erRoutePositions={'항구':[55.1876,85.2878],'창고':[39.7351,85.2878],'연못':[68.4327,46.9083],'개울':[79.4702,38.3795],'모래사장':[13.245,59.7015],'고급 주택가':[24.7241,72.4947],'골목길':[53.6424,12.7932],'주유소':[35.3201,12.7932],'호텔':[13.245,42.6439],'경찰서':[64.0177,25.5864],'소방서':[52.9801,34.1151],'병원':[88.3002,51.1727],'절':[83.8852,25.5864],'양궁장':[20.3091,23.4542],'묘지':[68.4327,59.7015],'숲':[40,55],'공장':[83.8852,76.7591],'성당':[56.7329,68.2303],'학교':[35.3201,32.8358],'바지선':[70.6402,89.5522]};
// Region outlines follow shared white divider chains from the displayed map; coordinates use a 903 x 936 viewBox.
const erRoutePolygons={"80":[[255,122],[332,68],[332,48],[352,33],[408,78],[370,106],[465,180],[398,229],[317,168]],"70":[[352,33],[408,3],[436,37],[465,15],[574,68],[636,108],[575,150],[561,139],[556,142],[535,127],[465,180],[370,106],[408,78]],"140":[[130,190],[199,127],[217,154],[255,122],[317,168],[263,209],[286,229],[205,292],[160,258],[151,264],[125,245]],"190":[[205,292],[286,229],[263,209],[317,168],[398,229],[440,263],[404,292],[440,322],[428,321],[407,337],[410,342],[387,360],[381,357],[365,369],[367,374],[341,394],[337,390],[332,395],[300,370]],"100":[[465,180],[535,127],[556,142],[561,139],[575,150],[627,191],[632,187],[667,211],[638,234],[668,256],[605,305],[588,294],[579,302],[556,282],[574,269],[557,258],[565,249],[518,215],[514,218]],"110":[[398,229],[465,180],[514,218],[518,215],[565,249],[557,258],[574,269],[556,282],[579,302],[552,322],[557,328],[494,378],[490,370],[486,371],[466,353],[460,355],[438,337],[441,332],[428,321],[440,322],[404,292],[440,263]],"130":[[575,150],[636,108],[686,147],[741,141],[798,187],[850,222],[870,266],[845,286],[836,322],[806,334],[716,264],[696,278],[668,256],[638,234],[667,211],[632,187],[627,191]],"40":[[605,305],[668,256],[696,278],[716,264],[806,334],[824,358],[832,360],[801,387],[782,374],[738,408],[747,417],[701,453],[643,402],[643,368],[662,351]],"90":[[75,219],[125,245],[151,264],[160,258],[205,292],[300,370],[192,455],[174,467],[142,440],[131,447],[119,438],[107,446],[54,406],[26,349],[45,316],[50,276],[75,256]],"50":[[54,406],[107,446],[119,438],[131,447],[142,440],[174,467],[192,455],[258,513],[148,598],[121,579],[79,550],[60,528],[40,520],[39,454]],"160":[[192,455],[300,370],[332,395],[318,407],[341,426],[345,422],[365,438],[364,444],[389,464],[395,463],[408,475],[402,481],[426,493],[467,518],[367,599],[258,513]],"30":[[494,378],[557,328],[552,322],[579,302],[588,294],[605,305],[662,351],[643,368],[643,402],[701,453],[651,495],[530,407]],"120":[[832,360],[899,413],[895,451],[864,469],[817,509],[800,565],[763,538],[745,557],[660,488],[651,495],[701,453],[747,417],[738,408],[782,374],[801,387]],"150":[[530,407],[651,495],[660,488],[745,557],[653,632],[570,565],[548,583],[467,518],[426,493],[450,475],[451,471],[478,450],[477,445],[497,429],[497,423]],"60":[[148,598],[258,513],[367,599],[420,628],[437,638],[386,678],[371,667],[297,728],[268,719],[217,689],[189,711],[159,685],[168,665],[148,638],[160,619]],"180":[[367,599],[467,518],[548,583],[570,565],[653,632],[585,689],[542,725],[522,708],[437,638],[420,628]],"170":[[745,557],[763,538],[800,565],[872,617],[871,633],[831,673],[850,690],[848,705],[824,725],[794,709],[785,723],[736,765],[714,764],[698,778],[638,732],[585,689],[653,632]],"20":[[297,728],[371,667],[386,678],[437,638],[522,708],[470,750],[464,747],[429,778],[422,772],[380,803],[399,822],[376,806],[349,814],[318,789],[301,773],[281,746]],"10":[[522,708],[542,725],[585,689],[638,732],[518,831],[499,832],[480,848],[461,837],[449,825],[435,817],[425,804],[411,793],[405,806],[399,803],[399,822],[380,803],[422,772],[429,778],[464,747],[470,750]],"200":[[638,732],[698,778],[725,807],[684,845],[684,845],[671,833],[667,861],[646,881],[622,890],[612,886],[607,869],[594,882],[598,892],[598,902],[556,933],[490,879],[495,871],[480,857],[480,848],[499,832],[518,831]]};
async function startRoutePlanner(){
 const root=erPageShell('루트 시뮬레이터','실험체와 장비를 선택하고, 재료·능력치·초반 동선을 함께 계획하세요.');root.className='route-planner';
 document.title='루트 시뮬레이터 · ER.GG';
 root.innerHTML='<section id="sim-character" class="surface"><label>실험체 <input id="sim-character-query" placeholder="실험체 검색" aria-label="시뮬레이터 실험체 검색"></label><div id="sim-characters"></div></section><div class="planner-toolbar"><button id="planner-equipment-open" disabled>장비 선택</button><button id="planner-reset">전체 초기화</button><button id="sim-share">공유 링크 복사</button><label>장비 구성 <select id="sim-phase"><option value="early">초반 아이템</option><option value="late">후반 빌드 1</option><option value="late2">후반 빌드 2</option><option value="late3">후반 빌드 3</option></select></label><span id="planner-progress" role="status" aria-live="polite">지도 데이터를 불러오고 있습니다.</span></div><form id="sim-import" class="sim-route-controls"><label>루트 번호 <input id="sim-route-id" inputmode="numeric" pattern="[0-9]+" placeholder="예: 35176" required></label><button type="submit">루트 불러오기</button><span id="sim-import-status" role="status"></span></form><div id="planner-build"></div><section id="sim-settings" class="surface"><label>전술 스킬 <select id="sim-tactical"><option value="">선택 안 함</option></select></label><label>핵심 특성 <select id="sim-trait"><option value="">선택 안 함</option></select></label><label>실험체 레벨 <input id="sim-level" type="number" min="1" max="20" value="1" aria-label="실험체 레벨"></label><div id="sim-subtraits"></div></section><section class="surface" id="sim-stats"></section><div class="planner-body"><section class="planner-map-panel surface"><div class="planner-map"><img class="planner-map-image" src="https://cdn.dak.gg/er/images/routes/map_v2.png?q=20260430" alt="루미아 섬 지도"><svg class="planner-areas" viewBox="0 0 903 936" preserveAspectRatio="none" aria-label="지역 선택 지도"></svg><svg class="planner-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg><div id="planner-regions"></div></div><p class="planner-map-note">지역에 마우스를 올려 재료 확인 · 클릭하면 방문 순서 추가/취소 · 모바일은 터치로 선택</p><div class="sim-route-controls"><label>시작 지역 <select id="sim-start"><option value="">자동 선택</option></select></label><button id="sim-recommend">재료 기준 동선 추천</button></div><ol id="planner-route" aria-label="선택한 방문 순서"></ol><button id="planner-route-clear" hidden>방문 지역만 초기화</button></section><aside class="planner-sidebar" hidden><section id="planner-materials" class="surface" hidden></section><section id="planner-area" class="surface" aria-label="지역 재료"></section></aside></div><p class="data-note">체크는 선택한 지역에서 획득 가능한 재료를 뜻합니다. 실제 획득 여부와 경쟁자에 의한 소진은 반영하지 않습니다. 지도: DAK.GG · 재료: 공식 게임 데이터</p><dialog id="planner-picker" aria-labelledby="planner-picker-title"><div class="planner-dialog-heading"><h2 id="planner-picker-title">목표 장비 선택</h2><button id="planner-picker-close" aria-label="장비 선택 닫기">닫기</button></div><div id="planner-slots" role="group" aria-label="장비 부위"></div><div class="planner-picker-filters"><input id="planner-query" aria-label="장비 이름 검색" placeholder="장비 이름 검색"><select id="planner-weapon" aria-label="무기군"><option value="">모든 무기군</option></select><select id="planner-grade" aria-label="장비 등급"><option value="">모든 등급</option>'+Object.entries(erGradeNames).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div><div id="planner-choices"></div><button id="planner-more">더 보기</button></dialog>';
 const status=document.querySelector('#explorer-status');status.textContent='지역과 제작 정보를 확인하는 중입니다.';
 const optionalMetadata=Promise.allSettled([erStatic('/er/tacticalSkill'),erStatic('/er/trait'),erStatic('/er/route-data/CharacterMastery'),erStatic('/er/route-data/CharacterLevelUpStat'),erStatic('/static/data/credit-shop.json?v=20260911')]);
 void loadAssetConfig();
 const [weapons,armor,misc,names,areaBody,spawnBody,gatherBody,collectBody,consumables,special,characters]=await Promise.all([erStatic('/er/weapon'),erStatic('/er/armor'),erStatic('/er/materials'),erDictionary(),erStatic('/er/route-data/Area'),erStatic('/er/route-data/ItemSpawn'),erStatic('/er/route-data/NaviCollectAndHunt'),erStatic('/er/route-data/Collectible'),erStatic('/er/route-data/ItemConsumable'),erStatic('/er/route-data/ItemSpecial'),erStatic('/er/character')]);
 let tacticals={data:[]},traits={data:[]},masteries={data:[]},growth={data:[]},shop={data:[]},pendingTraits=[];
 const catalog=new Map([weapons,armor,misc,consumables,special].flatMap(b=>b.data||[]).map(r=>[String(r.code),r]));
 const areas=erRouteAreas(areaBody.data,spawnBody.data,gatherBody.data,collectBody.data,names);
 if(!areas.length)throw new Error('지역별 재료 데이터가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
 const slots=[['Weapon','무기'],['Chest','옷'],['Head','머리'],['Arm','팔'],['Leg','다리']];
 const equipment=[...(weapons.data||[]),...(armor.data||[])].filter(r=>r.showInItemBook!==false);
 let phase='early',selectedCharacter=null;const builds={early:new Map(),late:new Map(),late2:new Map(),late3:new Map()};let selected=builds.early;let route=[],hover=null,slot='Weapon',limit=60;
 const name=code=>names.get('Item/Name/'+code)||catalog.get(String(code))?.name||'아이템 '+code;
 const icon=code=>erItemHtml(code);
 const picker=root.querySelector('#planner-picker');
 root.querySelector('#planner-weapon').insertAdjacentHTML('beforeend',[...new Set((weapons.data||[]).map(r=>r.weaponType).filter(Boolean))].map(t=>'<option value="'+erText(t)+'">'+erText(erEquipmentTypes[t]||t)+'</option>').join(''));
 function itemChip(r){return '<div class="planner-material '+(r.covered?'is-covered':'')+'">'+icon(r.code)+'<div><strong>'+erText(name(r.code))+'</strong><small>필요 '+r.quantity+'개'+(r.covered?' · ✓ '+r.step+'지역 확보':r.available?' · '+r.available+'개 확보 가능':'')+'</small></div></div>';}
 function drawArea(){const panel=root.querySelector('#planner-area'),area=areas.find(a=>a.id===hover);root.querySelector('.planner-sidebar').hidden=!area&&!selected.size;if(!area){panel.hidden=true;return;}panel.hidden=false;const needed=erRouteMaterials([...selected.values()],catalog).required;
  panel.innerHTML='<h2>'+erText(area.name)+'</h2><p>이 지역에서 얻을 수 있는 재료</p><div class="planner-area-items">'+area.items.map(r=>'<div class="'+(needed.has(String(r.code))?'is-needed':'')+'">'+icon(r.code)+'<span>'+erText(name(r.code))+'</span><small>'+ (r.quantity===Infinity?'채집·사냥':r.quantity+'개') +(needed.has(String(r.code))?' · 필요':'')+'</small></div>').join('')+'</div>';erApplyItemGrades(panel,catalog);
 }
 function draw(){
  const result=erRouteMaterials([...selected.values()],catalog),coverage=erRouteCoverage(result.required,route,areas),done=coverage.filter(r=>r.covered).length;
  root.querySelector('#planner-progress').textContent=!selected.size?'장비 없이도 지역별 재료를 둘러볼 수 있습니다.':result.invalid.size?'일부 제작식이 없어 완성 여부를 계산할 수 없습니다.':done===coverage.length?'선택한 '+route.length+'개 지역으로 일반 재료 확보 가능':'재료 '+done+' / '+coverage.length+'종 확보 가능 · '+route.length+'개 지역 선택';
  const build=root.querySelector('#planner-build');build.hidden=false;build.innerHTML=slots.map(([key,label])=>'<button data-edit-slot="'+key+'">'+(selected.has(key)?icon(selected.get(key)):'<span class="planner-empty-slot">＋</span>')+'<span>'+label+'</span><strong>'+erText(selected.has(key)?name(selected.get(key)):'장비 선택')+'</strong></button>').join('');
  root.querySelector('.planner-areas').innerHTML=areas.map(a=>'<polygon data-region="'+a.id+'" points="'+erRoutePolygons[a.id].map(p=>p.join(',')).join(' ')+'" class="planner-area-shape '+(route.includes(a.id)?'is-selected':'')+'" aria-hidden="true"><title>'+erText(a.name)+'</title></polygon>').join('');
  root.querySelector('#planner-regions').innerHTML=areas.map(a=>{const point=erRoutePositions[a.name],order=route.indexOf(a.id);const items=selected.size?a.items.filter(i=>result.required.has(String(i.code))):[];return '<div class="planner-region-wrap" style="left:'+point[0]+'%;top:'+point[1]+'%"><button class="planner-region '+(order>=0?'is-selected':'')+'" data-region="'+erText(a.id)+'" aria-pressed="'+(order>=0)+'" aria-label="'+erText(a.name)+(order>=0?' · '+(order+1)+'번째 방문':' · 방문 추가')+'">'+(order>=0?'<b>'+(order+1)+'</b>':'')+erText(a.name)+'</button>'+(items.length?'<div class="planner-region-loot" aria-hidden="true" inert>'+items.slice(0,4).map(i=>icon(i.code)).join('')+(items.length>4?'<small>+'+(items.length-4)+'</small>':'')+'</div>':'')+'</div>';}).join('');
  root.querySelector('.planner-lines').innerHTML='<polyline points="'+route.map(id=>erRoutePositions[areas.find(a=>a.id===id).name].map(v=>v*10).join(',')).join(' ')+'"/>';
  root.querySelector('#planner-route').innerHTML=route.map((id,i)=>'<li><span>'+(i+1)+'</span>'+erText(areas.find(a=>a.id===id).name)+'<button data-remove-region="'+erText(id)+'" aria-label="'+erText(areas.find(a=>a.id===id).name)+' 방문 취소">×</button></li>').join('');root.querySelector('#planner-route-clear').hidden=!route.length;
  const mat=root.querySelector('#planner-materials');mat.hidden=!selected.size;mat.innerHTML='<h2>필요 재료 <small>'+done+'/'+coverage.length+'</small></h2><div class="planner-material-grid">'+coverage.map(itemChip).join('')+'</div>'+(result.invalid.size?'<p class="data-note">일부 제작식 미제공: '+[...result.invalid].map(c=>erText(name(c))).join(', ')+'</p>':'')+'<p class="data-note">지역 정보가 없는 특수 재료는 출현 조건 확인이나 전송 등으로 별도 획득해야 합니다. 채집·사냥 재료는 반복 획득을 기준으로 계산합니다.</p>';
  drawArea();drawStats();erApplyItemGrades(root,catalog);
 }
 function drawChoices(){
  root.querySelector('#planner-slots').innerHTML=slots.map(([key,label])=>'<button data-slot="'+key+'" aria-pressed="'+(slot===key)+'">'+label+(selected.has(key)?' ✓':'')+'</button>').join('');
  root.querySelector('#planner-slots').insertAdjacentHTML('beforeend','<button class="planner-remove-equipment" data-unset="'+slot+'" '+(selected.has(slot)?'':'disabled')+'>이 부위 비우기</button>');
  const q=root.querySelector('#planner-query').value.trim().toLowerCase(),type=root.querySelector('#planner-weapon').value,grade=root.querySelector('#planner-grade').value;
  root.querySelector('#planner-weapon').hidden=slot!=='Weapon';
  const allowed=erAllowedWeapons(selectedCharacter?.code,masteries.data);
  const rows=equipment.filter(r=>(slot==='Weapon'?!!r.weaponType&&(!allowed.length||allowed.includes(r.weaponType)):r.armorType===slot)&&(!type||slot!=='Weapon'||r.weaponType===type)&&(!grade||r.itemGrade===grade)&&name(r.code).toLowerCase().includes(q));
  const grades=['Epic','Legend','Mythic','Rare','Uncommon','Common'];
  const groups=grades.map(g=>({grade:g,items:rows.filter(r=>r.itemGrade===g).sort((a,b)=>name(a.code).localeCompare(name(b.code),'ko'))})).filter(g=>g.items.length);
  root.querySelector('#planner-choices').innerHTML=groups.map(g=>'<section class="planner-grade-group" data-grade="'+g.grade+'"><h3>'+erText(erGradeNames[g.grade])+' <small>'+g.items.length+'개</small></h3><div class="planner-grade-items">'+g.items.slice(0,limit).map(r=>'<button data-equipment="'+r.code+'" aria-pressed="'+(String(selected.get(slot))===String(r.code))+'">'+icon(r.code)+'<span>'+erText(name(r.code))+'</span></button>').join('')+'</div></section>').join('')+(rows.length?'':'<p class="empty-state">일치하는 장비가 없습니다.</p>');root.querySelector('#planner-more').hidden=!groups.some(g=>g.items.length>limit);erApplyItemGrades(picker,catalog);
 }
 root.querySelector('#planner-equipment-open').onclick=()=>{drawChoices();picker.showModal();};root.querySelector('#planner-picker-close').onclick=()=>picker.close();picker.addEventListener('close',erHideItemTooltip);
 root.querySelector('#planner-reset').onclick=()=>{Object.values(builds).forEach(b=>b.clear());selectedCharacter=null;pendingTraits=[];root.querySelector('#sim-tactical').value='';root.querySelector('#sim-trait').value='';root.querySelector('#sim-start').value='';root.querySelector('#planner-weapon').value='';root.querySelector('#sim-subtraits').innerHTML='';route=[];hover=null;history.replaceState(null,'',location.pathname);drawCharacters();draw();};root.querySelector('#planner-route-clear').onclick=()=>{route=[];draw();};
 root.querySelector('#planner-more').onclick=()=>{limit+=60;drawChoices();};root.querySelectorAll('.planner-picker-filters input,.planner-picker-filters select').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{limit=60;drawChoices();}));
 root.addEventListener('click',e=>{const b=e.target.closest('[data-region],button');if(!b)return;
  if(b.dataset.region){const id=b.dataset.region;route=route.includes(id)?route.filter(v=>v!==id):[...route,id];hover=id;draw();root.querySelector('button[data-region="'+id+'"]')?.focus({preventScroll:true});}
  if(b.dataset.removeRegion){route=route.filter(v=>v!==b.dataset.removeRegion);draw();}
  if(b.dataset.editSlot){slot=b.dataset.editSlot;drawChoices();picker.showModal();}
  if(b.dataset.slot){slot=b.dataset.slot;limit=60;drawChoices();}
  if(b.dataset.equipment){selected.set(slot,b.dataset.equipment);draw();drawChoices();}
  if(b.dataset.unset){selected.delete(b.dataset.unset);draw();drawChoices();}
 });
 const preview=e=>{const b=e.target.closest('[data-region]');if(!b)return;hover=b.dataset.region;root.querySelectorAll('[data-region]').forEach(el=>el.classList.toggle('is-hovered',el.dataset.region===hover));drawArea();};root.addEventListener('pointerover',preview);root.addEventListener('focusin',preview);root.querySelector('.planner-map').addEventListener('pointerout',e=>{if(!e.relatedTarget?.closest?.('[data-region]'))root.querySelectorAll('.is-hovered').forEach(el=>el.classList.remove('is-hovered'));});root.querySelector('.planner-map').addEventListener('pointerleave',()=>root.querySelectorAll('.is-hovered').forEach(el=>el.classList.remove('is-hovered')));
 root.querySelector('#planner-equipment-open').disabled=false;

 const characterName=c=>names.get('Character/Name/'+c.code)||c.name;
 function drawCharacters(){const q=root.querySelector('#sim-character-query').value.trim().toLowerCase();root.querySelector('#sim-characters').innerHTML=(characters.data||[]).filter(c=>(characterName(c)+' '+c.name).toLowerCase().includes(q)).sort((a,b)=>characterName(a).localeCompare(characterName(b),'ko')).map(c=>'<button data-sim-character="'+c.code+'" aria-pressed="'+(String(selectedCharacter?.code)===String(c.code))+'"><img loading="lazy" src="'+erText(erCharacterImage(c.name))+'" alt=""><span>'+erText(characterName(c))+'</span></button>').join('');}
 function drawStats(){
  const level=Math.max(1,Math.min(20,Number(root.querySelector('#sim-level').value)||1));
  const totals=erBuildStats([...selected.values()],catalog),increase=(growth.data||[]).find(r=>String(r.code)===String(selectedCharacter?.code));
  const missing=erRouteCoverage(erRouteMaterials([...selected.values()],catalog).required,route,areas).filter(r=>!r.covered);
  const costs=erRoutePurchaseCosts(missing,shop.data),known=costs.filter(r=>r.cost!==null);
  const labels={...erBaseStats,attackSpeedRatio:'공격 속도 증가',penetrationDefense:'방어 관통',penetrationDefenseRatio:'방어 관통 비율',lifeSteal:'흡혈'};
  root.querySelector('#sim-stats').innerHTML='<h2>'+ (phase==='early'?'초반':'후반')+' 장비 능력치</h2><div class="sim-stat-grid">'+Object.entries(labels).map(([key,label])=>{const stat=erSimulatorStatValue(key,totals[key]);return '<div><span>'+label+'</span><strong>'+erNumber(stat.value,2)+stat.unit+'</strong></div>';}).join('')+'</div>'+ (selectedCharacter?'<h3>'+erText(characterName(selectedCharacter))+' Lv. '+level+' 기본 능력치</h3><div class="sim-stat-grid">'+['maxHp','attackPower','defense','moveSpeed','hpRegen'].map(key=>'<div><span>'+labels[key]+'</span><strong>'+erNumber(Number(selectedCharacter[key]||0)+Number(increase?.[key]||0)*(level-1),2)+'</strong></div>').join('')+'</div>':'')+'<p class="data-note">실험체 기본 수치와 장비 합계를 각각 표시합니다. 무기 숙련도·고유 효과·레벨 비례 장비 효과는 합산하지 않습니다.'+(level>1&&!increase?' 성장 데이터를 기다리는 동안 레벨 1 기본 수치를 표시합니다.':'')+'</p>'+(missing.length?'<h3>부족 재료 구매</h3><div>'+costs.map(r=>'<span>'+erText(name(r.code))+' ×'+r.count+' · '+(r.cost===null?'가격 미제공':erNumber(r.cost)+' 크레딧')+'</span>').join('<br>')+'</div><p>확인된 구매 비용 '+erNumber(known.reduce((sum,r)=>sum+r.cost,0))+' 크레딧'+(known.length<costs.length?' · 가격 미제공 재료 별도':'')+'</p><p class="data-note">2026-09-11 게임 데이터의 기본 구매 가격이며, 등장 시점·키오스크/드론 조건·특성 할인은 구매 전에 확인하세요.</p>':'');
 }
 root.querySelector('#sim-level').oninput=drawStats;
 root.querySelector('#sim-character-query').oninput=drawCharacters;
 root.querySelector('#sim-characters').onclick=e=>{const b=e.target.closest('[data-sim-character]');if(!b)return;selectedCharacter=(characters.data||[]).find(c=>String(c.code)===b.dataset.simCharacter);validateWeapons();drawCharacters();draw();};
 function validateWeapons(){
  const allowed=erAllowedWeapons(selectedCharacter?.code,masteries.data);
  for(const build of Object.values(builds))if(allowed.length&&build.has('Weapon')&&!allowed.includes(catalog.get(String(build.get('Weapon')))?.weaponType))build.delete('Weapon');
  const filter=root.querySelector('#planner-weapon');for(const option of filter.options)option.hidden=!!option.value&&allowed.length>0&&!allowed.includes(option.value);filter.value='';
 }
 const traitName=r=>names.get('Trait/Name/'+r.code)||names.get('Skill/Group/Name/'+(Number(r.code)-1))||r.name||r.code;
 function drawSubtraits(saved=[]){
  const core=(traits.data||[]).find(r=>String(r.code)===root.querySelector('#sim-trait').value),target=root.querySelector('#sim-subtraits');
  if(!core){target.innerHTML='';return;}
  const groups=[...new Set((traits.data||[]).filter(r=>erIsStandardTrait(r)&&r.traitGroup!==core.traitGroup).map(r=>r.traitGroup))];
  const oldGroup=target.querySelector('#sim-subgroup')?.value;
  const savedGroup=(traits.data||[]).find(r=>saved.includes(String(r.code))&&r.traitGroup!==core.traitGroup)?.traitGroup;
  const group=groups.includes(savedGroup)?savedGroup:groups.includes(oldGroup)?oldGroup:groups[0];
  target.innerHTML='<label>보조 특성 계열 <select id="sim-subgroup">'+groups.map(g=>'<option value="'+erText(g)+'" '+(g===group?'selected':'')+'>'+erText({Havoc:'파괴',Fortification:'저항',Support:'지원',Chaos:'혼돈'}[g]||g)+'</option>').join('')+'</select></label>'+[core.traitGroup,group].flatMap(g=>['Sub1','Sub2'].map(type=>'<label>'+erText(g===core.traitGroup?'주 특성':'보조 특성')+' '+type.slice(-1)+'<select data-sim-subtrait><option value="">선택 안 함</option>'+(traits.data||[]).filter(r=>erIsStandardTrait(r)&&r.traitGroup===g&&r.traitType===type).map(r=>'<option value="'+r.code+'" '+(saved.includes(String(r.code))?'selected':'')+'>'+erText(traitName(r))+'</option>').join('')+'</select></label>')).join('');
  target.querySelector('#sim-subgroup').onchange=()=>drawSubtraits([...target.querySelectorAll('[data-sim-subtrait]')].slice(0,2).map(e=>e.value));
 }
 root.querySelector('#sim-trait').onchange=()=>drawSubtraits();
 optionalMetadata.then(values=>{
  [tacticals,traits,masteries,growth,shop]=values.map(v=>v.status==='fulfilled'?v.value:{data:[]});
  const tactical=root.querySelector('#sim-tactical'),trait=root.querySelector('#sim-trait');
  tactical.insertAdjacentHTML('beforeend',(tacticals.data||[]).filter(row=>erIsAvailableTactical(row)).map(r=>'<option value="'+erText(r.group)+'">'+erText(names.get('Skill/Group/Name/'+String(r.icon||'').match(/(\d+)$/)?.[1])||r.name||r.group)+'</option>').join(''));
  trait.insertAdjacentHTML('beforeend',(traits.data||[]).filter(r=>erIsStandardTrait(r)&&r.traitType==='Core').map(r=>'<option value="'+r.code+'">'+erText(traitName(r))+'</option>').join(''));
  tactical.value=tactical.dataset.pending||'';trait.value=trait.dataset.pending||'';drawSubtraits(pendingTraits);validateWeapons();draw();
  if(values.some(v=>v.status==='rejected'))root.querySelector('#sim-import-status').textContent='일부 특성·무기 제한 정보를 불러오지 못했습니다. 장비와 지도는 사용할 수 있습니다.';
 });
 function applyRoute(raw){
  const result=erDecodeRoute(raw,catalog,areas);
  if(!result.early.size)throw new Error('이 루트의 장비 데이터가 없습니다.');
  for(const key of Object.keys(builds)){builds[key].clear();for(const [slot,code] of result[key]||[])builds[key].set(slot,code);}
  selectedCharacter=(characters.data||[]).find(c=>String(c.code)===String(raw.characterCode));route=result.route;phase='early';selected=builds.early;root.querySelector('#sim-phase').value=phase;
  const tactical=root.querySelector('#sim-tactical'),trait=root.querySelector('#sim-trait');tactical.dataset.pending=String(raw.tacticalSkillGroupCode||'');tactical.value=tactical.dataset.pending;
  pendingTraits=result.traits;trait.dataset.pending=pendingTraits[0]||'';trait.value=trait.dataset.pending;drawSubtraits(pendingTraits);validateWeapons();drawCharacters();draw();
 }
 async function importRoute(id){
  const output=root.querySelector('#sim-import-status'),button=root.querySelector('#sim-import button');if(!/^[1-9]\d{0,9}$/.test(id)){output.textContent='올바른 루트 번호를 입력하세요.';return;}
  button.disabled=true;output.textContent='루트를 불러오는 중입니다.';
  try{const body=await erRequest('/er/route/'+id);const raw=(body.result||[]).map(v=>v.recommendWeaponRoute).find(r=>String(r?.id)===id);if(!raw)throw new Error('공개된 루트를 찾지 못했습니다.');applyRoute(raw);output.textContent='#'+id+' '+raw.title+' 불러옴';}catch(e){output.textContent=e.message;}finally{button.disabled=false;}
 }
 root.querySelector('#sim-import').onsubmit=e=>{e.preventDefault();void importRoute(root.querySelector('#sim-route-id').value.trim());};
 root.querySelector('#sim-phase').onchange=e=>{phase=e.target.value;selected=builds[phase];draw();};
 root.querySelector('#sim-start').insertAdjacentHTML('beforeend',areas.map(a=>'<option value="'+a.id+'">'+erText(a.name)+'</option>').join(''));
 root.querySelector('#sim-recommend').onclick=()=>{const required=erRouteMaterials([...selected.values()],catalog).required;if(!required.size){root.querySelector('#planner-progress').textContent='먼저 목표 장비를 선택해 주세요.';return;}route=erRecommendRegions(required,areas,root.querySelector('#sim-start').value);draw();};
 root.querySelector('#sim-share').onclick=async()=>{const state={v:1,character:selectedCharacter?.code||null,early:[...builds.early],late:[...builds.late],late2:[...builds.late2],late3:[...builds.late3],subtraits:[...root.querySelectorAll('[data-sim-subtrait]')].map(e=>e.value),route,tactical:root.querySelector('#sim-tactical').value,trait:root.querySelector('#sim-trait').value};const url=new URL(location.href);url.hash='build='+encodeURIComponent(JSON.stringify(state));history.replaceState(null,'',url);try{await navigator.clipboard.writeText(url.href);root.querySelector('#planner-progress').textContent='공유 링크를 복사했습니다.';}catch(_){root.querySelector('#planner-progress').textContent='주소창의 링크를 복사해 공유하세요.';}};
 try{if(location.hash.startsWith('#build=')&&location.hash.length<6000){const saved=JSON.parse(decodeURIComponent(location.hash.slice(7)));if(saved.v===1){for(const key of Object.keys(builds))for(const [part,code] of Array.isArray(saved[key])?saved[key]:[]){const item=catalog.get(String(code));if(slots.some(([k])=>k===part)&&item&&(part==='Weapon'?item.weaponType:item.armorType===part))builds[key].set(part,String(code));}route=[...new Set(Array.isArray(saved.route)?saved.route:[])].map(String).filter(id=>areas.some(a=>a.id===id)).slice(0,20);selectedCharacter=(characters.data||[]).find(c=>c.code===saved.character);root.querySelector('#sim-tactical').dataset.pending=String(saved.tactical||'');root.querySelector('#sim-trait').dataset.pending=String(saved.trait||'');pendingTraits=Array.isArray(saved.subtraits)?saved.subtraits.map(String):[];}}}catch(_){root.querySelector('#planner-progress').textContent='공유 구성을 읽지 못했습니다.';}
 status.textContent=areas.length+'개 지역 · 장비 '+equipment.length+'개';drawCharacters();draw();
 const routeId=new URLSearchParams(location.search).get('routeId');if(routeId){root.querySelector('#sim-route-id').value=routeId;void importRoute(routeId);}
}
const erRouteAreaNames={Harbor:'항구',Warehouse:'창고',Pond:'연못',Stream:'개울',SandyBeach:'모래사장',Uptown:'고급 주택가',Alley:'골목길',GasStation:'주유소',Hotel:'호텔',PoliceStation:'경찰서',FireStation:'소방서',Hospital:'병원',Temple:'절',Archery:'양궁장',Cemetery:'묘지',Forest:'숲',Factory:'공장',Church:'성당',School:'학교',Barge:'바지선'};
function erRouteAreas(areaRows,spawns,gathering,collectibles,names){
 const areas=(areaRows||[]).filter(a=>a.areaType==='Lumia'&&a.startingArea&&String(a.modeType).split(',').includes('3')).map(a=>({id:String(a.code),name:erRouteAreaNames[a.name],items:[]})).filter(a=>erRoutePositions[a.name]);
 for(const area of areas){const items=new Map();
  for(const row of spawns||[]){if(String(row.areaCode)!==area.id||!(Number(row.dropCount)>0)||!(Number(row.itemCode)>0))continue;const code=String(row.itemCode);items.set(code,(items.get(code)||0)+Number(row.dropCount));}
  // Official navigation table lists gathering and hunting locations, not finite box stock.
  for(const row of gathering||[]){if(!String(row.areaCodeList||'').split(',').includes(area.id)||!(Number(row.itemCode)>0))continue;items.set(String(row.itemCode),Infinity);}
  area.items=[...items].map(([code,quantity])=>({code,quantity}));
 }
 return areas;
}

function erBuildStats(codes,catalog){const sums={};for(const code of codes){const row=catalog.get(String(code));if(!row)continue;for(const [key,value] of Object.entries(row))if(typeof value==='number'&&Number.isFinite(value))sums[key]=(sums[key]||0)+value;}return sums;}
// Bounded beam search: prioritize coverage, then fewer regions and shorter straight-line links.
function erRecommendRegions(required,areas,start=''){
 const eligible=areas.filter(a=>a.items.some(i=>required.has(String(i.code)))||a.id===start);let beam=[{route:start?[start]:[],score:0,distance:0}];let best=beam[0];
 const evaluate=path=>{const coverage=erRouteCoverage(required,path,areas);return coverage.reduce((sum,r)=>sum+Math.min(1,r.available/r.quantity),0);};
 beam[0].score=evaluate(beam[0].route);if(beam[0].score>=required.size)return beam[0].route;
 for(let depth=0;depth<6;depth++){
  const candidates=[];for(const state of beam){for(const area of eligible){if(state.route.includes(area.id))continue;const route=[...state.route,area.id],score=evaluate(route);if(score<=state.score&&state.route.length)continue;const previous=areas.find(a=>a.id===state.route.at(-1));const a=erRoutePositions[area.name],b=previous&&erRoutePositions[previous.name];const distance=state.distance+(a&&b?Math.hypot(a[0]-b[0],a[1]-b[1]):0);candidates.push({route,score,distance});}}
  candidates.sort((a,b)=>b.score-a.score||a.route.length-b.route.length||a.distance-b.distance);if(!candidates.length)break;beam=candidates.slice(0,80);if(beam[0].score>best.score||beam[0].score===best.score&&beam[0].route.length<best.route.length)best=beam[0];if(best.score>=required.size)break;
 }
 return best.route;
}

function erAllowedWeapons(characterCode,rows){
 const row=(rows||[]).find(r=>String(r.code)===String(characterCode));
 return row?['weapon1','weapon2','weapon3','weapon4'].map(k=>row[k]).filter(v=>v&&v!=='None'):[];
}
function erDecodeRoute(raw,catalog,areas){
 const parse=(value,fallback)=>{try{return typeof value==='string'?JSON.parse(value):value||fallback;}catch(_){return fallback;}};
 const build=codes=>{const map=new Map();for(const code of Array.isArray(codes)?codes:[]){const item=catalog.get(String(code));const slot=item?.weaponType?'Weapon':item?.armorType;if(['Weapon','Chest','Head','Arm','Leg'].includes(slot))map.set(slot,String(code));}return map;};
 const late=parse(raw.lateGameItemCodes,{});
 return {early:build(parse(raw.weaponCodes,[])),late:build(late['0']),late2:new Map(),late3:new Map(),route:[...new Set(parse(raw.paths,[]).map(String))].filter(id=>areas.some(a=>a.id===id)),traits:parse(raw.traitCodes,[]).map(String)};
}

function erRoutePurchaseCosts(missing,rows){
 return missing.map(item=>{const count=Math.max(0,item.quantity-(Number.isFinite(item.available)?item.available:0));const offers=(rows||[]).filter(r=>String(r.itemCode)===String(item.code)&&String(r.mode).split(',').includes('3')&&Number.isFinite(Number(r.consumeVFCredit))&&Number(r.consumeVFCredit)>=0&&Number(r.purchaseCount)>0);const price=offers.length?Math.min(...offers.map(r=>Math.ceil(count/Number(r.purchaseCount))*Number(r.consumeVFCredit))):null;return {code:item.code,count,cost:price};});
}

// Official cooldownReduction is already a percentage; ratio fields are fractions.
function erSimulatorStatValue(key,value){const percent=/Ratio$|Chance$|Reduction$/.test(key)||key==='lifeSteal';return {value:Number(value||0)*(percent&&key!=='cooldownReduction'?100:1),unit:percent?'%':''};}
