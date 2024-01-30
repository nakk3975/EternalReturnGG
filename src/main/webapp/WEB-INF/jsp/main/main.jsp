<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ERGG</title>
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
			<div id="searchBox" class="d-flex align-items-center justify-content-center">
				<form class="search-form" id="searchForm">
				    <input type="text" id="searchInput" class="search-input" placeholder="플레이어 닉네임을 입력해주세요." required>
				    <button class="search-button" id="searchBtn">
				        <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
				            <path d="M11.824 11.0391L8.68035 7.89844C9.3607 7.07812 9.73607 6.02344 9.73607 4.875C9.73607 2.20312 7.53079 0 4.85631 0C2.15836 0 0 2.20312 0 4.875C0 7.57031 2.18182 9.75 4.85631 9.75C5.9824 9.75 7.03812 9.375 7.8827 8.69531L11.0264 11.8359C11.1437 11.9531 11.2845 12 11.4487 12C11.5894 12 11.7302 11.9531 11.824 11.8359C12.0587 11.625 12.0587 11.2734 11.824 11.0391ZM1.1261 4.875C1.1261 2.8125 2.79179 1.125 4.87977 1.125C6.94428 1.125 8.63343 2.8125 8.63343 4.875C8.63343 6.96094 6.94428 8.625 4.87977 8.625C2.79179 8.625 1.1261 6.96094 1.1261 4.875Z" fill="white"></path>
				        </svg>
				    </button>
				</form>
			</div>
			<div class="d-flex justify-content-center">
				<div class="m-4">
					<h6 id="recommendRouteTitle">최신 루트</h6>
					<div class="d-flex">
						<div id="recommendRouteBox">
							
						</div>
					</div>
				</div>
			</div>
		</section>
		<c:import url="/WEB-INF/jsp/include/footer.jsp" />
	</div>
	
	<script src="/static/js/getCharacterName.js"></script>
	<script src="/static/js/getWeaponName.js"></script>
	<script>
		$(document).ready(function() {
			
			$.ajax({
				type:"get"
				, url:"/er/main"
				, dataType:"json"
				, success:function(data) {
					let items = data.result;
					for(let i = 0; i < 10; i++) {
						let id = items[i].recommendWeaponRoute.id;
						let title = items[i].recommendWeaponRoute.title;
						let userNickname = items[i].recommendWeaponRoute.userNickname;
						let characterCode = items[i].recommendWeaponRoute.characterCode;
						let weaponCodes = items[i].recommendWeaponRoute.weaponType;
						let itemCode = items[i].recommendWeaponRoute.weaponCodes;
						
						let item0 = itemCode.substring(1,7);
						let item1 = itemCode.substring(8,14);
						let item2 = itemCode.substring(15,21);
						let item3 = itemCode.substring(22,28);
						let item4 = itemCode.substring(29,35);

						let itemArray = [item0, item1, item2, item3, item4];
						let weaponItem = "";
						let armorArray = [];
						for(let j = 0; j < itemArray.length; j++) {
							if(itemArray[j].charAt(0) == 1) {
								weaponItem = itemArray[j];
							} else {
								armorArray.push(itemArray[j]);
							}
						}
						let characterName = getCharacterName(characterCode);
						let weaponName = getWeaponName(weaponCodes);
						
						let korName = "";
						
				        $.ajax({
				            type: "get",
				            url: "/er/loadTextFile",
				            async:false,
				            success: function (data) {
				            	let lines = data.split("\n");
	
				                for (let line of lines) {
				                    if (line.startsWith("Character/Name/")) {
					                    let parts = line.split("┃");
					                    if (parts.length === 2) {
					                        let lineNumericPart = parts[0].split("/")[2].trim();
					                        // Compare the numeric parts
					                        let korCharacterCode = characterCode + "";
					                        if (lineNumericPart === korCharacterCode) {
					                        	korName = parts[1].trim(); // Extract name after the |
					                            break;
					                        }
					                    }
				                    }
				                }
				            },
				            error: function () {
				                alert("텍스트 파일 불러오기 오류");
				            },
				        });
				        
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
									if(weaponItem == weaponItems[j].code){
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
									if(armorArray[0] == weaponItems[j].code){
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
									
									if(armorArray[1] == weaponItems[j].code){
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
									
									if(armorArray[2] == weaponItems[j].code){
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
									
									if(armorArray[3] == weaponItems[j].code){
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
	  
						let html = 
							"<div class='recommend-route d-flex'>"
							 + "<div>"
							 	+ "<div class='route d-flex justify-content-between align-items-center'>"
							 		+"<div>"
								 		+ "<div class='d-flex align-items-end'>"
									 	 	+ "<img class='character-image image-all' id='mainCharacterImage' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharProfile_" + characterName + "_S000.png' width='36' height='36'>"
									 	 	+ "<img class='image-all cook-image absolute' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/Ico_Ability_" + weaponName + ".png' width='16' height='16'>"
								 	 	+ "</div>"
								 	+ "</div>"
								 	+ "<div id='textFileContent' class='col-3'>"+ korName + "</div>"
								 	+ "<div class='col-6 text-center'>"
							 	 		+ "<div class='destination-title' data-routeId=" + id + ">" + title + "</div>"
							 	 		+ "<div class='d-flex justify-content-around align-items-center text-center finish-items'>"
						 	 			+ "<div>"
						 	 				+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + weaponBgImg + ".svg'>"
							 	 			+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + weaponItem + ".png'>"
							 	 		+ "</div>"
							 	 		+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg1 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + armorArray[0] + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg2 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + armorArray[1] + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg3 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + armorArray[2] + ".png'>"
						 	 			+ "</div>"
						 	 			+ "<div>"
					 	 					+ "<img class='.item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBgImg4 + ".svg'>"
						 	 				+ "<img class='route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + armorArray[3] + ".png'>"
						 	 			+ "</div>"
						 	 		+ "</div>"
						 	 		+"</div>"
							 	 	+"<div class='col-2 text-center'>"
							 	 		+ "<div class='text-secondary' id='recommendRouteNickName'>" + userNickname + "</div>"
						 	 		+"</div>"
							 	+ "</div>"
							 + "</div>"
						 + "</div>";
						$("#recommendRouteBox").append(html);
					}
				}
			});
			
			$("#searchForm").on("submit", function(event) {
		         event.preventDefault();
		
		         let nickName = $("#searchInput").val();
		
		         $.ajax({
		             type: "get"
		             , url: "/er/search/nickname"
		             , dataType: "json"
		             , data: {"nickname": nickName}
		             , success: function(data) {
		                 if (data && data.user) {
		                     let items = data.user;
		                     location.href = "/er/user/detail/view?userNum=" + items.userNum;
		                 } else {
		                     alert("존재하지 않는 닉네임입니다.");
		                 }
		             }
		         });
		    });
		});
	</script>
</body>
</html>