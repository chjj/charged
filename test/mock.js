/**
 * Charged
 * High-level Chargify API Binding
 * Copyright (c) 2012, Christopher Jeffrey
 */

// http://docs.chargify.com/api-integration
// http://docs.chargify.com/api-resources
// http://docs.chargify.com/api-subscriptions
// http://docs.chargify.com/subscriptions-intro
// http://docs.chargify.com/api-subscriptions

// EXAMPLE USAGE:
// var charge = new Charged({
//   product: 'monthly-chili-cheese-fries',
//   key: 'ad3rt4302ebdd'
// });
// charge.readSubscription('chjj', function(err, result) {
//   if (err) throw err;
//   console.log(result);
// });
// var options = { memo: 'bill', amount_in_cents: 100 };
// charge.charge('chjj', options, function(err, result) {
//   if (err) throw err;
//   console.log(result);
// });

var request = require('request');

function Charged(options) {
  if (!(this instanceof Charged)) {
    return new Charged(options);
  }

  this.subdomain = options.subdomain || options.product || options.name;
  this.apiKey = options.key || options.apiKey;

  if (!this.subdomain || !this.apiKey) {
    throw new
      Error('Options `subdomain` and `apiKey` are required for Charged.');
  }
}

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
 * Customers
 */

Charged.prototype.getCustomers =
Charged.prototype.listCustomers = function(callback) {
  return callback(null, [_customer]);
};

Charged.prototype.getCustomerById = function(name, callback) {
  return callback(null, _customer);
};

Charged.prototype.getCustomerByRef = function(ref, callback) {
  return callback(null, _customer);
};

Charged.prototype.deleteCustomerById = function(name, callback) {
  return callback(null, _customer);
};

Charged.prototype.deleteCustomerByRef = function(ref, callback) {
  return callback(null, _customer);
};

Charged.prototype.createCustomer = function(options, callback) {
  return (callback || options)(null, _customer);
};

Charged.prototype.updateCustomer = function(name, options, callback) {
  return (callback || options)(null, _customer);
};

Charged.prototype.updateCustomerByRef = function(ref, options, callback) {
  return (callback || options)(null, _customer);
};

Charged.prototype.getCustomerSubscriptions = function(name, callback) {
  return callback(null, [_subscription]);
};

/**
 * Subscriptions
 */

Charged.prototype.getSubscriptions =
Charged.prototype.listSubscriptions = function(callback) {
  // XXX unsure of the formatter
  return callback(null, [_subscription]);
};

Charged.prototype.createSubscription = function(options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.getSubscription =
Charged.prototype.readSubscription = function(name, callback) {
  return callback(null, _subscription);
};

// XXX This is probably slow.
Charged.prototype.getSubscriptionByRef = function(name, callback) {
  return callback(null, _subscription);
};

Charged.prototype.updateSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.cancelSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.reactivateSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.migrateSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.adjustSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.charge =
Charged.prototype.createCharge =
Charged.prototype.chargeSubscription = function(name, options, callback) {
  return (callback || options)(null, _subscription);
};

Charged.prototype.getSubscriptionComponents =
Charged.prototype.listSubscriptionComponents = function(name, callback) {
  return callback(null, [_component]);
};

Charged.prototype.getSubscriptionComponent = function(sub, comp, callback) {
  return callback(null, _component);
};

Charged.prototype.getSubscriptionUsage =
Charged.prototype.listSubscriptionUsage = function(sub, comp, callback) {
  return callback(null, {});
};

Charged.prototype.getSubscriptionTransactions = function(name, callback) {
  return callback(null, [_transaction]);
};

Charged.prototype.getSubscriptionStatements = function(name, callback) {
  return callback(null, [_statement]);
};

/**
 * Transactions
 */

Charged.prototype.getTransactions = function(name, callback) {
  return callback(null, [_transaction]);
};

/**
 * Products
 */

Charged.prototype.getProductFamilyComponents =
Charged.prototype.listProductFamilyComponents = function(name, callback) {
  // XXX unsure of the formatter
  return callback(null, [_component]);
};

Charged.prototype.getProducts =
Charged.prototype.listProducts = function(callback) {
  return callback(null, [_product]);
};

Charged.prototype.getProduct = function(name, callback) {
  return callback(null, _product);
};

Charged.prototype.getProductByHandle = function(handle, callback) {
  return callback(null, _product);
};

/**
 * Request
 */

Charged.prototype.request =
Charged.prototype.get =
Charged.prototype.put =
Charged.prototype.post =
Charged.prototype.delete = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[args.length-1] === 'string') {
    var type = args.pop();
  }
  var result;
  switch (type) {
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
  return callback(null, result);
};

/**
 * Expose
 */

module.exports = Charged;
