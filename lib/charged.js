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
 * Customers
 */

Charged.prototype.getCustomers =
Charged.prototype.listCustomers = function(callback) {
  return this.get('/customers', callback, 'customer');
};

Charged.prototype.getCustomerById = function(name, callback) {
  return this.get('/customers/' + name, callback, 'customer');
};

Charged.prototype.getCustomerByRef = function(ref, callback) {
  return this.get('/customers/lookup?reference=' + ref, callback, 'customer');
};

Charged.prototype.createCustomer = function(options, callback) {
  return this.post('/customers', options, callback, 'customer');
};

Charged.prototype.updateCustomer = function(name, options, callback) {
  return this.put('/customers/' + name, options, callback, 'customer');
};

Charged.prototype.getCustomerSubscriptions = function(name, callback) {
  return this.get('/customers/' + name + '/subscriptions', callback, 'subscription');
};

/**
 * Subscriptions
 */

Charged.prototype.getSubscriptions =
Charged.prototype.listSubscriptions = function(callback) {
  // XXX unsure of the formatter
  return this.get('/subscriptions', callback, 'subscription');
};

Charged.prototype.createSubscription = function(options, callback) {
  return this.post('/subscriptions', options, callback, 'subscription');
};

Charged.prototype.getSubscription =
Charged.prototype.readSubscription = function(name, callback) {
  return this.get('/subscriptions/' + name, callback, 'subscription');
};

Charged.prototype.updateSubscription = function(name, options, callback) {
  return this.put('/subscriptions/' + name, options, callback, 'subscription');
};

Charged.prototype.cancelSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name;
  return this.delete(path, options, callback, 'subscription');
};

Charged.prototype.reactivateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/reactivate';
  return this.put(path, options, callback, 'subscription');
};

Charged.prototype.migrateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/migrations';
  return this.post(path, options, callback, 'subscription');
};

Charged.prototype.adjustSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/adjustments';
  return this.post(path, options, callback, 'subscription');
};

Charged.prototype.charge =
Charged.prototype.createCharge =
Charged.prototype.chargeSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/charges';
  return this.post(path, options, callback, 'subscription');
};

Charged.prototype.getSubscriptionComponents =
Charged.prototype.listSubscriptionComponents = function(name, callback) {
  var path = '/subscriptions/' + name + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getSubscriptionComponent = function(sub, comp, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp;
  return this.get(path, callback, 'component');
};

Charged.prototype.getSubscriptionUsage =
Charged.prototype.listSubscriptionUsage = function(sub, comp, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp + '/usages';
  return this.get(path, callback);
};

Charged.prototype.getSubscriptionTransactions = function(name, callback) {
  var path = '/subscriptions/' + name + '/transactions';
  return this.get(path, callback, 'transaction');
};

Charged.prototype.getSubscriptionStatements = function(name, callback) {
  var path = '/subscriptions/' + name + '/statements';
  return this.get(path, callback, 'statement');
};

/**
 * Transactions
 */

Charged.prototype.getTransactions = function(name, callback) {
  return this.get('/transactions', callback, 'transaction');
};

/**
 * Products
 */

Charged.prototype.getProductFamilyComponents =
Charged.prototype.listProductFamilyComponents = function(name, callback) {
  // XXX unsure of the formatter
  var path = '/product_families/' + name + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getProducts =
Charged.prototype.listProducts = function(callback) {
  return this.get('/products', callback, 'product');
};

Charged.prototype.getProduct = function(name, callback) {
  return this.get('/products/' + name, callback, 'product');
};

Charged.prototype.getProductByHandle = function(handle, callback) {
  return this.get('/products/handle/' + handle, callback, 'product');
};

/**
 * Request
 */

Charged.prototype.request = function(options, callback) {
  var path = options.path
    , body = options.body
    , method = options.method
    , stream = options.stream
    , format = options.format;

  if (typeof callback !== 'function') {
    callback = function() {};
  }

  if (format) {
    callback = formatter(format, callback);
  }

  options = {
    method: method,
    uri: 'https://'
      + this.apiKey
      + ':x@'
      + this.subdomain
      + '.chargify.com'
      + path,
    json: body
    // ensure json
    // json: body || true
  };

  options.uri = options.uri.replace(/(?=\?|$)/, '.json');

  if (method === 'GET') delete options.json;

  if (stream) return request(options);

  return request(options, function(err, res, body) {
    try {
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
    } catch (e) {
      return callback(e);
    }
    return callback(null, body);
  });
};

Charged.prototype.get = function(path, callback, format) {
  var options = {
    method: 'GET',
    path: path,
    format: format
  };

  return this.request(options, callback);
};

Charged.prototype.post = function(path, body, callback, format) {
  if (typeof body === 'function') {
    callback = body;
    body = null;
  }

  var options = {
    method: 'POST',
    path: path,
    body: body || {},
    format: format
  };

  return this.request(options, callback);
};

Charged.prototype.put = function(path, body, callback, format) {
  if (typeof body === 'function') {
    callback = body;
    body = null;
  }

  var options = {
    method: 'PUT',
    path: path,
    body: body || {},
    format: format
  };

  return this.request(options, callback);
};

Charged.prototype.delete = function(path, body, callback, format) {
  if (typeof body === 'function') {
    callback = body;
    body = null;
  }

  var options = {
    method: 'DELETE',
    path: path,
    body: body || {},
    format: format
  };

  return this.request(options, callback);
};

/**
 * Helpers
 */

function formatter(name, callback) {
  return function(err, result) {
    if (err) return callback(err);
    if (!result) result = {};
    if (Array.isArray(result)) {
      result = result.map(function(item) {
        return item[name];
      });
      return callback(null, result);
    }
    return callback(null, result[name] || result || {});
  };
}

/**
 * Expose
 */

module.exports = Charged;
