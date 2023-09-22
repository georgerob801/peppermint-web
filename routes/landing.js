'use strict';

const { operation } = require("../managers/DatabaseManager");

const { get: getProject } = require("../managers/ProjectManager");

module.exports = {
    path: "/",
    priority: 0,
    methods: {
        get: (req, res) => {
            let projects = operation(db => db.prepare("SELECT projectID FROM projectPermissions WHERE userID = ? AND permissions > 0").all(req.user.id).map(x => x.projectID).filter(x => x).map(x => getProject(x)));
            
            res.render("main/landing", { req, projects });
        }
    }
}