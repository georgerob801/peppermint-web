'use strict';

module.exports = {
    path: "*",
    priority: -512,
    methods: {
        all: (req, res) => {
            res.status(404);
            res.render("main/404", { req });
        }
    }
}