'use strict';

module.exports = {
    path: "/",
    priority: 0,
    methods: {
        get: (req, res) => {
            res.render("main/landing", { req });
        }
    }
}