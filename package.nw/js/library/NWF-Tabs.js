NorlitWebFramework.define(function(global, $) {

	function tabInit(element) {
		var scroll = $('<div nwf-role="tab-scroll">');
		var left = $('<div nwf-role="tab-scroll-left">');
		var right = $('<div nwf-role="tab-scroll-right">');
		scroll.append(element.children());
		element.append(scroll);
		element.append(left);
		element.append(right);

		element.on('selectstart', function(event) {
			event.preventDefault();
		});
		element.on('wheel', function(event) {
			var target = element.find('[nwf-active]');
			var delta = event.deltaX || event.deltaY;
			if (delta < 0) {
				target = target.prev();
			} else {
				target = target.next();
			}
			if (target.length) {
				element.tab('select', target);
			}
		});
		element.on('mousedown', function(event) {
			var target = $(event.target);
			if (target.is(left)) {
				scrollTab(element, -200);
			} else if (target.is(right)) {
				scrollTab(element, 200);
			} else {
				if (target.matches('[nwf-role=tab-item]')) {
					element.tab('select', target);
				}
			}
		});
		$.$data(element[0], 'tab', {});
		scroll.draggable();
	}

	function scrollTab(element, offset) {
		element.find('[nwf-role=tab-scroll]').animatedPropertyOffset('scrollLeft', offset, Math.abs(offset));
	}

	$.prototype.tab = function(action, _0) {
		if (this.length === 1) {
			var tab = $.$data(this[0], 'tab');
			if (!tab) {
				tabInit(this);
			}
			switch (action) {
				case 'select':
					if (_0 === undefined) {
						return this.find('[nwf-active]');
					}
					if (typeof(_0) === 'number') {
						_0 = $(this.find('[nwf-role=tab-item]')[_0]);
					}
					if (_0.attr('nwf-active') === undefined) {
						this.find('[nwf-active]').removeAttr('nwf-active');
						_0.attr('nwf-active', '');
						this.trigger('select');
					}
					/* Adjust scrolling to keep the tab insight */
					var left = _0.left();
					var width = _0.width();
					var right = left + width;
					var scroll = this.find('[nwf-role=tab-scroll]');
					var scrollLeft = scroll[0].scrollLeft;
					var scrollWidth = scroll.width();
					var scrollRight = scrollLeft + scrollWidth;
					if (width > scrollWidth - 20) {
						scrollTab(this, left - scrollLeft);
					} else if (left < scrollLeft) {
						scrollTab(this, left - scrollLeft - 20);
					} else if (right > scrollRight) {
						scrollTab(this, right - scrollRight + 20);
					}
					break;
				case 'new':
					var ret = $('<div nwf-role="tab-item">');
					if (_0 === undefined) {
						this.find('[nwf-role=tab-scroll]').append(ret);
					} else {
						_0.after(ret);
					}
					return ret;
			}
		} else {
			for (var i = 0; i < this.length; i++) {
				$(this[i]).tab(action, _0);
			}
		}
		return this;
	}

	$(function() {
		$("[nwf-role=tab-bar]").tab();
	});

});