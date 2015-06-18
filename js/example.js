require({
	baseUrl: '/js/'
}, ['js/kwikecart.dojo', 'dojo/query', 'dojo/dom-construct', 'dojo/dom-class', 'dojo/ready'],
function(kwikecart, query, domConstruct, cssClass, ready) {
	'use strict';
	ready(function () {
		var products = [
			{ id: '3423', name: 'Product1', quantity: 1, price: 45.00},
			{ id: '1423', name: 'Product2', quantity: 1, price: 15.00}
		],
		addItemToSidebar = function(itemObj) {
			cart.find(itemObj.id, function(fndItem, fndIndex) {
				var htmlStr = '<div class="cart-item col-md-2" id="cart-' + itemObj.id + '">'
					+ '<div>' + itemObj.name + '</div>'
					+ '<div class="quantity">' + itemObj.quantity + '</div>'
					+ '</div>';

				if (query('#cart-' + itemObj.id).length > 0) {
					domConstruct.place(htmlStr, query('#cart-' + itemObj.id)[0], 'replace');
				} else {
					domConstruct.place(htmlStr, query('.cart-products')[0], 'last');
				}
			});
		},
		removeItemFromSidebar = function(itemObj) {
			if (query('#cart-' + itemObj.id).length > 0) {
				domConstruct.destroy(query('#cart-' + itemObj.id)[0]);
			}
		},
		// Setting up the store, and creating a cart for the user
		cart = kwikecart.init({
			expires: -1,
			productNode: '.product',
			onFirst: function(item) {
				// unhide the checkout button
				console.log('onFirst');
				cssClass.remove(query('#checkoutfrm')[0], 'hidden');
			},
			onEmpty: function() {
				console.log('onEmpty');
				cssClass.add(query('#checkoutfrm')[0], 'hidden');
			},
			beforeAdd: function(items, quantityToAdd) {
				console.log('beforeAdd');
				return true;
			},
			onAdd: function(item, response) {
				console.log('onAdd');
				if (item) {
					addItemToSidebar(item);
				}
			},
			beforeRemove: function(items, quantityToRemove) {
				console.log('beforeRemove');
				return true;
			},
			onRemove: function(item, response) {
				console.log('onRemove');
				if (item) {
					removeItemFromSidebar(item);
				}
			},
			onIncrement: function(item, response) {
				console.log('onIncrement');
			},
			onDecrement: function(item, response) {
				console.log('onDecrement');
			},
			onClear: function(clearedCookies, response) {
				console.log('onClear');
				cssClass.add(query('#checkoutfrm')[0], 'hidden');
			}
		});

		console.log(cart.items);
		//cart.clear(true);

		//cart.check('3423');

		// Removing, in .product expected form name: itemremove
		//cart.remove('product-3423'); // Fully removes product
		//cart.remove(products); // Fully removes product set
		//cart.remove(); // Fully removes all products
		//cart.remove(false); // Removes all but keeps cookie data
		// Decrement, in .product expected form name: itemadd
		//cart.remove('product-3423', 1);

		// Data Checking, in .product expected form name: itemcheck
		//cart.check('product-3423'); // Get item data from server
		//cart.check('product-3423', false); // Get item data from markup

		// Totaling, expected form name: totalcart
		//cart.total(); // From DOM data
		//cart.total(true); // From server

		// Checkout, expected form name: checkout
		//cart.checkout() // Routing to next area
	});
});
