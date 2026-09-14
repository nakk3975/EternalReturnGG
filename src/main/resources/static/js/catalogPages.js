// One filter model for character, build and item statistics. Dates are Korean calendar days.
function erFilterStatistics(data, filters, now=Date.now()) {
    const buckets=data.buckets;
    if(!buckets)return {...data,rows:[],builds:[],items:[],filterLabel:'통계 갱신 대기'};
    const day=new Date(now+9*3600000).toISOString().slice(0,10);
    const from=filters.days==='all'?'0000-01-01':new Date(Date.parse(day+'T00:00:00Z')-(Number(filters.days)-1)*86400000).toISOString().slice(0,10);
    const matches=r=>String(r.mode)===String(filters.mode)&&String(r.season)===String(filters.season)&&r.day>=from&&r.day<=day&&(filters.mode!=='3'||filters.tier==='all'||String(r.tier)===filters.tier);
    const merge=(rows,keys)=>{
        const groups=new Map();
        for(const r of (rows||[]).filter(matches)){
            const key=JSON.stringify(keys.map(k=>r[k]));
            if(!groups.has(key))groups.set(key,{...r,games:0,wins:0,top3:0,_sums:{},_counts:{}});
            const a=groups.get(key);for(const k of ['games','wins','top3'])a[k]+=Number(r[k]||0);
            for(const k of ['rank','damage','kills','rp'])if(r[k]!=null){const n=Number(r[k+'Count']??r.games);a._sums[k]=(a._sums[k]||0)+Number(r[k])*n;a._counts[k]=(a._counts[k]||0)+n;}
        }
        return [...groups.values()].map(a=>{for(const k of ['rank','damage','kills','rp'])a[k]=a._counts[k]?a._sums[k]/a._counts[k]:null;delete a._sums;delete a._counts;return a;});
    };
    return {...data,rows:merge(buckets.rows,['character','mode','season']),builds:merge(buckets.builds,['character','mode','season','kind','value']),items:merge(buckets.items,['code','mode','season']),filterLabel:filters.days==='all'?'시즌 전체 · 보유 데이터':filters.days==='1'?'오늘 (한국 시간)':'최근 '+filters.days+'일'};
}
function erStatisticsControls(data) {
    const seasons=[...new Set((data.buckets?.rows||[]).map(r=>r.season))].sort((a,b)=>b-a);
    const options=entries=>entries.map(([v,n])=>'<option value="'+erText(v)+'">'+erText(n)+'</option>').join('');
    return '<div class="catalog-toolbar stats-filters">'+[
        ['season','시즌',seasons.length?seasons.map(s=>[s,'시즌 '+s]):[['','수집된 시즌 없음']]],
        ['mode','모드',[['3','랭크'],['2','일반'],['6','코발트'],['9','론울프']]],
        ['tier','티어',[['all','전체 티어'],['7','미스릴 이상'],['6','메테오라이트'],['5','다이아몬드'],['4','플래티넘'],['3','골드'],['2','실버'],['1','브론즈'],['0','아이언'],['-1','티어 미확인']]],
        ['days','기간',[['7','최근 7일'],['1','오늘'],['14','최근 14일'],['30','최근 30일'],['all','시즌 전체']]]
    ].map(([key,label,values])=>'<label>'+label+'<select data-stat-filter="'+key+'">'+options(values)+'</select></label>').join('')+'</div><p class="data-note">보유 경기 표본 기준 · 랭크 티어는 경기 시작 RP 구간 기준입니다. 미스릴·데미갓·이터니티는 당시 랭킹 정보가 없어 미스릴 이상으로 합산합니다. 시즌 전체도 저장된 기간만 포함합니다.</p>';
}
function erReadStatisticsControls(root) {
    const f=Object.fromEntries([...root.querySelectorAll('[data-stat-filter]')].map(e=>[e.dataset.statFilter,e.value]));
    const tier=root.querySelector('[data-stat-filter="tier"]');tier.disabled=f.mode!=='3';if(tier.disabled)f.tier='all';return f;
}

'use strict';
const erEquipmentTypes={"Glove": "글러브", "Tonfa": "톤파", "Bat": "방망이", "Whip": "채찍", "HighAngleFire": "투척", "DirectFire": "암기", "Bow": "활", "CrossBow": "석궁", "Pistol": "권총", "AssaultRifle": "돌격 소총", "SniperRifle": "저격 소총", "Hammer": "망치", "Axe": "도끼", "OneHandSword": "단검", "TwoHandSword": "양손검", "Polearm": "폴암", "DualSword": "쌍검", "Spear": "창", "Nunchaku": "쌍절곤", "Rapier": "레이피어", "Guitar": "기타", "Camera": "카메라", "Arcana": "아르카나", "VFArm": "VF 의수", "Chest": "옷", "Head": "머리", "Arm": "팔", "Leg": "다리"};
const erBaseStats = {maxHp:'체력',maxSp:'스태미나',attackPower:'공격력',defense:'방어력',moveSpeed:'이동 속도',attackSpeed:'공격 속도',hpRegen:'체력 재생',spRegen:'스태미나 재생',criticalStrikeChance:'치명타 확률',skillAmp:'스킬 증폭',cooldownReduction:'쿨다운 감소'};
function erStatCells(row) { return Object.entries(erBaseStats).filter(([k])=>row[k]!=null).map(([k,label])=>'<div class="data-stat"><span>'+label+'</span><strong>'+erNumber(row[k],3)+'</strong></div>').join(''); }
function erPageShell(title,description) {
    document.querySelector('#page-title').textContent=title;
    document.querySelector('#page-description').textContent=description;
    document.querySelector('#explorer-controls').hidden=true;
    const results=document.querySelector('#explorer-results');results.className='database-layout';
    return results;
}
async function erCharacterPage() {
    const root=erPageShell('실험체 분석','실험체별 능력치와 추천 루트, 스킬 정보를 확인하세요.');
    root.innerHTML='<aside class="database-sidebar surface"><h2>실험체</h2><input id="character-search" aria-label="실험체 검색" placeholder="실험체 검색"><div id="character-picker" class="character-picker"></div></aside><div class="database-content" id="character-content"><p class="empty-state">실험체 정보를 불러오는 중입니다.</p></div>';
    const status=document.querySelector('#explorer-status');
    const assets = loadAssetConfig();
    const [body,names]=await Promise.all([erStatic('/er/character'),erDictionary()]);
    if(!Array.isArray(body.data))throw new Error('실험체 응답을 확인할 수 없습니다.');
    const chars=body.data.slice().sort((a,b)=>(names.get('Character/Name/'+a.code)||a.name).localeCompare(names.get('Character/Name/'+b.code)||b.name,'ko'));
    let selected;let generation=0;
    const picker=root.querySelector('#character-picker'),content=root.querySelector('#character-content');
    const label=c=>names.get('Character/Name/'+c.code)||c.name;
    const drawPicker=()=>{const q=root.querySelector('input').value.trim().toLowerCase();picker.innerHTML=chars.filter(c=>(label(c)+' '+c.name).toLowerCase().includes(q)).map(c=>'<a class="character-choice '+(selected?.code===c.code?'selected':'')+'" href="/er/characters/'+encodeURIComponent(c.name)+'" title="'+erText(label(c))+'"><img loading="lazy" src="'+erText(erCharacterImage(c.name))+'" alt=""><span>'+erText(label(c))+'</span></a>').join('');};
    async function select(name,tab,replace=false) {
        const current=++generation;
        selected=chars.find(c=>c.name.toLowerCase()===String(name).toLowerCase()||String(c.code)===String(name));
        if(!selected){content.innerHTML='<p class="empty-state">해당 실험체를 찾을 수 없습니다. 왼쪽에서 선택해 주세요.</p>';status.textContent='';return;}
        tab=['overview','routes','items','skills','traits','tactical'].includes(tab)?tab:'overview';
        if(replace)history.replaceState(null,'','/er/characters/'+encodeURIComponent(selected.name)+'?tab='+tab);
        document.title=label(selected)+' · 실험체 분석 · ER.GG';drawPicker();status.textContent='';
        content.innerHTML='<section class="character-hero surface"><img src="'+erText(erCharacterImage(selected.name))+'" alt="'+erText(label(selected))+'"><div><small>실험체 분석</small><h2>'+erText(label(selected))+'</h2><p>'+erText(selected.name)+'</p><div id="character-skill-icons"></div></div></section><div class="sub-tabs">'+[['overview','개요'],['items','아이템'],['routes','추천 루트'],['skills','스킬'],['traits','특성'],['tactical','전술 스킬']].map(([key,title])=>'<a class="'+(key===tab?'active':'')+'" href="/er/characters/'+encodeURIComponent(selected.name)+'?tab='+key+'">'+title+'</a>').join('')+'</div><div id="character-tab"></div>';
        const target=content.querySelector('#character-tab');
        erStatic('/er/skillInfo').then(data=>{if(current!==generation)return;content.querySelector('#character-skill-icons').innerHTML=(data.data||[]).filter(s=>String(s.characterCode)===String(selected.code)) .map(s=>'<span title="'+erText(s.name)+'">'+erSkillImage(s.group,s.name)+'</span>').join('');}).catch(()=>{});
        if(tab==='overview') {
            target.innerHTML='<div class="analysis-toolbar"><label>경기 모드 <select id="analysis-mode"><option value="3">랭크</option><option value="6">코발트</option><option value="2">일반</option></select></label></div><div id="character-analysis"><p class="empty-state">통계 불러오는 중…</p></div><section class="surface"><h3 class="panel-title">기본 능력치</h3><div class="data-stats">'+erStatCells(selected)+'</div></section><section class="surface"><h3 class="panel-title">추천 루트</h3><div id="character-routes"><p class="empty-state">루트를 불러오는 중입니다.</p></div></section>';
            Promise.all([erStatic('/er/statistics/data'),erStatic('/er/tacticalSkill')]).then(([data,tactical])=>{if(current!==generation)return;target.querySelector('.analysis-toolbar').innerHTML=erStatisticsControls(data);const draw=()=>{const filters=erReadStatisticsControls(target);target.querySelector('#character-analysis').innerHTML=erAnalysisMarkup(erFilterStatistics(data,filters),selected.code,names,filters.mode,tactical.data||[]);};target.querySelectorAll('[data-stat-filter]').forEach(e=>e.onchange=draw);draw();}).catch(()=>{if(current===generation)target.querySelector('#character-analysis').innerHTML='<p class="empty-state">통계를 불러오지 못했습니다.</p>';});
        }else target.innerHTML='<p class="empty-state">정보를 불러오는 중입니다.</p>';
        try {
            if(tab==='traits' || tab==='tactical') {
                const data=await erStatic(tab==='traits'?'/er/trait':'/er/tacticalSkill');if(current!==generation)return;
                const list=tab==='traits'?(data.data||[]).filter(erIsStandardTrait).sort((a,b)=>a.traitSortOrder-b.traitSortOrder):(data.data||[]).filter(s=>erIsAvailableTactical(s)).sort((a,b)=>a.sortOrder-b.sortOrder);
                target.innerHTML='<section class="surface"><h3 class="panel-title">'+(tab==='traits'?'특성 도감':'전술 스킬 도감')+'</h3><div class="skill-grid">'+list.map(s=>{
                    const code=tab==='traits'?Number(s.code)-1:(s.icon?.match(/(\d+)$/)?.[1]||s.group);
                    const title=names.get('Skill/Group/Name/'+code)||names.get('Trait/Name/'+s.code)||s.name||'스킬 '+code;
                    const icon=tab==='traits'?'TraitSkillIcon_'+code:s.icon;
                    return '<article class="skill-row" data-skill-code="'+code+'" tabindex="0">'+erSkillImage(code,title)+'<div><strong>'+erText(title)+'</strong><p>'+erText((erTraitGroups[s.traitGroup]||'전술 스킬')+(tab==='traits'?' · '+({Core:'핵심 특성',Sub1:'보조 특성 1',Sub2:'보조 특성 2'}[s.traitType]||''):''))+'</p></div></article>';
                }).join('')+'</div></section>';return;
            }
            if(tab==='skills') {
                const skills=await erStatic('/er/skillInfo');if(current!==generation)return;
                const list=(skills.data||[]).filter(s=>String(s.characterCode)===String(selected.code));
                target.innerHTML=list.length?'<section class="surface"><h3 class="panel-title">스킬 정보</h3><div class="skill-grid">'+list.map(s=>'<div class="skill-row" data-skill-code="'+s.group+'" tabindex="0">'+erSkillImage(s.group,s.name)+'<div><strong>'+erText(s.name||s.skillName||'스킬 '+s.group)+'</strong><p>'+erText(s.skillSlot||'실험체 스킬')+'</p></div></div>').join('')+'</div></section>':'<p class="empty-state">이 실험체에 연결된 스킬 정보가 제공되지 않았습니다.</p>';
                return;
            }
            const data=await erStatic('/er/main');if(current!==generation)return;
            const routes=(data.result||[]).map(v=>v.recommendWeaponRoute).filter(r=>r&&String(r.characterCode)===String(selected.code));
            if(tab==='items') {
                const codes=[...new Set(routes.flatMap(r=>String(r.weaponCodes||'').match(/\d{6}/g)||[]))];
                const catalog=await erLoadEquipment();if(current!==generation)return;
                target.innerHTML='<section class="surface"><h3 class="panel-title">추천 루트에 사용된 장비</h3><div class="related-items">'+(codes.map(code=>'<a href="/er/items/'+code+'">'+erItemHtml(code)+'<span>'+erText(names.get('Item/Name/'+code)||catalog.get(code)?.name||code)+'</span></a>').join('')||'<p class="empty-state">현재 추천 장비가 없습니다.</p>')+'</div></section>';
                erApplyItemGrades(target,catalog);
            }else {
                const destination=tab==='overview'?target.querySelector('#character-routes'):target;
                destination.innerHTML=erRoutesMarkup(routes.slice(0,5),names);
                erLoadEquipment().then(catalog=>{if(current===generation)erApplyItemGrades(destination,catalog);});
            }
        }catch(e){if(current===generation)target.insertAdjacentHTML('beforeend','<p class="empty-state">'+erText(e.message)+'</p>');}
    }
    root.onclick=e=>{const link=e.target.closest('a[href^="/er/characters/"]');if(!link||!erIsPlainClick(e))return;e.preventDefault();history.pushState(null,'',link.href);select(decodeURIComponent(location.pathname.split('/')[3]),new URLSearchParams(location.search).get('tab'));};
    root.querySelector('input').oninput=drawPicker;
    const initial=decodeURIComponent(location.pathname.split('/')[3]||'');
    await assets;
    await select(initial||chars[0]?.name,new URLSearchParams(location.search).get('tab'),!initial);

    window.addEventListener('popstate',()=>select(decodeURIComponent(location.pathname.split('/')[3]||''),new URLSearchParams(location.search).get('tab')));
}
function erRoutesMarkup(routes,names) {
    return routes.length ? '<div class="route-list">'+routes.map(r=>'<article class="route-list-row"><div><span class="route-number">#'+erText(r.id)+'</span><h3>'+erText(r.title)+'</h3><p>'+erText(r.userNickname)+'</p></div><div class="route-list-items"><span>아이템 빌드</span><div class="item-slots">'+(String(r.weaponCodes||'').match(/\d{6}/g)||[]).slice(0,5).map(erItemHtml).join('')+'</div></div><a class="sim-route-link" href="/er/route-planner?routeId='+erText(r.id)+'">시뮬레이터에서 열기</a><button class="copy-route" data-route-id="'+erText(r.id)+'">번호 복사</button></article>').join('')+'</div>':'<p class="empty-state">현재 제공되는 추천 루트가 없습니다.</p>';
}
async function erRoutesPage() {
    const root=erPageShell('루트 검색','실험체와 루트 이름으로 추천 빌드를 찾아보세요.');root.className='route-browser';
    root.innerHTML='<div class="catalog-toolbar surface"><label>실험체 <select id="route-character"><option value="">전체 실험체</option></select></label><input id="route-query" aria-label="루트 검색" placeholder="루트 이름 / 제작자 / 번호"></div><div id="route-results"></div>';
    const assets=loadAssetConfig();const [data,characters,names]=await Promise.all([erStatic('/er/main'),erStatic('/er/character'),erDictionary()]);await assets;
    const select=root.querySelector('select');for(const c of characters.data||[])select.add(new Option(names.get('Character/Name/'+c.code)||c.name,String(c.code)));
    const routes=(data.result||[]).map(v=>v.recommendWeaponRoute).filter(Boolean);
    select.value=new URLSearchParams(location.search).get('character')||'';
    let limit=20;const more=document.createElement('button');more.textContent='더 보기';root.append(more);
    const render=()=>{const q=root.querySelector('input').value.trim().toLowerCase();const found=routes.filter(r=>(!select.value||String(r.characterCode)===select.value)&&(r.title+' '+r.userNickname+' '+r.id).toLowerCase().includes(q));root.querySelector('#route-results').innerHTML=erRoutesMarkup(found.slice(0,limit),names);document.querySelector('#explorer-status').textContent=found.length+'개 루트';more.hidden=limit>=found.length;erLoadEquipment().then(c=>erApplyItemGrades(root,c));};
    more.onclick=()=>{limit+=20;render();};select.onchange=()=>{limit=20;render();};root.querySelector('input').oninput=()=>{limit=20;render();};render();
}
async function erItemsPage() {
    const root=erPageShell('아이템','장비 분류와 등급으로 검색하고 상세 능력치를 확인하세요.');root.className='items-layout';
    root.innerHTML='<aside class="database-sidebar surface item-filters"><h2>아이템 필터</h2><button id="item-filter-toggle" type="button" aria-expanded="false" aria-controls="item-filter-options">필터 펼치기</button><div id="item-filter-options"><button type="button" id="item-all" aria-pressed="true">모든 아이템</button><div id="item-type-groups"></div><label>등급<select id="item-grade"><option value="">전체 등급</option>'+Object.entries(erGradeNames).map(([key,name])=>'<option value="'+key+'">'+name+'</option>').join('')+'</select></label></div></aside><section class="surface item-table-panel" id="item-list-panel" tabindex="-1"><div class="item-search-bar"><input id="item-query" aria-label="아이템 검색" placeholder="아이템 이름 / 코드"></div><div id="item-list" tabindex="0" role="region" aria-label="아이템 목록"></div><button id="more-items">더 보기</button></section><aside id="item-detail" class="surface item-detail" tabindex="-1"><p class="empty-state">아이템을 선택해 주세요.</p></aside>';

    const filterToggle=root.querySelector('#item-filter-toggle');
    filterToggle.onclick=()=>{const open=filterToggle.getAttribute('aria-expanded')!=='true';filterToggle.setAttribute('aria-expanded',String(open));filterToggle.textContent=open?'필터 접기':'필터 펼치기';};
    const statsRequest=erStatic('/er/statistics/data').then(data=>({data}),error=>({error}));
    let samples={items:[]},statsState='loading';
    const assets=loadAssetConfig();const [weapons,armor,names,materials]=await Promise.all([erStatic('/er/weapon'),erStatic('/er/armor'),erDictionary(),erStatic('/er/materials').catch(()=>({data:[]}))]);await assets;
    const rows=[...(weapons.data||[]).map(r=>({...r,category:'weapon'})),...(armor.data||[]).map(r=>({...r,category:'armor'}))];const catalog=new Map([...rows,...(materials.data||[])].map(r=>[String(r.code),r]));let selected=location.pathname.split('/')[3];let limit=40;
    root.querySelector('#item-filter-options').insertAdjacentHTML('beforeend','<div id="item-stat-controls"><p class="data-note">통계 불러오는 중…</p></div>');
    let filteredSamples=erFilterStatistics(samples,{});
    let itemSamples=new Map(filteredSamples.items.map(r=>[String(r.code),r]));
    let selectedType='';
    const typeButtons=root.querySelector('#item-type-groups');
    const ranged=new Set(['Pistol','Guitar','AssaultRifle','CrossBow','Arcana','DirectFire','SniperRifle','Camera','HighAngleFire','Bow']);
    const types=[...new Set(rows.map(r=>r.weaponType||r.armorType).filter(Boolean))];
    const armorTypes=new Set(rows.filter(r=>r.category==='armor').map(r=>r.armorType));
    const groups=[['방어구',types.filter(t=>armorTypes.has(t))],['근접 무기',types.filter(t=>!armorTypes.has(t)&&!ranged.has(t))],['원거리 무기',types.filter(t=>ranged.has(t))]];
    typeButtons.innerHTML=groups.map(([name,entries])=>'<section class="item-filter-group"><h3>'+name+'</h3><div class="item-type-buttons">'+entries.map(t=>'<button type="button" data-type="'+erText(t)+'" aria-pressed="false">'+erText(erEquipmentTypes[t]||t)+'</button>').join('')+'</div></section>').join('');
    const syncFilters=()=>{root.querySelector('#item-all').setAttribute('aria-pressed',String(!selectedType));typeButtons.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===selectedType)));};
    const label=r=>names.get('Item/Name/'+r.code)||r.name||String(r.code);
    function detail(code,push=false) {const row=catalog.get(String(code));if(!row)return;selected=String(code);if(push)history.pushState(null,'','/er/items/'+encodeURIComponent(code));root.querySelector('#item-detail').innerHTML='<a class="item-back-link" href="#item-list-panel">← 아이템 목록으로</a><h2>아이템 정보</h2>'+erItemHtml(row.code)+'<h3>'+erText(label(row))+'</h3><p>'+erText(erGradeNames[row.itemGrade]||'등급 미확인')+' · '+erText(erEquipmentTypes[row.weaponType||row.armorType]||row.weaponType||row.armorType||'')+'</p><div class="item-stat-chips">'+erItemStats(row).map(s=>'<span>'+erText(s.label)+' +'+erText(s.value)+'</span>').join('')+'</div>'+((names.get('Item/Desc/'+code))?'<p class="item-description">'+erText(names.get('Item/Desc/'+code).replace(/<[^>]*>/g,'').replace(/\\n/g,'\n'))+'</p>':'')+'<div id="item-sample-stats"></div><h3 class="panel-title">제작 트리</h3><div class="craft-viewport" tabindex="0" role="region" aria-label="아이템 제작 트리"><ul class="craft-tree">'+erCraftTree(row.code,catalog,names)+'</ul></div>';erApplyItemGrades(root.querySelector('#item-detail'),catalog);erFitCraftTree(root.querySelector('.craft-viewport'));const r=itemSamples.get(String(code));root.querySelector('#item-sample-stats').innerHTML=r?'<p class="data-note">'+erText(filteredSamples.filterLabel)+' · '+erNumber(r.games)+'개 장비 기록</p><div class="analysis-summary"><div><small>승률</small><strong>'+erNumber(r.wins/r.games*100,1)+'%</strong></div><div><small>TOP 3</small><strong>'+erNumber(r.top3/r.games*100,1)+'%</strong></div><div><small>평균 순위</small><strong>#'+erNumber(r.rank,2)+'</strong></div></div>':'<p class="data-note">'+(statsState==='loading'?'통계 불러오는 중…':statsState==='failed'?'통계를 불러오지 못했습니다. 아이템 탐색은 계속 사용할 수 있습니다.':'선택한 조건의 장비 통계가 없습니다.')+'</p>';}

    const render=()=>{const q=root.querySelector('input').value.trim().toLowerCase();const grade=root.querySelector('#item-grade').value;const filtered=rows.filter(r=>(!selectedType||(r.weaponType||r.armorType)===selectedType)&&(!grade||r.itemGrade===grade)&&(label(r)+' '+r.code).toLowerCase().includes(q));root.querySelector('#item-list').innerHTML='<table class="data-table"><thead><tr><th>아이템</th><th>분류</th><th>등급</th><th>수집 표본</th><th>승률</th></tr></thead><tbody>'+filtered.slice(0,limit).map(r=>'<tr class="'+(String(r.code)===selected?'selected':'')+'"><td><a href="/er/items/'+r.code+'" data-select-item="'+r.code+'">'+erItemHtml(r.code)+'<span>'+erText(label(r))+'</span></a></td><td>'+erText(erEquipmentTypes[r.weaponType||r.armorType]||(r.category==='weapon'?'무기':'방어구'))+'</td><td>'+erText(erGradeNames[r.itemGrade]||'—')+'</td><td>'+erNumber(itemSamples.get(String(r.code))?.games)+'</td><td>'+(itemSamples.has(String(r.code))?erNumber(itemSamples.get(String(r.code)).wins/itemSamples.get(String(r.code)).games*100,1)+'%':'—')+'</td></tr>').join('')+'</tbody></table>';if(!filtered.length)root.querySelector('#item-list').innerHTML='<p class="empty-state">일치하는 아이템이 없습니다. 검색어, 무기군 또는 등급을 바꿔 주세요.</p>';root.querySelector('#more-items').hidden=limit>=filtered.length;document.querySelector('#explorer-status').textContent=filtered.length+'개 아이템';erApplyItemGrades(root.querySelector('#item-list'),catalog);};
    typeButtons.onclick=e=>{const button=e.target.closest('[data-type]');if(!button)return;selectedType=button.dataset.type;syncFilters();limit=40;render();};
    root.querySelector('#item-all').onclick=()=>{selectedType='';syncFilters();limit=40;render();};
    root.onclick=e=>{const link=e.target.closest('[data-select-item]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();detail(link.dataset.selectItem,true);render();const panel=root.querySelector('#item-detail');if(window.matchMedia('(max-width:1180px)').matches){panel.focus({preventScroll:true});panel.scrollIntoView({block:'start'});}}};
    root.querySelectorAll('input,select').forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{limit=40;render();}));root.querySelector('#more-items').onclick=()=>{limit+=40;render();};detail(selected||rows[0]?.code);render();window.addEventListener('popstate',()=>{detail(location.pathname.split('/')[3]);render();});
    // Item search/filtering is usable even while the independent statistics request is pending.
    void statsRequest.then(result=>{
        const controls=root.querySelector('#item-stat-controls');
        if(result.error){statsState='failed';controls.textContent='통계 조회 실패';detail(selected);return;}
        statsState='ready';samples=result.data;controls.innerHTML=erStatisticsControls(samples);
        const refreshStats=()=>{filteredSamples=erFilterStatistics(samples,erReadStatisticsControls(root));itemSamples=new Map(filteredSamples.items.map(r=>[String(r.code),r]));detail(selected);render();};
        controls.querySelectorAll('[data-stat-filter]').forEach(el=>el.addEventListener('change',refreshStats));refreshStats();
    }).catch(()=>{statsState='failed';});
}
let erCraftResize;
function erFitCraftTree(viewport){
    if(erCraftResize)erCraftResize.disconnect();
    if(!viewport)return;
    const tree=viewport.querySelector('.craft-tree');
    const fit=()=>{const width=viewport.clientWidth;if(!width)return;const scale=Math.min(1,Math.max(0,width-16)/tree.scrollWidth);tree.style.transform='translateX(-50%) scale('+scale+')';const height=Math.ceil(tree.offsetHeight*scale)+40;if(viewport.style.height!==height+'px')viewport.style.height=height+'px';};
    fit();erCraftResize=new ResizeObserver(fit);erCraftResize.observe(viewport);
}
function erRankingCharacters(stats){
    const totals=new Map();
    for(const c of stats?.characterStats||[]){if(Number(c.usages)>0&&Number(c.characterCode)>0)totals.set(Number(c.characterCode),(totals.get(Number(c.characterCode))||0)+Number(c.usages));}
    const total=Number(stats?.totalGames);
    return [...totals].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([code,uses])=>({code,uses,percent:total>0?Math.min(100,uses/total*100):null}));
}
async function erRankingPage() {
    const root=erPageShell('랭킹','현재 시즌 스쿼드 랭킹');root.className='ranking-layout';
    root.innerHTML='<aside class="surface ranking-guide"><h2>랭킹</h2><p class="selected">스쿼드 · 현재 시즌</p><p>순위는 제공된 RP 랭킹 기준입니다.</p><a href="/er/multi">플레이어 전적 비교 →</a></aside><section class="surface ranking-main"><div class="ranking-toolbar"><h2>RP 랭킹</h2><input id="rank-query" aria-label="랭킹 닉네임 검색" placeholder="목록에서 닉네임 검색"><button id="rank-retry">새로고침</button></div><div id="rank-table"><p class="empty-state">랭킹을 불러오는 중입니다.</p></div><div class="pagination"><button id="rank-prev">이전</button><span id="rank-page"></span><button id="rank-next">다음</button></div></section>';
    const status=document.querySelector('#explorer-status');let rows=[];let page=0;let busy=false;let updated='';
    const profiles=new Map(),requested=new Set(),queue=[];let active=0;
    const metadata=Promise.all([erStatic('/er/character'),erDictionary(),loadAssetConfig()]);
    const paint=async(uid,stats)=>{
        const [body,names]=await metadata;const chars=new Map((body.data||[]).map(c=>[Number(c.code),c]));
        const top=erRankingCharacters(stats),first=top[0];
        root.querySelectorAll('[data-rank-id]').forEach(tr=>{if(tr.dataset.rankId!==uid)return;
            const picture=c=>erCharacterImage(chars.get(c.code)?.name);
            const name=c=>names.get('Character/Name/'+c.code)||chars.get(c.code)?.name||'실험체';
            tr.querySelector('.rank-avatar').innerHTML=first?'<img src="'+erText(picture(first))+'" alt="'+erText(name(first))+'" title="최다 사용: '+erText(name(first))+'">':'<span aria-label="캐릭터 기록 없음">—</span>';
            tr.querySelector('.rank-character-top').innerHTML=top.length?top.map(c=>'<a class="rank-character" href="/er/characters/'+encodeURIComponent(chars.get(c.code)?.name||c.code)+'" title="'+erText(name(c))+' · '+erNumber(c.uses)+'게임"><img src="'+erText(picture(c))+'" alt="'+erText(name(c))+'"><span>'+erText(name(c))+'<small>'+(c.percent==null?'—':erNumber(c.percent,1)+'%')+'</small></span></a>').join(''):'<span class="data-note">시즌 기록 없음</span>';
        });
    };
    const pump=()=>{while(active<2&&queue.length){const uid=queue.shift();if(!Array.from(root.querySelectorAll('[data-rank-id]')).some(tr=>tr.dataset.rankId===uid)){requested.delete(uid);continue;}active++;
        Promise.resolve().then(async()=>{const row=Array.from(root.querySelectorAll('[data-rank-id]')).find(tr=>tr.dataset.rankId===uid);let userId=row?.dataset.userId;if(!userId){const found=await erStatic('/er/search/nickname?nickname='+encodeURIComponent(uid));userId=found.user?.userId;}if(!userId)throw new Error('플레이어 ID 없음');return erRequest('/er/userRank?userNum='+encodeURIComponent(userId));}).then(data=>{const stats=data.userStats?.[0]||{};profiles.set(uid,stats);try{sessionStorage.setItem('ergg.rank.profile.v2.'+uid,JSON.stringify({at:Date.now(),stats}));}catch(_){}void paint(uid,stats).catch(()=>{});}).catch(()=>{requested.delete(uid);root.querySelectorAll('[data-rank-id]').forEach(tr=>{if(tr.dataset.rankId===uid)tr.querySelector('.rank-character-top').innerHTML='<span class="data-note">통계 조회 실패</span>';});}).finally(()=>{active--;setTimeout(pump,350);});
    }};
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);const uid=entry.target.dataset.rankId;if(!uid)continue;
        if(!profiles.has(uid)){try{const cached=JSON.parse(sessionStorage.getItem('ergg.rank.profile.v2.'+uid)||'null');if(cached&&Date.now()-cached.at<900000)profiles.set(uid,cached.stats);}catch(_){}}
        if(profiles.has(uid)){paint(uid,profiles.get(uid)).catch(()=>{});continue;}
        if(!requested.has(uid)){requested.add(uid);queue.push(uid);}
    }pump();},{rootMargin:'100px'});
    const render=()=>{const q=root.querySelector('input').value.trim().toLowerCase();const filtered=rows.filter(r=>String(r.nickname||'').toLowerCase().includes(q));const count=Math.max(1,Math.ceil(filtered.length/50));page=Math.min(page,count-1);root.querySelector('#rank-table').innerHTML='<table class="data-table ranking-table"><thead><tr><th>순위</th><th>플레이어</th><th>많이 플레이한 실험체 TOP 3 <small>시즌 사용률</small></th><th>RP</th></tr></thead><tbody>'+filtered.slice(page*50,page*50+50).map(r=>'<tr data-rank-id="'+erText(r.nickname||r.userId||'')+'" data-user-id="'+erText(r.userId||'')+'"><td><span class="rank-position '+(Number(r.rank)<=3?'top-rank':'')+'">'+erNumber(r.rank)+'</span></td><td><div class="rank-user"><span class="rank-avatar" aria-hidden="true"></span>'+(r.userId?'<a href="/er/user/detail/view?userNum='+encodeURIComponent(r.userId)+'">'+erText(r.nickname)+'</a>':'<button class="rank-player" data-rank-player="'+erText(r.nickname)+'">'+erText(r.nickname)+'</button>')+'</div></td><td><div class="rank-character-top"><span class="data-note">'+(r.userId||r.nickname?'통계 불러오는 중…':'통계 없음')+'</span></div></td><td><strong>'+erNumber(r.mmr)+'</strong> <small>RP</small></td></tr>').join('')+'</tbody></table>'+(filtered.length?'':'<p class="empty-state">검색 결과가 없습니다.</p>');root.querySelector('#rank-page').textContent=(page+1)+' / '+count;root.querySelector('#rank-prev').disabled=page===0;root.querySelector('#rank-next').disabled=page+1>=count;observer.disconnect();root.querySelectorAll('[data-rank-id]').forEach(tr=>observer.observe(tr));};
    root.querySelector('input').oninput=()=>{page=0;render();};root.querySelector('#rank-prev').onclick=()=>{page--;render();};root.querySelector('#rank-next').onclick=()=>{page++;render();};
    try{const saved=JSON.parse(sessionStorage.getItem('ergg.ranking')||'null');if(saved&&Date.now()-saved.at<1800000&&Array.isArray(saved.data.topRanks)){rows=saved.data.topRanks;render();status.textContent='이전에 받은 랭킹 표시 중 · 최신 결과 확인 중';}}catch(_){}
    const load=async()=>{if(busy)return;busy=true;root.querySelector('#rank-retry').disabled=true;try{
        let data;for(let attempt=0;attempt<12;attempt++){data=await erRequest('/er/leaderboard/data');if(!data.loading)break;status.textContent='최신 랭킹을 준비하고 있습니다…';await new Promise(resolve=>setTimeout(resolve,1500));}
        if(data.loading)throw new Error('랭킹 준비에 시간이 걸리고 있습니다. 잠시 후 새로고침해 주세요.');
        if(!Array.isArray(data.topRanks))throw new Error('랭킹 응답을 확인할 수 없습니다.');
        rows=data.topRanks.slice().sort((a,b)=>Number(a.rank)-Number(b.rank));updated=data.updatedAt?new Date(data.updatedAt).toLocaleTimeString('ko-KR'):'';render();status.textContent=rows.length+'명 · '+(data.refreshFailed?'이전 결과 표시 · 갱신 실패':data.stale?'이전 결과 표시 · 갱신 중':'최신 결과')+(updated?' · '+updated+' 갱신':'');try{sessionStorage.setItem('ergg.ranking',JSON.stringify({at:Date.now(),data}));}catch(_){}
    }catch(e){status.textContent=(rows.length?'이전에 받은 랭킹을 표시합니다. ':'')+e.message;if(!rows.length)root.querySelector('#rank-table').innerHTML='<p class="empty-state">랭킹을 불러오지 못했습니다. 새로고침 버튼으로 다시 시도해 주세요.</p>';}finally{busy=false;root.querySelector('#rank-retry').disabled=false;}};
    root.querySelector('#rank-retry').onclick=load;
    root.addEventListener('click',async e=>{const button=e.target.closest('[data-rank-player]');if(!button)return;button.disabled=true;try{const {user}=await erRequest('/er/search/nickname?nickname='+encodeURIComponent(button.dataset.rankPlayer));if(!user?.userId)throw new Error('플레이어를 찾을 수 없습니다.');location.href='/er/user/detail/view?userNum='+encodeURIComponent(user.userId);}catch(error){status.textContent=error.message;button.disabled=false;}});
    await load();
}
document.addEventListener('click',async e=>{const button=e.target.closest('.copy-route');if(!button)return;try{await navigator.clipboard.writeText(button.dataset.routeId);button.textContent='복사됨';}catch(_){button.textContent=button.dataset.routeId;}});

async function erStatisticsPage() {
    const root=erPageShell('실험체 통계','티어 · 시즌 · 모드 · 기간별 수집 경기 통계');root.className='statistics-page surface';
    const [data,chars,names]=await Promise.all([erRequest('/er/statistics/data'),erStatic('/er/character'),erDictionary(),loadAssetConfig()]);
    const characters=new Map((chars.data||[]).map(c=>[Number(c.code),c]));
    root.innerHTML=erStatisticsControls(data)+'<div class="catalog-toolbar"><label>정렬 <select id="stats-sort"><option value="games">플레이 수</option><option value="winrate">승률</option><option value="toprate">TOP 3</option><option value="damage">평균 딜량</option><option value="rank">평균 순위</option></select></label></div><div id="stats-table"></div>';
    const render=()=>{
        const filters=erReadStatisticsControls(root),filtered=erFilterStatistics(data,filters),sort=root.querySelector('#stats-sort').value;
        const all=filtered.rows,season=Number(filters.season);
        const rows=all.filter(r=>r.season===season).map(r=>({...r,winrate:r.wins/r.games*100,toprate:r.top3/r.games*100})).sort((a,b)=>sort==='rank'?a.rank-b.rank:b[sort]-a[sort]);
        const total=rows.reduce((n,r)=>n+r.games,0);
        document.querySelector('#explorer-status').textContent=filtered.filterLabel+' · '+erNumber(total)+'개 플레이 기록 · '+(total<100?'표본 부족 · ':'')+(data._cacheStale?'이전 집계 표시 · 갱신 중':'5분마다 갱신');
        root.querySelector('#stats-table').innerHTML=rows.length?'<table class="data-table"><thead><tr><th>실험체</th><th>플레이 수</th><th>선택 비중</th><th>승률</th><th>TOP 3</th><th>평균 순위</th><th>평균 딜량</th></tr></thead><tbody>'+rows.map(r=>{const c=characters.get(r.character),name=names.get('Character/Name/'+r.character)||c?.name||r.character;return '<tr><td><a href="/er/characters/'+encodeURIComponent(c?.name||r.character)+'"><img width="40" height="40" loading="lazy" src="'+erText(erCharacterImage(c?.name))+'" alt=""> '+erText(name)+'</a></td><td>'+erNumber(r.games)+'</td><td>'+erNumber(r.games/total*100,1)+'%</td><td>'+erNumber(r.winrate,1)+'%</td><td>'+erNumber(r.toprate,1)+'%</td><td>#'+erNumber(r.rank,2)+'</td><td>'+erNumber(r.damage)+'</td></tr>';}).join('')+'</tbody></table>':'<p class="empty-state">선택한 조건에 수집된 경기 표본이 없습니다.</p>';
    };root.querySelectorAll('select').forEach(s=>s.onchange=render);render();
    erRequest('/er/statistics/collection').then(info=>{const text=({collecting:'자동 수집 중',waiting:'다음 수집 대기',retrying:'수집 재시도 대기',daily_limit:'오늘 수집 한도 도달',starting:'수집 준비 중'})[info.status]||'수집 상태 확인 중';const note=document.createElement('p');note.className='data-note';note.textContent=text+' · 오늘 '+erNumber(info.collectedToday||0)+'경기'+(info.lastSuccess?' · 마지막 수집 '+new Date(info.lastSuccess).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'')+' · 서버 절전 중에는 수집이 일시 정지됩니다.';root.prepend(note);}).catch(()=>{});
}
function erCraftTree(code,catalog,names,visited=new Set(),depth=0) {
    if(depth>8||visited.has(String(code)))return '';
    const item=catalog.get(String(code)),label=names.get('Item/Name/'+code)||item?.name||'재료 '+code;
    const children=[item?.makeMaterial1,item?.makeMaterial2].filter(c=>Number(c)>0);
    const next=new Set(visited);next.add(String(code));
    return '<li><a class="craft-node" data-select-item="'+erText(code)+'" href="/er/items/'+erText(code)+'">'+erItemHtml(code)+'<span class="craft-name">'+erText(label)+'</span></a>'+(children.length?'<ul>'+children.map(c=>erCraftTree(c,catalog,names,next,depth+1)).join('')+'</ul>':'')+'</li>';
}
function erAnalysisMarkup(data,code,names,mode='3',tactical=[]) {
    const available=(data.rows||[]).filter(r=>String(r.character)===String(code)&&String(r.mode)===mode);
    const season=Math.max(0,...available.map(r=>r.season));const row=available.find(r=>r.season===season);
    if(!row)return '<p class="empty-state">선택한 조건에 이 실험체의 수집 경기 표본이 없습니다.</p>';
    const total=(data.rows||[]).filter(r=>r.season===season&&String(r.mode)===mode).reduce((n,r)=>n+r.games,0);
    const summary=[['승률',erNumber(row.wins/row.games*100,1)+'%'],['TOP 3',erNumber(row.top3/row.games*100,1)+'%'],['평균 RP',erNumber(row.rp,1)],['선택 비중',erNumber(row.games/total*100,1)+'%'],['평균 순위','#'+erNumber(row.rank,2)],['평균 킬',erNumber(row.kills,2)]];
    const builds=(data.builds||[]).filter(r=>String(r.character)===String(code)&&r.season===season&&String(r.mode)===mode).sort((a,b)=>b.games-a.games);
    const skill=code=>erSkillImage(code,names.get('Skill/Group/Name/'+code));
    const sections=[['skills','스킬 습득 순서'],['tactical','추천 전술 스킬'],['traits','추천 특성']].map(([kind,title])=>{
        const choices=builds.filter(r=>r.kind===kind && (kind!=='tactical'||tactical.some(t=>String(t.group)===String(r.value)&&erIsAvailableTactical(t,mode)))).slice(0,5);
        return '<section class="surface analysis-builds"><h3 class="panel-title">'+title+'</h3>'+choices.map(r=>{
            const v=r.value;let body='';
            if(kind==='skills')body='<div class="analysis-skill-order">'+erLearnedSkills(v,names).map(([order,code])=>'<span title="'+erText(names.get('Skill/Group/Name/'+code)||code)+'"><small>'+erText(order)+'</small>'+skill(code)+'</span>').join('')+'</div>';
            if(kind==='tactical'){const meta=tactical.find(s=>String(s.group)===String(v));const iconCode=meta?.icon?.match(/(\d+)$/)?.[1];body=erSkillImage(iconCode,names.get('Skill/Group/Name/'+iconCode))+'<strong>'+erText(names.get('Skill/Group/Name/'+iconCode)||'전술 스킬 '+v)+'</strong>';}
            if(kind==='traits')body='<div class="analysis-traits">'+[v.core,...(v.first||[]),...(v.second||[])].filter(c=>Number(c)>=7000000&&Number(c)<7400000).map(c=>'<span title="'+erText(names.get('Skill/Group/Name/'+(Number(c)-1))||names.get('Trait/Name/'+c)||c)+'">'+skill(Number(c)-1)+'</span>').join('')+'</div>';
            return '<div class="analysis-build"><div>'+body+'</div><p>사용 '+erNumber(r.games/row.games*100,1)+'%<br>승률 '+erNumber(r.wins/r.games*100,1)+'%<small>'+erNumber(r.games)+'개 기록</small></p></div>';
        }).join('')+(choices.length?'':'<p class="empty-state">수집된 기록이 없습니다.</p>')+'</section>';
    }).join('');
    return '<p class="data-note">'+erText(data.filterLabel||'최근 7일')+' · '+erNumber(row.games)+'개 플레이 기록 표본 · 전체 서버 통계가 아닙니다.</p><div class="analysis-summary">'+summary.map(([label,value])=>'<div class="surface"><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div><div class="analysis-sections">'+sections+'</div>';
}
