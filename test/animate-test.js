var animate, style, expect, element;

// Make it work in node..
try {
	animate = require('../index.js');
	style = require('style');
	expect = require('expect.js');
	require('./sauce.js');
// .. or browser
} catch (err) {
	animate = require('./animate');
	style = require('style');
	expect = window.expect;
}

describe('animate', function () {
	this.timeout(4000);

	beforeEach(function () {
		element = document.createElement('div');
		document.body.appendChild(element);
	});
	afterEach(function () {
		document.body.removeChild(element);
	});

	describe('instance factory', function () {
		it('should not return an instance of "Anim" when not passed a target element', function () {
			expect(animate()).to.be(undefined);
		})
		it('should return unique instances of "Anim" when bound to the same target', function () {
			expect(animate(element)).to.not.equal(animate(element));
		});
		it('should return instances of "Anim" with unique "id"', function () {
			expect(animate(element)).to.have.property('id');
			expect(animate(element).id).to.not.equal(animate(element).id);
		});
		it('should return instances of "Anim" with "target" equal to passed element', function () {
			expect(animate(element).target).to.equal(element);
		});
		it('should return instances of "Anim" with "keep" flag set to "false" by default', function () {
			expect(animate(element).keep).to.equal(false);
		});
		it('should return instances of "Anim" with "keep" flag set to "true" when passed', function () {
			expect(animate(element).keep).to.equal(false);
		});
	});

	describe('to', function () {
		it('should animate an object property', function (done) {
			var obj = {
						prop: 0
					};
			animate(obj).to({prop: 1});
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				done();
			}, 600);
		});
		it('should animate an object function', function (done) {
			var obj = {
				prop: 0,
				func: function(val) {
					if (val != null) {
						this.prop = val;
					} else {
						return this.prop;
					}
				}
			}
			animate(obj).to({func: 1});
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				done();
			}, 600);
		});
		it('should animate an element\'s css property', function (done) {
			style.hasTransitions = false;
			animate(element).to({height: '100px'});
			setTimeout(function () {
				expect(style.getStyle(element, 'height')).to.equal('100px');
				done();
			}, 600);
		});
		it('should animate an element\'s css property using css transitions when available', function (done) {
			style.hasTransitions = true;
			animate(element).to({height: '100px'});
			setTimeout(function () {
				expect(style.getStyle(element, 'height')).to.equal('100px');
				done();
			}, 600);
		});
	})

	describe('getProperty', function () {
		it('should retrieve an animated property while animating', function (done) {
			var obj = {
				prop: 0
			};
			var anim = animate(obj).to({prop: 1});
			setTimeout(function () {
				expect(anim.getProperty('prop')).to.be.within(0,1);
			}, 100);
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				done();
			}, 600);
		});
	});

	describe('setProperty', function () {
		it('should set an animated property\'s end value while animating', function (done) {
			var obj = {
				prop: 0
			};
			var anim = animate(obj).to({prop: 1});
			setTimeout(function () {
				anim.setProperty('prop', 2);
			}, 100);
			setTimeout(function () {
				expect(obj.prop).to.equal(2);
				done();
			}, 600);
		});
	});

	describe('onTick', function () {
		it('should register a callback to be executed on each animation tick', function (done) {
			var ticks = 0
				, obj = {
						prop: 0
					};
			animate(obj).to({prop: 1}).onTick(function () {
				ticks++;
			});
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				expect(ticks).to.be.above(25);
				done();
			}, 600);
		});
		it('should execute a callback with passed arguments on each animation tick', function (done) {
			var ticks = {
						t: 0
					}
				, proxy = ticks
				, obj = {
						prop: 0
					};
			animate(obj).to({prop: 1}).onTick(function (ticksProxy) {
				ticksProxy.t++;
			}, proxy);
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				expect(ticks.t).to.be.above(25);
				done();
			}, 600);
		});
	});

	describe('onComplete', function () {
		it('should register a callback to be executed on animation completion', function (done) {
			var obj = {
						prop: 0
					};
			animate(obj).to({prop: 1}).onComplete(function () {
				expect(obj.prop).to.equal(1);
				done();
			});
		});
		it('should execute a callback with passed arguments on animation completion', function (done) {
			var obj = {
						prop: 0
					};
			animate(obj).to({prop: 1}).onComplete(function (objProxy) {
				expect(objProxy.prop).to.equal(1);
				done();
			}, obj);
		});
	});

	describe('delay', function () {
		it('should delay animation start when added before', function (done) {
			var obj = {
						prop: 0
					};
			animate(obj).delay(500).to({prop: 1});
			setTimeout(function () {
				expect(obj.prop).to.equal(0);
			}, 300);
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
				done();
			}, 1100);
		});
		it('should delay animation end when added after', function (done) {
			var obj = {
						prop: 0
					};
			var anim = animate(obj).to({prop: 1}).delay(500);
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
			}, 600);
			setTimeout(function () {
				expect(anim.isRunning).to.equal(true);
			}, 900);
			setTimeout(function () {
				expect(anim.isRunning).to.equal(false);
				done();
			}, 1100);
		});
		it('should execute a callback after "to" when added before', function (done) {
			var time = Date.now()
				, obj = {
						prop: 0
					};
			animate(obj).delay(500).to({prop: 1}).onComplete(function () {
				expect(obj.prop).to.equal(1);
				expect(Date.now() - time).to.be.greaterThan(999);
				done();
			});
		});
		it('should delay execution of callback when added after "to"', function (done) {
			var time = Date.now()
				, obj = {
						prop: 0
					};
			var anim = animate(obj).to({prop: 1}).delay(500).onComplete(function () {
				expect(Date.now() - time).to.be.greaterThan(999);
				done();
			});
			setTimeout(function () {
				expect(obj.prop).to.equal(1);
			}, 600);
		});
	});

	describe('stop', function () {
		it('should stop running the animation when called', function (done) {
			var obj = {
						prop: 0
					};
			var anim = animate(obj).to({prop: 1});
			setTimeout(function () {
				anim.stop();
				expect(anim.isRunning).to.be(false);
				done();
			}, 100);
		});
	});

	describe('destroy', function () {
		it('should stop and reset the Anim instance', function (done) {
			var obj = {
						prop: 0
					};
			var anim = animate(obj).to({prop: 1});
			setTimeout(function () {
				anim.destroy();
				expect(anim.isRunning).to.be(false);
				expect(anim.target).to.be(null);
				done();
			}, 100);
		});
	});
});
