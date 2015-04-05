(function(global) {
	var fileElement = $('<input type="file"/>');

	var FileDialog = {
		open: function(callback) {
			try {
				fileElement[0].files.append(new File("", ""));
			} catch (e) {

			}
			fileElement.click();
			fileElement.one('change', function(event) {
				callback(fileElement[0].files);
			});
		},
		save: function(callback) {
			fileElement.attr('nwsaveas', '');
			try {
				fileElement[0].files.append(new File("", ""));
			} catch (e) {

			}
			fileElement.click();
			fileElement.one('change', function(event) {
				fileElement.removeAttr('nwsaveas');
				callback(fileElement[0].files);
			});
		}
	}

	global.FileDialog = FileDialog;
})(window);