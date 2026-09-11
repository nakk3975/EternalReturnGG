<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>ERGG</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
    
  	<script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>

	<link rel="stylesheet" href="/static/css/style.css?v=20260911-analysis-final" type="text/css">
</head>
<body>
	<c:import url="/WEB-INF/jsp/include/header.jsp" />
<div id="wrap">
		<section>
			<div id="searchBox" class="d-flex align-items-center justify-content-center">
				<div class="home-hero-copy"><p class="eyebrow">ETERNAL RETURN STATS</p><h1>다음 승리를 위한 기록</h1><p>플레이어 전적부터 실험체와 추천 루트까지</p></div>
				<form class="search-form" id="searchForm">
				    <input type="text" aria-label="플레이어 닉네임" id="searchInput" class="search-input" placeholder="플레이어 닉네임을 입력해주세요." required>
				    <button class="search-button" id="searchBtn" aria-label="전적 검색">
				        <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
				            <path d="M11.824 11.0391L8.68035 7.89844C9.3607 7.07812 9.73607 6.02344 9.73607 4.875C9.73607 2.20312 7.53079 0 4.85631 0C2.15836 0 0 2.20312 0 4.875C0 7.57031 2.18182 9.75 4.85631 9.75C5.9824 9.75 7.03812 9.375 7.8827 8.69531L11.0264 11.8359C11.1437 11.9531 11.2845 12 11.4487 12C11.5894 12 11.7302 11.9531 11.824 11.8359C12.0587 11.625 12.0587 11.2734 11.824 11.0391ZM1.1261 4.875C1.1261 2.8125 2.79179 1.125 4.87977 1.125C6.94428 1.125 8.63343 2.8125 8.63343 4.875C8.63343 6.96094 6.94428 8.625 4.85631 8.625C2.79179 8.625 1.1261 6.96094 1.1261 4.875Z" fill="white"></path>
				        </svg>
				    </button>
				</form>
			</div>
            <div class="home-recommendations">
                <div class="section-heading"><div><p class="eyebrow">RECOMMENDED BUILDS</p><h2 id="recommendRouteTitle">추천 루트</h2></div><a class="section-link" href="/er/routes">전체 루트 보기 →</a></div>
                <p id="home-status" role="status" aria-live="polite"></p>
                <div id="recommendRouteBox"></div>
            </div>
		</section>
		<c:import url="/WEB-INF/jsp/include/footer.jsp" />
	</div>
	
	<script src="/static/js/getName.js"></script>
	<script src="/static/js/assetImages.js?v=20260911-weapon-skill"></script>
	<script src="/static/js/fetchWeaponBgImg.js"></script>
	<script src="/static/js/itemSlots.js?v=20260911-analysis-final"></script>
	<script src="/static/js/siteData.js?v=20260911-weapon-skill"></script>
	<script src="/static/js/home.js"></script>
</body>
</html>
