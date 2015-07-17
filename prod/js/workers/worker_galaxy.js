function makeGalaxy( starCount ) {
	var list = [];

	// MATH VARIABLES
	var a = 12.5,
		b = 0.2;
	var windings = 1.5;
	var drift = 0.275;

	// FUNCTION TO ROTATE
    function rotate( dir, angle ) {
        var vecRes = {
        	x: 0,
        	y: 0,
        	z: 0
        };

        vecRes.x = dir.x * Math.cos(angle) - dir.z * Math.sin(angle);
        vecRes.z = dir.x * Math.sin(angle) + dir.z * Math.cos(angle);

        return vecRes;
    }

    // FUNCTION FOR RANDOM MATH
    Math.seed = 10;
	Math.sRandom = function (max, min) {
	    max = max || 1;
	    min = min || 0;

	    Math.seed = (Math.seed * 9301 + 49297) % 233280;
	    var rnd = Math.seed / 233280;

	    return min + rnd * (max - min);
	};

	// LOGARITHMIC SPIRAL EQUATION
	var tMax = 2.5 * Math.PI * windings;

	for ( var i = 0; i < starCount; i++ ) {
		var t = tMax * Math.random();

		var x = a * Math.exp(b * t) * Math.cos(t);
		x = x + (drift * x * Math.random()) - (drift * x * Math.random());

		var y = 0;

		var z = a * Math.exp(b * t) * Math.sin(t);
		z = z + (drift * z * Math.random()) - (drift * z * Math.random());

		if (Math.random() > 0.5) {
			list.push({
				vecX: x,
				vecY: randomRange(-15, 15),
				vecZ: z
			});
		}
		else {
			list.push({
				vecX: -x,
				vecY: randomRange(-15, 15),
				vecZ: -z
			});
		}
	}

	// GENERATE INNER RING
	for ( var i = 0; i < (starCount / 3); i++ ) {
		var vec = {
				x: Math.sRandom((a + 3) / 2, a + 3),
				y: 0,
				z: 0
			};
		var angle = Math.sRandom(0, Math.PI * 2.5);

		vec = rotate(vec, angle);

		list.push({
			vecX: vec.x,
			vecY: randomRange(-17, 17),
			vecZ: vec.z
		});
	}

	// GENERATE INNER CIRCLE
	for (var i = 0; i < (starCount / 4.5); i++) {
		var vec = {
				x: Math.sRandom(0.1, (a + 3) / 2),
				y: 0,
				z: 0
			};
		var angle = Math.sRandom(0, Math.PI * 2.5);

		vec = rotate(vec, angle);

		list.push({
			vecX: vec.x,
			vecY: randomRange(-20, 20),
			vecZ: vec.z
		});
	}

	// console.log( list );
	postMessage( list );
}

function randomRange(min, max) {
	return Math.random() * (max - min) + min;
}



self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			makeGalaxy( data.stars );

			break;

		case 'stop':
			break;
	};
}, false);