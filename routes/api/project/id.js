'use strict';

const { get: getProject } = require("../../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)",
    priority: 0,
    methods: {
        delete: (req, res) => {
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

            project.delete();
            
            res.json({
                status: 200,
                message: "Project deleted successfully."
            });
        }
    }
}