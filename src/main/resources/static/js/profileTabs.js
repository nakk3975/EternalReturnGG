'use strict';
function erSkinUsage(rows){
 const counts=new Map();
 for(const row of rows||[]){if(!erFinite(row.characterNum)||!erFinite(row.skinCode))continue;const key=row.characterNum+':'+row.skinCode;const entry=counts.get(key)||{character:Number(row.characterNum),skin:Number(row.skinCode),games:0};entry.games++;counts.set(key,entry);}
 return [...counts.values()].sort((a,b)=>b.games-a.games||a.skin-b.skin);
}
function erProfileTabs(userId){
 const state={rows:[],stats:[],metrics:{},status:'collecting',skinCounts:{},skinGames:0};let tab='overview',skins=null,skinRequest=null;
 const content=document.querySelector('#profile-tab-content'),layout=document.querySelector('.player-layout'),history=document.querySelector('#season-history'),updated=document.querySelector('#profile-updated');
 const favorite=document.querySelector('#profile-favorite');
 const favorites=()=>{try{const a=JSON.parse(localStorage.getItem('ergg.favorites')||'[]');return Array.isArray(a)?a:[];}catch(_){return [];}};
 function favoriteLabel(){const saved=favorites().some(p=>p.userId===userId);favorite.textContent=saved?'★':'☆';favorite.setAttribute('aria-pressed',String(saved));favorite.setAttribute('aria-label',saved?'즐겨찾기 해제':'즐겨찾기 추가');}
 favorite.onclick=()=>{try{const all=favorites(),saved=all.some(p=>p.userId===userId),nickname=state.rows[0]?.nickname||state.rank?.nickname;if(!nickname)return;localStorage.setItem('ergg.favorites',JSON.stringify(saved?all.filter(p=>p.userId!==userId):[...all,{userId,nickname}].slice(-100)));favoriteLabel();}catch(_){updated.textContent='즐겨찾기를 저장할 수 없습니다.';}};favoriteLabel();
 function timestamp(){const date=new Date(state.snapshot?._fetchedAt);if(!Number.isFinite(date.getTime())){updated.textContent='최근 업데이트 시간 미제공';return;}const seconds=Math.max(0,Math.floor((Date.now()-date.getTime())/1000));updated.textContent='최근 업데이트: '+(seconds<60?'방금 전':seconds<3600?Math.floor(seconds/60)+'분 전':seconds<86400?Math.floor(seconds/3600)+'시간 전':date.toLocaleDateString('ko-KR'))+(state.snapshot._cacheStale?' · 저장된 전적, 갱신 중':'');updated.title=date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});}
 function render(){
  layout.hidden=!['overview','matches'].includes(tab);layout.classList.toggle('profile-matches-only',tab==='matches');history.hidden=tab!=='overview';content.hidden=['overview','matches'].includes(tab);
  if(tab==='characters')content.innerHTML='<h2>사용한 실험체</h2>'+erCharacterStatsTable(state.stats,state.metrics,state.status);
  if(tab==='skins'){
   const season=Object.keys(state.skinCounts).length>0;
   const usage=season?Object.entries(state.skinCounts).map(([key,games])=>({character:Number(key.split(':')[0]),skin:Number(key.split(':')[1]),games})).sort((a,b)=>b.games-a.games):erSkinUsage(state.rows);
   const total=usage.reduce((sum,r)=>sum+r.games,0);
   content.innerHTML='<h2>스킨 사용 통계</h2><p class="data-note">'+(season?'현재 시즌에서 집계한 '+total+'경기'+(state.status==='complete'?'':' · 집계 진행 중'):'불러온 최근 '+state.rows.length+'경기 기준')+' · 보유 스킨 목록이 아닌 실제 사용 기록입니다.</p><div class="profile-skins">'+usage.map(r=>{const c=erPlayerCharacters.get(String(r.character)),skin=skins?.get(String(r.skin)),name=erPlayerNames.get('Character/Name/'+r.character)||c?.name||'실험체';return '<article class="profile-skin"><img loading="lazy" src="'+erText(erCharacterImage(c?.name,r.skin))+'" alt="'+erText(name)+'"><strong>'+erText(skin?.name||name+(r.skin===0?' 기본 스킨':' · 스킨 '+r.skin))+'</strong><small>'+erNumber(r.games)+'게임 · '+erNumber(r.games/total*100,1)+'%</small></article>';}).join('')+'</div>'+(usage.length?'':'<p class="empty-state">아직 표시할 스킨 기록이 없습니다.</p>');
   if(!skinRequest)skinRequest=erStatic('/er/skin/info').then(body=>{skins=new Map((body.data||[]).map(r=>[String(r.code),r]));if(tab==='skins')render();}).catch(()=>{skinRequest=null;});
  }
 }
 const buttons=[...document.querySelectorAll('[data-profile-tab]')];
 buttons.forEach(button=>button.onclick=()=>{tab=button.dataset.profileTab;buttons.forEach(b=>b.setAttribute('aria-selected',String(b===button)));render();const url=new URL(location.href);url.hash=tab==='overview'?'':tab;window.history.replaceState(null,'',url);});
 const initial=buttons.find(b=>b.dataset.profileTab===location.hash.slice(1));if(initial)initial.click();
 return {update(value){Object.assign(state,value);if(value.snapshot)timestamp();if(!content.hidden)render();},message(text){updated.textContent=text;}};
}
