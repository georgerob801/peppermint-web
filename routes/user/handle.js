'use strict';

const { findByProperty } = require("../../managers/UserManager");

const { operation } = require("../../managers/DatabaseManager");

const { get: getProject } = require("../../managers/ProjectManager");

const { FLAGS } = require("../../managers/PermissionManager");

module.exports = {
    path: "/:handle([a-z_\\-.]{1,30})",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let user = findByProperty("handle", req.params?.handle);
            if (!user) return next();

            user.prepareForDisplay();

            let projects = operation(db => db.prepare("SELECT projectID FROM projectPermissions WHERE userID = ? AND permissions > 0").all(user.id).map(x => x.projectID).filter(x => x).map(x => getProject(x)));

            for (let i = 0; i < projects.length; i++) {
                if (user.permissionsFor(projects[i].id).has(FLAGS.EDIT_SETTINGS)) projects[i].owner = true;
                else projects[i].owner = false;
                console.log(user.permissionsFor(projects[i].id).getAllowedPermissionNames());
            }

            res.render("main/user", { req, user, projects });
        }
    }
}