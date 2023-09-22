'use strict';

const { get } = require("../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = get(req.params?.projectID);
            if (!project) return next();
            res.render("main/project/main", { req, project });
        }
    }
}