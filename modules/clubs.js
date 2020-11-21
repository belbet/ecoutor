const levenshtein = require("fast-levenshtein");

var clubs = [];

module.exports.getClubsCount = () => {
    return Object.keys(clubs).length;
};

module.exports.getClubs = () => {
    return clubs;
};

module.exports.addOrReplace = (old_val, new_val) => {
    if (new_val != null) {
        clubs[new_val.id] = new_val;
    }
    if (old_val != null) {
        delete clubs[old_val.id];
    }
};

module.exports.getClubByApproxName = (name) => {
    if (this.getClubsCount() == 0) {
        return null;
    }
    if (name == null) {
        return null;
    }
    var closestDistance = Number.MAX_SAFE_INTEGER;
    var closestClub = null;
    for (var key in clubs) {
        var club = clubs[key];
        let distance = levenshtein.get(club.Name, name, {
            useCollator: true,
        });
        if (distance < closestDistance) {
            closestDistance = distance;
            closestClub = club;
        }
    }
    if (closestClub != null) {
        console.log(
            `Distance (${closestDistance}) for ${name} is ${closestClub.ID} / ${closestClub.Name}.`
        );
        return closestClub;
    }
    console.log("hi");
    return null;
};
