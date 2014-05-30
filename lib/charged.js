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
  , qs = require('querystring')
  , fs = require('fs');

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
  this.debug = options.debug;
  this.retry = options.retry || 1;

  this.cache = options.cache || false;
  this.cacheTTL = options.cacheTTL || 20 * 1000;
  this.cacheThreshold = options.cacheThreshold || 100;
  this._cache = {
    customers: {},
    subscriptions: {},
    components: {},
    metadata: {},
    usage: {}
  };

  this.cacheSchemas = options.cacheSchemas;
  this._schemaCache = {
    components: {},
    products: {}
  };

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
  var self = this;
  var path = '/subscriptions/' + escape(name);
  return this.put(path, options, function(err, sub) {
    if (err) {
      // TODO: Change to exact error message.
      if (~err.message.indexOf('interval') && options.payment_profile_attributes) {
        delete options.next_billing_at;
        return self.updateSubscription(name, options, callback);
      }
      return callback(err);
    }
    return callback(null, sub);
  }, 'subscription');
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

  if (this.cache && this._cache.subscriptions[customer]) {
    return callback(null, this._cache.subscriptions[customer]);
  }

  var self = this;
  var path = '/customers/' + escape(customer) + '/subscriptions';

  return this.get(path, function(err, subscriptions) {
    if (err) return callback(err);
    if (self.cache) {
      self._cache.subscriptions[customer] = self._mark(subscription);
    }
    return callback(null, subscriptions);
  }, 'subscription');
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
    per_page: 100000
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

Charged.prototype.getStatementPDF = function(name, callback) {
  var cb;
  if (callback) {
    cb = function(err, res, body) {
      if (err) return callback(err);
      return callback(null, body);
    };
  }
  return this.request({
    path: '/statements/' + escape(name),
    ext: '.pdf',
    raw: true
  }, cb);
};

Charged.prototype.saveStatementPDF = function(name, path, callback) {
  var file
    , stream;

  if (!callback) {
    callback = path;
    path = null;
  }

  path = path || '/tmp/charged-%s-stmt-%i.pdf'
  path = path.replace(/^~/, process.env.HOME);
  path = path.replace('%s', this.subdomain);
  path = path.replace('%i', escape(name));

  file = fs.createWriteStream(path);

  stream = this.getStatementPDF(name);

  function error(err) {
    try {
      file.destroy();
    } catch (e) {
      ;
    }
    try {
      fs.unlinkSync(path);
    } catch (e) {
      ;
    }
    try {
      stream.destroy();
    } catch (e) {
      ;
    }
    return callback(err);
  }

  stream.on('error', error);
  file.on('error', error);

  stream.pipe(file).on('close', function(data) {
    return callback(null, path);
  });
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

Charged.prototype.getStatementIds = function(options, callback) {
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

  if (this.cacheSchemas) {
    if (this._schemaCache.components[name] != null) {
      return callback(null, this._schemaCache.components[name]);
    }
  }

  return this._getComponent('name', name, function(err, component) {
    if (err) return callback(err);

    if (self.cacheSchemas) {
      self._schemaCache.components[name] = component;
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
  return this.post(path, options, callback, kind.slice(0, -1));
};

Charged.prototype.getSubscriptionComponents =
Charged.prototype.listSubscriptionComponents = function(name, callback) {
  if (this.cache && this._cache.components[name]) {
    return callback(null, this._cache.components[name]);
  }

  var self = this;
  var path = '/subscriptions/' + escape(name) + '/components';

  return this.get(path, function(err, components) {
    if (err) return callback(err);
    if (self.cache) {
      self._cache.components[name] = self._mark(components);
    }
    return callback(null, components);
  }, 'component');
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

  var self = this;
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp);

  return this.put(path, options, function(err, component) {
    if (err) return callback(err);
    if (self.cache && self._cache.components[sub]) {
      delete self._cache.components[sub];
    }
    return callback(null, component);
  }, 'component');
};

Charged.prototype.updateSubscriptionComponentByName = function(sub, comp, options, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    if (err) return callback(err);
    return self.updateSubscriptionComponent(sub, component.id, options, callback);
  });
};

Charged.prototype.allocateSubscriptionComponent = function(sub, comp, options, callback) {
  if (!this._isNumber(comp)) {
    return this.updateSubscriptionComponentByName(sub, comp, options, callback);
  }

  var self = this;
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp)
    + '/allocations';

  return this.post(path, options, function(err, component) {
    if (err) return callback(err);
    if (self.cache && self._cache.components[sub]) {
      delete self._cache.components[sub];
    }
    return callback(null, component);
  }, 'allocation');
};

Charged.prototype.allocateSubscriptionComponentByName = function(sub, comp, options, callback) {
  var self = this;
  return this.getComponentByName(comp, function(err, component) {
    if (err) return callback(err);
    return self.allocateSubscriptionComponent(sub, component.id, options, callback);
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

  var self = this;
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp)
    + '/usages';

  return this.get(path, options, function(err, usage) {
    if (err) return callback(err);
    if (self.cache) {
      self._cache.usage[sub + ':' + comp] = self._mark(usage);
    }
    return callback(null, usage);
  }, 'usage');
};

Charged.prototype.createSubscriptionUsage =
Charged.prototype.updateSubscriptionUsage = function(sub, comp, options, callback) {
  if (this.cache && this._cache.usage[sub + ':' + comp]) {
    return callback(null, this._cache.usage[sub + ':' + comp]);
  }

  var self = this;
  var path = '/subscriptions/'
    + escape(sub)
    + '/components/'
    + escape(comp)
    + '/usages';

  return this.post(path, options, function(err, usage) {
    if (err) return callback(err);
    if (self.cache && self._components.usage[sub + ':' + comp]) {
      delete self._cache.usage[sub + ':' + comp];
    }
    return callback(null, usage);
  }, 'usage');
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

// Get the creation time of a component allocation.
Charged.prototype.getComponentAllocation =
Charged.prototype.getLastComponentAllocation = function(sub, comp, state, callback) {
  var self = this;

  if (!callback) {
    callback = state;
    state = 'on';
  }

  if (state !== 'on' && state !== 'off') {
    state = state ? 'on' : 'off';
  }

  function getComponentName(callback) {
    if (comp.test) return callback(null, comp);
    if (!/^\d+$/.test(comp)) return callback(null, comp);
    return self.getSubscriptionComponent(sub, comp, function(err, component) {
      if (err) return callback(err);
      return callback(null, component.name);
    });
  }

  return getComponentName(function(err, name) {
    if (err) return callback(err);
    return self.getSubscriptionEvents(sub, { amount: 1000000 }, function(err, events) {
      if (err) return callback(err);

      var event = events.filter(function(event) {
        if (!event.message) event.message = '';
        if (name.test) {
          return event.key === 'component_allocation_change'
              && name.test(event.message);
        } else {
          return event.key === 'component_allocation_change'
              && event.message.indexOf(name + ' turned ' + state) === 0;
        }
      })[0];

      if (!event) {
        return callback(new Error('Not found.'));
      }

      return callback(null, event);
    });
  });
};

// Get the creation time of the payment profile.
Charged.prototype.getCardTime = function(sub, fail, callback) {
  var self = this;

  if (!callback) {
    callback = fail;
    fail = false;
  }

  return self.getSubscriptionEvents(sub, { amount: 1000000 }, function(err, events) {
    if (err) return callback(err);

    var events = events.reverse()
      , event;

    event = events.filter(function(event) {
      return event.key === 'subscription_card_update';
    })[0];

    if (event) {
      return callback(null, event);
    }

    // Fail on no card event.
    if (fail) {
      return callback(new Error('Not found.'));
    }

    return self.getSubscription(sub, function(err, sub) {
      if (err) return callback(err);

      if (!sub.credit_card) {
        return callback(new Error('Not found.'));
      }

      // If the subscription was created with a payment_profile, there is no
      // subscription_card_update, so we'll just return the signup_success
      // event instead.
      event = events.filter(function(event) {
        return event.key === 'signup_success'
          && event.event_specific_data
          && event.event_specific_data.product_id === sub.product.id;
      })[0];

      if (!event) {
        return callback(new Error('Not found.'));
      }

      return callback(null, event);
    });
  });
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
  var path = '/product_families/'
    + escape(options.product_family_id)
    + '/products';
  return this.post(path, options, callback, 'product');
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
Charged.prototype.getMetadatas = function(resource, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource) + '/metadata';
  return this.get(path, options, callback, 'metadata');
};

Charged.prototype.getMetadata = function(resource, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  if (this.cache && this._cache.metadata[resource + ':' + id]) {
    return callback(null, this._cache.metadata[resource + ':' + id]);
  }

  var self = this;
  var path = '/' + escape(resource) + '/' + escape(id) + '/metadata';

  return this.get(path, options, function(err, metadata) {
    if (err) return callback(err);
    if (self.cache) {
      self._cache.metadata[resource + ':' + id] = self._mark(metadata);
    }
    return callback(null, metadata);
  }, 'metadata');
};

Charged.prototype.createMetadata = function(resource, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var self = this;
  var path = '/' + escape(resource) + '/' + escape(id) + '/metadata';
  return this.post(path, options, function(err, metadata) {
    if (err) return callback(err);
    if (self.cache) {
      if (self._cache.metadata[resource + ':' + id]) {
        delete self._cache.metadata[resource + ':' + id];
      }
    }
    return callback(null, metadata);
  }, 'metadata');
};

Charged.prototype.updateMetadata = function(resource, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var self = this;
  var path = '/' + escape(resource) + '/' + escape(id) + '/metadata';
  return this.put(path, options, function(err, metadata) {
    if (err) return callback(err);
    if (self.cache) {
      if (self._cache.metadata[resource + ':' + id]) {
        delete self._cache.metadata[resource + ':' + id];
      }
    }
    return callback(null, metadata);
  }, 'metadata');
};

Charged.prototype.removeMetadata = function(resource, id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  var name = options.name;
  delete options.name;

  var self = this;
  var path = '/' + escape(resource)
    + '/' + escape(id)
    + '/metadata?name='
    + escape(name);

  return this.delete(path, options, function(err, metadata) {
    if (err) return callback(err);
    if (self.cache) {
      if (self._cache.metadata[resource + ':' + id]) {
        delete self._cache.metadata[resource + ':' + id];
      }
    }
    return callback(null, metadata);
  }, 'metadata');
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
 * Metafields
 * http://docs.chargify.com/api-metafields
 */

Charged.prototype.listMetafields =
Charged.prototype.getMetafields = function(resource, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource) + '/metafields';
  return this.get(path, options, callback, 'metafields');
};

Charged.prototype.createMetafields = function(resource, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/' + escape(resource) + '/metafields';
  return this.post(path, options, callback, 'metafields');
};

Charged.prototype.removeMetafields = function(resource, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }

  var name = options.name;
  delete options.name;

  var path = '/' + escape(resource) + '/metafields?name=' + escape(name);
  return this.delete(path, options, callback, 'metafields');
};

['subscription', 'customer', 'component'].forEach(function(resource) {
  ['list', 'get', 'create', 'remove'].forEach(function(action) {
    var name = action + 'Metafields'
      , plural = resource + 's'
      , method;

    method = action
      + resource[0].toUpperCase()
      + resource.substring(1)
      + 'Metafields';

    Charged.prototype[method] = function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(plural);
      return this[name].apply(this, args);
    };
  });
});

/**
 * Payments
 * http://docs.chargify.com/api-payments
 */

Charged.prototype.createPayment =
Charged.prototype.createSubscriptionPayment = function(id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  var path = '/subscriptions/' + escape(id) + '/payments';
  return this.post(path, options, callback, 'payment');
};

/**
 * Call (API v2)
 * A wrapper for Chargify Direct, but we'll implement it anyway.
 * http://docs.chargify.com/chargify-direct-introduction
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
 * Card Update (API v2)
 * This is probably Chargify Direct only, but let's just implement it anyway.
 * http://docs.chargify.com/chargify-direct-introduction
 * http://docs.chargify.com/api-card-update
 */

Charged.prototype.cardUpdate = function(id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  options = { payment_profile: options };
  var path = '/api/v2/subscriptions/' + escape(id) + '/card_update';
  return this.post(path, options, callback);
};

/**
 * Signups (API v2)
 * Chargify Direct, but we'll implement it anyway.
 * http://docs.chargify.com/chargify-direct-introduction
 * http://docs.chargify.com/api-signups
 */

Charged.prototype.createSignup = function(id, options, callback) {
  if (!callback) {
    callback = options;
    options = null;
  }
  options = { signup: options };
  return this.post('/api/v2/signups', options, callback);
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

Charged.prototype.resendWebhooks = function(ids, callback) {
  return this.post('/webhooks/replay', { ids: ids }, callback, null);
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
    , raw = options.raw
    , format = options.format
    , ext = options.ext || '.json'
    , cb = callback;

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

  var done = function(err, result) {
    if (err) {
      if (err.server && options.retry > 0) {
        return setTimeout(function() {
          options.retry--;
          return self.request(options, cb);
        }, 500);
      }
      return callback(err);
    }
    return callback(null, result);
  };

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

  options.uri = options.uri.replace(/(?=\?|$)/, ext);

  if (method === 'GET') delete options.json;
  //if (method === 'DELETE') delete options.json;

  if (raw) {
    options.encoding = null;
    return cb
      ? request(options, cb)
      : request(options);
  }

  return request(options, function(err, res, body) {
    if (err) {
      err = 'No response from chargify'
          + (err.code ? ': ' + err.code : '')
          + '.';
      err.server = true;
      return done(new Error(err));
    }

    if (res.statusCode === 403) {
      return done(new Error('Not supported.'));
    }

    if (res.statusCode === 404) {
      return done(new Error('Not found.'));
    }

    if (typeof body === 'string' && !body.trim() && res.statusCode === 200) {
      return callback(null);
    }

    try {
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
    } catch (e) {
      if (self.debug) {
        e.message += '\nStatus code: ' + res.statusCode + '.';
        e.message += '\nJSON: ' + body;
        e.server = true;
        return done(e);
      }
      err = new Error(
        'Status code: ' + res.statusCode + '.'
        + ' The JSON returned from chargify'
        + ' is failing to parse.'
        + ' Chargify may be having a problem.');
      err.server = true;
      return done(err);
    }

    if (!body) {
      return done(new Error('No body.'));
    }

    if (body.errors) {
      err = body.errors.join('\n');
      if (!err) err = 'Unable to process this request.';
      return done(new Error(err));
    }

    if (self.cache) {
      self._collectGarbage();
    }

    return done(null, body);
  });
};

Charged.prototype._collectGarbage = function() {
  var self = this;

  if (!this.cache) return;

  Object.keys(self._cache).forEach(function(resource) {
    var keys = Object.keys(self._cache[resource]);
    if (keys.length > self.cacheThreshold) {
      keys.forEach(function(key) {
        var obj = self._cache[resource][key];
        if (!obj.__$cache || +new Date >= obj.__$cache + self.cacheTTL) {
          delete self._cache[resource][key];
        }
      });
    }
  });
};

Charged.prototype._mark = function(obj) {
  Object.defineProperty(obj, '__$cache', {
    value: +new Date,
    enumerable: false,
    configurable: true
  });
};

Charged.prototype.get = function(path, query, callback, format) {
  var self = this;

  if (arguments.length === 3) {
    format = callback;
    callback = query;
    query = null;
  }

  if (typeof query === 'function') {
    callback = query;
    query = null;
  }

  query = query || {};

  // Legacy
  if (query.max) {
    query.amount = query.max;
    delete query.max;
  }

  // Legacy
  if (query._per_page) {
    query.per_page = query._per_page;
    delete query._per_page;
  }

  if (query.amount) {
    return this._page(path, query, callback, format);
  }

  if (query.concurrency) {
    delete query.concurrency;
  }

  var retry = this.retry;
  if (query && query.retry != null) {
    retry = query.retry;
    delete query.retry;
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
    format: format,
    retry: retry
  };

  return this.request(options, callback);
};

Charged.prototype._page = function(path, query, callback, format) {
  var self = this
    , limit = Charged.limits[format]
    , amount = query.amount
    , concurrency = 1
    , pending = 0
    , out = [];

  delete query.amount;

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
  if (limit && amount > limit && format === 'webhook') {
    query.per_page = limit;
  } else {
    query.per_page = amount;
  }

  function cb(err) {
    if (cb.done) return;

    if (err) {
      cb.done = true;
      return callback(err);
    }

    // If `out` is maxed, execute callback even
    // if there are still requests pending.
    if (pending && out.length < amount) {
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

      // Strange bug where chargify seems to have variable limits
      // for per_page values. Retry if we get an empty body.
      // Only works with a concurrency of 1.
      // TODO: Keep track of retries.
      // if (err && err.message === 'No body.') {
      //   if (concurrency > 1) {
      //     return cb(err);
      //   }
      //   query.page--;
      //   return next();
      // }

      if (err) return cb(err);

      if (!results.length) {
        return cb();
      }

      out.push.apply(out, results);

      if (out.length >= amount) {
        out = out.slice(0, amount);
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
  if (arguments.length === 3) {
    format = callback;
    callback = body;
    body = null;
  }

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

  var retry = this.retry;
  if (body && body.retry != null) {
    retry = body.retry;
    delete body.retry;
  }
  options.retry = retry;

  return this.request(options, callback);
};

Charged.prototype.put = function(path, body, callback, format) {
  if (arguments.length === 3) {
    format = callback;
    callback = body;
    body = null;
  }

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

  var retry = this.retry;
  if (body && body.retry != null) {
    retry = body.retry;
    delete body.retry;
  }
  options.retry = retry;

  return this.request(options, callback);
};

Charged.prototype.delete = function(path, body, callback, format) {
  if (arguments.length === 3) {
    format = callback;
    callback = body;
    body = null;
  }

  if (typeof body === 'function') {
    callback = body;
    body = null;
  }

  //if (Object.keys(body).length) {
  //  body = qs.stringify(body);
  //  path += ~path.indexOf('?')
  //    ? '&' + body
  //    : '?' + body;
  //}

  //var options = {
  //  method: 'DELETE',
  //  path: path,
  //  format: format
  //};

  var options = {
    method: 'DELETE',
    path: path,
    body: body || {},
    format: format
  };

  var retry = this.retry;
  if (body && body.retry != null) {
    retry = body.retry;
    delete body.retry;
  }
  options.retry = retry;

  return this.request(options, callback);
};

/**
 * Hosted Pages
 * http://docs.chargify.com/hosted-page-settings
 * http://docs.chargify.com/hosted-page-integration
 */

// Generate hosted page URL
Charged.prototype.hostedPage = function(shortname, id) {
  if (id && shortname === 'signup_page') {
    return this.signupPage(id);
  }

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
  // 'metafields': 200, // Default: 20
  'coupon': null, // Default: ?
  'transaction': 200, // Default: 20
  'product_family': null, // Default: ? - Does not accept per_page, or (maybe) page.
  'product': null, // Default: ? - Does not accept per_page, or (maybe) page.
  // 'webhook': Infinity // Default: 20
  'webhook': 2000 // Default: 20
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
  'charge',
  'component',
  'allocation',
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
  'metafields',
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

    // Failsafe
    // var item = (Array.isArray(result) ? result[0] : result) || {};
    // if (item[name] === undefined) {
    //   var keys = Object.keys(item);
    //   if (keys.length === 1 && ~Charged.resources.indexOf(keys[0])) {
    //     name = keys[0];
    //   }
    // }

    if (Array.isArray(result)) {
      result = result.map(function(item) {
        return item[name] || item;
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
 * Webhook Middleware
 */

Charged.webhook = function(options) {
  var crypto = require('crypto')
    , url = require('url')
    , options = options || {};

  if (!options.siteKey || !options.hooks || !options.callback) {
    throw new Error('`siteKey`, `hooks`, and `callback` are required.');
  }

  function getBody(req, res, callback) {
    var body = '';

    req.setEncoding('utf8');

    req.on('data', function(data) {
      body += data;
    });

    req.on('error', function(err) {
      try {
        req.destroy();
      } catch (e) {
        ;
      }
      try {
        req.socket.destroy();
      } catch (e) {
        ;
      }
      callback(err);
    });

    req.on('end', function() {
      var data;

      try {
        data = parse(body);
      } catch (e) {
        ;
      }

      callback(null, body, data);
    });
  }

  function json(res, code, data) {
    data = JSON.stringify(data || {});

    res.statusCode = code;

    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(data));
      res.end(data);
    } catch (e) {
      ;
    }
  }

  function md5(data) {
    return crypto
      .createHash('md5')
      .update(data)
      .digest('hex');
  }

  function hmac(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  function emit(event, payload, callback) {
    if (!options.hooks[event]) {
      return callback(new Error('Event not found.'));
    }
    if (!options.getUser || options.hooks[event].length === 2) {
      return options.hooks[event](payload, function(err) {
        return callback(err || null);
      });
    }
    return options.getUser(event, payload, function(err, user) {
      if (err) return callback(err, user);
      if (!user) return callback(new Error('User not found.'));
      return options.hooks[event](user, payload, function(err) {
        return callback(err || null, user);
      });
    });
  }

  options.format = options.format || function(user, payload, data) {
    return data;
  };

  /**
   * Nested QS Parser
   * From: Parted, Copyright (c) 2011-2012, Christopher Jeffrey
   * https://github.com/chjj/parted
   */

  function parse(str, del, eq) {
    if (!str) return {};

    var out = {}
      , s = str.split(del || '&')
      , l = s.length
      , i = 0
      , $;

    for (; i < l; i++) {
      $ = s[i].split(eq || '=');
      if ($[0]) {
        $[0] = unescape($[0]);
        $[1] = $[1] ? unescape($[1]) : '';
        parse.set(out, $[0], $[1]);
      }
    }

    return out;
  }

  parse.set = function(parts, field, part) {
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

  function unescape(str) {
    try {
      str = decodeURIComponent(str).replace(/\+/g, ' ');
    } finally {
      return str.replace(/\0/g, '');
    }
  }

  return function(req, res, next) {
    if (req.request) req = req.request;
    if (res.response) res = res.response;

    if (req.method !== 'POST') return next();

    if (options.path && url.parse(req.url).path !== options.path) {
      return next();
    }

    return getBody(req, res, function(err, rawBody, body) {
      if (err) return json(res, 400, err.message || err + '');

      if (!body || !rawBody || !body.payload) {
        return json(res, 400, { error: 'No body.' });
      }

      var id = +body.id
        , event = body.event
        , payload = body.payload
        , signature
        , expected;

      if (req.headers['x-chargify-webhook-signature-hmac-sha-256']) {
        signature = req.headers['x-chargify-webhook-signature-hmac-sha-256'];
        expected = hmac(rawBody, options.siteKey);
      } else {
        signature = req.headers['x-chargify-webhook-signature'];
        expected = md5(options.siteKey + rawBody);
      }

      if (signature !== expected) {
        options.callback(new Error('Bad signature.'), {
          id: id,
          type: event,
          error: 'Bad signature.'
        });
        return json(res, 403, {
          error: 'Bad signature.'
        });
      }

      payload._id = id;
      payload._event = event;

      emit(event, payload, function(err, user) {
        return options.callback(err || null, options.format(user, payload, {
          id: id,
          event: event,
          reference: user ? user.reference || user.username : undefined,
          customer: user ? user.customer || user.id : undefined
        }));
      });

      return json(res, 200);
    });
  };
};

/**
 * Expose
 */

module.exports = Charged;
