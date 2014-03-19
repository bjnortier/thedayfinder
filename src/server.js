var path = require('path');
var http = require('http');
var express = require('express');
var async = require('async');
var nano = require('nano')('http://localhost:5984');

var port = process.env.PORT || 8000;
var app = express();
var server = http.createServer(app);

app.set('views', path.join(__dirname, '..', 'templates'));
app.set('view engine', 'hbs');
app.use(express.bodyParser());

nano.db.create('thedayfinder', function(err) {
  if (err && (err.status_code !== 412)) {
    console.error(err);
  } else {



    app.use('/public', express.static(path.join(__dirname, '..', 'public')));

    var db = nano.db.use('thedayfinder');

    db.insert({
      'views': {
        'byEvent': {
          'map': 'function(doc) { if (doc.type === "participant") { emit(doc.eventId, doc.name); } }'
        }
      }
    }, '_design/participants', function (err) {
      if (err && (err.status_code !== 409)) {
        console.error(err);
      }
    });

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
    app.get(/^\/([0-9a-f]{32})\/?$/, function(req, res) {
      var id = req.params[0];
      res.render('event', {
        id: id,
      });
    });

    app.get(/^\/event\/([0-9a-f]{32})\/?$/, function(req, res) {
      var id = req.params[0];

      async.parallel([
        function(cb) {
          db.get(id, cb);
        },
        function(cb) {
          db.view('participants', 'byEvent', cb);
        },
      ], function(err, results) {
        if (err) {
          if (err.status_code === 404) {
            res.send(404);
          } else {
            res.send(500);
          }
        } else {
          var doc = results[0][0];
          var view = results[1][0];
          console.log('1>>>', doc);
          console.log('2>>>', view);
          var participants = view.rows.map(function(row) {
            return row.value;
          });

          res.json({
            id: doc._id,
            name: doc.name,
            description: doc.description,
            created: doc.created,
            months: doc.months,
            participants: participants,
          });
        }
      });

    });

    app.post(/^\/event\/([0-9a-f]{32})\/participant\/?$/, function(req, res) {

      var name = req.body.name && req.body.name.trim();
      if (name && name.length) {
        var doc = {
          eventId: req.params[0],
          type: 'participant',
          name: name,
        };
        db.insert(doc, function(err) {
          if (err) {
            res.send(500);
          } else {
            res.send(201);
          }
        });
      } else {
        res.send(404);
      }
    });

    server.listen(port);
    console.info('server started on :' + port + '\n');
  }
});