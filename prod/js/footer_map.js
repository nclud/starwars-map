$(document).ready(function() {

	// MAP GLOBAL VARIABLES
	var container;

	var scene,
		renderer,
		globalLight;
	var camera,
		initialCameraPos,
		focalPoint;
	var gridMultiplier = 150;

	// DATA GLOBAL VARIABLES
	var planetData = [],
		localPlanetData = [];

	// CONTROLS VARIABLES
	var controls,
		projector,
		INTERSECTED;
	var objectHover = false;
	var mousePos = {
			x: 0,
			y: 0
		};

	// OBJECT GLOBAL VARIABLES
	var starfield = [],
		planets = [];
	var attributes,
		uniforms;
	var galaxy;

	// MOTION VARIABLES
	var clock = new THREE.Clock();
	var time,
		clockDelta;



	// INITIATE OVERALL THREE.JS SCENE
	init();
	animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');


		// SCENE SETUP AND VARIABLES
		scene = new THREE.Scene();
		// scene.fog = new THREE.FogExp2( 0x000000, 0.0001 );


		// INITIAL CAMERA POSITIONING
		// camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 3000 );
		// camera.position.x = 0;
		// camera.position.y = 2500;
		// camera.position.z = 2500;
		// camera.position.y = 600;
		// camera.position.z = 900;
		var aspect = window.innerWidth / window.innerHeight,
			d = 500;
		// camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, 0, 4000 );
		camera = new THREE.PerspectiveCamera( 60, aspect, 1, 3000 );
		focalPoint = new THREE.Vector3(
			0.5 * gridMultiplier,
			0 * gridMultiplier,
			-1.5 * gridMultiplier
		);
		initialCameraPos = new THREE.Vector3(
			0,
			d + (gridMultiplier / 2),
			d - gridMultiplier
		);
		camera.position.set( initialCameraPos.x, initialCameraPos.y, initialCameraPos.z );
		camera.lookAt( focalPoint );


		// ADDING LIGHTS
		scene.add( new THREE.AmbientLight( 0x2f2f2f ) );

		globalLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.85 );
		scene.add( globalLight );

		// light = new THREE.DirectionalLight( 0x3d3d3d );
		// light.position.set( -0.25, 1, 0.5 );
		// scene.add(light);


		// ADDING GRID FOR REFERENCE
		var gridGeometry = new THREE.PlaneGeometry(
	           3000,
	           3000,
	           Math.round(2000 / 150),
	           Math.round(2000 / 150)
           );
		var gridMaterial = new THREE.MeshBasicMaterial({
				wireframe: true,
				opacity: 0.15,
				transparent: true,
				side: THREE.DoubleSide
			});
		var grid = new THREE.Mesh( gridGeometry, gridMaterial );
		grid.rotation.order = 'YXZ';
		grid.rotation.y = - Math.PI / 2;
		grid.rotation.x = - Math.PI / 2;
		scene.add( grid );


		// ADDING CONTROLS & LIMITS
		controls = new THREE.OrbitControls( camera );
		controls.target = focalPoint;
		controls.noKeys = true;
		controls.rotateSpeed = 1;
		controls.zoomSpeed = 1.5;
		controls.panSpeed = 1;
		controls.dynamicDampingFactor = 0.3;
		controls.Xmin = -1250;
		controls.Xmax = 1250;
		controls.Ymin = -100;
		controls.Ymax = 1250;
		controls.minDistance = (gridMultiplier / 2);
		controls.maxDistance = 1000;
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI/2;


		// RENDERING SETUP
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setClearColor( 0x000000 );
		renderer.setSize( window.innerWidth, window.innerHeight );

		container.appendChild( renderer.domElement );


		// EVENT LISTENERS
		window.addEventListener( 'resize', onWindowResize, false );
		window.addEventListener( 'mousemove', onDocumentMouseMove, false );


		// CREATE STARFIELD
		makeStars(12, 450, 3);


		// CREATE GALAXY
		// makeGalaxy(20000);


		// PROJECTOR FOR WORLD/SCREEN INTERACTION
		projector = new THREE.Projector();

	}
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		controls.handleResize();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}



	// STARFIELD PARTICLE FUNCTION
	function makeStars(initialGridDistance, numStars, numStarFields) {
		for ( fields = 0; fields < numStarFields; fields ++ ) {

			var starDistance = (initialGridDistance * gridMultiplier) + (fields * 250);
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

		            starParticles.vertices.push( starParticle );
		        }

		        // SPRITES AND SHADING
				starMaterial[outer] = new THREE.PointCloudMaterial({
					map: THREE.ImageUtils.loadTexture( '/img/sprite-star.png' ),
					blending: THREE.AdditiveBlending,
					size: ((outer * 6) + 12),
					opacity: ((outer + 1) / 3) - 0.1,
					alphaTest: 0.5,
					transparent: true,
					fog: false
		        });

		        starParticleSystem[outer] = new THREE.PointCloud( starParticles, starMaterial[outer] );
		        starParticleSystem[outer].sortParticles = true;

		        starfield[fields].add( starParticleSystem[outer] );
	    	}

	        scene.add( starfield[fields] );

	    }
	}



	// GALAXY PARTICLE FUNCTION
	function makeGalaxy(starCount) {
		var geometry = new THREE.Geometry();
		var list = [];

		// MATH VARIABLES
		var a = 9,
			b = 0.16;
		var windings = 2;
		var drift = 0.275;

		// FUNCTION TO ADD PARTICLES TO GEOMETRY
		function addStar(x, z) {
		    var v = new THREE.Vector3();
		    v.x = x * 10;
		    v.z = z * 10;

		    geometry.vertices.push(v);
		}

		// FUNCTION TO ROTATE
        function rotate(dir, angle) {
            var vecRes = {
            	x: 0,
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

			var z = a * Math.exp(b * t) * Math.sin(t);
			z = z + (drift * z * Math.random()) - (drift * z * Math.random());

			if (Math.random() > 0.5) {
				list.push({
					vecX: x,
					vecZ: z
				});
			}
			else {
				list.push({
					vecX: -x,
					vecZ: -z
				});
			}
		}

		// GENERATE INNER RING
		for ( var i = 0; i < (starCount / 5); i++ ) {
			var vec = {
					x: Math.sRandom(6, 11),
					z: 0
				};
			var angle = Math.sRandom(0, Math.PI * 2.5);

			vec = rotate(vec, angle);

			list.push({
				vecX: vec.x,
				vecZ: vec.z
			});
		}

		// GENERATE INNER CIRCLE
		for (var i = 0; i < (starCount / 5); i++) {
			var vec = {
					x: Math.sRandom(0.1, 6.1),
					z: 0
				};
			var angle = Math.sRandom(0, Math.PI * 2.5);

			vec = rotate(vec, angle);

			list.push({
				vecX: vec.x,
				vecZ: vec.z
			});
		}

		// POINT CLOUD ADDITIONS
		var material = new THREE.PointCloudMaterial({
		      color: 0x0069ff,
		      size: 2
		});

		galaxy = new THREE.PointCloud( geometry, material );
		galaxy.position.set(
			(0.25 * gridMultiplier),
			(0 * gridMultiplier),
			(-2 * gridMultiplier)
		);

		for (var i = 0; i < list.length; i++) {
			addStar(list[i].vecX, list[i].vecZ);
		}

		scene.add( galaxy );
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
		function planetRequestLoop() {
			var pages = 7;

			for ( i = 1; i < (pages + 1); i ++ ) {
				// console.log(i);

				var planetRequest = $.getJSON( '//swapi.co/api/planets/?page=' + i, function( data ) {
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
		function planetRequestComplete() {
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
			// console.log( planetData );

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
				planetX = (planetData[i].xpos * gridMultiplier),
				planetZ = (planetData[i].zpos * gridMultiplier),
				planetSize = (planetData[i].diameter / 500),
				planetRotation = planetData[i].rotation_period;

			object = new THREE.Mesh( new THREE.SphereGeometry( planetSize, 36, 36 ), material );
			object.position.set( planetX, 0, planetZ );
			object.name = planetName;
			object.rotation_period = planetRotation;

			scene.add( object );
			planets.push( object );
			// console.log(i);
		}
	}



	// RENDERING
	function animate() {
		requestAnimationFrame( animate );

		render();
		update();
	}
	function render() {
		renderer.render( scene, camera );
	}
	function update() {
		clockDelta = clock.getDelta();
		time = Date.now() * 0.00005;

		// STARFIELD ROTATION
		for ( field = 0; field < starfield.length; field ++ ) {
			var divisor = (field + 1),
				singleField = starfield[field];

			singleField.rotation.x = time * (-0.025 / divisor);
			singleField.rotation.y = time * (0.1 / divisor);
		}

		// PLANET ROTATION
		for ( planet = 0; planet < planets.length; planet ++ ) {
			var singlePlanet = planets[planet];

			singlePlanet.rotation.y = ( time / 24) * singlePlanet.rotation_period;
		}

		// FIND INTERSECTIONS
		findIntersection();

		// ONLY UPDATE CONTROLS IF NOT HOVERING
		if (!objectHover) {
			controls.update( clock.getDelta() );
		}
	}



	// DETERMINE MOUSE POSITION
	function onDocumentMouseMove( event ) {
		mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}



	// DETERMINE INTERSECTIONS
	function findIntersection() {
		// RAY INTO SCENE
		var vector = new THREE.Vector3( mousePos.x, mousePos.y, 1 );
		// projector.unprojectVector( vector, camera );
		vector.unproject( camera );
		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

		// ARRAY OF ALL OBJECTS INTERSECTED
		var intersects = ray.intersectObjects( planets );

		// WHAT TO DO IF INTERSECTED
		if ( intersects.length > 0 ) {
			if ( intersects[0].object != INTERSECTED ) {

				INTERSECTED = intersects[0].object;
				document.body.style.cursor = 'pointer';

				console.log( intersects[0].object.name );
			}
		}
		else {
			INTERSECTED = null;
			document.body.style.cursor = 'auto';
		}
	}



	// GENERAL FUNCTION TO GENERATE RANDOM NUMBER
	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}

});