'use strict';

const { operation } = require("./DatabaseManager");

class ReleaseManager {
    constructor() {
        if (this instanceof ReleaseManager) throw Error("ReleaseManager cannot be instantiated.");
    }

    /**
     * Get release objects for a specific project.
     * @param {String} projectID The ID of the project to get releases for.
     * @param {Number=} limit The max number of results to provide.
     * @param {Number=} offset The amount to offset the results by.
     * @param {Boolean=} publishedOnly Whether to limit the results to published releases only.
     * @returns {Release[]} The release objects.
     */
    static getForProject(projectID, limit, offset, publishedOnly) {
        limit ??= 5;
        offset ??= 0;
        publishedOnly ??= false;
        return operation(db => db.prepare(`SELECT * FROM releases WHERE projectID = ?${publishedOnly ? " AND published = 1" : ""} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(projectID, limit, offset).map(x => ReleaseManager.newRelease().setFromEntry(x)));
    }

    /**
     * Generate a new release.
     * @returns {Release} The new release object.
     */
    static newRelease() {
        return new Release();
    }

    /**
     * Get a release from a project ID and a timestamp.
     * @param {String} projectID The project ID.
     * @param {Number} timestamp The timestamp of the release.
     * @returns {Release|undefined} The release.
     */
    static getRelease(projectID, timestamp) {
        if (!projectID) return undefined;
        if (timestamp === undefined) return undefined;
        let entry = operation(db => db.prepare("SELECT * FROM releases WHERE projectID = ? AND timestamp = ?").get(projectID, timestamp));
        if (!entry) return undefined;
        return ReleaseManager.newRelease().setFromEntry(entry);
    }
}

class Release {
    /** @type {String} */
    projectID;
    /** @type {Number} */
    timestamp;
    /** @type {String} */
    version;
    /** @type {String} */
    releaseNotes;
    /** @type {String} */
    fileLocation;
    /** @type {Boolean} */
    published;

    constructor() {
        this.timestamp = new Date().getTime();
    }

    /**
     * Read in values from a database entry.
     * @param {Object} entry The entry to read values from/
     * @returns {Release} This release object.
     */
    setFromEntry(entry) {
        this.projectID = entry.projectID;
        this.timestamp = entry.timestamp;
        this.version = entry.version;
        this.releaseNotes = entry.releaseNotes;
        this.fileLocation = entry.fileLocation;
        this.published = entry.published ? true : false;
        return this;
    }

    /**
     * Save this release object to the database.
     * @returns {Release} This release object.
     */
    save() {
        if (!this.projectID) throw new Error("This release is not attributed to a project.");
        this.timestamp ??= new Date().getTime();

        operation(db => db.prepare("REPLACE INTO releases (projectID, timestamp, version, releaseNotes, fileLocation, published) VALUES (?, ?, ?, ?, ?, ?)").run(this.projectID, this.timestamp, this.version, this.releaseNotes, this.fileLocation, this.published ? 1 : 0));
        return this;
    }
}

module.exports = ReleaseManager;