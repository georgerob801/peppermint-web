'use strict';

const { findByProperty, get: getUser } = require("../../managers/UserManager");

const { operation } = require("../../managers/DatabaseManager");

const { get: getProject } = require("../../managers/ProjectManager");

const { USER_FLAGS } = require("../../managers/PermissionManager");
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

            let canEditDisplayName = req.user.permissions.has(USER_FLAGS.CAN_CHANGE_DISPLAY_NAME);
            let canEditIconURL = req.user.permissions.has(USER_FLAGS.CAN_CHANGE_ICON_URL);

            res.render("main/user", { req, user, projects, comments, canEditDisplayName, canEditIconURL });
        },
        post: (req, res, next) => {
            if (!req.user) return res.sendStatus(401);

            let user = findByProperty("handle", req.params?.handle);
            if (!user) return next();

            if (user.id != req.user.id) return res.sendStatus(403);

            if (req.body.displayName !== undefined) {
                user.displayName = req.body.displayName.toString().trim().substring(0, 50);
            }

            if (req.body.iconURL !== undefined) {
                user.iconURL = req.body.iconURL.toString().trim().substring(0, 256);
            }

            user.save();

            res.redirect(`/user/${user.handle}`);
        }
    }
}