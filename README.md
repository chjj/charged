# charged

A high-level binding to the [Chargify](http://chargify.com/) API.

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
