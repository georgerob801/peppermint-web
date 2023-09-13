'use strict';

const passport = require("passport");

module.exports = {
    path: "/",
    priority: 0,
    specificUsePriorities: [
        -1
    ],
    use: [
        (req, res, next) => res.redirect("/") 
    ],
    methods: {
        post: (req, res, next) => {
            passport.authenticate("local", { failureRedirect: "/?issue=Invalid username or password." })(req, res, next);
        },
        get: (req, res, next) => {
            res.send("nope this is not how this works")
        }
    }
}