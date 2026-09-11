'use strict';
const erText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const erNumber = (value, digits = 0) => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('ko-KR', {maximumFractionDigits:digits});
const erStaticRequests = new Map();
async function erRequest(url) {
    const response = await fetch(url, {signal:AbortSignal.timeout(15000)});
    const data = await response.json();
    if (!response.ok || (data.code != null && ![0,200].includes(Number(data.code)))) throw new Error(data.message || '데이터를 불러오지 못했습니다. 다시 시도해 주세요.');
    return data;
}
function erStatic(url) {
    if (!erStaticRequests.has(url)) erStaticRequests.set(url, erRequest(url).catch(e => {erStaticRequests.delete(url);throw e;}));
    return erStaticRequests.get(url);
}
let erDictionaryRequest;
function erDictionary() {
    if (!erDictionaryRequest) erDictionaryRequest = fetch('/er/loadTextFile?schema=3', {signal:AbortSignal.timeout(15000)}).then(async r => {
        if (!r.ok) throw new Error('이름 정보 조회 실패');
        return new Map((await r.text()).split('\n').map(line => {const i=line.indexOf('┃');return i<0 ? ['', ''] : [line.slice(0,i).trim(),line.slice(i+1).trim()];}));
    }).catch(() => new Map());
    return erDictionaryRequest;
}
function erItemHtml(code) {
    if (!/^\d+$/.test(String(code)) || !Number(code)) return '<span class="item-slot empty-slot" title="빈 장비 칸"></span>';
    return '<span class="item-slot" data-item-code="'+code+'"><img loading="lazy" alt="아이템 '+code+'" src="'+erText(erAssetBase ? erAssetBase+'ItemIcon_'+code+'.png' : '/static/images/asset-placeholder.svg')+'"></span>';
}
function erEquipmentHtml(equipment) { return '<div class="item-slots">'+Array.from({length:5},(_,i)=>erItemHtml(equipment?.[i])).join('')+'</div>'; }
function erCharacterImage(name, skin = 0) { return name && erAssetBase ? erAssetBase+'CharProfile_'+name+'_S'+String(skin || 0).slice(-3).padStart(3,'0')+'.png' : '/static/images/asset-placeholder.svg'; }

const erFinite = value => value != null && value !== '' && Number.isFinite(Number(value));
// RP bands: official ranked FAQ, updated 2026-08-19 (article 21812479709081).
// Keep this table explicit: Meteorite divisions are now 300 RP, Mythril starts at 7600.
function erTier(row) {
    if (!erFinite(row.mmr) || Number(row.mmr)<0 || !erFinite(row.totalGames) || Number(row.totalGames)<=0) return null;
    const rp=Number(row.mmr), rank=Number(row.rank);
    if (rp>=8300 && rank>0 && rank<=1000) return rank<=300 ? {name:'이터니티',image:8} : {name:'데미갓',image:7};
    const bands=[[7600,0,'미스릴',66],[6400,300,'메테오라이트',63],[5000,350,'다이아몬드',6],[3600,350,'플래티넘',5],[2400,300,'골드',4],[1400,250,'실버',3],[600,200,'브론즈',2],[0,150,'아이언',1]];
    const [min,step,name,image]=bands.find(([min])=>rp>=min);
    return {name:name+(step?' '+['IV','III','II','I'][Math.min(3,Math.floor((rp-min)/step))]:''),image};
}

function erSkillImage(code, name) {
    if(!/^\d+$/.test(String(code)) || !erAssetBase)return '';
    const prefix=Number(code)>=7000000?'TraitSkillIcon_':Number(code)>=4000000?'VSkillIcon_':Number(code)>=2000000?'WSkillIcon_':'SkillIcon_';
    return '<img class="skill-icon" loading="lazy" src="'+erText(erAssetBase+prefix+code+'.png')+'" alt="'+erText(name||'스킬 '+code)+'">';
}
