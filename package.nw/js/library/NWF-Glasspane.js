NorlitWebFramework.define(function(global, $) {

	var style = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000;';
	var glasspane = $('<div style="' + style + '">');

	glasspane.show = function() {
		$("body").append(glasspane);
	}

	glasspane.hide = function() {
		glasspane.remove();
		glasspane.html('');
		glasspane[0].style.cssText = style;
	}

	$.glasspane = glasspane;

});