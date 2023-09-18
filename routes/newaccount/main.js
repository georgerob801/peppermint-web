'use strict';

const { findByProperty, newUser } = require("../../managers/UserManager");

module.exports = {
    path: "/",
    priority: 0,
    methods: {
        get: (req, res) => {
            res.render("main/newaccount", { req });
        },
        post: (req, res) => {
            if (!req.body) return res.redirect("/newaccount?issue=something died painfully");
            if (!req.body.username) return res.redirect("/newaccount?issue=Please provide a username.");
            if (findByProperty("handle", req.body.username)) return res.redirect(`/newaccount?issue=That username is already in use.&username=${encodeURIComponent(req.body.username)}`);
            if (!req.body.password) return res.redirect(`/newaccount?issue=Please provide a password.&username=${encodeURIComponent(req.body.username)}`);

            let u = newUser();
            u.handle = req.body.username;
            u.setPassword(req.body.password);

            u.save();

            res.redirect("/?message=User created successfully. Please log in.");
        }
    }
}