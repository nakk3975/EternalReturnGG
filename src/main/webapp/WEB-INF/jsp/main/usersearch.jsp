<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ERGG - 유저 검색 결과</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">


    <link rel="stylesheet" href="/static/css/style.css?v=20260911-analysis-final" type="text/css">
<link rel="stylesheet" href="/static/css/dataPages.css?v=20260911-analysis-final">
<link rel="stylesheet" href="/static/css/player.css?v=20260914-tools2">
<link rel="stylesheet" href="/static/css/matchTabs.css?v=20260912-ux">
<link rel="stylesheet" href="/static/css/seasonHistory.css?v=20260912-seasons">
</head>
<body>
<c:import url="/WEB-INF/jsp/include/header.jsp" />
<div id="wrap">
<main class="player-page">
    <section class="player-hero"><span id="hero-loading" role="status">시즌 스킨 확인 중…</span><img class="hero-pending" id="detailImage" src="/static/images/asset-placeholder.svg" alt="주력 실험체"><div class="profile-heading"><span id="userLevel" class="profile-level"></span><h1 id="nickname">플레이어 전적</h1><div class="profile-actions"><button id="refresh" type="button">전적 새로고침</button><button id="profile-favorite" type="button" aria-label="즐겨찾기 추가" aria-pressed="false">☆</button></div><p id="profile-updated" role="status">최근 업데이트 확인 중…</p></div></section>
    <nav class="profile-tabs" aria-label="플레이어 정보"><button data-profile-tab="overview" aria-selected="true">기본 프로필</button><button data-profile-tab="characters" aria-selected="false">실험체</button><button data-profile-tab="matches" aria-selected="false">매치 히스토리</button><button data-profile-tab="skins" aria-selected="false">스킨 통계</button></nav>
    <section id="profile-tab-content" hidden></section>
    <section id="season-history" aria-label="시즌 성적"><p class="empty-state">시즌 정보를 불러오는 중…</p></section>
    <div class="player-layout">
        <aside class="player-sidebar"><section class="surface"><h2 class="panel-title">시즌 랭크</h2><div id="rank-panel"><p class="empty-state">랭크 정보를 불러오는 중입니다.</p></div><div id="rp-history"></div></section><section class="surface"><h2 class="panel-title">랭크 실험체 통계</h2><div id="player-characters"></div></section></aside>
        <section class="player-matches"><div class="section-heading"><h2>최근 전적</h2><p id="recent-summary"></p></div><div class="sub-tabs" aria-label="경기 모드"><button data-match-mode="" aria-pressed="true">전체</button><button data-match-mode="3" aria-pressed="false">랭크</button><button data-match-mode="2" aria-pressed="false">일반</button><button data-match-mode="6" aria-pressed="false">코발트</button></div><div id="recent-overview" class="surface"></div><div id="record" aria-live="polite"><p class="empty-state">최근 전적을 불러오는 중입니다.</p></div><button id="more-matches" type="button" hidden>전적 더 보기</button></section>
    </div>
</main>
<c:import url="/WEB-INF/jsp/include/footer.jsp" />
</div>
<script src="/static/js/weaponMetadata.js?v=20260914-contract2"></script>
<script src="/static/js/assetImages.js?v=20260914-fast-tier"></script>
<script src="/static/js/itemSlots.js?v=20260914-speed"></script>
<script src="/static/js/siteData.js?v=20260914-fast-tier"></script>
<script src="/static/js/matchDetails.js"></script>
<script src="/static/js/profileTabs.js?v=20260914-profile"></script>
<script src="/static/js/player.js?v=20260914-tools2"></script>
<script src="/static/js/matchTabs.js?v=20260914-fast-tier"></script>
<script src="/static/js/seasonHistory.js?v=20260912-season-names"></script>
</body></html>
