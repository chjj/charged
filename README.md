# charged

A high-level binding to the [Chargify](http://chargify.com/) API.

# Example Usage

``` js
var charged = require('charged');

var charge = charged({
  product: 'monthly-chili-cheese-fries',
  key: 'ad3rt4302ebdd'
});

charge.readSubscription('chjj', function(err, result) {
  if (err) throw err;
  console.log(result);
});

var options = { memo: 'bill', amount_in_cents: 100 };
charge.charge('chjj', options, function(err, result) {
  if (err) throw err;
  console.log(result);
});
```
