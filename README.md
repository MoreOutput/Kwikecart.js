Kwikicart.js 0.1.0
===========================
Need a quick JavaScript Shopping Cart? With Kwikicart progressive enhancement is mandatory and DOM form outlines serve as a client side cart API for easily leveraging already defined workflows. Kwikicart generates no markup (use onAdd() which passed you the added item to place the item into the DOM), utilizes modular loading and aims to keep the core script as accessible and easy to work with as possible. The script comes with a simple express.js application (store.js) for local play.

Kwikicart does make some markup assumptions:

	Product markup:
		* Each product shares a class (.product by default)
		* Each product node has an unqiue ID.
		* A form for the add/remove actions (mandatory)

	Page markup:
		* A form for the check item action (can be set via config)
		* A form for the clear action (can be set via config)
		* A form for the total action (can be set via config)
		* A form for the checkout action (mandatory)

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
			<input type="hidden" name="quantity" value="1" />
		</div>
		<button type="submit" name="addtocart">Add to Cart</button>
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
	attachFieldIDs: false,
	// Related DOM Data
	productNode: '.product',
	cartItems: '.cart-products',
	cartTotal: '.cart-total',
	idField: '[name=id]',
	priceField: '[name=price]',
	nameField: '[name=name]',
	quantityField: '[name=quantity]',
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
	// Before events -- must return true before an item is added
	beforeCheck: null,
	beforeRemove: null,
	beforeClear: null,
	beforeCheckout: null,
	beforeAdd: null,
	beforeTotal: null,
	// On events -- Fire after the item is added and server response received
	onCheck: null,
	onRemove: null,
	onClear: null,
	onCheckout: null,
	onAdd: null,
	onDecrement: null, // Fired when an items quantity goes down but not to 0
	onIncrement: null, // Fired when an items quantity goes up but not on 1
	onTotal: null,
	xhrObj: {handleAs: 'json'}
}
```

After you initalize the plugin you should be good to go.

## Add with cart.add(items, quantity, callback) ##

When a user clicks the 'Add to Cart' it will submit a post
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
cart.add(query('.product'));
```

Incrementing items appends increment=true to the add request (along with providing a total through the quantity field).
```js
cart.add('product-3423'); 
cart.add('product-3423'); 
```

You can set the quantity by giving the wanted total.
```js
cart.add('product-3423', 100); 
```
## Remove with cart.remove(items, quantity, callback) ##

Removing items with remove() is the same as adding:

By ID:
```js
cart.remove('product-3423'); // Fully removes item
```

Array of items: 
```js
products = ['product-3423', 'product-3430'];
cart.remove(products); // Fully removes items
```

Decrementing items appends decrement=true to the add request.
```js
cart.remove('product-3423', 2); // Removes 2 items
```

Both the remove() and add() functions are actually just referencing set().
set() will not fire any of the add/remove/increment/decrement events.
```js
cart.set('product-3423', 100);
```

Use clear to remove all items at once:
```js
cart.clear();
cart.remove(); // Calls clear and will fire those events
```

Removes all but keeps cookie data:
```js
cart.clear(false);
```

## Working with Cart Data ##

Accessing items as array:
```js
cart.items;
```

Finding item in the cart, null if its not there:
```js
cart.find('product-3430');
```

DOM item to object:
```js
cart.createItemObj('product-3430');
```

Items are only stored in the cart/cookie as their object representations. The attached id must match its dom counterpart. 

## Check / Refresh Item Data ##
You can query the server to refresh item data with check().

For single item updates, pass in the id. The server should send back the item as JSON.
```js
cart.check('product-3423');
```
Calling check() without a passed in ID will send the entire client cart to the server.
```js
cart.check();
```

## Getting Totals ##

Getting totals:
```js
cart.total(); // Totals the cart on the client
cart.total(true); // Total with server call
```

## Disable Cookies ##

Disable cookies by setting the expires option to -1

## Events ##

Before events are fired, obviously, before the action begins to process. Before events
must return true or the action will be halted. On events are fired at the end of action processing. 

```js
beforeCheck: null, 
beforeRemove: null, 
beforeClear: null, 
beforeCheckout: null, 
beforeAdd: null,
beforeTotal: null,

onCheck: null,
onRemove: null,
onClear: null,
onCheckout: null,
onAdd: null,
onDecrement: null, // Fired when an items quantity goes down but not to 0
onIncrement: null, // Fired when an items quantity goes up but not on 1
onTotal: null
```

## Preventing calls to the server ##

To prevent a call to the server toggle the following cart options:
```js
addAction: true,
checkoutAction: true,
removeAction: true,
clearAction: true,
totalAction: true,
```