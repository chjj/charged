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

  this.options = options;
  this.subdomain = options.subdomain || options.product || options.name;
  this.apiKey = options.key || options.apiKey;
  this.siteKey = options.siteKey;
  this.defaultFamily = options.family || options.defaultFamily;
  this.smartValidation = options.smartValidation;
  this.cacheSchemas = options.cacheSchemas;
  this.debug = options.debug;

  if (this.cacheSchemas) {
    this._cache = {
      components: {},
      products: {}
    };
  }

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
  return this.getComponents(function(err, results) {
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

Charged.prototype.getComponentByName = function(name, callback) {
  var self = this;

  if (this._cache) {
    if (this._cache.components[name] != null) {
      return callback(null, this._cache.components[name]);
    }
  }

  return this._getComponent('name', name, function(err, component) {
    if (err) return callback(err);

    if (self._cache) {
      self._cache.components[name] = component;
    }

    return callback(null, component);
  });
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
  return this.get(path, callback, 'component');
};

Charged.prototype.getSubscriptionComponentByName = function(sub, comp, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    if (err) return callback(err);
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
  return this.put(path, options, callback, 'component');
};

Charged.prototype.updateSubscriptionComponentByName = function(sub, comp, options, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    if (err) return callback(err);
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
 * Invoices
 * http://docs.chargify.com/invoice-billing
 * http://docs.chargify.com/api-invoices
 */

Charged.prototype.getInvoices = function(options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/invoices', options, callback, 'invoice');
};

Charged.prototype.getInvoice = function(name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/invoices/' + escape(name), options, callback, 'invoice');
};

/**
 * Metadata
 * http://docs.chargify.com/api-metadata
 */

Charged.prototype.listMetadata =
Charged.prototype.getMetadatas = function(resource, name, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource)
    + '/' + escape(name)
    + '/metadata';
  return this.get(path, options, callback, 'metadata');
};

Charged.prototype.getMetadata = function(resource, name, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource)
    + '/' + escape(name)
    + '/' + escape(id)
    + '/metadata';
  return this.get(path, options, callback, 'metadata');
};

Charged.prototype.createMetadata = function(resource, name, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource)
    + '/' + escape(name)
    + '/' + escape(id)
    + '/metadata';
  return this.post(path, options, callback, 'metadata');
};

Charged.prototype.updateMetadata = function(resource, name, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource)
    + '/' + escape(name)
    + '/' + escape(id)
    + '/metadata';
  return this.put(path, options, callback, 'metadata');
};

Charged.prototype.removeMetadata = function(resource, name, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var field = options.name;
  delete options.name;
  var path = '/' + escape(resource)
    + '/' + escape(name)
    + '/' + escape(id)
    + '/metadata?name='
    + escape(field);
  return this.delete(path, options, callback, 'metadata');
};

['subscription', 'customer', 'component'].forEach(function(resource) {
  ['list', 'get', 'create', 'update', 'remove'].forEach(function(action) {
    var name = action + 'Metadata'
      , plural = resource + 's'
      , method;

    method = action
      + resource[0].toUpperCase()
      + resource.substring(1)
      + 'Metadata';

    Charged.prototype[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(plural);
      return this[name].apply(this, args);
    };
  });

  // listSubscriptionMetadata -> getSubscriptionMetadatas
  var name = resource[0].toUpperCase() + resource.substring(1)
    , method = 'list' + name + 'Metadata'
    , proxy = 'get' + name + 'Metadatas';

  Charged.prototype[proxy] = Charged.prototype[name];
});

/**
 * Call (API v2)
 * http://docs.chargify.com/api-call
 */

Charged.prototype.call = function(id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  return this.get('/api/v2/calls/' + escape(id), options, callback, 'call');
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
          + (err.code ? ': ' + err.code : '')
          + '.';
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
  'invoice': null, // Default: ?
  'metadata': 200, // Default: 20 (Not sure if max is 200, but it probably is)
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
  'event',
  'invoice',
  'metadata',
  'call',
  'errors'
];

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
