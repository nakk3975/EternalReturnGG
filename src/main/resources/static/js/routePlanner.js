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
// Region outlines traced from the displayed map; coordinates use a 903 x 936 viewBox.
const erRoutePolygons={"80":[[255,122],[332,68],[332,48],[352,33],[407,78],[367,108],[443,170],[404,221]],"70":[[352,33],[408,3],[436,37],[465,15],[574,68],[636,108],[575,153],[537,128],[443,170],[367,108],[407,78]],"140":[[130,190],[199,127],[217,154],[255,122],[317,170],[263,208],[287,230],[201,292],[152,257],[125,245]],"190":[[201,292],[287,230],[263,208],[317,170],[404,221],[438,262],[402,291],[426,320],[365,363],[365,377],[327,393],[302,380]],"100":[[404,221],[443,170],[537,128],[575,153],[637,191],[573,245],[556,266],[576,283],[555,303],[505,262],[483,247]],"110":[[404,221],[483,247],[505,262],[555,303],[559,322],[492,376],[449,337],[426,320],[402,291],[438,262]],"130":[[637,191],[575,153],[636,108],[686,147],[741,141],[798,187],[850,222],[870,266],[845,286],[836,322],[812,333],[713,264],[692,282]],"40":[[573,245],[637,191],[692,282],[713,264],[812,333],[824,358],[793,383],[782,375],[738,406],[749,418],[643,405],[643,373],[669,351],[587,293],[555,303],[576,283],[556,266]],"90":[[75,219],[125,245],[152,257],[201,292],[302,380],[173,465],[142,440],[109,448],[54,406],[26,349],[45,316],[50,276],[75,256]],"50":[[54,406],[109,448],[142,440],[173,465],[189,456],[258,512],[148,598],[121,579],[79,550],[60,528],[40,520],[39,454]],"160":[[302,380],[327,393],[318,407],[426,493],[465,518],[366,601],[258,512],[189,456],[173,465]],"30":[[492,376],[559,322],[555,303],[587,293],[669,351],[643,373],[643,405],[749,418],[649,495],[561,475],[530,444],[530,414]],"120":[[824,358],[899,413],[895,451],[864,469],[817,509],[786,545],[758,566],[649,495],[749,418],[738,406],[782,375],[793,383]],"150":[[426,493],[530,414],[530,444],[561,475],[649,495],[758,566],[647,660],[619,636],[570,600],[546,581],[465,518]],"60":[[148,598],[258,512],[366,601],[399,630],[365,666],[302,715],[268,719],[217,689],[189,711],[159,685],[168,665],[148,638],[160,619]],"180":[[366,601],[465,518],[546,581],[570,600],[619,636],[647,660],[589,688],[541,725],[465,664],[399,630]],"170":[[758,566],[794,544],[872,617],[871,635],[831,673],[850,690],[824,725],[790,708],[747,749],[708,765],[640,711],[589,688],[647,660]],"20":[[302,715],[365,666],[399,630],[465,664],[465,703],[501,738],[432,790],[399,822],[376,806],[349,814],[318,789],[301,773],[281,746]],"10":[[465,664],[541,725],[589,688],[640,711],[640,741],[562,806],[517,840],[480,821],[466,793],[432,790],[501,738],[465,703]],"200":[[640,741],[708,788],[725,807],[682,846],[672,868],[622,892],[599,885],[597,909],[556,933],[518,901],[490,870],[517,840],[562,806]]};
async function startRoutePlanner(){
 const root=erPageShell('루트 만들기','장비의 재료를 확인하고, 지도에서 방문할 지역을 순서대로 선택하세요.');root.className='route-planner';
 document.title='루트 만들기 · ER.GG';
 root.innerHTML='<div class="planner-toolbar"><button id="planner-equipment-open" disabled>장비 선택</button><button id="planner-reset">전체 초기화</button><span id="planner-progress" role="status" aria-live="polite">지도 데이터를 불러오고 있습니다.</span></div><div id="planner-build" hidden></div><div class="planner-body"><section class="planner-map-panel surface"><div class="planner-map"><img class="planner-map-image" src="https://cdn.dak.gg/er/images/routes/map_v2.png?q=20260430" alt="루미아 섬 지도"><svg class="planner-areas" viewBox="0 0 903 936" preserveAspectRatio="none" aria-label="지역 선택 지도"></svg><svg class="planner-lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"></svg><div id="planner-regions"></div></div><p class="planner-map-note">지역에 마우스를 올려 재료 확인 · 클릭하면 방문 순서 추가/취소 · 모바일은 터치로 선택</p><ol id="planner-route" aria-label="선택한 방문 순서"></ol><button id="planner-route-clear" hidden>방문 지역만 초기화</button></section><aside class="planner-sidebar" hidden><section id="planner-materials" class="surface" hidden></section><section id="planner-area" class="surface" aria-label="지역 재료"></section></aside></div><p class="data-note">체크는 선택한 지역에서 획득 가능한 재료를 뜻합니다. 실제 획득 여부와 경쟁자에 의한 소진은 반영하지 않습니다. 지도: DAK.GG · 재료: 공식 게임 데이터</p><dialog id="planner-picker" aria-labelledby="planner-picker-title"><div class="planner-dialog-heading"><h2 id="planner-picker-title">목표 장비 선택</h2><button id="planner-picker-close" aria-label="장비 선택 닫기">닫기</button></div><div id="planner-slots" role="group" aria-label="장비 부위"></div><div class="planner-picker-filters"><input id="planner-query" aria-label="장비 이름 검색" placeholder="장비 이름 검색"><select id="planner-weapon" aria-label="무기군"><option value="">모든 무기군</option></select><select id="planner-grade" aria-label="장비 등급"><option value="">모든 등급</option>'+Object.entries(erGradeNames).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></div><div id="planner-choices"></div><button id="planner-more">더 보기</button></dialog>';
 const status=document.querySelector('#explorer-status');status.textContent='지역과 제작 정보를 확인하는 중입니다.';
 const [_,weapons,armor,misc,names,areaBody,spawnBody,gatherBody,collectBody,consumables,special]=await Promise.all([loadAssetConfig(),erStatic('/er/weapon'),erStatic('/er/armor'),erStatic('/er/materials'),erDictionary(),erStatic('/er/route-data/Area'),erStatic('/er/route-data/ItemSpawn'),erStatic('/er/route-data/NaviCollectAndHunt'),erStatic('/er/route-data/Collectible'),erStatic('/er/route-data/ItemConsumable'),erStatic('/er/route-data/ItemSpecial')]);
 const catalog=new Map([weapons,armor,misc,consumables,special].flatMap(b=>b.data||[]).map(r=>[String(r.code),r]));
 const areas=erRouteAreas(areaBody.data,spawnBody.data,gatherBody.data,collectBody.data,names);
 if(!areas.length)throw new Error('지역별 재료 데이터가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
 const slots=[['Weapon','무기'],['Chest','옷'],['Head','머리'],['Arm','팔'],['Leg','다리']];
 const equipment=[...(weapons.data||[]),...(armor.data||[])].filter(r=>r.showInItemBook!==false);
 const selected=new Map();let route=[],hover=null,slot='Weapon',limit=60;
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
  const build=root.querySelector('#planner-build');build.hidden=!selected.size;build.innerHTML=slots.map(([key,label])=>'<button data-edit-slot="'+key+'">'+(selected.has(key)?icon(selected.get(key)):'<span class="planner-empty-slot">＋</span>')+'<span>'+label+'</span><strong>'+erText(selected.has(key)?name(selected.get(key)):'장비 선택')+'</strong></button>').join('');
  root.querySelector('.planner-areas').innerHTML=areas.map(a=>'<polygon data-region="'+a.id+'" points="'+erRoutePolygons[a.id].map(p=>p.join(',')).join(' ')+'" class="planner-area-shape '+(route.includes(a.id)?'is-selected':'')+'" aria-hidden="true"><title>'+erText(a.name)+'</title></polygon>').join('');
  root.querySelector('#planner-regions').innerHTML=areas.map(a=>{const point=erRoutePositions[a.name],order=route.indexOf(a.id);const items=selected.size?a.items.filter(i=>result.required.has(String(i.code))):[];return '<div class="planner-region-wrap" style="left:'+point[0]+'%;top:'+point[1]+'%"><button class="planner-region '+(order>=0?'is-selected':'')+'" data-region="'+erText(a.id)+'" aria-pressed="'+(order>=0)+'" aria-label="'+erText(a.name)+(order>=0?' · '+(order+1)+'번째 방문':' · 방문 추가')+'">'+(order>=0?'<b>'+(order+1)+'</b>':'')+erText(a.name)+'</button>'+(items.length?'<div class="planner-region-loot" aria-hidden="true" inert>'+items.slice(0,4).map(i=>icon(i.code)).join('')+(items.length>4?'<small>+'+(items.length-4)+'</small>':'')+'</div>':'')+'</div>';}).join('');
  root.querySelector('.planner-lines').innerHTML='<polyline points="'+route.map(id=>erRoutePositions[areas.find(a=>a.id===id).name].map(v=>v*10).join(',')).join(' ')+'"/>';
  root.querySelector('#planner-route').innerHTML=route.map((id,i)=>'<li><span>'+(i+1)+'</span>'+erText(areas.find(a=>a.id===id).name)+'<button data-remove-region="'+erText(id)+'" aria-label="'+erText(areas.find(a=>a.id===id).name)+' 방문 취소">×</button></li>').join('');root.querySelector('#planner-route-clear').hidden=!route.length;
  const mat=root.querySelector('#planner-materials');mat.hidden=!selected.size;mat.innerHTML='<h2>필요 재료 <small>'+done+'/'+coverage.length+'</small></h2><div class="planner-material-grid">'+coverage.map(itemChip).join('')+'</div>'+(result.invalid.size?'<p class="data-note">일부 제작식 미제공: '+[...result.invalid].map(c=>erText(name(c))).join(', ')+'</p>':'')+'<p class="data-note">지역 정보가 없는 특수 재료는 출현 조건 확인이나 전송 등으로 별도 획득해야 합니다. 채집·사냥 재료는 반복 획득을 기준으로 계산합니다.</p>';
  drawArea();erApplyItemGrades(root,catalog);
 }
 function drawChoices(){
  root.querySelector('#planner-slots').innerHTML=slots.map(([key,label])=>'<button data-slot="'+key+'" aria-pressed="'+(slot===key)+'">'+label+(selected.has(key)?' ✓':'')+'</button>').join('');
  root.querySelector('#planner-slots').insertAdjacentHTML('beforeend','<button class="planner-remove-equipment" data-unset="'+slot+'" '+(selected.has(slot)?'':'disabled')+'>이 부위 비우기</button>');
  const q=root.querySelector('#planner-query').value.trim().toLowerCase(),type=root.querySelector('#planner-weapon').value,grade=root.querySelector('#planner-grade').value;
  root.querySelector('#planner-weapon').hidden=slot!=='Weapon';
  const rows=equipment.filter(r=>(slot==='Weapon'?!!r.weaponType:r.armorType===slot)&&(!type||slot!=='Weapon'||r.weaponType===type)&&(!grade||r.itemGrade===grade)&&name(r.code).toLowerCase().includes(q));
  const grades=['Epic','Legend','Mythic','Rare','Uncommon','Common'];
  const groups=grades.map(g=>({grade:g,items:rows.filter(r=>r.itemGrade===g).sort((a,b)=>name(a.code).localeCompare(name(b.code),'ko'))})).filter(g=>g.items.length);
  root.querySelector('#planner-choices').innerHTML=groups.map(g=>'<section class="planner-grade-group" data-grade="'+g.grade+'"><h3>'+erText(erGradeNames[g.grade])+' <small>'+g.items.length+'개</small></h3><div class="planner-grade-items">'+g.items.slice(0,limit).map(r=>'<button data-equipment="'+r.code+'" aria-pressed="'+(String(selected.get(slot))===String(r.code))+'">'+icon(r.code)+'<span>'+erText(name(r.code))+'</span></button>').join('')+'</div></section>').join('')+(rows.length?'':'<p class="empty-state">일치하는 장비가 없습니다.</p>');root.querySelector('#planner-more').hidden=!groups.some(g=>g.items.length>limit);erApplyItemGrades(picker,catalog);
 }
 root.querySelector('#planner-equipment-open').onclick=()=>{drawChoices();picker.showModal();};root.querySelector('#planner-picker-close').onclick=()=>picker.close();picker.addEventListener('close',erHideItemTooltip);
 root.querySelector('#planner-reset').onclick=()=>{selected.clear();route=[];hover=null;draw();};root.querySelector('#planner-route-clear').onclick=()=>{route=[];draw();};
 root.querySelector('#planner-more').onclick=()=>{limit+=60;drawChoices();};root.querySelectorAll('.planner-picker-filters input,.planner-picker-filters select').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{limit=60;drawChoices();}));
 root.addEventListener('click',e=>{const b=e.target.closest('[data-region],button');if(!b)return;
  if(b.dataset.region){const id=b.dataset.region;route=route.includes(id)?route.filter(v=>v!==id):[...route,id];hover=id;draw();root.querySelector('button[data-region="'+id+'"]')?.focus({preventScroll:true});}
  if(b.dataset.removeRegion){route=route.filter(v=>v!==b.dataset.removeRegion);draw();}
  if(b.dataset.editSlot){slot=b.dataset.editSlot;drawChoices();picker.showModal();}
  if(b.dataset.slot){slot=b.dataset.slot;limit=60;drawChoices();}
  if(b.dataset.equipment){selected.set(slot,b.dataset.equipment);draw();drawChoices();}
  if(b.dataset.unset){selected.delete(b.dataset.unset);draw();drawChoices();}
 });
 const preview=e=>{const b=e.target.closest('[data-region]');if(!b)return;hover=b.dataset.region;root.querySelectorAll('[data-region]').forEach(el=>el.classList.toggle('is-hovered',el.dataset.region===hover));drawArea();};root.addEventListener('pointerover',preview);root.addEventListener('focusin',preview);root.querySelector('.planner-map').addEventListener('pointerleave',()=>root.querySelectorAll('.is-hovered').forEach(el=>el.classList.remove('is-hovered')));
 root.querySelector('#planner-equipment-open').disabled=false;
 status.textContent=areas.length+'개 지역 · 장비 '+equipment.length+'개';draw();
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
