function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let characterDataPromise = null;
let koreanCharacterNamePromise = null;

function loadCharacterData() {
    if (!characterDataPromise) {
        characterDataPromise = $.ajax({
            type: "get",
            url: "/er/character",
            dataType: "json"
        }).then(function(data) {
            return data.data || [];
        }).catch(function(error) {
            characterDataPromise = null;
            throw error;
        });
    }

    return characterDataPromise;
}

function loadKoreanCharacterNames() {
    if (!koreanCharacterNamePromise) {
        koreanCharacterNamePromise = $.ajax({
            type: "get",
            url: "/er/loadTextFile",
            dataType: "text"
        }).then(function(data) {
            let nameMap = new Map();
            let lines = data.split("\n");

            for (let line of lines) {
                if (!line.startsWith("Character/Name/")) {
                    continue;
                }

                let parts = line.split("┃");
                if (parts.length !== 2) {
                    continue;
                }

                let characterCode = parts[0].split("/")[2].trim();
                nameMap.set(characterCode, parts[1].trim());
            }

            return nameMap;
        }).catch(function(error) {
            koreanCharacterNamePromise = null;
            throw error;
        });
    }

    return koreanCharacterNamePromise;
}

async function getCharacterName(characterCode) {
    try {
        let charItems = await loadCharacterData();
        let character = charItems.find(function(item) {
            return characterCode == item.code;
        });

        return character ? character.name : "";
    } catch (error) {
        console.error("Error fetching character data: ", error);
        return "";
    }
}

async function getKoreanCharacterName(characterCode) {
    try {
        let nameMap = await loadKoreanCharacterNames();
        return nameMap.get(String(characterCode)) || "";
    } catch (error) {
        console.error("Error fetching Korean character name data: ", error);
        return "";
    }
}

function getWeaponName(code) {
	let codeToEnglish = {
        0: "None",
        1: "Glove",
        2: "Tonfa",
        3: "Bat",
        4: "Whip",
        5: "HighAngleFire",
        6: "DirectFire",
        7: "Bow",
        8: "CrossBow",
        9: "Pistol",
        10: "AssaultRifle",
        11: "SniperRifle",
        13: "Hammer",
        14: "Axe",
        15: "OneHandSword",
        16: "TwoHandSword",
        17: "Polearm",
        18: "DualSword",
        19: "Spear",
        20: "Nunchaku",
        21: "Rapier",
        22: "Guitar",
        23: "Camera",
        24: "Arcana",
        25: "VFArm",
        101: "Craft",
        102: "Search",
        103: "Move",
        201: "Defense",
        202: "Hunt"
    };
    
    if (codeToEnglish.hasOwnProperty(code)) {
        return codeToEnglish[code];
    } else {
        return "Unknown";
    }
}