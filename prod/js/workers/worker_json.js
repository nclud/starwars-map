importScripts('oboe.js');

var pages;

var workerLocalPlanets = [],
	workerRemotePlanets = [];

function getLocalPlanetData() {
	// var localRequest = new XMLHttpRequest();

	// localRequest.open( 'GET', '/data/planets.json', true );
	// localRequest.send();

	// localRequest.onreadystatechange = function(){
	// 	if ( localRequest.readyState == 4 && localRequest.status == 200 ) {
	// 		var responseLocal = JSON.parse( localRequest.responseText );

	// 		for ( i = 1; i < responseLocal.planets.length; i ++ ) {
	// 			// console.log( responseLocal.planets[i] );
	// 			workerLocalPlanets.push( responseLocal.planets[i] );
	// 		}

	// 		// postMessage( workerLocalPlanets );
	// 	}
	// 	else if ( localRequest.status != 200 ) {
	// 		console.log('Local JSON error');
	// 	}
	// }

	oboe('/data/planets.json')
		.node('planets.*', function( planet ){
			workerLocalPlanets.push( planet );
		})
		.done(function( data ) {
			// we got it
			console.log( workerLocalPlanets );
		})
		.fail(function() {
			console.log('Local JSON error.');
		});
}

function getRemotePlanetData() {
	for ( i = 1; i < (pages + 1); i ++ ) {
		var remoteRequest = new XMLHttpRequest();

		remoteRequest.open( 'GET', '//swapi.co/api/planets/?page=' + i, true );
		remoteRequest.send();

		remoteRequest.onreadystatechange = function(){
			if ( remoteRequest.readyState == 4 && remoteRequest.status == 200 ) {
				console.log( remoteRequest.responseText );
			}
			else if ( remoteRequest.status != 200 ) {
				console.log('SWAPI JSON error on page ' + i);
			}
		}
	}

	// var pages = 7;

	// for ( i = 1; i < (pages + 1); i ++ ) {
	// 	// console.log(i);

	// 	var planetRequest = $.getJSON( '//swapi.co/api/planets/?page=' + i, function( data ) {
	// 			// console.log('SWAPI success');
	// 			$.each( data.results, function( key, value ) {
	// 				// ONLY STORE PLANETS WITH FILM ASSOCIATIONS
	// 				// if ( value.films.length > 0 ) {
	// 					planetData.push( value );
	// 				// }
	// 			});
	// 		})
	// 		.fail(function() {
	// 			console.log('SWAPI error');
	// 		});

	// 	if ( pages === i ) {
	// 		planetRequest.done(function(){
	// 			planetRequestComplete();
	// 		});
	// 	}
	// }
}


self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			pages = data.pages;

			getLocalPlanetData();
			// getRemotePlanetData();

			break;

		case 'stop':
			break;
	};
}, false);