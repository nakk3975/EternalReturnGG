function erSeasonOptions(rows){
    return (rows||[]).map(s=>({id:Number(s.seasonID??s.seasonId??s.id),name:String(s.seasonName??s.name??''),current:s.isCurrent===true||Number(s.isCurrent)===1})).filter(s=>s.id>0).sort((a,b)=>b.id-a.id);
}
function erSeasonNumber(s){const n=Number(s.name.match(/\d+/)?.[0]);return n>0?(s.id>=18?n-9:n):null;}
function erSeasonLabel(s){const n=erSeasonNumber(s);if(!n)return '시즌 ID '+s.id;return (s.id<18?'얼리액세스 ':'')+(/pre/i.test(s.name)?'프리시즌 ':'시즌 ')+n;}

function erSeasonReport(data,season,characters,names){
    const row=(data.userStats||[]).find(r=>Number(r.seasonId)===season.id)||data.userStats?.[0];
    if(!row||!(Number(row.totalGames)>0))return '<p class="empty-state">'+erText(erSeasonLabel(season))+'의 랭크 기록이 없습니다.</p>';
    // Earlier seasons had different RP thresholds; never apply today's bands silently.
    const number=erSeasonNumber(season);
    const tier=season.current||(season.id>=18&&number>=11)?erTier(row):null;
    const metric=(label,value)=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>';
    const chars=(row.characterStats||[]).slice().sort((a,b)=>Number(b.usages??b.totalGames)-Number(a.usages??a.totalGames)).slice(0,5);
    return '<div class="season-score">'+(tier?'<img width="72" height="72" src="https://cdn.dak.gg/er/images/tier/full/'+tier.image+'.png" alt="'+erText(tier.name)+'">':'')+'<div><h3>'+erText(erSeasonLabel(season))+'</h3><strong>'+erNumber(row.mmr)+' RP</strong><p>'+erText(tier?.name||'과거 시즌 티어 기준 미확인')+' · '+(Number(row.rank)>0?erNumber(row.rank)+'위':'순위 미제공')+'</p></div></div><div class="season-metrics">'+metric('플레이 수',erNumber(row.totalGames))+metric('승률',erNumber(row.totalWins/row.totalGames*100,1)+'%')+metric('승리',erNumber(row.totalWins))+metric('평균 킬',erNumber(row.averageKills,2))+metric('평균 순위',erNumber(row.averageRank,2))+metric('TOP 3',row.top3==null?'—':erNumber(row.top3*100,1)+'%')+'</div><div class="season-characters">'+chars.map(c=>{const code=String(c.characterCode),meta=characters.get(code),name=names.get('Character/Name/'+code)||meta?.name||'실험체';return '<a href="/er/characters/'+encodeURIComponent(meta?.name||code)+'"><img width="36" height="36" loading="lazy" src="'+erText(erCharacterImage(meta?.name))+'" alt=""><span>'+erText(name)+'<small>'+erNumber(c.usages??c.totalGames)+'게임</small></span></a>';}).join('')+'</div>';
}
async function erStartSeasonHistory(){
    const host=document.querySelector('#season-history');if(!host)return;
    const params=new URLSearchParams(location.search);let uid=params.get('userNum');
    try{
        if(!uid&&params.get('nickname')){const d=await erRequest('/er/search/nickname?nickname='+encodeURIComponent(params.get('nickname')));uid=d.user?.userId||d.user?.uid;}
        if(!uid)return;
        void loadAssetConfig();
        const [data,characters,names]=await Promise.all([erStatic('/er/seasons'),erStatic('/er/character'),erDictionary()]);
        const seasons=erSeasonOptions(data.data);if(!seasons.length)throw new Error('시즌 목록을 확인할 수 없습니다.');
        const current=seasons.find(s=>s.current)||seasons[0];
        const catalog=new Map((characters.data||[]).map(c=>[String(c.code),c]));
        host.innerHTML='<div class="season-toolbar"><h2>시즌 성적</h2><label>시즌 선택 <select id="profile-season">'+seasons.map(s=>'<option value="'+s.id+'"'+(s.id===current.id?' selected':'')+'>'+erText(erSeasonLabel(s))+'</option>').join('')+'</select></label></div><p class="data-note">선택한 시즌의 랭크 성적입니다. 아래 전적 목록은 최근 경기입니다.</p><div id="season-report" aria-live="polite"></div>';
        let generation=0;const saved=new Map();
        const draw=async()=>{const request=++generation,season=seasons.find(s=>s.id===Number(host.querySelector('select').value)),panel=host.querySelector('#season-report');panel.innerHTML='<p class="empty-state">시즌 성적을 불러오는 중…</p>';
            try{let result=saved.get(season.id);if(!result){result=await erRequest('/er/userRank?userNum='+encodeURIComponent(uid)+'&season='+season.id);saved.set(season.id,result);}if(request===generation)panel.innerHTML=erSeasonReport(result,season,catalog,names);}
            catch(e){if(request===generation)panel.innerHTML='<p class="empty-state">시즌 성적을 불러오지 못했습니다. <button type="button" id="season-retry">다시 시도</button></p>';const retry=host.querySelector('#season-retry');if(retry)retry.onclick=draw;}
        };host.querySelector('select').onchange=draw;await draw();
    }catch(e){host.innerHTML='<p class="empty-state">시즌 정보를 불러오지 못했습니다. 새로고침해 주세요.</p>';}
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',erStartSeasonHistory);
