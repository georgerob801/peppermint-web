'use strict';

const { operation } = require("./DatabaseManager");

/**
 * @typedef {Object} ProjectPermissionEntry
 * @property {String} projectID
 * @property {String} userID
 * @property {Number} permissions Permissions bitfield.
 */

/**
 * @typedef {Object} ProjectPermissionFlags
 * @property {1} CONTRIBUTOR
 * @property {2} EDIT_TITLE
 * @property {4} EDIT_DESCRIPTION_AND_IMAGE
 * @property {8} CREATE_RELEASE
 * @property {16} EDIT_RELEASE_CHANGELOG
 * @property {32} EDIT_RELEASE_FILE
 * @property {64} PUBLISH_RELEASE
 * @property {128} EDIT_SETTINGS
 * @property {255} ALL
 */

/**
 * @typedef {1|2|4|8|16|32|64|128|256|255} PermissionFlag
 */

class PermissionManager {
    constructor() {
        if (this instanceof PermissionManager) throw Error("PermissionManager cannot be instantiated.");
    }

    static get USER_FLAG_NAMES() {
        return Object.keys(PermissionManager.USER_FLAGS);
    }

    static get USER_FLAGS() {
        return {
            CAN_COMMENT: 0b0000_0001,
            CAN_CREATE_PROJECTS: 0b0000_0010,
        }
    }

    /**
     * @returns {String[]}
     */
    static get PROJECT_FLAG_NAMES() {
        return Object.keys(PermissionManager.PROJECT_FLAGS);
    }

    /**
     * @returns {ProjectPermissionFlags}
     */
    static get PROJECT_FLAGS() {
        return {
            CONTRIBUTOR:                0b0000_0001,
            EDIT_TITLE:                 0b0000_0010,
            EDIT_DESCRIPTION_AND_IMAGE: 0b0000_0100,
            CREATE_RELEASE:             0b0000_1000,
            EDIT_RELEASE_CHANGELOG:     0b0001_0000,
            EDIT_RELEASE_FILE:          0b0010_0000,
            PUBLISH_RELEASE:            0b0100_0000,
            EDIT_SETTINGS:              0b1000_0000,
            ALL:                        0b1111_1111
        }
    }

    /**
     * Get a project permissions object based on a user ID and a project ID.
     * @param {String} userID The user's ID.
     * @param {String} projectID The project's ID.
     * @returns {ProjectPermissions} The permissions object.
     */
    static getProject(userID, projectID) {
        if (!userID || !projectID) throw new Error("Both a user ID and a project ID are required to get permissions.");
        let entry = operation(db => db.prepare("SELECT * FROM projectPermissions WHERE projectID = ? AND userID = ?").get(projectID, userID));
        if (!entry) {
            let p = new ProjectPermissions();
            p.userID = userID;
            p.projectID = projectID;
            return p;
        }

        let permissions = new ProjectPermissions();
        permissions.setFromEntry(entry);

        return permissions;
    }

    /**
     * Get a user's permissions.
     * @param {String} userID The user's ID.
     * @returns {UserPermissions} The permissions object.
     */
    static getUser(userID) {
        if (!userID) throw new Error("Please provide a user ID.");
        let entry = operation(db => db.prepare("SELECT id, permissions FROM users WHERE id = ?").get(userID));
        if (!entry) return undefined;

        let permissions = new UserPermissions();
        permissions.setFromEntry(entry);

        return permissions;
    }
}

class UserPermissions {
    #bitfield;
    userID;

    constructor() {
        this.#bitfield = 0;
    }

    /**
     * Toggle a set permission.
     * @param {PermissionFlag} flag The permission to flip.
     * @returns {UserPermissions} This permissions object.
     */
    togglePermission(flag) {
        if (!Object.values(PermissionManager.USER_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield ^= PermissionManager;
        return this;
    }

    /**
     * Check for a specific permission.
     * @param {PermissionFlag} flag The permission to check.
     * @returns {Boolean} True/false depending on whether the specified permission is granted.
     */
    has(flag) {
        return this.#bitfield & flag == flag ? true : false;
    }

    /**
     * Allow a permission.
     * @param {PermissionFlag} flag The permission to allow.
     * @returns {UserPermissions} This permissions object.
     */
    allow(flag) {
        if (!Object.values(PermissionManager.USER_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield |= flag;
        return this;
    }

    /**
     * Disallow a permission.
     * @param {PermissionFlag} flag The permission to disallow.
     * @returns {UserPermissions} This permissions object.
     */
    disallow(flag) {
        if (!Object.values(PermissionManager.USER_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield &= (0b1111_1111 ^ flag);
        return this;
    }

    /**
     * Get this object's allowed permissions.
     * @returns {String[]} A list of the allowed permissions.
     */
    getAllowedPermissionNames() {
        let allowed = [];
        for (const name of PermissionManager.USER_FLAG_NAMES) {
            if (this.has(PermissionManager.USER_FLAGS[name])) allowed.push(name);
        }
        return allowed;
    }

    /**
     * Read in values from a database entry.
     * @param {Object} entry The entry to set values from.
     * @returns {UserPermissions} This permissions object.
     */
    setFromEntry(entry) {
        this.userID = entry.userID;
        this.#bitfield = entry.permissions;
        return this;
    }

    /**
     * Save this permissions object to the database.
     * @returns {UserPermissions} This permissions object.
     */
    save() {
        if (!this.userID) throw new Error("This permission record is not attributed to a user.");
        if (!operation(db => db.prepare("SELECT userID FROM users WHERE userID = ?").get(this.id))) throw new Error(`No user exists with the ID '${this.userID}'.`);

        operation(db => db.prepare("REPLACE INTO users (userID, permissions) VALUES (?, ?)").run(this.userID, this.#bitfield));
        return this;
    }
}

class ProjectPermissions {
    #bitfield;
    userID;
    projectID;

    constructor() {
        this.#bitfield = 0;
    }

    /**
     * Toggle a set permission.
     * @param {PermissionFlag} flag The permission to flip.
     * @returns {ProjectPermissions} This permissions object.
     */
    togglePermission(flag) {
        if (!Object.values(PermissionManager.PROJECT_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield ^= PermissionManager;
        return this;
    }

    /**
     * Check for a specific permission.
     * @param {PermissionFlag} flag The permission to check.
     * @returns {Boolean} True/false depending on whether the specified permission is granted.
     */
    has(flag) {
        console.log(`bitfield: ${this.#bitfield}`);
        console.log(`flag: ${flag}`);
        console.log(`bitfield & flag: ${this.#bitfield & flag}`)
        console.log(typeof(this.#bitfield & flag))
        console.log(this.#bitfield & flag == flag)
        return this.#bitfield & flag == flag ? true : false;
    }

    /**
     * Allow a permission.
     * @param {PermissionFlag} flag The permission to allow.
     * @returns {ProjectPermissions} This permissions object.
     */
    allow(flag) {
        if (!Object.values(PermissionManager.PROJECT_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield |= flag;
        return this;
    }

    /**
     * Disallow a permission.
     * @param {PermissionFlag} flag The permission to disallow.
     * @returns {ProjectPermissions} This permissions object.
     */
    disallow(flag) {
        if (!Object.values(PermissionManager.PROJECT_FLAGS).includes(flag)) throw new Error(`Unknown permission flag: ${flag}`);
        this.#bitfield &= (0b1111_1111 ^ flag);
        return this;
    }

    /**
     * Get this object's allowed permissions.
     * @returns {String[]} A list of the allowed permissions.
     */
    getAllowedPermissionNames() {
        let allowed = [];
        for (const name of PermissionManager.PROJECT_FLAG_NAMES) {
            if (this.has(PermissionManager.PROJECT_FLAGS[name])) allowed.push(name);
        }
        return allowed;
    }

    /**
     * Read in values from a database entry.
     * @param {Object} entry The entry to set values from.
     * @returns {ProjectPermissions} This permissions object.
     */
    setFromEntry(entry) {
        this.userID = entry.userID;
        this.projectID = entry.projectID;
        this.#bitfield = entry.permissions;
        return this;
    }

    /**
     * Save this permissions object to the database.
     * @returns {ProjectPermissions} This permissions object.
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