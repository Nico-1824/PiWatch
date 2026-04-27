const http = require("http");
const fs = require('fs');
const path = require('path');
const express = require('express');
const { logRequest } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logRequest);
app.use(errorHandler);


module.exports = { app, server };