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
<link rel="stylesheet" href="/static/css/player.css?v=20260911-analysis-final">
<link rel="stylesheet" href="/static/css/matchTabs.css?v=20260912-native-links">
<link rel="stylesheet" href="/static/css/seasonHistory.css?v=20260912-seasons">
</head>
<body>
<c:import url="/WEB-INF/jsp/include/header.jsp" />
<div id="wrap">
<main class="player-page">
    <section class="player-hero"><span id="hero-loading" role="status">시즌 스킨 확인 중…</span><img class="hero-pending" id="detailImage" src="/static/images/asset-placeholder.svg" alt="주력 실험체"><div><p class="eyebrow" id="hero-caption">주력 실험체</p><h1 id="nickname">플레이어 전적</h1><span id="userLevel"></span><button id="refresh" type="button">새로고침</button></div></section>
    <section id="season-history" aria-label="시즌 성적"><p class="empty-state">시즌 정보를 불러오는 중…</p></section>
    <div class="player-layout">
        <aside class="player-sidebar"><section class="surface"><h2 class="panel-title">시즌 랭크</h2><div id="rank-panel"><p class="empty-state">랭크 정보를 불러오는 중입니다.</p></div><div id="rp-history"></div></section><section class="surface"><h2 class="panel-title">자주 플레이한 실험체</h2><div id="player-characters"></div></section></aside>
        <section class="player-matches"><div class="section-heading"><h2>최근 전적</h2><p id="recent-summary"></p></div><div class="sub-tabs" aria-label="경기 모드"><button data-match-mode="" aria-pressed="true">전체</button><button data-match-mode="3" aria-pressed="false">랭크</button><button data-match-mode="2" aria-pressed="false">일반</button><button data-match-mode="6" aria-pressed="false">코발트</button></div><div id="recent-overview" class="surface"></div><div id="record" aria-live="polite"><p class="empty-state">최근 전적을 불러오는 중입니다.</p></div><button id="more-matches" type="button" hidden>전적 더 보기</button></section>
    </div>
</main>
<c:import url="/WEB-INF/jsp/include/footer.jsp" />
</div>
<script src="/static/js/assetImages.js?v=20260911-weapon-skill"></script>
<script src="/static/js/itemSlots.js?v=20260912-native-links"></script>
<script src="/static/js/siteData.js?v=20260912-descriptions"></script>
<script src="/static/js/matchDetails.js"></script>
<script src="/static/js/player.js?v=20260912-native-links"></script>
<script src="/static/js/matchTabs.js?v=20260912-native-links"></script>
<script src="/static/js/seasonHistory.js?v=20260912-season-names"></script>
</body></html>
