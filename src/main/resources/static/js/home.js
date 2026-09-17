document.addEventListener('DOMContentLoaded', function() {
    const form=document.querySelector('#searchForm');
    const status=document.querySelector('#home-status');
    // Search must be available even when recommendations or image providers fail.
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const nickname = document.querySelector('#searchInput').value.trim();
        if (!nickname) return;
        if (nickname.includes(',')) {
            location.href = '/er/multi?names=' + encodeURIComponent(nickname); return;
        }
        const button = document.querySelector('#searchBtn');
        button.disabled=true;
        try {
            const data = await erRequest('/er/search/nickname?nickname='+encodeURIComponent(nickname));
            if (!data.user?.userId) throw new Error('존재하지 않는 닉네임입니다.');
            location.href = '/er/user/detail/view?userNum=' + encodeURIComponent(data.user.userId);
        } catch (error) { status.textContent=error.message || '검색에 실패했습니다. 다시 시도해 주세요.'; }
        finally { button.disabled=false; }
    });
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    async function loadRoutes() {
        status.textContent='추천 루트를 불러오는 중입니다.';
        try {
            const equipmentRequest = erLoadEquipment();
            void loadAssetConfig();
            const [data, characters, names] = await Promise.all([
                erStatic('/er/main'),
                erStatic('/er/character').then(body=>body.data||[]), erDictionary()
            ]);
            const charMap = new Map(characters.map(c => [String(c.code), c]));
            const routes = (data.result || []).map(v => v.recommendWeaponRoute).filter(Boolean).slice(0, 10);
            const html = routes.map(route => {
                const character = charMap.get(String(route.characterCode));
                const name = names.get('Character/Name/'+route.characterCode) || character?.name || '실험체';
                const equipment = (String(route.weaponCodes || '').match(/\d{6}/g) || []).slice(0, 5);
                return '<article class="home-route"><div class="route-heading"><img class="route-character" loading="lazy" width="48" height="48" src="' + escape(erAssetImage('CharCommunity_' + (character?.name || '') + '_S000.png')) + '" alt="' + escape(name) + '"><div><span class="route-character-name">' + escape(name) + '</span><span class="route-id">#' + escape(route.id) + '</span></div></div><h3 title="' + escape(route.title) + '">' + escape(route.title) + '</h3><p class="route-author">' + escape(route.userNickname) + '</p><div class="route-build"><span class="build-label">아이템 빌드</span><div class="item-slots">' + equipment.map(code => '<span class="item-slot" data-item-code="' + code + '"><img loading="lazy" width="40" height="32" src="' + escape(erAssetImage('ItemIcon_' + code + '.png')) + '" alt="아이템 ' + code + '"></span>').join('') + '</div></div></article>';
            }).join('');
            document.querySelector('#recommendRouteBox').innerHTML=html;
            equipmentRequest.then(catalog => erApplyItemGrades(document.querySelector('#recommendRouteBox'), catalog));
            status.textContent=routes.length ? '' : '현재 제공되는 추천 루트가 없습니다.';
        } catch (_) {
            status.textContent='추천 루트를 불러오지 못했습니다. 닉네임 검색은 계속 사용할 수 있습니다.';
        }
    }
    loadRoutes();
});
