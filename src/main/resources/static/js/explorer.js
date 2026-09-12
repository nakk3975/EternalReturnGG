'use strict';
const ER_PAGES = {
    'route-planner':['루트 만들기','장비 재료를 확인하고 지도에서 방문할 지역을 선택하세요.'],
    statistics:['통계','최근 7일 수집된 경기 기준 실험체 통계입니다.'],
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
    const page = location.pathname.split('/').filter(Boolean)[1];
    const special = {'route-planner':startRoutePlanner, characters: erCharacterPage, items: erItemsPage, routes: erRoutesPage, leaderboard: erRankingPage, statistics: erStatisticsPage};
    if (special[page]) return special[page]();
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
    if (page === 'multi') return startMulti();
    if (page === 'guide') {
        results.innerHTML = Object.entries(ER_PAGES).filter(([key]) => key !== 'guide').map(([key, value]) => '<a class="explorer-card guide-card" href="/er/' + key + '"><h2>' + value[0] + '</h2><p>' + value[1] + '</p></a>').join('');
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
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
    startExplorer().catch(error => {
        document.querySelector('#explorer-status').textContent = error.message;
        const retry = document.createElement('button'); retry.textContent = '다시 시도'; retry.onclick = () => location.reload(); const controls=document.querySelector('#explorer-controls');controls.hidden=false;controls.append(retry);
    });
});
