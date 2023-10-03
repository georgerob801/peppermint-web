'use strict';

const { PROJECT_FLAG_NAMES } = require("../../../../managers/PermissionManager");

module.exports = {
    path: "/names",
    priority: 0,
    methods: {
        get: (req, res) => {
            return res.json(PROJECT_FLAG_NAMES);
        }
    }
}