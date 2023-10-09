'use strict';

const { get: getProject } = require("../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/:releaseTimestamp(-{0,1}[0-9]+)",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = getProject(req.params?.projectID);

            if (!project) return next();

            let release = project.getRelease(req.params?.releaseTimestamp);

            if (!release) return next();

            let editBasicInfo = req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.CREATE_RELEASE | PROJECT_FLAGS.EDIT_RELEASE_CHANGELOG | PROJECT_FLAGS.EDIT_RELEASE_FILE);

            let editFile = req.user.permissionsFor(project.id).orHas(PROJECT_FLAGS.EDIT_RELEASE_FILE);

            res.render("main/manage/release", { req, project, release, editBasicInfo, editFile });
        }
    }
}