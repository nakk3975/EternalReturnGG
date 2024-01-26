<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
    
		<header class="d-flex justify-content-between align-items-center">
			<a href="/er/search/view" class="p-2 ml-2 text-white" id="mainBanner">ER.GG</a>
			<div class="p-2">
				<form class="search-form" id="searchHeaderForm">
					<input type="text" id="searchHeaderInput" class="search-input" placeholder="플레이어 닉네임을 입력해주세요." required>
					<button class="search-button" id="searchHeaderBtn">
						<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
							<path d="M11.824 11.0391L8.68035 7.89844C9.3607 7.07812 9.73607 6.02344 9.73607 4.875C9.73607 2.20312 7.53079 0 4.85631 0C2.15836 0 0 2.20312 0 4.875C0 7.57031 2.18182 9.75 4.85631 9.75C5.9824 9.75 7.03812 9.375 7.8827 8.69531L11.0264 11.8359C11.1437 11.9531 11.2845 12 11.4487 12C11.5894 12 11.7302 11.9531 11.824 11.8359C12.0587 11.625 12.0587 11.2734 11.824 11.0391ZM1.1261 4.875C1.1261 2.8125 2.79179 1.125 4.87977 1.125C6.94428 1.125 8.63343 2.8125 8.63343 4.875C8.63343 6.96094 6.94428 8.625 4.87977 8.625C2.79179 8.625 1.1261 6.96094 1.1261 4.875Z" fill="white"></path>
						</svg>
					</button>
				</form>
			</div>
		</header>
		<nav>
			<ul class="nav justify-content-around">
				<li class="nav-item"><a href="/er/search/view" class="nav-link font-weight-bold text-white">메인</a></li>
				<li class="nav-item"><a href="#" class="nav-link font-weight-bold text-white">랭킹</a></li>
				<li class="nav-item"><a href="#" class="nav-link font-weight-bold text-white">가이드</a></li>
				<li class="nav-item"><a href="#" class="nav-link font-weight-bold text-white">루트추천</a></li>
				<li class="nav-item"><a href="#" class="nav-link font-weight-bold text-white">게시판</a></li>
			</ul>
		</nav>
		
	<script>
		$(document).ready(function() {

			$("#searchHeaderForm").on("submit", function(event) {
	            event.preventDefault();

	            let nickName = $("#searchHeaderInput").val();

	            $.ajax({
	                type: "get",
	                url: "/er/search/nickname",
	                dataType: "json",
	                data: {"nickname": nickName},
	                success: function(data) {
	                    if (data && data.user) {
	                        var items = data.user;
	                        location.href = "/er/user/detail/view?userNum=" + items.userNum;
	                    } else {
	                        alert("존재하지 않는 닉네임입니다.");
	                    }
	                }
	            });
	        });

		});
	</script>