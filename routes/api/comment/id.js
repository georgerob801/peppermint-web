'use strict';

const { get } = require("../../../managers/CommentManager");

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
            //      \/ \/ \/ \/ \/
            //      \/ \/ \/ \/ \/
            // ADD PERM CHECKINGGGGGGGG
            //      /\ /\ /\ /\ /\
            //      /\ /\ /\ /\ /\
            let id = req.params?.commentID;
            let comment = get(id);
            if (!comment) {
                res.status(404);
                return res.json({
                    status: 404,
                    message: "Comment not found."
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