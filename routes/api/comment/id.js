'use strict';

const { get } = require("../../../managers/CommentManager");
const { get: getProject } = require("../../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../../managers/PermissionManager");

module.exports = {
    path: "/:commentID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res) => {
            let id = req.params?.commentID;
            let comment = get(id);
            if (!comment) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Comment not found."
                });
            }

            res.json(comment);
        },
        delete: (req, res) => {
            console.log(req.user);
            if (!req.user) {
                res.status(401);
                return res.json({
                    status: 401,
                    message: "Unauthorised."
                });
            }

            let id = req.params?.commentID;
            let comment = get(id);
            if (!comment) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Comment not found."
                });
            }

            if (!req.user.permissionsFor(comment.projectID).has(PROJECT_FLAGS.EDIT_SETTINGS) && comment.userID != req.user.id) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Cannot delete this comment."
                });
            }

            comment.delete();

            res.json({
                status: 200,
                message: "Comment deleted successfully."
            });
        }
    }
}