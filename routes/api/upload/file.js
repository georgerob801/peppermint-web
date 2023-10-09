'use strict';

const { USER_FLAGS } = require("../../../managers/PermissionManager");
const { newUpload } = require("../../../managers/UploadManager");

module.exports = {
    path: "/",
    priority: 0,
    startingUsePriority: 1,
    use: [
        require("express-fileupload")()
    ],
    methods: {
        post: (req, res) => {
            if (!req.user) {
                res.status(401);
                return res.json({
                    status: 401,
                    message: "Unauthenticated."
                });
            }

            if (!req.user.permissions.has(USER_FLAGS.CAN_UPLOAD_FILES)) {
                res.status(403);
                return res.json({
                    status: 403,
                    message: "Unauthorised."
                });
            }

            if (!req.files || !req.files.file) {
                res.status(400);
                return res.json({
                    status: 400,
                    message: "No file provided."
                });
            }

            let upload = newUpload();
            upload.name = (req.files.file.name || `file-${new Date().getTime()}-${req.user}`).trim().substring(0, 128);
            upload.mime = (req.files.file.mimetype || "application/octet-stream").trim().substring(0, 64);
            upload.data = req.files.file.data;
            upload.size = req.files.file.size;
            upload.owner = req.user.id;

            upload.save();

            return res.json({
                status: 200,
                message: "Upload created.",
                uploadID: upload.id
            });
        }
    }
}