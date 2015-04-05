NorlitWebFramework.define(function(global, $) {

	var mappingTable = {
		UP: 38,
		DOWN: 40,
		F12: 123,
		'`': 192
	};

	$.keycode = function(key) {
		key = key.toUpperCase();
		if (mappingTable.hasOwnProperty(key)) {
			return mappingTable[key];
		} else {
			return key.charCodeAt(0);
		}
	}

	$.$hotkey = {
		true: { // ctrl
			true: { // alt
				true: [],
				false: [],
			},
			false: {
				true: [],
				false: [],
			}
		},
		false: {
			true: {
				true: [],
				false: [],
			},
			false: {
				true: [],
				false: [],
			}
		}
	};
	/* format: hotKey[ctrl][alt][shift][which] */

	$.hotkey = function(name, handler) {
		var name = name.toUpperCase().split('+');
		var ctrl = false,
			alt = false,
			shift = false,
			triggerKey = 0;
		for (var i = 0; i < name.length; i++) {
			var key = name[i];
			switch (key) {
				case 'CTRL':
					ctrl = true;
					break;
				case 'ALT':
					alt = true;
					break;
				case 'SHIFT':
					shift = true;
					break;
				default:
					triggerKey = $.keycode(key);
					break;
			}
		}
		$.$hotkey[ctrl][alt][shift][triggerKey] = handler;
	}

	$(function() {
		$("body").keydown(function(event) {
			var handler = $.$hotkey[event.ctrlKey][event.altKey][event.shiftKey][event.which];
			if (handler) {
				event.preventDefault();
				handler(event);
			} else {
				// console.log(event);
			}
		});
	});
});