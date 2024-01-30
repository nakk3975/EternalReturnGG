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