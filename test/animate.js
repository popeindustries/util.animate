(function(root) {
	// Load or return cached version of requested module with id 'path' or 'path/index'
	// @param {String} path
	// @return {Object}
	function require (path) {
		// Convert relative path to absolute for cases where 'require' has not been resolved
		// called from outside of a module, for example
		if (!this.module && path.charAt(0) == '.') {
			path = path.slice((path.indexOf('..') === 0) ? 3 : 2);
		}
		// Check with/without root package (need to handle node_modules differently)
		var paths = [path, path.slice(path.indexOf('/') + 1)]
			, m;
		// Find in cache
		for (var i = 0, n = paths.length; i < n; i++) {
			path = paths[i];
			m = require.modules[path] || require.modules[path + '/index'];
			if (m) break;
		}
		if (!m) {
			throw "Couldn't find module for: " + path;
		}
		// Instantiate the module if it's export object is not yet defined
		if (!m.exports) {
			// Convert 'lazy' evaluated string to Function
			if ('string' == typeof m) {
				m = require.modules[path] = new Function('module', 'exports', 'require', m);
			}
			m.exports = {};
			m.filename = path;
			m.call(this, m, m.exports, require.relative(path));
		}
		// Return the exports object
		return m.exports;
	}

	// Cache of module objects
	require.modules = {};

	// Resolve 'to' an absolute path
	// @param {String} curr
	// @param {String} path
	// @return {String}
	require.resolve = function(from, to) {
		var fromSegs = from.split('/')
			, seg;

		// Non relative path
		if (to.charAt(0) != '.') return to;

		// Don't strip root paths (handled specially in require())
		if (fromSegs.length > 1) fromSegs.pop();
		to = to.split('/');
		// Use 'from' path segments to resolve relative 'to' path
		for (var i = 0; i < to.length; ++i) {
			seg = to[i];
			if (seg == '..') {
				fromSegs.pop();
			} else if (seg != '.') {
				fromSegs.push(seg);
			}
		}
		return fromSegs.join('/');
	};

	// Partial completion of the module's inner 'require' function
	// @param {String} path
	// @return {Object}
	require.relative = function(path) {
		return function(p) {
			return require(require.resolve(path, p));
		};
	};

	// Register a module with id of 'path' and callback of 'fn'
	// @param {String} path
	// @param {Function} fn [signature should be of type (module, exports, require)]
	require.register = function(path, fn) {
		require.modules[path] = fn;
	};

	// Expose
	root.require = require;
})(window != null ? window : global);

require.register('requestAnimationFrame', function(module, exports, require) {
  var vendors = ['ms', 'moz', 'webkit', 'o']
  	, lastFrameTime = null;
  
  for (var i = 0, n = vendors.length; i < n; i++) {
  	vendor = vendors[i];
  	if (!window.requestAnimationFrame) {
  		window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
  		window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
  	}
  }
  
  if (!window.requestAnimationFrame) {
  	window.requestAnimationFrame = function(callback, element) {
  		var currFrameTime = +(new Date())
  			, id, interval, lastTime;
  		if (lastFrameTime == null) {
  			lastFrameTime = currFrameTime;
  		}
  		interval = Math.max(0, 16 - (currFrameTime - lastFrameTime));
  		id = window.setTimeout((function() {
  			// Call with elapsed frame time
  			callback(currFrameTime + interval);
  		}), interval);
  		lastTime = currFrameTime + interval;
  		return id;
  	};
  }
  
  if (!window.cancelAnimationFrame) {
  	window.cancelAnimationFrame = function(id) {
  		clearTimeout(id);
  	};
  }
  
});
require.register('util.identify', function(module, exports, require) {
  /**
   * Test if 'obj' is an Array
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isArray = function(obj) {
  	if (Array.isArray) {
  		return Array.isArray(obj);
  	} else {
  		return Object.prototype.toString.call(obj) === '[object Array]';
  	}
  };
  
  /**
   * Test if 'obj' is an Object
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isObject = function(obj) {
  	return obj === Object(obj) && obj.nodeType == undefined;
  };
  
  /**
   * Test if 'obj' is a String
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isString = function(obj) {
  	return Object.prototype.toString.call(obj) === '[object String]';
  };
  
  /**
   * Test if 'obj' is a Number
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isNumber = function(obj) {
  	return Object.prototype.toString.call(obj) === '[object Number]';
  };
  
  /**
   * Test if 'obj' is a Function
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isFunction = function(obj) {
  	return Object.prototype.toString.call(obj) === '[object Function]';
  };
  
  /**
   * Test if 'obj' is NaN
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isNaN = function(obj) {
  	return obj !== obj;
  };
  
  /**
   * Test if 'obj' is an Element
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isElement = function(obj) {
  	return !!((obj != null ? obj.nodeType : null) === 1);
  };
  
  /**
   * Test if 'obj' is a Boolean
   * -- from underscore.js --
   * @param {Object} obj
   * @returns {Boolean}
   */
  exports.isBoolean = function(obj) {
  	return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
  };
  
});
require.register('dom.style', function(module, exports, require) {
  // TODO: handle setting special shortcut transform properties with arrays (translate, scale)?
  // TODO: bulk transform properties
  
  var identify = require('util.identify')
  	, win = window
  	, doc = window.document
  	, el = doc.createElement('div')
  
  		// Hash of unit values
  	, numeric = {
  			'top': 'px',
  			'bottom': 'px',
  			'left': 'px',
  			'right': 'px',
  			'width': 'px',
  			'height': 'px',
  			'margin-top': 'px',
  			'margin-bottom': 'px',
  			'margin-left': 'px',
  			'margin-right': 'px',
  			'padding-top': 'px',
  			'padding-bottom': 'px',
  			'padding-left': 'px',
  			'padding-right': 'px',
  			'border-bottom-left-radius': 'px',
  			'border-bottom-right-radius': 'px',
  			'border-top-left-radius': 'px',
  			'border-top-right-radius': 'px',
   			'transition-duration': 'ms',
   			'opacity': '',
  			'font-size': 'px',
  			'translateX': 'px',
  			'translateY': 'px',
  			'translateZ': 'px',
  			'scaleX': '',
  			'scaleY': '',
  			'scaleZ': '',
  			'rotate': 'deg',
  			'rotateX': 'deg',
  			'rotateY': 'deg',
  			'rotateZ': 'deg',
  			'skewX': 'deg',
  			'skewY': 'deg'
  		}
  	, colour = {
  			'background-color': true,
  			'color': true,
  			'border-color': true
  		}
  		// Hash of shorthand properties
  	, shorthand = {
  			'border-radius': ['border-bottom-left-radius', 'border-bottom-right-radius', 'border-top-left-radius', 'border-top-right-radius'],
  			'border-color': ['border-bottom-color', 'border-left-color', 'border-top-color', 'border-right-color'],
  			'margin': ['margin-top', 'margin-right', 'margin-left', 'margin-bottom'],
  			'padding': ['padding-top', 'padding-right', 'padding-left', 'padding-bottom']
  		}
  		// Hash of transform properties
  	, transform = {
  			'transform': true,
  			'translate': true,
  			'translateX': true,
  			'translateY': true,
  			'translate3d': true,
  			'translateZ': true,
  			'rotate': true,
  			'rotate3d': true,
  			'rotateX': true,
  			'rotateY': true,
  			'rotateZ': true,
  			'scale': true,
  			'scaleX': true,
  			'scaleY': true,
  			'scale3d': true,
  			'scaleZ': true,
  			'skew': true,
  			'skewX': true,
  			'skewY': true,
  			'perspective': true,
  			'matrix': true,
  			'matrix3d': true
  		}
  
  	, platformStyles = {}
  	, platformPrefix = ''
  
  	, RE_UNITS = /(px|%|em|ms|s|deg)$/
  	, RE_IE_OPACITY = /opacity=(\d+)/i
  	, RE_RGB = /rgb\((\d+),\s?(\d+),\s?(\d+)\)/
  	, RE_MATRIX = /^matrix(?:3d)?\(([^\)]+)/
  	, VENDOR_PREFIXES = ['-webkit-', '-moz-', '-ms-', '-o-']
  	, MATRIX_IDENTITY = [[1, 0, 0, 1, 0, 0], [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]]
  	, MATRIX_PROPERTY_INDEX = {
  		translateX: [4,12],
  		translateY: [5,13],
  		translateZ: [null,14],
  		scaleX: [0,0],
  		scaleY: [3,5],
  		scaleZ: [null,10],
  		rotate: [0,0],
  		rotateX: [null,5],
  		rotateY: [null,0],
  		rotateZ: [null,0],
  		skewY: [1,1],
  		skewX: [2,2]
  	};
  
  // Store all possible styles this platform supports
  var s = current(doc.documentElement)
  	, add = function (prop) {
  			platformStyles[prop] = true;
  			// Grab the prefix style
  			if (!platformPrefix && prop.charAt(0) == '-') {
  				platformPrefix = /^-\w+-/.exec(prop)[0];
  			}
  		};
  
  if (s.length) {
  	for (var i = 0, n = s.length; i < n; i++) {
  		add(s[i]);
  	}
  } else {
  	for (var prop in s) {
  		add(prop);
  	}
  }
  
  // Store opacity property name (normalize IE opacity/filter)
  var opacity = !platformStyles['opacity'] && platformStyles['filter'] ? 'filter' : 'opacity';
  
  // API
  exports.isSupported = isSupported;
  exports.getPrefixed = getPrefixed;
  exports.getShorthand = getShorthand;
  exports.getAll = getAll;
  exports.expandShorthand = expandShorthand;
  exports.parseOpacity = parseOpacity;
  exports.getOpacityValue = getOpacityValue;
  exports.parseNumber = parseNumber;
  exports.parseTransform = parseTransform;
  exports.getStyle = getStyle;
  exports.getNumericStyle = getNumericStyle;
  exports.getDocumentStyle = getDocumentStyle;
  exports.setStyle = setStyle;
  exports.clearStyle = clearStyle;
  exports.platformStyles = platformStyles;
  exports.platformPrefix = platformPrefix;
  // CSS3 feature tests (also forces cache inclusion)
  exports.hasTransitions = isSupported('transition');
  exports.hasTransforms = isSupported('transform');
  exports.has3DTransforms = (function () {
  	if (exports.hasTransforms) {
  		var prop = camelCase(getPrefixed('transform'));
  		el.style[prop] = 'translateZ(10px)';
  		return el.style[prop] != '';
  	}
  	return false;
  })();
  
  /**
   * Determine if 'property' is supported on this platform
   * @returns {Boolean}
   */
  function isSupported (property) {
  	var props = [property, platformPrefix + property]
  		, support = false
  		, prop;
  
  	for (var i = 0, n = props.length; i < n; i++) {
  		prop = props[i];
  		// Use cached
  		if (exports.platformStyles[prop]) return true;
  		if (typeof el.style[prop] === 'string'
  			|| typeof el.style[camelCase(prop)] === 'string') {
  				support = true;
  				exports.platformStyles[prop] = true;
  				break;
  		}
  	}
  
  	return support;
  }
  
  /**
   * Retrieve the vendor prefixed version of the property
   * @param {String} property
   * @returns {String}
   */
  function getPrefixed (property) {
  	if (typeof property === 'string') {
  		// Handle transform pseudo-properties
  		if (transform[property]) {
  			property = 'transform';
  		}
  
  		if (exports.platformStyles[property]) return property;
  
  		if (isSupported(property)) {
  			if (exports.platformStyles[platformPrefix + property]) {
  				property = platformPrefix + property;
  			}
  		}
  	}
  
  	return property;
  }
  
  /**
   * Retrieve a proxy property to use for shorthand properties
   * @param {String} property
   * @returns {String}
   */
  function getShorthand (property) {
  	if (shorthand[property] != null) {
  		return shorthand[property][0];
  	} else {
  		return property;
  	}
  }
  
  /**
   * Retrieve all possible variations of the property
   * @param {String} property
   * @returns {Array}
   */
  function getAll (property) {
  	var all = [];
  
  	// Handle transform pseudo-properties
  	if (transform[property]) {
  		property = 'transform';
  	}
  
  	all.push(property);
  	// Handle shorthands
  	if (shorthand[property]) {
  		all = all.concat(shorthand[property]);
  	}
  	// Automatically add vendor prefix
  	for (var i = 0, n = all.length; i < n; i++) {
  		all.push(platformPrefix + all[i]);
  	}
  
  	return all;
  }
  
  /**
   * Expand shorthand properties
   * @param {String} property
   * @param {Object} value
   * @returns {Object|String}
   */
  function expandShorthand (property, value) {
  	if (shorthand[property] != null) {
  		var props = {};
  		for (var i = 0, n = shorthand[property].length; i < n; i++) {
  			props[shorthand[property][i]] = value;
  		}
  		return props;
  	} else {
  		return property;
  	}
  }
  
  /**
   * Parse current opacity value
   * @param {String} value
   * @returns {Number}
   */
  function parseOpacity (value) {
  	var match;
  	if (value === '') {
  		return null;
  	// IE case
  	} else if (opacity === 'filter') {
  		match = value.match(RE_IE_OPACITY);
  		if (match != null) {
  			return parseInt(match[1], 10) / 100;
  		}
  	} else {
  		return parseFloat(value);
  	}
  }
  
  /**
   * Convert opacity to IE filter syntax
   * @param {String} value
   * @returns {String}
   */
  function getOpacityValue (value) {
  	var val = parseFloat(value);
  	if (opacity === 'filter') {
  		val = "alpha(opacity=" + (val * 100) + ")";
  	}
  	return val;
  }
  
  /**
   * Split a value into a number and unit
   * @param {String} value
   * @param {String} property
   * @returns {Array}
   */
  function parseNumber (value, property) {
  	var channels, num, unit, unitTest;
  
  	if (value == null || value == 'none') {
  		value = 0;
  	}
  
  	// Handle arrays of values (translate, scale)
  	if (identify.isArray(value)) {
  		return value.map(function (val) {
  			return parseNumber(val, property);
  		});
  	}
  
  	// Handle colours
  	if (colour[property]) {
  		// rgb()
  		if (value != null && value.charAt(0) !== '#') {
  			channels = RE_RGB.exec(value);
  			if (channels) {
  				return ["#" + ((1 << 24) | (channels[1] << 16) | (channels[2] << 8) | channels[3]).toString(16).slice(1), 'hex'];
  			} else {
  				return ['#ffffff', 'hex'];
  			}
  		} else {
  			return [value || '#ffffff', 'hex'];
  		}
  
  	// Handle numbers
  	} else {
  		num = parseFloat(value);
  		if (identify.isNaN(num)) {
  			return [value, ''];
  		} else {
  			unitTest = RE_UNITS.exec(value);
  			// Set unit or default
  			unit = (unitTest != null)
  				? unitTest[1]
  				: ((numeric[property] != null)
  						? numeric[property]
  						: 'px');
  			return [num, unit];
  		}
  	}
  }
  
  /**
   * Retrieve a 'property' from a transform 2d or 3d 'matrix'
   * @param {String|Array} matrix
   * @param {String} property
   * @returns {String|Number|Array}
   */
  function parseTransform (matrix, property) {
  	var m = matrixStringToArray(matrix)
  		, is3D = (m && m.length > 6) ? 1 : 0;
  
  	if (m) {
  		switch (property) {
  			case 'matrix':
  			case 'matrix3d':
  				return m;
  			case 'translateX':
  			case 'translateY':
  				return ''
  					+ m[MATRIX_PROPERTY_INDEX[property][is3D]]
  					+ 'px';
  			case 'translateZ':
  				return ''
  					+ (is3D ? m[MATRIX_PROPERTY_INDEX[property][is3D]] : '0')
  					+ 'px';
  			case 'translate':
  				return [parseTransform(matrix, 'translateX'), parseTransform(matrix, 'translateY')];
  			case 'translate3d':
  				return [parseTransform(matrix, 'translateX'), parseTransform(matrix, 'translateY'), parseTransform(matrix, 'translateZ')];
  			case 'scaleX':
  			case 'scaleY':
  				return m[MATRIX_PROPERTY_INDEX[property][is3D]];
  			case 'scaleZ':
  				return is3D ? m[10] : 1;
  			case 'scale':
  				return [parseTransform(matrix, 'scaleX'), parseTransform(matrix, 'scaleY')];
  			case 'scale3d':
  				return [parseTransform(matrix, 'scaleX'), parseTransform(matrix, 'scaleY'), parseTransform(matrix, 'scaleZ')];
  			case 'rotate':
  			case 'rotateY':
  			case 'rotateZ':
  				return ''
  					+ (Math.acos(m[0]) * 180) / Math.PI
  					+ 'deg';
  			case 'rotateX':
  				return ''
  					+ (Math.acos(m[5]) * 180) / Math.PI
  					+ 'deg';
  			case 'skewX':
  				return ''
  					+ (Math.atan(m[2]) * 180) / Math.PI
  					+ 'deg';
  			case 'skewY':
  				return ''
  					+ (Math.atan(m[1]) * 180) / Math.PI
  					+ 'deg';
  		}
  	}
  
  	return matrix;
  }
  
  /**
   * Convert a matrix property to a transform style string
   * Handles existing transforms and special grouped properties
   * @param {Element} element
   * @param {String} property
   * @param {String|Array} value
   * @returns {String}
   */
  function generateTransform (element, property, value) {
  	var matrix = current(element, getPrefixed(property))
  		, m, m1, is3D, idx, len;
  
  	if (matrix == 'none') matrix = '';
  
  	// Reset existing matrix, preserving translations
  	if (matrix) {
  		if (m = matrixStringToArray(matrix)) {
  			is3D = m.length > 6 ? 1 : 0;
  			len = is3D ? 3 : 2;
  			idx = is3D ? 12 : 4;
  			// Preserve translations
  			if (!(~property.indexOf('translate'))) {
  				m1 = MATRIX_IDENTITY[is3D].slice(0, idx)
  					.concat(m.slice(idx, idx + len));
  				if (is3D) m1.push(MATRIX_IDENTITY[is3D].slice(-1));
  				m = m1;
  			// Preserve translations and nullify changed
  			} else {
  				if (property == 'translate' || property == 'translate3d') {
  					m1 = m.slice(0, idx)
  						.concat(MATRIX_IDENTITY[is3D].slice(idx, idx + len));
  					if (is3D) m1.push(m.slice(-1));
  					m = m1;
  				} else if (property == 'translateX' || property == 'translateY' || property == 'translateZ') {
  					idx = MATRIX_PROPERTY_INDEX[property][is3D];
  					if (idx) m[idx] = MATRIX_IDENTITY[is3D][idx];
  				}
  			}
  
  			matrix = is3D ? 'matrix3d' : 'matrix'
  				+ '('
  				+ m.join(', ')
  				+ ') ';
  		}
  	}
  
  	if (numeric[property] != null) {
  		return ''
  			+ matrix
  			+ property
  			+ '('
  			+ value
  			+ ')';
  	// Grouped properties
  	} else {
  		switch (property) {
  			case 'transform':
  			case 'transform3d':
  				return value;
  			case 'matrix':
  			case 'matrix3d':
  				return ''
  					+ property
  					+ '('
  					+ value
  					+ ')';
  			case 'translate':
  			case 'translate3d':
  				if (identify.isArray(value)) {
  					// Add default unit
  					value = value.map(function(item) {
  						return !identify.isString(item) ? item + 'px': item;
  					})
  					.join(', ');
  				}
  				return ''
  					+ matrix
  					+ property
  					+ '('
  					+ value
  					+ ')';
  			case 'scale':
  			case 'scale3d':
  				if (identify.isArray(value)) {
  					value = value.join(', ');
  				}
  				return ''
  					+ matrix
  					+ property
  					+ '('
  					+ value
  					+ ')';
  		}
  	}
  }
  
  /**
   * Retrieve the style for 'property'
   * @param {Element} element
   * @param {String} property
   * @returns {Object}
   */
  function getStyle (element, property) {
  	var prop, value;
  
  	// Special case for opacity
  	if (property === 'opacity') {
  		return parseOpacity(current(element, opacity));
  	}
  
  	// Retrieve longhand and prefixed version
  	prop = getPrefixed(getShorthand(property));
  	value = current(element, prop);
  
  	// Special case for transform
  	if (transform[property]) {
  		return parseTransform(value, property);
  	}
  
  	switch (value) {
  		case '':
  			return null;
  		case 'auto':
  			return 0;
  		default:
  			return value;
  	}
  }
  
  /**
   * Retrieve the numeric value for 'property'
   * @param {Element} element
   * @param {String} property
   * @returns {Number}
   */
  function getNumericStyle (element, property) {
  	return parseNumber(getStyle(element, property), property);
  }
  
  /**
   * Retrieve the 'property' for matching 'selector' rule in all document stylesheets
   * @param {String} selector
   * @param {String} property
   * @returns {String}
   */
  function getDocumentStyle (selector, property) {
  	var styleSheets = document.styleSheets
  		, sheet, rules, rule;
  
  	if (styleSheets) {
  		for (var i = 0, n = styleSheets.length; i < n; i++) {
  			sheet = styleSheets[i];
  			if (rules = sheet.rules || sheet.cssRules) {
  				for (var j = 0, m = rules.length; j < m; j++) {
  					rule = rules[j];
  					if (selector === rule.selectorText) {
  						return rule.style.getPropertyValue(property);
  					}
  				}
  			}
  		}
  	}
  
  	return '';
  }
  
  /**
   * Set the style for 'property'
   * @param {Element} element
   * @param {String|Object} property
   * @param {Object} value
   */
  function setStyle (element, property, value) {
  	var prop, matrix;
  
  	// Expand shorthands
  	prop = expandShorthand(property, value);
  	
  	// Handle property hash returned from expandShorthand
  	if (identify.isObject(prop)) {
  		for (var p in prop) {
  			setStyle(element, p, prop[p]);
  		}
  		return;
  	}
  
  	// Handle opacity
  	if (prop === 'opacity') {
  		prop = opacity;
  		value = getOpacityValue(value);
  	}
  
  	// Look up default numeric unit if none provided
  	if (value !== 'auto'
  		&& value !== 'inherit'
  		&& numeric[prop]
  		&& !RE_UNITS.test(value)) {
  			value += numeric[prop];
  	}
  
  	// Look up prefixed property
  	prop = getPrefixed(prop);
  
  	// Handle special transform properties
  	if (transform[property]) {
  		value = generateTransform(element, property, value);
  	}
  	element.style[camelCase(prop)] = value;
  }
  
  /**
   * Remove the style for 'property'
   * @param {Element} element
   * @param {String} property
   */
  function clearStyle (element, property) {
  	var style = element.getAttribute('style') || ''
  		, re;
  
  	if (style) {
  		property = getAll(property).join('[\\w-]*|') + '[\\w-]*';
  
  		re = new RegExp('(?:^|\\s)(?:' + property + '):\\s?[^;]+;', 'ig');
  		element.setAttribute('style', style.replace(re, ''));
  	}
  }
  
  /**
   * Retrieve current computed style
   * @param {Element} element
   * @param {String} property
   * @returns {String}
   */
  function current (element, property) {
  	var value;
  
  	if (win.getComputedStyle) {
  		if (property) {
  			value = win.getComputedStyle(element).getPropertyValue(property);
  			// Try with camel casing
  			if (value == null) win.getComputedStyle(element).getPropertyValue(camelCase(property));
  			return value;
  		} else {
  			return win.getComputedStyle(element);
  		}
  	// IE
  	} else {
  		if (property) {
  			value = element.currentStyle[property];
  			// Try with camel casing
  			if (value == null) element.currentStyle[camelCase(property)];
  			return value;
  		} else {
  			return element.currentStyle;
  		}
  	}
  }
  
  /**
   * CamelCase 'str, removing '-'
   * @param {String} str
   * @returns {String}
   */
  function camelCase (str) {
  	// IE requires vendor prefixed values to start with lowercase
  	if (str.indexOf('-ms-') == 0) str = str.slice(1);
  	return str.replace(/-([a-z]|[0-9])/ig, function(all, letter) {
  		return (letter + '').toUpperCase();
  	});
  }
  
  /**
   * Convert 'matrix' to Array
   * @param {String|Array} matrix
   * @returns {Array}
   */
  function matrixStringToArray (matrix) {
  	if (identify.isArray(matrix)) {
  		return matrix;
  	} else if (re = matrix.match(RE_MATRIX)) {
  		// Convert string to array
  		return re[1].split(', ')
  			.map(function (item) {
  				return parseFloat(item);
  			});
  	}
  }
  
});
require.register('util.colour', function(module, exports, require) {
  /**
   * Extract colour channels from a colour string (rgb(r,g,b), rrggbb, rgb)
   * @param {String} colour
   */
  exports.toComponent = function(colour) {
  	// Remove hash and spaces
  	colour = colour.replace(/[#\s]/g, '');
  
  	// rgb(r, g, b)
  	if (/^rgb/.test(colour)) {
  		var re = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
  		var channels = re.exec(colour);
  		return {
  			r: parseInt(channels[1], 10),
  			g: parseInt(channels[2], 10),
  			b: parseInt(channels[3], 10)
  		};
  	// #rrggbb
  	} else if (colour.length === 6) {
  		re = /^(\w{2})(\w{2})(\w{2})$/;
  		channels = re.exec(colour);
  		return {
  			r: parseInt(channels[1], 16),
  			g: parseInt(channels[2], 16),
  			b: parseInt(channels[3], 16)
  		};
  	// #rgb
  	} else if (colour.length === 3) {
  		re = /^(\w{1})(\w{1})(\w{1})$/;
  		channels = re.exec(colour);
  		return {
  			r: parseInt(channels[1] + channels[1], 16),
  			g: parseInt(channels[2] + channels[2], 16),
  			b: parseInt(channels[3] + channels[3], 16)
  		};
  	}
  };
  
  /**
   * Generate rgba(r,g,b,a) colour string
   * @param {String} colour
   * @param {Number} alpha
   */
  exports.rgba = function(colour, alpha) {
  	var c;
  	c = exports.toComponent(colour);
  	return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
  };
  
});
require.register('util.ease/lib/cubic', function(module, exports, require) {
  // t: current time, b: beginning value, c: change in value, d: duration
  
  exports.inCubic = {
  	js: function(t, b, c, d) {
  			return c * (t /= d) * t * t + b;
  		},
  	css: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
  };
  
  exports.outCubic = {
  	js: function(t, b, c, d) {
  			return c * ((t = t / d - 1) * t * t + 1) + b;
  		},
  	css: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
  };
  
  exports.inOutCubic = {
  	js: function(t, b, c, d) {
  			if ((t /= d / 2) < 1) {
  				return c / 2 * t * t * t + b;
  			}
  			return c / 2 * ((t -= 2) * t * t + 2) + b;
  		}
  };
  
});
require.register('util.animate', function(module, exports, require) {
  require('requestAnimationFrame')
  var style = require('dom.style')
  	, identify = require('util.identify')
  	, isFunction = identify.isFunction
  	, isString = identify.isString
  	, isArray = identify.isArray
  	, isObject = identify.isObject
  	, colourUtil = require('util.colour')
  	, win = window
  	, doc = window.document
  
  	, anims = {}
  	, length = 0
  	, pool = []
  	, uid = 1
  	, last = 0
  	, running = false
  
  	, FRAME_RATE = 60
  	, DEFAULT_DURATION = 500
  	, DEFAULT_EASING = require('util.ease/lib/cubic').outCubic
  	, POOL_SIZE = 10;
  
  module.exports = animate;
  
  // Populate object pool
  for (var i = 0, n = POOL_SIZE; i < n; i++) {
  	pool.push(new Anim());
  }
  
  /**
   * Retrieve an Anim instance bound to 'target'
   * Set 'keep' to true to prevent cleanup
   * @param {Object} target
   * @param {Boolean} [keep]
   * @returns {Anim}
   */
  function animate (target, keep) {
  	if (!target) return;
  
  	// reuse from the object pool
  	var anim = pool.length ? pool.pop() : new Anim();
  	anim.id = uid++;
  	anim.target = target;
  	anim.keep = (keep != null) ? keep : false;
  	return anim;
  }
  
  /**
   * Add 'anim' to render loop
   * @param {Anim} anim
   */
  function add (anim) {
  	if (!anims[anim.id]) {
  		anims[anim.id] = anim;
  		anim.isRunning = true;
  		length++;
  		// Start if not running
  		if (!running) {
  			running = true;
  			last = Date.now();
  			onTick();
  		}
  	}
  }
  
  /**
   * Remove 'anim' from render loop
   * @param {Anim} anim
   */
  function remove (anim) {
  	if (anim.isRunning) {
  		anim.isRunning = false;
  		anim.isComplete = false;
  		anim.duration = 0;
  		anim.elapsed = 0;
  		anim.delayBefore = 0;
  		anim.delayAfter = 0;
  		anim.tickCallbacks = [];
  		anim.completeCallbacks = [];
  		anim.properties = {};
  		anim.ease = DEFAULT_EASING;
  		anim.usingCssTransitions = false;
  		delete anims[anim.id];
  		length--;
  		// Stop if none active
  		if (!length) running = false;
  	}
  }
  
  /**
   * Destroy 'anim'
   * @param {Anim} anim
   */
  function destroy (anim) {
  	// Check that this is eligible for destruction
  	if (anim.id) {
  		remove(anim);
  		// Reset
  		anim.id = null;
  		anim.target = null;
  		anim.keep = false;
  		pool.push(anim);
  	}
  }
  
  /**
   * Tick handler
   * @param {Number} time
   */
  function onTick (time) {
  	var now = Date.now()
  		, tick = now - last;
  
  	// Store
  	last = now;
  	for (var id in anims) {
  		render(anims[id], tick);
  	}
  	// Loop
  	if (running) win.requestAnimationFrame(onTick);
  }
  
  
  /**
   * Render
   * @param {Anim} anim
   * @param {Number} time
   */
  function render (anim, time) {
  	var props = anim.properties
  		, s, e, callback, callbacks, dur, propObj, value;
  
  	anim.elapsed += time;
  	// Make sure total time does not exceed duration
  	dur = (anim.elapsed < anim.duration)
  		? anim.elapsed
  		: anim.duration;
  
  	// Handle delay before
  	if (anim.delayBefore > 0) {
  		anim.delayBefore -= time;
  		// Round down if under 1 frame
  		if (anim.delayBefore < 16) {
  			anim.delayBefore = 0;
  		}
  	}
  
  	// Update properties
  	if (!anim.isComplete && anim.delayBefore <= 0) {
  		for (var prop in props) {
  			propObj = props[prop];
  			// All types except css transitions
  			if (propObj.type < 4) {
  				s = propObj.start;
  				//Handle arrays for transforms like translate and scale
  				if (isArray(propObj.end)){
  					var values = [];
  					for (var i = 0; i < propObj.end.length; i++) {
  						e = propObj.end[i] - s;
  						value = propObj.current = anim.ease.js(dur, s, e, anim.duration);
  						values.push(value);
  					}
  				//Handle objects for rgb colours
  				}else if(isObject(propObj.end)){
  					var r,g,b;
  					for (var key in propObj.end){
  						if (propObj.end.hasOwnProperty(key)) {
           			s = propObj.start[key];
           			e = Math.abs(propObj.end[key] - s);
           			if (key === 'r'){
           				r = propObj.current = anim.ease.js(dur, s, e, anim.duration);
           			}else if( key === 'g'){
           				g = propObj.current = anim.ease.js(dur, s, e, anim.duration);
           			}else if (key == 'a'){
           				b = propObj.current = anim.ease.js(dur, s, e, anim.duration);
           			}
      				}
  					}
  				}else{
  					e = propObj.end - s;
  					value = propObj.current = anim.ease.js(dur, s, e, anim.duration);
  				}
  				switch (propObj.type) {
  					case 1:
  						anim.target[prop](value);
  						break;
  					case 2:
  						anim.target[prop] = value;
  						break;
  					case 3:
  						//Handle arrays for transforms like translate and scale
  						if (isArray(propObj.end)){
  							style.setStyle(anim.target, prop, values);
  						//Handle rgb colors
  						}else if(isObject(propObj.end)){
  							style.setStyle(anim.target, prop, 'rgb('+Math.ceil(r)+','+Math.ceil(g)+','+Math.ceil(b)+')');
  						}else{
  							style.setStyle(anim.target, prop, "" + value + propObj.unit);
  						}
  				}
  			}
  		}
  	}
  
  	// Call tick callbacks
  	executeCallbacks(anim.tickCallbacks);
  
  	// On complete...
  	if (anim.elapsed >= anim.duration) {
  		anim.isComplete = true;
  
  		// Handle delay after
  		if (anim.delayAfter) {
  			anim.duration += anim.delayAfter;
  			anim.delayAfter = 0;
  		} else {
  			// Remove css transition syntax
  			if (anim.usingCssTransitions) {
  				style.clearStyle(anim.target, 'transition');
  				anim.usingCssTransitions = false;
  			}
  
  			// Reset
  			callbacks = anim.completeCallbacks.slice();
  			(anim.keep) ? remove(anim) : destroy(anim);
  
  			// Trigger callbacks
  			// Delay to allow for GC and cleanup
  			setTimeout(function() {
  				executeCallbacks(callbacks);
  				callbacks = null;
  			}, 0);
  		}
  	}
  };
  
  /**
   * Execute one or more 'callbacks'
   * @param {Array}
   */
  function executeCallbacks (callbacks) {
  	if (callbacks.length) {
  		// Don't loop if only 1
  		if (callbacks.length == 1) {
  			callback = callbacks[0];
  			callback.args
  				?	callback.func.apply(null, callback.args)
  				: callback.func();
  		} else {
  			for (var i = 0, n = callbacks.length; i < n; i++) {
  				callback = callbacks[i];
  				callback.args
  					? callback.func.apply(null, callback.args)
  					: callback.func();
  			}
  		}
  	}
  };
  
  /**
   * Anim class
   */
  function Anim () {
  	this.id = null;
  	this.target = null;
  	this.duration = 0;
  	this.delayBefore = 0;
  	this.delayAfter = 0;
  	this.elapsed = 0;
  	this.properties = {};
  	this.ease = DEFAULT_EASING;
  	this.tickCallbacks = [];
  	this.completeCallbacks = [];
  	this.keep = false;
  	this.isRunning = false;
  	this.isComplete = false;
  	this.usingCssTransitions = false;
  }
  
  /**
   * Animate from existing values to target values
   * @param {Object} properties
   * @param {Number} [duration] (miliseconds)
   * @param {Object} [ease]
   * @returns {Anim}
   */
  Anim.prototype.to = function (properties, duration, ease) {
  	var current, end, p, val, tStyle;
  
  	if (ease) this.ease = ease;
  	if (duration == null) duration = DEFAULT_DURATION;
  	this.duration += duration;
  	this.elapsed = 0;
  	this.properties = {};
  	this.usingCssTransitions = false;
  
  	for (var prop in properties) {
  		val = properties[prop];
  		p = {
  			start: 0,
  			current: 0,
  			end: val,
  			type: 0
  		};
  
  		// Property is a Function
  		if (isFunction(this.target[prop])) {
  			p.start = this.target[prop]();
  			p.type = 1;
  
  		//Property is a property
  		} else if (prop in this.target && !isArray(p.end)) {
  			p.start = this.target[prop];
  			p.type = 2;
  
  		// Property is css
  		} else {
  			current = style.getNumericStyle(this.target, prop);
  			p.start = current[0];
  			// Use ending unit if a string is passed
  			if (isString(val)) {
  				end = style.parseNumber(val, prop);
  				p.unit = end[1];
  				p.end = end[0];
  				if (!style.hasTransitions){
  					// Need to handle colours diffrently with no transitions
  					// TODO: Handle rgba colours
  					if (end[1] === 'hex' || end[1] ===  'rgb'){
  						//Convert colours to component and hex to rgb
  						p.start = colourUtil.toComponent(current[0]);
  						p.end = colourUtil.toComponent(end[0]);
  					}
  				}
  
  			// Use the current unit if none specified
  			} else {
  				p.unit = current[1];
  				p.end = val;
  			}
  
  			// Use css transitions if available
  			if (style.hasTransitions) {
  				// First set up transition
  				if (!this.usingCssTransitions) {
  					tStyle = 'all ' + this.duration + 'ms';
  					if (ease) tStyle += ' ' + (this.ease.css || DEFAULT_EASING.css);
  					if (this.delayBefore) tStyle += ' ' + this.delayBefore + 'ms';
  					style.setStyle(this.target, {transition: tStyle});
  					this.usingCssTransitions = true;
  				}
  				p.type = 4;
  				style.setStyle(this.target, prop, p.end);
  			} else {
  				p.type = 3;
  			}
  		}
  		this.properties[prop] = p;
  	}
  
  	add(this);
  
  	// Chain
  	return this;
  };
  
  /**
   * Delay the start or completion of an animation
   * @param {Number} duration
   */
  Anim.prototype.delay = function (duration) {
  	if (duration != null) {
  		if (!this.isRunning) {
  			this.duration += duration;
  			this.delayBefore = duration;
  			add(this);
  		} else {
  			this.delayAfter = duration;
  		}
  	}
  
  	// Chain
  	return this;
  };
  
  /**
   * Retrieve the value for 'property'
   * @param {String} property
   * @returns {Object}
   */
  Anim.prototype.getProperty = function (property) {
  	if (this.isRunning) {
  		var prop = this.properties[property];
  		return prop != null ? prop.current : null;
  	}
  };
  
  /**
   * Set the 'value' for 'property'
   * @param {String} property
   * @param {Object} value
   */
  Anim.prototype.setProperty = function (property, value) {
  	if (this.isRunning) {
  		var prop = this.properties[property];
  		if (prop != null) prop.end = value;
  		// Set new end target for css transitions
  		if (prop.type == 4) style.setStyle(this.target, property, value);
  	}
  };
  
  /**
   * Register tick callback handler with optional arguments
   * @param {Function} callback
   * @param {...}
   * @returns {Anim}
   */
  Anim.prototype.onTick = function (callback) {
  	var args = (2 <= arguments.length)
  		? Array.prototype.slice.call(arguments, 1)
  		: null;
  	this.tickCallbacks.push({
  		func: callback,
  		args: args
  	});
  
  	// Chain
  	return this;
  };
  
  /**
   * Register complete callback handler with optional arguments
   * @param {Function} callback
   * @param {...}
   * @returns {Anim}
   */
  Anim.prototype.onComplete = function (callback) {
  	var args = (2 <= arguments.length)
  		? Array.prototype.slice.call(arguments, 1)
  		: null;
  	this.completeCallbacks.push({
  		func: callback,
  		args: args
  	});
  
  	// Chain
  	return this;
  };
  
  /**
   * Stop running Anim
   */
  Anim.prototype.stop = function () {
  	if (this.keep) {
  		remove(this)
  		return this;
  	} else {
  		return destroy(this);
  	}
  };
  
  /**
   * Destroy Anim
   */
  Anim.prototype.destroy = function () {
  	destroy(this);
  	return null;
  };
  
});
require.register('test/src/index', function(module, exports, require) {
  require('requestAnimationFrame');
  require('util.animate');
});
require('test/src/index');