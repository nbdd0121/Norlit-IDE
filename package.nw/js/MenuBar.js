if (typeof require !== 'undefined') {
	(function() {
		var gui = require('nw.gui');
		var MenuItem = gui.MenuItem;
		var Menu = gui.Menu;
		var fileMenu = new Menu();

		var menuBar = new gui.Menu({
			type: "menubar"
		});

		/* File menu */
		{
			var fileMenu = new Menu();
			fileMenu.append(new MenuItem({
				label: "New File",
				click: function() {
					sessionManager.newFile();
				}
			}));
			fileMenu.append(new MenuItem({
				label: "Open File",
				click: function() {
					sessionManager.openFile();
				}
			}));
			fileMenu.append(new MenuItem({
				label: "Save",
				click: function() {
					sessionManager.current().save();
				}
			}));
			fileMenu.append(new MenuItem({
				label: "Save As",
				click: function() {
					sessionManager.current().saveAs();
				}
			}));
			fileMenu.append(new MenuItem({
				label: "Save All",
				click: function() {
					sessionManager.saveAll();
				}
			}));
			fileMenu.append(new MenuItem({
				type: "separator"
			}));
			fileMenu.append(new MenuItem({
				label: "Close File",
				click: function() {
					sessionManager.current().close();
				}
			}));
			fileMenu.append(new MenuItem({
				label: "Close All",
				click: function() {
					sessionManager.closeAll();
				}
			}));
			fileMenu.append(new MenuItem({
				type: "separator"
			}));
			fileMenu.append(new MenuItem({
				label: "Exit",
				click: function() {
					gui.Window.get().close();
				}
			}));

			menuBar.append(new MenuItem({
				label: "File",
				submenu: fileMenu
			}));
		}

		/* Edit menu */
		{
			var editMenu = new Menu();

			editMenu.append(new MenuItem({
				label: "Undo",
				click: function() {
					editor.undo();
				}
			}));
			editMenu.append(new MenuItem({
				label: "Redo",
				click: function() {
					editor.redo();
				}
			}));
			editMenu.append(new MenuItem({
				type: "separator"
			}));

			var cut = new MenuItem({
				label: "Cut",
				click: function() {
					document.execCommand("cut");
				}
			});
			var copy = new MenuItem({
				label: "Copy",
				click: function() {
					document.execCommand("copy");
				}
			});
			var paste = new MenuItem({
				label: "Paste",
				click: function() {
					document.execCommand("paste");
				}
			});
			var selectAll = new MenuItem({
				label: "Select All",
				click: function() {
					document.execCommand("selectAll");
				}
			});

			editMenu.append(cut);
			editMenu.append(copy);
			editMenu.append(paste);
			editMenu.append(new MenuItem({
				type: "separator"
			}));
			editMenu.append(selectAll);

			menuBar.append(new MenuItem({
				label: "Edit",
				submenu: editMenu
			}));
		}

		gui.Window.get().menu = menuBar;
	})();

}