NorlitWebFramework.define('resize', function(global, $) {

	var expandTriggerStyle = 'position: absolute; left: 0; top: 0;';
	var containerStyle = expandTriggerStyle + 'right: 0; bottom: 0; overflow: scroll; z-index: -1; visibility: hidden;';
	var shrinkTriggerStyle = expandTriggerStyle + 'width: 200%; height: 200%';

	function addResizeListener(element) {
		if ($.$data(element, 'resize'))
			return;
		element = $(element);
		var expand = $('<div style="' + containerStyle + '">');
		var expandTrigger = $('<div style="' + expandTriggerStyle + '">');

		var shrink = $('<div style="' + containerStyle + '">');
		var shrinkTrigger = $('<div style="' + shrinkTriggerStyle + '">');

		var lastWidth = element.width();
		var lastHeight = element.height();

		expand.on('scroll', function() {
			if (element.width() > lastWidth || element.height() > lastHeight) {
				trigger();
			}
			reset();
		});

		shrink.on('scroll', function() {
			if (element.width() < lastWidth || element.height() < lastHeight) {
				trigger();
			}
			reset();
		});

		function trigger() {
			lastWidth = element.width();
			lastHeight = element.height();
			element.trigger('resize');
		}

		function reset() {
			expandTrigger.width(expand.width());
			expandTrigger.height(expand.height());
			expand[0].scrollLeft = expand[0].scrollWidth;
			expand[0].scrollTop = expand[0].scrollHeight;
			shrink[0].scrollLeft = shrink[0].scrollWidth;
			shrink[0].scrollTop = shrink[0].scrollHeight;
		}

		expand.append(expandTrigger);
		shrink.append(shrinkTrigger);
		element.append(expand);
		element.append(shrink);
		reset();

		$.$data(element, 'resize', {
			expand: expand,
			shrink: shrink,
		});
	}

	$.$eventHook.resize = function(handler) {
		if (handler === undefined)
			return;
		for (var i = 0; i < this.length; i++) {
			addResizeListener(this[i]);
		}
	}
	$.$eventShorthand('resize', 'resize');
});