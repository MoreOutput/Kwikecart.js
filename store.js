/**
* Example shopping cart server for kwikicart.js
* using node.js (nodejs.org) with express.js (npm install express).
*
* Not intended for real use, obviously.
**/
var express = require('express'),
app = express(),
cartTemplate = {
  user: '',
  session: '',
  items: [],
  taxRate: 0.06,
  geo: 'US',
  langauge: 'en',
  currency_code: 'USD',
  total: 0
},
cart = cartTemplate,
store = [
  { id: '3423', name: 'Product Server Name 1', quantity: 1, price: 45.00},
  { id: '1423', name: 'Product Server Name 2', quantity: 1, price: 15.00}
],
addToCart = function(cartIndex, quantity, storeItem) {
  if (cartIndex !== false) {
    if (!quantity) { 
      cart.items[cartIndex].quantity += 1;
    } else {
      cart.items[cartIndex].quantity = quantity;
    }
  } else {
    storeItem.quantity = quantity;
    cart.items.push(storeItem);
  }

  return storeItem;
},
isInCart = function(id) {
  var i = 0;
  for (i; i < cart.items.length; i += 1) {
    if (id === cart.items[i].id) {
      return i;
    }
  }
  return false;
},
removeFromCart = function(cartIndex, quantity) {
  if (cartIndex !== false && quantity) {
    cart.items[cartIndex].quantity = quantity;
  } else if (!quantity || quantity === '-1') {
    cart.items.splice(cartIndex, 1);
  }

  return cart.items;
},
getStoreItem = function(id) {
  var i = 0;
  for (i; i < store.length; i += 1) {
    if (id === store[i].id) {
      return store[i];
    }
  }
  return false;
};

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.use('/js', express.static(__dirname + '/js'));

app.get('/', function(req, res) {
 return res.render('index.html');
});

app.post('/add', function(req, res) {
  return res.json(addToCart(isInCart(req.param('id')), req.param('quantity'),getStoreItem(req.param('id')) ));
});

app.post('/remove', function(req, res) {
    console.log('Removing');
  return res.json(removeFromCart(isInCart(req.param('id')), req.param('quantity') ));
});

app.post('/check', function(req, res) {
  console.log('Check');
  return res.json(getStoreItem(req.param('id')));
});

app.get('/clear', function(req, res) {
  console.log('Clear');
  cart = cartTemplate;

  return res.json({success: true});
});

app.get('/total', function(req, res) {
  console.log('Total');
  return res.json({success: true});
});

app.listen(1337);