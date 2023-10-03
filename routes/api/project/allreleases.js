'use strict';

const { get } = require("../../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/all",
    priority: 0,
    methods: {
        get: (req, res) => {
            let project = get(req.params?.projectID);

            if (!project) {
                res.status(404);
                return res.json({
                    error: 404,
                    message: "Project not found."
                });
            }

            let publishedOnly = true;

            if (req.query?.includeUnpublished == "true") {
                if (!req.user) {
                    res.status(401);
                    return res.json({
                        status: 401,
                        message: "Unauthenticated."
                    });
                }
                if (req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.CREATE_RELEASE | PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG | PROJECT_FLAGS.EDIT_RELEASE_FILE | PROJECT_FLAGS.EDIT_SETTINGS)) {
                    publishedOnly = false;
                } else {
                    res.status(403);
                    return res.json({
                        status: 403,
                        message: "Unauthorised."
                    });
                }
            }

            let releases = project.lastNReleases(100, 0, publishedOnly);

            let sanitisedReleases = releases.map(x => {
                return {
                    projectID: x.projectID,
                    timestamp: x.timestamp,
                    version: x.version,
                    published: x.published
                }
            })

            res.json(sanitisedReleases);
        }
    }
}