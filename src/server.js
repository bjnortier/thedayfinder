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

    db.insert({
      'views': {
        'byEvent': {
          'map': 'function(doc) { if (doc.type === "choose") { emit(doc.eventId, doc); } }'
        }
      }
    }, '_design/chosen', function (err) {
      if (err && (err.status_code !== 409)) {
        console.error(err);
      }
    });

    // Get the root - create a new event
    app.get(/^\/$/, function(req, res) {
      var doc = {
        type: 'event',
        created: new Date(new Date().getTime() - 24*3600*1000),
        title: 'The Event Title (click/tap to edit)',
        description: 'The event description (click/tap to edit)',
        months: 2,
      };

      db.insert(doc, function(err, result) {
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
          db.view('participants', 'byEvent', { keys: [id] }, cb);
        },
        function(cb) {
          db.view('chosen', 'byEvent', { keys: [id] }, cb);
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
          var participantsView = results[1][0];
          var chosenView = results[2][0];
          var participants = participantsView.rows.map(function(row) {
            return row.value;
          });
          var chosen = chosenView.rows.map(function(row) {
            return {
              name: row.value.name,
              month: row.value.month,
              day: row.value.day,
              chosen: row.value.chosen,
            };
          });

          res.json({
            id: doc._id,
            title: doc.title,
            description: doc.description,
            created: doc.created,
            months: doc.months,
            participants: participants,
            chosen: chosen,
          });
        }
      });

    });


    app.post(/^\/event\/([0-9a-f]{32})\/title\/?$/, function(req, res) {

      var newTitle = req.body.title;
      var eventId = req.params[0];
      if (!newTitle || !newTitle.trim().length) {
        res.send(404);
        return;
      }

      async.waterfall([
        function(cb) {
          db.get(eventId, cb);
        },
        function(doc, header, cb) {
          doc.title = newTitle;
          db.insert(doc, cb);
        }
      ], function(err) {
        if (err) {
          res.send(500);
        } else {
          res.send(200);
        }
      });

    });

    app.post(/^\/event\/([0-9a-f]{32})\/addYear\/?$/, function(req, res) {

      var eventId = req.params[0];
      async.waterfall([
        function(cb) {
          db.get(eventId, cb);
        },
        function(doc, header, cb) {
          doc.months = doc.months + 1;
          db.insert(doc, cb);
        }
      ], function(err) {
        if (err) {
          res.send(500);
        } else {
          res.send(200);
        }
      });

    });

    app.post(/^\/event\/([0-9a-f]{32})\/description\/?$/, function(req, res) {

      var newDescription = req.body.description;
      var eventId = req.params[0];
      if (!newDescription || !newDescription.trim().length) {
        res.send(404);
        return;
      }

      async.waterfall([
        function(cb) {
          db.get(eventId, cb);
        },
        function(doc, header, cb) {
          doc.description = newDescription;
          db.insert(doc, cb);
        }
      ], function(err) {
        if (err) {
          res.send(500);
        } else {
          res.send(200);
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

    app.post(/^\/event\/([0-9a-f]{32})\/choose\/?$/, function(req, res) {

      var name = req.body.name;
      var month = parseInt(req.body.month, 10);
      var day = parseInt(req.body.day, 10);
      var chosen = req.body.chosen === 'true';

      var doc = {
        eventId: req.params[0],
        type: 'choose',
        name: name,
        month: month,
        day: day,
        chosen: chosen,
      };
      db.insert(doc, function(err) {
        if (err) {
          res.send(500);
        } else {
          res.send(201);
        }
      });

    });


    server.listen(port);
    console.info('server started on :' + port + '\n');
  }
});