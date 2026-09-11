function toggleMatchDetails(card) {
    const panel = card.nextElementSibling;
    if (!panel || !panel.classList.contains('detail-box')) return;
    panel.hidden = !panel.hidden;
    card.setAttribute('aria-expanded', String(!panel.hidden));
    const button = card.querySelector('.plus-btn');
    if (button) {
        button.textContent = panel.hidden ? '▼' : '▲';
        button.setAttribute('aria-expanded', String(!panel.hidden));
    }
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
