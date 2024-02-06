function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

async function getCharacterName(characterCode) {
    let result = "";
    try {
        let data = await $.ajax({
            type: "get",
            url: "/er/character",
            dataType: "json"
        });

        let charItems = data.data;
        for (let j = 0; j < charItems.length; j++) {
            if (characterCode == charItems[j].code) {
                result = charItems[j].name;
            }
        }
    } catch (error) {
        console.error("Error fetching character data: ", error);
    }
    return result;
}


async function getKoreanCharacterName(characterCode) {
    let result = "";
    try {
        let data = await $.ajax({
            type: "get",
            url: "/er/loadTextFile",
            dataType: "text"
        });

        let lines = data.split("\n");
        for (let line of lines) {
            if (line.startsWith("Character/Name/")) {
                let parts = line.split("┃");
                if (parts.length === 2) {
                    let lineNumericPart = parts[0].split("/")[2].trim();
                    let korCharacterCode = characterCode + "";
                    if (lineNumericPart === korCharacterCode) {
                        result = parts[1].trim();
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error fetching Korean character name data: ", error);
    }
    return result;
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
        return "Unknown"; // If the code is not found in the mapping
    }
}