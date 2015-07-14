$(document).ready(function() {

	// MAP GLOBAL VARIABLES
	var container;

	var scene,
		renderer,
		globalLight;
	var camera,
		focalPoint;
	var starfield = [];

	// DATA GLOBAL VARIABLES
	var planetData = [],
		localPlanetData = [];



	// INITIATE OVERALL THREE.JS SCENE
	init();
	animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');


		// SCENE SETUP AND VARIABLES
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2( 0x000000, 0.0001 );


		// INITIAL CAMERA POSITIONING
		// camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
		// camera.position.x = 0;
		// camera.position.y = 2500;
		// camera.position.z = 2500;
		// camera.position.y = 600;
		// camera.position.z = 900;
		var aspect = window.innerWidth / window.innerHeight,
			d = 500;
		camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 1, 3000 );
		camera.position.set( 0, d, d );

		focalPoint = new THREE.Vector3(
			(0.5 * 150),
			(0 * 150),
			(-1.5 * 150)
		);


		// ADDING LIGHTS
		scene.add( new THREE.AmbientLight( 0x2f2f2f ) );
		globalLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.9 );
		scene.add( globalLight );

		// light = new THREE.DirectionalLight( 0x3d3d3d );
		// light.position.set( -0.25, 1, 0.5 );
		// scene.add(light);


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
		makeStars(1100, 450, 3);
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
		               (x * starDistance) + randomRange(0, 50),
		               (y * starDistance) + randomRange(0, 50),
		               (z * starDistance) + randomRange(0, 50)
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



	// GET PLANET DATA
	getPlanetData();

	function getPlanetData() {
		// LOCAL REQUEST
		var localRequest = $.getJSON( '/data/planets.json', function( data ) {
				// console.log('local success');
				$.each( data.planets, function( key, value ) {
					localPlanetData.push( value );
				});
			})
			.fail(function() {
				console.log('local error');
			});

		// SWAPI LOOP REQUEST
		var planetRequestLoop = function() {
			var pages = 7;

			for ( i = 1; i < (pages + 1); i ++ ) {
				// console.log(i);

				var planetRequest = $.getJSON( 'http://swapi.co/api/planets/?page=' + i, function( data ) {
						// console.log('SWAPI success');
						$.each( data.results, function( key, value ) {
							// ONLY STORE PLANETS WITH FILM ASSOCIATIONS
							// if ( value.films.length > 0 ) {
								planetData.push( value );
							// }
						});
					})
					.fail(function() {
						console.log('SWAPI error on page' + i);
					});

				if ( pages === i ) {
					planetRequest.done(function(){
						planetRequestComplete();
					});
				}
			}
		}

		// COMPLETED SWAPI PULL
		var planetRequestComplete = function() {
			for ( i = 0; i < planetData.length; i ++ ) {

				// GIVE GENERAL DIAMETER & ROTATION IF MISSING
				if ( planetData[i].diameter === 'unknown' || planetData[i].diameter === '0' ) {
					planetData[i].diameter = 10000;
				}
				if ( planetData[i].rotation_period === 'unknown' || planetData[i].rotation_period === '0' ) {
					planetData[i].rotation_period = 24;
				}

				// CHANGE DIAMETER & ORBIT TO NUMBERS FROM STRINGS
				var numberDiameter = parseInt( planetData[i].diameter );
				planetData[i].diameter = numberDiameter;
				var numberOrbit = parseInt(planetData[i].rotation_period);
				planetData[i].rotation_period = numberOrbit;

				// SHRINK LARGE PLANETS
				if ( planetData[i].diameter > 100000 ) {
					planetData[i].diameter = numberDiameter / 5;
				}

				// ADD X & Z POSITION TO PLANET DATA
				for ( x = 0; x < localPlanetData.length; x ++ ) {
					if ( localPlanetData[x].name == planetData[i].name ) {
						planetData[i].xpos = localPlanetData[x].xpos;
						planetData[i].zpos = localPlanetData[x].zpos;
					}
				}

			}

			// console.log( localPlanetData );
			console.log( planetData );

			// ADD PLANETS
			makePlanets();
		}

		planetRequestLoop();

	}



	// ADDING PLANETS BASED ON DATA
	function makePlanets() {
		var texture = THREE.ImageUtils.loadTexture( '/img/test/test.jpg' );
		// texture.repeat.set( 2, 2 );
		var material = new THREE.MeshLambertMaterial({
			map: texture,
			side: THREE.DoubleSide
		});

		for ( i = 0; i < planetData.length; i++ ) {
			// console.log(planetData[i].name);
			var planetName = planetData[i].name,
				planetX = (planetData[i].xpos * 150),
				planetZ = (planetData[i].zpos * 150),
				planetSize = (planetData[i].diameter / 500),
				planetRotation = planetData[i].rotation_period;

			object = new THREE.Mesh( new THREE.SphereGeometry( planetSize, 36, 36 ), material );
			object.position.set( planetX, 0, planetZ );
			object.name = planetName;
			object.rotation_period = planetRotation;

			scene.add( object );
		}
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
			starfield[fields].rotation.y = time * (0.1 / divisor);
		}

		camera.lookAt( focalPoint );

		renderer.render( scene, camera );
	}



	// FUNCTION TO GENERATE RANDOM NUMBER
	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}

});