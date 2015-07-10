$(document).ready(function() {

	// DATA GLOBAL VARIABLES
	var planetData = [],
		localPlanetData = [];



	// GET PLANET DATA
	getPlanetData();

	function getPlanetData() {
		// REQUESTS
		var localRequest = $.getJSON( '/data/planets.json', function( data ) {
				// console.log('local success');
				// console.log( data.name );
				localPlanetData.push( data );
			})
			.fail(function() {
				console.log('local error');
			});

		var planetRequest = $.getJSON( 'http://swapi.co/api/planets/?page=6', function( data ) {
				console.log('SWAPI success');
				// console.log( data.results );
				// planetData.push( data.results );
				$.each( data.results, function( key, value ) {
					planetData.push( value );
				});
			})
			.fail(function() {
				console.log('SWAPI error');
			});

		// COMPLETED
		planetRequest.done(function(){
			// BACKWARDS LOOP SINCE REMOVING OBJECTS
			// for ( i = 0; i < planetData.length; i ++ ) {
			for( var i = planetData.length; i--; ) {
				// REMOVE PLANETS WITHOUT MOVIES
				// console.log( planetData[i].films.length );
				if ( planetData[i].films.length < 1 ) {
					planetData.splice(i, 1);
				}

				// ADD X & Z POSITION TO PLANET DATA
				localPlanetData.filter(function (planet) {
				    if (planet.name === planetData[i].name) {
				    	// console.log( planet.xpos, planet.zpos );
				    	planetData[i].xpos = planet.xpos;
				    	planetData[i].zpos = planet.zpos;
				    }
				});
				
				// console.log( planetData[i].name );
			}

			console.log( planetData );
		});
	}


	// MAP GLOBAL VARIABLES
	var container;

	var camera,
		scene,
		renderer;
	var starfield = [];



	// INITIATE OVERALL THREE.JS SCENE
	// init();
	// animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');


		// SCENE SETUP AND VARIABLES
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2( 0x000000, 0.0001 );


		// INITIAL CAMERA POSITIONING
		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 3000 );
		camera.position.x = 0;
		// camera.position.y = 2000;
		// camera.position.z = 2000;
		camera.position.y = 800;
		camera.position.z = 400;


		// TESTING CAMERA POSITION & LIGHTS
		scene.add( new THREE.AmbientLight( 0x2f2f2f ) );
		// light = new THREE.HemisphereLight( 0xffffff, 0x000000, 1 );
		light = new THREE.DirectionalLight( 0xffffff );
		light.position.set( -0.25, 1, 0.25 );
		scene.add( light );

		var texture = THREE.ImageUtils.loadTexture( '/img/test/test.jpg' );
		// texture.repeat.set( 2, 2 );
		var material = new THREE.MeshLambertMaterial({
			map: texture,
			side: THREE.DoubleSide
		});
		object = new THREE.Mesh( new THREE.SphereGeometry( 36, 36, 36 ), material );
		object.position.set( 0, 0, 0 );
		scene.add( object );

		object = new THREE.Mesh( new THREE.SphereGeometry( 36, 36, 36 ), material );
		object.position.set( 0, 0, 300 );
		scene.add( object );

		object = new THREE.Mesh( new THREE.SphereGeometry( 36, 36, 36 ), material );
		object.position.set( 0, 0, -300 );
		scene.add( object );


		// RENDERING SETUP
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );

		container.appendChild( renderer.domElement );


		// RESIZING WINDOW
		window.addEventListener( 'resize', onWindowResize, false );


		// CREATE STARFIELD
		makeStars(1000, 450, 3);
	}
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}



	// STARFIELD PARTICLE FUNCTION
	function makeStars(initialStarDistance, numStars, numStarFields) {
		for ( fields = 0; fields < numStarFields; fields ++ ) {

			var starDistance = initialStarDistance + (fields * 250);
			var starMaterial = [],
				starParticleSystem = [];

			starfield[fields] = new THREE.Object3D( 0, 0, 0 );

			for ( outer = 0; outer < 3; outer ++ ) {

		        var starParticles = new THREE.Geometry();

		        // CREATE SPHERE OF PARTICLES
		        for ( inner = 0; inner < (numStars / 3); inner ++ ) {
					var x = -1 + Math.random() * 2,
		            	y = -1 + Math.random() * 2,
		            	z = -1 + Math.random() * 2;
		            var d = 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

		            x *= d;
		            y *= d;
		            z *= d;

					var starParticle = new THREE.Vector3(
		               (x * starDistance) + randomRange(0, 100),
		               (y * starDistance) + randomRange(0, 100),
		               (z * starDistance) + randomRange(0, 100)
		               // x * starDistance,
		               // y * starDistance,
		               // z * starDistance
		            );

		            starParticles.vertices.push(starParticle);
		        }

		        // SPRITES AND SHADING
				starMaterial[outer] = new THREE.PointCloudMaterial({
					map: THREE.ImageUtils.loadTexture( '/img/sprite-star.png' ),
					blending: THREE.AdditiveBlending,
					size: ((outer * 6) + 12),
					opacity: ((outer + 1) / 3) - 0.1,
					alphaTest: 0.5,
					transparent: true,
					fog: true
		        });

		        starParticleSystem[outer] = new THREE.PointCloud( starParticles, starMaterial[outer] );
		        starParticleSystem[outer].sortParticles = true;

		        starfield[fields].add( starParticleSystem[outer] );
	    	}

	        scene.add( starfield[fields] );

	    }
	}
	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}



	// RENDERING
	function animate() {
		requestAnimationFrame( animate );

		render();
	}
	function render() {
		var time = Date.now() * 0.00005;

		for ( fields = 0; fields < starfield.length; fields ++ ) {
			var divisor = (fields + 1);

			starfield[fields].rotation.x = time * (-0.025 / divisor);
			starfield[fields].rotation.y = time * (-0.1 / divisor);
		}

		camera.lookAt( scene.position );
		renderer.render( scene, camera );
	}

});