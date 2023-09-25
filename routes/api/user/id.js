'use strict';

const { get } = require("../../../managers/UserManager");

module.exports = {
    path: "/:id([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res) => {
            let id = req.params?.id;
            if (!id) return next();

            let user = get(id);

            if (!user) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "User not found."
                });
            }

            let sanitisedUser = {
                id: user.id,
                handle: user.handle,
                displayName: user.displayName || user.handle,
                iconURL: user.iconURL || ""
            }

            res.json(sanitisedUser);
        }
    }
}