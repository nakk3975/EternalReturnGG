let erAssetBase = '';
async function loadAssetConfig() {
    try {
        const cached = JSON.parse(sessionStorage.getItem('ergg.assets') || 'null');
        if (cached && cached.expires > Date.now() && /^https:\/\/cdn\.dak\.gg\/assets\/er\/game-assets\/\d+\.\d+\.\d+\/$/.test(cached.baseUrl)) {
            erAssetBase = cached.baseUrl; return;
        }
    } catch (_) { /* Storage may be disabled. */ }
    try {
        const response = await fetch('/er/assets/config', {signal: AbortSignal.timeout(7000)});
        if (!response.ok) throw new Error('Image configuration unavailable');
        const config = await response.json();
        erAssetBase = config.baseUrl;
        try { sessionStorage.setItem('ergg.assets', JSON.stringify({baseUrl: erAssetBase, expires: Date.now() + 3600000})); } catch (_) {}
    } catch (_) {
        // Text and search should still work if image configuration is unavailable.
        erAssetBase = '/static/images/unavailable/';
    }
}

// Missing skins fall back to the character's base skin, then to a local placeholder.
document.addEventListener('error', function(event) {
    const img = event.target;
    if (img.tagName !== 'IMG' || img.dataset.fallback === 'done') return;
    if (/\/Char(?:Profile|Result|Community)_.*_S\d+\.png$/.test(img.src)
            && !/_S000\.png$/.test(img.src)) {
        img.src = img.src.replace(/_S\d+\.png$/, '_S000.png');
        return;
    }
    // Localization includes recasts that share the parent skill's artwork.
    // Try the exact image first, then its base group once; retain the original tooltip code.
    const variant=img.src.match(/\/SkillIcon_(\d+)\.png$/);
    if(variant && !img.dataset.skillBaseFallback){
        const code=Number(variant[1]), base=Math.floor(code/100)*100;
        if(code>=1000000 && code<2000000 && code!==base){
            img.dataset.skillBaseFallback='true';
            img.src=img.src.replace('SkillIcon_'+code+'.png','SkillIcon_'+base+'.png');
            return;
        }
    }
    const weaponSkill=img.src.match(/\/WeaponSkillIcon_(\d+)\.png$/);
    if(weaponSkill){
        const types={1:'Glove',2:'Tonfa',3:'Bat',4:'Whip',5:'HighAngleFire',6:'DirectFire',7:'Bow',8:'CrossBow',9:'Pistol',10:'AssaultRifle',11:'SniperRifle',13:'Hammer',14:'Axe',15:'OneHandSword',16:'TwoHandSword',17:'Polearm',18:'DualSword',19:'Spear',20:'Nunchaku',21:'Rapier',22:'Guitar',23:'Camera',24:'Arcana',25:'VFArm'};
        const type=types[Math.floor(Number(weaponSkill[1])/1000)-3000];
        if(type){img.src=erAssetBase+'Ico_Ability_'+type+'.png';img.title=(img.alt||'무기 스킬')+' · 무기군 아이콘';return;}
    }
    img.dataset.fallback = 'done';
    img.alt = img.alt || '이미지 준비 중';
    img.src = '/static/images/asset-placeholder.svg';
}, true);
