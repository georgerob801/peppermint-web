'use strict';

const { join, extname } = require("path");
const { readdirSync, readFileSync, lstatSync, writeFileSync } = require("fs");

const config = {
    origin: "./",
    ignore: [
        ".vscode",
        "databases",
        "logs",
        "node_modules",
        ".git",
        "server.crt",
        "server.key",
        "package-lock.json",
        "README.md",
        "latex.txt",
        "LaTeX.js"
    ],
    includeExtensions: [
        "js",
        "css",
        "txt",
        "pug",
        "html",
        "json"
    ],
    extensionMapping: {
        "js": "javascript",
        "css": "css",
        "pug": "pug",
        "json": "json"
    },
    replace: [
        {
            pattern: /[│├─└・]/g,
            with: "|"
        },
        {
            pattern: /・/g,
            with: "."
        }
    ]
        
}

let structure = {};

let content = "";

const recurse = (folder) => {
    let contents = readdirSync(folder).filter(x => !config.ignore.includes(x)).map(x => join(folder, x));

    let folders = contents.filter(x => lstatSync(x).isDirectory());

    folders.forEach(x => recurse(x));

    let files = contents.filter(x => !lstatSync(x).isDirectory()).filter(x => config.includeExtensions.includes(extname(x).substring(1)));

    if (!files || !files.length) return;

    files.forEach(x => {
        let contents = readFileSync(x, {
            encoding: "utf8",
            flag: "r"
        });
        
        config.replace.forEach(x => {
            contents = contents.replace(x.pattern, x.with);
        });

        console.log(x);
        
        content += `\\subsection{${x.replace(/\\/g, "/")}}\n\\begin{minted}[frame=lines,linenos,breaklines]{${config.extensionMapping[extname(x).substring(1)] || extname(x).substring(1)}}\n${contents}\n\\end{minted}\n\n`
    });
}

recurse(config.origin);

writeFileSync("latex.txt", content);