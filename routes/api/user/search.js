'use strict';

const { operation } = require("../../../managers/DatabaseManager");
const { get } = require("../../../managers/UserManager");

module.exports = {
    path: "/search/:handle",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let handle = req.params?.handle;
            if (!handle) return next();

            let limit = req.query?.limit;
            limit ??= 10;

            let offset = req.query?.offset;
            offset ??= 0;

            let entries = operation(db => db.prepare("SELECT id FROM users WHERE handle LIKE ? LIMIT ? OFFSET ?").all(handle, limit, offset));

            let users = entries.filter(x => x).map(x => get(x.id));
            let sanitisedUsers = users.map(x => {
                return {
                    id: x.id,
                    handle: x.iconURL,
                    displayName: x.displayName || x.handle,
                    iconURL: x.iconURL || ""
                }
            })

            res.json(sanitisedUsers);
        }
    }
}