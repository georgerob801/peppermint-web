'use strict';

const { get } = require("../../managers/ProjectManager");

module.exports = {
    path: "/:projectID([0-9]+)/comment",
    priority: 0,
    methods: {
        post: (req, res) => {
            let project = get(req.params.projectID);
            if (!project) return res.send(400);
            let content = req.body.content;
            content = content.trim();
            if (!content) return res.redirect(`/project/${project.id}?commentError=Please write a comment.&commentContent=${encodeURIComponent(req.body.content)}`);
            if (content.length > 400) return res.redirect(`/project/${project.id}?commentError=Please only use 400 characters.&commentContent=${encodeURIComponent(req.body.content)}`);

            let comment = project.createComment();
            comment.setAuthor(req.user);
            comment.content = content;
            comment.save();
            res.redirect(`/project/${project.id}`)
        }
    }
}