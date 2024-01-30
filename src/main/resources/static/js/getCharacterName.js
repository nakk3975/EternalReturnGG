function getCharacterName(code) {
	let characterName = "";
	$.ajax({
		type: "get",
		url: "/er/character",
		dataType: "json",
		async: false,
		success: function(characterData) {
			let charItems = characterData.data;
			for (let j = 0; j < charItems.length; j++) {
				if (code == charItems[j].code) {
					characterName = charItems[j].name;
				}
			}
		},
		error: function() {
			alert("캐릭터 불러오기 오류");
		},
	});
	return characterName;
}