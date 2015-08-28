// STATS
// var stats;


// WINDOW VARIABLES
var windowWidth = $(window).width(),
	windowHeight = $(window).height();

// DETERMINE IF MOBILE
var isMobile = navigator.userAgent.match(/mobile/i);

// GENERAL VARIABLES
var container;
var scene,
	renderer;
var postprocessing = {};
var postprocessingFocus = 1.0,
	postprocessingAperture = 0.0035,
	postprocessingBlur = 0.025;

// MAP VARIABLES
var gridMultiplier = 150;

// CAMERA VARIABLES
var camera,
	initialCameraPos,
	focalPointInitial,
	focalPointLoaded;
var oldCameraPos = new THREE.Vector3(),
	oldCameraFocus = new THREE.Vector3();
var currentCameraPos,
	currentCameraFocus;
var newCameraPos,
	newCameraFocus;
var zoomedIn = false;

// PANNING VARIABLES
var currentPlanetIndex,
	prevPlanetIndex,
	nextPlanetIndex;

// CONTROLS VARIABLES
var controls;
var raycaster,
	mousePos = new THREE.Vector2( -1000, 1000 ),
	INTERSECTED;
var objectHover = false;
var intersections = false;

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



$(document).ready(function() {
	// FASTCLICK
	FastClick.attach(document.body);

	// FEATURES DESKTOP/MOBILE
	if (isMobile) {
		$('body').addClass('mobile');
	} else {
		$('body').addClass('desktop');
	}

	// DETECT WEBGL
	if ( !Detector.webgl ) {
		// NO TO WEBGL - NEED TO PASS MESSAGE ON INTRO SAYING NOT SUPPORTED
		$('#error-update, #error-overlay').css('display', 'block');
		$('#load-button').addClass('error');
	} else {
		// YES TO WEBGL - INITIATE OVERALL THREE.JS SCENE
		$('#error-update, #error-overlay').remove;

		init();
		animate();
	}

	// BEGIN TRACE ANIMATION
	setTimeout(function(){
		$('#load-overlay').addClass('begin-animation');
	}, 1250);


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
		focalPointInitial = new THREE.Vector3(
			0.65 * gridMultiplier,
			(0 * gridMultiplier) + 1250,
			-1.5 * gridMultiplier
		);
		focalPointLoaded = new THREE.Vector3(
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
		camera.lookAt( focalPointInitial );


		// ADDING LIGHTS
		scene.add( new THREE.AmbientLight( 0x2f2f2f ) );

		globalLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 0.85 );
		scene.add( globalLight );


		// ADDING CONTROLS & LIMITS
		controls = new THREE.OrbitControls( camera );
		controls.target = focalPointInitial;
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
		controls.enabled = false;


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
		// stats = new Stats();
		// stats.domElement.style.position = 'absolute';
		// stats.domElement.style.bottom = '0px';
		// stats.domElement.style.right = '0px';
		// container.appendChild( stats.domElement );


		// RENDERING SETUP
		renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setClearColor( 0x000000 );
		renderer.shadowMapEnabled = true;
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.domElement.id = 'star-canvas';


		// CONTAINER BUILD
		container.appendChild( renderer.domElement );


		// POSTPROCESSING - DEPTH OF FIELD
		if ( !isMobile ) {
			initPostprocessing();
			var effectController  = {
				focus: 		postprocessingFocus,
				aperture:	postprocessingAperture,
				maxblur:	postprocessingBlur
			};
			var matChanger = function( ) {
				postprocessing.bokeh.uniforms[ 'focus' ].value = effectController.focus;
				postprocessing.bokeh.uniforms[ 'aperture' ].value = effectController.aperture;
				postprocessing.bokeh.uniforms[ 'maxblur' ].value = effectController.maxblur;
			};
		}
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
					// size: ((outer * 6) + 12),
					// opacity: ((outer + 1) / 3) - 0.1,
					size: (outer * 8),
					opacity: 1.75,
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
			'pages': 7,
			'protocol': window.location.protocol
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

			// if ( !planetData[i].xpos && !planetData[i].zpos ) {
			// 	console.log( planetData[i].name );
			// }
			if ( planetData[i].xpos && planetData[i].zpos ) {
				if ( !isMobile ) {
					object = new THREE.Mesh(
						new THREE.SphereGeometry( planetSize, 22, 22 ),
						new THREE.MeshPhongMaterial({
							map: 		THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '.jpg' ),
							bumpMap: 	THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '-bumpmap.jpg' ),
							bumpScale: 	3,
							metal: 		false,
							// shininess: 	20,
							depthTest: 	true
						})
					);
				} else {
					object = new THREE.Mesh(
						new THREE.SphereGeometry( planetSize, 20, 20 ),
						new THREE.MeshLambertMaterial({
							map: 		THREE.ImageUtils.loadTexture( '/img/texture/' + planetTexture + '.jpg' ),
							depthTest: 	true,
							reflectivity: 1,
							shading: THREE.SmoothShading
						})
					);
				}

				object.position.set( planetX, 0, planetZ );
				object.castShadow = true;
				object.receiveShadow = true;

				// ADD DEATH STAR TO ALDERAAN
				if ( planetName == 'Alderaan' ) {
					if (!isMobile) {
						deathstar = new THREE.Mesh(
							new THREE.SphereGeometry( (planetSize / 4.5), 16, 16 ),
							new THREE.MeshPhongMaterial({
								map: 		THREE.ImageUtils.loadTexture( '/img/texture/deathstar.jpg' ),
								bumpMap: 	THREE.ImageUtils.loadTexture( '/img/texture/deathstar-bumpmap.jpg' ),
								bumpScale: 	1.5,
								metal: 		false,
								shininess: 	25,
								depthTest: 	true
							})
						);
					} else {
						deathstar = new THREE.Mesh(
							new THREE.SphereGeometry( (planetSize / 4.5), 12, 12 ),
							new THREE.MeshLambertMaterial({
								map: 		THREE.ImageUtils.loadTexture( '/img/texture/deathstar.jpg' ),
								depthTest: 	true,
								reflectivity: 1,
								shading: THREE.SmoothShading
							})
						);
					}

					deathstar.position.set( planetSize, (planetSize / 2), planetSize );
					deathstar.rotation.y = 9.5;
					deathstar.castShadow = true;
					deathstar.receiveShadow = true;

					object.add( deathstar );
				}

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
			}

			planetsLoaded = true;

			beginLoaded();
		}
	}



	// GET FILM DATA
	function getFilms() {
		workerFilms.postMessage({
			'cmd': 'start',
			'protocol': window.location.protocol
		});

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

		// POST PROCESSING - DEPTH OF FIELD
		if ( !isMobile ) {
			postprocessing.composer.render( 0.1 );
		}

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
			} else if ( isMobile ) {
				findIntersectionTouch();
			}
		}

		// UPDATE CAMERA POSITION FOR GLOW POSITIONING
		if ( outlineMesh ) {
			outlineMaterial.uniforms.viewVector.value = new THREE.Vector3().subVectors( camera.position, outlineMesh.position );
		}

		// CONTROLS UPDATE / PAUSE ON HOVER
		controls.update( clock.getDelta() );

		// STATS
		// stats.update();
	}



	// POST PROCESSING - DEPTH OF FIELD
	function initPostprocessing() {
		var renderPass = new THREE.RenderPass( scene, camera );

		var bokehPass = new THREE.BokehPass( scene, camera, {
			focus: 		postprocessingFocus,
			aperture:	postprocessingAperture,
			maxblur:	postprocessingBlur,

			width: windowWidth,
			height: windowHeight
		} );

		bokehPass.renderToScreen = true;

		var composer = new THREE.EffectComposer( renderer );

		composer.addPass( renderPass );
		composer.addPass( bokehPass );

		postprocessing.composer = composer;
		postprocessing.bokeh = bokehPass;
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

			if ( INTERSECTED != intersects[ 0 ].object && intersects[ 0 ].object.visible ) {
				INTERSECTED = intersects[ 0 ].object;

				document.body.style.cursor = 'pointer';

				// PLAY SOUND
				if ( !sfxMute ) {
					r2hover.play();
				}

				// ADD OUTLINE TO PLANETS
				scene.remove( outlineMesh );

				var outlineShape = new THREE.SphereGeometry( INTERSECTED.geometry.boundingSphere.radius, 30, 30 );
				outlineMesh = new THREE.Mesh( outlineShape, outlineMaterial );

				outlineMesh.position.set( INTERSECTED.position.x, INTERSECTED.position.y, INTERSECTED.position.z );
				outlineMesh.scale.multiplyScalar(1.35);
				scene.add( outlineMesh );

				planetText.innerHTML = '';
				planetText.style.display = 'none';
				planetText.innerHTML = INTERSECTED.name;
				planetText.style.display = 'block';
			}
		} else {
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
			if ( INTERSECTED != intersects[ 0 ].object && intersects[ 0 ].object.visible ) {
				INTERSECTED = intersects[ 0 ].object;

				hideEverything( INTERSECTED );
				zoomIntoPlanet( INTERSECTED, 3.25 );
				showOverlay( INTERSECTED );
			}
		} else {
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
			if ( planets[planet].visible ) {
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
		if ( !sfxMute ) {
			r2zoomin.play();
		}

		planetIndexValues( planet );

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

		var camDistance = (planet.geometry.parameters.radius / 25) * gridMultiplier,
			camOffset = (planet.geometry.parameters.radius / 92) * gridMultiplier;

		newCameraPos = new THREE.Vector3(
            planet.position.x,
            planet.position.y - camOffset,
            planet.position.z + camDistance
		);
		newCameraFocus = new THREE.Vector3(
			planet.position.x,
            planet.position.y - camOffset,
            planet.position.z
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

		// HIDE ARROWS
		var timeoutMath = duration * 1000;
		setTimeout(function(){
			$('.planet-nav-arrow').addClass('zoomed');
		}, (timeoutMath - 1000) );
	}
	function zoomOutPlanet( duration ) {
		// PLAY AUDIO
		if ( !sfxMute ) {
			r2zoomout.play();
		}

		$('.planet-nav-arrow').removeClass('zoomed');

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

				prevPlanetIndex = currentPlanetIndex = nextPlanetIndex = null;
			}
		});

		setTimeout(function(){
			galaxy.visible = true;
		}, 1650 );
	}
	function panToPlanet( oldplanet, newplanet, duration ) {
		hideOverlay();
		showOverlay( newplanet );

		controls.enabled = false;
		intersections = false;

		planetIndexValues( newplanet );

		currentCameraPos = camera.position;
		currentCameraFocus = controls.target;
		var camDistance = (newplanet.geometry.parameters.radius / 25) * gridMultiplier,
			camOffset = (newplanet.geometry.parameters.radius / 92) * gridMultiplier;

		newCameraPos = new THREE.Vector3(
            newplanet.position.x,
            newplanet.position.y - camOffset,
            newplanet.position.z + camDistance
		);
		newCameraFocus = new THREE.Vector3(
			newplanet.position.x,
            newplanet.position.y - camOffset,
            newplanet.position.z
		);

		TweenMax.to( currentCameraFocus, duration, {
			x: newCameraFocus.x,
			y: newCameraFocus.y,
			z: newCameraFocus.z,
			ease: Strong.easeInOut
		});
		TweenMax.to( currentCameraPos, duration, {
			x: newCameraPos.x,
			y: newCameraPos.y,
			z: newCameraPos.z,
			ease: Strong.easeInOut,
			onUpdate: function() {
				camera.updateProjectionMatrix();
			},
			onComplete: function() {
				camera.updateProjectionMatrix();

				oldplanet.visible = false;

				zoomedIn = true;
			}
		});

		setTimeout(function(){
			newplanet.visible = true;
		}, (duration / 2) );
	}

	function planetIndexValues( planet ) {
		currentPlanetIndex = findPlanetIndex( planets, 'name', planet.name );

		if ( currentPlanetIndex === 0 ) {
			prevPlanetIndex = planets.length;
		} else {
			prevPlanetIndex = currentPlanetIndex - 1;
		}
		if ( currentPlanetIndex === planets.length ) {
			nextPlanetIndex = 0;
		} else {
			nextPlanetIndex = currentPlanetIndex + 1;
		}
	}
	function findPlanetIndex( array, key, value ) {
		for ( var i = 0; i < array.length; i++ ) {
			if (array[i][key] == value) {
				return i;
			}
		}

		return null;
	}



	// ARROW FUNCTIONS
	$('.planet-nav-arrow').on('click', function(){
		if ( !sfxMute ) {
			r2zoomin.play();
		}

		if ( $(this).is('#planet-left') ) {
			panToPlanet( planets[currentPlanetIndex], planets[prevPlanetIndex], 4 );
		}
		if ( $(this).is('#planet-right') ) {
			panToPlanet( planets[currentPlanetIndex], planets[nextPlanetIndex], 4 );
		}

		return false;
	});
	


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
		    	} else {
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
		var xDistance = $('nav').width();

		if ( $('body').hasClass('nav-open') ) {
			// NAV CLOSING
			$('body').removeClass('nav-open');

			if ( !sfxMute ) {
				r2navclose.play();
			}
			if ( !musicMute ) {
				musicintro.volume(1);
				musicloop1.volume(musicVolume);
				musicloop2.volume(musicVolume);
			}

			intersections = true;
			controls.enabled = true;

			$('#star-map').velocity({
			    translateZ: 0,
			    translateX: 0
			}, {
			    duration: 250,
			    easing: 'easeInSine'
			});

			if ( windowWidth < 641 ) {
				$('#button-sounds').velocity({
				    translateZ: 0,
				    opacity: 1
				}, {
				    duration: 300,
				    easing: 'easeInSine',
				    display: 'block'
				});
			}
		} else {
			// NAV OPENING
			$('body').addClass('nav-open');

			if ( !sfxMute ) {
				r2navopen.play();
			}
			if ( !musicMute ) {
				musicintro.volume(0.5);
				musicloop1.volume(0.5);
				musicloop2.volume(0.5);
			}

			intersections = false;
			controls.enabled = false;

			$('#star-map').velocity({
			    translateZ: 0,
			    translateX: xDistance
			}, {
			    duration: 250,
			    easing: 'easeInSine'
			});

			if ( windowWidth < 641 ) {
				$('#button-sounds').velocity({
				    translateZ: 0,
				    opacity: 0
				}, {
				    duration: 150,
				    easing: 'easeInSine',
				    display: 'none'
				});
			}
		}

		return false;
	});



	// FILTER FUNCTIONALITY
	$('input').on('click', function(){
		var filterEpisode = $(this).attr('value'),
			filterURL;

		if ( filterEpisode == 0 ) {
			if ( $(this).is(':checked') ) {
				// TURNING CHECK ON
				for ( planet = 0; planet < planets.length; planet ++ ) {
					if ( planets[planet].films.length == 0 ) {
						planets[planet].visible = true;
					}
				}
			} else {
				// TURNING CHECK OFF
				for ( planet = 0; planet < planets.length; planet ++ ) {
					if ( planets[planet].films.length == 0 ) {
						planets[planet].visible = false;
					}
				}
			}
		} else {
			for ( i = 0; i < filmData.length; i ++ ) {
				if ( filterEpisode == filmData[i].episode_id ) {
					filterURL = filmData[i].url;
				}
			}

			if ( $(this).is(':checked') ) {
				// TURNING CHECK ON
				for ( planet = 0; planet < planets.length; planet ++ ) {
					for ( film = 0; film < planets[planet].films.length; film ++ ) {
						if ( filterURL == planets[planet].films[film] ) {
							planets[planet].visible = true;
						}
					}
				}
			} else {
				// TURNING CHECK OFF
				for ( planet = 0; planet < planets.length; planet ++ ) {
					for ( film = 0; film < planets[planet].films.length; film ++ ) {
						if ( filterURL == planets[planet].films[film] ) {
							planets[planet].visible = false;
						}
					}
				}
			}
		}
	});


	
	// AUDIO
	var sfxMute = false;
	var r2hover = new Howl({ src: ['/audio/r2-hover.mp3'] }),
		r2navclose = new Howl({ src: ['/audio/r2-navclose.mp3'] }),
		r2navopen = new Howl({ src: ['/audio/r2-navopen.mp3'] }),
		r2zoomin = new Howl({ src: ['/audio/r2-zoomin.mp3'] }),
		r2zoomout = new Howl({ src: ['/audio/r2-zoomout.mp3'] });
	var sfxArray = [r2hover, r2navclose, r2navopen, r2zoomin, r2zoomout];

	var musicMute = false,
		crossfade = 5750,
		musicVolume = 0.85,
		loopDuration;
	var musicintro = new Howl({
			src: ['/audio/music-intro.mp3'],
			onplay: function() {
				var introDuration = Math.floor( musicintro._duration * 1000 ),
					introCrossfade = 6500;

				setTimeout(function() {
					if ( !musicMute ) {
						musicintro.fade(musicVolume, 0, introCrossfade);

						musicloop1.volume(0);
						musicloop1.play();
						musicloop1.fade(0, musicVolume, introCrossfade);
					}
					else {
						musicloop1.play();
					}
				}, (introDuration - introCrossfade));
			}
		});
	var musicloop1 = new Howl({
			src: ['/audio/music-loop.mp3'],
			volume: musicVolume,
			onplay: function() {
				if ( !loopDuration ) {
					loopDuration = Math.floor( musicloop1._duration * 1000 );
				}
				
				setTimeout(function() {
					loopMusic( musicloop1, musicloop2 );
				}, (loopDuration - crossfade));
			}
		}),
		musicloop2 = new Howl({
			src: ['/audio/music-loop.mp3'],
			volume: musicVolume,
			onplay: function() {
				if ( !loopDuration ) {
					loopDuration = Math.floor( musicloop2._duration * 1000 );
				}

				setTimeout(function() {
					loopMusic( musicloop2, musicloop1 );
				}, (loopDuration - crossfade));
			}
		});


	// MUSIC LOOPING
	function loopMusic( first, last ) {
		first.fade(musicVolume, 0, crossfade);

		last.volume(0);
		last.play();
		last.fade(0, musicVolume, crossfade);
	}


	// AUDIO MUTING
	$('#button-sfx').on('click', function(){
		if ( $(this).hasClass('off') ) {
			$(this).removeClass('off');

			sfxMute = false;
		} else {
			$(this).addClass('off');

			sfxMute = true;

			$.each( sfxArray, function( i, audio ) {
				audio.stop();
			});
		}

		return false;
	});
	$('#button-music').on('click', function(){
		if ( $(this).hasClass('off') ) {
			$(this).removeClass('off');

			musicMute = false;

			musicintro.mute(false);
			musicloop1.mute(false);
			musicloop2.mute(false);
		} else {
			$(this).addClass('off');

			musicMute = true;

			musicintro.mute(true);
			musicloop1.mute(true);
			musicloop2.mute(true);
		}

		return false;
	});



	// INTRO ANIMATIONS
	$('#load-button').on('click', function(){
		if ( $(this).hasClass('loaded') ) {
			logozoom();

			musicintro.play();
		}

		return false;
	});

	function beginLoaded() {
		$('#load-button').addClass('loaded');
	}
	function logozoom() {
		$('#load-button').addClass('launching');

		$('#logo-fill').velocity({
			translateZ: 0,
			scale: '0.2',
			opacity: 1
		}, {
			duration: 3000,
			complete: function() {
				classicwipe();
			}
		});
	}
	function classicwipe() {
		$('#classic-wipe').velocity({
			translateZ: 0,
			translateX: '-125%'
		}, {
			delay: 3000,
			duration: 1000,
			complete: function() {
				$('#load-overlay').remove();

				classicwipeFade();
			}
		});
	}
	function classicwipeFade() {
		$('#classic-wipe').velocity({
			translateZ: 0,
			opacity: 0
		}, {
			duration: 1250,
			display: 'none',
			complete: function() {
				$('#classic-wipe').remove();

				longago();
			}
		});
	}
	function longago() {
		$('#long-ago').velocity({
		    translateZ: 0,
		    opacity: 0
		}, {
			delay: 2000,
		    duration: 4000,
		    display: 'none',
		    begin: function() {
				longagoPan( 5 );
		    },
		    complete: function() {
				$('#long-ago').remove();
		    }
		});
	}
	function longagoPan( duration ) {
		currentCameraPos = camera.position;
		currentCameraFocus = controls.target;

		TweenMax.to( currentCameraPos, duration, {
			x: initialCameraPos.x,
			y: initialCameraPos.y,
			z: initialCameraPos.z,
			ease: Power0.easeNone
		});
		TweenMax.to( currentCameraFocus, duration, {
			x: focalPointLoaded.x,
			y: focalPointLoaded.y,
			z: focalPointLoaded.z,
			ease: Power0.easeNone,
			onUpdate: function() {
				camera.updateProjectionMatrix();
			},
			onComplete: function() {
				camera.updateProjectionMatrix();

				intersections = true;
				controls.enabled = true;

				$('#star-map').addClass('loaded');

				$('#long-ago').remove();
			}
		});
	}
});