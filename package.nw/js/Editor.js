var inNodeWebkit = typeof require !== 'undefined';
var releaseMode = false;

if (inNodeWebkit) {
	var guiWindow = require('nw.gui').Window.get();
	var fs = require('fs');
} else {
	/* Simple polyfill just to get everything to work */
	var guiWindow = {
		set title(title) {
			$('title').text(title);
		},
		showDevTools: function() {},
		on: function(event, handler) {
			if (event !== 'close')
				throw new Error('TODO');
			$(window).on('beforeunload', function(e) {
				setTimeout(handler, 0);
				return e.returnValue = "Do you really want to close?";
			});
		},
		removeAllListeners: function() {},
		close: function(force) {}
	}
	var fs = {
		readFileSync: function() {
			throw new Error('Cannot read file in browser context');
		},
		writeFileSync: function() {
			throw new Error('Cannot save file in browser context');
		}
	}
}

var SessionManager = function() {
	function SessionManager(tab, editor) {
		var that = this;

		this.tab = tab;
		this.editor = editor;
		this.sessions = [];
		this.$current = null;

		tab.on('select', function() {
			var tab = $("#tabs").tab('select');
			that.$current = that.sessions[tab.attr('file-id')];

			that.editor.setSession(that.$current.session);
			that.editor.focus();
			that.adjustTitle();
		});

		editor.addEventListener("input", function() {
			that.$current.adjustTitle();
		});
	}

	SessionManager.prototype.createId = function() {
		return this.sessions.length;
	}

	SessionManager.prototype.current = function() {
		return this.$current;
	}

	SessionManager.prototype.add = function(session) {
		this.sessions[session.id] = session;
		if (this.$current == null) {
			this.switchTo(session.id);
		}
	}

	SessionManager.prototype.get = function(id) {
		return this.sessions[id];
	}

	SessionManager.prototype.size = function() {
		return this.sessions.length;
	}

	SessionManager.prototype.remove = function(id) {
		var tab = this.sessions[id];
		if (tab !== this.$current) {
			tab.tab.remove();
			delete this.sessions[id];
			return;
		}
		/* Switch to a new tab if current closing one is active */
		var next = tab.tab.next().attr('file-id');
		var prev = tab.tab.prev().attr('file-id');
		tab.tab.remove();
		delete this.sessions[id];
		if (next !== undefined) {
			this.switchTo(next);
		} else if (prev !== undefined) {
			this.switchTo(prev);
		} else {
			this.$current = null;
			new Session(this).$autoCreated = true;
		}
	}

	SessionManager.prototype.switchTo = function(id) {
		this.tab.tab('select', this.sessions[id].tab);
	}

	SessionManager.prototype.newFile = function() {
		new Session(this).switchTo();
	}

	SessionManager.prototype.saveAll = function(callback) {
		var that = this;
		var i = 0;

		(function saveHelper() {
			if (i >= that.size()) {
				callback && callback();
				return;
			}
			var session = that.get(i++);
			if (session) {
				session.save(saveHelper);
			} else {
				saveHelper();
			}
		})();
	}

	SessionManager.prototype.closeAll = function(callback) {
		var that = this;
		var i = 0;

		this.$current = null;

		(function closeHelper(noabort) {
			if (!noabort) {
				callback && callback(false);
				return;
			}
			if (i >= that.size()) {
				new Session(that).$autoCreated = true;
				callback && callback(true);
				return;
			}
			var session = that.get(i++);
			if (session) {
				session.close(closeHelper);
			} else {
				closeHelper(true);
			}
		})(true);
	}

	SessionManager.prototype.adjustTitle = function(dirty) {
		if (dirty === undefined)
			dirty = !this.$current.session.getUndoManager().isClean();
		guiWindow.title = this.$current.name + (dirty ? ' •' : '') + ' - Norlit IDE';
	}

	SessionManager.prototype.openFilePath = function(path, callback) {
		try {
			var value = fs.readFileSync(path).toString();
		} catch (e) {
			alert(e);
			callback && callback();
			return;
		}
		if (this.$current.$autoCreated && this.$current.session.getUndoManager().isClean()) {
			this.$current.setPath(path);
			this.$current.session.setValue(value);
			this.$current.$autoCreated = false;
		} else {
			var tab = new Session(this, path);
			tab.session.setValue(value);
			tab.switchTo();
		}
		callback && callback();
	}

	SessionManager.prototype.openFile = function(callback) {
		var that = this;
		FileDialog.open(function(file) {
			if (file.length) {
				that.openFilePath(file[0].path, callback);
			} else {
				callback && callback();
			}
		});
	}

	return SessionManager;
}();

var Session = function() {
	function Session(manager, path) {
		this.manager = manager;
		this.id = manager.createId();

		var mode;
		if (path)
			mode = Session.findMode(path);
		else
			mode = manager.editor.getSession().getMode();
		this.session = ace.createEditSession('', mode);
		if (manager.current())
			this.tab = manager.tab.tab('new', manager.current().tab).attr('file-id', this.id);
		else
			this.tab = manager.tab.tab('new').attr('file-id', this.id);
		this.setPath(path);
		manager.add(this);
	}

	Session.findMode = function(path) {
		var suffix = (/\.([^\/\\.]+)$/.exec(path) || ['', ''])[1];
		switch (suffix.toLowerCase()) {
			case 'cc':
			case 'c':
			case 'cpp':
			case 'h':
				return 'ace/mode/c_cpp';
			case 'd':
				return 'ace/mode/d';
			case 'java':
				return 'ace/mode/java';
			case 'js':
				return 'ace/mode/javascript';
			case 'json':
				return 'ace/mode/json';
			case 'css':
				return 'ace/mode/css';
			case 'htm':
			case 'html':
				return 'ace/mode/html';
			case 'xml':
				return 'ace/mode/xml';
			case 'md':
				return 'ace/mode/markdown';
			default:
				return 'ace/mode/text';
		}
	}

	Session.prototype.setPath = function(path) {
		this.path = path;
		this.name = path ? /([^\/\\]+)[\/\\]*$/.exec(path)[1] : 'Untitled';
		this.tab.text(this.name);
		this.session.setMode(Session.findMode(path));
	}

	Session.prototype.terminate = function() {
		this.manager.remove(this.id);
		this.session.destroy();
	}

	Session.prototype.switchTo = function() {
		this.manager.switchTo(this.id);
	}

	Session.prototype.save = function(callback) {
		if (!this.path) {
			this.saveAs(callback);
		} else {
			try {
				fs.writeFileSync(this.path, this.session.getValue());
			} catch (e) {
				alert(e);
				/* If a error occur, save operation is aborted */
				callback && callback(false);
				return;
			}
			this.session.getUndoManager().markClean();
			this.adjustTitle();
			callback && callback(true);
		}
	}

	Session.prototype.saveAs = function(callback) {
		FileDialog.save(function(file) {
			if (file.length) {
				try {
					fs.writeFileSync(file[0].path, this.session.getValue());
				} catch (e) {
					alert(e);
					callback && callback(false);
					return;
				}
				this.setPath(file[0].path);
				this.session.getUndoManager().markClean();
				this.adjustTitle();
				callback && callback(true);
			} else {
				callback && callback(false);
			}
		}.bind(this));
	}

	Session.prototype.close = function(callback) {
		var that = this;
		if (!this.session.getUndoManager().isClean()) {
			$.dialog("You have unsaved change. Do you want to save it?", ["Yes", "No", "Cancel"], function(choice) {
				switch (choice) {
					case 0:
						that.save(function(noabort) {
							if (noabort) {
								that.terminate();
							}
							callback && callback(noabort);
						});
						break;
					case 1:
						that.terminate();
						callback && callback(true);
						break;
					default:
						callback && callback(false);
						break;
				}
			});
			return;
		}
		this.terminate();
		callback && callback(true);
	}

	Session.prototype.adjustTitle = function() {
		var dirty = !this.session.getUndoManager().isClean();
		if (this === this.manager.current()) {
			this.manager.adjustTitle(dirty);
		}
		this.tab.text(this.name + (dirty ? ' •' : ''));
	}

	return Session;
}();

var sessionManager = new SessionManager($("#tabs"), editor);
new Session(sessionManager).$autoCreated = true;

if (inNodeWebkit && !releaseMode) {
	$.hotkey('F12', function() {
		guiWindow.showDevTools();
	});
}

$.hotkey('ctrl+n', function(event) {
	sessionManager.newFile();
});

$.hotkey('ctrl+o', function(event) {
	sessionManager.openFile();
});

$.hotkey('ctrl+s', function(event) {
	sessionManager.current().save();
});

$.hotkey('ctrl+shift+s', function(event) {
	sessionManager.current().saveAs();
});

$.hotkey('ctrl+w', function(event) {
	sessionManager.current().close();
});

guiWindow.on('close', function() {
	sessionManager.closeAll(function(noabort) {
		if (noabort)
			guiWindow.close(true);
	});
	return false;
});

$(window).on('unload', function() {
	guiWindow.removeAllListeners("close");
});

var CommandLine = {
	mode: function(mode) {
		mode = mode.toLowerCase();
		switch (mode) {
			case "c":
			case "c++":
				mode = "c_cpp";
				break;
		}
		editor.getSession().setMode("ace/mode/" + mode);
	},
	theme: function(theme) {
		theme = theme.toLowerCase();
		editor.setTheme("ace/theme/" + theme);
	},
	debug: function() {
		guiWindow.showDevTools();
	},
	clear: function() {
		$("#command #output").text('');
	}
};

function appendToOutput(text, style) {
	var element = $("#command #output");
	var autoScroll = element[0].scrollTop + element.height() + 10 > element[0].scrollHeight;
	text = $.escape(text);
	if (style === undefined)
		element.html(element.html() + text);
	else
		element.html(element.html() + '<span style="' + style + '">' + text + '</span>');
	if (autoScroll) {
		element[0].scrollTop = element[0].scrollHeight;
	}
}

if (typeof(require) !== 'undefined') {
	CommandLine.exec = function(cmd, callback) {
		var config = {

		};
		if (sessionManager.current().path) {
			config.cwd = sessionManager.current().path.replace(/([^\/\\]+)[\/\\]*$/, '');
		}

		var process = require('child_process').exec(cmd, config, callback);

		process.stdout.on('data', function(chunk) {
			appendToOutput(chunk);
		});

		process.stderr.on('data', function(chunk) {
			appendToOutput(chunk, 'color: red;');
		});

		process.stdin.end();
	};

	CommandLine.gcc = function() {
		CommandLine.exec('g++ -o norlit-compiled -std=c++11 ' + sessionManager.current().path, function(error) {
			if (!error)
				CommandLine.exec('norlit-compiled');
		});
	}
}

(function() {
	var history = [];
	var index = 0;


	function toggle() {
		var command = $("#command");
		if (command.css('display') === 'none') {
			command.show();
			$("#command input").focus();
		} else {
			command.hide();
			editor.focus();
		}
	}

	$.hotkey('ctrl+`', toggle);

	var commandInput = $("#command input");

	commandInput.keydown(function(event) {
		if (event.which == $.keycode('up')) {
			index--;
			if (index < 0)
				index = 0;
			commandInput.val(history[index]);
			commandInput[0].setSelectionRange(history[index].length, history[index].length);
			event.preventDefault();
		} else if (event.which == $.keycode('down')) {
			index++;
			if (index > history.length)
				index = history;
			if (index == history.length)
				commandInput.val('');
			else {
				commandInput.val(history[index]);
				commandInput[0].setSelectionRange(history[index].length, history[index].length);
			}
			event.preventDefault();
		} else if (event.which == 13) {
			var input = commandInput.val();
			if (!input) {
				return;
			}

			appendToOutput('>>> ' + input + '\n');

			var indirectEval = eval;

			try {
				var ret = indirectEval('with(CommandLine){' + commandInput.val() + '}');
				if (ret !== undefined && ret.toString)
					appendToOutput(ret + '\n');
			} catch (e) {
				appendToOutput(e + '\n', 'color: red;');
			}
			commandInput.val("");

			var output = $("#command #output");
			output[0].scrollTop = output[0].scrollHeight;

			history.push(input);
			index = history.length;
		}
	})

})();

if (inNodeWebkit) {
	process.chdir(process.execPath.replace(/([^\/\\]+)[\/\\]*$/, ''));
	var argv = require('nw.gui').App.argv;
	for (var i = 0; i < argv.length; i++) {
		sessionManager.openFilePath(argv[i]);
	}

	$(window).on('dragover', function(e) {
		e.preventDefault();
	});

	$(window).on('drop', function(e) {
		e.preventDefault();

		for (var i = 0; i < e.dataTransfer.files.length; ++i) {
			sessionManager.openFilePath(e.dataTransfer.files[i].path);
		}
	});
}