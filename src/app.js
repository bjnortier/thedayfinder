var http = require('http');
var express = require('express');

var port = process.env.PORT || 8000;
var app = express();
var server = http.createServer(app);

var foo = require('./foo');

app.get(/^.*$/, function(req, res) {
  res.json(foo.bar());
});

server.listen(port);
console.info('server started on :' + port + '\n');
