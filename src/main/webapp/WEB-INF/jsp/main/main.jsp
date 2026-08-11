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
				            <path d="M11.824 11.0391L8.68035 7.89844C9.3607 7.07812 9.73607 6.02344 9.73607 4.875C9.73607 2.20312 7.53079 0 4.85631 0C2.15836 0 0 2.20312 0 4.875C0 7.57031 2.18182 9.75 4.85631 9.75C5.9824 9.75 7.03812 9.375 7.8827 8.69531L11.0264 11.8359C11.1437 11.9531 11.2845 12 11.4487 12C11.5894 12 11.7302 11.9531 11.824 11.8359C12.0587 11.625 12.0587 11.2734 11.824 11.0391ZM1.1261 4.875C1.1261 2.8125 2.79179 1.125 4.87977 1.125C6.94428 1.125 8.63343 2.8125 8.63343 4.875C8.63343 6.96094 6.94428 8.625 4.85631 8.625C2.79179 8.625 1.1261 6.96094 1.1261 4.875Z" fill="white"></path>
				        </svg>
				    </button>
				</form>
			</div>
			<div class="d-flex justify-content-center">
				<div class="m-4">
					<h6 id="recommendRouteTitle">최신 루트</h6>
					<div class="d-flex">
						<div id="recommendRouteBox"></div>
					</div>
				</div>
			</div>
		</section>
		<c:import url="/WEB-INF/jsp/include/footer.jsp" />
	</div>
	
	<script src="/static/js/getName.js"></script>
	<script src="/static/js/fetchWeaponBgImg.js"></script>
	<script>
		$(document).ready(async function() {
			try {
		    	let data = await $.ajax({
		            type: "get",
		            url: "/er/main",
		            dataType: "json"
		        });

		        let items = data.result || [];
		        for (let i = 0; i < Math.min(10, items.length); i++) {
		            let route = items[i].recommendWeaponRoute;
		            if (!route) {
		                continue;
		            }

		            let id = route.id;
		            let title = route.title;
		            let userNickname = route.userNickname;
		            let characterCode = route.characterCode;
		            let weaponCodes = route.weaponType;
		            let itemCode = route.weaponCodes || "";

		            let itemArray = itemCode.match(/\d{6}/g) || [];
		            let weaponItem = "";
		            let armorArray = [];
		            for (let j = 0; j < itemArray.length; j++) {
		                if (itemArray[j].charAt(0) == 1) {
		                    weaponItem = itemArray[j];
		                } else {
		                    armorArray.push(itemArray[j]);
		                }
		            }

		            let characterName = await getCharacterName(characterCode);
		            let weaponName = getWeaponName(weaponCodes);
		            let korName = await getKoreanCharacterName(characterCode);

		            let weaponBgImg = weaponItem ? await fetchWeaponAndArmorBgImg(weaponItem, "weapon") : "";
		            let armorBg = await Promise.all(armorArray.slice(0, 4).map(code => fetchWeaponAndArmorBgImg(code, "armor")));

					let itemHtml = "";
					if (weaponItem) {
						itemHtml += "<div><img class='main-item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + weaponBgImg + ".svg'><img class='main-route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + weaponItem + ".png'></div>";
					}
					for (let j = 0; j < armorArray.length && j < 4; j++) {
						itemHtml += "<div><img class='main-item-back' src='https://cdn.dak.gg/er/images/item/ico-itemgradebg-0" + armorBg[j] + ".svg'><img class='main-route-item' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/ItemIcon_" + armorArray[j] + ".png'></div>";
					}

					let html = 
						"<div class='recommend-route d-flex'><div><div class='route d-flex justify-content-between align-items-center'>"
						+ "<div class='col-2'><div class='d-flex align-items-end'>"
						+ "<img class='character-image image-all' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/CharProfile_" + characterName + "_S000.png' width='36' height='36'>"
						+ "<img class='image-all cook-image absolute' src='https://cdn.dak.gg/assets/er/game-assets/1.13.0/Ico_Ability_" + weaponName + ".png' width='16' height='16'>"
						+ "</div></div>"
						+ "<div class='col-2'>"+ korName + "</div>"
						+ "<div class='col-5 text-center'><div class='destination-title mt-2' data-routeId='" + id + "'>" + title + "</div>"
						+ "<div class='d-flex justify-content-around align-items-top text-center'>" + itemHtml + "</div></div>"
						+ "<div class='col-2 text-center'><div class='text-secondary'>" + userNickname + "</div></div>"
						+ "</div></div></div>";
					$("#recommendRouteBox").append(html);
		        }
		    } catch (error) {
		        console.error("Error fetching data: ", error);
		    }
			
			$("#searchForm").on("submit", function(event) {
		         event.preventDefault();
		         let nickName = $("#searchInput").val();
		
		         $.ajax({
		             type: "get"
		             , url: "/er/search/nickname"
		             , dataType: "json"
		             , data: {"nickname": nickName}
		             , success: function(data) {
		                 if (data && data.user && data.user.userId) {
		                     location.href = "/er/user/detail/view?userNum=" + encodeURIComponent(data.user.userId);
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