var config = require("./config.js");
var async = require("async");

const clubs = require("./clubs");
const matches = require("./matches");

var r = require("rethinkdb");

// TODO: Retrieve dynamicaly
const ALL_SOCCER_CATEGORIES = [7];
// Can't retrieve categories trough WS.
matches.setFootballCategories(ALL_SOCCER_CATEGORIES);
var currentCategory = 0;
var CONN = null;

module.exports.listen = (connection) => {
    CONN = connection;
    console.log("Connected. Set ping interval: 25000");
    CONN.sendUTF("2probe");
    // Winamax protocol
    setTimeout(() => CONN.sendUTF(5), 200);
    // sendJSON({route: "home"})
    setInterval(() => CONN.sendUTF("2"), 25000);
    // Fetch category
    setInterval(() => changeCategories(), 1000);
    // Error callback
    connection.on("error", (e) => error(e));
    connection.on("close", () => close());
    connection.on("message", (message) => receive(message));
};

function changeCategories() {
    let categories = matches.getFootballCategories();
    if (!categories.length) {
        console.error("No category to fetch. Can't listen nothing.");
    }
    var index = categories.findIndex((c) => c == currentCategory);
    if (index == -1 || index == categories.length - 1) {
        currentCategory = categories[0];
    } else {
        currentCategory = categories[index + 1];
    }
    sendJSON([
        "m",
        {
            route: `category:${currentCategory}`,
        },
    ]);
}

function sendJSON(message) {
    CONN.sendUTF("42" + JSON.stringify(["m", message]));
}

function receiveMatches(data) {
    console.log(`Received ${Object.keys(data.matches).length} matches.`);
    Object.keys(data.matches).forEach((key) => {
        let match = data.matches[key];
        console.log(match);
        // TODO: Think to another way maybe. Looks dirty.
        let club1 = clubs.getClubByApproxName(match.competitor1Name);
        let club2 = clubs.getClubByApproxName(match.competitor2Name);
        if (club1 != null || club2 != null) {
            registerNewNameIfDifferent(club1, match.competitor1Name);
            registerNewNameIfDifferent(club2, match.competitor2Name);
            registerMatch(match.matchId, match.matchStart, club1.ID, club2.ID);
        }
    });
}

function registerMatch(matchId, matchStart, club1Id, club2Id) {
    async.waterfall([
        function connect(callback) {
            r.connect(config.rethinkdb, callback);
        },
        function insertMatches(connection) {
            match = {
                matchId: matchId,
                matchStart: matchStart,
                club1Id: club1Id,
                club2Id: club2Id,
            };
            console.log(match);
            r.table(config.ecoutor.dest_matches).insert(match).run(connection);
        },
    ]);
}

function registerNewNameIfDifferent(club, name) {
    if (club == null) {
        console.log("Club is null.");
        return;
    }
    if (club.Name == name) {
        return;
    }
    club.Name = name;
    // r.table(config.ecoutor.dest_club).insert(club).run()
}

function receiveJson(data) {
    if (data.matches != null) {
        receiveMatches(data);
    }
}

function receive(message) {
    // console.log(message)
    if (message.type === "utf8") {
        const data = readAsJson(message.utf8Data);
        if (data != null) {
            receiveJson(data);
        } else {
            console.log(message.utf8Data);
        }
    }
}

function readAsJson(utf8Data) {
    if (!utf8Data.includes('"m"')) {
        return utf8Data;
    }
    let s = utf8Data.substring(0, utf8Data.length - 1).split(/\,(.+)/)[1];
    return JSON.parse(s);
}

function error() {
    console.log("Connection Error: " + error.toString());
}

function close() {
    console.log("echo-protocol Connection Closed");
}
