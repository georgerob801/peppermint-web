'use strict';

const SnowflakeID = require("snowflake-id").default;
// init snowflake
const snowflake = new SnowflakeID();

// db stuff
const { operation } = require("./DatabaseManager");

const { get: getUser } = require("./UserManager");
const { getForProject: getReleases, newRelease, getRelease: releaseFromTimestamp } = require("./ReleaseManager");
const { getForProject: getCommentsForProject, newComment } = require("./CommentManager");

/**
 * @typedef {Object} Project
 * @property {String} id
 * @property {String} title
 * @property {String} description
 * @property {String} iconURL
 */

class ProjectManager {
    constructor() {
        if (this instanceof ProjectManager) throw Error("ProjectManager cannot be instantiated.");
    }

    /**
     * Get a project from its ID.
     * @param {String} id The project's ID.
     * @returns {Project|undefined} The project.
     */
    static get(id) {
        // ensure project exists
        if (!id || !operation(db => db.prepare("SELECT id FROM projects WHERE id = ?").get(id))) return undefined;
        // get stored info
        let entry = operation(db => db.prepare("SELECT * FROM projects WHERE id = ?").get(id));

        // set user properties from entry
        let project = ProjectManager.newProject();
        project.readFromEntry(entry);
        return project;
    }

    /**
     * Generate a new project.
     * @returns {Project} A new project.
     */
    static newProject() {
        return new Project();
    }
}

class Project {
    id;
    title;
    description;
    iconURL;

    #_contributors;
    
    get contributors() {
        this.#_contributors ??= this.getContributors();
        return this.#_contributors
    }

    /**
     * Read a database entry's values into this user.
     * @param {Object} entry The database entry to read from.
     * @returns {Project} This project.
     */
    readFromEntry(entry) {
        let modified = { ...entry };
        Object.keys(modified).forEach(x => {
            if (modified[x] == null) modified[x] = undefined;
            this.#setFromDB(x, modified[x]);
        });
        return this;
    }

    /**
     * Convert DB values to object values.
     * @param {String} type The name of the field.
     * @param {any} value The value of the field.
     * @returns {Project} This project.
     */
    #setFromDB(type, value) {
        switch(type) {
            default:
                this[type] = value;
                break;
        }
        return this;
    }

    /**
     * Get a value to save to the database.
     * @param {String} type The name of the field to get.
     * @returns {any} The value to be set to the database.
     */
    #getForDB(type) {
        switch(type) {
            default:
                return this[type];
        }
    }

    /**
     * Get all contributors. (cached in Project#contributors)
     * @returns {import("./UserManager").User[]} Users that are listed as contributors for this project.
     */
    getContributors() {
        return operation(db => db.prepare("SELECT userID FROM projectPermissions WHERE projectID = ? AND permissions > 0").all(this.id)).map(x => x.userID).filter(x => x).map(x => getUser(x));
    }

    /**
     * Get the last n releases.
     * @param {Number=} n The max number of releases to get.
     * @param {Number=} offset The offset of the results.
     * @param {Boolean=} publishedOnly Whether to limit the results to published releases.
     * @returns {import("./ReleaseManager").Release[]} The releases.
     */
    lastNReleases(n, offset, publishedOnly) {
        return getReleases(this.id, n, offset, publishedOnly);
    }

    /**
     * Create a new release for this object.
     * @returns {import("./ReleaseManager").Release} The release.
     */
    createRelease() {
        let release = newRelease();
        release.projectID = this.id;
        return release;
    }

    /**
     * Get a release from its timestamp.
     * @param {Number} timestamp The timestamp of the release.
     * @returns {import("./ReleaseManager").Release|undefined} The release if found.
     */
    getRelease(timestamp) {
        return releaseFromTimestamp(this.id, timestamp);
    }

    /**
     * Get comments for this project.
     * @param {Number} limit The maximum number of comments to get.
     * @param {Number} offset The number to offset the results by.
     * @returns {import("./CommentManager").Comment[]} The comments.
     */
    getComments(limit, offset) {
        return getCommentsForProject(this.id, limit, offset);
    }

    /**
     * Create a new comment on this project.
     * @returns {import("./CommentManager").Comment} The comment.
     */
    createComment() {
        let comment = newComment();
        comment.projectID = this.id;
        return comment;
    }

    /**
     * Save this project to the database.
     * @param {String=} column A specific column to save.
     * @returns {Project} This project.
     */
    save(column) {
        // if no column specified save entire project
        if (!column) {
            // ensure id is set
            this.checkID();
            // check previous records
            if (operation(db => db.prepare("SELECT id FROM projects WHERE id = ?").get(this.#getForDB("id")))) {
                // exists, overwrite
                operation(db => db.prepare("UPDATE projects SET title = ?, description = ?, iconURL = ? WHERE id = ?").run(this.#getForDB("title"), this.#getForDB("description"), this.#getForDB("iconURL"), this.#getForDB("id")));
            } else {
                // doesn't exist, create new
                operation(db => db.prepare("INSERT INTO projects (id, title, description, iconURL) VALUES (?, ?, ?, ?)").run(this.#getForDB("id"), this.#getForDB("title"), this.#getForDB("description"), this.#getForDB("iconURL")));
            }
        } else {
            // ensure existence
            if (!this.id) throw new Error("No ID set.");
            if (!operation(db => db.prepare("SELECT id FROM projects WHERE id = ?").get(this.#getForDB("id")))) throw new Error("Column-specific updates only work with existing records.");

            // ensure existence of column
            if (!operation(db => db.prepare("PRAGMA table_info(users)").all()).map(x => x.name).includes(column)) throw new Error(`The property '${column}' doesn't exist.`);

            // then set property
            operation(db => db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(this.#getForDB(column), this.#getForDB("id")));
        }

        // return the project
        return this;
    }

    /**
     * Ensure this project has an ID.
     * @returns {Project} This project.
     */
    checkID() {
        this.id ??= snowflake.generate();
        return this;
    }

    /**
     * Check this project is in the database.
     * @returns {Boolean} True/false depending on whether this project is in the database.
     */
    checkInDB() {
        if (!this.id || !ProjectManager.get(this.id)) return false;
        return true;
    }
}

module.exports = ProjectManager;