async function fetchWeaponAndArmorBgImg(item, category) {
    let url;
    if (category === "weapon") {
        url = "/er/weapon";
    } else if (category === "armor") {
        url = "/er/armor";
    } else {
        console.error("Unsupported category: " + category);
        return;
    }

    try {
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error("이미지 가져오기 오류");
        }
        let data = await response.json();
        let bgImgCode = fetchWeaponBgImg(item, data.data);
        return bgImgCode;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function fetchWeaponBgImg(item, weaponItems) {
    let weaponBgImg = "";

    try {
        for (let j = 0; j < weaponItems.length; j++) {
            if (item == weaponItems[j].code) {
                switch (weaponItems[j].itemGrade) {
                    case "Common":
                        weaponBgImg = "1";
                        break;
                    case "Uncommon":
                        weaponBgImg = "2";
                        break;
                    case "Rare":
                        weaponBgImg = "3";
                        break;
                    case "Epic":
                        weaponBgImg = "4";
                        break;
                    case "Legend":
                        weaponBgImg = "5";
                        break;
                    default:
                        break;
                }
            }
        }
    } catch (error) {
        console.error("Error fetching weapon background image: ", error);
    }

    return weaponBgImg;
}