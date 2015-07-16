importScripts('oboe.js');

var pages;

var workerLocalPlanets = [],
	workerRemotePlanets = [];

function getLocalPlanetData() {
	oboe( '/data/planets.json' )
		.node('planets.*', function( planet ){
			workerLocalPlanets.push( planet );
			return oboe.drop;
		})
		.done(function(){})
		.fail(function(){
			console.log('Local JSON error.');
		});
}

function getRemotePlanetData() {
	for ( i = 1; i < (pages + 1); i ++ ) {
		oboe( '//swapi.co/api/planets/?page=' + i )
			.node('results.*', function( planet ){
				workerRemotePlanets.push( planet );
				return oboe.drop;
			})
			.done(function(){})
			.fail(function(){
				console.log('Remote SWAPI JSON error.');
			});
	}
}

function planetRequestComplete() {
	for ( i = 0; i < workerRemotePlanets.length; i ++ ) {

	}
}


self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			pages = data.pages;

			getLocalPlanetData();
			getRemotePlanetData();

			break;

		case 'stop':
			break;
	};
}, false);