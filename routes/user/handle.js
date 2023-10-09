'use strict';

const { findByProperty, get: getUser } = require("../../managers/UserManager");

const { operation } = require("../../managers/DatabaseManager");

const { get: getProject } = require("../../managers/ProjectManager");

const { PROJECT_FLAGS } = require("../../managers/PermissionManager");

const { getForUser } = require("../../managers/CommentManager");

module.exports = {
    path: "/:handle([0-9A-Za-z_\\-.]{1,30})",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let user = findByProperty("handle", req.params?.handle);
            if (!user) return next();

            user.prepareForDisplay();

            let projects = operation(db => db.prepare("SELECT projectID FROM projectPermissions WHERE userID = ? AND permissions > 0").all(user.id).map(x => x.projectID).filter(x => x).map(x => getProject(x)));

            for (let i = 0; i < projects.length; i++) {
                if (user.permissionsFor(projects[i].id).has(PROJECT_FLAGS.EDIT_SETTINGS)) projects[i].owner = true;
                else projects[i].owner = false;
            }

            let comments = getForUser(user.id);
            for (let i = 0; i < comments.length; i++) {
                comments[i].project = getProject(comments[i].projectID);
                comments[i].user = getUser(comments[i].userID);
            }

            res.render("main/user", { req, user, projects, comments });
        }
    }
}