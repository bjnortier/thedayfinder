var $ = require('jquery');
var calendar = new (require('calendar')).Calendar();
var shortenName = require('./shortenname');
var Handlebars = require('handlebars');
var Backbone = require('backbone');

var eventId = $('#data').data('event-id');

var EventTitleView = Backbone.View.extend({

  tagName: 'h2',

  attributes: {
    contenteditable: true,
  },

  initialize: function(title) {
    this.title = title;
    this.$el.text(title);
    $('#title-and-description').append(this.$el);
    this.$el.keypress(function(e) { return e.which !== 13; });
  },

  events: {
    'blur' : 'change',
  },

  change: function() {
    var newTitle = this.$el.text();
    var that = this;
    $.post('/event/' + eventId + '/title', {title: newTitle}, function() {
      that.title = newTitle;
    }).fail(function() {
      that.$el.text(that.title);
    });
  },

});

var EventDescriptionView = Backbone.View.extend({

  tagName: 'p',

  attributes: {
    contenteditable: true,
  },

  initialize: function(description) {
    this.description = description;
    this.$el.text(description);
    $('#title-and-description').append(this.$el);
  },

  events: {
    'blur' : 'change',
  },

  change: function() {
    var newDescription = this.$el.text();
    var that = this;
    $.post('/event/' + eventId + '/description', {description: newDescription}, function() {
      that.description = newDescription;
    }).fail(function() {
      that.$el.text(that.description);
    });
  },

});

var NewParticipantView = Backbone.View.extend({

  initialize: function() {
    this.render();
    this.$el.appendTo($('#new-participant'));
    this.input = this.$el.find('input[type="text"]');
    this.$el.find('.ok, .cancel').hide();
  },

  render: function() {
    this.$el.html(
      '<input type="text" class="text"/> \
       <i class="ok fa fa-check-circle-o"></i> \
       <i class="cancel fa fa-times-circle-o"></i>');
  },

  events: {
    'click .ok' : 'ok',
    'click .cancel' : 'cancel',
    'keyup': 'keyup',
    'focus .text': 'focus',
    'blur .text': 'blur',
  },

  focus: function() {
    this.$el.find('.ok, .cancel').show();
  },

  blur: function() {
    // this.$el.find('.ok, .cancel').hide();
  },

  ok: function() {
    var name = this.input.val().trim();
    if (name.length) {
      this.trigger('newParticipant', name);
      this.input.val('');
    }
    this.input.blur();
    this.$el.find('.ok, .cancel').hide();
  },

  cancel: function() {
    this.input.val('');
    this.input.blur();
    this.$el.find('.ok, .cancel').hide();
  },

  keyup: function(event) {
    if (event.which === 13) {
      this.ok();
    } else if (event.which === 27) {
      this.cancel();
    }
  },

});

var counter = 0;

var ExistingParticipantView = Backbone.View.extend({

  initialize: function(options) {
    this.name = options.name;
    this.render();
    this.$el.appendTo($('#existing-participants'));
    this.input = this.$el.find('input');
    if (options.selected) {
      this.input.prop('checked', true);
      this.input.focus();
    }
  },

  render: function() {
    var radioId = 'rd_' + (counter++);
    this.$el.html(
      '<input type="radio" name="participants" id="' + radioId + '" value="' + this.name + '"/><label for="' + radioId + '">' + this.name + '</label>');
  },

  events: {
    'change input': 'change',
  },

  change: function() {
    var name = $('input[name=participants]:checked', '#participants').val();
    this.trigger('participantChanged', name);
  },

});


var ParticipantsModel = Backbone.Model.extend({
  
  initialize: function(participants) {

    var newParticipantView = new NewParticipantView({model: this});

    var that = this;
    var onParticipantChange = function(name) {
      that.trigger('participantSelected', name);
    };
    
    this.participantViews = participants.map(function(name) {
      var view = new ExistingParticipantView({model: this, name: name});
      view.on('participantChanged', onParticipantChange);
      return view;
    });

    // Respond to new participant added
    newParticipantView.on('newParticipant', function(name) {

      var existingView = that.participantViews.filter(function(view) {
        return view.name === name;
      });

      if (existingView.length) {
        existingView[0].input.prop('checked',true);
        onParticipantChange(name);
      } else {
        $.post('/event/' + eventId + '/participant', {name: name}, function() {
          var view = new ExistingParticipantView({model: this, name: name, selected: true});
          onParticipantChange(name);
          view.on('participantChanged', onParticipantChange);
          that.participantViews.push(view);
        });
      }

    });
  },

});

var MonthView = Backbone.View.extend({

  initialize: function(options) {
    this.chosenDays = {};
    for (var monthDay in options.chosenByDate) {
      for (var name in options.chosenByDate[monthDay]) {
        if (options.chosenByDate[monthDay][name] > 0) {
          this.chosenDays[monthDay + '_' + name] = true;
        }
      }
    }
    this.view = options;
    this.render();
    $('#months').append(this.$el);
  },

  render: function() {
    var source   =
      '<h3 class="calendar-month">{{name}}</h3> \
       <table class="month" data-month="{{month}}"> \
       <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th> \
       {{#each monthDays}} \
         <tr class="week"> \
         {{#each this}} \
           {{#this}} \
            <td class="day{{#today}} today{{/today}}" data-day="{{day}}"> \
              <div class="label">{{day}}</div> \
              <div class="count">{{count}}</div> \
              <div class="chosen"> \
              {{#each chosen}} \
                <div class="participant" data-participant="{{fullName}}">{{shortName}}</div> \
              {{/each}} \
              </div></td>{{/this}} \
           {{^this}}<td></td>{{/this}} \
         {{/each}} \
         </tr> \
       {{/each}} \
       </table>';
    var template = Handlebars.compile(source);
    this.$el.html(template(this.view));
  },
  
  events: {
    'click .day': 'click',
  },

  click: function(event) {
    var elem = $(event.currentTarget);
    var day = elem.data('day');
    var month = elem.parents('.month').data('month');
    var participant = this.model.activeParticipant;
    var params;
    if (participant) {
      var key = month + '_' + day + '_' + participant;
      this.chosenDays[key] = !this.chosenDays[key];

      if (this.chosenDays[key]) {
        
        params = {name: participant, month: month, day: day, chosen: true};
        $.post('/event/' + eventId + '/choose', params, function() {
          elem.find('.chosen').append(
            $('<div class="participant" data-participant="' +
              participant +
              '">' +
              shortenName(participant) +
              '</div>'));
          elem.find('.count').text(elem.find('.participant').length);
        });
      } else {
        var elementsToRemove = elem.find('.chosen .participant').toArray().filter(function(maybeRemove) {
          return '' + $(maybeRemove).data('participant') === participant;
        });
        if (elementsToRemove.length) {
          params = {name: participant, month: month, day: day, chosen: false};
          $.post('/event/' + eventId + '/choose', params, function() {
            elementsToRemove.forEach(function(elem) { $(elem).remove(); });

            var numberChosen = elem.find('.participant').length;
            if (numberChosen > 0) {
              elem.find('.count').text(numberChosen);
            } else {
              elem.find('.count').text('');
            }
          });
        }
      }
    }
  },

});

var DaysModel = Backbone.Model.extend({

  initialize: function(attributes) {

    var data = attributes.data;
    var participantsModel = attributes.participantsModel;
    var created = new Date(data.created);
    var year = created.getFullYear();
    var month = created.getMonth();
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var chosenByDate = data.chosen.reduce(function(acc, mutation) {
      var key = mutation.month + '_' + mutation.day;
      acc[key] = acc[key] || {};
      if (mutation.chosen) {
        acc[key][mutation.name] = (acc[key][mutation.name] || 0) + 1;
      } else {
        acc[key][mutation.name] = (acc[key][mutation.name] || 0) - 1;
      }
      return acc;
    }, {});

    function getMonthDays(year, month) {
      // Filter out zeroes
      return calendar.monthDays(year, month).reduce(function(acc, week) {
        var filteredWeek = week.map(function(day) {
          if (day !== 0) {
            var chosen = [];
            if (chosenByDate[month + '_' + day]) {
              var objs = chosenByDate[month + '_' + day];
              for (var key in objs) {
                if (objs[key] > 0) {
                  chosen.push(key);
                }
              }
            }
            var now = new Date();
            return {
              day: day,
              chosen: chosen.map(function(fullName) {
                return {fullName: fullName, shortName: shortenName(fullName)};
              }),
              count: chosen.length || undefined,
              today: ((now.getFullYear() === year) && (now.getMonth() === month) && (now.getDate() === day)),
            };
          } else {
            return undefined;
          }
        });
        acc.push(filteredWeek);
        return acc;
      }, []);
    }

    for (var i = 0; i < data.months; ++i) {

      new MonthView({
        model: this,
        month: month,
        name: monthNames[month],
        monthDays: getMonthDays(year, month),
        chosenByDate: chosenByDate,
      });
    
      ++month;
      if (month === 12) {
        month = 0;
        ++year;
      }
    }

    var that = this;
    participantsModel.on('participantSelected', function(name) {
      $('#months').removeClass('disabled');
      that.activeParticipant = name;
    });

    var addMonthButton = $('<i class="fa fa-plus-circle"></i>');
    $('#add-month').append(addMonthButton);
    addMonthButton.click(function() {

      $.post('/event/' + eventId + '/addYear', {}, function() {

        new MonthView({
          model: that,
          month: month,
          name: monthNames[month],
          monthDays: getMonthDays(year, month),
          chosenByDate: chosenByDate,
        });
      
        ++month;
        if (month === 12) {
          month = 0;
          ++year;
        }
      });
    });

  },

});

$('body').append($(' \
  <div id="error"></div> \
  <div id="title-and-description"> \
  </div> \
  <div id="participants"> \
    <div class="instructions">I\'m new:</div> \
    <div id="new-participant"></div> \
    <div class="instructions">I\'ve been here before:</div> \
    <div id="existing-participants"></div> \
  </div> \
  <div class="instructions">Click on the days you are available:</div> \
  <div id="months" class="disabled"> \
  </div> \
  <div id="add-month"></div>'));

$.get('/event/' + eventId, function(data) {

  new EventTitleView(data.title);
  new EventDescriptionView(data.description);
  var participantsModel = new ParticipantsModel(data.participants);
  new DaysModel({data: data, participantsModel: participantsModel});

}).fail(function(err) {
  if (err.status === 404) {
    $('#error').text('not found');
  } else {
    $('#error').text('oops [' + err.status + ']');
  }
});