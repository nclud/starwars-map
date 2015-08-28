importScripts('oboe.js');

var workerFilms = [];
var protocol;

function getFilmData() {
	var url = 'http://swapi.co/api/films/?page=1';

	oboe( '/apipull.php?url=' + encodeURIComponent( url ) + '&expire=518400' )
		.node('results.*', function( film ){
			workerFilms.push( film );

			workerFilms.sort(function(a, b) {
			    return parseFloat(a.episode_id) - parseFloat(b.episode_id);
			});

			return oboe.drop;
		})
		.done(function(){
			postMessage( workerFilms );
		})
		.fail(function(){
			console.log('Remote SWAPI JSON error with films.');
		});
}



self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			protocol = data.protocol;

			getFilmData();

			break;

		case 'stop':
			break;
	};
}, false);