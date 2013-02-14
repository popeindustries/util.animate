var polyfill = require('util.polyfill')
	, easing = require('util.easing')
	, objectUtils = require('util.object')
	, css = require('dom.css')
	, win = window
	, doc = win.document
	, FRAME_RATE = 60
	, DEFAULT_DURATION = 0.5
	, anims = {}
	, length = 0
	, pool = []
	, uid = 1
	, tick = 0
	, last = 0
	, running = false
	, csstransitions = css.csstransitions;

// TODO: move to utils.function
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

// API
module.exports = animate;

/**
 * Retrieve an Anim instance bound to 'target'
 * Set 'keep' to true to prevent cleanup
 * @param {Object} target
 * @param {Boolean} keep
 * @returns {Anim}
 */
function animate(target, keep) {
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
function add(anim) {
	if (!anims[anim.id]) {
		anims[anim.id] = anim;
		anim.isRunning = true;
		length++;
		// Start if not running
		if (!running) {
			running = true;
			tick = 0;
			last = +(new Date);
			_onTick();
		}
	}
}

/**
 * Remove 'anim' from render loop
 * @param {Anim} anim
 */
function remove(anim) {
	anim.isRunning = false;
	delete anims[anim.id];
	length--;
	// Stop if none active
	if (!length) running = false;
}

/**
 * Destroy 'anim'
 * @param {Anim} anim
 */
function destroy(anim) {
	// Check that this is eligible for destruction
	if (anim.id) {
		if (anim.isRunning) remove(anim);
		// Reset
		anim.id = null;
		anim.target = null;
		anim.duration = 0;
		anim.elapsed = 0;
		anim.properties = {};
		anim.easing = easing['outCubic'];
		anim.tickCallbacks = [];
		anim.completeCallbacks = [];
		anim.keep = false;
		anim.isRunning = false;
		anim.useCssTransitions = false;
		anim.transitionStyle = '';
		pool.push(anim);
	}
}

/**
 * Tick handler
 * @param {Number} time
 */
function _onTick(time) {
	var now = +(new Date)
		, tick = now - last;
	// Store
	last = now;
	for (var id in anims) {
		anims[id]._render(tick);
	}
	// Loop
	if (running) win.requestAnimationFrame(_onTick);
}

/**
 * Anim class
 */
function Anim() {
	this._render = bind(this._render, this);
	this.id = null;
	this.target = null;
	this.duration = 0;
	this.elapsed = 0;
	this.properties = {};
	this.easing = easing['outCubic'];
	this.tickCallbacks = [];
	this.completeCallbacks = [];
	this.isRunning = false;
	this.keep = false;
	this.useCssTransitions = false;
	this.transitionStyle = '';
}

/**
 * Animate from existing values to target values
 * @param {Object} properties
 * @param {Number} duration (miliseconds)
 * @param {String} ease
 */
Anim.prototype.to = function(properties, duration, ease) {
	var current, end, p, s1, val;
	if (duration == null) duration = DEFAULT_DURATION;
	if (ease != null) this.easing = easing[ease];
	this.duration = duration * 1000;
	this.elapsed = 0;
	this.properties = {};
	this.useCssTransitions = false;
	for (var prop in properties) {
		val = properties[prop];
		p = {
			start: 0,
			current: 0,
			end: val,
			type: 0
		};
		// Property is a Function
		if (objectUtils.isFunction(this.target[prop])) {
			p.start = this.target[prop]();
			p.type = 1;
		// Property is property
		} else if (prop in this.target) {
			p.start = this.target[prop];
			p.type = 2;
		// Property is css
		} else {
			current = css.getNumericStyle(this.target, prop);
			p.start = current[0];
			// Use ending unit if a string is passed
			if (objectUtils.isString(val)) {
				end = css.parseNumber(val, prop);
				p.unit = end[1];
				p.end = end[0];
			// Use the current unit if none specified
			} else {
				p.unit = current[1];
				p.end = val;
			}
			// Use css transitions if available
			if (csstransitions) {
				// First set up transition
				if (!this.useCssTransitions) {
					s1 = (this.target.getAttribute('style') || '').length;
					css.setStyle(this.target, {
						'transition-property': 'all',
						'transition-duration': "" + this.duration + "ms"
					});
					if (ease) css.setStyle(this.target, 'transition-timing-function', easing.css[ease]);
					// Protect against styles getting translated to shorthand (Chrome)
					this.transitionStyle = this.target.getAttribute('style').slice(s1);
					this.useCssTransitions = true;
				}
				p.type = 4;
				css.setStyle(this.target, prop, p.end + p.unit);
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
 * Retrieve the value for 'property'
 * @param {String} property
 * @returns {Object}
 */
Anim.prototype.getProperty = function(property) {
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
Anim.prototype.setProperty = function(property, value) {
	if (this.isRunning) {
		var prop = this.properties[property];
		if (prop != null) prop.end = value;
	}
};

/**
 * Register tick callback handler
 * @param {Function} callback
 * @param {...}
 */
Anim.prototype.onTick = function(callback) {
	var args = 2 <= arguments.length ? Array.slice.call(arguments, 1) : [];
	this.tickCallbacks.push({
		func: callback,
		args: args
	});
	// Chain
	return this;
};

/**
 * Register complete callback handler
 * @param {Function} callback
 * @param {...}
 */
Anim.prototype.onComplete = function(callback) {
	var args = 2 <= arguments.length ? Array.slice.call(arguments, 1) : [];
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
Anim.prototype.stop = function() {
	if (this.isRunning) {
		if (this.keep) {
			remove(this);
		} else {
			destroy(this);
		}
	}
};

/**
 * Destroy Anim
 */
Anim.prototype.destroy = function() {
	destroy(this);
	return null;
};

/**
 * Render
 * @param {Number} time
 */
Anim.prototype._render = function(time) {
	var props = this.properties
		, b, c, callback, cbs, dur, propObj, value;
	this.elapsed += time;
	// Make sure total time does not exceed duration
	dur = this.elapsed < this.duration ? this.elapsed : this.duration;
	for (var prop in props) {
		propObj = props[prop];
		if (propObj.type < 4) {
			b = propObj.start;
			c = propObj.end - b;
			value = propObj.current = this.easing(dur, b, c, this.duration);
			switch (propObj.type) {
				case 1:
					this.target[prop](value);
					break;
				case 2:
					this.target[prop] = value;
					break;
				case 3:
					css.setStyle(this.target, prop, "" + value + propObj.unit);
			}
		}
	}

	// Call tick callbacks
	if (this.tickCallbacks.length) {
		// Don't loop if only 1
		if (this.tickCallbacks.length == 1) {
			this.tickCallbacks[0].func.apply(null, this.tickCallbacks[0].args);
		} else {
			cbs = this.tickCallbacks;
			for (var i = 0, n = cbs.length; i < n; i++) {
				callback = cbs[i];
				callback.func.apply(null, callback.args);
			}
		}
	}

	// On complete...
	if (this.elapsed >= this.duration) {
		// Remove css transition syntax
		if (this.useCssTransitions) {
			this.target.setAttribute('style', this.target.getAttribute('style').replace(this.transitionStyle, ''));
			this.useCssTransitions = false;
			this.transitionStyle = '';
		}
		// Reset
		cbs = this.completeCallbacks.slice();
		this.tickCallbacks = [];
		this.completeCallbacks = [];
		this.properties = {};
		(this.keep) ? remove(this) : destroy(this);
		// Trigger callbacks
		if (cbs.length) {
			// Delay 1 frame to allow for GC and cleanup
			win.requestAnimationFrame(function() {
				if (cbs.length === 1) {
					cbs[0].func.apply(null, cbs[0].args);
				} else {
					for (var i = 0, n = cbs.length; i < n; i++) {
						callback.func.apply(null, cbs[i].args);
					}
				}
				cbs = null;
			});
		}
	}
};
