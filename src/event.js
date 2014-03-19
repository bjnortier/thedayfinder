var $ = require('jquery');
var calendar = new (require('calendar')).Calendar();
var Handlebars = require('handlebars');

var id = $('#data').data('event-id');
$.get('/data/' + id, function(data) {
  $('#name').text(data.name);
  $('#description').text(data.description);

  var created = new Date(data.created);
  var year = created.getFullYear();
  var month = created.getMonth();
  var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'November', 'December'];

  var source   =
      '{{name}} \
       <table class="month"> \
       <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th> \
       {{#each monthDays}} \
         <tr class="week"> \
         {{#each this}} \
           <td>{{#this}}{{.}}{{/this}}</td> \
         {{/each}} \
         </tr> \
       {{/each}} \
       </table>';
  var template = Handlebars.compile(source);


  for (var i = 0; i < data.months; ++i) {
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

    $('#months').append(template({
      name: monthNames[month],
      monthDays: monthDays,
    }));

    ++month;
    if (month === 12) {
      month = 0;
      ++year;
    }
  }

}).fail(function(err) {
  if (err.status === 404) {
    $('#error').text('not found');
  } else {
    $('#error').text('oops [' + err.status + ']');
  }
});