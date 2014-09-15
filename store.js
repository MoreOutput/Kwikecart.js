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
  { id: '3423', name: 'Product1', quantity: 1, price: 45.00},
  { id: '3424', name: 'Product2', quantity: 1, price: 15.00},
  { id: '3425', name: 'Product3', quantity: 1, price: 25.00},
  { id: '3426', name: 'Product4', quantity: 1, price: 55.25},
  { id: '3427', name: 'Product5', quantity: 1, price: 145.00},
  { id: '3428', name: 'Product6', quantity: 1, price: 425.00},
  { id: '3429', name: 'Product7', quantity: 1, price: 325.00},
  { id: '1423', name: 'Product8', quantity: 1, price: 145.00}
],
addToCart = function(cartIndex, storeItem) {
  if (cartIndex !== false) {
   cart.items[cartIndex].quantity += 1;
  } else {
    cart.items.push(storeItem);
  }

  return cart.items;
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

app.get('/', function(req, res){
 return res.render('index.html');
});

app.post('/add', function(req, res) {
  return res.json(addToCart(isInCart(req.param('id')), getStoreItem(req.param('id')) ));
});

app.post('/remove', function(req, res){
  return res.json(removeFromCart(isInCart(req.param('id')), req.param('quantity') ));
});

app.post('/check', function(req, res){
 return res.json(getStoreItem(req.param('id')));
});

app.get('/clear', function(req, res){
  cart = cartTemplate;

  return res.json({success: true});
});

app.get('/total', function(req, res){
  cart = cartTemplate;

  return res.json({success: true});
});

app.listen(1337);