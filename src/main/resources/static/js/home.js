$(function() {
    // Search must be available even when recommendations or image providers fail.
    $('#searchForm').on('submit', async function(event) {
        event.preventDefault();
        const nickname = $('#searchInput').val().trim();
        if (!nickname) return;
        if (nickname.includes(',')) {
            location.href = '/er/multi?names=' + encodeURIComponent(nickname); return;
        }
        const button = $('#searchBtn').prop('disabled', true);
        try {
            const data = await $.ajax({url: '/er/search/nickname', data: {nickname}, dataType: 'json', timeout: 15000});
            if (!data.user?.userId) throw new Error('존재하지 않는 닉네임입니다.');
            location.href = '/er/user/detail/view?userNum=' + encodeURIComponent(data.user.userId);
        } catch (error) { $('#home-status').text(error.message || '검색에 실패했습니다. 다시 시도해 주세요.'); }
        finally { button.prop('disabled', false); }
    });
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    async function loadRoutes() {
        $('#home-status').text('추천 루트를 불러오는 중입니다.');
        try {
            const equipmentRequest = erLoadEquipment();
            const [data, , characters, names] = await Promise.all([
                $.ajax({url: '/er/main', dataType: 'json', timeout: 15000}),
                loadAssetConfig(), loadCharacterData(), loadKoreanCharacterNames()
            ]);
            const charMap = new Map(characters.map(c => [String(c.code), c]));
            const routes = (data.result || []).map(v => v.recommendWeaponRoute).filter(Boolean).slice(0, 10);
            const html = routes.map(route => {
                const character = charMap.get(String(route.characterCode));
                const name = names.get(String(route.characterCode)) || character?.name || '실험체';
                const equipment = (String(route.weaponCodes || '').match(/\d{6}/g) || []).slice(0, 5);
                return '<article class="home-route"><div class="route-heading"><img class="route-character" loading="lazy" width="48" height="48" src="' + escape(erAssetBase + 'CharCommunity_' + (character?.name || '') + '_S000.png') + '" alt="' + escape(name) + '"><div><span class="route-character-name">' + escape(name) + '</span><span class="route-id">#' + escape(route.id) + '</span></div></div><h3 title="' + escape(route.title) + '">' + escape(route.title) + '</h3><p class="route-author">' + escape(route.userNickname) + '</p><div class="route-build"><span class="build-label">아이템 빌드</span><div class="item-slots">' + equipment.map(code => '<span class="item-slot" data-item-code="' + code + '"><img loading="lazy" width="40" height="32" src="' + escape(erAssetBase + 'ItemIcon_' + code + '.png') + '" alt="아이템 ' + code + '"></span>').join('') + '</div></div></article>';
            }).join('');
            $('#recommendRouteBox').html(html);
            equipmentRequest.then(catalog => erApplyItemGrades(document.querySelector('#recommendRouteBox'), catalog));
            $('#home-status').text(routes.length ? '' : '현재 제공되는 추천 루트가 없습니다.');
        } catch (_) {
            $('#home-status').text('추천 루트를 불러오지 못했습니다. 닉네임 검색은 계속 사용할 수 있습니다.');
        }
    }
    loadRoutes();
});
