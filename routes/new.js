'use strict';

const { USER_FLAGS, PROJECT_FLAGS } = require("../managers/PermissionManager");

const { newProject } = require("../managers/ProjectManager");

module.exports = {
    path: "/new",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            if (!req.user.permissions.has(USER_FLAGS.CAN_CREATE_PROJECTS)) return next();

            let project = newProject();
            project.save();

            let perms = req.user.permissionsFor(project.id);
            perms.allow(PROJECT_FLAGS.ALL);
            perms.save();

            res.redirect(`/project/${project.id}`);
        }
    }
}