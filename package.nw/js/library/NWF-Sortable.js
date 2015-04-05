NorlitWebFramework.define(function(global, $) {

	function getCSSText(style) {
		if (style.cssText)
			return style.cssText;
		var ret = '';
		for (var i = 0; i < style.length; i++) {
			ret += style[i] + ": " + style.getPropertyValue(style[i]) + "; ";
		}
		return ret;
	}

	function reposition(target, container, offsetX) {
		var children = container.children();
		for (var i = 0; i < children.length; i++) {
			var item = $(children[i]);
			if (item.is(target))
				break;
			var left = item.left();
			var width = item.width();
			if (offsetX <= left + width / 2) {
				if (item.prev().is(target)) {
					return;
				}
				item.css('position', 'relative');
				item.left(-120);
				item.css('transition', '0.2s');
				setTimeout(function() {
					item.left(0);
				}, 0);
				setTimeout(function() {
					item.css('position', '');
					item.css('transition', '');
					item.left('');
				}, 200);

				item.before(target);
				return;
			}
		}
		for (var i = children.length - 1; i >= 0; i--) {
			var item = $(children[i]);
			if (item.is(target))
				break;
			var left = item.left();
			var width = item.width();
			if (offsetX >= left + width / 2) {
				if (item.next().is(target)) {
					return;
				}
				item.css('position', 'relative');
				item.left(120);
				item.css('transition', '0.2s');
				setTimeout(function() {
					item.left(0);
				}, 0);
				setTimeout(function() {
					item.css('position', '');
					item.css('transition', '');
					item.left('');
				}, 200);

				item.after(target);
				return;
			}
		}
	}

	$.prototype.draggable = function() {
		var that = this;
		this.on("mousedown", function(event) {
			if (event.which !== 1)
				return;
			event.preventDefault();

			/* Target of resizing */
			var target = $(event.target);
			var helper = null;

			var originalPosition = target.position();
			var originalOffset = target.offset();
			var oriX = event.clientX;
			var oriY = event.clientY;

			var scrollingTimer = 0;

			$.glasspane.show();

			function move(event) {
				if (event.which !== 1) {
					mouseup(event);
					return;
				}
				event.preventDefault();
				if (!helper) {
					if (Math.abs(event.clientX - oriX) > 10 ||
						Math.abs(event.clientY - oriY) > 10) {
						helper = target.clone();
						/* Clone whole computed css */
						helper[0].style.cssText = getCSSText(getComputedStyle(target[0]));
						helper.css('position', 'absolute');
						helper.position(originalOffset);

						target.css('visibility', 'hidden');

						$.glasspane.append(helper);
					}
				}
				if (helper) {
					helper.position({
						left: originalOffset.left + event.clientX - oriX,
						top: originalOffset.top + event.clientY - oriY
					});

					//var offsetX = originalPosition.left + event.clientX - oriX;
					var offsetX = event.clientX - that.offset().left + that[0].scrollLeft;
					if (offsetX < that[0].scrollLeft + 20) {
						if (!scrollingTimer)
							scrollingTimer = setInterval(function() {
								that[0].scrollLeft -= 10;
								offsetX -= 10;
								reposition(target, that, offsetX);
							}, 20);
					} else if (offsetX > that[0].scrollLeft + that.width() - 20) {
						if (!scrollingTimer)
							scrollingTimer = setInterval(function() {
								that[0].scrollLeft += 10;
								offsetX += 10;
								reposition(target, that, offsetX);
							}, 20);
					} else {
						if (scrollingTimer) {
							clearInterval(scrollingTimer);
							scrollingTimer = 0;
						}
					}

					reposition(target, that, offsetX);
				}
			}

			function mouseup(event) {
				event.preventDefault();
				if (scrollingTimer) {
					clearInterval(scrollingTimer);
					scrollingTimer = 0;
				}
				$.glasspane.off('mouseup', mouseup);
				$.glasspane.off('mousemove', move);
				$.glasspane.hide();
				if (helper) {
					target.css('visibility', '');
				} else {
					target.click();
				}
			}

			$.glasspane.on("mousemove", move);
			$.glasspane.on('mouseup', mouseup);

		});
	};
});