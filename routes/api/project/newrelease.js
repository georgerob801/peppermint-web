'use strict';

const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");
const { get } = require("../../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/new",
    priority: 0,
    methods: {
        post: (req, res) => {
            if (!req.user) {
                res.status(401);
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

            if (!req.user.permissionsFor(project.id).has(PROJECT_FLAGS.CREATE_RELEASE)) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Unauthorised."
                });
            }

            let release = project.createRelease();

            release.timestamp = new Date().getTime();

            release.save();

            // res.type("text/json");
            // res.send(JSON.stringify({
            //     status: 200,
            //     message: "Release created successfully.",
            //     releaseTimestamp: release.timestamp
            // }));

            res.json({
                status: 200,
                message: "Release created successfully.",
                releaseTimestamp: release.timestamp
            });
        }
    }
}