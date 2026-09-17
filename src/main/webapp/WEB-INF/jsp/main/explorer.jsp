<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ER.GG · 게임 정보</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="/static/css/style.css?v=20260911-analysis-final">
    <link rel="stylesheet" href="/static/css/explorer.css">
<link rel="stylesheet" href="/static/css/dataPages.css?v=20260914-route-copy">
<c:if test="${explorerMenu == 'multi'}">
<link rel="stylesheet" href="/static/css/multi.css?v=1">
</c:if>
<c:if test="${explorerMenu == 'route-planner' or explorerMenu == 'animal-map'}">
<link rel="stylesheet" href="/static/css/routePlanner.css?v=20260914-release3">
</c:if>
<c:if test="${explorerMenu == 'animal-map'}">
<link rel="stylesheet" href="/static/css/animalMap.css?v=20260916-observation2">
</c:if>
</head>
<body>
<c:import url="/WEB-INF/jsp/include/header.jsp" />
<div id="wrap">
    <main class="explorer">
        <p class="eyebrow">ETERNAL RETURN · ER.GG</p>
        <h1 id="page-title">게임 정보</h1>
        <p id="page-description"></p>
        <div id="explorer-controls" class="explorer-controls"></div>
        <p id="explorer-status" role="status" aria-live="polite">데이터를 불러오는 중입니다.</p>
        <div id="explorer-results" class="explorer-grid"></div>
    </main>
    <c:import url="/WEB-INF/jsp/include/footer.jsp" />
</div>
<script src="/static/js/weaponMetadata.js?v=20260914-contract2"></script>
<script src="/static/js/assetImages.js?v=20260917-site-performance"></script>
<script src="/static/js/itemSlots.js?v=20260914-speed"></script>
<script src="/static/js/siteData.js?v=20260917-site-performance"></script>
<c:if test="${explorerMenu != 'guide' and explorerMenu != 'favorites' and explorerMenu != 'multi'}">
<script src="/static/js/catalogPages.js?v=20260917-site-performance"></script>
</c:if>
<c:if test="${explorerMenu == 'multi'}">
<script src="/static/js/multi.js?v=20260917-site-performance"></script>
</c:if>
<c:if test="${explorerMenu == 'route-planner' or explorerMenu == 'animal-map'}">
<script src="/static/js/routePlanner.js?v=20260917-site-performance"></script>
</c:if>
<c:if test="${explorerMenu == 'animal-map'}">
<script src="/static/js/animalTimer.js?v=20260916-observation2"></script>
</c:if>
<c:if test="${explorerMenu == 'animal-map'}">
<script src="/static/js/animalScreen.js?v=20260916-observation2"></script>
</c:if>
<c:if test="${explorerMenu == 'animal-map'}">
<script src="/static/js/animalMap.js?v=20260916-observation2"></script>
</c:if>
<script src="/static/js/explorer.js?v=20260917-site-performance"></script>
</body>
</html>
