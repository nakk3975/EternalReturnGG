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
    if (!erDictionaryRequest) erDictionaryRequest = fetch('/er/loadTextFile', {signal:AbortSignal.timeout(15000)}).then(async r => {
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
