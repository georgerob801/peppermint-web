'use strict';

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const UserManager = require("../managers/UserManager");

// const UserManager = require("../managers/UserManager");

passport.serializeUser((user, done) => {
    user.checkSessionIdentifier() ? user.checkInDB() ? user.save("sessionIdentifier") : undefined : undefined;
    done(null, user.sessionIdentifier);
});

passport.deserializeUser((sessionIdentifier, done) => {
    let user = UserManager.findByProperty("sessionIdentifier", sessionIdentifier);
    done(null, user || null);
})

passport.use(
    new LocalStrategy(
        (handle, password, done) => {
            let user = UserManager.findByProperty("handle", handle);
            if (!user) return done(null, false);
        }
    )
);