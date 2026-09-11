const matchDetailLoaders = new Map();
async function toggleMatchDetails(card) {
    const panel = card.nextElementSibling;
    if (!panel || !panel.classList.contains('detail-box')) return;
    panel.hidden = !panel.hidden;
    card.setAttribute('aria-expanded', String(!panel.hidden));
    const button = card.querySelector('.plus-btn');
    if (button) {
        button.textContent = panel.hidden ? '▼' : '▲';
        button.setAttribute('aria-expanded', String(!panel.hidden));
    }
    if (panel.hidden || panel.dataset.loaded || panel.dataset.loading) return;
    const loader = matchDetailLoaders.get(card.dataset.gameId);
    if (!loader) return;
    panel.dataset.loading = 'true';
    panel.textContent = '경기 상세를 불러오는 중입니다.';
    try {
        panel.innerHTML = await loader();
        panel.dataset.loaded = 'true';
    } catch (error) {
        panel.textContent = '경기 상세를 불러오지 못했습니다. 접었다가 다시 열면 재시도합니다.';
    } finally { delete panel.dataset.loading; }
}

document.addEventListener('click', function(event) {
    const card = event.target.closest('#record .one-record');
    if (card) toggleMatchDetails(card);
});
document.addEventListener('keydown', function(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('#record .one-record');
    if (!card || event.target.closest('button')) return;
    event.preventDefault();
    toggleMatchDetails(card);
});
