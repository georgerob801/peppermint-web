'use strict';

module.exports = {
    path: "/logout",
    priority: 0,
    methods: {
        get: (req, res) => {
            req.logout();
            res.redirect("/");
        }
    }
}