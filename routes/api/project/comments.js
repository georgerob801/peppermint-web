'use strict';

const { get } = require("../../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/comments",
    priority: 0,
    methods: {
        get: (req, res) => {
            let id = req.params?.projectID;
            let project = get(id);

            if (!project) {
                res.status(404);
                return res.status({
                    status: 404,
                    message: "Project not found."
                });
            }

            let limit = req.query?.limit;
            limit ??= 10;

            let offset = req.query?.offset;
            offset ??= 0;

            let comments = project.getComments(limit, offset);

            res.json(comments);
        }
    }
}