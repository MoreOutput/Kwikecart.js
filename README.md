Kwikecart.js 0.5.0
===========================
Kwikecart is a client side shopping cart written with progressive enhancement in mind. Kwikecart generates no markup (use onAdd() which passed you the added item to place the item into the DOM), utilizes modular loading and aims to keep the core script as accessible and easy to work with as possible. The script comes with a simple express.js application (store.js) for local play.

Kwikecart does make some markup assumptions:

	Product markup:
		* Each product shares a class
		* Each product node has an unqiue ID.

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
	<!-- Our Actions that Kwikecart.js will call on each related call -->
	<!-- Kwikecart will only send the unique id and quantity to the server -->
	<form method="post" action="./add" name="itemadd">
		<div class="itemFields">
			<input type="hidden" name="name" value="Worlds Best Item" />
			<input type="hidden" name="pid" value="3423" />
			<input type="hidden" name="price" value="45.00" />
			<input type="hidden" name="quantity" value="1" />
		</div>
		<button type="submit" name="addtocart">Add to Cart</button>
	</form>
	<form method="post" action="./remove" name="itemremove">
		<input type="hidden" name="id" value="3423" />
		<button type="submit" name="removecart">Remove</button>
	</form>
	<form method="get" action="./check" name="itemcheck">
	    	<input type="hidden" name="id" value="3423" />
	</form>
</li>

<!-- Checkout, ant fields defined here will be appended -->
<form method="get" action="./checkout" name="checkout"></form>

```
## Loading and Setup for DOJO 1.9+ ##
```js
require({
	baseUrl: 'js/'
}, ['js/kwikecart', 'dojo/ready'], 
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

If add an item thats aready in the cart without defining a quantity it is incremented by 1.
```js
cart.add('product-3423'); // +1
cart.add('product-3423');  // +1
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

DOM outline to item object:
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
Calling check() without a passed in ID will send the entire client cart to the server
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

Disable cookies by setting the expires option to -1. When building with cookie data each item
is added via add().

## Events ##

Before events are fired, obviously, before the action begins to process. Before events
must return true or the action will be halted. On events are fired at the end of action processing. 
Before callbacks will pass back the passed in items and quantity: function(items, quanitiy) {}

'On' callbacks will give back the passed in items and server response: function(items, res) {}

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