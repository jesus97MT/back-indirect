// db.js
const DB_URL = "mongodb://db:27017/newdb";
const DB_NAME = "mydb";

const COL_NAME_USERS = "users";
const COL_NAME_INDIRECTS = "indirects";

module.exports = {
    DB: DB_URL,
    userConfig: {
        URL: DB_URL,
        NAME: DB_NAME,
        COLLECTION: COL_NAME_USERS
    }
}
