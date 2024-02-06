function fetchTraitMainIcon(traitSecondSub, traitItems) {
    let mainIcon = "";
    for (let j = 0; j < traitItems.length; j++) {
        if (traitSecondSub[0] == traitItems[j].code) {
            mainIcon = traitItems[j].traitGroup;
        }
    }
    return mainIcon;
}

function fetchTacticalIcon(tacticalSkillCode, tacticalItems) {
    let tactical = "";
    for (let j = 0; j < tacticalItems.length; j++) {
        if (tacticalItems[j].group === tacticalSkillCode) {
            tactical = tacticalItems[j].icon;
        }
    }
    return tactical;
}

function fetchSkillIcon(traitFirst, allSkillItems) {
    let icon = "";
    for (let j = 0; j < allSkillItems.length; j++) {
        if (allSkillItems[j].group == traitFirst) {
            icon = allSkillItems[j].icon;
        }
    }
    return icon;
}