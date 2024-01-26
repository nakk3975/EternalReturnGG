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
		</section>
		<c:import url="/WEB-INF/jsp/include/footer.jsp" />
	</div>
	
	<script>
		$(document).ready(function() {
			function getParameterByName(name, url) {
	            if (!url) url = window.location.href;
	            name = name.replace(/[\[\]]/g, "\\$&");
	            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	                results = regex.exec(url);
	            if (!results) return null;
	            if (!results[2]) return '';
	            return decodeURIComponent(results[2].replace(/\+/g, " "));
	    	}

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