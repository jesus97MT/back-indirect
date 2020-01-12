'use strict';

const express = require('express');

// Constants
const PORT = 8000;
const HOST = 'localhost';

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Hello world\n');
});

app.get('/homero', (req, res) => {
  res.send('homero');
});

app.listen(PORT);
console.log(`Running on http://${HOST}:${PORT}`);


