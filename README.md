# charged

A high-level binding to the [Chargify](http://chargify.com/) API.

# Example Usage

``` js
var charged = require('charged');

var charge = charged({
  product: 'monthly-chili-cheese-fries',
  key: 'ad3rt4302ebdd'
});

charge.getCustomerByRef('chjj', function(err, customer) {
  if (err) throw err;
  console.log(customer);
});
```
