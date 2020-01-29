const express = require('express');
const app = express();
const http = require('http').Server(express);
const Socketeio = require('socket.io')(http);
const mongodb = require('mongodb');


const config = require('./data_base/db');
//const apiRestLogin = require('./src/login');
const client = mongodb.MongoClient;
// Constants
const PORT = 8000;
const HOST = 'localhost';




//SOCKET IO

Socketeio.use(function (socket, next) {
  if (socket.handshake.query && socket.handshake.query.email && socket.handshake.query.password) {
    const email = socket.handshake.query.email;
    const password = socket.handshake.query.password;
    findUserByEmail(email).then((user) => {
      if (user && user.password === password) {
        console.log('conected')
        next();
      } else {
        console.log('NOT conected Wrong password')
        next(new Error('Authentication error. Wrong Password'));
      }
    });
  } else if (socket.handshake.query && socket.handshake.query.token) {
    const token = socket.handshake.query.token;
    findUserByToken(token).then((user) => {
      if (user && user.token && user.tokenDate) {
        const dateNow = getDate();
        const diffTime = Math.abs(dateNow - user.tokenDate);
        const oneDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.ceil(diffTime / oneDay);

        if (diffDays <= 1) {
          next();
        } else {
          next(new Error('Authentication error. Outdated Token'));
        }
      } else {
        next(new Error('Authentication error'));
      }
    })
    //comprobar que existe token y que no está caducado!!!!

  } else if (socket.handshake.query && socket.handshake.query.op === "createUser") {
    const user = JSON.parse(socket.handshake.query.user)
    const email = user.email;
    const password = user.password;
    createUser(email, password);
    next();

  } else {
    console.log('NOT conected')

    next(new Error('Authentication error'));
  }

})
  .on("connect", (socket) => {
    if (socket.handshake.query && socket.handshake.query.email && socket.handshake.query.password) {
      const email = socket.handshake.query.email;
      const newToken = getNewToken();
      addTokenToUser(email, newToken);
      /*findUser(email).then((user) => {
        console.log(user)
      });*/
      socket.emit("getToken", newToken);
    }

  })
  .on("connection", socket => {


    socket.on('test', function (msg) {
      console.log('message: ' + msg);
    });

    socket.on('getUserName', function () {
      socket.emit("setUserName", "Jesuswapo")
    });
  });

// Socketeio.on("disconnect", reason => {
//   //console.log(reason)
//   console.log("jalubiani")
// });

// Socketeio.on("error", error => {
//   //console.log(reason)
//   console.log("")
// });

//MONGO DB

client.connect(config.DB, function (err, db) {
  if (err) throw err;
  var dbo = db.db("mydb");
  dbo.collection("indirects").findOne({}, function (err, result) {
    if (err) throw err;
    console.log(result.name);
    db.close();
  });
});

//crear collection only
function createCollection() {
  client.connect(config.DB, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection("users", function (err, res) {
      if (err) throw err;
      console.log("Collection created!");
      db.close();
    });
  });
}

function createUser(email, password) {
  client.connect(config.DB, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var myobj = { name: "", surname: "", email, password, token: "", tokenDate: "" };//modelo
    dbo.collection("users").insertOne(myobj, function (err, res) {
      if (err) throw err;
      console.log(email + " usuario creado");
      db.close();
    });
  });
}
//mongo create collection

//find user
function findUserByEmail(email) {
  return new Promise(resolve => {
    var user = {};

    client.connect(config.DB, function (err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      var query = { email: email };
      dbo.collection("users").find(query).toArray(function (err, result) {
        if (err) throw err;

        db.close();
        user = result[0];
        resolve(user);
      });
    });
  })
}

function findUserByToken(token) {
  return new Promise(resolve => {
    var user = {};

    client.connect(config.DB, function (err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      var query = { token: token };
      dbo.collection("users").find(query).toArray(function (err, result) {
        if (err) throw err;

        db.close();
        user = result[0];
        resolve(user);
      });
    });
  })
}


function addTokenToUser(user, token) {
  const dateNow = getDate();
  client.connect(config.DB, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var myquery = { email: user };
    var newvalues = { $set: { token: token, tokenDate: dateNow } };
    dbo.collection("users").updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log("1 document updated");
      db.close();
    });
  });
}



function getRandom() {
  return Math.random().toString(36).substr(2); // Eliminar `0.`
};

function getNewToken() {
  return getRandom() + getRandom(); // Para hacer el token más largo
};

function getDate() {
  const date = new Date();
  return date.getTime();
}



http.listen(PORT, () => {
  console.log(`Running on http://${HOST}:${PORT}`)
});


