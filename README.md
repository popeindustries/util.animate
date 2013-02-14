Cross-browser animation engine, using CSS transitions where possible.

## Usage
```javascript
var anim = require('util.animate');

var el = document.getElementById('myEl');
anim(el).to({left:'75px', top:'25px'}, 2, 'outQuad').onComplete(function() {
	// Do when finished...
});
```