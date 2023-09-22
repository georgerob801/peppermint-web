'use strict';

const { operation } = require("./DatabaseManager");

/**
 * @typedef {Object} PermissionEntry
 * @property {String} projectID
 * @property {String} userID
 * @property {Number} permissions Permissions bitfield.
 */

/**
 * @typedef {Object} PermissionFlags
 * @property {1} CONTRIBUTOR
 * @property {2} EDIT_TITLE
 * @property {4} EDIT_DESCRIPTION
 * @property {16} CREATE_RELEASE
 * @property {32} EDIT_RELEASE_CHANGELOG
 * @property {64} EDIT_RELEASE_FILE
 * @property {128} PUBLISH_RELEASE
 * @property {256} EDIT_SETTINGS
 */

/**
 * @typedef {1|2|4|8|16|32|64|128|256} PermissionFlag
 */

class PermissionManager {
    constructor() {
        if (this instanceof PermissionManager) throw Error("PermissionManager cannot be instantiated.");
    }

    /**
     * @returns {String[]}
     */
    static get FLAG_NAMES() {
        return Object.keys(PermissionManager.FLAGS);
    }

    /**
     * @returns {PermissionFlags}
     */
    static get FLAGS() {
        return {
            CONTRIBUTOR:            0b0000_0001,
            EDIT_TITLE:             0b0000_0010,
            EDIT_DESCRIPTION:       0b0000_0100,
            CREATE_RELEASE:         0b0000_1000,
            EDIT_RELEASE_CHANGELOG: 0b0001_0000,
            EDIT_RELEASE_FILE:      0b0010_0000,
            PUBLISH_RELEASE:        0b0100_0000,
            EDIT_SETTINGS:          0b1000_0000
        }
    }

    /**
     * Get a permissions object based on a user ID and a project ID.
     * @param {String} userID The user's ID.
     * @param {String} projectID The project's ID.
     * @returns {Permissions|undefined} The permissions object.
     */
    static get(userID, projectID) {
        if (!userID || !projectID) throw new Error("Both a user ID and a project ID are required to get permissions.");
        let entry = operation(db => db.prepare("SELECT * FROM projectPermissions WHERE projectID = ? AND userID = ?").get(projectID, userID));
        if (!entry) return undefined;

        let permissions = new Permissions();
        permissions.setFromEntry(entry);

        return permissions;
    }
}

class Permissions {
    #bitfield;
    userID;
    projectID;

    /**
     * Toggle a set permission.
     * @param {PermissionFlag} flag The permission to flip.
     * @returns {Permissions} This permissions object.
     */
    togglePermission(flag) {
        if (!Object.values(PermissionManager.FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield ^= PermissionManager;
        return this;
    }

    /**
     * Check for a specific permission.
     * @param {PermissionFlag} flag The permission to check.
     * @returns {Boolean} True/false depending on whether the specified permission is granted.
     */
    has(flag) {
        if (!Object.values(PermissionManager.FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        return this.#bitfield & flag ? true : false;
    }

    /**
     * Allow a permission.
     * @param {PermissionFlag} flag The permission to allow.
     * @returns {Permission} This permissions object.
     */
    allow(flag) {
        if (!Object.values(PermissionManager.FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield |= flag;
        return this;
    }

    /**
     * Disallow a permission.
     * @param {PermissionFlag} flag The permission to disallow.
     * @returns {Permission} This permissions object.
     */
    disallow(flag) {
        if (!Object.values(PermissionManager.FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield &= (0b1111_1111 ^ flag);
        return this;
    }

    /**
     * Get this object's allowed permissions.
     * @returns {String[]} A list of the allowed permissions.
     */
    getAllowedPermissionNames() {
        let allowed = [];
        for (const name of PermissionManager.FLAG_NAMES) {
            if (this.has(PermissionManager.FLAGS[name])) allowed.push(name);
        }
        return allowed;
    }

    /**
     * Read in values from a database entry.
     * @param {Object} entry The entry to set values from.
     * @returns {Permissions} This permissions object.
     */
    setFromEntry(entry) {
        this.userID = entry.userID;
        this.projectID = entry.projectID;
        this.#bitfield = entry.permissions;
        return this;
    }

    /**
     * Save this permissions object to the database.
     * @returns {Permissions} This permissions object.
     */
    save() {
        if (!this.userID) throw new Error("This permission record is not attributed to a user.");
        if (!this.projectID) throw new Error("This permission record is not attributed to a project.");

        // woo i forgot this exists
        operation(db => db.prepare("REPLACE INTO projectPermissions (projectID, userID, permissions) VALUES (?, ?, ?)").run(this.projectID, this.userID, this.#bitfield));
        return this;
    }
}

module.exports = PermissionManager;