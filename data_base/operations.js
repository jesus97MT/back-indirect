const mongodb = require('mongodb');
const Utils = require('../utils/utils')
const client = mongodb.MongoClient;
const rxjs = require('rxjs')

//Start DataBase

module.exports.createCollection = function (url, dataBaseName, collectionName) {
    client.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dataBaseName);
        dbo.createCollection(collectionName, function (err, res) {
            if (err) throw err;
            console.log(`Collection ${collectionName} created!`);
            db.close();
        });
    });
}

module.exports.createUser = function (dbConfig, email, password, userId, userUID) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    client.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dataBaseName);
        var query = { email };
        var myobj = { $set: { name: "", surname: "", email, password, token: "", tokenDate: "", userId, userUID, followers:[], following:  [] } };//modelo
        var options = { upsert: true };
        dbo.collection(collectionName).updateOne(query, myobj, options, function (err, res) {
            if (err) throw err;
            console.log(email + " usuario creado");
            db.close();
        });
    });
}

module.exports.findUserByEmail = function (dbConfig, email) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        var user = {};
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { email: email };
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                user = result[0];
                resolve(user);
            });
        });
    })
}

module.exports.findUserByToken = function (dbConfig, token) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        var user = {};
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { token: token };
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                user = result[0];
                resolve(user);
            });
        });
    });
}

module.exports.findUserByUserId = function (dbConfig, userId) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        var user = {};
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userId };
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                user = result[0];
                resolve(user);
            });
        });
    })
}

module.exports.findUsersByUserUID = function (dbConfig, usersUID) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userUID: { $in : usersUID }};
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                resolve(result);
            });
        });
    })
}

module.exports.findUsersPublicDataByUserUID = function (dbConfig, usersUID) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userUID: { $in : usersUID }};
            var fields = { name: 1 , surname: 1, userId: 1, userUID: 1 };

            dbo.collection(collectionName).find(query).project(fields).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                resolve(result);
            });
        });
    })
}


module.exports.onChangeFindUsersByUserUID = function (dbConfig, getUserFunction, getUserParam, typeList) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    return rxjs.Observable.create((subject) => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            const a = dbo.collection(collectionName).watch();
            a.on('change', (change) => {
                this[getUserFunction+"2"](dbConfig, getUserParam).then((user) => {
                    if (user) {
                        const list = user[typeList];
                        console.log(list)
                        if (list && list.length > 0) {
                            this.findUsersByUserUID2(dbConfig, list).then((users) => {
                                console.log("findUsersByUserUID2");
                                //mirar si hay uno devuelve objeto y si hay más array
                                subject.next([user]);
                            })
                        } else {
                            subject.next([]);
                        }
                    }
                })
            });
        });
    });

}

module.exports.onChangeFindUserByUserId = function (dbConfig, userId) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    return rxjs.Observable.create((subject) => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            const pipeline = [
                { $match: { 'fullDocument.userId': userId } },
              ];
            const a = dbo.collection(collectionName).watch(pipeline, { fullDocument : "updateLookup" });
            a.on('change', (change) => {
                this.findUserByUserId2(dbConfig, userId).then((user) => {
                    subject.next(user);
                });
            });
        });
    });

}

module.exports.onChangeUserByToken = function (dbConfig, token) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    return rxjs.Observable.create((subject) => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            const pipeline = [
                { $match: { 'fullDocument.token': token } },
              ];
            const dataBaseWatch = dbo.collection(collectionName).watch(pipeline, { fullDocument : "updateLookup" });
            dataBaseWatch.on('change', (change) => {
                this.findUserByToken2(dbConfig, token).then((user) => {
                    subject.next(user);
                });
            });
        });
    });

}

module.exports.addTokenToUser = function (dbConfig, user, token) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        const dateNow = Utils.getDate();
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var myquery = { email: user };
            var newvalues = { $set: { token: token, tokenDate: dateNow } };
            dbo.collection(collectionName).updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
                console.log("addTokenToUser");
                db.close();
                resolve(token);
            });
        });
    });
}

module.exports.updateUserData = function (dbConfig, user) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;


    client.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(dataBaseName);
        var myquery = { email: user.email };
        var newvalues = { $set: { name: user.name, surname: user.surname, userId: user.userId } };
        dbo.collection(collectionName).updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("updateUserData");
            db.close();
        });
    });
}

module.exports.followUserByUID = function (dbConfig, op, userA, userB) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var myquery = { userUID: userA };
            var newvalues = { $addToSet: { [op]: userB } };
            dbo.collection(collectionName).updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
                console.log("followUserByUID");
                resolve(userB);
                db.close();
            });
        });
    });
}


module.exports.unFollowUserByUID = function (dbConfig, op, userA, userB) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var myquery = { userUID: userA };
            var newvalues = { $pull: { [op]: userB } };
            dbo.collection(collectionName).updateOne(myquery, newvalues, function (err, res) {
                if (err) throw err;
                console.log("unFollowUserByUID");
                resolve(userB);
                db.close();
            });
        });
    });
}


//indirect

module.exports.addIndirect = function (dbConfig, indirect) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    const dateNow = Utils.getDate();

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var myquery = { indirectUID: indirect.indirectUID };
            var myobj = { $set: {
                    text: indirect.text,
                    userUID: indirect.userUID,
                    indirectUID: indirect.indirectUID,
                    public: indirect.public,
                    mutualsUIDS: indirect.uids,
                    dateCreation:dateNow,
                    dateUpdated: dateNow
                } };//modelo
            var options = { upsert: true };
            dbo.collection(collectionName).updateOne(myquery, myobj, options, function (err, res) {
                if (err) throw err;
                console.log("addIndirect");
                db.close();
            });
        });
    });
}


module.exports.getIndirects = function (dbConfig, usersUID, myUserUID, defaultPagintaion, skipPagination) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    const publicIndirect= true;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userUID: { $in : usersUID },
             $or: [
                {
                    public: publicIndirect
                },
                {
                    userUID: myUserUID
                },
                {
                    mutualsUIDS: [myUserUID]
                }
            ]
            }
            dbo.collection(collectionName).find(query).sort( { dateCreation: -1 } ).limit(defaultPagintaion).skip(skipPagination).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                resolve(result);
            });
        });
    });
}

//todo
findUserByUserId2 = function (dbConfig, userId) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        var user = {};
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userId };
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                user = result[0];
                resolve(user);
            });
        });
    })
}


findUserByToken2 = function (dbConfig, token) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        var user = {};
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { token: token };
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                user = result[0];
                resolve(user);
            });
        });
    });
}


findUsersByUserUID2 = function (dbConfig, usersUID) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            var query = { userUID: { $in : usersUID }};
            dbo.collection(collectionName).find(query).toArray(function (err, result) {
                if (err) throw err;
                db.close();
                resolve(result);
            });
        });
    })
}



