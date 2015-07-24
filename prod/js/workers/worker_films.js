importScripts('oboe.js');

var workerFilms = [];

function getFilmData() {
	oboe( '//swapi.co/api/films/?page=1' )
		.node('results.*', function( film ){
			workerFilms.push( film );

			workerFilms.sort(function(a, b) {
			    return parseFloat(a.episode_id) - parseFloat(b.episode_id);
			});

			return oboe.drop;
		})
		.done(function(){})
		.fail(function(){
			console.log('Remote SWAPI JSON error with films.');
		});
}



self.addEventListener( 'message', function( e ) {
	var data = e.data;

	switch (data.cmd) {
		case 'start':
			getFilmData();

			break;

		case 'stop':
			break;
	};
}, false);