'use strict';

const SnowflakeID = require("snowflake-id").default;
const snowflake = new SnowflakeID();

/**
 * @typedef {Object} Upload
 * @property {String} id
 * @property {String} name
 * @property {any} data
 * @property {String} size
 * @property {String} owner
 * @property {String} mimeType
 */

class UploadDatabaseManager {
    static #ready = false;
    static #path;
    static #tableDefinitions = [
        "uploads (id TEXT, name TEXT, mime TEXT, data BLOB, size NUMBER, owner TEXT, PRIMARY KEY(id))"
    ];

    constructor() {
        if (this instanceof UploadDatabaseManager) throw Error("UploadDatabaseManager cannot be instantiated.");
    }

    /**
     * Initialise the UploadDatabaseManager.
     * @param {String} dbPath The path to the database.
     * @returns {UploadDatabaseManager} A reference to the UploadDatabaseManager path.
     */
    static init(dbPath) {
        if (!dbPath) throw new Error("no database path provided");
        UploadDatabaseManager.#path = dbPath;

        UploadDatabaseManager.#ready = true;

        UploadDatabaseManager.operation(db => {
            UploadDatabaseManager.#tableDefinitions.forEach(x => {
                db.exec(`CREATE TABLE IF NOT EXISTS ${x}`);
            });
        })

        return UploadDatabaseManager;
    }

    static operation(f) {
        if (!UploadDatabaseManager.#ready) throw new Error("the upload database handler has not been initialised");
        let db = require("better-sqlite3")(UploadDatabaseManager.#path);
        let output;
        // attempt function
        try {
            output = f(db);
        } catch (e) {
            db.close();
            throw e;
        }
        db.close();
        return output;
    }
}

const operation = UploadDatabaseManager.operation;

class UploadManager {
    static dbMan = UploadDatabaseManager;

    constructor() {
        if (this instanceof UploadManager) throw Error("UploadManager cannot be instantiated.");
    }

    /**
     * Get an upload from its ID.
     * @param {String} id The upload's ID.
     * @returns {Upload|undefined} The upload.
     */
    static get(id) {
        if (!id || !operation(db => db.prepare("SELECT id FROM uploads WHERE id = ?").get(id))) return undefined;

        let entry = operation(db => db.prepare("SELECT * FROM uploads WHERE id = ?").get(id));

        let upload = UploadManager.newUpload();
        upload.readFromEntry(entry);
        return upload;
    }

    /**
     * Generate a new upload.
     * @returns {Upload} A new upload.
     */
    static newUpload() {
        return new Upload();
    }
}

class Upload {
    id;
    name;
    data;
    size;
    owner;
    mime;

    /**
     * Read in values from a database entry.
     * @param {Object} entry The database entry to read from.
     * @returns {Upload} This upload object.
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
     * @returns {Upload} This upload object.
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
     * Save this upload to the database.
     * @returns {Upload} This upload object.
     */
    save() {
        if (!this.owner) throw Error("This upload is not attributed to a user.");
        this.checkID();

        operation(db => db.prepare("REPLACE INTO uploads (id, name, mime, data, size, owner) VALUES (?, ?, ?, ?, ?, ?)").run(this.#getForDB("id"), this.#getForDB("name"), this.#getForDB("mime"), this.#getForDB("data"), this.#getForDB("size"), this.#getForDB("owner")));
        return this;
    }

    /**
     * Check this upload has an ID.
     * @returns {Upload} This upload object.
     */
    checkID() {
        this.id ??= snowflake.generate();
        return this;
    }

    /**
     * Delete this upload.
     */
    delete() {
        operation(db => db.prepare("DELETE FROM uploads WHERE id = ?").run(this.id));
        delete this;
    }
}

module.exports = UploadManager;