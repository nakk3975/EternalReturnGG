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
