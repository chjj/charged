/**
 * Charged (https://github.com/chjj/charged)
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
// chargify.getSubscriptionsByCustomerRef('chjj', function(err, results) {
//   if (err) throw err;
//   console.log(results);
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
  this.smartValidation = options.smartValidation;
  this.debug = options.debug;

  if (!this.subdomain || !this.apiKey) {
    throw new
      Error('Options `subdomain` and `apiKey` are required for Charged.');
  }
}

/**
 * Customers
 * http://docs.chargify.com/api-customers
 */

Charged.prototype.getCustomers =
Charged.prototype.listCustomers = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/customers', options, callback, 'customer');
};

Charged.prototype.getCustomer =
Charged.prototype.getCustomerById = function(name, callback) {
  if (!this._isNumber(name)) {
    return this.getCustomerByRef(name, callback);
  }
  return this.get('/customers/' + escape(name), callback, 'customer');
};

Charged.prototype.getCustomerByRef = function(ref, callback) {
  var path = '/customers/lookup?reference=' + escape(ref);
  return this.get(path, callback, 'customer');
};

Charged.prototype.deleteCustomer =
Charged.prototype.deleteCustomerById = function(name, callback) {
  if (!this._isNumber(name)) {
    return this.deleteCustomerByRef(name, callback);
  }
  return this.delete('/customers/' + escape(name), callback, 'customer');
};

Charged.prototype.deleteCustomerByRef = function(ref, callback) {
  var self = this;
  return this.getCustomerByRef(ref, function(err, customer) {
    if (err) return callback(err);
    return self.deleteCustomer(customer.id, options, callback);
  });
};

Charged.prototype.createCustomer = function(options, callback) {
  return this.post('/customers', options, callback, 'customer');
};

Charged.prototype.updateCustomer =
Charged.prototype.updateCustomerById = function(name, options, callback) {
  if (!this._isNumber(name)) {
    return this.updateCustomerByRef(name, options, callback);
  }
  return this.put('/customers/' + escape(name), options, callback, 'customer');
};

Charged.prototype.updateCustomerByRef = function(ref, options, callback) {
  var self = this;
  return this.getCustomerByRef(ref, function(err, customer) {
    if (err) return callback(err);
    return self.updateCustomer(customer.id, options, callback);
  });
};

/**
 * Subscriptions
 * http://docs.chargify.com/subscriptions-intro
 * http://docs.chargify.com/cancellation
 * http://docs.chargify.com/reactivation
 * http://docs.chargify.com/upgrades-downgrades
 * http://docs.chargify.com/api-subscriptions
 */

Charged.prototype.getSubscriptions =
Charged.prototype.listSubscriptions = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/subscriptions', options, callback, 'subscription');
};

Charged.prototype.createSubscription = function(options, callback) {
  return this.post('/subscriptions', options, callback, 'subscription');
};

Charged.prototype.getSubscription =
Charged.prototype.readSubscription = function(name, callback) {
  return this.get('/subscriptions/' + escape(name), callback, 'subscription');
};

Charged.prototype.updateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name);
  return this.put(path, options, callback, 'subscription');
};

// http://docs.chargify.com/cancellation
Charged.prototype.cancelSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name);
  return this.delete(path, options, callback, 'subscription');
};

// http://docs.chargify.com/reactivation
Charged.prototype.reactivateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name) + '/reactivate';
  return this.put(path, options, callback, 'subscription');
};

Charged.prototype.getCustomerSubscriptions =
Charged.prototype.getSubscriptionsByCustomer =
Charged.prototype.getSubscriptionsByCustomerId = function(customer, callback) {
  if (!this._isNumber(customer)) {
    return this.getSubscriptionsByCustomerRef(customer, callback);
  }
  var path = '/customers/' + escape(customer) + '/subscriptions';
  return this.get(path, callback, 'subscription');
};

Charged.prototype.getSubscriptionsByCustomerRef = function(customer, callback) {
  var self = this;
  return this.getCustomerByRef(customer, function(err, customer) {
    if (err) return callback(err);
    return self.getSubscriptionsByCustomer(customer.id, callback);
  });
};

// http://docs.chargify.com/api-subscriptions
// #api-usage-json-subscriptions-delayed-cancel
Charged.prototype.delayedCancelSubscription = function(id, callback) {
  return this.updateSubscription(id, { cancel_at_end_of_period: 1 }, callback);
};

Charged.prototype.delayedReactivateSubscription = function(id, callback) {
  return this.updateSubscription(id, { cancel_at_end_of_period: 0 }, callback);
};

Charged.prototype.resetSubscriptionBalance = function(name, callback) {
  var path = '/subscriptions/' + escape(name) + '/reset_balance';
  return this.put(path, callback, 'subscription');
};

/**
 * Statements
 * http://docs.chargify.com/statements
 * http://docs.chargify.com/api-statements
 */

Charged.prototype.getSubscriptionStatements = function(name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/' + escape(name) + '/statements';
  return this.get(path, options, callback, 'statement');
};

Charged.prototype.getLatestStatement =
Charged.prototype.getLatestSubscriptionStatement = function(sub, callback) {
  var self = this;

  var opt = {
    _per_page: 100000
    // order: 'oldest_first'
  };

  return this.getSubscriptionStatementIds(sub, opt, function(err, ids) {
    if (err) return callback(err);

    if (!ids.length) {
      return callback(new Error('Not found.'));
    }

    return self.getStatement(ids.pop(), callback);
  });
};

Charged.prototype.getStatement = function(name, callback) {
  var path = '/statements/' + escape(name);
  return this.get(path, callback, 'statement');
};

Charged.prototype.getSubscriptionIds =
Charged.prototype.getSubscriptionStatementIds = function(name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/' + escape(name) + '/statements/ids';
  return this.get(path, options, callback, 'statement_ids');
};

Charged.prototype.getStatementIds = function(name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/statements/ids';
  return this.get(path, options, callback, 'statement_ids');
};

/**
 * Migrations
 * http://docs.chargify.com/upgrades-downgrades
 * http://docs.chargify.com/api-migrations
 */

Charged.prototype.migrateSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name) + '/migrations';
  return this.post(path, options, function(err, result) {
    return err
      ? callback(err)
      : callback(null, result.subscription);
  }, 'migration');
};

Charged.prototype.previewSubscriptionMigration = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name) + '/migrations/preview';
  return this.post(path, options, callback, 'migration');
};

/**
 * Charges
 * http://docs.chargify.com/one-time-charges
 * http://docs.chargify.com/api-charges
 */

Charged.prototype.charge =
Charged.prototype.createCharge =
Charged.prototype.chargeSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name) + '/charges';
  return this.post(path, options, callback, 'charge');
};

/**
 * Adjustments
 * http://docs.chargify.com/adjustments
 * http://docs.chargify.com/api-adjustments
 */

Charged.prototype.adjustSubscription = function(name, options, callback) {
  var path = '/subscriptions/' + escape(name) + '/adjustments';
  return this.post(path, options, callback, 'adjustment');
};

/**
 * Components
 * http://docs.chargify.com/product-components
 * http://docs.chargify.com/api-components
 */

Charged.prototype.getComponents = function(callback) {
  var self = this;
  return this.getProductFamilies(function(err, results) {
    if (err) return callback(err);

    var pending = results.length
      , out = [];

    function next() {
      if (!--pending) callback(null, out);
    }

    results.forEach(function(family) {
      self.getFamilyComponents(family.id, function(err, results) {
        if (err) return next();
        out.push.apply(out, results);
        return next();
      });
    });
  });
};

Charged.prototype._getComponent = function(prop, id, callback) {
  this.getComponents(function(err, results) {
    if (err) return callback(err);

    var l = results.length
      , i = 0;

    for (; i < l; i++) {
      if (results[i][prop] === id) {
        return callback(null, results[i]);
      }
    }

    return callback(new Error('Not found.'));
  });
};

Charged.prototype.getComponent = function(id, callback) {
  if (!this._isNumber(id)) {
    return this.getComponentByName(id, callback);
  }
  return this._getComponent('id', +id, callback);
};

Charged.prototype.getComponentByName = function(id, callback) {
  return this._getComponent('name', id, callback);
};

Charged.prototype.getFamilyComponents =
Charged.prototype.getProductFamilyComponents =
Charged.prototype.listProductFamilyComponents = function(name, callback) {
  if (!callback) {
    callback = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  if (!this._isNumber(name)) {
    return this.getComponentsByFamilyHandle(name, callback);
  }

  var path = '/product_families/' + escape(name) + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getComponentsByProductFamilyHandle =
Charged.prototype.getComponentsByFamilyHandle = function(id, callback) {
  var self = this;
  return this.getFamilyByHandle(id, function(err, family) {
    if (err) return callback(err);
    return self.getFamilyComponents(family.id, callback);
  });
};

Charged.prototype.getProductFamilyComponent =
Charged.prototype.getFamilyComponent = function(name, comp, callback) {
  if (!callback) {
    callback = comp;
    comp = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  if (!this._isNumber(name)) {
    return this.getComponent(comp, callback);
  }

  var path = '/product_families/'
    + escape(name)
    + '/components/'
    + escape(comp);
  return this.get(path, callback, 'component');
};

Charged.prototype.createProductFamilyComponent =
Charged.prototype.createFamilyComponent = function(name, kind, options, callback) {
  var self = this;

  if (!callback) {
    callback = options;
    options = kind;
    kind = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  if (kind !== 'metered_components'
      && kind !== 'quantity_based_components'
      && kind !== 'on_off_components') {
    return callback(new Error('Unsupported component type.'));
  }

  if (!this._isNumber(name)) {
    return this.getFamilyByHandle(name, function(err, family) {
      if (err) return callback(err);
      return self.createFamilyComponent(family.id, kind, options, callback);
    });
  }

  var path = '/product_families/' + escape(name) + '/' + escape(kind);
  return this.post(path, options, callback, 'component');
};

Charged.prototype.getSubscriptionComponents =
Charged.prototype.listSubscriptionComponents = function(name, callback) {
  var path = '/subscriptions/' + escape(name) + '/components';
  return this.get(path, callback, 'component');
};

Charged.prototype.getSubscriptionComponent = function(sub, comp, callback) {
  if (!this._isNumber(comp)) {
    return this.getSubscriptionComponentByName(sub, comp, callback);
  }
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp);
  return this.get(path, callback);
};

Charged.prototype.getSubscriptionComponentByName = function(sub, comp, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    return self.getSubscriptionComponent(sub, component.id, callback);
  });
};

Charged.prototype.updateSubscriptionComponent = function(sub, comp, options, callback) {
  if (!this._isNumber(comp)) {
    return this.updateSubscriptionComponentByName(sub, comp, options, callback);
  }
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp);
  return this.put(path, options, callback);
};

Charged.prototype.updateSubscriptionComponentByName = function(sub, comp, options, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    return self.updateSubscriptionComponent(sub, component.id, options, callback);
  });
};

/**
 * Metered Usage
 * http://docs.chargify.com/api-metered-usage
 */

// {
//   "quantity": 1,
//   "memo": "hello world"
// }

Charged.prototype.getSubscriptionUsage =
Charged.prototype.listSubscriptionUsage = function(sub, comp, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp)
    + '/usages';
  return this.get(path, options, callback, 'usage');
};

Charged.prototype.createSubscriptionUsage =
Charged.prototype.updateSubscriptionUsage = function(sub, comp, options, callback) {
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp)
    + '/usages';
  return this.post(path, options, callback, 'usage');
};

/**
 * Quantity Component Allocations
 * http://docs.chargify.com/setting-component-allocations
 * http://docs.chargify.com/api-quantity-allocations
 */

// {
//   "subscription": {
//     ...
//     "components":[
//       {
//         "component_id": 1,
//         "allocated_quantity": 18
//       }
//     ]
//   }
// }

Charged.prototype.createSubscriptionQuantity = function(options, callback) {
  if (!options.components
      || !options.components.length
      || options.components[0].allocated_quanity == null) {
    return callback(new Error('No quantity.'));
  }
  return this.createSubscription(options, callback);
};

Charged.prototype.updateSubscriptionQuantity = function(sub, options, callback) {
  if (!options.components
      || !options.components.length
      || options.components[0].allocated_quanity == null) {
    return callback(new Error('No quantity.'));
  }
  return this.updateSubscription(sub, options, callback);
};

/**
 * Credits
 * http://docs.chargify.com/api-credits
 */

Charged.prototype.createSubscriptionCredit = function(sub, options, callback) {
  var path = '/subscriptions/' + escape(sub) + '/credits';
  return this.post(path, options, callback, 'credit');
};

/**
 * Refunds
 * http://docs.chargify.com/refunds
 * http://docs.chargify.com/api-refunds
 */

Charged.prototype.createSubscriptionRefund = function(sub, options, callback) {
  var path = '/subscriptions/' + escape(sub) + '/refunds';
  return this.post(path, options, callback, 'refund');
};

/**
 * Events
 * http://docs.chargify.com/api-events
 */

Charged.prototype.getSubscriptionEvents = function(sub, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/' + escape(sub) + '/events';
  return this.get(path, options, callback, 'event');
};

Charged.prototype.getEvents = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/events';
  return this.get(path, options, callback, 'event');
};

/**
 * Coupons
 * http://docs.chargify.com/coupons
 * http://docs.chargify.com/api-coupons
 */

Charged.prototype.createCoupon = function(options, callback) {
  return this.post('/coupons', options, callback, 'coupon');
};

Charged.prototype.getCoupon = function(name, callback) {
  var path = '/coupons/' + escape(name);
  return this.get(path, callback, 'coupon');
};

Charged.prototype.getCoupons = function(name, callback) {
  var path = '/coupons';
  return this.get(path, callback, 'coupon');
};

Charged.prototype.getCouponByCode = function(code, callback) {
  var path = '/coupons/find?code=' + escape(code);
  return this.get(path, callback, 'coupon');
};

Charged.prototype.validateCoupon = function(name, callback) {
  var path = '/coupons/' + escape(name) + '/validate';
  return this.get(path, callback, 'coupon');
};

Charged.prototype.validateCouponByCode = function(name, callback) {
  var path = '/coupons/find/validate?code=' + escape(name);
  return this.get(path, callback, 'coupon');
};

Charged.prototype.updateCoupon = function(name, options, callback) {
  var path = '/coupons/' + escape(name);
  return this.post(path, options, callback, 'coupon');
};

Charged.prototype.deleteCoupon = function(name, callback) {
  var path = '/coupons/' + escape(name);
  return this.delete(path, callback);
};

Charged.prototype.getCouponUsage = function(name, callback) {
  var path = '/coupons/' + escape(name) + '/usage';
  return this.get(path, callback);
};

Charged.prototype.addSubscriptionCoupon = function(sub, name, callback) {
  var path = '/subscriptions/'
    + escape(sub)
    + '/add_coupon?code='
    + escape(name);
  return this.post(path, callback, 'coupon');
};

Charged.prototype.removeSubscriptionCoupon = function(sub, name, callback) {
  var path = '/subscriptions/'
    + escape(sub)
    + '/remove_coupon?code='
    + escape(name);
  return this.delete(path, callback, 'coupon');
};

/**
 * Transactions
 */

Charged.prototype.getTransactions = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/transactions', options, callback, 'transaction');
};

Charged.prototype.getTransaction = function(name, callback) {
  return this.get('/transactions/' + escape(name), callback, 'transaction');
};

Charged.prototype.getSubscriptionTransactions = function(name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/' + escape(name) + '/transactions';
  return this.get(path, options, callback, 'transaction');
};

/**
 * Products
 * http://docs.chargify.com/products-intro
 * http://docs.chargify.com/api-products
 */

Charged.prototype.getProducts =
Charged.prototype.listProducts = function(callback) {
  return this.get('/products', callback, 'product');
};

Charged.prototype.getFamilies =
Charged.prototype.getProductFamilies = function(callback) {
  var path = '/product_families';
  return this.get(path, callback, 'product_family');
};

Charged.prototype._getFamily =
Charged.prototype._getProductFamily = function(prop, id, callback) {
  return this.getProductFamilies(function(err, results) {
    if (err) return callback(err);

    var l = results.length
      , i = 0;

    for (; i < l; i++) {
      if (results[i][prop] === id) {
        return callback(null, results[i]);
      }
    }

    return callback(new Error('Not found.'));
  });
};

Charged.prototype.getFamily =
Charged.prototype.getProductFamily = function(id, callback) {
  if (!this._isNumber(id)) {
    return this.getFamilyByHandle(id, callback);
  }
  return this._getFamily('id', +id, callback);
};

Charged.prototype.getFamilyByHandle =
Charged.prototype.getProductFamilyByHandle = function(id, callback) {
  return this._getFamily('handle', id, callback);
};

Charged.prototype.getFamilyProducts = function(name, callback) {
  if (!callback) {
    callback = name;
    name = this.defaultFamily;
  }

  if (!name) {
    return callback(new Error('No family specified.'));
  }

  if (!this._isNumber(name)) {
    return this.getFamilyProductsByHandle(name, callback);
  }

  var path = '/product_families/' + escape(name) + '/products';
  return this.get(path, callback, 'product');
};

Charged.prototype.getFamilyProductsByHandle = function(id, callback) {
  var self = this;
  return this.getFamilyByHandle(id, function(err, family) {
    if (err) return callback(err);
    return self.getFamilyProducts(family.id, callback);
  });
};

Charged.prototype.getProduct = function(id, callback) {
  if (!this._isNumber(id)) {
    return this.getProductByHandle(id, callback);
  }
  return this.get('/products/' + escape(id), callback, 'product');
};

Charged.prototype.getProductByHandle = function(handle, callback) {
  return this.get('/products/handle/' + escape(handle), callback, 'product');
};

Charged.prototype.createProduct = function(options, callback) {
  return this.post('/products', options, callback, 'product');
};

/**
 * Stats
 * http://docs.chargify.com/api-stats
 */

Charged.prototype.getStats = function(callback) {
  return this.get('/stats', callback);
};

/**
 * Webhooks
 * http://docs.chargify.com/webhooks
 * http://docs.chargify.com/api-webhooks
 */

// options: {
//   status: 'successful',
//   page: 1,
//   per_page: 20,
//   since_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//                       .toISOString().split('T')[0],
//   until_date: new Date().toISOString().split('T')[0],
//   order: 'newest_first'
// }

Charged.prototype.getWebhooks = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  return this.get('/webhooks', options, callback, 'webhook');
};

Charged.prototype.resendWebhooks = function(options, callback) {
  options = { ids: options };
  return this.post('/webhooks/replay', options, callback, 'webhook');
};

Charged.prototype.getWebhook = function(id, callback) {
  return this.getWebhooks({ per_page: 200 }, function(err, hooks) {
    if (err) return callback(err);

    var i = hooks.length
      , hook;

    while (i--) {
      hook = hooks[i];
      if (hook.id === +id) {
        return callback(null, hook);
      }
    }

    return callback(new Error('Not found.'));
  });
};

/**
 * Validation
 */

Charged.prototype._isNumber = function(id) {
  if (!this.smartValidation) return true;
  return /^\d+$/.test(id);
};

/**
 * Request
 */

Charged.prototype.request = function(options, callback) {
  var self = this
    , path = options.path
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
    json: body
  };

  options.uri = options.uri.replace(/(?=\?|$)/, '.json');

  if (method === 'GET') delete options.json;

  if (stream) return request(options);

  return request(options, function(err, res, body) {
    if (err) {
      err = 'No response from chargify'
          + (err.code ? ': ' + err.code : '.');
      return callback(new Error(err));
    }

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
      if (self.debug) {
        e.message += '\nStatus code: ' + res.statusCode + '.';
        e.message += '\nJSON: ' + body;
        return callback(e);
      }
      return callback(new Error(
        'Status code: ' + res.statusCode + '.'
        + ' The JSON returned from chargify'
        + ' is failing to parse.'
        + ' Chargify may be having a problem.'));
    }

    if (!body) {
      return callback(new Error('No body.'));
    }

    if (body.errors) {
      return callback(new Error(body.errors.join('\n')));
    }

    return callback(null, body);
  });
};

Charged.prototype.get = function(path, query, callback, format) {
  var self = this;

  if (typeof query === 'function') {
    format = callback;
    callback = query;
    query = null;
  }

  query = query || {};

  if (query.per_page > 50 && query.page == null) {
    // console.error('per_page detected for large number of results.');
    // console.error('Please use query.max instead.');
    query.max = query.per_page;
    delete query.per_page;
  }

  if (query.max) {
    return this._page(path, query, callback, format);
  }

  if (query.concurrency) {
    delete query.concurrency;
  }

  if (query._per_page) {
    query.per_page = query._per_page;
    delete query._per_page;
  }

  if (Object.keys(query).length) {
    query = qs.stringify(query);
    path += ~path.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  var options = {
    method: 'GET',
    path: path,
    format: format
  };

  return this.request(options, callback);
};

Charged.prototype._page = function(path, query, callback, format) {
  var self = this
    , max = query.max
    , concurrency = 1
    , pending = 0
    , out = [];

  delete query.max;

  if (query.concurrency) {
    concurrency = query.concurrency;
    delete query.concurrency;
  }

  if (concurrency > Charged.concurrencyLimit) {
    concurrency = Charged.concurrencyLimit;
  }

  if (!(concurrency > 0) || !isFinite(concurrency)) {
    concurrency = 1;
  }

  query.page = 0;
  query.per_page = max;

  function cb(err) {
    if (cb.done) return;

    if (err) {
      cb.done = true;
      return callback(err);
    }

    // If `out` is maxed, execute callback even
    // if there are still requests pending.
    if (pending && out.length < max) {
      return;
    }

    cb.done = true;
    return callback(null, out);
  }

  function page() {
    query.page++;
    pending++;
    return self.get(path, query, function(err, results) {
      pending--;

      if (err) return cb(err);

      if (!results.length) {
        return cb();
      }

      out.push.apply(out, results);

      if (out.length >= max) {
        out = out.slice(0, max);
        return cb();
      }

      if (!pending) return next();
    }, format);
  }

  function next() {
    var i = concurrency;
    while (i--) page();
  }

  return next();
};

Charged.prototype.post = function(path, body, callback, format) {
  if (typeof body === 'function') {
    format = callback;
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
    format = callback;
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
    format = callback;
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
 * Hosted Pages
 * http://docs.chargify.com/hosted-page-settings
 * http://docs.chargify.com/hosted-page-integration
 */

// Generate hosted page URL
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
    + escape(shortname)
    + '/'
    + escape(id)
    + '/'
    + escape(token);
};

Charged.prototype.signupPage = function(product) {
  return 'https://'
    + this.subdomain
    + '.chargify.com/h/'
    + escape(product)
    + '/subscriptions/new';
};

/**
 * Limits per-page
 * null == undocumented/non-existent
 */

Charged.concurrencyLimit = 10;

Charged.limits = {
  'subscription': 200, // Default: 20
  'component': null, // Default: ? - Does not accept per_page, (maybe) only page.
  'customer': 50, // Default: 50 - Does not accept per_page, only page.
  'statement_ids': Infinity, // Default: 10000
  'statement': null, // Default: ?
  'event': 200, // Default: 20
  'coupon': null, // Default: ?
  'transaction': 200, // Default: 20
  'product_family': null, // Default: ? - Does not accept per_page, or (maybe) page.
  'product': null, // Default: ? - Does not accept per_page, or (maybe) page.
  'webhook': Infinity // Default: 20
};

/**
 * Resources
 */

Charged.resources = [
  'customer',
  'subscription',
  'statement',
  'statement_ids',
  'migration',
  'adjustment',
  'component',
  'usage',
  'credit',
  'refund',
  'coupon',
  'transaction',
  'product',
  'product_family',
  'webhook',
  'errors'
];

/**
 * Webhooks
 * http://docs.chargify.com/webhooks
 */

// var hooks = require('charged').hooks;
//
// hooks = hooks(server, {
//   siteKey: 'foo',
//   getUser: function(data, callback) {
//     return callback(null, { username: data.username });
//   }
// });
//
// hooks.set('get-user', function() {});
// hooks.user(function() {});
// hooks.on('signup-success', function(user, payload, callback) {
// });

var hooks = Charged.hooks = HookServer;
function HookServer(server, options) {
  if (!(this instanceof HookServer)) {
    return new HookServer(server, options);
  }

  var self = this;

  EventEmitter.call(this);

  this.server = server;
  this.options = options;

  options._callback = options.callback || function() {};
  options.callback = function(event, payload) {
    self.emit(event, payload);
    self.emit(event.replace(/_/g, '-'), payload);
    self.emit(event.replace(/_/g, ' '), payload);
    options._callback(event, payload);
  };

  // Listeners changed:
  // https://github.com/joyent/node/pull/5362
  // https://github.com/joyent/node/issues/3442
  // https://github.com/joyent/node/commit/20e12e4

  var handler = hooks.middleware(options)
    , listeners = (server.listeners('request'), server._events.request)
    , original = listeners.shift();

  listeners.unshift(function(req, res) {
    if (!req.headers['x-chargify-webhook-signature']) {
      return original(req, res);
    }
    return handler(req, res, function(err) {
      return original(req, res);
    });
  });
};

HookServer.prototype.__proto__ = EventEmitter.prototype;

//
// Hooks
// All hook payloads' subscriptions are OUTPUT objects.
//
hooks.hooks = {
  //
  // Any successful signup (Subscription created) via the API,
  // admin UI, or hosted pages.
  //
  'signup_success': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // Any failed signup (Subscription failed to begin) via the
  // API, admin UI, or hosted pages.
  //
  'signup_failure': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // A successful periodic renewal.
  //
  'renewal_success': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // A failed periodic renewal, i.e. the credit card
  // is declined.
  //
  'renewal_failure': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // Any successful payment against a credit
  // card.
  //
  'payment_success': function (user, payload, callback) {
    var subscription = payload.subscription,
        transaction = payload.transaction;
    return callback();
  },

  //
  // Any failed payment attempt against a
  // credit card.
  //
  'payment_failure': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // Any change to the billing date that is initiated
  // explicitly by altering the billing date via the
  // admin UI or the API. This will not be triggered
  // upon a normal renewal and period advancement, or
  // a migration.
  //
  'billing_date_change': function (user, payload, callback) {
    var subscription = payload.subscription;
    return callback();
  },

  //
  // Any change to the Subscription state. This is the
  // "workhorse" of the events - watching this event
  // can tell you if a Subscription ever moves to a
  // "bad" state, i.e. past_due.
  // States (http://docs.chargify.com/subscription-states):
  //
  'subscription_state_change': function (user, payload, callback) {
    var subscription = payload.subscription;
  },

  //
  // A successful change from an old product to a new
  // product within the users Subscription.
  //
  'subscription_product_change': function (user, payload, callback) {
    var subscription = payload.subscription,
        previous_product = payload.previous_product;
    return callback();
  },

  //
  // A periodic event sent by Chargify.
  // NOTE: The expiring_card webhook is sent on the 1st, 15th and 7 days
  // before the end of the month. This will identify all cards expiring
  // in the next month.
  //
  'expiring_card': function (user, payload, callback) {
    // Card is expiring next month, wait for renewal
    // failure to cancel subscription.
    var subscription = payload.subscription;
    return callback();
  },

  //
  // Any change to the following customer fields:
  // first_name, last_name, organization, email,
  // reference, address, address 2, city, state,
  // zip, country, phone.
  //
  'customer_update': function (user, payload, callback) {
    var subscription = payload.subscription,
        customer = payload.customer;
    return callback();
  },

  //
  // Any change to a subscription’s quantity-based
  // component allocation or enabled status of an
  // on/off component.
  //
  // previous_allocation and new_allocation give
  // the allocation values before and after the
  // change. These will be either 0 or 1 for
  // On/Off Components to represent off and on,
  // respectively.
  //
  // timestamp provides the date and time the
  // allocation was recorded and is listed in
  // ISO8601 format in the UTC timezone.
  //
  'component_allocation_change': function (user, payload, callback) {
    var subscription = payload.subscription,
        product = payload.product,
        component = payload.component,
        new_allocation = payload.new_allocation,
        previous_allocation = payload.previous_allocation,
        memo = payload.memo,
        timestamp = payload.timestamp;

    return callback();
  },

  //
  // Any reported usage for a subscription’s
  // metered components.
  //
  // This webhook will not fire when the unit
  // balance is reset to 0 at the time of renewal.
  //
  // timestamp provides the date and time the usage
  // was recorded and is listed in ISO8601 format
  // in the UTC timezone.
  //
  'metered_usage': function (user, payload, callback) {
    var subscription = payload.subscription,
        product = payload.product,
        component = payload.component,
        usage_quantity = payload.usage_quantity,
        previous_unit_balance = payload.previous_unit_balance,
        new_unit_balance = payload.new_unit_balance,
        memo = payload.memo,
        timestamp = payload.timestamp;

    return callback();
  },

  //
  // The chargify test webhook.
  //
  'test': function (payload, callback) {
    var data = payload.chargify;

    if (data !== 'testing') {
      return callback(new Error('Bad payload.'));
    }

    return callback();
  }
};

//
// Emit Hooked Event
//
hooks.emit = function (event, payload, getUser, callback) {
  var listener = this.hooks[event],
      data = {},
      user;

  getUser = getUser || function(data, callback) {
    return callback(null, { username: data.username });
  };

  //
  // Check event
  //
  if (!this.hooks.hasOwnProperty(event)) {
    return callback(new Error('Bad event.'));
  }

  //
  // Check site
  //
  if (payload.site) {
    if (payload.site.subdomain !== billing.subdomain) {
      return callback(new Error('Wrong site.'));
    }
  }

  //
  // Extract data
  //
  if (payload.subscription) {
    data.subscription = payload.subscription.id;
    data.state = payload.subscription.state;
    if (payload.subscription.customer) {
      data.customer = payload.subscription.customer.id;
      data.username = payload.subscription.customer.reference;
    }
    if (payload.subscription.product) {
      data.plan = payload.subscription.product.handle;
    }
  }

  if (payload.transaction) {
    data.transaction = payload.transaction.id;
    data.subscription = payload.transaction.subscription_id;
    data.amount = '$' + (payload.transaction.amount_in_cents / 100).toFixed(2);
    data.memo = payload.transaction.memo || '';
  }

  if (payload.customer) {
    data.customer = payload.customer.id;
    data.username = payload.customer.reference;
  }

  if (payload.product) {
    data.plan = payload.product.handle;
  }

  if (payload.previous_product) {
    data.previous = payload.previous_product.handle;
  }

  if (payload.component) {
    data.component = payload.component.name;
    if (payload.new_allocation) {
      data.allocated = payload.new_allocation;
      data.previous = payload.previous_allocation;
    } else if (payload.new_unit_balance) {
      data.balance = payload.new_unit_balance;
      data.previous = payload.previous_unit_balance;
    }
  }

  //
  // Add a timestamp
  //
  data.time = payload.timestamp || new Date().toISOString();

  //
  // Find user
  //
  return getUser(data, callback);

  //
  // Execute Listener
  //
  function done(user) {
    try {
      if (!user) {
        if (listener.length === 3) {
          return callback(new Error('No user associated with payload.'));
        }
        return listener(payload, callback);
      }
      return listener(user, payload, callback)
    } catch (e) {
      return callback(e);
    }
  }

  //
  // Find user
  //
  return getUser(data, function (err, user) {
    return err
      ? callback(err)
      : done(user);
  });
};

hooks.middleware = function(options) {
  options = options || {};

  if (!options.siteKey) {
    throw new Error('Site key is required for charged webhook middleware.');
  }

  if (!options.callback) {
    throw new Error('Callback is required for charged webhook middleware.');
  }

  return function(req, res, next) {
    if (!req.headers['x-chargify-webhook-signature']
        || req.headers['content-type'] !== 'application/x-www-form-urlencoded'
        || req.method !== 'POST') {
      return next();
    }

    function send(code, data) {
      data = data ? JSON.stringify(data) : '';
      try {
        res.writeHead(code || 200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(data),
          'Accept': 'application/x-www-form-urlencoded;q=0.9'
        });
        return res.end(data);
      } catch (e) {
        ;
      }
    }

    var rawBody = '';

    req.setEncoding('utf8');

    req.on('data', function(data) {
      rawBody += data;
    });

    req.on('error', function() {
      return send(500);
    });

    req.on('end', function() {
      try {
        req.body = hooks._parse(rawBody);
      } catch (e) {
        return send(500);
      }

      if (!req.body || !rawBody || !req.body.payload) {
        return send(400, { error: 'No body.' });
      }

      var id = +req.body.id
        , event = req.body.event
        , payload = req.body.payload;

      var signature = req.headers['x-chargify-webhook-signature']
        , expected = md5(options.siteKey + rawBody);

      if (signature !== expected) {
        return send(403, { error: 'Bad signature.' });
      }

      hooks.emit(event, payload, options.getUser, function(err, user) {
        if (err) return;
        return options.callback(user, event, payload);
      });

      return send();
    });
  });
};

//
// Nested QS Parser
// From: Parted, Copyright (c) 2011-2012, Christopher Jeffrey
// https://github.com/chjj/parted
//
hooks._parse = function(str, del, eq) {
  if (!str) return {};

  var out = {}
    , s = str.split(del || '&')
    , l = s.length
    , i = 0
    , $;

  for (; i < l; i++) {
    $ = s[i].split(eq || '=');
    if ($[0]) {
      $[0] = hooks._parse.unescape($[0]);
      $[1] = $[1] ? hooks._parse.unescape($[1]) : '';
      hooks._parse.set(out, $[0], $[1]);
    }
  }

  return out;
};

hooks._parse.set = function(parts, field, part) {
  var obj = parts
    , name = field.split('[')
    , field = name[0]
    , l = name.length
    , i = 1
    , key;

  for (; i < l; i++) {
    key = name[i].slice(0, -1);

    if (!obj[field]) {
      obj[field] = /^$|^\d+$/.test(key)
        ? []
        : {};
    }

    obj = obj[field];

    field = !key && Array.isArray(obj)
      ? obj.length
      : key;
  }

  if (Array.isArray(obj[field])) {
    obj[field].push(part);
  } else if (obj[field]) {
    obj[field] = [obj[field], part];
  } else {
    obj[field] = part;
  }
};

hooks._parse.unescape = function(str) {
  try {
    str = decodeURIComponent(str).replace(/\+/g, ' ');
  } finally {
    return str.replace(/\0/g, '');
  }
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

function md5(data) {
  return require('crypto')
    .createHash('md5')
    .update(data)
    .digest('hex');
}

function escape(str) {
  var type = typeof str;

  try {
    if ((type === 'string' && str.length)
        || (type === 'number' && isFinite(str))) {
      return encodeURIComponent(str + '');
    }
  } catch (e) {
    ;
  }

  throw new
    Error('Bad chargify parameter.');
}

/**
 * Wrap methods with try/catch
 */

Object.keys(Charged.prototype).forEach(function(key) {
  var method = Charged.prototype[key];
  if (typeof method !== 'function') return;
  Charged.prototype[key] = function() {
    var callback = arguments[arguments.length-1];
    try {
      return method.apply(this, arguments);
    } catch (e) {
      if (typeof callback === 'function') {
        return callback(e);
      } else {
        throw e;
      }
    }
  };
});

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
