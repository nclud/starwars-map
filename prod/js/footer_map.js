// GENERAL VARIABLES
var container;
var scene,
	renderer;

// MAP VARIABLES
var gridMultiplier = 150;

// PLANET GLOBAL VARIABLES
var planetData = [];

// CAMERA VARIABLES
var camera,
	initialCameraPos,
	focalPoint;

// CONTROLS VARIABLES
var controls,
	projector,
	INTERSECTED;
var objectHover = false;
var mousePos = {
		x: -1000,
		y: -1000
	};

// OBJECT VARIABLES
var starfield = [],
	planets = [];
var galaxy;
var planetsLoaded = false;

// LIGHT GLOBAL VARIABLES
var globalLight,
	planetSpotlight = [];

// MOTION VARIABLES
var clock = new THREE.Clock();
var time,
	clockDelta;



$(document).ready(function() {

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
		var aspect = window.innerWidth / window.innerHeight,
			d = 500;
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
		renderer.shadowMapEnabled = true;
		renderer.setSize( window.innerWidth, window.innerHeight );

		container.appendChild( renderer.domElement );


		// EVENT LISTENERS
		window.addEventListener( 'resize', onWindowResize, false );
		window.addEventListener( 'mousemove', onDocumentMouseMove, false );


		// CREATE STARFIELD
		makeStars(12, 450, 3);


		// CREATE GALAXY
		// makeGalaxy(15000);


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
		var a = 12.5,
			b = 0.2;
		var windings = 1.5;
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
		for ( var i = 0; i < (starCount / 3); i++ ) {
			var vec = {
					x: Math.sRandom((a + 3) / 2, a + 3),
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
		for (var i = 0; i < (starCount / 4.5); i++) {
			var vec = {
					x: Math.sRandom(0.1, (a + 3) / 2),
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
			(0.75 * gridMultiplier),
			(0 * gridMultiplier),
			(-3.25 * gridMultiplier)
		);

		for (var i = 0; i < list.length; i++) {
			addStar(list[i].vecX, list[i].vecZ);
		}

		scene.add( galaxy );
	}



	// GET PLANET DATA
	var workerLocalPlanets = new Worker('/js/workers/worker_json.js');

	workerLocalPlanets.postMessage({
		'cmd': 'start',
		'pages': 7
	});
	workerLocalPlanets.addEventListener( 'message', function(e) {
		planetData = e.data;
		// console.log( planetData );

		makePlanets();
	}, false);



	// ADDING PLANETS BASED ON DATA
	function makePlanets() {
		var texture = THREE.ImageUtils.loadTexture( '/img/test/test.jpg' );
		// texture.repeat.set( 2, 2 );
		var material = new THREE.MeshLambertMaterial({
			map: texture,
			side: THREE.DoubleSide
		});

		for ( i = 0; i < planetData.length; i++ ) {
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

			planetsLoaded = true;
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
		// for ( planet = 0; planet < planets.length; planet ++ ) {
		// 	var singlePlanet = planets[planet];

		// 	singlePlanet.rotation.y = ( time / 24) * singlePlanet.rotation_period;
		// }

		// FIND INTERSECTIONS
		if ( planetsLoaded ) {
			findIntersection();
		}

		// CONTROLS UPDATE / PAUSE ON HOVER
		controls.update( clock.getDelta() );

		// if ( objectHover ) {
		// 	controls.enabled = false;
		// }
		// else {
		// 	controls.enabled = true;
		// }
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
		vector.unproject( camera );

		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

		// ARRAY OF ALL OBJECTS INTERSECTED
		var intersects = ray.intersectObjects( planets );

		// WHAT TO DO IF INTERSECTED
		if ( intersects.length > 0 ) {
			objectHover = true;

			if ( intersects[0].object != INTERSECTED ) {
				INTERSECTED = intersects[0].object;
				document.body.style.cursor = 'pointer';

				// LOWER GLOBAL LIGHTS
				// globalLight.intensity = 0.075;

				// ADD PLANET SPOTLIGHT
				// console.log( INTERSECTED.position.x, INTERSECTED.position.z );
				// planetHoverLight( INTERSECTED );
			}
		}
		else {
			objectHover = false;

			INTERSECTED = null;
			document.body.style.cursor = 'auto';

			globalLight.intensity = 0.85;
		}
	}



	// PLANET HOVER SPOTLIGHTS
	function planetHoverLight( planet ) {
		// x 0.6
		// z -1.6

		planetSpotlight[0] = new THREE.SpotLight( 0xe2e2e2 );
		planetSpotlight[0].intensity = 2;
		planetSpotlight[0].distance = 200;
		planetSpotlight[0].angle = 5;
		planetSpotlight[0].position.set(
			planet.position.x - (0.3 * gridMultiplier),
			75,
			planet.position.z + (0.3 * gridMultiplier)
		);
		planetSpotlight[0].target = planet;
		planetSpotlight[0].castShadow = true;
		planetSpotlight[0].shadowCameraVisible = true;

		planetSpotlight[1] = new THREE.SpotLight( 0xe2e2e2 );
		planetSpotlight[1].intensity = 2;
		planetSpotlight[1].distance = 200;
		planetSpotlight[1].angle = 5;
		planetSpotlight[1].position.set(
            planet.position.x,
            0,
            planet.position.z + (1 * gridMultiplier)
		);
		planetSpotlight[1].target = planet;
		planetSpotlight[1].castShadow = true;
		planetSpotlight[1].shadowCameraVisible = true;

		scene.add( planetSpotlight[0], planetSpotlight[1] );

		console.log( planetSpotlight[0].intensity )
	}



	// GENERAL FUNCTION TO GENERATE RANDOM NUMBER
	function randomRange(min, max) {
		return Math.random() * (max - min) + min;
	}

});