NorlitWebFramework.define(function(global, $) {

	$.prototype.resizable = function() {
		var that = this;
		this.on("mousedown", function(event) {
			if (event.which !== 1)
				return;

			/* Target of resizing */
			var target = $(that.attr('resize-target'));

			var oriHeight = target.height();
			var oriY = event.clientY;

			$.glasspane.css('cursor', 'n-resize');
			$.glasspane.show();

			function move(event) {
				if (event.which !== 1) {
					mouseup(event);
					return;
				}
				var height = oriHeight - event.clientY + oriY;
				target.height(height);
			}

			function mouseup(event) {
				$.glasspane.off('mouseup', mouseup);
				$.glasspane.off('mousemove', move);
				$.glasspane.hide();
			}

			$.glasspane.on("mousemove", move);
			$.glasspane.on('mouseup', mouseup);

		});
	};

});