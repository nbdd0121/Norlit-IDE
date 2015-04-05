NorlitWebFramework.define(function(global, $) {

	$.dialog = function(content, buttons, callback) {
		var dialogBox = $('<div class="nwf-modal-dialog">');
		var contentBox = $('<div class="nwf-modal-dialog-content-area">').html(content);
		dialogBox.append(contentBox);

		var buttonBox = $('<div class="nwf-modal-dialog-button-group" nwf-layout="grid">');
		for (var i = 0; i < buttons.length; i++) {
			(function(i) {
				var button = $('<div><button>' + buttons[i]);
				button.click(function() {
					$.glasspane.hide();
					callback(i);
				});
				buttonBox.append(button);
			})(i);
		}
		buttonBox.layout('grid', buttons.length, 1);

		dialogBox.append(buttonBox);

		$.glasspane.append(dialogBox).show();

		buttonBox.find('button').focus();
	}


});