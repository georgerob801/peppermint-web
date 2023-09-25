'use strict';

const { get: getProject } = require("../../managers/ProjectManager");
const { PROJECT_FLAGS } = require("../../managers/PermissionManager");

module.exports = {
    path: "/:projectID([0-9]+)",
    priority: 0,
    methods: {
        get: (req, res, next) => {
            let project = getProject(req.params?.projectID);
            if (!project) return next();

            let perms = req.user.permissionsFor(project.id);
            if (!perms.has(PROJECT_FLAGS.ALL - PROJECT_FLAGS.CONTRIBUTOR)) return next();

            let canEditTitle = perms.has(PROJECT_FLAGS.EDIT_TITLE);
            let canEditDescriptionAndImage = perms.has(PROJECT_FLAGS.EDIT_DESCRIPTION_AND_IMAGE);

            res.render("main/manage/main", { req, project, canEditTitle, canEditDescriptionAndImage });
        },
        post: (req, res, next) => {
            let project = getProject(req.params?.projectID);
            if (!project) return next();

            let perms = req.user.permissionsFor(project.id);
            if (!perms.has(PROJECT_FLAGS.ALL - PROJECT_FLAGS.CONTRIBUTOR)) return next();

            let changed = false;
            let extraQuery = {};

            if (perms.has(PROJECT_FLAGS.EDIT_TITLE)) extraQuery.title = req.body.title;
            if (perms.has(PROJECT_FLAGS.EDIT_DESCRIPTION_AND_IMAGE)) {
                extraQuery.image = req.body.image;
                extraQuery.description = req.body.description;
            }

            let extraQueryString = Object.keys(extraQuery).map(x => `${encodeURIComponent(x)}=${encodeURIComponent(extraQuery[x])}`).join("&");

            if (perms.has(PROJECT_FLAGS.EDIT_TITLE)) {
                if (req.body.title != project.title) {
                    /** @type {String} */
                    let title = req.body.title;
                    title = title.trim();
                    if (title.length > 50) return res.redirect(`/manage/${project.id}?error=the title must be 50 or fewer characters long&${extraQueryString}`);
                    project.title = title;
                    changed = true;
                }
            }

            if (perms.has(PROJECT_FLAGS.EDIT_DESCRIPTION_AND_IMAGE)) {
                if (req.body.image != project.iconURL) {
                    /** @type {String} */
                    let img = req.body.image;
                    img = img.trim();
                    if (img.length > 300) return res.redirect(`/manage/${project.id}?error=the image url must be 300 character or less&${extraQueryString}`);
                    project.iconURL = img;
                    changed = true;
                }

                if (req.body.description != project.description) {
                    /** @type {String} */
                    let desc = req.body.description;
                    desc = desc.trim();
                    if (desc.length > 1000) return res.redirect(`/manage/${project.id}?error=the description must not exceed 1000 characters&${extraQueryString}`);
                    project.description = desc;
                    changed = true;
                }
            }

            if (changed) project.save();
            return res.redirect(`/manage/${project.id}?message=changes made successfully`);
        }
    }
}