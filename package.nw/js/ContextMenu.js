if (typeof require !== 'undefined') {
	var TextEditingContextMenu = (function() {
		var gui = require('nw.gui'),
			menu = new gui.Menu();
		var cut = new gui.MenuItem({
			label: "Cut",
			click: function() {
				document.execCommand("cut");
			}
		});
		var copy = new gui.MenuItem({
			label: "Copy",
			click: function() {
				document.execCommand("copy");
			}
		});
		var paste = new gui.MenuItem({
			label: "Paste",
			click: function() {
				document.execCommand("paste");
			}
		});
		var selectAll = new gui.MenuItem({
			label: "Select All",
			click: function() {
				document.execCommand("selectAll");
			}
		});
		menu.append(cut);
		menu.append(copy);
		menu.append(paste);
		menu.append(new gui.MenuItem({
			type: "separator"
		}));
		menu.append(selectAll);

		return menu;
	})();

	$(editor.container).on("contextmenu", function(e) {
		TextEditingContextMenu.popup(e.clientX, e.clientY);
	});

	$("#command").on("contextmenu", function(e) {
		TextEditingContextMenu.popup(e.clientX, e.clientY);
	});
}