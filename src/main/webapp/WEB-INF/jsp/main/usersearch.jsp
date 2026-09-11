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

       <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>

    <link rel="stylesheet" href="/static/css/style.css" type="text/css">
<link rel="stylesheet" href="/static/css/dataPages.css">
</head>
<body>
<div id="wrap">
<c:import url="/WEB-INF/jsp/include/header.jsp" />
<main class="player-page">
    <section class="player-hero"><img id="detailImage" src="/static/images/asset-placeholder.svg" alt="최근 플레이 실험체"><div><p class="eyebrow">PLAYER PROFILE</p><h1 id="nickname">플레이어 전적</h1><span id="userLevel"></span><button id="refresh" type="button">새로고침</button></div></section>
    <div class="player-layout">
        <aside class="player-sidebar"><section class="surface"><h2 class="panel-title">시즌 랭크</h2><div id="rank-panel"><p class="empty-state">랭크 정보를 불러오는 중입니다.</p></div></section><section class="surface"><h2 class="panel-title">자주 플레이한 실험체</h2><div id="player-characters"></div></section></aside>
        <section class="player-matches"><div class="section-heading"><h2>최근 10매치</h2><p id="recent-summary"></p></div><div class="sub-tabs" aria-label="경기 모드"><button data-match-mode="" aria-pressed="true">전체</button><button data-match-mode="3" aria-pressed="false">랭크</button><button data-match-mode="2" aria-pressed="false">일반</button><button data-match-mode="4" aria-pressed="false">코발트</button></div><div id="record" aria-live="polite"><p class="empty-state">최근 전적을 불러오는 중입니다.</p></div></section>
    </div>
</main>
<c:import url="/WEB-INF/jsp/include/footer.jsp" />
</div>
<script src="/static/js/assetImages.js"></script>
<script src="/static/js/itemSlots.js"></script>
<script src="/static/js/siteData.js"></script>
<script src="/static/js/matchDetails.js"></script>
<script src="/static/js/player.js"></script>
</body></html>
