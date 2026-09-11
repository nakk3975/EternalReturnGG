let erAssetBase = '';
async function loadAssetConfig() {
    const response = await fetch('/er/assets/config');
    if (!response.ok) throw new Error('Image configuration unavailable');
    const config = await response.json();
    erAssetBase = config.baseUrl;
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
