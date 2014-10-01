define(['dojo/_base/lang', 'dojo/query','dojo/_base/array', 'dojo/cookie', 'dojo/on', 
	'dojo/request', 'dojo/dom-form', 'dojo/io-query', 'dojo/ready'], 
function(lang, query, arr, cookie, on, request, domForm, ioQuery, ready) {
	'use strict';	
	var Cart = function (options) {	
		this.currentTotal = 0; // This is set when total() is called
		this.items = [];
		this.options = {
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
			incrementAction: true, 
			decrementAction: true,
			// Before events -- must return true before an item is added
			beforeCheck: null,
			beforeRemove: null,
			beforeClear: null,
			beforeCheckout: null,
			beforeAdd: null,
			beforeDecrement: null,
			beforeIncrement: null,
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
		};

		return this;
	}

	Cart.prototype.create = function (options) {		
		var cart = this;

		cart.options = lang.mixin(cart.options, options);

		if (typeof cookie('nacart') !== 'undefined') {
			cart.setupCartFromCookies();
		}			

		arr.forEach(query(cart.options.productNode), function(item) {
			var addEvt = on(query('#' + item.id + ' ' + cart.options.addForm)[0], 'submit', function(evt) {
 				evt.stopPropagation();
            	evt.preventDefault();

            	cart.add(item);
			}),
			removeEvt = on(query('#' + item.id + ' ' + cart.options.removeForm)[0], 'submit', function(evt) {
 				evt.stopPropagation();
            	evt.preventDefault();
            	cart.remove(item);
			});
		});

		return cart;
	};

	// Outlines cart items from cookie information
	Cart.prototype.setupCartFromCookies = function (callback) {
		var cart = this;	

		if (cookie('nacart') !== 'null') {
			cart.items = JSON.parse(cookie('nacart'));
		} else {
			cart.items = [];
		}	

		if (typeof callback === 'function') {
			callback();
		} 
	}; 	

	// Turn non obj item references to item objects based on dom data
	Cart.prototype.createItemObj = function (itemData) {
		var cart = this;

		if (typeof itemData === 'string') {
			itemData = query('#' + itemData);
		} else if (itemData.length === undefined) {
			itemData = query('#' + itemData.id);
		}

		return {
			id: itemData.query(cart.options.idField)[0].value,
			name: itemData.query(cart.options.nameField)[0].value,
			quantity: parseInt(itemData.query(cart.options.quantityField)[0].value),
			price: parseFloat(itemData.query(cart.options.priceField)[0].value)
		};
	};

	Cart.prototype.set = function(items, quantity, callback) {
		var cart = this,
		i = 0;

		if (typeof items === 'string' || (typeof items === 'object' && !items.length)) {
			items = [cart.createItemObj(items)];
		} else {
			arr.forEach(items, function(item, i) {
				items[i] = cart.createItemObj(item);
			});
		}
		
		arr.forEach(items, function(item, i)  {
			cart.find(item.id, function (fndItem, fndIndex) {
				if (fndItem === null) {
					if (quantity && quantity > 1) {
						item.quantity = quantity;
					}

					cart.items.push(item);
				} else {
					item = fndItem;
					
					if (quantity === -1) {
						item.quantity = 0;
					} else {
						item.quantity = parseInt(item.quantity) + quantity;
					}
					
				}

				if (item.quantity <= 0) {
					cart.items.splice(fndIndex, 1);
				}

				callback(item, true);
			
				if (cookie('nacart')) {
					cookie('nacart', null, {expires: -1});
				}			

				cookie('nacart', JSON.stringify(cart.items), 
					{expires: cart.options.expires});
			});
		});

		return cart;
	}	

	Cart.prototype.add = function (items, quantity, callback) {		
		var cart = this,
		add = true;

		if (typeof cart.options.beforeAdd === 'function') {
	   		add = cart.options.beforeAdd(items, quantity);
		}

		if (add === true) {
			if (items.quantity >= 0) {
				quantity = items.quantity;
			} else if (typeof quantity === 'function') {
				callback = quantity;
				quantity = -1;
			} else if (!quantity || quantity <= 0) {
				quantity = -1;
			}

			cart.set(items, quantity, function(item, increment) {
				if (cart.options.addAction) {
					cart.options.xhrObj.data = domForm.toObject(query('#' + item.id).query(cart.options.addForm)[0]);

		      		request.post(query(cart.options.addForm)[0].action + '?' + ioQuery.objectToQuery(cart.options.xhrObj.data) 
		      			+ '&quantity=' + item.quantity + '&increment=' + increment, cart.options.xhrObj).then(function(r) {
		      			if (typeof cart.options.onAdd === 'function') {
							if (typeof callback !== 'function') {
   								cart.options.onAdd(item, r);
   							} else {
   								cart.options.onAdd(item, r);
   								callback(item, r);
   							}
						}
						cart.total();
					});
		      	} else {
		      		cart.total();
		      		
		      		if (typeof callback === 'function') {
						callback(item, r);
					}
		      	}
			});
		}

		return cart;
	};

	Cart.prototype.find = function (id, callback) {
		var cart = this;

		if (cart.items.length !== 0) {
			arr.forEach(cart.items, function (item, i) {
				if (id === item.id) {
					if (typeof callback === 'function') {
						return callback(item, i);
					} else {
						return item;
					}
				}

				if (i === cart.items.length - 1) {
					if (typeof callback === 'function') {
						return callback(null);
					} else {
						return null;
					}
				}
			});	
		} else {
			if (typeof callback === 'function') {
				return callback(null);
			} else {
				return null;
			}
		}
	};		

	Cart.prototype.remove = function (items, quantity, callback) {
		var cart = this,
		remove = true;

		if (arguments.length > 0) {
			if (typeof cart.options.beforeRemove === 'function') {
		   		remove = cart.options.beforeRemove(items, quantity);
			}

			if (remove === true) {
				if (quantity > 0) {
					quantity = -Math.abs(quantity);
				} else if (typeof quantity === 'function') {
					callback = quantity;
					quantity = -1;
				} else if (!quantity) {
					quantity = -1;
				}

				cart.set(items, quantity, function(item, decrement) {
					if (cart.options.removeAction) {
						cart.options.xhrObj.data = domForm.toObject(query('#' + item.id).query(cart.options.removeForm)[0]);

			      		request.post(query(cart.options.removeForm)[0].action + '?' + ioQuery.objectToQuery(cart.options.xhrObj.data) 
			      			+ '&quantity=' + item.quantity + '&decrement=' + decrement, cart.options.xhrObj).then(function(r) {
			      			if (typeof cart.options.onRemove === 'function') {
								if (typeof callback !== 'function') {
	   								cart.options.onRemove(item, r);
	   							} else {
	   								cart.options.onRemove(item, r);
	   								callback(item, r);
	   							}
							}
							cart.total();
						});
			      	} else {
			      		cart.total();
			      		
			      		if (typeof callback === 'function') {
							callback(item, r);
						}
			      	}
				});
			}
		} else {
			cart.clear();
		}

		return cart;
	};

	Cart.prototype.clear = function(clearCookies) {
		var cart = this,
		clear = true;

		if (typeof cart.options.beforeClear === 'function') {
	   		clear = cart.options.beforeClear(items, quantity);
		}

		if (clear === true) {
			cart.currentTotal = 0;

			arr.forEach(cart.items, function(item, i)  {
				query('#' + item.id).query(cart.options.quantityField)[0].value = 1;
			});	

			cart.items = [];

			if (cart.options.clearAction === true) {
				request.post(query(cart.options.clearForm)[0].action, cart.options.xhrObj).then(function(r) {
					if (typeof cart.options.onClear === 'function') {
						if (typeof callback !== 'function') {
								cart.options.onClear(item, r);
							} else {
								callback(item, r);
							}
					}
					cart.total();
				});
		    } else {
		    	cart.total();
		    	if (typeof callback === 'function') {
					callback(item, r);
				}
		    }

		    if (clearCookies !== false) {
		    	cookie('nacart', null, {expires: -1});
		    }
		}
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
	
	return new Cart();
});