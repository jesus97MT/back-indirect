// db.js
const DB_URL = "mongodb+srv://indirect:tTiwp0XDPEWu7wnL@cluster0-fbnjg.mongodb.net/test?retryWrites=true&w=majority";
const DB_NAME = "mydb";

const COL_NAME_USERS = "users";
const COL_NAME_INDIRECTS = "indirects";

module.exports = {
    DB: DB_URL,
    userConfig: {
        URL: DB_URL,
        NAME: DB_NAME,
        COLLECTION: COL_NAME_USERS
    },
    indirectConfig: {
        URL: DB_URL,
        NAME: DB_NAME,
        COLLECTION: COL_NAME_INDIRECTS
    }
}
