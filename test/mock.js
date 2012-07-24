/**
 * Mock
 */

var Charged = require('../');

/**
 * Mock
 */

function Mock() {
  Charged.apply(this, arguments);
}

Mock.prototype.__proto__ = Charged.prototype;

/**
 * Mock Data
 */

var data = Mock.data = {};

data.customer = {
  id: 1,
  reference: 'foo',
  first_name: 'Foo',
  last_name: 'Bar',
  full_number: '5424000000000015',
  expiration_month: 5,
  expiration_year: '2020',
  cvv: '000',
  billing_address: 'foobar',
  billing_city: 'foobar',
  billing_state: 'foobar',
  billing_zip: '00000',
  billing_country: 'foobar',
  last_four: '0015',
  card_type: 'foo'
};

data.subscription = {
  id: 1,
  reference: 'foo',
  customer: data.customer,
  credit_card: data.customer
};

data.product = {
  id: 1,
  name: 'nodejitsu'
};

data.component = {
  name: 'foo'
};

/**
 * Request
 */

Mock.prototype.request = function(options, callback) {
  var result;

  switch (options.format) {
    case 'customer':
    case 'subscription':
    case 'product':
    case 'component':
      result = clone(Mock.data[options.format]);
      break;
    default:
      result = {};
      break;
  }

  switch (options.path) {
    case '/products':
    // etc
      result = [result];
      break;
  }

  return callback(null, result);
};

/**
 * Bind
 */

Mock.__defineGetter__('bind', function() {
  Charged.prototype.request = Mock.prototype.request;
  return Charged;
});

/**
 * Helpers
 */

function clone(obj) {
  var out = {};
  Object.keys(obj || {}).forEach(function(key) {
    out[key] = obj[key];
  });
  return out;
}

/**
 * Expose
 */

module.exports = Mock;
