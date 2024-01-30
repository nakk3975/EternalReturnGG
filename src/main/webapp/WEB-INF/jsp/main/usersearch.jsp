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
			<div id="infoBox" class="bg-secondary d-flex text-white">
				<img id="detailImage" src="#">
				<div class="ml-3">
					<h6 id="userLevel"></h6>
					<h2 id="nickname"></h2>
					<button type="button" id="refresh" class="btn btn-primary mt-5">최신 정보</button>
				</div>
			</div>
			<div class="d-flex">
				<div id="userRecord" class="col-3">
					<!-- 상단 유저 정보 -->
				</div>
				<div id="recordDetail" class="col-9 m-4">
					<h5 class="ml-4">최근 10매치</h5>
					<div id="record">
						<!-- 유저 최근 매치 -->
					</div>
				</div>
			</div>
		</section>
		<c:import url="/WEB-INF/jsp/include/footer.jsp" />
	</div>
	
	<script src="/static/js/getParameterByName.js"></script>
	<script src="/static/js/getCharacterName.js"></script>
	<script src="/static/js/getWeaponName.js"></script>
	<script>
		$(document).ready(function() {

			$("#refresh").on("click", function() {
				location.reload();
			});			 
	        // Get userNum from query parameters
	        let userNum = getParameterByName("userNum");
	        // Make AJAX request to fetch user details
	       		
	        $.ajax({
	            type: "get"
	            , url: "/er/user/detail"
	            , data: {"userNum":userNum}
	            , dataType: "json"
	            , success: function(data){
	            	let items = data.userGames;
	
	                // 첫 번째 사용자의 닉네임 가져오기
	                let firstUserNickname = items[0].nickname;
	                let level = items[0].accountLevel;
					let characterName = "";
					let skinImageCode = "";
					let characterCodes = items.map(item => item.characterNum);
					let skinCodes = items.map(item => item.skinCode);
					
					for(let i = 0; i < items.length; i++){
						// 유저 고유 번호
						let characterCode = items[i].characterNum;
						// 캐릭터 이름
						let characterImgName = getCharacterName(characterCode);
						// 스킨 이름
						let skinCode = items[i].skinCode;
						// 플레이 타임
						let playTime = items[i].playTime;
						// 캐릭터 레벨
						let level = items[i].characterLevel;
						// 무기 코드
						let weaponCode = items[i].bestWeapon;
						// 전술 스킬
						let tacticalSkillCode = items[i].tacticalSkillGroup;
						// 특성
						let traitFirst = items[i].traitFirstCore - 1;
						let traitFirstSub = items[i].traitFirstSub;
						let traitSecondSub = items[i].traitSecondSub;
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
						let secondIcon = "";
						let mainIcon = "";
						
						skinCode = skinCode + "";
						skinCode = skinCode.substring(4,7);
						
						// 매칭 모드(2:일반, 3:랭크, 4:코발트)
						if(items[i].matchingMode == 2) {
							mode = "일반";
						} else if(items[i].matchingMode == 3) {
							mode = "랭크";
						} else {
							mode = "코발트";
						}
			
						let weaponBgImg = "";
						// 장비 등급
						$.ajax({
							type:"get"
							, url:"/er/weapon"
							, dataType:"json"
							, async:false
							, success:function(data) {
								let weaponItems = data.data;
								for(let j = 0; j < weaponItems.length; j++) {
									if(item1 == weaponItems[j].code){
										if(weaponItems[j].itemGrade == "Common") {
											weaponBgImg = "1";
										} else if(weaponItems[j].itemGrade == "Uncommon") {
											weaponBgImg = "2";
										} else if(weaponItems[j].itemGrade == "Rare") {
											weaponBgImg = "3";
										} else if(weaponItems[j].itemGrade == "Epic") {
											weaponBgImg = "4";
										} else if(weaponItems[j].itemGrade == "Legend") {
											weaponBgImg = "5";
										}
									}
								}
							}
						});
						let armorBgImg1 = "";
						let armorBgImg2 = "";
						let armorBgImg3 = "";
						let armorBgImg4 = "";
						// 장비 등급
						$.ajax({
							type:"get"
							, url:"/er/armor"
							, dataType:"json"
							, async:false
							, success:function(data) {
								let weaponItems = data.data;
								for(let j = 0; j < weaponItems.length; j++) {
									if(item2 == weaponItems[j].code){
										if(weaponItems[j].itemGrade == "Common") {
											armorBgImg1 = "1";
										} else if(weaponItems[j].itemGrade == "Uncommon") {
											armorBgImg1 = "2";
										} else if(weaponItems[j].itemGrade == "Rare") {
											armorBgImg1 = "3";
										} else if(weaponItems[j].itemGrade == "Epic") {
											armorBgImg1 = "4";
										} else if(weaponItems[j].itemGrade == "Legend") {
											armorBgImg1 = "5";
										}
									}
									
									if(item3 == weaponItems[j].code){
										if(weaponItems[j].itemGrade == "Common") {
											armorBgImg2 = "1";
										} else if(weaponItems[j].itemGrade == "Uncommon") {
											armorBgImg2 = "2";
										} else if(weaponItems[j].itemGrade == "Rare") {
											armorBgImg2 = "3";
										} else if(weaponItems[j].itemGrade == "Epic") {
											armorBgImg2 = "4";
										} else if(weaponItems[j].itemGrade == "Legend") {
											armorBgImg2 = "5";
										}
									}
									
									if(item4 == weaponItems[j].code){
										if(weaponItems[j].itemGrade == "Common") {
											armorBgImg3 = "1";
										} else if(weaponItems[j].itemGrade == "Uncommon") {
											armorBgImg3 = "2";
										} else if(weaponItems[j].itemGrade == "Rare") {
											armorBgImg3 = "3";
										} else if(weaponItems[j].itemGrade == "Epic") {
											armorBgImg3 = "4";
										} else if(weaponItems[j].itemGrade == "Legend") {
											armorBgImg3 = "5";
										}
									}
									
									if(item5 == weaponItems[j].code){
										if(weaponItems[j].itemGrade == "Common") {
											armorBgImg4 = "1";
										} else if(weaponItems[j].itemGrade == "Uncommon") {
											armorBgImg4 = "2";
										} else if(weaponItems[j].itemGrade == "Rare") {
											armorBgImg4 = "3";
										} else if(weaponItems[j].itemGrade == "Epic") {
											armorBgImg4 = "4";
										} else if(weaponItems[j].itemGrade == "Legend") {
											armorBgImg4 = "5";
										}
									}
								}
							}
						});
						
						// 메인 특성 정보
						$.ajax({
							type:"get"
							, url:"/er/trait"
							, dataType:"json"
							, async:false
							, success:function(data) {
								let traitItems = data.data;
								for(let j = 0; j < traitItems.length; j++) {
									if(traitSecondSub[0] == traitItems[j].code) {
										mainIcon = traitItems[j].traitGroup;
									}
								}
							}
						});
						
						// 특성 스킬 정보
						$.ajax({
				        	type:"get"
				        	, url:"/er/skillInfo"
				        	, dataType:"json"
				        	, async:false
				        	, success:function(data) {
				        		let allSkillItems = data.data;
				        		for(let j = 0; j < allSkillItems.length; j++) {
				        			if(allSkillItems[j].group == traitFirst) {
				        				icon = allSkillItems[j].icon;
				        			}
				        		}
				        	}
				        });

						// 전술 스킬 정보 불러오기
						$.ajax({
							type:"get"
							, url:"/er/tacticalSkill"
							, dataType: "json"
							, async:false
							, success:function(data) {
								let tacticalItems = data.data;
								for(let j = 0; j < tacticalItems.length; j++) {
									if(tacticalItems[j].group === tacticalSkillCode) {
										tactical = tacticalItems[j].icon;
									}
								}
							}
						});
						
						let html = 
							"<div class='oneRecord'>"
								+ "<div class='d-flex justify-content-around one'>"	
									+ "<div class='user-rank'>"
										+ "<h4 class='text-primary'>#" + items[i].gameRank + "</h4>"
										+ "<div class='text-secondary modeText'>" + mode + "</div>"
										+ "<div class='text-secondary timeText'>" + minute + "분 " + second + "초</div>"
									+ "</div>"
									
									+ "<div class='d-flex ml-1'>"
										+ "<img class='character-image image-all mt-2' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharProfile_" + characterImgName + "_S" + skinCode + ".png' width='62' height='62'>"
										+ "<div class='character-level ml-2'>" + level + "</div>"
									+ "</div>"
									
									+ "<div class='image-group'>"
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
									
									+ "<div class='d-flex justify-content-around align-items-center text-center finish-items ml-2'>"
						 	 			+ "<div>"
						 	 				+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + weaponBgImg + ".svg'>"
							 	 			+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item1 + ".png'>"
							 	 		+ "</div>"
							 	 		+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg1 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item2 + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg2 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item3 + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg3 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item4 + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg4 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + item5 + ".png'>"
						 	 			+ "</div>"
						 	 		+ "</div>"
								+ "</div>"
							+ "</div>"
						
						$("#record").append(html);
					}
					
					// 캐릭터 이름 불러오기
					$.ajax({
						type:"get"
						, url:"/er/character"
						, dataType:"json"
						, async:false
						, success:function(characterData) {
							let charItems = characterData.data;
							
							let duplicatedSkinInfo = characterCodes
                            .filter((value, index, self) => self.indexOf(value) !== index)
                            .map(duplicatedCode => {
                            	return charItems.find(item => item.code === duplicatedCode);
                            });
							characterName = duplicatedSkinInfo[0].name;

						}
						, error:function() {
							alert("캐릭터 불러오기 오류");
						}
					});
					
					// 스킨 정보 불러오기
					$.ajax({
						type:"get"
						, url:"/er/skin/info"
						, dataType:"json"
						, async:false
						, success:function(skinData) {
							let skinItems = skinData.data;
							
							let duplicatedSkinInfo = skinCodes
                            .filter((value, index, self) => self.indexOf(value) !== index)
                            .map(duplicatedCode => {
                            	return skinItems.find(item => item.code === duplicatedCode);
                            });
							skinImageCode = duplicatedSkinInfo[0].code;
							skinImageCode = skinImageCode + "";
							skinImageCode = skinImageCode.substring(4,7);
							
						}
						, error:function() {
							alert("스킨 불러오기 오류");
						}
					});
					
					let image = "https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharProfile_" + characterName + "_S" + skinImageCode + ".png";
					
					$("#detailImage").attr("src",image);
                    // HTML에 닉네임 적용
                    $("#userLevel").append("레벨 " + level);
                    $("#nickname").append(firstUserNickname);
	            }
	        });
	    });
	</script>
</body>
</html>