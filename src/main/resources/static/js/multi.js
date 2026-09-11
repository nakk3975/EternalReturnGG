'use strict';
function erMultiSummary(rows,mode) {
    const games=rows.filter(r=>String(r.matchingMode)===String(mode)).slice(0,10);
    const average=field=>{const values=games.map(field).filter(erFinite).map(Number);return values.length?values.reduce((a,b)=>a+b,0)/values.length:null;};
    return {games,rank:average(r=>r.gameRank),tk:average(r=>r.teamKill??r.totalFieldKill),damage:average(r=>r.damageToPlayer)};
}
async function startMulti() {
    const controls=document.querySelector('#explorer-controls'),status=document.querySelector('#explorer-status'),results=document.querySelector('#explorer-results');
    document.querySelector('.explorer').classList.add('multi-page');
    results.className='multi-results';
    controls.innerHTML='<form id="multi-form"><label for="nicknames">비교할 플레이어</label><textarea id="nicknames" maxlength="300" placeholder="닉네임을 쉼표 또는 줄바꿈으로 구분해 주세요 (최대 5명)" required></textarea><button type="submit">전적 비교</button></form>';
    const tabs=document.createElement('div');tabs.className='multi-modes';tabs.setAttribute('aria-label','비교할 경기 모드');
    tabs.innerHTML=[[3,'랭크'],[9,'론울프'],[2,'일반'],[6,'코발트']].map(([id,name])=>'<button data-mode="'+id+'" aria-pressed="'+(id===3)+'">'+name+'</button>').join('')+'<button disabled title="공식 API에서 개별 경기 모드 구분 미지원">유니온 · 미지원</button><button disabled title="공식 API에서 개별 경기 모드 구분 미지원">코발트 유니온 · 미지원</button>';
    results.before(tabs);
    const detail=document.createElement('section');detail.className='multi-detail surface';detail.hidden=true;results.after(detail);
    let players=[],mode='3',selected=0,generation=0,characters=new Map(),names=new Map();
    status.textContent='조회된 전적 중 모드별 최근 10경기를 비교합니다.';
    const assetReady=loadAssetConfig();
    Promise.allSettled([assetReady,erStatic('/er/character'),erDictionary()]).then(values=>{
        if(values[1].status==='fulfilled')characters=new Map((values[1].value.data||[]).map(c=>[String(c.code),c]));
        if(values[2].status==='fulfilled')names=values[2].value;
        render();
    });
    const characterName=code=>names.get('Character/Name/'+code)||characters.get(String(code))?.name||'실험체';
    const portrait=code=>erCharacterImage(characters.get(String(code))?.name);
    const render=()=>{
        results.innerHTML=players.map((p,index)=>{
            if(p.error)return '<article class="multi-card"><h2>'+erText(p.nickname)+'</h2><p class="multi-empty">'+erText(p.error)+'</p></article>';
            const stats=p.stats,summary=erMultiSummary(p.games||[],mode),tier=stats?erTier(stats):null;
            const most=stats?.characterStats?.slice().sort((a,b)=>b.usages-a.usages)[0]?.characterCode??p.games?.[0]?.characterNum;
            const link=p.userId?erPlayerLink(p):null;
            const heading='<img src="'+erText(portrait(most))+'" alt="'+erText(characterName(most))+'"><strong>'+erText(p.nickname)+'</strong><span aria-hidden="true">↗</span>';
            return '<article class="multi-card '+(index===selected?'selected':'')+'" tabindex="0" role="button" aria-pressed="'+(index===selected)+'" data-player-index="'+index+'">'+(link?'<a class="multi-player" href="'+link+'" target="_blank" rel="noopener">'+heading+'</a>':'<div class="multi-player">'+heading+'</div>')+'<div class="multi-rank">'+(tier?'<img src="https://cdn.dak.gg/er/images/tier/full/'+tier.image+'.png" alt="">':'')+'<span>'+erText(tier?.name||(p.loading?'조회 중…':'시즌 랭크 기록 없음'))+'</span><strong>'+(stats?erNumber(stats.mmr)+' RP':'—')+'</strong></div><div class="multi-match-label">최근 '+summary.games.length+' 매치</div><dl class="multi-metrics"><dt>평균 순위</dt><dd>'+(summary.rank==null?'—':'#'+erNumber(summary.rank,1))+'</dd><dt>평균 TK</dt><dd>'+erNumber(summary.tk,1)+'</dd><dt>평균 딜량</dt><dd>'+erNumber(summary.damage)+'</dd></dl><div class="multi-placements">'+summary.games.slice().reverse().map(g=>'<span title="경기 #'+erText(g.gameId)+'" class="'+(Number(g.gameRank)===1?'win':Number(g.gameRank)<=3?'top':'')+'">'+erNumber(g.gameRank)+'</span>').join('')+'</div>'+(p.loading?'<p class="multi-note">전적을 불러오는 중…</p>':!summary.games.length?'<p class="multi-note">조회된 전적에 이 모드의 경기가 없습니다.</p>':'')+(p.next?'<button class="multi-more" data-more="'+index+'" '+(p.paging?'disabled':'')+'>'+(p.paging?'불러오는 중…':'전적 더 불러오기')+'</button>':'')+(p.warning?'<p class="multi-note">'+erText(p.warning)+'</p>':'')+'</article>';
        }).join('');
        const current=players[selected];detail.hidden=!current?.stats;
        if(current?.stats){
            detail.innerHTML='<h2>'+erText(current.nickname)+' <span>시즌 랭크 실험체 통계</span></h2><div class="multi-character-grid">'+(current.stats.characterStats||[]).slice().sort((a,b)=>b.usages-a.usages).slice(0,5).map(c=>'<a href="/er/characters/'+encodeURIComponent(characters.get(String(c.characterCode))?.name||c.characterCode)+'"><img src="'+erText(portrait(c.characterCode))+'" alt=""><div><strong>'+erText(characterName(c.characterCode))+'</strong><small>'+erNumber(c.usages)+'게임 · 승률 '+(c.usages?erNumber(c.wins/c.usages*100,1)+'%':'—')+'</small></div></a>').join('')+'</div>';
        }
    };
    tabs.addEventListener('click',event=>{const button=event.target.closest('[data-mode]');if(!button)return;mode=button.dataset.mode;tabs.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
    const select=event=>{
        if(event.target.closest('a,button'))return;
        const card=event.target.closest('[data-player-index]');if(!card)return;
        if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
        event.preventDefault();selected=Number(card.dataset.playerIndex);render();
    };
    results.addEventListener('click',select);results.addEventListener('keydown',select);
    results.addEventListener('click',async event=>{
        const button=event.target.closest('[data-more]');if(!button)return;
        const p=players[Number(button.dataset.more)];if(!p?.next||p.paging)return;
        p.paging=true;render();
        try{const page=await erRequest('/er/user/detail?userNum='+encodeURIComponent(p.userId)+'&next='+encodeURIComponent(p.next));if(!Array.isArray(page.userGames))throw new Error();const ids=new Set(p.games.map(g=>String(g.gameId)));const added=page.userGames.filter(g=>!ids.has(String(g.gameId)));p.games.push(...added);p.next=added.length&&String(page.next)!==String(p.next)?page.next||null:null;p.warning='';}
        catch(_){p.warning='추가 조회 실패 · 다시 시도해 주세요.';}finally{p.paging=false;render();}
    });
    const form=controls.querySelector('form');form.querySelector('textarea').value=new URLSearchParams(location.search).get('names')||'';
    form.addEventListener('submit',async event=>{
        event.preventDefault();const input=[...new Set(form.querySelector('textarea').value.split(/[,\n]/).map(n=>n.trim()).filter(Boolean))];
        if(!input.length||input.length>5){status.textContent='닉네임을 1~5개 입력해 주세요.';return;}
        const run=++generation;selected=0;players=input.map(nickname=>({nickname,games:[],loading:true}));render();
        status.textContent='플레이어를 비교하는 중입니다.';
        await Promise.all(players.map(async p=>{
            try{
                const data=await erRequest('/er/search/nickname?nickname='+encodeURIComponent(p.nickname));if(!data.user?.userId)throw new Error('플레이어를 찾지 못했습니다.');
                p.userId=data.user.userId;p.nickname=data.user.nickname||p.nickname;
                await Promise.allSettled([
                    erRequest('/er/userRank?userNum='+encodeURIComponent(p.userId)).then(r=>{p.stats=r.userStats?.[0];if(run===generation)render();}),
                    erRequest('/er/user/detail?userNum='+encodeURIComponent(p.userId)).then(r=>{if(!Array.isArray(r.userGames))throw new Error();p.games=r.userGames;p.next=r.next||null;if(run===generation)render();}).catch(()=>{p.warning='최근 전적 조회에 실패했습니다. 다시 검색해 주세요.';})
                ]);
            }catch(e){p.error=e.message;}finally{p.loading=false;if(run===generation)render();}
        }));
        if(run===generation)status.textContent=input.length+'명 비교 · 조회된 전적 중 모드별 최근 10경기';
    });
}
