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
        var myobj = { $set: {name: "", surname: "", email, password, token: "", tokenDate: "", userId, userUID }};//modelo
        var options =  { upsert: true };
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
    })
}

module.exports.test = function (dbConfig, userId) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;
    console.log("test");
    return rxjs.Observable.create((subject) => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName);
            
            const a = dbo.collection(collectionName).watch();
            a.on('change', (change) => {
                this.findUserByUserId2(dbConfig, userId).then((user) => {
                subject.next(user);
                });

            });
    })

})
   
}


module.exports.unFollowUserByUID = function (dbConfig, op, userA, userB) {
    const url = dbConfig.URL;
    const dataBaseName = dbConfig.NAME;
    const collectionName = dbConfig.COLLECTION;

    return new Promise(resolve => {
        client.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db(dataBaseName).w;
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



