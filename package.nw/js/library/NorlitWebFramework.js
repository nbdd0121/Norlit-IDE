(function(global) {
	var newElementContainer = document.createElement('body');

	function constructNode(html) {
		newElementContainer.innerHTML = html;
		var nodes = Array.prototype.slice.call(newElementContainer.childNodes);
		newElementContainer.innerHTML = '';
		return nodes;
	}

	/**
	 * Main entrance of NorlitWebFramework. Takes
	 * one argument. If the argument is function,
	 * the function will be executed after window
	 * is ready. If the argument is string, it will
	 * be evaluated as a selector or a html string.
	 * otherwise, it is regarded as a html element
	 */
	function $(selector) {
		if (typeof(selector) === 'number') {
			this.length = selector;
			return;
		}
		if (selector instanceof $) {
			return selector;
		}
		if (typeof(selector) === 'function') {
			if (document.readyState !== 'loading')
				selector();
			else
				$(document).one('DOMContentLoaded', selector);
			return;
		}
		var nodes;
		if (typeof(selector) === 'string') {
			if (selector === '') {
				nodes = [];
			} else if (selector[0] === '<') {
				nodes = constructNode(selector);
			} else {
				nodes = document.querySelectorAll(selector);
			}
		} else {
			nodes = [selector];
		}
		return $.$init(nodes);
	}

	/**
	 * Initialize an instance
	 */
	$.$init = function(list) {
		var object = new $(list.length);
		for (var i = 0; i < list.length; i++) {
			object[i] = list[i];
		}
		return object;
	};

	/**
	 * Get element-local storage, used to store
	 * some NorlitWebFramework internal properties
	 */
	$.$data = function(element, item, value) {
		if (!element.$nwf) {
			element.$nwf = {
				event: Object.create(null)
			};
		}
		if (value === undefined) {
			return element.$nwf[item];
		} else {
			element.$nwf[item] = value;
		}
	}

	/*
	 * Some utility function from Array.prototype.
	 * This enable the display of instance as array
	 * under console
	 */
	$.prototype.splice = Array.prototype.splice;

	$.prototype.focus = function() {
		if (this.length != 0)
			this[0].focus();
	};

	$.$modules = Object.create(null);

	function resolveModule(name) {
		/* For any module in the table */
		for (var i in $.$modules) {
			var item = $.$modules[i];

			/* If the module is already resolved */
			if (item === true) continue;

			/* If the module depends on this module */
			var index = item.dep.indexOf(name);
			if (index !== -1) {
				item.dep.splice(index, 1);

				/* If all dependency is resolved */
				if (item.dep.length === 0) {
					item.module(global, $);
					$.$modules[i] = true;
					resolveModule(i);
				}
			}
		}
	}

	$.define = function(name, dep, module) {
		/* If dep is ignored */
		if (module === undefined) {
			if (dep === undefined) {
				name(global, $);
				return;
			}
			module = dep;
			dep = [];
		}
		/* Desugar if dependency is a single module */
		if (typeof(dep) === 'string') {
			dep = [dep];
		}

		/* Find all unresolved dependency */
		var unresolvedDep = [];
		for (var i = 0; i < dep.length; i++) {
			var mod = $.$modules[dep[i]];
			if (mod !== true) {
				unresolvedDep.push(dep[i]);
			}
		}

		if (unresolvedDep.length === 0) {
			/* If we can resolve this, recursively resolve modules */
			module(global, $);
			$.$modules[name] = true;
			resolveModule(name);
		} else {
			/* If we can't, add it to module list */
			$.$modules[name] = {
				dep: unresolvedDep,
				module: module
			};
		}
	}

	global.NorlitWebFramework = $;

	if (!global.$) {
		global.$ = NorlitWebFramework;
	}

})(window);

/**
 * NorlitWebFramework event plugin
 */
NorlitWebFramework.define('event', function(global, $) {
	$.$eventHook = Object.create(null);

	$.prototype.on = function(event, handler) {
		if ($.$eventHook[event]) {
			var ret = $.$eventHook[event].call(this, handler);
			if (ret !== undefined) {
				return ret;
			}
		}
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			var storage = $.$data(item, 'event');
			if (!storage[event]) {
				storage[event] = [];
			}
			storage[event].push(handler);
			item.addEventListener(event, handler);
		}
		return this;
	};

	$.prototype.off = function(event, handler) {
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			var storage = $.$data(item, 'event');
			var eventGroup = storage[event];
			if (!eventGroup) {
				return;
			}
			if (handler !== undefined) {
				var index = eventGroup.indexOf(handler);
				if (index !== -1) {
					eventGroup.splice(index, 1);
					item.removeEventListener(event, handler);
				}
			} else {
				for (var j = 0; j < eventGroup.length; j++) {
					item.removeEventListener(event, eventGroup[j]);
				}
			}
		}
		return this;
	};

	$.prototype.one = function(event, handler) {
		var that = this;

		function listener(e) {
			that.off(event, listener);
			return handler(e);
		}
		this.on(event, listener);
		return this;
	};

	$.prototype.trigger = function(event) {
		var eventObj = document.createEvent('Event');
		eventObj.initEvent(event, true, true);
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			item.dispatchEvent(eventObj);
		}
		return this;
	};

	$.$eventShorthand = function(shorthand, event) {
		$.prototype[shorthand] = function(handler) {
			if (handler !== undefined) {
				return this.on(event, handler);
			} else {
				return this.trigger(event);
			}
		};
	}
	$.$eventShorthand('click', 'click');
	$.$eventShorthand('keydown', 'keydown');
	$.$eventShorthand('keypress', 'keypress');
});

/**
 * NorlitWebFramework CSS plugin
 */
NorlitWebFramework.define('css', function(global, $) {
	$.prototype.css = function(attr, value) {
		if (value === undefined) {
			var ret = "";
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
				ret += getComputedStyle(item).getPropertyValue(attr);
			}
			return ret;
		} else {
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
				item.style.setProperty(attr, value);
			}
			return this;
		}
	};

	$.prototype.show = function() {
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			item.style.display = 'initial';
			if (item.style.display !== 'initial')
				item.style.display = 'block';
		}
		return this;
	};

	$.prototype.hide = function() {
		this.css('display', 'none');
		return this;
	};

	$.prototype.isVisible = function() {
		for (var i = 0; i < this.length; i++) {
			if ($(this[i]).css('display') !== 'none') {
				return true;
			}
		}
		return false;
	}
});

/**
 * NorlitWebFramework attribute plugin
 */
NorlitWebFramework.define('attr', function(global, $) {
	$.prototype.attr = function(attr, value) {
		if (value === undefined) {
			/* We return undefined if no element is in set */
			if (!this.length) {
				return;
			}
			/* 1-element fast path */
			if (this.length === 1) {
				var ret = this[0].getAttribute(attr);
				if (ret === null)
					return undefined;
			}
			var ret = "";
			for (var i = 0; i < this.length; i++) {
				ret += this[i].getAttribute(attr) || '';
			}
			return ret;
		} else {
			for (var i = 0; i < this.length; i++) {
				var item = this[i];
				item.setAttribute(attr, value);
			}
			return this;
		}
	};

	$.prototype.removeAttr = function(attr) {
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			item.removeAttribute(attr);
		}
		return this;
	};

	$.prototype.prop = function(attr, value) {
		/* Getter */
		if (value === undefined) {
			/* We return undefined if no element is in set */
			if (!this.length) {
				return;
			}
			/* 1-element fast path */
			if (this.length === 1) {
				return this[0][attr];
			}
			var ret = "";
			for (var i = 0; i < this.length; i++) {
				ret += this[i][attr];
			}
			return ret;
		} else {
			for (var i = 0; i < this.length; i++) {
				this[i][attr] = value;
			}
			return this;
		}
	};

	function buildWellKnowAttr(name, attr) {
		$.prototype[name] = function(value) {
			if (value !== undefined) {
				return this.attr(attr, value);
			} else {
				return this.attr(attr);
			}
		};
	}

	function buildWellKnowProperty(name, attr) {
		$.prototype[name] = function(value) {
			if (value !== undefined) {
				return this.prop(attr, value);
			} else {
				return this.prop(attr);
			}
		};
	}
	buildWellKnowProperty('val', 'value');
	buildWellKnowProperty('text', 'textContent');
	buildWellKnowProperty('html', 'innerHTML');
});

/**
 * NorlitWebFramework DOM plugin
 */
NorlitWebFramework.define('dom', function(global, $) {

	/* matches is widely supported though with prefix. */
	var matches =
		Element.prototype.matches ||
		Element.prototype.matchesSelector ||
		Element.prototype.msMatchesSelector ||
		Element.prototype.mozMatchesSelector ||
		Element.prototype.webkitMatchesSelector ||
		Element.prototype.oMatchesSelector;

	$.prototype.matches = function(selector) {
		for (var i = 0; i < this.length; i++) {
			if (!matches.call(this[i], selector)) {
				return false;
			}
		}
		return true;
	}

	$.prototype.is = function(val) {
		if (this.length !== val.length)
			return false;
		for (var i = 0; i < this.length; i++) {
			if (this[i] !== val[i])
				return false;
		}
		return true;
	}

	$.prototype.filter = function(selector) {
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			if ($(this[i]).matches(selector)) {
				ret.push(this[i]);
			}
		}
		return $.$init(ret);
	}

	/**
	 * Append content to the first element in the set
	 */
	$.prototype.append = function(content) {
		if (this.length === 0)
			return this;
		content = $(content);
		for (var j = 0; j < content.length; j++)
			this[0].appendChild(content[j]);
		return this;
	}

	$.prototype.before = function(content) {
		if (this.length === 1) {
			var element = this[0];
			for (var i = content.length - 1; i >= 0; i--) {
				element.parentNode.insertBefore(content[i], element);
			}
		} else {
			throw new Error('TODO')
		}
		return this;
	}

	$.prototype.after = function(content) {
		if (this.length === 1) {
			var element = this[0];
			var sibling = element.nextSibling;
			if (sibling) {
				for (var i = 0; i < content.length; i++) {
					element.parentNode.insertBefore(content[i], sibling);
				}
			} else {
				for (var i = 0; i < content.length; i++) {
					element.parentNode.appendChild(content[i]);
				}
			}
		} else {
			throw new Error('TODO')
		}
		return this;
	}

	$.prototype.parent = function() {
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			var parent = this[i].parentNode;
			if (parent)
				ret.push(parent);
		}
		return $.$init(ret);
	}

	$.prototype.find = function(selector) {
		/* 1-element fast path */
		if (this.length === 1) {
			return $.$init(this[0].querySelectorAll(selector));
		}
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			Array.prototype.push.apply(ret, this[i].querySelectorAll(selector));
		}
		return $.$init(ret);
	}

	$.prototype.children = function(selector) {
		if (selector !== undefined) {
			return this.children().filter(selector);
		}
		/* 1-element fast path */
		if (this.length === 1) {
			return $.$init(this[0].children);
		}
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			Array.prototype.push.apply(ret, this[i].children);
		}
		return $.$init(ret);
	};

	$.prototype.remove = function() {
		for (var i = 0; i < this.length; i++) {
			var item = this[i];
			if (item.parentNode)
				item.parentNode.removeChild(item);
		}
		return this;
	};

	$.prototype.prev = function() {
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			var item = this[i].previousElementSibling;
			if (item)
				ret.push(item);
		}
		return $.$init(ret);
	};

	$.prototype.next = function() {
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			var item = this[i].nextElementSibling;
			if (item)
				ret.push(item);
		}
		return $.$init(ret);
	};

	$.prototype.clone = function() {
		var ret = [];
		for (var i = 0; i < this.length; i++) {
			ret.push(this[i].cloneNode(true));
		}
		return $.$init(ret);
	};
});

/**
 * NorlitWebFramework dimension plugin
 */
NorlitWebFramework.define('dimension', 'css', function(global, $) {
	$.prototype.offset = function(offset) {
		if (offset === undefined) {
			if (this.length === 0) {
				return;
			} else {
				var rect = this[0].getBoundingClientRect();
				return {
					top: rect.top + document.body.scrollTop,
					left: rect.left + document.body.scrollLeft
				};
			}
		} else {
			throw new Error('TODO');
		}
	}

	$.prototype.position = function(position) {
		if (position === undefined) {
			if (this.length === 0) {
				return;
			} else {
				return {
					top: this[0].offsetTop,
					left: this[0].offsetLeft
				};
			}
		} else {
			this.top(position.top);
			this.left(position.left);
		}
	}

	/**
	 * Get width for the first element or set the width for each element
	 */
	$.prototype.width = function(width) {
		if (width === undefined) {
			if (this.length === 0)
				return 0;
			return this[0].offsetWidth;
		} else {
			if (typeof(width) === 'number') {
				width = width + 'px';
			}
			return this.css('width', width);
		}
	}

	$.prototype.height = function(height) {
		if (height === undefined) {
			if (this.length === 0)
				return 0;
			return this[0].offsetHeight;
		} else {
			if (typeof(height) === 'number') {
				height = height + 'px';
			}
			return this.css('height', height);
		}
	}

	$.prototype.top = function(top) {
		if (top === undefined) {
			if (this.length === 0)
				return 0;
			return this[0].offsetTop;
		} else {
			if (typeof(top) === 'number') {
				top = top + 'px';
			}
			return this.css('top', top);
		}
	}

	$.prototype.left = function(left) {
		if (left === undefined) {
			if (this.length === 0)
				return 0;
			return this[0].offsetLeft;
		} else {
			if (typeof(left) === 'number') {
				left = left + 'px';
			}
			return this.css('left', left);
		}
	}
});

/**
 * NorlitWebFramework escape plugin
 */
NorlitWebFramework.define('escape', 'attr', function(global, $) {
	var escaper = $('<span>');

	$.escape = function(text) {
		escaper.text(text);
		var ret = escaper.html().replace('\n', '<br/>');
		escaper.text('');
		return ret;
	}
});

/**
 * NorlitWebFramework scroll module
 */
NorlitWebFramework.define('scroll', function(global, $) {
	$.prototype.scrollX = function(offset) {
		for (var i = 0; i < this.length; i++) {
			this[i].scrollLeft += offset;
		}
	}

	$.prototype.animatedPropertyOffset = function(prop, offset, time) {
		var orig = parseFloat(this.prop(prop));
		var i = 0;
		var that = this;
		var interval = setInterval(function() {
			i += 40;
			if (i < time) {
				that.prop(prop, orig + offset * i / time);
			} else {
				that.prop(prop, orig + offset);
				clearInterval(interval);
			}
		}, 40);
	}
});