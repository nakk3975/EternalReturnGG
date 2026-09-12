'use strict';
const erPlayerCharacters = new Map();
let erPlayerNames = new Map();
let erPlayerEquipment = new Map();
let erTactical = new Map();
let erTraits = new Map();
function erKda(row) {
    if (row.playerDeaths == null || row.playerKill == null || row.playerAssistant == null) return '—';
    return Number(row.playerDeaths) === 0 ? 'PERFECT' : erNumber((Number(row.playerKill)+Number(row.playerAssistant))/Number(row.playerDeaths),2);
}
const erWeapons = {1:['Glove','글러브'],2:['Tonfa','톤파'],3:['Bat','방망이'],4:['Whip','채찍'],5:['HighAngleFire','투척'],6:['DirectFire','암기'],7:['Bow','활'],8:['CrossBow','석궁'],9:['Pistol','권총'],10:['AssaultRifle','돌격 소총'],11:['SniperRifle','저격 소총'],13:['Hammer','망치'],14:['Axe','도끼'],15:['OneHandSword','단검'],16:['TwoHandSword','양손검'],17:['Polearm','폴암'],18:['DualSword','쌍검'],19:['Spear','창'],20:['Nunchaku','쌍절곤'],21:['Rapier','레이피어'],22:['Guitar','기타'],23:['Camera','카메라'],24:['Arcana','아르카나'],25:['VFArm','VF 의수']};
const erMetric = (label,value) => '<div class="match-stat"><strong>'+value+'</strong><span>'+label+'</span></div>';
function erRp(row) {
    if(Number(row.matchingMode)!==3) return '—';
    const score = row.mmrAfter ?? row.rankPoint;
    const gain = row.mmrGain;
    return erNumber(score)+(erFinite(gain)?'<small class="rp-change '+(Number(gain)>0?'rp-up':Number(gain)<0?'rp-down':'')+'">'+(Number(gain)>0?'+':'')+erNumber(gain)+'</small>':'');
}
function erRoute(row) { return row.routeIdOfStart == null ? '—' : Number(row.routeIdOfStart)===0 ? '비공개' : erText(row.routeIdOfStart); }
function erLoadout(row) {
    return '<div class="match-loadout"><span data-weapon="'+erText(row.bestWeapon)+'" title="무기군"></span><span data-trait="'+erText(row.traitFirstCore)+'" title="핵심 특성"></span><span data-tactical="'+erText(row.tacticalSkillGroup)+'" title="전술 스킬 '+erNumber(row.tacticalSkillLevel)+'레벨"></span><span data-trait-group="'+erText(row.traitSecondSub?.[0])+'" title="보조 특성"></span></div>';
}
function erMatchDate(value) {
    const date=new Date(value);
    if (!value || Number.isNaN(date.getTime())) return '—';
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
    const part=type=>parts.find(p=>p.type===type).value;
    return part('month')+'/'+part('day')+' '+part('hour')+':'+part('minute');
}
function erPlayerCard(row, details = false, isOwn = false) {
    const character = erPlayerCharacters.get(String(row.characterNum));
    const name = erPlayerNames.get('Character/Name/'+row.characterNum) || character?.name || '실험체';
    const date = new Date(row.startDtm);
    const played = erMatchDate(row.startDtm);
    const fullDate = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
    const mode = ({2:'일반',3:'랭크',6:'코발트',9:'론울프'})[row.matchingMode] || '기타';
    const seconds = row.duration ?? row.totalTime;
    const duration = seconds == null ? '—' : Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
    const portrait = '<div class="match-character"><img data-character="'+erText(row.characterNum)+'" data-skin="'+erText(row.skinCode || 0)+'" src="'+erText(erCharacterImage(character?.name,row.skinCode))+'" alt="'+erText(name)+'"><span>'+erNumber(row.characterLevel)+'</span><small data-character-name="'+erText(row.characterNum)+'">'+erText(name)+'</small></div>';
    const stats = erMetric('TK / K / A',erNumber(row.teamKill ?? row.totalFieldKill)+' / '+erNumber(row.playerKill)+' / '+erNumber(row.playerAssistant)) + erMetric('딜량',erNumber(row.damageToPlayer)) + erMetric('RP',erRp(row)) + erMetric('루트 ID',erRoute(row));
    if (details) return '<div class="participant-row '+(isOwn?'own-player':'')+'">'+portrait+'<div class="participant-name">'+(isOwn?'<b class="own-player-badge">나</b> ':'')+erText(row.nickname)+'<small>'+erText(erWeapons[row.bestWeapon]?.[1]||'무기군 미제공')+' · 숙련도 '+erNumber(row.bestWeaponLevel)+'</small></div>'+erLoadout(row)+erMetric('K / D / A',erNumber(row.playerKill)+' / '+erNumber(row.playerDeaths)+' / '+erNumber(row.playerAssistant))+erMetric('딜량',erNumber(row.damageToPlayer))+erMetric('RP',erRp(row))+erEquipmentHtml(row.equipment)+'</div>';
    return '<div class="one-record match-card '+(Number(row.gameRank)===1?'match-victory':Number(row.gameRank)<=3?'match-top':'')+'" role="button" tabindex="0" data-game-id="'+erText(row.gameId)+'" aria-expanded="false" aria-controls="game-'+erText(row.gameId)+'"><div class="match-result"><strong>#'+erNumber(row.gameRank)+'</strong><b>'+mode+'</b><small>'+duration+'</small><time title="'+erText(fullDate)+'" aria-label="'+erText(fullDate)+'">'+erText(played)+'</time></div>'+portrait+erLoadout(row)+'<div class="match-numbers">'+stats+'</div><div class="match-build">'+erEquipmentHtml(row.equipment)+'</div><span class="plus-btn" aria-hidden="true">⌄</span></div><div id="game-'+erText(row.gameId)+'" class="detail-box match-detail" hidden></div>';
}
function erPersonalDetails(row) {
    const metrics=[['KDA',erKda(row)],['무기 숙련도',erNumber(row.bestWeaponLevel)],['받은 피해',erNumber(row.damageFromPlayer)],['회복량',erNumber(row.healAmount)],['보호막 흡수',erNumber(row.protectAbsorb)],['야생동물 처치',erNumber(row.monsterKill)],['획득 크레딧',erNumber(row.totalGainVFCredit)],['사용 크레딧',erNumber(row.totalUseVFCredit)],['망원 카메라 설치',erNumber(row.addTelephotoCamera)],['망원 카메라 제거',erNumber(row.removeTelephotoCamera)],['기본 공격 피해',erNumber(row.damageToPlayer_basic)],['스킬 피해',erNumber(row.damageToPlayer_skill)],['최대 체력',erNumber(row.maxHp)],['공격력',erNumber(row.attackPower)],['방어력',erNumber(row.defense)],['공격 속도',erNumber(row.attackSpeed,2)],['이동 속도',erNumber(row.moveSpeed,2)],['최종 시야 범위',erNumber(row.sightRange,2)]];
    const traitCodes=[row.traitFirstCore,...(row.traitFirstSub||[]),...(row.traitSecondSub||[])].filter(erFinite);
    return '<section class="personal-detail"><h3>내 경기 분석 <small>'+erText(row.serverName||'')+' · 경기 #'+erText(row.gameId)+'</small></h3><div class="detail-metrics">'+metrics.map(([k,v])=>erMetric(k,v)).join('')+'</div><div class="detail-traits"><strong>특성</strong>'+traitCodes.map(code=>'<span data-trait="'+code+'" title="특성 '+code+'"></span>').join('')+'<span>'+erText(erWeapons[row.bestWeapon]?.[1]||'무기군 미제공')+' · 루트 '+erRoute(row)+'</span></div>'+erSkillOrder(row)+'</section>';
}
function erSkillOrder(row) {
    const entries=erLearnedSkills(row.skillOrderInfo,erPlayerNames);
    if(!entries.length)return '';
    return '<div class="skill-order"><h4>스킬 습득 순서</h4><ol>'+entries.map(([order,code])=>'<li><small>'+erText(order)+'</small>'+erSkillImage(code,erPlayerNames.get('Skill/Group/Name/'+code))+'<span>'+erText(erPlayerNames.get('Skill/Group/Name/'+code)||'스킬 '+code)+'</span></li>').join('')+'</ol></div>';
}
function erRpPoints(rows, season, now = Date.now()) {
    const day=86400000, offset=9*3600000;
    const start=Math.floor((now+offset)/day)*day-offset-6*day;
    return rows.filter(r=>Date.parse(r.startDtm)>=start && Date.parse(r.startDtm)<=now && Number(r.matchingMode)===3 && String(r.seasonId)===String(season) && erFinite(r.mmrAfter) && !Number.isNaN(Date.parse(r.startDtm))).slice().sort((a,b)=>Date.parse(a.startDtm)-Date.parse(b.startDtm));
}
function erRpGraph(rows, season, now = Date.now()) {
    const unique=[...new Map(rows.map(r=>[String(r.gameId),r])).values()];
    const games=erRpPoints(unique,season,now);
    const daily=new Map();
    for(const row of games)daily.set(new Date(Date.parse(row.startDtm)+9*3600000).toISOString().slice(0,10),row);
    const points=[...daily.values()];
    if(!points.length) return '<p class="empty-state">최근 7일 동안 조회된 랭크 RP 기록이 없습니다.</p>';
    const values=points.map(r=>Number(r.mmrAfter));
    const low=Math.floor((Math.min(...values)-25)/50)*50,high=Math.ceil((Math.max(...values)+25)/50)*50;
    const x=i=>42+i*238/Math.max(1,points.length-1),y=v=>145-(v-low)*115/(high-low);
    const date=r=>new Date(r.startDtm).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit'});
    const grid=Array.from({length:4},(_,i)=>{const v=low+(high-low)*i/3;return '<line x1="42" x2="280" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="35" y="'+(y(v)+3)+'" text-anchor="end">'+erNumber(v)+'</text>';}).join('');
    return '<div class="rp-graph"><h3>최근 7일 RP 변화 <small>조회한 랭크 '+games.length+'경기</small></h3><svg viewBox="0 0 300 177" role="img" aria-label="최근 7일 한국 시간 기준 랭크 경기별 RP 추이"><g class="graph-grid">'+grid+'</g><polyline fill="none" stroke="#d58a64" stroke-width="1.5" points="'+values.map((v,i)=>x(i)+','+y(v)).join(' ')+'"/>'+points.map((r,i)=>'<circle tabindex="0" cx="'+x(i)+'" cy="'+y(Number(r.mmrAfter))+'" r="3" fill="#d58a64"><title>'+date(r)+' · 경기 '+erText(r.gameId)+' · '+erNumber(r.mmrAfter)+' RP ('+erNumber(r.mmrGain)+')</title></circle>').join('')+'<text x="42" y="169">'+date(points[0])+'</text><text x="280" y="169" text-anchor="end">'+date(points[points.length-1])+'</text></svg><p>한국 시간 · 오늘 포함 7일 · 저장·조회된 경기의 일별 마지막 RP</p></div>';
}
function erEnhancePlayer(root) {
    root.querySelectorAll('[data-character]').forEach(img=>{const c=erPlayerCharacters.get(img.dataset.character);if(c){img.alt=erPlayerNames.get('Character/Name/'+img.dataset.character)||c.name;const portrait=erCharacterImage(c.name,img.dataset.skin);const src=img.id==='detailImage'?portrait.replace('CharProfile_','CharResult_'):portrait;if(img.getAttribute('src')!==src){delete img.dataset.fallback;img.src=src;}}});
    root.querySelectorAll('[data-character-name]').forEach(el=>{el.textContent=erPlayerNames.get('Character/Name/'+el.dataset.characterName)||erPlayerCharacters.get(el.dataset.characterName)?.name||'실험체';});
    root.querySelectorAll('[data-tactical],[data-trait],[data-trait-group],[data-weapon]').forEach(slot=>{
        if(!erAssetBase)return;
        let icon, name;
        if(slot.dataset.weapon!=null){const w=erWeapons[slot.dataset.weapon];if(w){icon='Ico_Ability_'+w[0];name=w[1];}}
        else if(slot.dataset.tactical!=null){icon=erTactical.get(slot.dataset.tactical)?.icon;name=erPlayerNames.get('Skill/Group/Name/'+icon?.match(/(\d+)$/)?.[1])||slot.title||'전술 스킬';}
        else if(slot.dataset.traitGroup!=null){const group=erTraits.get(slot.dataset.traitGroup)?.traitGroup; if(group){icon='TraitSkillIcon_'+group+'02';name=({Havoc:'파괴',Fortification:'저항',Support:'지원',Chaos:'혼돈'})[group]||group;}}
        else if(Number(slot.dataset.trait)>0){icon='TraitSkillIcon_'+(Number(slot.dataset.trait)-1);name=erPlayerNames.get('Skill/Group/Name/'+(Number(slot.dataset.trait)-1))||erPlayerNames.get('Trait/Name/'+slot.dataset.trait)||'특성 '+slot.dataset.trait;}
        if(slot.dataset.trait!=null&&Number(slot.dataset.trait)>=7400000){slot.hidden=true;return;}
        if(icon){const skillCode=icon.match(/(?:SkillIcon_)(\d+)$/)?.[1];if(skillCode){slot.dataset.skillCode=skillCode;slot.tabIndex=0;}slot.innerHTML='<img loading="lazy" src="'+erText(erAssetBase+icon+'.png')+'" alt="'+erText(name)+'">';slot.title=name;}
    });
    erApplyItemGrades(root,erPlayerEquipment);
    root.querySelectorAll('[data-item-code]').forEach(slot=>{const name=erPlayerNames.get('Item/Name/'+slot.dataset.itemCode);if(name){slot.title=name;const img=slot.querySelector('img');if(img)img.alt=name;}});
}
function erOwnTeam(row, own) {
    return erFinite(row.teamNumber) && erFinite(own.teamNumber) && String(row.teamNumber)===String(own.teamNumber);
}
function erOwnPlayer(row, own) {
    if(row.userId && own.userId)return row.userId===own.userId;
    if(row.userNum!=null && own.userNum!=null)return String(row.userNum)===String(own.userNum);
    return Boolean(row.nickname && own.nickname && row.nickname===own.nickname);
}
// Monster/Name codes from the game localization; credit rewards are not kill attribution.
function erBossBadges(row) {
    const kills=row.killMonsters;
    if(!kills || typeof kills!=='object' || Array.isArray(kills))return '';
    return [['wickline','위클라인',[7,107]],['alpha','알파',[8,108]],['omega','오메가',[9,109]]].map(([key,name,codes])=>{
        const count=codes.reduce((sum,code)=>sum+(erFinite(kills[code])&&Number(kills[code])>0?Number(kills[code]):0),0);
        return count>0?'<span class="boss-badge boss-'+key+'" title="'+name+' 직접 처치 '+count+'회">'+name+(count>1?' ×'+count:'')+'</span>':'';
    }).join('');
}
function erScorePlayerLink(row) {
    const nickname=String(row.nickname||'').trim();
    if(!nickname)return '알 수 없는 플레이어';
    if(row.userId)return '<a class="score-player-link" href="/er/user/detail/view?userNum='+encodeURIComponent(row.userId)+'">'+erText(nickname)+'</a>';
    return '<a class="score-player-link" href="/er/user/detail/view?nickname='+encodeURIComponent(nickname)+'">'+erText(nickname)+'</a>';
}
function erTeamPlacement(rows,ownRow={}) {
    const rank=Number(rows[0].gameRank);
    const escaped=rows.filter(r=>Number(r.escapeState)===3).length;
    return '<th scope="rowgroup" rowspan="'+rows.length+'" class="score-placement '+(rank===1?'score-win':rank>1&&rank<=3?'score-top':'')+'"><strong>#'+erNumber(rows[0].gameRank)+'</strong>'+(escaped?'<small class="team-escape" title="팀원 '+escaped+'/'+rows.length+'명 탈출 성공">탈출</small>':'')+(erOwnTeam(rows[0],ownRow)?'<small class="team-own-label">우리 팀</small>':'')+'</th>';
}
function erTeamScoreboard(teams,ownRow) {
    const damageMax=Math.max(1,...teams.flat().map(r=>Number(r.damageToPlayer)||0));
    const animalMax=Math.max(1,...teams.flat().map(r=>Number(r.damageToMonster)||0));
    const damage=(value,max,type)=>'<td class="score-damage"><span class="damage-meter '+type+'" aria-hidden="true"><i style="width:'+Math.min(100,Math.max(0,(Number(value)||0)/max*100))+'%"></i></span>'+erNumber(value)+'</td>';
    return '<div class="team-scoreboard-scroll" tabindex="0" aria-label="팀별 경기 결과"><table class="team-scoreboard"><thead><tr><th scope="col">#</th><th scope="col">플레이어</th><th scope="col">TK / K / D / A</th><th scope="col">딜량</th><th scope="col">동물 딜량</th><th scope="col">크레딧</th><th scope="col">아이템 빌드</th></tr></thead>'+teams.slice().sort((a,b)=>(a[0].gameRank??999)-(b[0].gameRank??999)).map(rows=>{
        const own=erOwnTeam(rows[0],ownRow);
        const rank=Number(rows[0].gameRank);
        return '<tbody class="score-team '+(own?'score-own-team':'')+'">'+rows.map((row,index)=>{
            const c=erPlayerCharacters.get(String(row.characterNum));
            const name=erPlayerNames.get('Character/Name/'+row.characterNum)||c?.name||'실험체';
            const portrait='<div class="score-portrait"><img data-character="'+erText(row.characterNum)+'" data-skin="'+erText(row.skinCode||0)+'" src="'+erText(erCharacterImage(c?.name,row.skinCode))+'" alt="'+erText(name)+'"><small>'+erNumber(row.characterLevel)+'</small></div>';
            return '<tr class="'+(erOwnPlayer(row,ownRow)?'score-own-player':'')+'">'+(index===0?erTeamPlacement(rows,ownRow):'')+'<td><div class="score-player">'+portrait+erLoadout(row)+'<div class="score-nickname">'+erScorePlayerLink(row)+(erOwnPlayer(row,ownRow)?'<b class="own-player-badge">나</b>':'')+'<div class="boss-badges">'+erBossBadges(row)+'</div></div></div></td><td class="score-kda">'+erNumber(row.teamKill??row.totalFieldKill)+' / '+erNumber(row.playerKill)+' / '+erNumber(row.playerDeaths)+' / '+erNumber(row.playerAssistant)+'</td>'+damage(row.damageToPlayer,damageMax,'player-damage')+damage(row.damageToMonster,animalMax,'animal-damage')+'<td class="score-credit">'+erNumber(row.totalGainVFCredit)+'</td><td class="score-items">'+erEquipmentHtml(row.equipment)+'</td></tr>';
        }).join('')+'</tbody>';
    }).join('')+'</table></div>';
}
async function erRenderGame(gameId, ownRow) {
    const panel=document.getElementById('game-'+gameId);
    if(panel){panel.innerHTML='<p class="empty-state">팀별 경기 결과를 불러오는 중입니다.</p>';erEnhancePlayer(panel);}
    const data=await erRequest('/er/game?gameId='+encodeURIComponent(gameId));
    if (!Array.isArray(data.userGames)) throw new Error('경기 응답을 확인할 수 없습니다.');
    const teams=new Map();
    for(const row of data.userGames){const key=String(row.teamNumber ?? row.gameRank ?? '기타');if(!teams.has(key))teams.set(key,[]);teams.get(key).push(row);}
    const html=erMatchTabs([...teams.values()],ownRow);
    const fragment=document.createElement('div');fragment.innerHTML=html;erEnhancePlayer(fragment);return fragment.innerHTML;
}
// Share speculative and clicked pagination requests; failures can be retried.
function erMatchPages(userId) {
    const pages=new Map();
    return cursor=>{
        const key=String(cursor||'');
        if(!pages.has(key)) {
            const request=erRequest('/er/user/detail?userNum='+encodeURIComponent(userId)+(key?'&next='+encodeURIComponent(key):''))
                .then(data=>{if(!Array.isArray(data.userGames))throw new Error('전적 응답 오류');if(data._cacheStale)pages.delete(key);return data;})
                .catch(error=>{pages.delete(key);throw error;});
            pages.set(key,request);
            if(pages.size>3)pages.delete(pages.keys().next().value);
        }
        return pages.get(key);
    };
}
function erPlacementHtml(rows,mode='') {
    return rows.slice(0,20).filter(r=>(!mode||String(r.matchingMode)===mode)&&erFinite(r.gameRank)).reverse()
        .map(r=>'<span class="'+(Number(r.gameRank)===1?'win':Number(r.gameRank)<=3?'top':'')+'">'+erNumber(r.gameRank)+'</span>').join('');
}
async function erRefreshSnapshot(url, snapshot, onFresh) {
    if(!snapshot._cacheStale)return;
    for(let attempt=0;attempt<5;attempt++) {
        await new Promise(resolve=>setTimeout(resolve,2000));
        try {
            const fresh=await erRequest(url);
            if(!fresh._cacheStale){await onFresh(fresh);return;}
        } catch (_) { return; }
    }
}
function erMostPlayed(stats, recent) {
    const ranked=(stats||[]).filter(s=>erFinite(s.characterCode)&&Number(s.usages)>0);
    if(ranked.length)return ranked.slice().sort((a,b)=>Number(b.usages)-Number(a.usages)||Number(a.characterCode)-Number(b.characterCode))[0].characterCode;
    const counts=new Map();
    for(const row of recent||[])if(erFinite(row.characterNum))counts.set(row.characterNum,(counts.get(row.characterNum)||0)+1);
    return [...counts].sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0]))[0]?.[0] ?? null;
}
async function startPlayer() {
    const params=new URLSearchParams(location.search);
    let userId=params.get('userNum');
    const records=document.querySelector('#record');
    const nickname=params.get('nickname')?.trim();
    if(!userId && nickname){
        document.querySelector('#nickname').textContent=nickname;
        try{
            const {user}=await erRequest('/er/search/nickname?nickname='+encodeURIComponent(nickname));
            if(!user?.userId)throw new Error('플레이어를 찾을 수 없습니다. 닉네임이 변경되었을 수 있습니다.');
            userId=user.userId;
        }catch(error){
            records.textContent=error.message;
            document.querySelector('#hero-loading').hidden=true;
            document.querySelector('#refresh').onclick=()=>location.reload();
            return;
        }
    }
    if(!userId){records.textContent='플레이어를 먼저 검색해 주세요.';return;}
    const encoded=encodeURIComponent(userId);
    let rows=[];let graphRows=[];let placementRows=[];let selectedMode='';let rankSeason=null;let next=null;let loading=false;
    let heroStats=[];
    let heroSkin=null, skinLookup='', rankReady=false;
    const heroImage=document.querySelector('#detailImage');
    heroImage.addEventListener('load',()=>{if(heroImage.dataset.character){heroImage.classList.remove('hero-pending');document.querySelector('#hero-loading').hidden=true;}});
    const loadSeasonSkin=async(code,season)=>{
        const lookup=season+':'+code;
        if(skinLookup===lookup)return;
        skinLookup=lookup;heroSkin=null;
        for(let attempt=0;attempt<180 && skinLookup===lookup;attempt++){
            try {
                const result=await erRequest('/er/user/season-skin?userNum='+encoded+'&season='+encodeURIComponent(season)+'&character='+encodeURIComponent(code));
                if(skinLookup!==lookup)return;
                if(result.status==='incomplete'){heroSkin={code,skin:0,unavailable:true};updateHero();return;}
                if(result.status==='complete'){
                    heroSkin={code,skin:result.skinCode,uses:result.uses};updateHero();return;
                }
            }catch(_){}
            await new Promise(resolve=>setTimeout(resolve,5000));
        }
        if(skinLookup===lookup){heroSkin={code,skin:0,unavailable:true};updateHero();}
    };
    const updateHero=()=>{
        if(!rankReady)return;
        const code=erMostPlayed(heroStats,rows);
        if(code==null){document.querySelector('#hero-loading').textContent='실험체 기록 없음';return;}
        if(rankSeason && heroStats.length && heroSkin?.code!==code){heroImage.classList.add('hero-pending');document.querySelector('#hero-loading').hidden=false;loadSeasonSkin(code,rankSeason);return;}
        const img=document.querySelector('#detailImage');
        img.dataset.character=String(code);img.dataset.skin=String(heroSkin?.code===code?heroSkin.skin:0);
        img.title=heroStats.length?'이번 시즌 가장 많이 플레이한 실험체':'최근 경기에서 가장 많이 플레이한 실험체';
        document.querySelector('#hero-caption').textContent=heroStats.length?'시즌 주력 실험체':'최근 주력 실험체';
        if(heroSkin?.code===code && !heroSkin.unavailable)img.title+=' · 시즌 최다 사용 스킨 ('+heroSkin.uses+'경기)';
        erEnhancePlayer(document.querySelector('.player-hero'));
        if(img.complete && img.naturalWidth>0){img.classList.remove('hero-pending');document.querySelector('#hero-loading').hidden=true;}
    };
    erRequest('/er/user/rp-history?userNum='+encoded).then(data=>{graphRows=data.userGames||[];document.querySelector('#rp-history').innerHTML=erRpGraph([...graphRows,...rows],rankSeason??rows.find(r=>Number(r.matchingMode)===3)?.seasonId);}).catch(()=>{});
    const getPage=erMatchPages(userId);
    const prefetchNext=()=>{if(next)getPage(next).catch(()=>{});};
    const assets=loadAssetConfig();
    const metadata=Promise.allSettled([assets,erStatic('/er/character'),erDictionary(),erLoadEquipment(),erStatic('/er/tacticalSkill'),erStatic('/er/trait')]).then(result=>{
        if(result[1].status==='fulfilled')for(const c of result[1].value.data||[])erPlayerCharacters.set(String(c.code),c);
        if(result[2].status==='fulfilled')erPlayerNames=result[2].value;
        if(result[3].status==='fulfilled')erPlayerEquipment=result[3].value;
        if(result[4].status==='fulfilled')erTactical=new Map((result[4].value.data||[]).map(s=>[String(s.group),s]));
        if(result[5].status==='fulfilled')erTraits=new Map((result[5].value.data||[]).map(s=>[String(s.code),s]));
        erEnhancePlayer(document);
        updateHero();
    });
    const render=()=>{
        const filtered=rows.filter(r=>!selectedMode || String(r.matchingMode)===selectedMode);
        records.innerHTML=filtered.length ? filtered.map(r=>erPlayerCard(r)).join('') : '<p class="empty-state">이 모드의 최근 전적이 없습니다.</p>';
        for(const row of filtered)matchDetailLoaders.set(String(row.gameId),()=>erRenderGame(row.gameId,row));
        erEnhancePlayer(records);
        const valid=filtered.filter(r=>erFinite(r.gameRank));
        document.querySelector('#recent-summary').innerHTML='<strong>'+filtered.length+'게임</strong> · '+filtered.filter(r=>Number(r.gameRank)===1).length+'승';
        document.querySelector('#recent-overview').innerHTML='<div class="recent-metrics">'+erMetric('평균 순위',valid.length?'#'+erNumber(valid.reduce((s,r)=>s+Number(r.gameRank),0)/valid.length,1):'—')+erMetric('승리',erNumber(valid.filter(r=>Number(r.gameRank)===1).length))+erMetric('TOP 3',erNumber(valid.filter(r=>Number(r.gameRank)<=3).length))+erMetric('평균 TK',filtered.length?erNumber(filtered.reduce((s,r)=>s+Number(r.teamKill??r.totalFieldKill??0),0)/filtered.length,2):'—')+'</div><div class="placement-strip" aria-label="최근 20경기 등수">'+erPlacementHtml(placementRows,selectedMode)+'</div>';
        document.querySelector('#rp-history').innerHTML=erRpGraph([...graphRows,...rows],rankSeason??rows.find(r=>Number(r.matchingMode)===3)?.seasonId);
        document.querySelector('#more-matches').hidden=!next;

    };
    document.querySelectorAll('[data-match-mode]').forEach(button=>button.onclick=()=>{selectedMode=button.dataset.matchMode;document.querySelectorAll('[data-match-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
    document.querySelector('#refresh').onclick=()=>location.reload();
    const rankPanel=document.querySelector('#rank-panel');
    const renderRank=async data=>{
        const row=data.userStats?.[0];
        rankReady=true;
        if(!row)updateHero();
        if(!row){rankPanel.innerHTML='<p class="empty-state">이번 시즌 랭크 기록이 없습니다.</p>';return;}
        rankSeason=row.seasonId;
        heroStats=Array.isArray(row.characterStats)?row.characterStats:[];
        const metric=(label,value)=>'<div><span>'+label+'</span><strong>'+value+'</strong></div>';
        const tier=erTier(row);
        rankPanel.innerHTML='<div class="rank-score">'+(tier?'<img class="tier-emblem" src="https://cdn.dak.gg/er/images/tier/full/'+tier.image+'.png" alt="'+tier.name+'">':'')+'<div><strong>'+erNumber(row.mmr)+' <span>RP</span></strong><small>'+(tier?tier.name:'랭크 · 스쿼드')+'</small><p>순위 '+(Number(row.rank)>0?erNumber(row.rank)+'위':'—')+'</p></div></div><div class="profile-metrics">'+metric('평균 TK',row.totalGames?erNumber(row.totalTeamKills/row.totalGames,2):'—')+metric('승률',row.totalGames && erFinite(row.totalWins)?erNumber(row.totalWins/row.totalGames*100,1)+'%':'—')+metric('게임 수',erNumber(row.totalGames))+metric('평균 킬',erNumber(row.averageKills,2))+metric('TOP 2',row.top2==null?'—':erNumber(row.top2*100,1)+'%')+metric('평균 어시스트',erNumber(row.averageAssistants,2))+metric('평균 동물 킬',erNumber(row.averageHunts,2))+metric('TOP 3',row.top3==null?'—':erNumber(row.top3*100,1)+'%')+metric('평균 순위',erNumber(row.averageRank,1))+'</div>';
        document.querySelector('#rp-history').innerHTML=erRpGraph([...graphRows,...rows],rankSeason);
        await metadata;
        const stats=Array.isArray(row.characterStats)?row.characterStats:[];
        heroStats=stats;updateHero();
        document.querySelector('#player-characters').innerHTML=stats.slice().sort((a,b)=>b.usages-a.usages).slice(0,5).map(s=>{
            const c=erPlayerCharacters.get(String(s.characterCode));
            return '<a class="played-character" href="/er/characters/'+encodeURIComponent(c?.name||s.characterCode)+'"><img alt="" src="'+erText(erCharacterImage(c?.name))+'"><span>' +erText(erPlayerNames.get('Character/Name/'+s.characterCode)||c?.name||'실험체')+'<small>'+erNumber(s.usages)+'게임</small></span><strong>'+(s.usages?erNumber(s.wins/s.usages*100,1)+'%':'—')+'</strong></a>';
        }).join('')||'<p class="empty-state">실험체 기록이 없습니다.</p>';
    };
    erRequest('/er/userRank?userNum='+encoded).then(data=>{renderRank(data).catch(()=>{});erRefreshSnapshot('/er/userRank?userNum='+encoded,data,renderRank);}).catch(()=>{rankReady=true;updateHero();rankPanel.innerHTML='<p class="empty-state">랭크 정보를 불러오지 못했습니다.</p>';});
    document.querySelector('#more-matches').onclick=async()=>{
        if(loading||!next)return;
        loading=true;const button=document.querySelector('#more-matches');button.disabled=true;button.textContent='불러오는 중…';
        try{
            const data=await getPage(next);
            if(!Array.isArray(data.userGames))throw new Error('전적 응답 오류');
            const ids=new Set(rows.map(r=>String(r.gameId))), added=data.userGames.filter(r=>!ids.has(String(r.gameId)));
            rows.push(...added);next=added.length && String(data.next)!==String(next) ? data.next||null : null;render();prefetchNext();
            button.textContent='전적 더 보기';
        }catch(error){button.textContent='조회 실패 · 다시 시도';}
        finally{loading=false;button.disabled=false;}
    };
    try {
        const data=await getPage(null);
        if(!Array.isArray(data.userGames))throw new Error('최근 전적 응답을 확인할 수 없습니다.');
        rows=data.userGames;placementRows=rows.slice(0,20);next=data.next || null;
        if(rows[0]){
            document.querySelector('#nickname').textContent=rows[0].nickname || '플레이어';
            document.querySelector('#userLevel').textContent='레벨 '+erNumber(rows[0].accountLevel);
            updateHero();
            document.querySelector('#recent-summary').innerHTML='<strong>'+rows.length+'게임</strong> · '+rows.filter(r=>Number(r.gameRank)===1).length+'승 · 평균 피해 '+erNumber(rows.reduce((sum,r)=>sum+Number(r.damageToPlayer||0),0)/rows.length);
        }
        render();
        erEnhancePlayer(document);
        erRefreshSnapshot('/er/user/detail?userNum='+encoded,data,fresh=>{
            // Do not reset a list the user has paged or expanded while refreshing.
            if(rows.length>10 || document.querySelector('.match-card[aria-expanded=true]'))return;
            rows=fresh.userGames;next=fresh.next||null;placementRows=rows.slice(0,20);render();updateHero();
            if(next)getPage(next).then(page=>{
                const ids=new Set(placementRows.map(r=>String(r.gameId)));
                placementRows=placementRows.concat(page.userGames.filter(r=>!ids.has(String(r.gameId)))).slice(0,20);
                const strip=document.querySelector('.placement-strip');if(strip)strip.innerHTML=erPlacementHtml(placementRows,selectedMode);
            }).catch(()=>{});
        });
        // Fetch only the next page in the background; keep the visible list at ten.
        if(next)getPage(next).then(page=>{
            const ids=new Set(placementRows.map(r=>String(r.gameId)));
            placementRows=placementRows.concat(page.userGames.filter(r=>!ids.has(String(r.gameId)))).slice(0,20);
            const strip=document.querySelector('.placement-strip');
            if(strip)strip.innerHTML=erPlacementHtml(placementRows,selectedMode);
        }).catch(()=>{});
    }catch(error){records.innerHTML='<p class="empty-state">'+erText(error.message)+'</p>';}
}
document.addEventListener('DOMContentLoaded',startPlayer);
