'use strict';

const { get } = require("../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/:timestamp([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = get(req.params?.projectID);
            if (!project) return next();
            let timestamp = parseInt(req.params?.timestamp);
            if (isNaN(timestamp)) return next();
            let release = project.getRelease(timestamp);
            if (!release || !release.published) return next();
            res.render("main/project/release", { req, project, release });
        }
    }
}