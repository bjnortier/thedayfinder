var assert = require('chai').assert;

var shortenName = require('../../src/shortenname');

describe('Short Names', function() {

  it('can shorten a name', function() {

    assert.throws(function() {
      shortenName('');
    }, Error);

    assert.equal(shortenName('B'), 'B');
    assert.equal(shortenName('Ben'), 'Be');
    assert.equal(shortenName('Ben Nortier'), 'BN');
    assert.equal(shortenName('Ben James Nortier'), 'BN');

  });

});