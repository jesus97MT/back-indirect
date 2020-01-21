const express = require('express');
const http = require('http').Server(express);
const Socketeio = require('socket.io')(http);
const mongodb = require('mongodb');


const config = require('./db');
const client = mongodb.MongoClient;
// Constants
const PORT = 8000;
const HOST = 'localhost';


//SOCKET IO
Socketeio.on("connection", socket => {
  socket.emit("holo", 123);

  socket.on('test', function(msg){
    console.log('message: ' + msg);
  });
});

//MONGO DB

client.connect(config.DB, function(err, db) {
  if(err) {
      console.log('database is not connected')
  }
  else {
      console.log('connected!!')
  }
});



http.listen(PORT, () => {
  console.log(`Running on http://${HOST}:${PORT}`)
});


