const express = require('express');
const http = require('http').Server(express);
const Socketeio = require('socket.io')(http);


// Constants
const PORT = 8000;
const HOST = 'localhost';

Socketeio.on("connection", socket => {
  socket.emit("holo", 123)
});


http.listen(PORT, () => {
  console.log(`Running on http://${HOST}:${PORT}`)
});


