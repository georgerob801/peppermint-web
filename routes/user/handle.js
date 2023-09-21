'use strict';

const { findByProperty } = require("../../managers/UserManager");

module.exports = {
    path: "/:handle([a-z_\\-.]{1,30})",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let user = findByProperty("handle", req.params?.handle);
            if (!user) return next();

            user.prepareForDisplay();

            res.render("main/user", { req, user });
        }
    }
}