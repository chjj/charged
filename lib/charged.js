/**
 * Charged
 * High-level Chargify API Binding
 * Copyright (c) 2012, Christopher Jeffrey
 */

// Chargify API Documentation:
// http://docs.chargify.com/api-integration
// http://docs.chargify.com/api-resources
// http://docs.chargify.com/api-subscriptions
// http://docs.chargify.com/subscriptions-intro
// http://docs.chargify.com/api-subscriptions

// Example Usage:
// var chargify = new Charged({
//   subdomain: 'monthly-chili-cheese-fries',
//   apiKey: 'ad3rt4302ebdd'
// });
//
// chargify.getCustomerByRef('chjj', function(err, customer) {
//   if (err) throw err;
//   console.log(customer);
// });

/**
 * Modules
 */

var request = require('request')
  , qs = require('querystring');

/**
 * Charged
 */

function Charged(options) {
  if (!(this instanceof Charged)) {
    return new Charged(options);
  }

  this.subdomain = options.subdomain || options.product || options.name;
  this.apiKey = options.key || options.apiKey;
  this.siteKey = options.siteKey;
  this.defaultFamily = options.family || options.defaultFamily;

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

Charged.prototype.getCustomer =
Charged.prototype.getCustomerById = function(name, callback) {
  return this.get('/customers/' + name, callback, 'customer');
};

Charged.prototype.getCustomerByRef = function(ref, callback) {
  return this.get('/customers/lookup?reference=' + ref, callback, 'customer');
};

Charged.prototype.deleteCustomer =
Charged.prototype.deleteCustomerById = function(name, callback) {
  return this.delete('/customers/' + name, callback, 'customer');
};

Charged.prototype.deleteCustomerByRef = function(ref, callback) {
  return this.delete('/customers/lookup?reference=' + ref, callback, 'customer');
};

Charged.prototype.createCustomer = function(options, callback) {
  return this.post('/customers', options, callback, 'customer');
};

Charged.prototype.updateCustomer =
Charged.prototype.updateCustomerById = function(name, options, callback) {
  return this.put('/customers/' + name, options, callback, 'customer');
};

Charged.prototype.updateCustomerByRef = function(ref, options, callback) {
  return this.put('/customers/lookup?reference=' + ref, options, callback, 'customer');
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

Charged.prototype.getSubscriptionTransactions = function(name, callback) {
  var path = '/subscriptions/' + name + '/transactions';
  return this.get(path, callback, 'transaction');
};

Charged.prototype.getSubscriptionStatements = function(name, callback) {
  var path = '/subscriptions/' + name + '/statements';
  return this.get(path, callback, 'statement');
};

/**
 * Migrations
 */

Charged.prototype.migrateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/migrations';
  return this.post(path, options, callback, 'migration');
};

Charged.prototype.previewSubscriptionMigration = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/migrations/preview';
  return this.post(path, options, callback, 'migration');
};

/**
 * Charges
 */

Charged.prototype.charge =
Charged.prototype.createCharge =
Charged.prototype.chargeSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/charges';
  return this.post(path, options, callback, 'subscription');
};

/**
 * Adjustments
 */

Charged.prototype.adjustSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + name + '/adjustments';
  return this.post(path, options, callback, 'adjustment');
};

/**
 * Components
 */

// Resources:
// http://docs.chargify.com/api-components
// http://docs.chargify.com/api-metered-usage
// http://docs.chargify.com/api-quantity-allocations

Charged.prototype.getProductFamilyComponents =
Charged.prototype.listProductFamilyComponents = function(name, callback) {
  if (!callback) {
    callback = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  var path = '/product_families/' + name + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getComponentDefinition = function(name, comp, callback) {
  if (!callback) {
    callback = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  var path = '/product_families/' + name + '/components/' + comp;
  return this.get(path, callback, 'component');
};

Charged.prototype.createComponentDefinition = function(name, comp, options, callback) {
  if (!callback) {
    callback = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  var path = '/product_families/' + name + '/' + comp;
  return this.post(path, options, callback, 'component');
};

Charged.prototype.getSubscriptionComponents =
Charged.prototype.listSubscriptionComponents = function(name, callback) {
  var path = '/subscriptions/' + name + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getSubscriptionComponent = function(sub, comp, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp;
  return this.get(path, callback);
};

Charged.prototype.updateSubscriptionComponent = function(sub, comp, options, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp;
  return this.put(path, options, callback);
};

/**
 * Metered Usage
 */

Charged.prototype.getSubscriptionUsage =
Charged.prototype.listSubscriptionUsage = function(sub, comp, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp + '/usages';
  return this.get(path, callback, 'usage');
};

Charged.prototype.createSubscriptionUsage =
Charged.prototype.updateSubscriptionUsage = function(sub, comp, options, callback) {
  var path = '/subscriptions/' + sub + '/components/' + comp + '/usages';
  return this.post(path, options, callback, 'usage');
};

/**
 * Credits
 */

Charged.prototype.createCredit = function(sub, options, callback) {
  var path = '/subscriptions/' + sub + '/credits';
  return this.post(path, options, callback, 'credit');
};

/**
 * Events
 */

Charged.prototype.getSubscriptionEvents = function(sub, options, callback) {
  if (!callback) {
    callback = options;
    options = '';
  }

  if (options) {
    options = '?=' + qs.stringify(options);
  }

  var path = '/subscriptions/' + sub + '/events' + options;
  return this.get(path, callback);
};

Charged.prototype.getEvents = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  if (options) {
    options = '?=' + qs.stringify(options);
  }

  var path = '/events' + options;
  return this.get(path, callback);
};

/**
 * Coupons
 */

// Resources:
// http://docs.chargify.com/api-coupons

Charged.prototype.createCoupon = function(name, options, callback) {
  return this.post('/coupons', options, callback, 'coupon');
};

Charged.prototype.getCoupon = function(name, callback) {
  var path = '/coupons/' + name;
  return this.get(path, callback, 'coupon');
};

Charged.prototype.getCouponByCode = function(code, callback) {
  var path = '/coupons/find?code=' + code;
  return this.get(path, callback, 'coupon');
};

Charged.prototype.validateCoupon = function(name, callback) {
  var path = '/coupons/' + name + '/validate?coupon_id=' + name;
  return this.get(path, callback, 'coupon');
};

Charged.prototype.validateCouponByCode = function(name, callback) {
  var path = '/coupons/' + name + '/validate?coupon_code=' + name;
  return this.get(path, callback, 'coupon');
};

Charged.prototype.updateCoupon = function(name, options, callback) {
  var path = '/coupons/' + name;
  return this.post(path, options, callback, 'coupon');
};

Charged.prototype.deleteCoupon = function(name, options, callback) {
  var path = '/coupons/' + name;
  return this.delete(path, callback);
};

Charged.prototype.getCouponUsage = function(name, callback) {
  var path = '/coupons/' + name + '/usage';
  return this.get(path, callback);
};

Charged.prototype.addSubscriptionCoupon = function(sub, name, callback) {
  var path = '/subscriptions/' + sub + '/add_coupon?code=' + name;
  return this.post(path, callback, 'coupon');
};

Charged.prototype.removeSubscriptionCoupon = function(sub, name, callback) {
  var path = '/subscriptions/' + sub + '/remove_coupon?code=' + name;
  return this.delete(path, callback, 'coupon');
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
 * Misc
 */

Charged.prototype.getStats = function(name, options, callback) {
  return this.get('/stats', callback);
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
    if (body) {
      var obj = {};
      obj[format] = body;
      body = obj;
    }
  }

  options = {
    method: method,
    uri: 'https://'
      + this.apiKey
      + ':x@'
      + this.subdomain
      + '.chargify.com'
      + path,
    json: body // || true
  };

  options.uri = options.uri.replace(/(?=\?|$)/, '.json');

  if (method === 'GET') delete options.json;

  if (stream) return request(options);

  return request(options, function(err, res, body) {
    if (res.statusCode === 403) {
      return callback(new Error('Not supported.'));
    }

    if (res.statusCode === 404) {
      return callback(new Error('Not found.'));
    }

    try {
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
    } catch (e) {
      e.message += '\nJSON: "' + body + '"';
      return callback(e);
    }

    if (body.errors) {
      return callback(new Error(body.errors.join('\n')));
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
 * Host Pages
 */

// Generate hosted page URL
// http://docs.chargify.com/hosted-page-integration
// http://docs.chargify.com/hosted-page-settings
Charged.prototype.hostedPage = function(shortname, id) {
  if (!id) {
    id = shortname;
    shortname = 'update_payment';
  }

  var message = shortname + '--' + id + '--' + this.siteKey
    , token = sha1(message).slice(0, 10);

  return 'https://'
    + this.subdomain
    + '.chargify.com/'
    + shortname
    + '/'
    + id
    + '/'
    + token;
};

Charged.prototype.signupPage = function(product) {
  return 'https://'
    + this.subdomain
    + '.chargify.com/h/'
    + product
    + '/subscriptions/new';
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
    return callback(null, result[name] || result);
  };
}

function sha1(data) {
  return require('crypto')
    .createHash('sha1')
    .update(data)
    .digest('hex');
}

/**
 * Mock
 */

Charged.__defineGetter__('mock', function() {
  return require(__dirname + '/../test/mock');
});

/**
 * Expose
 */

module.exports = Charged;
