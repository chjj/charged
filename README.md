# charged

A high-level binding to the [Chargify](http://chargify.com/) API.

Charged also provides an interactive chargify shell for managing sites.

# Example Usage

``` js
var charged = require('charged');

var chargify = charged({
  subdomain: 'monthly-chili-cheese-fries',
  apiKey: 'ad3rt4302ebdd'
});

chargify.getSubscriptionsByCustomerRef('chjj', function(err, results) {
  if (err) throw err;
  console.log(results);
});
```

``` bash
$ charged my-site
API Key: foobar
[charged] ls /stats
{ seller_name: 'My Site Inc.',
  site_name: 'my-site',
  stats:
   { revenue_this_year: '$34,578.01',
     total_revenue: '$34,581.01',
     total_subscriptions: 1648,
     subscriptions_today: 0,
     revenue_this_month: '$18.00',
     revenue_today: '$18.00' } }
[charged] ls /customers/foo
{ customer:
   { reference: 'foo',
     email: 'foo@example.com',
     country: null,
     updated_at: '2012-09-27T15:01:17-04:00',
     address: null,
     created_at: '2012-08-26T16:53:03-04:00',
     id: 2000,
     state: null,
     first_name: 'Foo',
     last_name: 'Bar',
     zip: null,
     city: null,
     organization: null,
     phone: null,
     address_2: null } }
[charged] cat /product_families
[ { product_family:
     { name: 'my-family',
       accounting_code: null,
       id: 20000,
       description: 'Main product family.',
       handle: 'my-family' } } ]
[charged] less /subscriptions
[charged] mk /subscriptions {product_handle:'my-product',customer_reference:'foo'}
[charged] mv {product_handle:'my-product2'} /subscriptions/[last-id]
[charged] ls customers/foo/subscriptions
[charged] cd customers
[charged] pwd
/customers
[charged] rm foo
# All of the Charged method names work as well...
[charged] get-stats
[charged] get-subscription 1000
[charged] update-subscription 1000 {product_handle:'my-product'}
[charged] get-customer-by-ref foo
```
