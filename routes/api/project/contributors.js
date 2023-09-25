'use strict';

const { get } = require("../../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/contributors",
    priority: 0,
    methods: {
        get: (req, res) => {
            let id = req.params?.projectID;
            let project = get(id);

            if (!project) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Project not found."
                });
            }

            let contributors = project.contributors;

            let sanitisedUsers = contributors.map(x => {
                return {
                    id: x.id,
                    handle: x.handle,
                    displayName: x.displayName || x.handle,
                    iconURL: x.iconURL || "",
                    permissions: x.permissionsFor(project.id).getAllowedPermissionNames()
                }
            });

            res.json(sanitisedUsers);
        }
    }
}