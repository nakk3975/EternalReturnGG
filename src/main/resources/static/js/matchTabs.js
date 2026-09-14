'use strict';
const erMatchTabGames=new Map();
const erDetailTabs=[['rank','순위'],['build','빌드/스탯'],['kills','킬 정보'],['graph','그래프'],['traits','특성'],['credit','크레딧'],['cube','큐브/LUMI']];
const erDetailGroupNames={Havoc:'파괴',Fortification:'저항',Support:'지원',Chaos:'혼돈'};
function erDetailObject(value){
    if(typeof value==='string'){try{value=JSON.parse(value);}catch(_){return {};}}
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
}
function erDetailSection(title,content){return '<section class="detail-section"><h3>'+erText(title)+'</h3><div class="detail-section-body">'+content+'</div></section>';}
function erDetailMetrics(row,fields){return '<dl class="detail-stat-grid">'+fields.map(([key,label,digits=0])=>'<div><dd>'+erNumber(row[key],digits)+'</dd><dt>'+erText(label)+'</dt></div>').join('')+'</dl>';}
function erDetailPortrait(row){
    const c=erPlayerCharacters.get(String(row.characterNum));
    return '<img class="detail-avatar" data-character="'+erText(row.characterNum)+'" data-skin="'+erText(row.skinCode||0)+'" src="'+erText(erCharacterImage(c?.name,row.skinCode))+'" alt="'+erText(erPlayerNames.get('Character/Name/'+row.characterNum)||c?.name||'실험체')+'">';
}
function erMatchTabs(teams,ownRow){
    const key=String(ownRow.gameId);
    const rows=teams.flat();
    const own={...ownRow,...(rows.find(r=>erOwnPlayer(r,ownRow))||{})};
    erMatchTabGames.set(key,{teams,own,graphMode:'earned',hiddenTeams:new Set()});
    const stamp=new Date(own.startDtm);
    const date=Number.isNaN(stamp.getTime())?'':stamp.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
    const version=erFinite(own.versionSeason)&&erFinite(own.versionMajor)?' (v'+own.versionSeason+'.'+own.versionMajor+')':'';
    return '<div class="match-tab-view" data-detail-game="'+erText(key)+'"><div class="match-meta">게임 ID <strong>'+erText(key)+'</strong>'+erText(version)+' <span>· '+erText(date)+' · '+erText(own.serverName||'')+'</span></div><div class="match-detail-tabs" role="tablist" aria-label="경기 상세">'+erDetailTabs.map(([id,label],i)=>'<button type="button" role="tab" id="detail-tab-'+erText(key)+'-'+id+'" aria-controls="detail-panel-'+erText(key)+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'" data-detail-tab="'+id+'">'+label+'</button>').join('')+'</div><div role="tabpanel" id="detail-panel-'+erText(key)+'" aria-labelledby="detail-tab-'+erText(key)+'-rank" tabindex="0" class="match-tab-panel">'+erTeamScoreboard(teams,own)+'</div></div>';
}
function erDetailBuild(row){
    const mastery=erDetailObject(row.masteryLevel);
    const weapons=Object.keys(mastery).filter(k=>erWeaponInfo(k)).map(k=>[k,erWeaponInfo(k)[1]]);
    let out=erDetailSection('스킬 빌드',erSkillOrder(row)||'<p class="data-note">스킬 순서가 제공되지 않은 경기입니다.</p>');
    out+=erDetailSection('최종 아이템 빌드','<div class="detail-equipment">'+erEquipmentHtml(row.equipment)+'</div>');
    out+=erDetailSection('무기 숙련도',weapons.length?erDetailMetrics(mastery,weapons):'<p class="data-note">무기 숙련도 미제공</p>');
    out+=erDetailSection('숙련도',erDetailMetrics(mastery,[['201','방어'],['202','사냥'],['101','제작'],['102','탐색'],['103','이동']]));
    out+=erDetailSection('제작',erDetailMetrics(row,[['craftUncommon','고급'],['craftRare','희귀'],['craftEpic','영웅'],['craftLegend','전설'],['craftMythic','초월']]));
    out+=erDetailSection('피해량',erDetailMetrics(row,[['damageToPlayer','총 피해량 (생존자)'],['damageToPlayer_basic','기본 공격 피해량'],['damageToPlayer_skill','스킬 피해량'],['damageToPlayer_direct','고정 피해량'],['damageToPlayer_itemSkill','아이템 피해량'],['damageToMonster','야생동물 피해량'],['monsterKill','야생동물 처치'],['damageFromPlayer','받은 피해량'],['healAmount','회복량'],['protectAbsorb','보호막 흡수']]));
    out+=erDetailSection('스탯',erDetailMetrics(row,[['maxHp','최대 체력'],['maxSp','최대 스태미나'],['attackPower','공격력'],['defense','방어력'],['hpRegen','체력 재생',2],['spRegen','스태미나 재생',2],['attackSpeed','공격 속도',2],['moveSpeed','이동 속도',2],['sightRange','시야 범위',2],['attackRange','기본 공격 사거리',2],['skillAmp','스킬 증폭'],['lifeSteal','피해 흡혈',2],['criticalStrikeChance','치명타 확률',2],['coolDownReduction','쿨다운 감소',2]]));
    out+=erDetailSection('플레이 기록',erDetailMetrics(row,[['addTelephotoCamera','망원 카메라 설치'],['removeTelephotoCamera','망원 카메라 제거'],['useHyperLoop','하이퍼루프'],['useSecurityConsole','보안 콘솔'],['fishingCount','낚시'],['tacticalSkillUseCount','전술 스킬 사용']]));
    return out+'<p class="detail-footnote">— 는 API 미제공 값입니다. 스탯은 경기 종료 시 기록 기준입니다.</p>';
}
const erDetailAreas={10:'항구',20:'창고',30:'연못',40:'개울',50:'모래사장',60:'고급 주택가',70:'골목길',80:'주유소',90:'호텔',100:'경찰서',110:'소방서',120:'병원',130:'절',140:'양궁장',150:'묘지',160:'숲',170:'공장',180:'성당',190:'학교',200:'바지선',1000:'연구소'};
function erDetailKillEvents(rows,killer){
    const events=[];
    for(const victim of rows)for(const suffix of ['', '2','3']){
        if(victim['killer'+suffix]==='player'&&victim['killDetail'+suffix]===killer.nickname){
            events.push({victim,area:erDetailAreas[victim['placeOfDeath'+suffix]]||'지역 미제공'});
        }
    }
    return events;
}
function erDetailKills(teams,ownRow={}){
    const all=teams.flat();
    return '<p class="detail-footnote">API에 남아 있는 사망 기록(플레이어별 최대 3개)을 역조회한 로그입니다. 전체 킬·시간순 로그와 다를 수 있습니다.</p><div class="team-scoreboard-scroll"><table class="detail-kills-table"><thead><tr><th>#</th><th>플레이어</th><th>킬</th><th>확인된 처치 기록</th></tr></thead>'+teams.slice().sort((a,b)=>(a[0].gameRank??999)-(b[0].gameRank??999)).map(team=>'<tbody class="score-team '+(erOwnTeam(team[0],ownRow)?'score-own-team':'')+'">'+team.map((row,i)=>{
        const events=erDetailKillEvents(all,row);
        const aggregate=Object.entries(erDetailObject(row.killDetails)).filter(([,n])=>Number(n)>0);
        const summary=aggregate.map(([code,n])=>erText(erPlayerNames.get('Character/Name/'+code)||erPlayerCharacters.get(String(code))?.name||'실험체 '+code)+' '+erNumber(n)+'회').join(' · ');
        return '<tr>'+(i===0?erTeamPlacement(team,ownRow):'')+'<td><div class="detail-kill-player">'+erDetailPortrait(row)+'<div class="score-nickname">'+erScorePlayerLink(row)+erParticipantBadges(row,team,all,ownRow)+'</div></div></td><td>'+erNumber(row.playerKill)+'킬</td><td>'+events.map(({victim,area})=>'<div class="detail-kill-event"><small>#'+erNumber(victim.gameRank)+'</small>'+erDetailPortrait(victim)+'<div class="score-nickname">'+erScorePlayerLink(victim)+'</div><span>'+erText(area)+'</span></div>').join('')+(events.length?'':'<p class="data-note">확인 가능한 개별 처치 로그 없음</p>')+(summary?'<small class="detail-kill-summary">캐릭터별 총 처치: '+summary+'</small>':'')+'</td></tr>';
    }).join('')+'</tbody>').join('')+'</table></div>';
}
function erCreditSeries(row,mode){
    const earned=row.totalVFCredits??row.totalVFCredit;
    const used=row.usedVFCredits??row.usedVFCredit;
    const source=mode==='spent'?used:earned;
    if(!Array.isArray(source)||!source.length)return null;
    const length=erFinite(row.duration??row.totalTime)?Math.min(source.length,Math.max(1,Math.ceil(Number(row.duration??row.totalTime)/60))):source.length;
    let sum=0;
    const result=[0];
    for(const value of source.slice(0,length)){if(!erFinite(value)||Number(value)<0)return null;sum+=Number(value);result.push(sum);}
    return result;
}
function erDetailGraph(state){
    const mode=state.graphMode;
    const colors=['#0ab58d','#287fce','#6959b3','#d18b56','#b74b78','#568e89','#8a9649','#72849b'];
    const series=state.teams.slice().sort((a,b)=>(a[0].gameRank??999)-(b[0].gameRank??999)).map((team,i)=>{
        const members=team.map(r=>erCreditSeries(r,mode));
        if(members.some(v=>v===null))return null;
        const length=Math.max(...members.map(v=>v.length));
        const points=Array.from({length},(_,t)=>members.reduce((sum,v)=>sum+v[Math.min(t,v.length-1)],0)/(mode==='team'?1:members.length));
        return {team,points,color:colors[i%colors.length],id:String(team[0].teamNumber??i)};
    }).filter(Boolean);
    const tabs='<div class="credit-graph-tabs" role="group" aria-label="크레딧 그래프 종류">'+[['earned','획득한 크레딧'],['spent','사용한 크레딧'],['team','팀원 크레딧']].map(([key,label])=>'<button data-credit-mode="'+key+'" aria-pressed="'+(mode===key)+'">'+label+'</button>').join('')+'</div>';
    if(!series.length)return tabs+'<p class="empty-state">분 단위 크레딧 기록이 제공되지 않은 경기입니다.</p>';
    const maxTime=Math.max(1,...series.map(s=>s.points.length-1));
    const max=Math.max(100,...series.flatMap(s=>s.points));
    const top=Math.ceil(max/500)*500;
    const x=t=>48+t*510/maxTime,y=v=>258-v*224/top;
    const grid=Array.from({length:6},(_,i)=>{const value=top*i/5;return '<line x1="48" x2="558" y1="'+y(value)+'" y2="'+y(value)+'"/><text x="40" y="'+(y(value)+4)+'" text-anchor="end">'+erNumber(value)+'</text>';}).join('');
    const step=Math.max(1,Math.ceil(maxTime/10));
    const ticks=Array.from({length:Math.floor(maxTime/step)+1},(_,i)=>'<text x="'+x(i*step)+'" y="282" text-anchor="middle">'+(i*step)+'분</text>').join('');
    const lines=series.filter(s=>!state.hiddenTeams.has(s.id)).map(s=>'<g><polyline fill="none" stroke="'+s.color+'" stroke-width="2.5" points="'+s.points.map((v,i)=>x(i)+','+y(v)).join(' ')+'"/>'+s.points.map((v,i)=>'<circle tabindex="0" cx="'+x(i)+'" cy="'+y(v)+'" r="3" fill="'+s.color+'"><title>#'+erNumber(s.team[0].gameRank)+' · '+i+'분 · '+erNumber(v)+' 크레딧</title></circle>').join('')+'</g>').join('');
    return tabs+'<div class="credit-chart-layout"><svg viewBox="0 0 580 300" role="img" aria-label="경기 시간별 누적 크레딧"><g class="credit-chart-grid">'+grid+ticks+'</g>'+lines+'</svg><div class="credit-chart-legend">'+series.map(s=>'<button data-credit-team="'+erText(s.id)+'" aria-pressed="'+!state.hiddenTeams.has(s.id)+'" style="--team-color:'+s.color+'"><strong>#'+erNumber(s.team[0].gameRank)+'</strong>'+s.team.map(erDetailPortrait).join('')+'</button>').join('')+'</div></div><p class="detail-footnote">'+(mode==='team'?'팀원 크레딧: 팀 전체 누적 획득 합계':'팀별 1인 평균 누적 '+(mode==='spent'?'사용':'획득')+' 크레딧')+' · 분별 기록 기준 · 오른쪽 팀을 눌러 표시를 전환할 수 있습니다.</p>';
}
function erTraitName(code){return erPlayerNames.get('Trait/Name/'+code)||erPlayerNames.get('Skill/Group/Name/'+(Number(code)-1))||'특성 '+code;}
function erTraitNode(code,selected=true){return '<span class="detail-trait-node '+(selected?'selected':'inactive')+'" title="'+erText(erTraitName(code))+'"><span data-trait="'+erText(code)+'"></span></span>';}
function erDetailTraits(row){
    const selected=[row.traitFirstCore,...(row.traitFirstSub||[]),...(row.traitSecondSub||[])].filter(c=>erFinite(c)&&Number(c)<7400000);
    if(!selected.length)return '<p class="empty-state">이 경기에는 표시할 특성 기록이 없습니다.</p>';
    const groups=[...new Set(selected.map(c=>erTraits.get(String(c))?.traitGroup).filter(Boolean))];
    const tree=groups.map(group=>{
        const choices=[...erTraits.values()].filter(t=>t.traitGroup===group&&Number(t.code)<7400000&&['Core','Sub1','Sub2'].includes(t.traitType));
        return '<section class="detail-trait-group"><h4>'+erText(erDetailGroupNames[group]||group)+'</h4>'+['Core','Sub1','Sub2'].map(type=>'<div class="detail-trait-tier">'+choices.filter(t=>t.traitType===type).map(t=>erTraitNode(t.code,selected.some(c=>String(c)===String(t.code)))).join('')+'</div>').join('')+'</section>';
    }).join('');
    const list=selected.map((code,i)=>'<div class="detail-selected-trait">'+erTraitNode(code)+'<div><strong>'+erText(erTraitName(code))+'</strong><small>'+erText(erDetailGroupNames[erTraits.get(String(code))?.traitGroup]||'특성')+(i===0?' · 핵심':' · 보조')+'</small></div></div>').join('');
    return erDetailSection('특성','<div class="detail-trait-layout"><div>'+(tree||selected.map(c=>erTraitNode(c)).join(''))+'</div><div>'+list+'</div></div>');
}
function erDetailItemList(codes){
    if(!Array.isArray(codes))return '<p class="data-note">기록 미제공</p>';
    if(!codes.length)return '<p class="data-note">사용 기록 없음</p>';
    return '<div class="detail-transferred-items">'+codes.map(code=>'<a href="/er/items/'+encodeURIComponent(code)+'">'+erEquipmentHtml({0:code})+'</a>').join('')+'</div>';
}
function erDetailCredit(row){
    const source=erDetailObject(row.creditSource);
    const earn=[['PreliminaryPhase','시작 시 획득'],['KillPlayerMerge','킬'],['KillAssistDivideContribute','킬/어시스트'],['ItemBounty','현상금'],['ItemBountyByItemCode','아이템 현상금'],['TimeElapsedCompensationByMiliSecond','생존 시간'],['TimeElapsedCreditBonusByMiliSecond','생존 시간 보너스'],['KillChicken','닭 처치'],['KillBat','박쥐 처치'],['KillBoar','멧돼지 처치'],['KillWildDog','들개 처치'],['KillWolf','늑대 처치'],['KillBear','곰 처치'],['KillRaven','까마귀 처치'],['KillMutantChicken','변이 닭 처치'],['KillMutantBat','변이 박쥐 처치'],['KillMutantBoar','변이 멧돼지 처치'],['KillMutantWildDog','변이 들개 처치'],['KillMutantWolf','변이 늑대 처치'],['KillMutantBear','변이 곰 처치'],['KillMutantRaven','변이 까마귀 처치'],['KillAlpha','알파 처치'],['KillOmega','오메가 처치'],['KillWickline','위클라인 처치'],['AcquireLumiCredit','LUMI 크레딧']];
    // creditSource is a sparse event map: an omitted category means no such event.
    const events=Object.keys(source).length?Object.fromEntries(earn.map(([k])=>[k,source[k]??0])):{};
    return '<div class="detail-credit-items">'+erDetailSection('원격 드론',erDetailItemList(row.itemTransferredDrone))+erDetailSection('전송 콘솔',erDetailItemList(row.itemTransferredConsole))+'</div>'+erDetailSection('획득',erDetailMetrics(row,[['totalGainVFCredit','총 획득 크레딧']])+erDetailMetrics(events,earn))+erDetailSection('소비',erDetailMetrics(row,[['totalUseVFCredit','총 사용 크레딧'],['remoteDroneUseVFCreditMySelf','원격 드론 (본인)'],['remoteDroneUseVFCreditAlly','원격 드론 (팀원)'],['kioskFromMaterialUseVFCredit','특수 재료'],['tacticalSkillUpgradeUseVFCredit','전술 스킬 강화'],['kioskFromRevivalUseVFCredit','팀원 부활'],['kioskFromEscapeKeyUseVFCredit','탈출 키'],['crUseMythril','미스릴'],['crUseRootkit','루트킷']]))+'<p class="detail-footnote">처치 보상 크레딧은 팀원에게 분배될 수 있으며, 직접 처치 여부와는 다릅니다.</p>';
}
function erDetailCubes(row){
    const cubes=[['Red','선혈'],['Purple','우주'],['Green','생명'],['Gold','풍요'],['SkyBlue','바람']];
    return erDetailSection('큐브','<div class="detail-cubes">'+cubes.map(([color,name])=>'<div><span class="detail-cube cube-'+color+'" aria-hidden="true">◆</span><strong>×'+erNumber(row['getBuffCube'+color])+'</strong><small>'+name+'</small></div>').join('')+'</div>')+erDetailSection('LUMI',erDetailMetrics({lumiCredit:erDetailObject(row.creditSource).AcquireLumiCredit},[['lumiCredit','LUMI로 얻은 크레딧']])+'<p class="data-note">LUMI 사용 횟수·피해량·아이템 등급별 획득 수는 현재 API 응답에 제공되지 않습니다.</p>');
}
function erRenderDetailTab(state,key){
    switch(key){case 'rank':return erTeamScoreboard(state.teams,state.own);case 'build':return erDetailBuild(state.own);case 'kills':return erDetailKills(state.teams,state.own);case 'graph':return erDetailGraph(state);case 'traits':return erDetailTraits(state.own);case 'credit':return erDetailCredit(state.own);case 'cube':return erDetailCubes(state.own);default:return '';}
}
function erSelectDetailTab(view,key){
    const state=erMatchTabGames.get(view.dataset.detailGame);if(!state)return;
    view.querySelectorAll('[data-detail-tab]').forEach(b=>{const active=b.dataset.detailTab===key;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    const panel=view.querySelector('.match-tab-panel');panel.setAttribute('aria-labelledby','detail-tab-'+view.dataset.detailGame+'-'+key);panel.innerHTML=erRenderDetailTab(state,key);erEnhancePlayer(panel);
}
document.addEventListener('click',event=>{
    const control=event.target.closest('[data-detail-tab],[data-credit-mode],[data-credit-team]');if(!control)return;
    const view=control.closest('.match-tab-view');if(!view)return;
    const state=erMatchTabGames.get(view.dataset.detailGame);if(!state)return;
    if(control.dataset.detailTab){erSelectDetailTab(view,control.dataset.detailTab);return;}
    if(control.dataset.creditMode)state.graphMode=control.dataset.creditMode;
    if(control.dataset.creditTeam){const id=control.dataset.creditTeam;if(state.hiddenTeams.has(id))state.hiddenTeams.delete(id);else state.hiddenTeams.add(id);}
    erSelectDetailTab(view,'graph');
});
document.addEventListener('keydown',event=>{
    const tab=event.target.closest('[data-detail-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const view=tab.closest('.match-tab-view'),tabs=[...view.querySelectorAll('[data-detail-tab]')];let i=tabs.indexOf(tab);
    i=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    event.preventDefault();tabs[i].focus();erSelectDetailTab(view,tabs[i].dataset.detailTab);
});
