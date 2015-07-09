$(document).ready(function() {

	// BRING IN SVG VIA AJAX
	xhr = new XMLHttpRequest();

	xhr.open('GET', '/img/logo1977.svg', false);
	xhr.overrideMimeType('image/svg+xml');
	xhr.send('');
	document.getElementById('load-overlay').appendChild(xhr.responseXML.documentElement);

	// MUSIC?
	var song = new Audio('/audio/maintheme.mp3');

	// LOADER ANIMATIONS
	$('#load-overlay').on('click', function(){
		$('#logo-stroke').attr('class', 'loaded');
		$('#load-text-container').addClass('loaded');

		setTimeout(function(){
			song.play();
			$('#logo-fill').attr('class', 'loaded');

			fadeVolumeOut(song, 15);

			setTimeout(function(){
				$('#long-ago').addClass('loaded');

				setTimeout(function(){
					$('#load-overlay').remove();
					$('#long-ago').addClass('reveal');

					setTimeout(function(){
						$('#long-ago').remove();
					}, 3000);
				}, 4500);
			}, 5500);
		}, 3000);

		return false;
	});

	// AUDIO FADEOUT FUNCTION
	function fadeVolumeOut(audioElement, x) {
		$(audioElement).on('timeupdate', function() {
		    var vol = 1,
    			interval = 200;

			if (Math.floor(audioElement.currentTime) == x) {
				if (audioElement.volume == 1) {
					var fadeAudioInterval = setInterval(function() {
						if (vol > 0) {
    						vol -= 0.05;
        					audioElement.volume = vol.toFixed(2);
						}
						else {
							clearInterval(fadeAudioInterval);
						}
					}, interval);
				}
			}
    	});
	}




	// NAV FUNCTIONALITY
	$('#button-nav').on('click', function(){
		$('main, #button-nav').toggleClass('nav-open');

		return false;
	});
});