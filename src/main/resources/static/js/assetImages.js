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
    img.dataset.fallback = 'done';
    img.alt = img.alt || '이미지 준비 중';
    img.src = '/static/images/asset-placeholder.svg';
}, true);
