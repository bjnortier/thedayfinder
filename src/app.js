var path = require('path');
var http = require('http');
var express = require('express');
var nano = require('nano')('http://localhost:5984');

var port = process.env.PORT || 8000;
var app = express();
var server = http.createServer(app);
var calendar = new (require('calendar')).Calendar();

app.set('views', path.join(__dirname, '..', 'templates'));
app.set('view engine', 'hbs');

nano.db.create('thedayfinder', function(err) {
  if (err && (err.status_code !== 412)) {
    console.error(err);
  } else {

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
      db.get(id, function(err, doc) {
        if (err) {
          if (err.status_code === 404) {
            res.send(404);
          } else {
            res.send(500);
          }
        } else {
          var created = new Date(doc.created);
          var year = created.getFullYear();
          var month = created.getMonth();
          var calendarMonths = [];
          var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'November', 'December'];

          for (var i = 0; i < doc.months; ++i) {
            // Filter out zeroes
            var monthDays = calendar.monthDays(year, month).reduce(function(acc, week) {
              var filteredWeek = week.map(function(day) {
                if (day !== 0) {
                  return day;
                } else {
                  return undefined;
                }
              });
              acc.push(filteredWeek);
              return acc;
            }, []);

            calendarMonths.push({
              name: monthNames[month],
              monthDays: monthDays,
            });

            ++month;
            if (month === 12) {
              month = 0;
              ++year;
            }
          }
          console.log('>>>', calendarMonths);
          res.render('event', {
            id: doc.id,
            name: doc.name,
            description: doc.description,
            calendarMonths: calendarMonths,
          });
        }
      });
    });

    server.listen(port);
    console.info('server started on :' + port + '\n');
  }
});