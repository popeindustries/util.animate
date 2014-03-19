var style = require('dom.style')
	,	identify = require('util.identify')
	, isFunction = identify.isFunction
	, isString = identify.isString
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
	, DEFAULT_EASING = require('util.easing').outCubic
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
		, b, c, callback, callbacks, dur, propObj, value;

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
				b = propObj.start;
				c = propObj.end - b;
				value = propObj.current = anim.ease.js(dur, b, c, anim.duration);
				switch (propObj.type) {
					case 1:
						anim.target[prop](value);
						break;
					case 2:
						anim.target[prop] = value;
						break;
					case 3:
						style.setStyle(anim.target, prop, "" + value + propObj.unit);
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

		// Property is property
		} else if (prop in this.target) {
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
				style.setStyle(this.target, prop, p.end + p.unit);
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
