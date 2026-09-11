/* Shared item slots: local grade colors do not depend on CDN background images. */
const erGradeNames = {Common: '일반', Uncommon: '고급', Rare: '희귀', Epic: '영웅', Legend: '전설', Mythic: '초월'};
let erEquipmentPromise;
function erLoadEquipment() {
    if (!erEquipmentPromise) erEquipmentPromise = Promise.allSettled(['/er/weapon', '/er/armor'].map(async url => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch(url, {signal: controller.signal});
            if (!response.ok) throw new Error('장비 조회 실패');
            const body = await response.json();
            return Array.isArray(body.data) ? body.data : [];
        } finally { clearTimeout(timer); }
    })).then(results => new Map(results.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(item => [String(item.code), item])));
    return erEquipmentPromise;
}
function erApplyItemGrades(root, catalog) {
    root.querySelectorAll('[data-item-code]').forEach(slot => {
        const item = catalog.get(slot.dataset.itemCode);
        if(item)erHoverItems.set(String(item.code),item);
        if(!slot.closest('a,button'))slot.tabIndex=0;
        const grade = item?.itemGrade;
        slot.dataset.grade = Object.hasOwn(erGradeNames, grade) ? grade : 'Unknown';
        const label = (item?.name || '아이템 ' + slot.dataset.itemCode) + ' · ' + (erGradeNames[grade] || '등급 정보 없음');
        slot.title = label;
        const img = slot.querySelector('img');
        img?.setAttribute('alt', label);
        if (img && typeof erAssetBase !== 'undefined' && erAssetBase) {
            const src = erAssetBase + 'ItemIcon_' + slot.dataset.itemCode + '.png';
            if (img.getAttribute('src') !== src && img.dataset.assetBase !== erAssetBase) {
                delete img.dataset.fallback;
                img.dataset.assetBase = erAssetBase;
                img.src = src;
            }
        }
    });
}

const erItemStatLabels={attackPower:'공격력',attackPowerByLv:'레벨당 공격력',defense:'방어력',maxHp:'최대 체력',hpRegen:'체력 재생',skillAmp:'스킬 증폭',skillAmpByLevel:'레벨당 스킬 증폭',attackSpeedRatio:'공격 속도',criticalStrikeChance:'치명타 확률',cooldownReduction:'쿨다운 감소',moveSpeed:'이동 속도',moveSpeedRatio:'이동 속도',lifeSteal:'흡혈',sightRange:'시야',penetrationDefense:'방어 관통',penetrationDefenseRatio:'방어 관통',hpHealedIncreaseRatio:'받는 회복 증가'};
const erPercentItemStats=new Set(['attackSpeedRatio','criticalStrikeChance','cooldownReduction','moveSpeedRatio','lifeSteal','penetrationDefenseRatio','hpHealedIncreaseRatio']);
function erItemStats(item) {return Object.entries(erItemStatLabels).filter(([key])=>Number.isFinite(Number(item?.[key]))&&Number(item[key])!==0).map(([key,label])=>({label,value:(erPercentItemStats.has(key)?(Number(item[key])*100).toLocaleString('ko-KR',{maximumFractionDigits:2})+'%':Number(item[key]).toLocaleString('ko-KR',{maximumFractionDigits:2}))}));}
const erHoverItems=new Map();
let erItemTooltip,erHoverSlot;
async function erShowItemTooltip(slot) {
    erHoverSlot=slot;
    const names=typeof erDictionary==='function'?await erDictionary():new Map();
    if(erHoverSlot!==slot||!slot.isConnected)return;
    let item=erHoverItems.get(slot.dataset.itemCode);
    if(slot.dataset.itemCode&&!item){item=(await erLoadEquipment()).get(slot.dataset.itemCode);if(erHoverSlot!==slot)return;}
    const code=slot.dataset.skillCode;
    if(!item&&!code)return;
    const clean=text=>String(text||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/\\n/g,'\n');
    const title=item?(names.get('Item/Name/'+item.code)||item.name||item.code):(names.get('Skill/Group/Name/'+code)||slot.getAttribute('alt')||slot.title||'스킬 '+code);
    const description=item?(names.get('Item/Desc/'+item.code)||''):erSkillDescription(names,code);
    const category=item?(erGradeNames[item.itemGrade]||'아이템'):Number(code)>=7000000?'특성':Number(code)>=4000000?'전술 스킬':Number(code)>=2000000?'무기 스킬':'실험체 스킬';
    if(!erItemTooltip){erItemTooltip=document.createElement('div');erItemTooltip.id='item-tooltip';erItemTooltip.setAttribute('role','tooltip');document.body.append(erItemTooltip);}
    erItemTooltip.innerHTML='<strong>'+erText(title)+'</strong><small>'+erText(category)+'</small>'+(item?'<dl>'+erItemStats(item).map(s=>'<div><dt>'+erText(s.label)+'</dt><dd>'+erText(s.value)+'</dd></div>').join('')+'</dl>':'')+'<p>'+erText(clean(description)||(item?'':'현재 공식 데이터에 상세 설명이 제공되지 않습니다.'))+'</p>';
    erItemTooltip.hidden=false;slot.setAttribute('aria-describedby','item-tooltip');
    const rect=slot.getBoundingClientRect(),tip=erItemTooltip.getBoundingClientRect();
    erItemTooltip.style.left=Math.max(8,Math.min(rect.left,innerWidth-tip.width-8))+'px';
    erItemTooltip.style.top=(rect.bottom+tip.height+10<innerHeight?rect.bottom+8:Math.max(8,rect.top-tip.height-8))+'px';
}
function erHideItemTooltip(){if(erHoverSlot)erHoverSlot.removeAttribute('aria-describedby');erHoverSlot=null;if(erItemTooltip)erItemTooltip.hidden=true;}
document.addEventListener('pointerover',e=>{const slot=e.target.closest?.('[data-item-code],[data-skill-code]');if(slot&&slot!==erHoverSlot)erShowItemTooltip(slot);});
document.addEventListener('focusin',e=>{const slot=e.target.closest?.('[data-item-code],[data-skill-code]');if(slot)erShowItemTooltip(slot);});
document.addEventListener('pointerout',e=>{if(erHoverSlot&&!erHoverSlot.contains(e.relatedTarget))erHideItemTooltip();});
document.addEventListener('focusout',erHideItemTooltip);
document.addEventListener('keydown',e=>{if(e.key==='Escape')erHideItemTooltip();});
document.addEventListener('scroll',erHideItemTooltip,true);
