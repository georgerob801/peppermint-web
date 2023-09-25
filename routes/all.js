'use strict';

const { join } = require("path");
const bodyParser = require("body-parser");

/** @type {import("../managers/ServerManager").RouteObject} */
module.exports = {
    path: "*",
    priority: -256,
    specificUsePriorities: [
        256,
        255,
        254
    ],
    use: [
        require("express").static(join(__dirname, "../", "public")),
        bodyParser.urlencoded({ extended: true }),
        (req, res, next) => {
            if (!req.user) {
                // if (req.baseUrl + req.path != "/") return res.redirect("/");
                if (!["/login", "/newaccount"].includes(req.baseUrl + req.path)) return res.render("main/loginblock", { req });
            } else {
                req.cssesc = require("cssesc");
                req.xss = require("xss");
                req.encodeurl = require("encodeurl");
                req.cssurl = url => req.xss(req.encodeurl(url || "") || "") || "";
                req.moment = require("moment");
            }
            next();
        }
    ],
    methods: {
        all: (req, res, next) => {
            return next();
        }
    }
}