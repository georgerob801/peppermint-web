'use strict';

const { operation } = require("../managers/DatabaseManager");

const { get: getProject } = require("../managers/ProjectManager");

module.exports = {
    path: "/",
    priority: 0,
    methods: {
        get: (req, res) => {
            let ownProjects = operation(db => db.prepare("SELECT projectID FROM projectPermissions WHERE userID = ? AND permissions > 0").all(req.user.id).map(x => x.projectID).filter(x => x).map(x => getProject(x)));
            let projects = operation(db => db.prepare("SELECT DISTINCT projectID FROM releases ORDER BY timestamp DESC LIMIT 15").all()).map(x => getProject(x.projectID));

            res.render("main/landing", { req, ownProjects, projects });
        }
    }
}