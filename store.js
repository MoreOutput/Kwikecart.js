/**
* Example shopping cart server for Kwikecart.js
* using node.js (nodejs.org) with express.js (npm install express).
*
* Intended to assist in testing client side kwikecart code.
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
	{ id: '3423', name: 'Worlds Best Item', quantity: 1, price: 45.00},
	{ id: '1423', name: 'Worlds Second Best Item', quantity: 1, price: 15.00},
	{ id: '1423', name: 'Worlds Third Best Item', quantity: 1, price: 145.00}
],
addToCart = function(storeItem, quantity) {
	var cartIndex = isInCart(storeItem.id);

	if (cartIndex !== false) {
		cart.items[cartIndex].quantity += quantity;
	} else {
		cartIndex = 0;
		storeItem.quantity = quantity;
		cart.items.push(storeItem);
	}

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
	if (cartIndex && quantity !== -1) {
		cart.items[cartIndex].quantity = quantity;
	} else {
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
},
totalCart = function() {
	var i = 0;

	cart.total = 0;

	for (i; i < cart.items; i += 1) {
		cart.total += cart.items[i].price;
	}

	cart.total = cart.total.toFixed(2);

	return cart.total;
};

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.use('/js', express.static(__dirname + '/js'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/index', function(req, res) {
	return res.render('index.html', {page: { cart: cart, action: req.body.action }});
});

app.post('/add', function(req, res) {
	var storeItem = getStoreItem(req.body.id),
	quantity = req.body.quantity;

	if (!quantity) {
		quantity = 1;
	} else {
		quantity = parseInt(quantity);
	}

	if (req.xhr) {
		return res.json(addToCart(storeItem, quantity));
	} else {
		storeItem = addToCart(storeItem, quantity);
		return res.redirect('index?action=add&id=' + req.body.id + '&quantity=' + storeItem.quantity);
	}
});

app.post('/remove', function(req, res) {
	var quantity = req.body.quantity;

	if (!quantity) {
		quantity = -1;
	} else {
		quantity = parseInt(quantity);
	}

	if (req.xhr) {
		return res.json(removeFromCart(isInCart(req.body.id), quantity));
	} else {
		return res.redirect('index?action=remove&id=' + req.body.id  + '&quantity=' + quantity);
	}
});

app.get('/check', function(req, res) {
	if (req.xhr) {
		return res.json(getStoreItem(req.param('id')));
	} else {
		return res.render('check.html');
	}
});

app.post('/clear', function(req, res) {
	cart.items = [];

	if (req.xhr) {
		return res.json(cart);
	} else {
		return res.redirect('index?action=clear');
	}
});

app.get('/total', function(req, res) {
	if (req.xhr) {
		return res.json(cart);
	} else {
		return res.render('total.html', {cart: cart});
	}
});

app.listen(1337);