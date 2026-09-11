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
</head>
<body>
    <div id="wrap">
        <c:import url="/WEB-INF/jsp/include/header.jsp" />
        <section>
            <!-- 상단 유저 정보 -->
            <div id="infoBox" class="bg-secondary d-flex text-white">
                <img id="detailImage" src="#">
                <div class="mt-3 ml-3">
                    <h6 id="userLevel"></h6>
                    <h2 id="nickname"></h2>
                    <button type="button" id="refresh" class="btn btn-primary mt-4">최신 정보</button>
                </div>
            </div>
            <div class="player-layout">
                <!-- 좌측 유저 상세 정보 -->
                <div id="sideUserInfo" class="mt-4 text-center">
                    <div class="user-record">
                        <h2 id="rankText">랭크</h2>
                    </div>
                    <div class="user-record d-flex justify-content-center align-items-center">
                        <img src="#" id="rankImg" class="m-2">
                        <div>
                            <div id="rp">RP </div>
                            <div id="tier"></div>
                            <div id="rank" class="text-secondary"></div>
                        </div>
                    </div>
                    <div class="user-record">
                        <div class="d-flex justify-content-around align-items-center m-2">
                            <div>
                                평균 TK<br>
                                <div class="percent-bar">
                                    <div style="width: 100%;"></div>
                                </div>
                                <div id="averageTk"></div>
                            </div>
                            <div>
                                승률<br>
                                <div class="percent-bar">
                                    <div class="percent" id="topOnePercentBar"></div>
                                </div>
                                <div id="rankOne"></div>
                            </div>
                            <div>
                                게임 수<br>
                                <div class="percent-bar">
                                    <div style="width: 100%;"></div>
                                </div>
                                <div id="totalGame"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-around align-items-center m-2">
                            <div>
                                평균 킬<br>
                                <div class="percent-bar">
                                    <div style="width: 100%;"></div>
                                </div>
                                <div id="averageKill"></div>
                            </div>
                            <div>
                                TOP 2<br>
                                <div class="percent-bar">
                                    <div class="percent" id="topTwoPercentBar"></div>
                                </div>
                                <div id="rankTwo"></div>
                            </div>
                            <div>
                                평균 딜량<br>
                                <div class="percent-bar">
                                    <div style="width: 100%;"></div>
                                </div>
                                <div id="averageDamage"></div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-around align-items-center m-2">
                            <div>
                                평균 어시<br>
                                <div class="percent-bar">
                                    <div style="width: 100%;"></div>
                                </div>
                                <div id="averageAsist"></div>
                            </div>
                            <div>
                                TOP 3<br>
                                <div class="percent-bar">
                                    <div class="percent" id="topThreePercentBar"></div>
                                </div>
                                <div id="rankThree"></div>
                            </div>
                            <div>
                                평균 순위<br>
                                <div class="percent-bar">
                                    <div class="percent" id="rankPercentBar"></div>
                                </div>
                                <div id="averageRank"></div>
                            </div>
                        </div>
                    </div>
                    <div class="user-record mt-3">
                        <h3 id="charPlayText">랭크 실험체 통계</h3>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>실험체</th>
                                    <th></th>
                                    <th>승률</th>
                                    <th>승리 수</th>
                                    <th>최다 킬</th>
                                </tr>
                            </thead>
                            <tbody id="sideRecord" class="align-middle">

                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- 최근 전적 -->
                <div id="recordDetail" class="m-2">
                    <h5 class="ml-1 mt-3">최근 10매치</h5>
                    <!-- 유저 최근 매치 -->
                    <div id="record">

                    </div>
                </div>
            </div>
        </section>
        <c:import url="/WEB-INF/jsp/include/footer.jsp" />
    </div>

    <script src="/static/js/getAjax.js"></script>
    <script src="/static/js/getName.js"></script>
    <script src="/static/js/assetImages.js"></script>
    <script src="/static/js/matchDetails.js"></script>
    <script src="/static/js/fetchWeaponBgImg.js"></script>
    <script src="/static/js/fetchTraitIcon.js"></script>
    <script>
        $(document).ready(async function() {
            await loadAssetConfig();

            $("#refresh").on("click", function() {
                location.reload();
            });
            // 나의 유저 번호
            let userNum = getParameterByName("userNum");

            if(userNum == null) {
                alert("존재하지 않는 닉네임 입니다.");
            } else {

                 // 유저 랭크 정보 가져오기
                 let mmr = 0;
                let rank = 0;
                let averageTotalKill = 0;
                let topOne = 0;
                let topTwo = 0;
                let topThree = 0;
                var game = 0;
                let averageKill = 0;
                let averageAsist = 0;
                let averageRank = 0;
                var totalDamage = 0;
                var damage = 0;
                var averageDamage = 0;

                const recentRequest = Promise.resolve($.ajax({type: 'get', url: '/er/user/detail', dataType: 'json', data: {userNum: userNum}, timeout: 15000})).then(data => ({data}), error => ({error}));
                // Rank and recent records render independently.
                const renderRank = async () => {
                try {
                    let data = await $.ajax({
                        type:"get",
                        url:"/er/userRank",
                        dataType:"json",
                        data:{"userNum":userNum}
                    });

                        // 랭크 플레이 한 유저만 불러오기
                        if(Array.isArray(data.userStats) && data.userStats.length){
                            let rankItems = data.userStats[0];
                            mmr = rankItems.mmr;
                            rank = rankItems.rank;
                            // 총 게임 수
                            game = rankItems.totalGames;
                            // 킬 수
                            let totalKill = rankItems.totalTeamKills;
                            averageTotalKill = game ? totalKill/game : 0;
                            topOne = rankItems.top1 * 100;
                            topTwo = rankItems.top2 * 100;
                            topThree = rankItems.top3 * 100;
                            averageKill = rankItems.averageKills;
                            averageAsist = rankItems.averageAssistants;
                            averageRank = rankItems.averageRank;
                            var sideCharacter = rankItems.characterStats || [];
                            // 내가 플레이 한 캐릭터 전적
                            let sideCharacterRows = await Promise.all(sideCharacter.map(async function(characterStat) {
                                let sideCharacterCode = characterStat.characterCode;
                                let names = await Promise.all([
                                    getCharacterName(sideCharacterCode),
                                    getKoreanCharacterName(sideCharacterCode)
                                ]);
                                let sideCharacterName = names[0];
                                let sideKorName = names[1];
                                let winRate = (characterStat.wins / characterStat.usages) * 100;
                                let games = characterStat.usages;
                                let wins = characterStat.wins;
                                let maxKillings = characterStat.maxKillings;
                                let sideCharImg = "" + erAssetBase + "CharResult_" + sideCharacterName + "_S000.png"
                                return "<tr class='side-main'>"
                                        + "<td class='align-middle'><a class='image-wrapper'><img src='" + sideCharImg + "' width='67px' height='56px'></a></td>"
                                        + "<td class='align-middle'>" + sideKorName + "<br><a class='side-total-games'>" + games + "게임</a></td>"
                                        + "<td class='align-middle'>" + winRate.toFixed(2) + "%</td>"
                                        + "<td class='align-middle'>" + wins + "</td>"
                                        + "<td class='align-middle'>" + maxKillings + "</td>"
                                    + "</tr>";
                            }));
                            $("#sideRecord").append(sideCharacterRows.join(""));
                        } else {
                            mmr = 0;
                        }
                } catch(error) {
                    console.error("Error fetching user rank: ", error);
                        $("#rankText").text("랭크 정보를 불러오지 못했습니다.");
                }

                // 화면에 표시
                $("#averageTk").append(averageTotalKill.toFixed(2));
                $("#rankOne").append(Math.floor(topOne) + "%");
                $("#topOnePercentBar").css("width", Math.floor(topOne)+"%");
                $("#rankTwo").append(Math.floor(topTwo) + "%");
                $("#topTwoPercentBar").css("width", Math.floor(topTwo)+"%");
                $("#rankThree").append(Math.floor(topThree) + "%");
                $("#topThreePercentBar").css("width", Math.floor(topThree)+"%");
                $("#totalGame").append(game);
                $("#averageKill").append(averageKill);
                $("#averageAsist").append(averageAsist);
                $("#averageRank").append(averageRank.toFixed(1));
                $("#rp").append(mmr);

                // mmr에 따라 티어 정보 불러오기
                let mmrImg = 0;
                let tier = "";
                let mmrStr = mmr + "";
                mmrStr = mmrStr.substring(1,4);
                if(mmrStr < 250) {
                    mmrStr = 4;
                } else if(mmrStr < 500) {
                    mmrStr = 3;
                } else if(mmrStr < 750) {
                    mmrStr = 2;
                } else if(mmrStr <= 999) {
                    mmrStr = 1;
                }

                if(mmr == 0) {
                    mmrImg = 0;
                } else if(mmr < 1000) {
                    mmrImg = 1;
                    tier = "아이언 " + mmrStr;
                } else if(mmr < 2000) {
                    mmrImg = 2;
                    tier = "브론즈 " + mmrStr;
                } else if(mmr < 3000) {
                    mmrImg = 3;
                    tier = "실버 " + mmrStr;
                } else if(mmr < 4000) {
                    mmrImg = 4;
                    tier = "골드 " + mmrStr;
                } else if(mmr < 5000) {
                    mmrImg = 5;
                    tier = "플래티넘 " + mmrStr;
                } else if(mmr < 6000) {
                    mmrImg = 6;
                    tier = "다이아몬드 " + mmrStr;
                } else if(rank < 1000) {
                    mmrImg = 66;
                    tier = "미스릴";
                } else if(rank < 500) {
                    mmrImg = 7;
                    tier = "데미갓";
                } else if(rank < 200) {
                    mmrImg = 8;
                    tier = "이터니티";
                }

                $("#tier").append(tier);
                $("#rank").append(rank + "위");
                var rankImg = "https://cdn.dak.gg/er/images/tier/round/" + mmrImg + ".png";
                $("#rankImg").attr("src", rankImg);
                };
                renderRank().catch(console.error);

                recentRequest.then(async function (result) {
                        if (result.error) { $('#record').text('최근 전적 조회에 실패했습니다. 새로고침해 주세요.'); return; }
                        const data = result.data;
                    let items = (data.userGames || []).slice(0, 10);
                    if (!items.length) { $('#record').text('최근 경기 기록이 없습니다.'); return; }
                    let characterCodes = items.map(item => item.characterNum);
                    let skinCodes = items.map(item => item.skinCode);
                    let firstUserNickname = items[0].nickname;
                    let level = items[0].accountLevel;

                    $("#userLevel").append("레벨 " + level);
                    $("#nickname").text(firstUserNickname);

                    getCharacterName(items[0].characterNum).then(name => {
                        $('#detailImage').attr('src', erAssetBase + 'CharResult_' + name + '_S000.png');
                    });
                    let commonMetadata = await Promise.all([
                        $.ajax({type:"get", url:"/er/trait", dataType:"json"}),
                        $.ajax({type:"get", url:"/er/skillInfo", dataType:"json"}),
                        $.ajax({type:"get", url:"/er/tacticalSkill", dataType:"json"})
                    ]);
                    let traitItems = commonMetadata[0].data || [];
                    let allSkillItems = commonMetadata[1].data || [];
                    let tacticalItems = commonMetadata[2].data || [];
                    for (let i = 0; i < items.length; i++) {
                        // 유저 고유 번호
                        let characterCode = items[i].characterNum;
                        // 캐릭터 이름
                        let characterImgName = await getCharacterName(characterCode);
                        // 스킨 이름
                        let skinCode = items[i].skinCode;
                        // 플레이 타임
                        let playTime = items[i].totalTime;
                        // 캐릭터 레벨
                        let charLevel = items[i].characterLevel;
                        // 무기 코드
                        let weaponCode = items[i].bestWeapon;
                        // 전술 스킬
                        let tacticalSkillCode = items[i].tacticalSkillGroup;
                        // 특성
                        // 메인특성
                        let traitFirst = items[i].traitFirstCore - 1;
                        // 메인특성 서브
                        let traitFirstSub = items[i].traitFirstSub;
                        // 서브특성
                        let traitSecondSub = items[i].traitSecondSub;
                        // 데미지
                        damage = items[i].damageToPlayer;
                        totalDamage = totalDamage + damage;

                        // 게임 고유 ID
                        let gameId = items[i].gameId;

                        // 게임 시작 시간
                        let startDate = items[i].startDtm;
                        let date = new Date(startDate);
                        let dateFormat = date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
                        let timeFormat = ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);

                        // 시간 나누기
                        let minute = Math.floor(playTime/60);
                        let second = playTime%60;

                        // 팀 전체 킬
                        let totalKill = items[i].totalFieldKill;
                        // 본인 킬
                        let playerKill = items[i].playerKill;
                        // 어시스트
                        let assist = items[i].playerAssistant;
                        // 딜량
                        let damageToPlayer = items[i].damageToPlayer;
                        // 데스
                        let death = items[i].playerDeaths;

                        const renderGameDetails = async function() {
                            var resultHtml1 = "";
                           var resultHtml2 = "";
                           var resultHtml3 = "";
                           var resultHtml4 = "";
                           var resultHtml5 = "";
                           var resultHtml6 = "";
                           var resultHtml7 = "";
                           var resultHtml8 = "";
                            {
                                // 최근 10게임 상세는 위에서 병렬 조회한 결과를 순서대로 렌더링한다.
                                let data = await $.ajax({type: 'get', url: '/er/game', dataType: 'json', data: {gameId: gameId}, timeout: 15000});
                                let gameItems = data.userGames;
                                    for(let j = 0; j < gameItems.length; j++) {

                                        // 캐릭터 이름
                                        let resultCharacterImgName = await getCharacterName(gameItems[j].characterNum);
                                        let resultWeaponName = getWeaponName(gameItems[j].bestWeapon);
                                        let resultTacticalSkillCode = gameItems[j].tacticalSkillGroup;
                                        let resultSkinCode = gameItems[j].skinCode + "";

                                        resultSkinCode = resultSkinCode.slice(-3).padStart(3, '0');
                                        // 메인특성
                                        let resultTraitFirst = gameItems[j].traitFirstCore - 1;
                                        // 메인특성 서브
                                        let resultTraitFirstSub = gameItems[j].traitFirstSub;
                                        // 서브특성
                                        let resultTraitSecondSub = gameItems[j].traitSecondSub;
                                        // 전술 스킬 정보 가져오기

                                        let resultTactical = "";
                                        let resultMainIcon = "";
                                        let resultIcon = "";
                                            resultTactical = fetchTacticalIcon(resultTacticalSkillCode, tacticalItems);
                                            resultMainIcon = fetchTraitMainIcon(resultTraitSecondSub, traitItems);
                                            resultIcon = fetchSkillIcon(resultTraitFirst, allSkillItems);

                                         // 팀 전체 킬
                                        let resultTotalKill = gameItems[j].totalFieldKill;
                                        // 본인 킬
                                        let resultPlayerKill = gameItems[j].playerKill;
                                        // 어시스트
                                        let resultAssist = gameItems[j].playerAssistant;
                                        // 딜량
                                        let resultDamageToPlayer = gameItems[j].damageToPlayer;
                                        // 데스
                                        let resultDeath = gameItems[j].playerDeaths;

                                        // 장착한 장비
                                        // 1: 무기, 2: 옷, 3: 머리, 4: 팔, 5: 다리
                                        let resultItem1 = gameItems[j].equipment[0];
                                        let resultItem2 = gameItems[j].equipment[1];
                                        let resultItem3 = gameItems[j].equipment[2];
                                        let resultItem4 = gameItems[j].equipment[3];
                                        let resultItem5 = gameItems[j].equipment[4];

                                        // 장비 등급 및 아이템 이미지 경로 가져오기
                                        let resultItemBackgrounds = await Promise.all([
                                            fetchWeaponAndArmorBgImg(resultItem1, "weapon"),
                                            fetchWeaponAndArmorBgImg(resultItem2, "armor"),
                                            fetchWeaponAndArmorBgImg(resultItem3, "armor"),
                                            fetchWeaponAndArmorBgImg(resultItem4, "armor"),
                                            fetchWeaponAndArmorBgImg(resultItem5, "armor")
                                        ]);
                                        let resultWeaponBgImg = resultItemBackgrounds[0];
                                        let resultArmorBgImg1 = resultItemBackgrounds[1];
                                        let resultArmorBgImg2 = resultItemBackgrounds[2];
                                        let resultArmorBgImg3 = resultItemBackgrounds[3];
                                        let resultArmorBgImg4 = resultItemBackgrounds[4];

                                        let resultKDA = 0;
                                        // kda 계산
                                        if(!resultDeath == 0){
                                            resultKDA = ((resultPlayerKill + resultAssist) / resultDeath).toFixed(2);
                                        } else {
                                            resultKDA = "PERFECT";
                                        }
                                        if(gameItems[j].gameRank == 1){
                                            resultHtml1 = resultHtml1
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        }
                                        if (gameItems[j].gameRank == 2){
                                            resultHtml2 = resultHtml2
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        }
                                        if (gameItems[j].gameRank == 3){
                                            resultHtml3 = resultHtml3
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        } else if (gameItems[j].gameRank == 4){
                                            resultHtml4 = resultHtml4
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        } else if (gameItems[j].gameRank == 5){
                                            resultHtml5 = resultHtml5
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        } else if (gameItems[j].gameRank == 6){
                                            resultHtml6 = resultHtml6
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        } else if (gameItems[j].gameRank == 7){
                                            resultHtml7 = resultHtml7
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                        } else if (gameItems[j].gameRank == 8){
                                            resultHtml8 = resultHtml8
                                            + "<div><div class='d-flex justify-content-around align-items-center one'>"
                                                + "<div class='user-rank text-center'>"
                                                    + "<div class='rank text-primary'>#" + gameItems[j].gameRank + "</div>"
                                                + "</div>"

                                                + "<div class='d-flex ml-1'>"
                                                    + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + resultCharacterImgName + "_S" + resultSkinCode + ".png' width='60' height='62'>"
                                                    + "<div class='character-level'>" + gameItems[j].characterLevel + "</div>"
                                                + "</div>"

                                                + "<div class='image-group align-items-center'>"
                                                    + "<div>"
                                                        + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + resultWeaponName + ".png' width='25' height='25'><br>"
                                                        + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + resultTactical + ".png' width='25' height='25'>"
                                                    + "</div>"
                                                    + "<div>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + resultIcon + ".png' width='25' height='25'><br>"
                                                        + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + resultMainIcon + "02.png' width='25' height='25'>"
                                                    + "</div>"
                                                + "</div>"

                                                + "<div class='info-group d-flex'>"
                                                    + "<div class='ml-4 total-kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultTotalKill + "/" + resultPlayerKill + "/" + resultAssist + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kill'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                                         + "<h5 class='kill-record mt-2'>" + resultDamageToPlayer + "</h5>"
                                                    + "</div>"

                                                    + "<div class='ml-4 kda'>"
                                                        + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                                        + "<h5 class='kill-record mt-2'>" + resultKDA + "</h5>"
                                                    + "</div>"
                                                +"</div>"

                                                + "<div class='finish-items ml-2'>"
                                                    + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                                        + "<div >"
                                                              + "<img class='item-back' src='" + resultWeaponBgImg + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem1 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg1 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem2 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg2 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem3 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                      + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg3 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem4 + ".png'>"
                                                          + "</div>"
                                                          + "<div>"
                                                              + "<img class='item-back' src='" + resultArmorBgImg4 + "'>"
                                                            + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + resultItem5 + ".png'>"
                                                          + "</div>"
                                                      + "</div>"
                                                  + "</div>"
                                            + "</div></div>"
                                    }
                                }
                            }

                         var resultHtml = resultHtml1 + "<hr>" + resultHtml2 + "<hr>" + resultHtml3 + "<hr>"
                         + resultHtml4 + "<hr>" + resultHtml5 + "<hr>" + resultHtml6 + "<hr>"
                         + resultHtml7 + "<hr>" + resultHtml8;
                            return resultHtml;
                        };
                        matchDetailLoaders.set(String(gameId), renderGameDetails);
                        const resultHtml = '';
                        // 장착한 장비
                        // 1: 무기, 2: 옷, 3: 머리, 4: 팔, 5: 다리
                        let item1 = items[i].equipment[0];
                        let item2 = items[i].equipment[1];
                        let item3 = items[i].equipment[2];
                        let item4 = items[i].equipment[3];
                        let item5 = items[i].equipment[4];

                        let kda = "";
                        // kda 계산
                        if(!death == 0){
                            kda = ((playerKill + assist) / death).toFixed(2);
                        } else {
                            kda = "PERFECT";
                        }

                        // 무기 이름
                        let weaponName = getWeaponName(weaponCode);

                        // 전술 스킬
                        let tactical = "";
                        // 모드
                        let mode = "";
                        // 특성
                        let icon = "";
                        let mainIcon = "";

                        skinCode = skinCode + "";
                        // 스킨 코드 이미지 적용 번호
                        skinCode = skinCode.slice(-3).padStart(3, '0');


                        // 매칭 모드(2:일반, 3:랭크, 4:코발트)
                        if(items[i].matchingMode == 2) {
                            mode = "일반";
                        } else if(items[i].matchingMode == 3) {
                            mode = "랭크";
                        } else {
                            mode = "코발트";
                        }

                        // 장비 등급 및 아이템 이미지 경로 가져오기
                        let itemBackgrounds = await Promise.all([
                            fetchWeaponAndArmorBgImg(item1, "weapon"),
                            fetchWeaponAndArmorBgImg(item2, "armor"),
                            fetchWeaponAndArmorBgImg(item3, "armor"),
                            fetchWeaponAndArmorBgImg(item4, "armor"),
                            fetchWeaponAndArmorBgImg(item5, "armor")
                        ]);
                        let weaponBgImg = itemBackgrounds[0];
                        let armorBgImg1 = itemBackgrounds[1];
                        let armorBgImg2 = itemBackgrounds[2];
                        let armorBgImg3 = itemBackgrounds[3];
                        let armorBgImg4 = itemBackgrounds[4];

                        mainIcon = fetchTraitMainIcon(traitSecondSub, traitItems);
                        icon = fetchSkillIcon(traitFirst, allSkillItems);
                        tactical = fetchTacticalIcon(tacticalSkillCode, tacticalItems);



                        let html =
                            "<div class='one-record btn-group mt-2' role='button' data-game-id='" + gameId + "' tabindex='0' aria-expanded='false'>"
                                + "<div class='d-flex justify-content-around align-items-center one'>"
                                    + "<div class='user-rank text-center'>"
                                        + "<div class='rank text-primary'>#" + items[i].gameRank + "</div>"
                                        + "<div class='modeText'>" + mode + "</div>"
                                        + "<div class='timeText'>" + minute + "분 " + second + "초</div>"
                                        + "<div class='date text-secondary'>" + dateFormat + " " + timeFormat + "</div>"
                                    + "</div>"

                                    + "<div class='d-flex ml-1'>"
                                        + "<img class='character-image image-all' src='" + erAssetBase + "CharProfile_" + characterImgName + "_S" + skinCode + ".png' width='60' height='62'>"
                                        + "<div class='character-level'>" + charLevel + "</div>"
                                    + "</div>"

                                    + "<div class='image-group align-items-center'>"
                                        + "<div>"
                                            + "<img class='image-weapon mt-2' src='" + erAssetBase + "Ico_Ability_" + weaponName + ".png' width='25' height='25'><br>"
                                            + "<img class='tactical-skill mt-2' src='" + erAssetBase + "" + tactical + ".png' width='25' height='25'>"
                                        + "</div>"
                                        + "<div>"
                                            + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "" + icon + ".png' width='25' height='25'><br>"
                                            + "<img class='trait-image mt-2 ml-1' src='" + erAssetBase + "TraitSkillIcon_" + mainIcon + "02.png' width='25' height='25'>"
                                        + "</div>"
                                    + "</div>"

                                    + "<div class='info-group d-flex'>"
                                        + "<div class='ml-4 total-kill'>"
                                            + "<div class='kill-info mt-2 text-secondary'>TK/K/A</div>"
                                            + "<h5 class='kill-record mt-2'>" + totalKill + "/" + playerKill + "/" + assist + "</h5>"
                                        + "</div>"

                                        + "<div class='ml-4 kill'>"
                                            + "<div class='kill-info mt-2 text-secondary'>딜량</div>"
                                             + "<h5 class='kill-record mt-2'>" + damageToPlayer + "</h5>"
                                        + "</div>"

                                        + "<div class='ml-4 kda'>"
                                            + "<div class='kill-info mt-2 text-secondary'>평점(KDA)</div>"
                                            + "<h5 class='kill-record mt-2'>" + kda + "</h5>"
                                        + "</div>"
                                    +"</div>"

                                    + "<div class='finish-items ml-2'>"
                                        + "<div class='d-flex text-center mb-2 justify-content-center align-items-top'>"
                                            + "<div >"
                                                  + "<img class='item-back' src='" + weaponBgImg + "'>"
                                                + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + item1 + ".png'>"
                                              + "</div>"
                                              + "<div>"
                                                  + "<img class='item-back' src='" + armorBgImg1 + "'>"
                                                + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + item2 + ".png'>"
                                              + "</div>"
                                              + "<div>"
                                                  + "<img class='item-back' src='" + armorBgImg2 + "'>"
                                                + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + item3 + ".png'>"
                                              + "</div>"
                                          + "</div>"
                                          + "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
                                              + "<div>"
                                                  + "<img class='item-back' src='" + armorBgImg3 + "'>"
                                                + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + item4 + ".png'>"
                                              + "</div>"
                                              + "<div>"
                                                  + "<img class='item-back' src='" + armorBgImg4 + "'>"
                                                + "<img class='route-item' src='" + erAssetBase + "ItemIcon_" + item5 + ".png'>"
                                              + "</div>"
                                          + "</div>"
                                      + "</div>"
                                + "</div>"
                             + "<button type='button' data-id='" + gameId + "' class='btn btn-primary plus-btn btn-group-sm'>▼</button>"
                             + "</div>"
                            + "<div class='detail-box' hidden>" + resultHtml + "</div>"




                        $("#record").append(html);

                        var averageDamage = 0;
                        averageDamage = Math.floor(totalDamage / items.length);
                    }
                    $("#averageDamage").text(averageDamage);
                }).catch(error => { console.error(error); $("#record").append("<p>일부 전적을 불러오지 못했습니다. 다시 시도해 주세요.</p>"); });
            }
        });
    </script>
</body>
</html>
