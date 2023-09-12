'use strict';

const SnowflakeID = require("snowflake-id").default;
// init snowflake
const snowflake = new SnowflakeID();

// session identifier
const { generate: randomString } = require("randomstring");

// db stuff
const { operation } = require("./DatabaseManager");

const { compareSync } = require("bcrypt");

/**
 * @typedef {Object} User
 * @property {String} id
 * @property {String} displayName
 * @property {String} handle
 * @property {String} iconURL
 * @property {String} sessionIdentifier
 */

class UserManager {
    constructor() {
        if (this instanceof UserManager) throw Error("UserManager cannot be instantiated.");
    }

    static get(id) {
        // ensure the user exists
        if (!id || !operation(db => db.prepare("SELECT id FROM users WHERE id = ?").get(id))) return undefined;
        // get stored info
        let entry = operation(db => db.prepare("SELECT * FROM users WHERE id = ?").get(id));

        // set user properties from entry
        let user = UserManager.newUser();
        user.readFromEntry(entry);
        return user;
    }

    /**
     * Generate a new user.
     * @returns {User} A new user.
     */
    static newUser() {
        return new User();
    }

    /**
     * Find a user by the value of a property.
     * @param {String} prop Column name.
     * @param {any} val Value to check (needs to be identical to the value in the database).
     */
    static findByProperty(prop, val) {
        // ensure existence of column
        if (!operation(db => db.prepare("PRAGME table_info(user)").all()).map(x => x.name).includes(prop)) throw new Error(`The property '${prop}' doesn't exist.`);

        // then get by property
        let entry = operation(db => db.prepare(`SELECT * FROM users WHERE ${prop} = ?`).get(val));

        if (!entry) return undefined;

        let user = this.newUser();
        return user.readFromEntry(entry);
    }
}

/**
 * Class for individual users.
 * @type {User}
 */
class User {
    #passwordHash;
    #permissionsBitfield;

    /**
     * Read a database entry's values into this user.
     * @param {Object} entry The database entry to read from.
     * @returns {User} This user.
     */
    readFromEntry(entry) {
        // replace null with undefined cause it's easier to deal with
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
     */
    #setFromDB(type, value) {
        switch (type) {
            case "passwordHash":
                this.#passwordHash = value;
                break;
            case "permissions":
                this.#permissionsBitfield = value;
                break;
            default:
                this[type] = value;
        }
    }

    /**
     * Get a value to save to the database.
     * @param {String} type The type of value to get.
     * @returns {any} The value to be set to the database.
     */
    #getForDB(type) {
        switch (type) {
            case "passwordHash":
                return this.#passwordHash;
            case "permissions":
                return this.#permissionsBitfield;
            default:
                return this[type];
        }
    }

    /**
     * Save this user to the database.
     * @param {String=} column A specific column to save.
     * @returns {User} This user.
     */
    save(column) {
        // shorthand
        let f = this.#getForDB;
        // if no column specified save entire user
        if (!column) {
            // ensure ID is set
            this.checkID();
            this.checkSessionIdentifier();
            // check previous records
            if (operation(db => db.prepare("SELECT id FROM users WHERE id = ?").get(f("id")))) {
                // exists, overwrite
                operation(db => db.prepare("UPDATE users SET displayName = ?, handle = ?, iconURL = ?, passwordHash = ?, sessionIdentifier = ?, permissions = ? WHERE id = ?").run(f("displayName"), f("handle"), f("iconURL"), f("passwordHash"), f("sessionIdentifier"), f("permissions"), f("id")));
            } else {
                // doesn't exist, create new
                operation(db => db.prepare("INSERT INTO users (id, displayName, handle, iconURL, passwordHash, sessionIdentifier, permissions VALUES (?, ?, ?, ?, ?, ?, ?)").run(f("id"), f("displayName"), f("handle"), f("iconURL"), f("passwordHash"), f("sessionIdentifier"), f("permissions")));
            }
        } else {
            // ensure existence first
            if (!this.id) throw new Error("No ID set.")
            if (!operation(db => db.prepare("SELECT id FROM users WHERE id = ?").get(f("id")))) throw new Error("Column-specific updates only work with existing records.");

            // ensure existence of column
            if (!operation(db => db.prepare("PRAGMA table_info(user)").all()).map(x => x.name).includes(column)) throw new Error(`The property '${column}' doesn't exist.`);

            // then set property
            operation(db => db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(f(column), f("id")));
        }

        // return the user
        return this;
    }

    /**
     * Ensures this user has an ID.
     * @returns {User} This user.
     */
    checkID() {
        if (!this.id) {
            this.id = snowflake.generate();
        }
        return this;
    }

    /**
     * Ensure this user has a session ID.
     * @returns {Boolean} True/false depending on whether a new session ID was created.
     */
    checkSessionIdentifier() {
        if (!this.sessionIdentifier) {
            this.sessionIdentifier = randomString(25);
            return true;
        }
        return false;
    }

    /**
     * Check this user is in the database.
     * @returns {Boolean} True/false depending on whether this user is in the database.
     */
    checkInDB() {
        if (!this.id || !UserManager.get(this.id)) return false;
        return true;
    }

    /**
     * Check a password against the stored hash.
     * @param {String} password The password to check.
     * @returns {Boolean} True/false depending on whether the password is correct.
     */
    checkPassword(password) {
        return compareSync(password, this.#passwordHash);
    }
}

module.exports = UserManager;