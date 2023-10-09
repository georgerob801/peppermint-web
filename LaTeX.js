'use strict';

// tasks for generating latex-friendly versions of the code

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
        "LaTeX.js",
        "structure.txt",
        "tech-solution.txt"
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

let content = "";

const recurse = (folder) => {
    let contents = readdirSync(folder).filter(x => !config.ignore.includes(x)).map(x => join(folder, x));

    let folders = contents.filter(x => lstatSync(x).isDirectory());

    folders.forEach(x => {
        recurse(x);
    });

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

const fileStructure = (folder, structure) => {
    let contents = readdirSync(folder).filter(x => !config.ignore.includes(x));

    let folders = contents.filter(x => lstatSync(join(folder, x)).isDirectory());

    folders.forEach(x => {
        structure.push({
            name: x,
            content: []
        });

        structure[structure.length - 1].content = fileStructure(join(folder, x), structure[structure.length - 1].content);
    });

    let files = contents.filter(x => !lstatSync(join(folder, x)).isDirectory()).filter(x => config.includeExtensions.includes(extname(x).substring(1)));

    if (!files || !files.length) return structure;

    files.forEach(x => {
        structure.push({
            name: x
        });
    });

    return structure;
}

const structure = fileStructure(__dirname, []);

let structureString = "";

const createStructureString = (level, struct) => {
    if (!struct.name) return;

    structureString += `${"\t".repeat(level)}[${struct.name}${struct.content?.length ? "\n" : ""}`;

    if (struct.content?.length) {
        for (let i = 0; i < struct.content.length; i++) {
            createStructureString(level + 1, struct.content[i]);
        }
    }

    if (struct.content?.length) structureString += `${"\t".repeat(level)}]\n`;
    else structureString += "]\n"
}
 
createStructureString(0, { name: "./", content: structure });

let structureTex = `\\begin{pagebreakbox}
\\begin{forest}
\tfor tree={
\t\tfont=\\ttfamily,
\t\tgrow'=0,
\t\tchild anchor=west,
\t\tparent anchor=south,
\t\tanchor=west,
\t\tcalign=first,
\t\ts sep=0.98pt,
\t\tedge path={
\t\t\t\\noexpand\\path [draw, \\forestoption{edge}]
\t\t\t(!u.south west) +(5pt,0) |- node[fill,inner sep=1.25pt] {} (.child anchor)\\forestoption{edge label};
\t\t},
\t\tbefore typesetting nodes={
\t\t\tif n=1
\t\t\t\t{insert before={[,phantom]}}
\t\t\t{}
\t\t},
\t\tfit=band,
\t\tbefore computing xy={l=15pt},
\t}
${structureString?.trim()}
\\end{forest}
\\end{pagebreakbox}
`

writeFileSync("structure.txt", structureTex);

writeFileSync("tech-solution.txt", `\\documentclass[../NEA.tex]{subfiles}

\\graphicspath{{\\subfix{../images/}}}

\\begin{document}

\\subsection{File structure}
${structureTex}

${content}

\\end{document}`);