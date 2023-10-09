'use strict';

const { get } = require("../../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");
const { get: getUpload } = require("../../../managers/UploadManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/:timestamp(-{0,1}[0-9]+)",
    priority: 0,
    methods: {
        delete: (req, res) => {
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

            release.delete();

            res.json({
                status: 200,
                message: "Release deleted successfully."
            });
        },
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

            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG | PROJECT_FLAGS.EDIT_RELEASE_FILE | PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.PUBLISH_RELEASE)) {
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

            if (!req.body) {
                res.status(400);
                return res.json({
                    status: 400,
                    message: "No changes provided."
                });
            }

            let messages = [];
            let changedTimestamp;

            [
                "file",
                "version",
                "releaseNotes",
                "timestampDate",
                "timestampTime"
            ].forEach(x => {
                release = project.getRelease(changedTimestamp || req.params.timestamp);

                switch(x) {
                    case "file":
                        if (req.body.file) {
                            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.EDIT_RELEASE_FILE)) {
                                messages.push({
                                    status: 403,
                                    field: "file",
                                    message: "Cannot change release file - unauthorised."
                                });
                                break;
                            }

                            let upload = getUpload(req.body.file.toString().trim().replace(/[^0-9]/g, "").substring(0, 19));

                            if (!upload) {
                                messages.push({
                                    status: 400,
                                    field: "file",
                                    message: "Cannot change release file - file does not exist."
                                });
                                break;
                            }

                            release.file = upload;

                            release.save();

                            messages.push({
                                type: "file",
                                status: 200,
                                message: "Release file changed successfully."
                            });
                        }
                        break;
                    case "version":
                        if (req.body.version) {
                            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.EDIT_RELEASE_FILE)) {
                                messages.push({
                                    status: 403,
                                    field: "version",
                                    message: "Cannot change version - unauthorised."
                                });
                                break;
                            }

                            let newVersion = req.body.version?.toString?.().trim?.();

                            release.version = newVersion;
                            release.save();

                            messages.push({
                                status: 200,
                                type: "version",
                                message: "Version changed successfully."
                            });
                        }
                        break;
                    case "releaseNotes":
                        if (req.body.releaseNotes) {
                            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG)) {
                                messages.push({
                                    status: 403,
                                    field: "releaseNotes",
                                    message: "Cannot change release notes - unauthorised."
                                });
                                break;
                            }

                            let newReleaseNotes = req.body.releaseNotes?.toString?.().trim?.().substring(0, 512);

                            release.releaseNotes = newReleaseNotes;
                            release.save();

                            messages.push({
                                status: 200,
                                type: "releaseNotes",
                                message: "Release notes changed successfully."
                            });
                        }
                        break;
                    case "timestampDate":
                        if (req.body.timestampDate) {
                            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG | PROJECT_FLAGS.PUBLISH_RELEASE)) {
                                messages.push({
                                    status: 403,
                                    field: "timestampDate",
                                    message: "Cannot change timestamp date - unauthorised."
                                });
                                break;
                            }

                            let newTimestampDate = req.body.timestampDate?.toString?.().trim?.();

                            if (!newTimestampDate.match(/^[0-9]{4}-(?:0[0-9]|1[0-2])-(?:0[0-9]|1[0-9]|2[0-9]|3[0-1])$/g)) {
                                messages.push({
                                    status: 400,
                                    field: "timestampDate",
                                    message: "Invalid value for timestamp date."
                                });
                                break;
                            }

                            let things = newTimestampDate.split("-");

                            let date = new Date(release.timestamp);

                            date.setUTCFullYear(things[0]);
                            date.setUTCMonth(things[1] - 1);
                            date.setUTCDate(things[2]);

                            release.timestamp = date.getTime();

                            release.save();

                            changedTimestamp = release.timestamp;

                            messages.push({
                                status: 200,
                                field: "timestampDate",
                                message: "Timestamp date set successfully.",
                                newTimestamp: release.timestamp
                            });
                        }
                        break;
                    case "timestampTime":
                        if (req.body.timestampTime) {
                            if (!req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_SETTINGS | PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG | PROJECT_FLAGS.PUBLISH_RELEASE)) {
                                messages.push({
                                    status: 403,
                                    field: "timestampTime",
                                    message: "Cannot change timestamp time - unauthorised."
                                });
                                break;
                            }

                            /** @type {String} */
                            let newTimestampTime = req.body.timestampTime?.toString?.().trim?.();

                            if (!newTimestampTime.match(/^(?:0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g)) {
                                messages.push({
                                    status: 400,
                                    field: "timestampTime",
                                    message: "Invalid value for timestamp time."
                                });
                                break;
                            }

                            let things = newTimestampTime.split(":");

                            let date = new Date(release.timestamp);
                            date.setUTCHours(things[0]);
                            date.setUTCMinutes(things[1]);
                            
                            release.timestamp = date.getTime();

                            release.save();

                            changedTimestamp = release.timestamp;

                            messages.push({
                                status: 200,
                                field: "timestampTime",
                                message: "Changed timestamp time successfully.",
                                newTimestamp: release.timestamp
                            });
                        }
                        break;
                    default:
                        break;
                }
            });

            console.log(messages);

            return res.json(messages);
        }
    }
}