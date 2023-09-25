'use strict';

const { get } = require("../../managers/ProjectManager");
const { get: getUser } = require("../../managers/UserManager");
const { USER_FLAGS, PROJECT_FLAGS } = require("../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = get(req.params?.projectID);
            if (!project) return next();
            let comments = project.getComments(50);
            for (let i = 0; i < comments.length; i++) {
                comments[i].user = getUser(comments[i].userID);
            }

            let canComment = req.user.permissions.has(USER_FLAGS.CAN_COMMENT);

            let canManage = req.user.permissionsFor(project.id).has(PROJECT_FLAGS.ALL - PROJECT_FLAGS.CONTRIBUTOR);

            res.render("main/project/main", { req, project, releases: project.lastNReleases(5, 0, true), comments, canComment, canManage });
        }
    }
}