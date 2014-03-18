var assert = require('chai').assert;

var foo = require('../../src/foo.js');

describe('Foo', function() {

  it('can do bar', function() {
    assert.equal(foo.bar(), 42);
  });

});