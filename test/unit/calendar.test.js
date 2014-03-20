var assert = require('chai').assert;

var Calendar = require('calendar').Calendar;

describe('Calendar', function() {

  it('can create weeks for March 2014', function() {

    var calendar = new Calendar();
    var days = calendar.monthDays(2014, 2);
    var expected = [
      [ 0,  0,  0,  0,  0,  0,  1],
      [ 2,  3,  4,  5,  6,  7,  8],
      [ 9, 10, 11, 12, 13, 14, 15],
      [16, 17, 18, 19, 20, 21, 22],
      [23, 24, 25, 26, 27, 28, 29],
      [30, 31,  0,  0,  0,  0,  0],
    ];

    assert.deepEqual(expected, days);
  });

});