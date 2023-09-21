'use strict';

const { get } = require("../../managers/UserManager");

module.exports = {
    path: "/:userID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res) => {
            let user = get(req.params?.userID);
            if (!user) return next();
            res.redirect(`/user/${user.handle}`);
        }
    }
}