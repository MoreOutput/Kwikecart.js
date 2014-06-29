/* ECART
Rocky Bevins moreoutput@gmail.com, v0.0.1 */
define(['dojo/_base/lang', 'dojo/dom', 'dojo/dom-construct', 'dojo/query', 
	'dojo/_base/array', 'dojo/cookie', 'dojo/dom-class', 'dojo/on', 
	'dojo/_base/event', 'dojo/request', 'dojo/ready'], 
function(lang, dom, domC, query, arr, cookie, domClass, on, evt, request, ready) {
	'use strict';	
	var Cart = function (options) {
				
		this.currentTotal = 0; // This is only set when total() is ran
		this.items = [];
		this.options = {
			expires: 1,
			taxMultiplier: 0.06,
			currency: 'USD',
			productNode: '.product',
			cartItems: '.cart-products',
			cartTotal: '.cart-total',
			addForm: '[name=itemaddform]',
			removeForm: '[name=itemremoveform]',
			checkForm: '[name=itemcheckform]',
			clearForm: '[name=clearcartform]',
			totalForm: '[name=totalcartform]',
			checkoutForm: '[name=checkoutform]',
			addAction: true,
			checkoutAction: true,
			removeAction: true,
			clearAction: true,
			totalAction: true,
			incrementAction: true,
			decrementAction: true,
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

		return this;
	}

	Cart.prototype.create = function (options) {		
		var cart = this, 
		checkoutEvt,
		clearEvt,
		totalEvt;

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
	Cart.prototype.setCartFromCookies = function (fn){
		var cart = this;	

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
		return {
			id: (function() {
				if (query(itemData).query('[name=name]').length > 0) {
					return query(itemData).query('[name=name]')[0].value;
				} else {
					return itemData.id;
				}
			}()),
			name: (function() {
				if (query(itemData).query('[name=name]').length > 0) {
					return query(itemData).query('[name=name]')[0].value;
				} else {
					return itemData.name;
				}
			}()),
			quantity: 1,
			price: (function() {
				if (query(itemData).query('[name=price]').length > 0) {
					return parseFloat(query(itemData).query('[name=price]')[0].value);
				} else {
					return parseFloat(itemData.price);
				}
			}())
		};
	}
	
	// Adds item to cart
	Cart.prototype.add = function (items, amountToAdd, evt) {		
		var cart = this,
		add = true;

		if (typeof items === 'string') {
			items = [cart.createItemObj(items)];
		} else if (typeof items === 'object' && items.length === undefined) {
			items = [items];
		}

		if (typeof cart.options.onAdd === 'function') {
	   		add = cart.options.onAdd();
		}
		
		if (add === true) {
			if (amountToAdd > 0) {
				arr.forEach(amountToAdd, function(item, i) {
					console.log('s')
				});
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
					    
	      	request.post(query(cart.options.addForm)[0].action, cart.options.xhrObj).then(function(r) {
				console.log(r);
			});
	}
		return cart;
	};

	// Confirm an item is in the DOM
	Cart.prototype.checkItemDOM = function (id, fn) {
		var checkNode = query(this.options.cartItems + ' .' + id)[0];

		if (checkNode !== undefined) {
			return fn(true);
		} else {
			return fn(false);
		}
	};		
	
	// increases the amount property of the item object in the cookie by 1
	Cart.prototype.increment = function (item, h) {
		var cart = this,
		increment = true;

		if (typeof cart.options.onIncrement === 'function') {
	   		increment = cart.options.onIncrement();
		}

		cart.items.forEach(function (item2) {
			if (item2.id === item.id) {
				item2.quantity = item2.quantity + 1;
				cookie('nacart', JSON.stringify(cart.items), 
					{expires: cart.options.expires});
			}
		});			
	};

	Cart.prototype.remove = function (items, amountToAdd, evt) {
		var cart = this,
		remove = true;

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
	}

	// decreases the amount property of the item object in the cookie by 1
	Cart.prototype.decrement = function (item, h) {
		var cart = this,
		decrement = true;

		if (typeof cart.options.onDecrement === 'function') {
	   		decrement = cart.options.onDecrement();
		}

		cart.items.forEach(function (item2) {
			if (item2.id === item.id) {
				item2.quantity = item2.quantity + 1;

				if (item2.quantity < 0) {
					item2.quantity = 0;
				}

				cookie('nacart', JSON.stringify(cart.items), 
					{expires: cart.options.expires});
			}
		});			
	};
	
	Cart.prototype.addToDOM = function (item) {	
		var qNode = query('#' + item.id + '_quantity'),
		itemTotal = query(this.options.cartItems + ' li').length;	
	
		if (qNode.length === 0) {	
			domC.create('li', {
			className: item.id,
			innerHTML: '<div class="title">' + item.name + '</div>' +  
				'<input type="hidden" name="item_name_' + (itemTotal + 1) + 
				'" value="' + item.name + '" />' + 
				'<input type="hidden" name="item_number_' + (itemTotal + 1) + 
				'" value="' + item.id + '" />' +	'<input name="amount_' + 
				(itemTotal + 1) + '" type="hidden" value="' + item.price + 
				'" />' + '<input id="' + item.id + 
				'_quantity" type="text" name="quantity_' + (itemTotal + 1) + 
				'" value="' + item.quantity + '" /><div class="price">' + 
				item.price + '</div>' + 
				'<input name="itemprice" type="hidden" value="' + item.price 
				+ '" />' + '<a id="' + item.id +
				'_remove" href="">Remove</a>'}, query(this.options.cartItems)[0], 'end');		
			
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

		return cart;
	};

	Cart.prototype.clearCart = function (fn) {
		cookie('nacart', null, {expires: -1});
	
		if (typeof fn === 'function') {
			return fn();
		}

		return this;
	}
	
	return new Cart();
});