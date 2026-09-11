const equipmentMetadata = new Map();
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
        if (!equipmentMetadata.has(url)) {
            const pending = fetch(url).then(response => {
                if (!response.ok) throw new Error('장비 정보 조회 실패');
                return response.json();
            }).catch(error => { equipmentMetadata.delete(url); throw error; });
            equipmentMetadata.set(url, pending);
        }
        let data = await equipmentMetadata.get(url);
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
                        weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-01.svg";
                        break;
                    case "Uncommon":
                        weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-02.svg";
                        break;
                    case "Rare":
                        weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-03.svg";
                        break;
                    case "Epic":
                        weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-04.svg";
                        break;
                    case "Legend":
                        weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-05.svg";
                        break;
                    case "Mythic":
						weaponBgImg = "https://cdn.dak.gg/er/images/item/ico-itemgradebg-06.svg";
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
