// STATS
var stats;



// GENERAL VARIABLES
var container;
var scene,
	renderer;

// MAP VARIABLES
var gridMultiplier = 150;

// CAMERA VARIABLES
var camera,
	initialCameraPos,
	focalPoint;
var oldCameraPos,
	oldCameraFocus;
var newCameraPos,
	newCameraFocus;

// CONTROLS VARIABLES
var controls;
var raycaster,
	mousePos = new THREE.Vector2( -1000, 1000 ),
	INTERSECTED;
var objectHover = false;
var intersections = true;

// LIGHT GLOBAL VARIABLES
var globalLight;

// OBJECT VARIABLES
var planetData = [];
var starfield = [],
	planets = [];
var galaxy;
var planetsLoaded = false;
var planetText;
var outlineMaterial,
	outlineMesh;

// MOTION VARIABLES
var clock = new THREE.Clock();
var time,
	clockDelta;

// WORKERS
var workerGalaxy = new Worker('/js/workers/worker_galaxy.js'),
	workerLocalPlanets = new Worker('/js/workers/worker_planets.js');



$(document).ready(function() {

	// INITIATE OVERALL THREE.JS SCENE
	init();
	animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');
		planetText = document.getElementById('planet-title');


		// SCENE SETUP AND VARIABLES
		scene = new THREE.Scene();


		// INITIAL CAMERA POSITIONING
		var aspect = window.innerWidth / window.innerHeight,
			d = 500;
		camera = new THREE.PerspectiveCamera( 60, aspect, 1, 2500 );
		focalPoint = new THREE.Vector3(
			0.65 * gridMultiplier,
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
		// var gridGeometry = new THREE.PlaneGeometry(
	 //           3000,
	 //           3000,
	 //           Math.round(2000 / 150),
	 //           Math.round(2000 / 150)
  //          );
		// var gridMaterial = new THREE.MeshBasicMaterial({
		// 		wireframe: true,
		// 		opacity: 0.15,
		// 		transparent: true,
		// 		side: THREE.DoubleSide
		// 	});
		// var grid = new THREE.Mesh( gridGeometry, gridMaterial );
		// grid.rotation.order = 'YXZ';
		// grid.rotation.y = - Math.PI / 2;
		// grid.rotation.x = - Math.PI / 2;
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


		// EVENT LISTENERS
		window.addEventListener( 'resize', onWindowResize, false );
		window.addEventListener( 'mousemove', onDocumentMouseMove, false );
		window.addEventListener( 'click', onDocumentClick, false );


		// CREATE STARFIELD
		makeStars( 12, 450, 3 );


		// CREATE GALAXY
		getGalaxy( 15000 );


		// GET & MAKE PLANETS
		getPlanets();


		// PROJECTOR FOR WORLD/SCREEN INTERACTION
		raycaster = new THREE.Raycaster();


		// STATS
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.right = '0px';
		container.appendChild( stats.domElement );


		// RENDERING SETUP
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setClearColor( 0x000000 );
		renderer.shadowMapEnabled = true;
		renderer.setSize( window.innerWidth, window.innerHeight );


		// CONTAINER BUUILD
		container.appendChild( renderer.domElement );
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
		        starParticleSystem[outer].castShadow = false;
				starParticleSystem[outer].receiveShadow = false;

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
		var galaxyGeometry,
			galaxyUniforms,
			galaxyAttributes,
			galaxyMaterial;

		// FUNCTION TO ADD PARTICLES TO GEOMETRY
		function addStar( x, y, z ) {
		    var v = new THREE.Vector3();
		    v.x = x * 10;
		    v.y = y;
		    v.z = z * 10;

		    galaxyGeometry.vertices.push(v);
		}

		// ADDING PARTICLES
		galaxyGeometry = new THREE.Geometry();

		for ( var i = 0; i < data.length; i++ ) {
			addStar( data[i].vecX, data[i].vecY, data[i].vecZ );
		}

		galaxyUniforms = {
			color: 			{ type: 'c', value: new THREE.Color(0x70abff) }
		}
		galaxyAttributes = {
			customSize: 	{ type: 'f', value: [] },
			customOpacity: 	{ type: 'f', value: [] }
		}

		for ( var s = 0; s < galaxyGeometry.vertices.length; s++ ) {
			var randomSize = Math.round(randomRange(15, 25)),
				randomOpacity = randomRange(0.65, 0.85);

			galaxyAttributes.customSize.value[s] = randomSize.toFixed(1);
			galaxyAttributes.customOpacity.value[s] = randomOpacity.toFixed(2);
		}

		galaxyMaterial = new THREE.ShaderMaterial({
			uniforms: 		galaxyUniforms,
			attributes: 	galaxyAttributes,
			vertexShader:   document.getElementById('galaxyvertex').textContent,
			fragmentShader: document.getElementById('galaxyfragment').textContent,
			transparent: 	true,
			alphaTest: 		0.25,
			blending: 		THREE.AdditiveBlending,
			depthTest: 		true,
			depthWrite: 	false
		});

		galaxy = new THREE.PointCloud( galaxyGeometry, galaxyMaterial );
		galaxy.position.set(
			(1 * gridMultiplier),
			(0 * gridMultiplier),
			(-3.5 * gridMultiplier)
		);
		galaxy.sortParticles = true;
		galaxy.castShadow = false;
		galaxy.receiveShadow = false;

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
		for ( i = 0; i < planetData.length; i++ ) {
			var planetName = planetData[i].name,
				planetX = (planetData[i].xpos * gridMultiplier),
				planetZ = (planetData[i].zpos * gridMultiplier),
				planetSize = (planetData[i].diameter / 500),
				planetRotation = planetData[i].rotation_period,
				planetTexture = planetData[i].texture;

			object = new THREE.Mesh(
				new THREE.SphereGeometry( planetSize, 36, 36 ),
				new THREE.MeshPhongMaterial({
					map: THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '.jpg' ),
					bumpMap: THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '-bumpmap.jpg' ),
					bumpScale: 3,
					metal: false,
					shininess: 20,
					depthTest: true
				})
			);
			object.position.set( planetX, 0, planetZ );
			object.castShadow = true;
			object.receiveShadow = true;
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

		// GALAXY ROTATION
		if ( galaxy ) {
			galaxy.rotation.y = ( time / 24 );
		}

		// PLANET ROTATION
		for ( planet = 0; planet < planets.length; planet ++ ) {
			var singlePlanet = planets[planet];

			singlePlanet.rotation.y = ( time / 48 ) * singlePlanet.rotation_period;
		}
		// scene.traverse(function ( object ) {
		// 	console.log( object );
		// });

		// FIND INTERSECTIONS
		if ( planetsLoaded ) {
			raycaster.setFromCamera( mousePos, camera );
			findIntersection();
		}

		// UPDATE CAMERA POSITION FOR GLOW POSITIONING
		if ( outlineMesh ) {
			outlineMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, outlineMesh.position );
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



	// DETERMINE INTERSECTIONS
	function findIntersection() {
		if ( intersections ) {
			// FIND PLANETS INTERSECTED
			var intersects = raycaster.intersectObjects( planets );

			// OUTLINE MATERIAL
			outlineMaterial = new THREE.ShaderMaterial({
				uniforms: {
					c:   		{ type: 'f', value: 0.5 },
					p:   		{ type: 'f', value: 7.5 },
					glowColor: 	{ type: 'c', value: new THREE.Color(0x775c09) },
					viewVector: { type: 'v3', value: camera.position }
				},
				vertexShader:   document.getElementById( 'outlinevertex' ).textContent,
				fragmentShader: document.getElementById( 'outlinefragment' ).textContent,
				side: 			THREE.BackSide,
				blending: 		THREE.AdditiveBlending,
				transparent: 	true,
				depthTest: 		true,
				depthWrite: 	false
			});


			// ACTIONS ON INTERSECT
			if ( intersects.length > 0 ) {
				objectHover = true;

				if ( INTERSECTED != intersects[ 0 ].object ) {
					INTERSECTED = intersects[ 0 ].object;

					document.body.style.cursor = 'pointer';

					// console.log(INTERSECTED.position);

					// ADD OUTLINE TO PLANETS
					scene.remove( outlineMesh );
					outlineMesh = new THREE.Mesh( INTERSECTED.geometry, outlineMaterial );
					outlineMesh.position.set( INTERSECTED.position.x, INTERSECTED.position.y, INTERSECTED.position.z );
					outlineMesh.scale.multiplyScalar(1.35);
					scene.add( outlineMesh );

					planetText.innerHTML = '';
					planetText.style.display = 'none';
					planetText.innerHTML = INTERSECTED.name;
					planetText.style.display = 'block';
				}
			}
			else {
				objectHover = false;
				INTERSECTED = null;

				document.body.style.cursor = 'auto';

				// REMOVE OUTLINES
				scene.remove( outlineMesh );

				planetText.innerHTML = '';
				planetText.style.display = 'none';
			}
		}
	}



	// HANDLER - RESIZE
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		if ( controls ) {
			controls.handleResize();
		}

		renderer.setSize( window.innerWidth, window.innerHeight );
	}



	// HANDLER - DETERMINE MOUSE POSITION
	function onDocumentMouseMove( event ) {
		mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}



	// HANDLER - MOUSE CLICKS
	function onDocumentClick() {
		if ( INTERSECTED ) {
			hideEverything( INTERSECTED );

			// MOVE CAMERA TO NEW POSITION
			// console.log( camera.position );
			// console.log( cameraLookFocus( camera ) );
			oldCameraPos = camera.position;
			oldCameraFocus = cameraLookFocus( camera );

			newCameraPos = new THREE.Vector3(
	            INTERSECTED.position.x,
	            INTERSECTED.position.y,
	            INTERSECTED.position.z + (3 * gridMultiplier)
			);
			newCameraFocus = new THREE.Vector3(
				INTERSECTED.position.x,
	            INTERSECTED.position.y,
	            INTERSECTED.position.z
			);

			// camera.position.set( initialCameraPos.x, initialCameraPos.y, initialCameraPos.z );
			// camera.lookAt( focalPoint );
		}
	}
	function hideEverything( object ) {
		// TURN OFF CONTROLS & INTERSECTIONS
		intersections = false;
		// controls.enabled = false;

		// CURSOR, GLOW, TEXT
		document.body.style.cursor = 'auto';
		scene.remove( outlineMesh );
		planetText.innerHTML = '';
		planetText.style.display = 'none';

		// HIDE OTHER OBJECTS FROM SCREEN
		galaxy.visible = false;
		for ( planet = 0; planet < planets.length; planet ++ ) {
			if ( planets[planet] !== object ) {
				planets[planet].visible = false;
			}
		}
	}
	function showEverything() {
		intersections = true;

		galaxy.visible = true;
		for ( planet = 0; planet < planets.length; planet ++ ) {
			planets[planet].visible = true;
		}
	}



	// GENERAL FUNCTION TO GET CAMERA LOOK DIRECTION
	function cameraLookFocus( camera ) {
        var vector = new THREE.Vector3(0, 0, -1);
        vector.applyEuler( camera.rotation, camera.rotation.order );
        return vector;
    }
	


	// GENERAL FUNCTION TO GENERATE RANDOM NUMBER
	function randomRange( min, max ) {
		return Math.random() * (max - min) + min;
	}

});