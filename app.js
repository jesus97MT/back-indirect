const express = require('express');
const http = require('http').Server(express);

const Socketeio = require('socket.io')(http);
const mongodb = require('mongodb');

const Utils = require('./utils/utils');
const config = require('./data_base/db');
const operationsDB = require('./data_base/operations');
const client = mongodb.MongoClient;
// Constants
const PORT = 8000;
const HOST = 'localhost';

//SOCKET IO
Socketeio.use(function (socket, next) {
    const op = socket.handshake.query.op || null;
    switch (op) {
        case "login":
            {
                const dbConfig = config.userConfig;
                const userData = JSON.parse(socket.handshake.query.user)
                const email = userData.email;
                const password = userData.password;

                operationsDB.findUserByEmail(dbConfig, email).then((user) => {
                    if (user && user.password === password) {
                        console.log('conected')
                        next();
                    } else {
                        console.log('NOT conected Wrong password')
                        next(new Error('Authentication error. Wrong Password'));
                    }
                });
                break;
            }
        case "token":
            {
                const dbConfig = config.userConfig;
                const token = socket.handshake.query.token;
                operationsDB.findUserByToken(dbConfig, token).then((user) => {
                    if (user && user.token && user.tokenDate) {
                        const dateNow = Utils.getDate();
                        const diffTime = Math.abs(dateNow - user.tokenDate);
                        const oneDay = 1000 * 60 * 60 * 24;
                        const diffDays = Math.ceil(diffTime / oneDay);

                        if (diffDays <= 1) next();
                        else next(new Error('Authentication error. Outdated Token'));
                    } else next(new Error('Authentication error'));
                });
                break;
            }
        case "createUser":
            {
                const dbConfig = config.userConfig;
                const user = JSON.parse(socket.handshake.query.user)
                const email = user.email;
                const password = user.password;
                const userId = user.userId;
                const userUID = Utils.getUID();

                operationsDB.createUser(dbConfig, email, password, userId, userUID);
                next();
                break;
            }
        default:
            {
                console.log('NOT conected')
                next(new Error('Authentication error'));
                break;
            }
    }
})
    .on("connect", (socket) => {
        const op = socket.handshake.query.op || null;
        if (op === "login") {
            const dbConfig = config.userConfig;
            const userData = JSON.parse(socket.handshake.query.user)
            const email = userData.email;
            const newToken = Utils.getNewToken();

            operationsDB.addTokenToUser(dbConfig, email, newToken).then((token) => {
                socket.emit("getToken", newToken);

                operationsDB.findUserByToken(dbConfig, newToken).then((user) => {
                    console.log(user)
                    if (user) socket.emit("getUserByLogin", user);
                    socket.emit("getUserByLogin", null);
                });
            });
            
        }
        if (op === "token") {
            const dbConfig = config.userConfig;
            const token = socket.handshake.query.token;
            operationsDB.findUserByToken(dbConfig, token).then((user) => {
                if (user) socket.emit("getUserByToken", user);
                socket.emit("getUserByToken", null);
            });

        }
    })
    .on("connection", socket => {
        testConexion();

        socket.on('test', function (msg) {
            console.log('message: ' + msg);
        });

        socket.on('disconnect', function () {
            console.log('Disconnected user');
        });
        socket.on('logout', function () {
            console.log('logout user');
            socket.disconnect();
            testConexion();

        });

        socket.on('getUserName', function () {
            testConexion();
            socket.emit("setUserName", "Jesuswapo")
        });

        socket.on('updateUserData', function (data) {
            //TO DO comprobar datos y crear objeto con datos que puede modificar el email no
            const dbConfig = config.userConfig;
            operationsDB.updateUserData(dbConfig, data);

        });

        socket.on('findUserByUserId', function (userId) {
            //TO DO comprobar datos y crear objeto con datos que puede modificar el email no
            const dbConfig = config.userConfig;
            operationsDB.findUserByUserId(dbConfig, userId).then((user) => {
                if (user)
                    socket.emit("getUserByUserId", user);
                else
                    socket.emit("getUserByUserId", null);
            });
            console.log("WWWWWWWWWWWWWWWWWW")
            //const a = operationsDB.test(dbConfig)
             
        });

        socket.on('followUser', function (data) {
            const token = data.token;
            const toFollowUserUID = data.data;

            const dbConfig = config.userConfig;
            operationsDB.findUserByToken(dbConfig, token).then((fromFollowUser) => {
                const fromFollowUserUID = fromFollowUser.userUID;
                const p1 = operationsDB.followUserByUID(dbConfig, "followers", toFollowUserUID, fromFollowUserUID);
                const p2 = operationsDB.followUserByUID(dbConfig, "following", fromFollowUserUID, toFollowUserUID);
                Promise.all([p1, p2]).then(values => {
                    if (values && !!values.length)
                        socket.emit("onFollowUser", values);
                    else
                        socket.emit("onFollowUser", values);
                });
            });
        });

        socket.on('unFollowUser', function (data) {
            const token = data.token;
            const toFollowUserUID = data.data;

            const dbConfig = config.userConfig;
            operationsDB.findUserByToken(dbConfig, token).then((fromFollowUser) => {
                const fromFollowUserUID = fromFollowUser.userUID;
                const p1 = operationsDB.unFollowUserByUID(dbConfig, "followers", toFollowUserUID, fromFollowUserUID);
                const p2 = operationsDB.unFollowUserByUID(dbConfig, "following", fromFollowUserUID, toFollowUserUID);
                Promise.all([p1, p2]).then(values => { 
                    if (values && !!values.length)
                        socket.emit("onUnFollowUser", values);
                    else
                        socket.emit("onUnFollowUser", values);
                });
            });
        });
    });

    function testConexion() {
        Socketeio.clients((error, clients) => {
            if (error) throw error;
            console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
          });
    }
    
//MONGO DB

/*client.connect(config.DB, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.collection("indirects").findOne({}, function (err, result) {
        if (err) throw err;
        console.log(result.name);
        db.close();
    });
});*/

//usar cuando al crear la base de datos
function createAll() {
    const nameCollections = ["users", "indirects"];
    const dataBaseName = "mydb";
    const url = config.DB;
    nameCollections.forEach(name => {
        operationsDB.createCollection(url, dataBaseName, name)
    });
}

http.listen(process.env.PORT || PORT, () => {
    console.log(`Running on http://${HOST}:${PORT}`)
});


