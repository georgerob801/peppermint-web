'use strict';

const { operation } = require("./DatabaseManager");

const SnowflakeID = require("snowflake-id").default;
const snowflake = new SnowflakeID();

class CommentManager {
    constructor() {
        if (this instanceof CommentManager) throw Error("CommentManager cannot be instantiated.");
    }

    /**
     * Get a comment from its ID.
     * @param {String} commentID The ID of the comment.
     * @returns {Comment} The comment.
     */
    static get(commentID) {
        if (!commentID) return undefined;
        let entry = operation(db => db.prepare("SELECT * FROM comments WHERE id = ?").get(commentID));
        if (!entry) return undefined;
        return CommentManager.newComment().setFromEntry(entry);
    }

    /**
     * Get a specified number of comments for a project. Ordered newest first.
     * @param {String} projectID The ID of the project.
     * @param {Number} limit The max number of comments to get.
     * @param {Number} offset The number to offset the results by.
     * @returns {Comment[]} The comments.
     */
    static getForProject(projectID, limit, offset) {
        if (!projectID) return undefined;
        limit ??= 5;
        offset ??= 0;
        let entries = operation(db => db.prepare(`SELECT * FROM comments WHERE projectID = ? ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`).all(projectID));
        return entries.map(x => CommentManager.newComment().setFromEntry(x));
    }

    static getForUser(userID, limit, offset) {
        if (!userID) return undefined;
        limit ??= 5;
        offset ??= 0;
        let entries = operation(db => db.prepare(`SELECT * FROM comments WHERE userID = ? ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`).all(userID));
        return entries.map(x => CommentManager.newComment().setFromEntry(x));
    }

    /**
     * Generate a new comment.
     * @returns {Comment} The new comment.
     */
    static newComment() {
        return new Comment();
    }
}
class Comment {
    /** @type {String} */
    projectID;
    /** @type {String} */
    id;
    /** @type {String} */
    userID;
    /** @type {Number} */
    timestamp;
    /** @type {Boolean} */
    edited;
    /** @type {String} */
    content;

    constructor() {
        this.edited = false;
    }
    
    /**
     * Set a user as the author of this comment.
     * @param {import("./UserManager").User} user The user to set as the author.
     * @returns {Comment} This comment.
     */
    setAuthor(user) {
        this.userID = user.id;
        return this;
    }

    /**
     * Read in values from a database entry.
     * @param {Object} entry The database entry to read from.
     * @returns {Comment} This comment object.
     */
    setFromEntry(entry) {
        [
            "id",
            "projectID",
            "userID",
            "content",
            "timestamp"
        ].forEach(x => this[x] = entry[x]);
        this.edited = entry.edited == 1;
        return this;
    }

    /**
     * Save a comment to the database.
     * @returns {Comment} This comment.
     */
    save() {
        if (!this.projectID) throw Error("This comment is not attributed to a project.");
        if (!this.userID) throw Error("This comment is not attributed to a user.");

        this.checkID().checkTimestamp();

        operation(db => db.prepare("REPLACE INTO comments (projectID, id, userID, timestamp, edited, content) VALUES (?, ?, ?, ?, ?, ?)").run(this.projectID, this.id, this.userID, this.timestamp, this.edited ? 1 : 0, this.content));
        return this;
    }

    /**
     * Ensures this comment has an ID.
     * @returns {Comment} This comment.
     */
    checkID() {
        if (!this.id) {
            this.id = snowflake.generate();
        }

        return this;
    }

    /**
     * Check this comment has a timestamp set.
     * @returns {Comment} This comment.
     */
    checkTimestamp() {
        if (this.timestamp === undefined) {
            this.timestamp = new Date().getTime();
        }
        return this;
    }

    /**
     * Delete this comment.
     */
    delete() {
        operation(db => db.prepare("DELETE FROM comments WHERE id = ?").run(this.id));
        delete this;
    }
}

module.exports = CommentManager;