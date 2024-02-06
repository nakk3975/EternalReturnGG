<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
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
			<div class="d-flex">
				<!-- 좌측 유저 상세 정보 -->
				<div class="col-4 mt-4 text-center">
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
				<div id="recordDetail" class="col-8 m-4">
					<h5 class="ml-4">최근 10매치</h5>
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
	<script src="/static/js/fetchWeaponBgImg.js"></script>
	<script src="/static/js/fetchTraitIcon.js"></script>
	<script>
		$(document).ready(function() {
			
			$("#refresh").on("click", function() {
				location.reload();
			});			 
		    let userNum = getParameterByName("userNum");
		    
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
			
			// 유저 상세 정보
			$.ajax({
				type:"get"
				, url:"/er/userRank"
				, dataType:"json"
				, async:false
				, data:{"userNum":userNum}
				, success:async function(data) {
					// 랭크 플레이 한 유저만 불러오기
					if(data.code != 404){
						let rankItems = data.userStats[0];
						mmr = rankItems.mmr;
						rank = rankItems.rank;
						// 총 게임 수
						game = rankItems.totalGames;
						// 킬 수
						let totalKill = rankItems.totalTeamKills;
						averageTotalKill = totalKill/game;
						topOne = rankItems.top1 * 100;
						topTwo = rankItems.top2 * 100;
						topThree = rankItems.top3 * 100;
						averageKill = rankItems.averageKills;
						averageAsist = rankItems.averageAssistants;
						averageRank = rankItems.averageRank;
						var sideCharacter = rankItems.characterStats;
						// 내가 플레이 한 캐릭터 전적
						for(let i = 0; i < sideCharacter.length; i++) {
							let sideCharacterCode = sideCharacter[i].characterCode;
							let sideCharacterName = await getCharacterName(sideCharacterCode);
							let sideKorName = await getKoreanCharacterName(sideCharacterCode)
							let winRate = (sideCharacter[i].wins / sideCharacter[i].usages) * 100;
							let games = sideCharacter[i].usages;
							let wins = sideCharacter[i].wins;
							let maxKillings = sideCharacter[i].maxKillings;
							let sideCharImg = "https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharResult_" + sideCharacterName + "_S000.png"
							let html=
								"<tr class='side-main'>"
									+ "<td class='align-middle'><a class='image-wrapper'><img src='" + sideCharImg + "' width='67px' height='56px'></a></td>"
									+ "<td class='align-middle'>" + sideKorName + "<br><a class='side-total-games'>" + games + "게임</a></td>"
									+ "<td class='align-middle'>" + winRate.toFixed(2) + "%</td>"
									+ "<td class='align-middle'>" + wins + "</td>"
									+ "<td class='align-middle'>" + maxKillings + "</td>"
								+ "</tr>";
							$("#sideRecord").append(html);
						}
					} else {
						mmr = 0;
					}
				}
				, error:function() {
					alert("유저 랭크 정보 불러오기 오류");
				}
			});
			
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
			mmrStr = mmr + "";
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
			

		    getAjax("/er/user/detail", { "userNum": userNum }, async function (data) {
		        let items = data.userGames;
		        let characterCodes = items.map(item => item.characterNum);
		        let skinCodes = items.map(item => item.skinCode);
  
		        let firstUserNickname = items[0].nickname;
		        let level = items[0].accountLevel;

                $("#userLevel").append("레벨 " + level);
                $("#nickname").append(firstUserNickname);
		        
		        // 가장 많이한 캐릭터
		        // Fetch character and skin information in advance to avoid duplicate calls
		        getAjax("/er/character", {}, function (characterData) {
		            let charItems = characterData.data;
		            let duplicatedCharInfo = characterCodes
		                .filter((value, index, self) => self.indexOf(value) !== index)
		                .map(duplicatedCode => charItems.find(item => item.code === duplicatedCode));
		            let codeFrequency = {};	
		         	// 가장 많이 중복된 코드 찾기
		            let mostFrequentCode = "";
		            if(duplicatedCharInfo.length == 0) {
		            	mostFrequentCode = characterCodes[0];
		            } else {
		            	for (let i = 0; i < duplicatedCharInfo.length; i++) {
			                let code = duplicatedCharInfo[i].code;
			                codeFrequency[code] = (codeFrequency[code] || 0) + 1;
			            }
		            	let maxCount = 0;
			            for (let code in codeFrequency) {
			                if (codeFrequency[code] > maxCount) {
			                    maxCount = codeFrequency[code];
			                    mostFrequentCode = code;
			                }
			            }
		            }
		            // 가장 많이 한 캐릭터 이름 가져오기
		            let characterName = "";
		            for (let i = 0; i < charItems.length; i++) {
			         	if(mostFrequentCode == charItems[i].code) {
			         		characterName = charItems[i].name;
			         	}
		            }
		            // 가장 많이 쓴 스킨 정보 가져오기
		            getAjax("/er/skin/info", {}, function (skinData) {
		                let skinItems = skinData.data;
		                let duplicatedSkinInfo = skinCodes
		                    .filter((value, index, self) => self.indexOf(value) !== index)
		                    .map(duplicatedCode => skinItems.find(item => item.code === duplicatedCode));
		                
		                let skinImageCode = "";
		                let skinCodeFrequency = {};
		                if(duplicatedSkinInfo.length == 0) {
		                	skinImageCode = skinCodes[0];
		                } else {
			                for (let i = 0; i < duplicatedSkinInfo.length; i++) {
				                let code = duplicatedSkinInfo[i].code;
				                skinCodeFrequency[code] = (skinCodeFrequency[code] || 0) + 1;
				            }
			            	let maxCount = 0;
				            for (let code in skinCodeFrequency) {
				                if (skinCodeFrequency[code] > maxCount) {
				                    maxCount = skinCodeFrequency[code];
				                    skinImageCode = code;
				                }
				            }
		                }
			            skinImageCode = skinImageCode + "";
			            skinImageCode = skinImageCode.substring(4, 7);

			            if(skinImageCode == " ") {
			            	
			            }
			            
		                let image = "https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharResult_" + characterName + "_S" + skinImageCode + ".png";
		                $("#detailImage").attr("src", image);
		                
		            });
		        });

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
					skinCode = skinCode.substring(4,7);
					
					
					// 매칭 모드(2:일반, 3:랭크, 4:코발트)
					if(items[i].matchingMode == 2) {
						mode = "일반";
					} else if(items[i].matchingMode == 3) {
						mode = "랭크";
					} else {
						mode = "코발트";
					}
		        	
		            // 장비 등급 및 아이템 이미지 경로 가져오기
					let weaponBgImg = await fetchWeaponAndArmorBgImg(item1, "weapon");
		            let armorBgImg1 = await fetchWeaponAndArmorBgImg(item2, "armor");
					let armorBgImg2 = await fetchWeaponAndArmorBgImg(item3, "armor");
					let armorBgImg3 = await fetchWeaponAndArmorBgImg(item4, "armor");
					let armorBgImg4 = await fetchWeaponAndArmorBgImg(item5, "armor");

					
		            // 메인 특성 정보 가져오기
		            await $.ajax({
						type:"get"
						, url:"/er/trait"
						, dataType:"json"
						, success:function(data) {
							let traitItems = data.data;
	           	 			mainIcon = fetchTraitMainIcon(traitSecondSub, traitItems);
						}
		            });
		            // 특성 스킬 정보 가져오기
		            await $.ajax({
			        	type:"get"
			        	, url:"/er/skillInfo"
			        	, dataType:"json"
			        	, success:function(data) {
			        		let allSkillItems = data.data;
	            			icon = fetchSkillIcon(traitFirst, allSkillItems);
			        	}
		            });

		            // 전술 스킬 정보 가져오기
		            await $.ajax({
						type:"get"
						, url:"/er/tacticalSkill"
						, dataType: "json"
						, success:function(data) {
							let tacticalItems = data.data;
	            			tactical = fetchTacticalIcon(tacticalSkillCode, tacticalItems);
						}
		            });
		   	
					let html = 
						"<div class='oneRecord btn-group mt-2' role='group'>"
							+ "<div class='d-flex justify-content-around align-items-center one'>"	
								+ "<div class='user-rank text-center'>"
									+ "<div class='rank text-primary'>#" + items[i].gameRank + "</div>"
									+ "<div class='modeText'>" + mode + "</div>"
									+ "<div class='timeText'>" + minute + "분 " + second + "초</div>"
									+ "<div class='date text-secondary'>" + dateFormat + " " + timeFormat + "</div>"
								+ "</div>"
								
								+ "<div class='d-flex ml-1'>"
									+ "<img class='character-image image-all' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharProfile_" + characterImgName + "_S" + skinCode + ".png' width='60' height='62'>"
									+ "<div class='character-level'>" + charLevel + "</div>"
								+ "</div>"
								
								+ "<div class='image-group align-items-center'>"
									+ "<div>"
										+ "<img class='image-weapon mt-2' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/Ico_Ability_" + weaponName + ".png' width='25' height='25'><br>"
										+ "<img class='tactical-skill mt-2' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/" + tactical + ".png' width='25' height='25'>"
									+ "</div>"
									+ "<div>"
										+ "<img class='trait-image mt-2 ml-1' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/" + icon + ".png' width='25' height='25'><br>"
										+ "<img class='trait-image mt-2 ml-1' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/TraitSkillIcon_" + mainIcon + "02.png' width='25' height='25'"
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
						 	 				+ "<img class='item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + weaponBgImg + ".svg'>"
							 	 			+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item1 + ".png'>"
							 	 		+ "</div>"
							 	 		+ "<div>"
					 	 					+ "<img class='item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg1 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item2 + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg2 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item3 + ".png'>"
						 	 			+ "</div>"
					 	 			+ "</div>"
					 	 			+ "<div class='d-flex text-center align-items-center justify-content-center mb-2'>"
						 	 			+ "<div>"
					 	 					+ "<img class='item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg3 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item4 + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg4 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item5 + ".png'>"
						 	 			+ "</div>"
					 	 			+ "</div>"
					 	 		+ "</div>"
							+ "</div>"
						+ "</div>"
					 	+ "<button type='button' class='btn btn-primary plus-btn btn-group-sm'>▼</button>"
					 	
					
					$("#record").append(html);
					$("#rankImg").attr("src", rankImg);
				    var averageDamage = 0;
				    if(game != 0) {
				    	averageDamage = Math.floor(totalDamage / 10);	
				    }
				}
		    $("#averageDamage").append(averageDamage);
            });
		   
	    });
	</script>
</body>
</html>