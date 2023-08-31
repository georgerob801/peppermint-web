'use strict';

const { join } = require("path");

/** @type {import("../managers/ServerManager").RouteObject} */
module.exports = {
    path: "*",
    priority: 0,
    specificUsePriorities: [
        256,
        255
    ],
    use: [
        require("express").static(join(__dirname, "../", "public")),
        (req, res, next) => {
            if (!req.user) {
                res.render("main/loginblock", { req });
            } else {
                req.cssesc = require("cssesc");
                req.xss = require("xss");
                req.encodeurl = require("encodeurl");
                req.cssurl = url => req.xss(req.encodeurl(url || "") || "") || "";
                next();
            }
        }
    ],
    methods: {
        all: (req, res) => {
            res.render("main/landing", { req });
        }
    }
}