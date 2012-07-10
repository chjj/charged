/**
 * Mock
 */

var Charged = require('../');

/**
 * Mock Data
 */

var _customer = {
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

var _subscription = {
  id: 1,
  reference: 'foo',
  customer: _customer,
  credit_card: _customer
};

var _product = {
  id: 1,
  name: 'nodejitsu'
};

var _component = {
  name: 'foo'
};

/**
 * Request
 */

Charged.prototype.request = function(options, callback) {
  var result;

  switch (options.format) {
    case 'customer':
      result = _customer;
      break;
    case 'subscription':
      result = _subscription;
      break;
    case 'product':
      result = _product;
      break;
    case 'component':
      result = _component;
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
 * Expose
 */

module.exports = Charged;
