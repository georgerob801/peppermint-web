'use strict';

const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");
const { get } = require("../../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/:timestamp(-{0,1}[0-9]+)/publish",
    priority: 0,
    methods: {
        post: (req, res) => {
            console.log(req.body);
            console.log(req.params);
            if (!req.user) {
                return res.json({
                    status: 401,
                    message: "Unauthenticated."
                });
            }

            let project = get(req.params.projectID);

            if (!project) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Project not found."
                });
            }

            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.PUBLISH_RELEASE)) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Unauthorised."
                });
            }

            let release = project.getRelease(req.params.timestamp);

            if (!release) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Release not found."
                });
            }

            release.published = true;
            release.save();

            res.json({
                status: 200,
                message: "Release published successfully."
            });
        }
    }
}