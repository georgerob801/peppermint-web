'use strict';

const { get: getProject } = require("../../../managers/ProjectManager");
const { get: getUser } = require("../../../managers/UserManager");
const { PROJECT_FLAGS, PROJECT_FLAG_NAMES } = require("../../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)/permissions/:userID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res) => {
            if (!req.user) {
                res.status(401);
                return res.json({
                    status: 401,
                    message: "Unauthorised."
                })
            }

            let project = getProject(req.params?.projectID);

            if (!project) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Project not found."
                });
            }

            if (!req.user.permissionsFor(project.id).has(PROJECT_FLAGS.EDIT_SETTINGS)) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Forbidden."
                });
            }

            let user = getUser(req.params?.userID);

            if (!user) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "User not found."
                });
            }

            let perms = user.permissionsFor(project.id);
            
            res.json(perms.getAllowedPermissionNames());
        },
        post: (req, res) => {
            if (!req.user) {
                res.status(401);
                return res.json({
                    status: 401,
                    message: "Unauthorised."
                })
            }

            let project = getProject(req.params?.projectID);

            if (!project) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Project not found."
                });
            }

            if (!req.user.permissionsFor(project.id).has(PROJECT_FLAGS.EDIT_SETTINGS)) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Forbidden."
                });
            }

            let user = getUser(req.params?.userID);

            if (!user) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "User not found."
                });
            }

            let perms = user.permissionsFor(project.id);

            let allow = req.body?.allow || [];
            let forbid = req.body?.forbid || [];

            allow = allow.filter(x => PROJECT_FLAG_NAMES.includes(x));
            forbid = forbid.filter(x => PROJECT_FLAG_NAMES.includes(x));

            allow.forEach(x => {
                perms.allow(PROJECT_FLAGS[x]);
            });

            forbid.forEach(x => {
                perms.disallow(PROJECT_FLAGS[x]);
            });

            perms.save();

            res.json({
                status: 200,
                message: "Permissions set successfully.",
                newPermissions: user.permissionsFor(project.id).getAllowedPermissionNames()
            });
        }
    }
}