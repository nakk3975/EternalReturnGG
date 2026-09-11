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
                return '<article class="home-route"><img loading="lazy" width="64" height="64" src="' + escape(erAssetBase + 'CharCommunity_' + (character?.name || '') + '_S000.png') + '" alt="' + escape(name) + '"><div><h3>' + escape(route.title) + '</h3><p>' + escape(name) + ' · ' + escape(route.userNickname) + ' · 루트 #' + escape(route.id) + '</p><div>' + equipment.map(code => '<img loading="lazy" width="40" height="40" src="' + escape(erAssetBase + 'ItemIcon_' + code + '.png') + '" alt="아이템 ' + code + '">').join('') + '</div></div></article>';
            }).join('');
            $('#recommendRouteBox').html(html);
            $('#home-status').text(routes.length ? '' : '현재 제공되는 추천 루트가 없습니다.');
        } catch (_) {
            $('#home-status').text('추천 루트를 불러오지 못했습니다. 닉네임 검색은 계속 사용할 수 있습니다.');
        }
    }
    loadRoutes();
});
