importScripts('oboe.js');

var pages;
var protocol;

var workerLocalPlanets = [],
	workerRemotePlanets = [];

var completed = [];

function getLocalPlanetData() {
	oboe( '/data/planets.json' )
		.node('planets.*', function( planet ){
			workerLocalPlanets.push( planet );

			return oboe.drop;
		})
		.done(function(){
			getRemotePlanetData();
		})
		.fail(function(){
			console.log('Local JSON error.');
		});
}

function getRemotePlanetData() {
	var url = '';

	for ( i = 1; i < pages; i ++ ) {
		url += 'http://swapi.co/api/planets/?page=' + i + ',';
	}
	url += 'http://swapi.co/api/planets/?page=' + pages;

	oboe( '/apipull.php?url=' + encodeURIComponent( url ) + '&expire=518400&json&errors' )
		.node('results.*', function( planet ){
			workerRemotePlanets.push( planet );

			return oboe.drop;
		})
		.done(function(){
			planetRequestComplete();
		})
		.fail(function(){
			console.log('Remote SWAPI JSON error with planets.');
		});
}

function planetRequestComplete() {
	for ( i = 0; i < workerRemotePlanets.length; i ++ ) {
		// GIVE GENERAL DIAMETER & ROTATION IF MISSING
		if ( workerRemotePlanets[i].diameter === 'unknown' || workerRemotePlanets[i].diameter === '0' ) {
			workerRemotePlanets[i].diameter = 10000;
		}
		if ( workerRemotePlanets[i].rotation_period === 'unknown' || workerRemotePlanets[i].rotation_period === '0' ) {
			workerRemotePlanets[i].rotation_period = 24;
		}

		// CHANGE DIAMETER & ORBIT TO NUMBERS FROM STRINGS
		var numberDiameter = parseInt( workerRemotePlanets[i].diameter ),
			numberOrbit = parseInt(workerRemotePlanets[i].rotation_period);

		workerRemotePlanets[i].diameter = numberDiameter;
		workerRemotePlanets[i].rotation_period = numberOrbit;

		// SHRINK LARGE PLANETS
		if ( workerRemotePlanets[i].diameter > 100000 ) {
			workerRemotePlanets[i].diameter = numberDiameter / 5;
		}

		// MATCHING PLANET DATA SETS
		for ( x = 0; x < workerLocalPlanets.length; x ++ ) {
			if ( workerLocalPlanets[x].name == workerRemotePlanets[i].name ) {
				// ADD X & Z POSITION TO PLANET DATA
				workerRemotePlanets[i].xpos = workerLocalPlanets[x].xpos;
				workerRemotePlanets[i].zpos = workerLocalPlanets[x].zpos;

				// ADD TEXTURES
				workerRemotePlanets[i].texture = workerLocalPlanets[x].terrain
			}
		}
	}

	postMessage( workerRemotePlanets );
}



self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			pages = data.pages;
			protocol = data.protocol;

			getLocalPlanetData();

			break;

		case 'stop':
			break;
	};
}, false);