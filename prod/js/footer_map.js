// STATS
var stats;



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

// WORKERS
var workerGalaxy = new Worker('/js/workers/worker_galaxy.js'),
	workerLocalPlanets = new Worker('/js/workers/worker_json.js');



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
		// scene.add( grid );


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
		makeStars( 12, 450, 3 );


		// CREATE GALAXY
		getGalaxy( 15000 );


		// GET & MAKE PLANETS
		// getPlanets();


		// PROJECTOR FOR WORLD/SCREEN INTERACTION
		projector = new THREE.Projector();



		// STATS
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild( stats.domElement );

	}
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		controls.handleResize();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}



	// STARFIELD PARTICLE FUNCTION
	function makeStars( initialGridDistance, numStars, numStarFields ) {
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
	function getGalaxy( starCount ) {
		var list = [];

		workerGalaxy.postMessage({
			'cmd': 'start',
			'gridMultiplier': gridMultiplier,
			'stars': starCount
		});
		workerGalaxy.addEventListener( 'message', function(e) {
			list = e.data;

			makeGalaxy( list );
		}, false);
	}

	function makeGalaxy( data ) {
		var geometry,
			texture,
			material;
		var attributes,
			uniforms;

		// FUNCTION TO ADD PARTICLES TO GEOMETRY
		function addStar( x, y, z ) {
		    var v = new THREE.Vector3();
		    v.x = x * 10;
		    v.y = y;
		    v.z = z * 10;

		    geometry.vertices.push(v);
		}

		// ADDING PARTICLES
		geometry = new THREE.Geometry();

		for ( var i = 0; i < data.length; i++ ) {
			addStar( data[i].vecX, data[i].vecY, data[i].vecZ );
		}

		texture = THREE.ImageUtils.loadTexture( '/img/test/particle.png' );
		texture.minFilter = THREE.LinearFilter;

		// material = new THREE.PointCloudMaterial({
		//     // color: 0x0069ff,
		//     color: 0xa9ccff,
		//     map: texture,
		//     size: 15,
		// 	blending: THREE.AdditiveBlending,
		// 	opacity: 0.75,
		// 	alphaTest: 0.1,
		// 	transparent: true,
		// 	fog: false
		// });

		uniforms = {
			texture: 		{ type: 't', value: texture }
		}
		attributes = {
			customSize: 	{ type: 'f', value: [] }
		}

		for ( var s = 0; s < geometry.vertices.length; s++ ) {
			var randomSize = Math.round(randomRange(45, 75));

			attributes.customSize.value[s] = randomSize.toFixed(1);
		}

		material = new THREE.ShaderMaterial({
			uniforms: 		uniforms,
			attributes: 	attributes,
			vertexShader:   document.getElementById('galaxyvertex').textContent,
			fragmentShader: document.getElementById('galaxyfragment').textContent,
			transparent: 	true,
			alphaTest: 		0.5,  // if having transparency issues, try including: alphaTest: 0.5,
			blending: 		THREE.AdditiveBlending,
			depthTest: 		false
			// I guess you don't need to do a depth test if you are alpha blending?
			//
		});

		galaxy = new THREE.PointCloud( geometry, material );
		galaxy.position.set(
			(0.75 * gridMultiplier),
			(0 * gridMultiplier),
			(-3.25 * gridMultiplier)
		);
		galaxy.sortParticles = true;

		scene.add( galaxy );
	}



	// GET PLANET DATA & MAKE PLANETS
	function getPlanets() {
		workerLocalPlanets.postMessage({
			'cmd': 'start',
			'pages': 7
		});
		workerLocalPlanets.addEventListener( 'message', function(e) {
			planetData = e.data;

			makePlanets();
		}, false);
	}

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


		// STATS
		stats.update();
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
	function randomRange( min, max ) {
		return Math.random() * (max - min) + min;
	}

});