NorlitWebFramework.define(function(global, $) {

	function adjustSize(element) {
		var maxHeight = parseInt(element.css('max-height'));
		var minHeight = parseInt(element.css('min-height'));
		var height = element.height();
		if (height > maxHeight) {
			height = maxHeight;
		} else if (height < minHeight) {
			height = minHeight;
		} else {
			return;
		}
		element.height(height);
	}

	var layouts = Object.create(null);

	layouts.border = function() {
		function init() {
			var that = this;

			function handler() {
				arrange.call(that);
			}
			this.children("[nwf-position=north]").on('style', handler);
			this.children("[nwf-position=south]").on('style', handler);
			arrange.call(this);
		}

		function arrange() {
			var center = this.children("[nwf-position=center]");

			var north = this.children("[nwf-position=north]");
			var south = this.children("[nwf-position=south]");

			var northExist = north.isVisible();
			var southExist = south.isVisible();

			northExist && adjustSize(north);
			southExist && adjustSize(south);

			var northHeight = northExist ? north.height() : 0;
			var southHeight = southExist ? south.height() : 0;

			center.top(northHeight);
			center.height('calc(100% - ' + (southHeight + northHeight) + 'px)');
		}

		return {
			init: init,
			arrange: arrange
		}
	}();

	layouts.grid = function() {
		function init(_0, xsize, ysize) {
			var children = this.children();
			outer: for (var i = 0; i < ysize; i++) {
				for (var j = 0; j < xsize; j++) {
					var index = i * xsize + j;
					if (index >= children.length)
						break outer;
					var comp = $(children[index]);
					comp.left(j * 100 / xsize + '%');
					comp.top(i * 100 / ysize + '%');
					comp.width(100 / xsize + '%');
					comp.height(100 / ysize + '%');
				}
			}
		}

		function arrange() {}

		return {
			init: init,
			arrange: arrange
		}
	}();

	$.prototype.layout = function(type) {
		if (this.length === 1) {
			var layout = $.$data(this[0], 'layout');
			if (layout) {
				layouts[layout].arrange.apply(this, arguments);
			} else {
				if (type === undefined) {
					type = this.attr('nwf-layout');
				}
				layouts[type].init.apply(this, arguments);
				$.$data(this[0], 'layout', type);
			}
		} else {
			for (var i = 0; i < this.length; i++) {
				$(this[i]).layout(type);
			}
		}
		return this;
	}

	$(function() {
		$('[nwf-layout]').layout();
	})

});