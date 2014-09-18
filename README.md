Kwikicart.js 0.0.1
===========================
Kwikicart is a weird javascript shopping cart. Intending to be a quick solution for connecting the browser 'store' to end points on your server. Store creation should be easy and progressive enhancement is mandated.

Kwikicart makes some markup assumptions:

	Product markup:
		* Each product shares a class (.product by default)
		* A unique ID is attached to the outlined product node in the form of an ID attribute
		* A form for the add action
		* A form for the remove action
		* A form for the check item action

	Cart markup:
		* A form for the clear action
		* A form for the total action
		* A form for the checkout action

Lets assume a product on the page is marked up like the following:

```html
<li class="product" id="product-3423">
	<h2 class="product-name">
		<a href="">Worlds Best Item</a>
	</h2>
	<div>
		<div class="product-info">
			<div class="product-pid">3423</div>
			<div class="product-price">$45.00</div>
		</div>
	</div>
	<!-- Our Actions that Kwikicart.js will call on each related call -->
	<!-- Kwikicart will only send the unique id and quantity to the server -->
	<form method="post" action="./add" name="itemadd">
		<div class="itemFields">
			<input type="hidden" name="name" value="Worlds Best Item" />
			<input type="hidden" name="pid" value="3423" />
			<input type="hidden" name="price" value="45.00" />
		</div>
		<button type="submit" name="addtocart">Add to Cart</button>
	</form>

	<form method="post" action="./remove" name="itemremoveform">
		<input type="hidden" name="name" value="Worlds Best Item" />
		<input type="hidden" name="pid" value="3423" />
		<input type="hidden" name="price" value="45.00" />
		<button type="submit" name="removecart">Remove</button>
	</form>
</li>


<!-- You can also outline the forms in a more genreral way -->
<!-- If forms are appended like this then the fields in the forms 
add event are sent, any fields nested here are also appended -->
<form method="get" action="./check" name="itemcheck"></form>

```

## Loading and Setup for DOJO 1.9+ ##
```js
require({
	baseUrl: 'js/'
}, ['js/kwikicart', 'dojo/ready'], 
function(store, ready) {
	'use strict';
	ready(function () {	
		cart = store.create(); // Success!
		// Assume the example code is in here.
	});
});
```

When creating the cart you can define any of the following options in a passed object:
```js
{
	expires: 1, // Cookie expiration
	taxMultiplier: 0.06,
	currency: 'USD',
	// Related DOM Data
	productNode: '.product',
	cartItems: '.cart-products',
	cartTotal: '.cart-total',
	idField: '[name=id]',
	priceField: '[name=price]',
	nameField: '[name=name]',
	amountField: '[name=quantity]',
	// Forms that control the server calls
	addForm: '[name=itemadd]',
	removeForm: '[name=itemremove]',
	checkForm: '[name=itemcheck]',
	clearForm: '[name=clearcart]',
	totalForm: '[name=totalcart]',
	checkoutForm: '[name=checkout]',
	// XHR Action Override; will result in client side action being taken only
	addAction: true,
	checkoutAction: true,
	removeAction: true,
	clearAction: true,
	totalAction: true,
	incrementAction: true, 
	decrementAction: true,
	// Events
	beforeCheck: null,
	beforeRemove: null,
	beforeClear: null,
	beforeCheckout: null,
	beforeAdd: null,
	beforeDecrement: null,
	beforeIncrement: null,
	beforeTotal: null,
	onCheck: null,
	onRemove: null,
	onClear: null,
	onCheckout: null,
	onAdd: null,
	onDecrement: null,
	onIncrement: null,
	onTotal: null,
	xhrObj: {handleAs: 'json'}
}
```

After you initalize the plugin you should be good to go. 

## Adding ##

Now we a user clicks the 'Add to Cart' it will submit a post
request via XHR with the fields outlined within the form. And now
cart.items has a reference to item.

There are a few ways to add items other than submitting
an item form and each of these methods result in a call to
the form action above.

By ID:
```js
cart.add('product-3423'); 
```
Single Item:
```js
cart.add({ id: "product-3429", name: "Product7", quantity: 1, price: 325.00});
```
Array of items:
```js
var products = [
	{ id: "product-3423", name: "Product1", quantity: 1, price: 45.00},
	{ id: "product-3430", name: "Product8", quantity: 1, price: 145.00}
];
cart.add(products);
cart.add(query('.product')); // Assumes 'dojo/query' module
```

Incrementing items appends increment=amountAdded to the add request (along with providing a total through the quantity field).
```js
// Adding an item more than once will increment
cart.add('#product-3423'); 
cart.add('#product-3423'); 
```

You can set the quantity by giving the wanted total.
```js
cart.add('#product-3423', 100); 
```

## Access Client Cart Data ##

Accessing items:
```js
cart.items;
```
Items are only stored in the cart/cookie as their object representations. The attached id must match its dom counterpart. 

## Check / Refresh Item Data ##
You can query the server to refresh item data with check().

For single item updates, pass in the id. The server should send back some JSON.
```js
cart.check('#product-3423');
```
Calling check() without a passed in ID will send the entire client cart to the server.
```js
cart.check();
```

## Item Removal ##

Removing items is much the same as adding:

By ID:
```js
cart.remove('product-3423'); 
```
Array of items: 
```js
products = ['product-3423', 'product-3430'];
cart.remove(products);
```
Remove all:
```js
cart.remove();
```
Removes all but keeps cookie data:
```js
cart.remove(false);
```

Decrementing items appends decrement=amountRemoved to the add request.
```js
cart.remove('product-3423', 2); 
```

## Getting Totals ##

Getting totals:
```js
cart.total(); // Totals the cart on the client
cart.total(true); // Totals the cart, checking items against the server
```