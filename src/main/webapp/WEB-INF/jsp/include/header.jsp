<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>

        <link rel="stylesheet" href="/static/css/theme.css?v=20260912-player-links">
        <script>try{document.documentElement.dataset.theme=localStorage.getItem('ergg.theme')||'light';}catch(_){document.documentElement.dataset.theme='light';}</script>
        <style>
            header{padding-left:max(24px,calc((100% - 1232px)/2));padding-right:max(24px,calc((100% - 1232px)/2));background:radial-gradient(ellipse at 85% 0%,#39bed16b,transparent 60%),linear-gradient(110deg,#173f63,#147489 70%,#268ea5);border-bottom:1px solid #ffffff26;}
            nav > .nav{max-width:1280px;margin:0 auto;}
            nav{background:linear-gradient(110deg,#163d59,#19566a);}
            header .search-form{background:#123c58aa;border-color:#a6e2ee55;}
            header .search-input::placeholder{color:#c0e0e8;}
            #mainBanner{filter:drop-shadow(0 2px 4px #0b344933);}
        </style>
        <header class="d-flex justify-content-between align-items-center">
            <a href="/er/search/view" class="p-2 ml-2 text-white" id="mainBanner" aria-label="ER.GG 홈"><img src="/static/images/ergg-logo.webp" width="42" height="42" alt=""><span>ER.GG</span></a>
            <button id="theme-toggle" type="button" aria-label="화면 테마 변경">라이트 / 다크</button>
            <div class="p-2">
                <form class="search-form" id="searchHeaderForm">
                    <input type="text" aria-label="플레이어 닉네임" id="searchHeaderInput" class="search-input" placeholder="플레이어 닉네임을 입력해주세요." required>
                    <button class="search-button" id="searchHeaderBtn" aria-label="전적 검색">
                        <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.824 11.0391L8.68035 7.89844C9.3607 7.07812 9.73607 6.02344 9.73607 4.875C9.73607 2.20312 7.53079 0 4.85631 0C2.15836 0 0 2.20312 0 4.875C0 7.57031 2.18182 9.75 4.85631 9.75C5.9824 9.75 7.03812 9.375 7.8827 8.69531L11.0264 11.8359C11.1437 11.9531 11.2845 12 11.4487 12C11.5894 12 11.7302 11.9531 11.824 11.8359C12.0587 11.625 12.0587 11.2734 11.824 11.0391ZM1.1261 4.875C1.1261 2.8125 2.79179 1.125 4.87977 1.125C6.94428 1.125 8.63343 2.8125 8.63343 4.875C8.63343 6.96094 6.94428 8.625 4.87977 8.625C2.79179 8.625 1.1261 6.96094 1.1261 4.875Z" fill="white"></path>
                        </svg>
                    </button>
                </form>
            </div>
        </header>
        <nav>
            <ul class="nav justify-content-around">
                <li class="nav-item"><a href="/er/search/view" class="nav-link font-weight-bold text-white">메인</a></li>
                <li class="nav-item"><a href="/er/leaderboard" class="nav-link font-weight-bold text-white">랭킹</a></li>
                <li class="nav-item"><a href="/er/characters" class="nav-link font-weight-bold text-white">실험체</a></li>
                <li class="nav-item"><a href="/er/statistics" class="nav-link font-weight-bold text-white">통계</a></li>
                <li class="nav-item"><a href="/er/items" class="nav-link font-weight-bold text-white">아이템</a></li>
                <li class="nav-item"><a href="/er/routes" class="nav-link font-weight-bold text-white">루트추천</a></li>
                <li class="nav-item"><a href="/er/guide" class="nav-link font-weight-bold text-white">가이드</a></li>
                <li class="nav-item"><a href="/er/multi" class="nav-link font-weight-bold text-white">멀티서치</a></li>
                <li class="nav-item"><a href="/er/favorites" class="nav-link font-weight-bold text-white">즐겨찾기</a></li>
            </ul>
        </nav>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('theme-toggle').addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('ergg.theme',theme);}catch(_){}});
            document.querySelectorAll('nav a').forEach(link => {
                if (link.pathname === location.pathname || (link.pathname !== '/er/search/view' && location.pathname.startsWith(link.pathname + '/'))) link.setAttribute('aria-current', 'page');
            });
            const form = document.getElementById('searchHeaderForm');
            const button = document.getElementById('searchHeaderBtn');
            form.addEventListener('submit', async function(event) {
                event.preventDefault();
                const nickname = document.getElementById('searchHeaderInput').value.trim();
                if (!nickname || button.disabled) return;
                button.disabled = true;
                try {
                    const response = await fetch('/er/search/nickname?nickname=' + encodeURIComponent(nickname), {signal: AbortSignal.timeout(15000)});
                    const data = await response.json();
                    if (!response.ok) throw new Error('검색 요청에 실패했습니다. 다시 시도해 주세요.');
                    if (!data.user?.userId) throw new Error('존재하지 않는 닉네임입니다.');
                    location.href = '/er/user/detail/view?userNum=' + encodeURIComponent(data.user.userId);
                } catch (error) {
                    alert(error.name === 'TimeoutError' ? '검색 응답이 지연되고 있습니다. 다시 시도해 주세요.' : error.message);
                } finally { button.disabled = false; }
            });
        });
    </script>







