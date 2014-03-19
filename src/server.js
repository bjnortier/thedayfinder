var path = require('path');
var http = require('http');
var express = require('express');
var nano = require('nano')('http://localhost:5984');

var port = process.env.PORT || 8000;
var app = express();
var server = http.createServer(app);

app.set('views', path.join(__dirname, '..', 'templates'));
app.set('view engine', 'hbs');

nano.db.create('thedayfinder', function(err) {
  if (err && (err.status_code !== 412)) {
    console.error(err);
  } else {

    app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    var db = nano.db.use('thedayfinder');

    // Get the root - create a new event
    app.get(/^\/$/, function(req, res) {
      var doc = {
        type: 'event',
        created: new Date(new Date().getTime() - 24*3600*1000),
        name: 'The Event',
        description: 'The event description',
        months: 2,
      };

      db.insert(doc, function(err, result) {
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

    app.get(/^\/data\/([0-9a-f]{32})$/, function(req, res) {
      var id = req.params[0];
      db.get(id, function(err, doc) {
        if (err) {
          if (err.status_code === 404) {
            res.send(404);
          } else {
            res.send(500);
          }
        } else {
          res.json({
            id: doc._id,
            name: doc.name,
            description: doc.description,
            created: doc.created,
            months: doc.months,
          });
        }
      });
    });

    server.listen(port);
    console.info('server started on :' + port + '\n');
  }
});