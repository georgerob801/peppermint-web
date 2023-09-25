'use strict';

const { join } = require("path");
const passport = require("passport");

// setup logger
require("./managers/LoggingManager").createLogger(join(__dirname, "config", "logs", "settings.json"));

// setup server
const ServerManager = require("./managers/ServerManager");
const { critical } = require("./managers/LoggingManager");
const serverManager = new ServerManager(443);
serverManager.setSettingsDir(join(__dirname, "config", "server"));

// set up db
require("./managers/DatabaseManager").init(join(__dirname, "databases", "db.sqlite"));

// set up stuff for pug
serverManager.app.locals.basedir = join(__dirname, "views");
process.pugBaseDir = join(__dirname, "views");

// setup routes + no vhosts
serverManager.addRouteDirectory(join(__dirname, "routes"));

// passport
require("./passport/setup");

// session cookies
serverManager.app.use(require("cookie-parser")());
serverManager.app.use(require("cookie-session")({
    keys: [require("./config/server/keys.json").session.cookie],
    domain: `${require("./config/server/meta.json").basehostname}`,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: true
}));

serverManager.app.use(passport.initialize());
serverManager.app.use(passport.session());

// and gooooooo
serverManager.setupFromState();

// ------ errors --------
// 500
serverManager.app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    res.status(500);
    res.render("main/500", { req })
    critical(err);
});

// console interface for debugging if debug mode is on
// disabled when debug is off for security
if (require("./config/server/meta.json").debugMode) {
    const readline = require("readline");
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });

    rl.on("line", async line => {
        try {
            let eresult = eval(line);
            console.log(eresult);
        } catch (err) {
            console.error(err);
        }
    })
}

// and actually goooooo
serverManager.start();