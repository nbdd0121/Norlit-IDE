NorlitWebFramework.define(function(global, $) {

	var observer = new MutationObserver(function(mutations) {
		for (var i = 0; i < mutations.length; i++)
			$(mutations[i].target).trigger('style');
	});

	function observe(item, attr) {
		var observed = $.$data(item, 'observe');
		if (!observed) {
			observed = {};
			$.$data(item, 'observe', observed);
		}
		if (!observed[attr]) {
			observed[attr] = true;
			observer.observe(item, {
				attributes: true,
				attributeFilter: [attr]
			});
		}
	}

	$.$eventHook.style = function(handler) {
		for (var i = 0; i < this.length; i++) {
			observe(this[i], 'style');
		}
	}
});