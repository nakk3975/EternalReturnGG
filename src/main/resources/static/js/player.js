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
function erPlayerCard(row, details = false) {
    const character = erPlayerCharacters.get(String(row.characterNum));
    const name = erPlayerNames.get('Character/Name/'+row.characterNum) || character?.name || '실험체';
    const date = new Date(row.startDtm);
    const played = Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const mode = ({2:'일반',3:'랭크',4:'코발트'})[row.matchingMode] || '기타 모드';
    const duration = row.totalTime == null ? '—' : Math.floor(row.totalTime/60)+'분 '+Math.floor(row.totalTime%60)+'초';
    const portrait = '<div class="match-character"><img data-character="'+erText(row.characterNum)+'" data-skin="'+erText(row.skinCode || 0)+'" src="'+erText(erCharacterImage(character?.name,row.skinCode))+'" alt="'+erText(name)+'"><span>Lv.'+erNumber(row.characterLevel)+'</span><div class="match-loadout"><span data-tactical="'+erText(row.tacticalSkillGroup)+'"></span><span data-trait="'+erText(Number(row.traitFirstCore)-1)+'"></span></div></div>';
    const stats = '<div class="match-stat"><span>TK / K / A</span><strong>'+erNumber(row.totalFieldKill)+' / '+erNumber(row.playerKill)+' / '+erNumber(row.playerAssistant)+'</strong></div><div class="match-stat"><span>플레이어 피해</span><strong>'+erNumber(row.damageToPlayer)+'</strong></div><div class="match-stat"><span>KDA</span><strong>'+erKda(row)+'</strong></div>';
    if (details) return '<div class="participant-row">'+portrait+'<div class="participant-name">'+erText(row.nickname)+'<small data-character-name="'+erText(row.characterNum)+'">'+erText(name)+'</small></div>'+stats+erEquipmentHtml(row.equipment)+'</div>';
    return '<div class="one-record match-card '+(Number(row.gameRank)===1?'match-victory':'')+'" role="button" tabindex="0" data-game-id="'+erText(row.gameId)+'" aria-expanded="false" aria-controls="game-'+erText(row.gameId)+'"><div class="match-result"><strong>#'+erNumber(row.gameRank)+'</strong><b>'+mode+'</b><small>'+duration+'</small><time>'+erText(played)+'</time></div>'+portrait+'<div class="match-numbers">'+stats+'</div><div class="match-build"><span>최종 장비</span>'+erEquipmentHtml(row.equipment)+'</div><span class="plus-btn" aria-hidden="true">⌄</span></div><div id="game-'+erText(row.gameId)+'" class="detail-box match-detail" hidden></div>';
}
function erEnhancePlayer(root) {
    root.querySelectorAll('[data-character]').forEach(img=>{const c=erPlayerCharacters.get(img.dataset.character);if(c){const src=erCharacterImage(c.name,img.dataset.skin);if(img.getAttribute('src')!==src){delete img.dataset.fallback;img.src=src;}}});
    root.querySelectorAll('[data-character-name]').forEach(el=>{el.textContent=erPlayerNames.get('Character/Name/'+el.dataset.characterName)||erPlayerCharacters.get(el.dataset.characterName)?.name||'실험체';});
    root.querySelectorAll('[data-tactical],[data-trait]').forEach(slot=>{const code=slot.dataset.tactical ?? slot.dataset.trait;const info=slot.dataset.tactical!=null?erTactical.get(code):erTraits.get(code);if(info?.icon&&erAssetBase)slot.innerHTML='<img src="'+erText(erAssetBase+info.icon+'.png')+'" alt="'+(slot.dataset.tactical!=null?'전술 스킬':'핵심 특성')+'">';});
    erApplyItemGrades(root,erPlayerEquipment);
}
async function erRenderGame(gameId) {
    const data=await erRequest('/er/game?gameId='+encodeURIComponent(gameId));
    if (!Array.isArray(data.userGames)) throw new Error('경기 응답을 확인할 수 없습니다.');
    const teams=new Map();
    for(const row of data.userGames){const key=String(row.teamNumber ?? row.gameRank ?? '기타');if(!teams.has(key))teams.set(key,[]);teams.get(key).push(row);}
    const html=[...teams.values()].sort((a,b)=>(a[0].gameRank??999)-(b[0].gameRank??999)).map(rows=>'<section class="match-team"><h3>#'+erNumber(rows[0].gameRank)+' <span>팀 '+erText(rows[0].teamNumber??'')+'</span></h3>'+rows.map(r=>erPlayerCard(r,true)).join('')+'</section>').join('');
    const fragment=document.createElement('div');fragment.innerHTML=html;erEnhancePlayer(fragment);return fragment.innerHTML;
}
async function startPlayer() {
    const userId=new URLSearchParams(location.search).get('userNum');
    const records=document.querySelector('#record');
    if(!userId){records.textContent='플레이어를 먼저 검색해 주세요.';return;}
    const encoded=encodeURIComponent(userId);
    let rows=[];let selectedMode='';
    const assets=loadAssetConfig();
    const metadata=Promise.allSettled([assets,erStatic('/er/character'),erDictionary(),erLoadEquipment(),erStatic('/er/tacticalSkill'),erStatic('/er/skillInfo')]).then(result=>{
        if(result[1].status==='fulfilled')for(const c of result[1].value.data||[])erPlayerCharacters.set(String(c.code),c);
        if(result[2].status==='fulfilled')erPlayerNames=result[2].value;
        if(result[3].status==='fulfilled')erPlayerEquipment=result[3].value;
        if(result[4].status==='fulfilled')erTactical=new Map((result[4].value.data||[]).map(s=>[String(s.group),s]));
        if(result[5].status==='fulfilled')erTraits=new Map((result[5].value.data||[]).map(s=>[String(s.group),s]));
        erEnhancePlayer(document);
    });
    const render=()=>{
        const filtered=rows.filter(r=>!selectedMode || String(r.matchingMode)===selectedMode);
        records.innerHTML=filtered.length ? filtered.map(r=>erPlayerCard(r)).join('') : '<p class="empty-state">이 모드의 최근 전적이 없습니다.</p>';
        for(const row of filtered)matchDetailLoaders.set(String(row.gameId),()=>erRenderGame(row.gameId));
        erEnhancePlayer(records);
    };
    document.querySelectorAll('[data-match-mode]').forEach(button=>button.onclick=()=>{selectedMode=button.dataset.matchMode;document.querySelectorAll('[data-match-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
    document.querySelector('#refresh').onclick=()=>location.reload();
    const rankPanel=document.querySelector('#rank-panel');
    erRequest('/er/userRank?userNum='+encoded).then(async data=>{
        const row=data.userStats?.[0];
        if(!row){rankPanel.innerHTML='<p class="empty-state">이번 시즌 랭크 기록이 없습니다.</p>';return;}
        const metric=(label,value)=>'<div><span>'+label+'</span><strong>'+value+'</strong></div>';
        rankPanel.innerHTML='<div class="rank-score"><small>현재 시즌 · 스쿼드</small><strong>'+erNumber(row.mmr)+' <span>RP</span></strong><p>순위 '+(Number(row.rank)>0?erNumber(row.rank)+'위':'—')+'</p></div><div class="profile-metrics">'+metric('게임 수',erNumber(row.totalGames))+metric('승률',row.top1==null?'—':erNumber(row.top1*100,1)+'%')+metric('평균 킬',erNumber(row.averageKills,2))+metric('평균 어시스트',erNumber(row.averageAssistants,2))+metric('TOP 3',row.top3==null?'—':erNumber(row.top3*100,1)+'%')+metric('평균 순위',erNumber(row.averageRank,1))+'</div>';
        await metadata;
        const stats=Array.isArray(row.characterStats)?row.characterStats:[];
        document.querySelector('#player-characters').innerHTML=stats.slice().sort((a,b)=>b.usages-a.usages).slice(0,5).map(s=>{
            const c=erPlayerCharacters.get(String(s.characterCode));
            return '<a class="played-character" href="/er/characters/'+encodeURIComponent(c?.name||s.characterCode)+'"><img alt="" src="'+erText(erCharacterImage(c?.name))+'"><span>' +erText(erPlayerNames.get('Character/Name/'+s.characterCode)||c?.name||'실험체')+'<small>'+erNumber(s.usages)+'게임</small></span><strong>'+(s.usages?erNumber(s.wins/s.usages*100,1)+'%':'—')+'</strong></a>';
        }).join('')||'<p class="empty-state">실험체 기록이 없습니다.</p>';
    }).catch(()=>{rankPanel.innerHTML='<p class="empty-state">랭크 정보를 불러오지 못했습니다.</p>';});
    try {
        const data=await erRequest('/er/user/detail?userNum='+encoded);
        if(!Array.isArray(data.userGames))throw new Error('최근 전적 응답을 확인할 수 없습니다.');
        rows=data.userGames.slice(0,10);
        if(rows[0]){
            document.querySelector('#nickname').textContent=rows[0].nickname || '플레이어';
            document.querySelector('#userLevel').textContent='레벨 '+erNumber(rows[0].accountLevel);
            const img=document.querySelector('#detailImage');img.dataset.character=String(rows[0].characterNum);img.dataset.skin=String(rows[0].skinCode||0);
            document.querySelector('#recent-summary').innerHTML='<strong>'+rows.length+'게임</strong> · '+rows.filter(r=>Number(r.gameRank)===1).length+'승 · 평균 피해 '+erNumber(rows.reduce((sum,r)=>sum+Number(r.damageToPlayer||0),0)/rows.length);
        }
        render();
        erEnhancePlayer(document);
    }catch(error){records.innerHTML='<p class="empty-state">'+erText(error.message)+'</p>';}
}
document.addEventListener('DOMContentLoaded',startPlayer);
