'use strict';

const { get } = require("../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/release/:timestamp(-{0,1}[0-9]+)/download",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = get(req.params?.projectID);
            if (!project) return next();
            let timestamp = parseInt(req.params?.timestamp);
            if (isNaN(timestamp)) return next();
            let release = project.getRelease(timestamp);
            if (!release || !release.published) return next();
            if (!release.file?.data) return next();
            res.set("Content-Disposition", `attachment; filename=${encodeURIComponent(release.file.name)}`);
            res.type(release.file.mime);
            res.send(release.file.data);
        }
    }
}