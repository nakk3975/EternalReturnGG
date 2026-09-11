'use strict';
const ER_PAGES = {
    characters: ['실험체', '실험체 이름으로 검색하고 기본 능력치를 확인하세요.'],
    items: ['아이템', '무기와 방어구의 등급·능력치를 확인하세요.'],
    routes: ['추천 루트', '공식 API에서 제공하는 추천 루트와 장비 구성을 확인하세요.'],
    leaderboard: ['랭킹', '현재 시즌 스쿼드 상위 랭킹입니다. 최대 5분 단위로 갱신됩니다.'],
    guide: ['가이드 / 도구', '실험체와 장비를 탐색하고 플레이어 전적을 비교하세요.'],
    favorites: ['즐겨찾기', '이 브라우저에 저장한 플레이어입니다. 다른 기기에는 동기화되지 않습니다.'],
    multi: ['멀티서치', '쉼표 또는 줄바꿈으로 닉네임을 구분하세요. 한 번에 최대 5명을 검색합니다.']
};
const ER_STATS = {maxHp: '최대 체력', attackPower: '공격력', defense: '방어력', moveSpeed: '이동 속도', attackSpeed: '공격 속도', criticalStrikeChance: '치명타 확률', skillAmp: '스킬 증폭', cooldownReduction: '쿨다운 감소', hpRegen: '체력 재생', maxSp: '최대 스태미나', spRegen: '스태미나 재생'};
function erEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}
async function erJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    const body = await response.json();
    if (body.code != null && ![200, 0].includes(Number(body.code))) throw new Error(body.message || '조회 결과가 없습니다.');
    return body;
}
function erNames(text) {
    const names = new Map();
    for (const line of text.split('\n')) {
        const split = line.indexOf('┃');
        if (split > -1) names.set(line.slice(0, split).trim(), line.slice(split + 1).trim());
    }
    return names;
}
function erFavorites() {
    try { const values = JSON.parse(localStorage.getItem('ergg.favorites') || '[]'); return Array.isArray(values) ? values.filter(v => v && typeof v.nickname === 'string') : []; }
    catch (_) { return []; }
}
function erSavePlayer(player) {
    const values = erFavorites().filter(v => v.nickname !== player.nickname);
    localStorage.setItem('ergg.favorites', JSON.stringify([...values, player].slice(-100)));
}
function erPlayerLink(player) {
    return '/er/user/detail/view?userNum=' + encodeURIComponent(player.userId);
}
function erStatHtml(row) {
    return '<dl>' + Object.entries(ER_STATS).filter(([key]) => row[key] != null)
        .map(([key, label]) => '<dt>' + label + '</dt><dd>' + erEscape(row[key]) + '</dd>').join('') + '</dl>';
}
async function startExplorer() {
    const page = location.pathname.split('/').filter(Boolean).pop();
    const info = ER_PAGES[page];
    if (!info) return;
    document.title = info[0] + ' · ER.GG';
    document.querySelector('#page-title').textContent = info[0];
    document.querySelector('#page-description').textContent = info[1];
    const controls = document.querySelector('#explorer-controls');
    const status = document.querySelector('#explorer-status');
    const results = document.querySelector('#explorer-results');
    const card = html => '<article class="explorer-card">' + html + '</article>';
    const image = (file, name) => '<img loading="lazy" src="' + erEscape(erAssetBase + file) + '" alt="' + erEscape(name) + '">';
    const showError = error => { status.textContent = error.message; };
    if (page === 'guide') {
        results.innerHTML = Object.entries(ER_PAGES).filter(([key]) => key !== 'guide').map(([key, value]) => card('<h2><a href="/er/' + key + '">' + value[0] + '</a></h2><p>' + value[1] + '</p>')).join('');
        status.textContent = ''; return;
    }
    if (page === 'multi' || page === 'favorites') {
        controls.innerHTML = '<label for="nicknames">닉네임</label><textarea id="nicknames" maxlength="300" placeholder="닉네임1, 닉네임2"></textarea><button id="find-players">' + (page === 'favorites' ? '찾아서 즐겨찾기 추가' : '전적 비교') + '</button>';
        const renderFavorites = () => {
            results.innerHTML = erFavorites().map(p => card('<h2>' + erEscape(p.nickname) + '</h2><div class="actions"><a class="action" href="' + erPlayerLink(p) + '">전적 보기</a><button data-remove="' + erEscape(p.nickname) + '">삭제</button></div>')).join('');
            status.textContent = results.children.length ? results.children.length + '명 저장됨' : '저장된 플레이어가 없습니다.';
        };
        controls.querySelector('textarea').value = new URLSearchParams(location.search).get('names') || '';
        if (page === 'favorites') renderFavorites(); else status.textContent = '';
        controls.querySelector('button').onclick = async function() {
            const names = [...new Set(controls.querySelector('textarea').value.split(/[,\n]/).map(v => v.trim()).filter(Boolean))];
            if (!names.length || names.length > 5) { status.textContent = '닉네임을 1~5개 입력해 주세요.'; return; }
            this.disabled = true; status.textContent = '플레이어를 조회하는 중입니다.';
            try {
                const rows = await Promise.all(names.map(async nickname => {
                    try {
                        const {user} = await erJson('/er/search/nickname?nickname=' + encodeURIComponent(nickname));
                        if (!user || !user.userId) throw new Error('플레이어를 찾지 못했습니다.');
                        const player = {nickname: user.nickname || nickname, userId: user.userId};
                        if (page === 'favorites') { erSavePlayer(player); return ''; }
                        let summary = '시즌 기록 없음';
                        try {
                            const stats = await erJson('/er/userRank?userNum=' + encodeURIComponent(user.userId));
                            const row = stats.userStats?.[0];
                            if (row) summary = erEscape(row.mmr) + ' RP · ' + erEscape(row.totalGames) + '게임';
                        } catch (_) { summary = '시즌 기록을 불러오지 못했습니다.'; }
                        return card('<h2>' + erEscape(player.nickname) + '</h2><p>' + summary + '</p><a class="action" href="' + erPlayerLink(player) + '">전적 보기</a>');
                    } catch (error) { return card('<h2>' + erEscape(nickname) + '</h2><p>' + erEscape(error.message) + '</p>'); }
                }));
                if (page === 'favorites') { renderFavorites(); const errors = rows.filter(Boolean); if (errors.length) { results.insertAdjacentHTML('beforeend', errors.join('')); status.textContent += ' · 일부 추가 실패'; } }
                else { results.innerHTML = rows.join(''); status.textContent = names.length + '명 조회 완료'; }
            } finally { this.disabled = false; }
        };
        results.onclick = event => {
            const button = event.target.closest('[data-remove]');
            if (!button) return;
            try { localStorage.setItem('ergg.favorites', JSON.stringify(erFavorites().filter(p => p.nickname !== button.dataset.remove))); renderFavorites(); }
            catch (_) { status.textContent = '브라우저 저장소를 사용할 수 없습니다.'; }
        };
        return;
    }
    if (page === 'leaderboard') {
        const data = await erJson('/er/leaderboard/data');
        if (!Array.isArray(data.topRanks)) throw new Error('현재 랭킹 응답을 확인할 수 없습니다.');
        results.innerHTML = data.topRanks.map(p => card('<p>#' + erEscape(p.rank) + '</p><h2>' + erEscape(p.nickname) + '</h2><p>' + erEscape(p.mmr) + ' RP</p><button data-player="' + erEscape(p.nickname) + '">전적 보기</button>')).join('');
        results.onclick = async event => { const b = event.target.closest('[data-player]'); if (!b) return; b.disabled = true; try { const {user} = await erJson('/er/search/nickname?nickname=' + encodeURIComponent(b.dataset.player)); if (!user?.userId) throw new Error('플레이어를 찾지 못했습니다.'); location.href = erPlayerLink(user); } catch (e) { showError(e); b.disabled = false; } };
        status.textContent = data.topRanks.length + '명'; return;
    }
    const equipmentRequest = page === 'routes' ? erLoadEquipment() : null;
    const sources = page === 'characters' ? ['/er/character'] : page === 'items' ? ['/er/weapon', '/er/armor'] : ['/er/main'];
    const [textResponse, , sourceData] = await Promise.all([fetch('/er/loadTextFile'), loadAssetConfig(), Promise.all(sources.map(erJson))]);
    const names = textResponse.ok ? erNames(await textResponse.text()) : new Map();
    let records = [];
    if (page === 'characters') {
        records = sourceData[0].data.map(row => ({row, name: names.get('Character/Name/' + row.code) || row.name, group: '', file: 'CharCommunity_' + row.name + '_S000.png'}));
    } else if (page === 'items') {
        const data = sourceData;
        records = data.flatMap((body, i) => body.data.map(row => ({row, name: names.get('Item/Name/' + row.code) || row.name, group: i ? '방어구' : '무기', file: 'ItemIcon_' + row.code + '.png'})));
    } else {
        const body = sourceData[0];
        records = (body.result || []).filter(v => v.recommendWeaponRoute).map(v => ({row: v.recommendWeaponRoute, name: v.recommendWeaponRoute.title, group: '', file: ''}));
    }
    controls.innerHTML = '<label for="catalog-search">검색</label><input id="catalog-search" placeholder="이름 또는 코드"><select id="catalog-filter" aria-label="분류"><option value="">전체</option></select>';
    const filter = controls.querySelector('select');
    for (const group of [...new Set(records.map(v => v.group).filter(Boolean))]) filter.add(new Option(group, group));
    let visible = 40;
    const more = document.createElement('button'); more.textContent = '더 보기'; results.after(more);
    const render = () => {
        const query = controls.querySelector('input').value.trim().toLowerCase();
        const selected = records.filter(v => (!filter.value || v.group === filter.value) && (String(v.name) + ' ' + v.row.code + ' ' + (v.row.name || '')).toLowerCase().includes(query));
        results.innerHTML = selected.slice(0, visible).map(v => {
            if (page === 'routes') {
                const items = String(v.row.weaponCodes || '').match(/\d{6}/g) || [];
                return card('<p>루트 #' + erEscape(v.row.id) + '</p><h2>' + erEscape(v.name) + '</h2><p>제작자 ' + erEscape(v.row.userNickname) + '</p>' + '<div class="route-build"><span class="build-label">아이템 빌드</span><div class="item-slots">' + items.map(code => '<span class="item-slot" data-item-code="' + code + '">' + image('ItemIcon_' + code + '.png', names.get('Item/Name/' + code) || code) + '</span>').join('') + '</div></div>');
            }
            return card((page === 'items' ? '<div class="catalog-item item-slot" data-grade="' + erEscape(Object.hasOwn(erGradeNames, v.row.itemGrade) ? v.row.itemGrade : 'Unknown') + '">' + image(v.file, v.name) + '</div>' : image(v.file, v.name)) + '<h2>' + erEscape(v.name) + '</h2><p>' + erEscape(v.row.itemGrade || '') + ' · #' + erEscape(v.row.code) + '</p><details><summary>능력치 보기</summary>' + erStatHtml(v.row) + '</details>');
        }).join('');
        if (equipmentRequest) equipmentRequest.then(catalog => erApplyItemGrades(results, catalog));
        more.hidden = visible >= selected.length;
        status.textContent = selected.length ? selected.length + '개 중 ' + Math.min(visible, selected.length) + '개 표시' : '검색 결과가 없습니다.';
    };
    const reset = () => { visible = 40; render(); };
    more.onclick = () => { visible += 40; render(); };
    controls.querySelector('input').oninput = reset; filter.onchange = reset; render();
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    startExplorer().catch(error => {
        document.querySelector('#explorer-status').textContent = error.message;
        const retry = document.createElement('button'); retry.textContent = '다시 시도'; retry.onclick = () => location.reload(); document.querySelector('#explorer-controls').append(retry);
    });
});
