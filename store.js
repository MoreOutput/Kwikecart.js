/**
* Example shopping cart server for Kwikecart.js
* using node.js (nodejs.org) with express.js (npm install express).
*
* Not intended for real use, obviously.
**/
var express = require('express'),
app = express(),
bodyParser = require('body-parser'),
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
  { id: '3423', name: 'Worlds Best Item', quantity: 0, price: 45.00},
  { id: '1423', name: 'Worlds Second Best Item', quantity: 0, price: 15.00}
],
addToCart = function(cartIndex, quantity, storeItem) {
  if (cartIndex !== false) {
    if (!quantity || quantity === 1) { 
      cart.items[cartIndex].quantity += 1;
    } else {
      cart.items[cartIndex].quantity = quantity;
    }
  } else {
    cart.items.push(storeItem);
    cartIndex = cart.items.length - 1;
    if (!quantity) {
      cart.items[cartIndex].quantity = 1;
    } else {
      cart.items[cartIndex].quantity += quantity;
    }
  }

  console.log(cart);
  return cart.items[cartIndex];
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
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/index.html', function(req, res) {
  return res.render('index.html');
});

app.post('/add', function(req, res) {
  if (req.xhr) {
    return res.json(addToCart(isInCart(req.param('id')), parseInt(req.param('quantity')),getStoreItem(req.param('id'), 0) ));
  } else {
    addToCart(isInCart(req.param('id')), null, getStoreItem(req.param('id'), 0) )
    return res.redirect('index.html?add&id=' + req.param('id'));
  }
});

app.post('/remove', function(req, res) {
  if (req.xhr) {
    return res.json(removeFromCart(isInCart(req.param('id')), parseInt(req.param('quantity')) ));
  } else {
    return res.redirect('index.html?remove&id=' + req.param('id'));
  }
});

app.post('/check', function(req, res) {
  if (req.xhr) {
    return res.json(getStoreItem(req.param('id')));
  } else {
    return res.redirect('index.html?check&id=' + req.param('id'));
  }
});

app.post('/clear', function(req, res) {
  cart.items = [];

  if (req.xhr) {
    return res.json(cart);
  } else {
    return res.redirect('index.html?clear');
  }
});

app.get('/total', function(req, res) {
  if (req.xhr) {
     return res.json(cart);
  } else {
    return res.redirect('index.html?' + req.originalUrl.replace(/.*[?]/, ''));
  }
});

app.listen(1337);