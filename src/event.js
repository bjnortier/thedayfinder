var $ = require('jquery');
var calendar = new (require('calendar')).Calendar();
var Handlebars = require('handlebars');
var Backbone = require('backbone');


var NewParticipantView = Backbone.View.extend({

  initialize: function() {
    this.render();
    this.$el.appendTo($('#new-participant'));
    this.input = this.$el.find('input[type="text"]');
  },

  render: function() {
    this.$el.html(
      '<input type="text"/> \
       <input type="button" value="ok" class="ok"/> \
       <input type="button" value="cancel" class="cancel"/>');
  },

  events: {
    'click .ok' : 'ok',
    'click .cancel' : 'cancel',
    'keyup': 'keyup',
  },

  ok: function() {
    var name = this.input.val().trim();
    if (name.length) {
      this.trigger('newParticipant', name);
      this.input.val('');
    }
  },

  cancel: function() {
    this.input.val('');
  },

  keyup: function(event) {
    if (event.which === 13) {
      this.ok();
    } else if (event.which === 27) {
      this.cancel();
    }
  },

});

var ExistingParticipantView = Backbone.View.extend({

  initialize: function(options) {
    this.name = options.name;
    this.render();
    this.$el.appendTo($('#participants'));
    this.input = this.$el.find('input');
    if (options.selected) {
      this.input.prop('checked', true);
      this.input.focus();
    }
  },

  render: function() {
    this.$el.html(
      '<input type="radio" name="participants/><span class="name">' + this.name + '</span>');
  },

});


var ParticipantsModel = Backbone.Model.extend({
  
  initialize: function() {
    var newParticipantView = new NewParticipantView({model: this});
    this.views = [
      newParticipantView,
    ];
    var that = this;
    newParticipantView.on('newParticipant', function(name) {
      that.views.push(new ExistingParticipantView({model: this, name: name, selected: true}));
    });
  },

});


var id = $('#data').data('event-id');
$.get('/data/' + id, function(data) {
  $('#name').text(data.name);
  $('#description').text(data.description);

  new ParticipantsModel();

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