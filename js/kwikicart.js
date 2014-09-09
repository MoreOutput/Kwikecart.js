/* Rocky Bevins moreoutput@gmail.com, v0.0.5 */
define(['dojo/_base/lang', 'dojo/dom', 'dojo/dom-construct', 'dojo/query', 
	'dojo/_base/array', 'dojo/cookie', 'dojo/dom-class', 'dojo/on', 
	'dojo/_base/event', 'dojo/request', 'dojo/ready'], 
function(lang, dom, domC, query, arr, cookie, domClass, on, evt, request, ready) {
	'use strict';	
	var Cart = function (options) {	
		this.currentTotal = 0; // This is set when total() is called
		this.items = [];
		this.options = {
			expires: 1, // Cookie expiration
			taxMultiplier: 0.06,
			currency: 'USD',
			// Related DOM Data
			productNode: '.product',
			cartItems: '.cart-products',
			cartTotal: '.cart-total',
			idField: '[name=pid]',
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
			onCheck: null,
			onRemove: null,
			onClear: null,
			onCheckout: null,
			onAdd: null,
			onDecrement: null,
			onIncrement: null,
			onTotal: null,
			xhrObj: {handleAs: 'json'}
		};

		console.log('Constructor');

		return this;
	}

	Cart.prototype.create = function (options) {		
		var cart = this, 
		checkoutEvt,
		clearEvt,
		totalEvt;

		console.log('Call to create()');

		cart.options = lang.mixin(cart.options, options);

		if (typeof cookie('nacart') !== 'undefined') {	
			cart.setCartFromCookies(function () {
				arr.forEach(cart.items, function (item, i) {		
					cart.setupRemove(item);
				});
			});
		}			

		arr.forEach(query(cart.options.productNode), function(item) {
			var addEvt = on(query('#' + item.id + ' ' + cart.options.addForm)[0], 'submit', function(evt) {
 				evt.stopPropagation();
            	evt.preventDefault();

            	cart.add(item, addEvt);
			}),
			removeEvt = on(query('#' + item.id + ' ' + cart.options.removeForm)[0], 'submit', function(evt) {
 				evt.stopPropagation();
            	evt.preventDefault();
            	cart.remove(item, removeEvt);
			});
		});

		return cart;
	};

	// Outlines cart items from cookie information
	Cart.prototype.setCartFromCookies = function (fn) {
		var cart = this;	

		console.log('Call to setCartFromCookies()');

		if (cookie('nacart') !== 'null') {
			cart.items = JSON.parse(cookie('nacart'));
		} else {
			cart.items = [];
		}

		arr.forEach(cart.items, function (item, i) {
			cart.checkItemDOM(item.id, function (fnd) {
				if (!fnd) {
					cart.addToDOM(item);
				}
			});				
		});		

		fn();
	}; 	

	// Turn non obj item references to item objects based on dom data
	Cart.prototype.createItemObj = function (itemData) {
		console.log('Call to createItemObj()');
		return {
			id: (function() {
				if (!itemData.id) {
					console.log(222)
					return query(itemData).query('[name=pid]')[0].value;
				} else {
					return itemData.id;
				}
			}()),
			name: (function() {
				if (!itemData.name) {
					return query(itemData).query('[name=name]')[0].value;
				} else {
					return itemData.name;
				}
			}()),
			quantity: 1,
			price: (function() {
				if (!itemData.price) {
					return parseFloat(query(itemData).query('[name=price]')[0].value);
				} else {
					return parseFloat(itemData.price);
				}
			}())
		};
	};
	
	// Adds item to cart
	Cart.prototype.add = function (items, amountToAdd, callback) {		
		var cart = this,
		i = 0,
		add = true;

		console.log('Call to add()');

		if (typeof items === 'string' || (typeof items === 'object' && !items.length)) {
			items = [cart.createItemObj(items)];
		} else {
			arr.forEach(items, function(item, i) {
				items[i] = cart.createItemObj(item);
			});
		}

		if (typeof cart.options.onAdd === 'function') {
	   		add = cart.options.onAdd();
		}
		
		if (add === true) {
			if (items.length === 1 && !isNaN(amountToAdd) && amountToAdd > 0) {
				for (i; i < amountToAdd - 1; i += 1) {
					items.push(items[0]);
				}
			}

			arr.forEach(items, function(item, i)  {
				var node;
				cart.checkItemDOM(item.id, function (fnd) {
					var	cartNode = query(cart.options.cartItems);	

					if (!fnd) {
						cart.items.push(item);
						cart.addToDOM(item);
					} else {
						node = dom.byId(item.id);
						cart.increment(item);
						cart.total();
					}
				
					if (cookie('nacart')) {
						cookie('nacart', null, {expires: -1});
					}			

					cookie('nacart', JSON.stringify(cart.items), 
						{expires: cart.options.expires});

					if (domClass.contains(cartNode, 'hidden')) {
						domClass.toggle(cartNode, 'hidden');
					}
				});
			});
			
			if (cart.options.addAction) {
	      		request.post(query(cart.options.addForm)[0].action, cart.options.xhrObj).then(function(r) {
					console.log(r);
				});
	      	}
		}
		return cart;
	};

	// Confirm an item is in the DOM
	Cart.prototype.checkItemDOM = function (id, fn) {
		var checkNode = query(this.options.cartItems + ' .' + id)[0];

		console.log('Call to checkItemDOM()');

		if (checkNode !== undefined) {
			return fn(true);
		} else {
			return fn(false);
		}
	};		
	
	// increases the amount property of the item object in the cookie by 1
	Cart.prototype.increment = function (item, h) {
		var cart = this,
		increment = cart.options.incrementAction;

		console.log('Call to incremnent()');

		if (typeof cart.options.onIncrement === 'function') {
	   		increment = cart.options.onIncrement();
		}

		cart.items.forEach(function (item2) {
			if (item2.id === item.id) {
				item2.quantity = item2.quantity + 1;
				query(cart.options.cartItems + ' .' + item.id).query('[name=quantity]')[0].value = item2.quantity;

				if (increment) {
			      	request.post(query(cart.options.addForm)[0].action, cart.options.xhrObj).then(function(r) {
						console.log(r);
					});
				}

				cookie('nacart', JSON.stringify(cart.items), 
					{expires: cart.options.expires});
			}
		});			
	};

	Cart.prototype.remove = function (items, amountToRemove, callback) {
		var cart = this,
		remove = true;

		console.log('Call to remove()');

		if (typeof cart.options.onRemove === 'function') {
	   		remove = cart.options.onRemove();
		}

		if (remove === true) {
			if (arguments.length > 0 && (items.id !== undefined && typeof items === 'object')) {
				if (items.length === undefined) {
					items = [items];
				}

				arr.forEach(items, function(item, i)  {
					arr.forEach(cart.items, function (item2, j) {
						if (item2.id === item.id) {
							cart.items.splice(j, 1);	

							if (cart.items.length > 0) {
								cookie('nacart', JSON.stringify(cart.items), 
									{expires: cart.options.expires});
							} else {
								cookie('nacart', null, {expires: -1});
							}

						}
					});			
				
					cart.checkItemDOM(item.id, function (fnd) {
						if (fnd) {
							domC.destroy(query(cart.options.cartItems + ' .' + item.id)[0]);	
						}
					});		
				});
			} else {
				// Remove everything in the cart
				cart.items.forEach(function (item, j) {
					domC.destroy(query(cart.options.cartItems + ' .' + item.id)[0]);
				});

				cart.items = [];
				cookie('nacart', null, {expires: -1});
			}

			if (cart.options.removeAction === true) {
				request.post(query(cart.options.removeForm)[0].action, cart.options.xhrObj).then(function(r) {
					console.log(r);
				});
		    }
		}
	};

	// decreases the amount property of the item object in the cookie by 1
	Cart.prototype.decrement = function (item, h) {
		var cart = this,
		decrement = cart.options.decrementAction;

		console.log('Call to decrement()');

		if (typeof cart.options.onDecrement === 'function') {
	   		decrement = cart.options.onDecrement();
		}

		cart.items.forEach(function (item2) {
			if (item2.id === item.id) {
				item2.quantity = item2.quantity + 1;

				if (item2.quantity < 0) {
					item2.quantity = 0;
				}

				if (decrement) {
			      	request.post(query(cart.options.removeForm)[0].action, cart.options.xhrObj).then(function(r) {
						console.log(r);
					});
				}

				cookie('nacart', JSON.stringify(cart.items), 
					{expires: cart.options.expires});
			}
		});			
	};
	
	Cart.prototype.addToDOM = function (item) {	
		var qNode = query('#' + item.id + '_quantity'),
		itemTotal = query(this.options.cartItems + ' li').length;	

		console.log('Call to addToDom()');
	
		if (qNode.length === 0) {	
			domC.create('li', {
			className: item.id,
			innerHTML: '<div class="title">' + item.name + '</div>' +  
				'<input type="hidden" name="name" value="' + item.name + '" />' + 
				'<input type="hidden" name="pid" value="' + item.id + '" />' + 
				'<input name="amount" type="hidden" value="' + item.price + '" />' + 
				'<input id="' + item.id + 
				'_quantity" type="text" name="quantity" value="' + item.quantity + '" /><div class="price">' + 
				item.price + '</div>' + 
				'<input name="price" type="hidden" value="' + item.price 
				+ '" />' + '<a id="' + item.id + '_remove" href="">Remove</a>'}, 
				query(this.options.cartItems)[0], 'end');		
			
			this.total();
			this.setupRemove(item);
		}			
	};
	
	// item id is used to setup the remove button.
	Cart.prototype.setupRemove = function (item) {		
		var cart = this,
		h = on(dom.byId(item.id + '_remove'), 'click', function(e) {
			e.preventDefault();
			cart.remove(item, h);
			cart.total();
		});					

		console.log('Call to setupRemove()');
	};

	// totals the cart
	Cart.prototype.total = function () {
		var total = 0,
		cart = this;

		this.items.forEach(function (item, i) {
			total = total + parseFloat(item.price * item.quantity);
			cart.currentTotal = total;		
		});
		
		dom.byId('total').value = total;
		
		this.cartTotal = total;

		console.log('Call to total()');

		return cart;
	};
	
	return new Cart();
});