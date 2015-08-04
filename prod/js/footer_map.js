// STATS
var stats;


// WINDOW VARIABLES
var windowWidth = $(window).width(),
	windowHeight = $(window).height();

// DETERMINE IF MOBILE
var isMobile = navigator.userAgent.match(/mobile/i);

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
var oldCameraPos = new THREE.Vector3(),
	oldCameraFocus = new THREE.Vector3();
var currentCameraPos,
	currentCameraFocus;
var newCameraPos,
	newCameraFocus;
var zoomedIn = false;

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
var planetData = [],
	filmData = [];
var starfield = [],
	planets = [];
var galaxy;
var planetsLoaded = false;
var planetText,
	planetOverlay;
var outlineMaterial,
	outlineMesh;
var visiblePlanets = [];

// MOTION VARIABLES
var clock = new THREE.Clock();
var time,
	clockDelta;

// WORKERS
var workerGalaxy = new Worker('/js/workers/worker_galaxy.js'),
	workerPlanets = new Worker('/js/workers/worker_planets.js'),
	workerFilms = new Worker('/js/workers/worker_films.js');

// AUDIO
var r2hover = new Audio('/audio/r2-hover.mp3'),
	r2navclose = new Audio('/audio/r2-navclose.mp3'),
	r2navopen = new Audio('/audio/r2-navopen.mp3'),
	r2zoomin = new Audio('/audio/r2-zoomin.mp3'),
	r2zoomout = new Audio('/audio/r2-zoomout.mp3');
var soundsArray = [r2hover, r2navclose, r2navopen, r2zoomin, r2zoomout];



$(document).ready(function() {

	// INITIATE OVERALL THREE.JS SCENE
	init();
	animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');
		planetText = document.getElementById('planet-title');
		planetOverlay = document.getElementById('planet-data-overlay');


		// HIDE OVERLAY
		hideOverlay();


		// SCENE SETUP, AUDIO AND VARIABLES
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
		window.addEventListener( 'touchend', onTouchEnd, false );


		// CREATE STARFIELD
		makeStars( 12, 450, 3 );


		// CREATE GALAXY
		getGalaxy( 15000 );


		// GET & MAKE PLANETS
		getPlanets();


		// GET FILM DATA
		getFilms();


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
		renderer.domElement.id = 'star-canvas';


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
		workerPlanets.postMessage({
			'cmd': 'start',
			'pages': 7
		});
		workerPlanets.addEventListener( 'message', function(e) {
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
					map: 		THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '.jpg' ),
					bumpMap: 	THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '-bumpmap.jpg' ),
					bumpScale: 	3,
					metal: 		false,
					shininess: 	20,
					depthTest: 	true
				})
			);
			object.position.set( planetX, 0, planetZ );
			object.castShadow = true;
			object.receiveShadow = true;

			// STORE PLANET DATA
			object.name = planetName;
			object.rotation_period = planetRotation;
			object.diameter = planetData[i].diameter;
			object.population = planetData[i].population;
			object.climate = planetData[i].climate;
			object.orbital_period = planetData[i].orbital_period;
			object.terrain = planetData[i].terrain;
			object.films = planetData[i].films;

			scene.add( object );
			planets.push( object );

			planetsLoaded = true;
		}
	}



	// GET FILM DATA
	function getFilms() {
		workerFilms.postMessage({	'cmd': 'start' });

		workerFilms.addEventListener( 'message', function(e) {
			filmData = e.data;
		}, false);
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

		// FIND INTERSECTIONS
		if ( planetsLoaded && intersections ) {
			raycaster.setFromCamera( mousePos, camera );

			if ( !isMobile ) {
				findIntersection();
			}
			else if ( isMobile ) {
				findIntersectionTouch();
			}
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

				// PLAY SOUND
				r2hover.play();

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
	function findIntersectionTouch() {
		var intersects = raycaster.intersectObjects( planets );

		if ( intersects.length > 0 ) {
			if ( INTERSECTED != intersects[ 0 ].object ) {
				INTERSECTED = intersects[ 0 ].object;

				hideEverything( INTERSECTED );
				zoomIntoPlanet( INTERSECTED, 3.25 );
				showOverlay( INTERSECTED );
			}
		}
		else {
			INTERSECTED = null;
		}
	}



	// HANDLER - RESIZE
	function onWindowResize() {
		windowWidth = $(window).width(),
		windowHeight = $(window).height();

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

		render();
	}



	// HANDLER - DETERMINE MOUSE POSITION
	function onDocumentMouseMove( event ) {
		mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}
	function onTouchEnd( event ) {
		mousePos.x = + ( event.changedTouches[0].pageX / window.innerWidth ) * 2 +-1;
		mousePos.y = - ( event.changedTouches[0].pageY / window.innerHeight ) * 2 + 1;
	}



	// HANDLER - MOUSE CLICKS
	function onDocumentClick() {
		if ( INTERSECTED ) {
			hideEverything( INTERSECTED );

			zoomIntoPlanet( INTERSECTED, 3.25 );

			showOverlay( INTERSECTED );
		}
	}
	$('#button-close').on('click', function(){
		zoomOutPlanet( 3.25 );

		hideOverlay();

		return false;
	});

	function hideEverything( object ) {
		// REMOVE EVENT LISTENER
		window.removeEventListener( 'click', onDocumentClick, false );

		// TURN OFF CONTROLS & INTERSECTIONS
		intersections = false;
		controls.enabled = false;

		// CURSOR, GLOW, TEXT
		document.body.style.cursor = 'auto';
		scene.remove( outlineMesh );
		planetText.innerHTML = '';
		planetText.style.display = 'none';

		// HIDE OTHER OBJECTS FROM SCREEN
		for ( planet = 0; planet < planets.length; planet ++ ) {
			if ( planets[planet].visible = true ) {
				visiblePlanets.push( planets[planet] );
			}
			if ( planets[planet] !== object ) {
				planets[planet].visible = false;
			}
		}

		// HIDE GALAXY HALFWAY IN
		setTimeout(function(){
			galaxy.visible = false;
		}, 1000 );
	}
	function showEverything() {
		window.addEventListener( 'click', onDocumentClick, false );
		intersections = true;
		controls.enabled = true;

		for ( planet = 0; planet < visiblePlanets.length; planet ++ ) {
			visiblePlanets[planet].visible = true;
		}
		visiblePlanets = [];
	}

	function zoomIntoPlanet( planet, duration ) {
		// PLAY AUDIO
		r2zoomin.play();

		// CAPTURE ORIGINAL VALUES
		oldCameraPos.x = camera.position.x;
		oldCameraPos.y = camera.position.y;
		oldCameraPos.z = camera.position.z;
		oldCameraFocus.x = controls.target.x;
		oldCameraFocus.y = controls.target.y;
		oldCameraFocus.z = controls.target.z;

		// MOVE CAMERA TO NEW POSITION
		currentCameraPos = camera.position;
		currentCameraFocus = controls.target;

		var camDistance = (INTERSECTED.geometry.parameters.radius / 25) * gridMultiplier,
			camOffset = (INTERSECTED.geometry.parameters.radius / 92) * gridMultiplier;

		newCameraPos = new THREE.Vector3(
            INTERSECTED.position.x,
            INTERSECTED.position.y - camOffset,
            INTERSECTED.position.z + camDistance
		);
		newCameraFocus = new THREE.Vector3(
			INTERSECTED.position.x,
            INTERSECTED.position.y - camOffset,
            INTERSECTED.position.z
		);

		TweenMax.to( currentCameraFocus, duration, {
			x: newCameraFocus.x,
			y: newCameraFocus.y,
			z: newCameraFocus.z,
			ease: Strong.easeOut
		});
		TweenMax.to( currentCameraPos, duration, {
			x: newCameraPos.x,
			y: newCameraPos.y,
			z: newCameraPos.z,
			ease: Strong.easeOut,
			onUpdate: function() {
				camera.updateProjectionMatrix();
			},
			onComplete: function() {
				camera.updateProjectionMatrix();

				zoomedIn = true;
			}
		});
	}
	function zoomOutPlanet( duration ) {
		// PLAY AUDIO
		r2zoomout.play();

		currentCameraPos = camera.position;
		currentCameraFocus = controls.target;

		TweenMax.to( currentCameraFocus, duration, {
			x: oldCameraFocus.x,
			y: oldCameraFocus.y,
			z: oldCameraFocus.z,
			ease: Strong.easeIn
		});
		TweenMax.to( currentCameraPos, duration, {
			x: oldCameraPos.x,
			y: oldCameraPos.y,
			z: oldCameraPos.z,
			ease: Strong.easeIn,
			onUpdate: function() {
				camera.updateProjectionMatrix();
			},
			onComplete: function() {
				camera.updateProjectionMatrix();

				zoomedIn = false;

				setTimeout(function(){
					showEverything();
				}, 50);
			}
		});

		setTimeout(function(){
			galaxy.visible = true;
		}, 1650 );
	}
	


	// HIDE OVERLAY
	function hideOverlay() {
		var yDistance = '165%';
		if ( windowHeight > 900 ) {
			yDistance = '190%';
		}

		$('#planet-data-overlay').velocity({
		    translateZ: 0,
		    translateX: '-50%',
		    translateY: yDistance
		}, {
			delay: 350,
		    duration: 750,
		    easing: 'easeInQuart',
		    complete: function() {
		    	$('#planet-data-name, #planet-data-size, #planet-data-pop, #planet-data-orbit, #planet-data-rotation, #planet-data-climate, #planet-data-terrain').empty();
		    	$('.planet-film').addClass('disabled');
		    }
		});
	}



	// SHOW OVERLAY
	function showOverlay( planet ) {
		$('#planet-data-overlay').velocity({
		    translateZ: 0,
		    translateX: '-50%',
		    translateY: 0
		}, {
			delay: 1300,
		    duration: 1350,
		    easing: 'easeOutQuart',
		    begin: function() {
		    	var populationNumber;

		    	if ( planet.population === 'unknown' ) {
		    		populationNumber = planet.population;
		    	}
		    	else {
		    		populationNumber = parseInt(planet.population).toLocaleString();
		    	}

				$('#planet-data-name').text( planet.name );
				$('#planet-data-size').text( planet.diameter.toLocaleString() );
				$('#planet-data-pop').text( populationNumber );
				$('#planet-data-orbit').text( planet.orbital_period );
				$('#planet-data-rotation').text( planet.rotation_period );
				$('#planet-data-climate').text( planet.climate );
				$('#planet-data-terrain').text( planet.terrain );


				for ( i = 0; i < planet.films.length; i ++ ) {
					for ( x = 0; x < filmData.length; x ++ ) {
						if ( planet.films[i] == filmData[x].url ) {
							$('.planet-film').each(function(){
								var episode = $(this).data( 'episode' );

								if ( filmData[x].episode_id === episode ) {
									$(this).removeClass('disabled');
								}
							});
						}
					}
				}
		    }
		});
	}



	// GENERAL FUNCTION TO GENERATE RANDOM NUMBER
	function randomRange( min, max ) {
		return Math.random() * (max - min) + min;
	}



	// NAV FUNCTIONALITY
	$('#button-nav').on('click', function(){
		var xDistance = '23rem';
		if ( windowWidth <= 640 ) {
			xDistance = '81%';
		}

		if ( $('main').hasClass('nav-open') ) {
			// nav open
			$('body, main').removeClass('nav-open');

			r2navclose.play();

			intersections = true;
			controls.enabled = true;

			$('#star-map').velocity({
			    translateZ: 0,
			    translateX: 0
			}, {
			    duration: 250,
			    easing: 'easeInSine'
			});
		}
		else {
			// nav closed
			$('body, main').addClass('nav-open');

			r2navopen.play();

			intersections = false;
			controls.enabled = false;

			$('#star-map').velocity({
			    translateZ: 0,
			    translateX: xDistance
			}, {
			    duration: 250,
			    easing: 'easeInSine'
			});
		}

		return false;
	});



	// FILTER FUNCTIONALITY
	$('input').on('click', function(){
		var filterEpisode = $(this).attr('value'),
			filterURL;

		console.log( filterEpisode );


	});
});