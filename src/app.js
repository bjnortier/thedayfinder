var path = require('path');
var http = require('http');
var express = require('express');
var nano = require('nano')('http://localhost:5984');

var port = process.env.PORT || 8000;
var app = express();
var server = http.createServer(app);

app.set('views', path.join(__dirname, '..', 'templates'));
app.set('view engine', 'hbs');

nano.db.create('thedayfinder', function(err, body) {
  if (err && (err.status_code !== 412)) {
    console.error(err);
  } else {

    var db = nano.db.use('thedayfinder');

    // Get the root - create a new event
    app.get(/^\/$/, function(req, res) {
      db.insert({}, function(err, result) {
        console.log(result);
        if (err) {
          res.send(500);
        } else {
          res.redirect('/' + result.id);
        }
      });
    });

    // Get the event
    app.get(/^\/([0-9a-f]{32})$/, function(req, res) {
      var id = req.params[0];
      res.render('event', {
        id: id,
      });
    });

    server.listen(port);
    console.info('server started on :' + port + '\n');
  }
});