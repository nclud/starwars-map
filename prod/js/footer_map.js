$(document).ready(function() {

	// MAP GLOBAL VARIABLES
	var container;

	var camera,
		scene,
		renderer;
	var starfield;



	// INITIATE OVERALL SCENE
	init();
	animate();

	function init() {
		// CONTAINER SETUP
		container = document.getElementById('star-map');


		// SCENE SETUP AND VARIABLES
		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2( 0x000000, 0.0001 );


		// INITIAL CAMERA POSITIONING
		camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 3000 );
		camera.position.x = 0;
		camera.position.y = 600;
		camera.position.z = 600;


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
		makeStars(1000);
	}
	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
	}



	// STARFIELD PARTICLE FUNCTION
	function makeStars(starDistance) {
		starfield = new THREE.Object3D( 0, 0, 0 );

		var starMaterial = new THREE.ParticleBasicMaterial({
			map: THREE.ImageUtils.loadTexture( '/img/sprite-star.png' ),
			color: 0xffffff,
			size: 14,
			opacity: 1,
			blending: THREE.AdditiveBlending,
			alphaTest: 0.5,
			transparent: true
        });
        var starParticles = new THREE.Geometry();


        // CREATE SPHERE OF PARTICLES
        for ( i = 0; i < 1000; i ++ ) {
			var x = -1 + Math.random() * 2,
            	y = -1 + Math.random() * 2,
            	z = -1 + Math.random() * 2;
            var d = 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

            x *= d;
            y *= d;
            z *= d;

			var starParticle = new THREE.Vector3(
               x * starDistance,
               y * starDistance,
               z * starDistance
            );

            starParticles.vertices.push(starParticle);
        }

        var starParticleSystem = new THREE.ParticleSystem( starParticles, starMaterial );
        starParticleSystem.sortParticles = true;

        starfield.add( starParticleSystem );
        scene.add( starfield );

		// var starGeometry,
		// 	// starParticles,
		// 	material,
		// 	size;

		// starGeometry = new THREE.Geometry();

		// for ( i = 0; i < 10000; i ++ ) {
		// 	var vertex = new THREE.Vector3();

		// 	vertex.x = Math.random() * 8000 - 4000;
		// 	vertex.y = Math.random() * 8000 - 4000;
		// 	vertex.z = Math.random() * -1500;

		// 	starGeometry.vertices.push( vertex );
		// }

		// material = new THREE.PointCloudMaterial({
		// 	// map: THREE.ImageUtils.loadTexture( '/img/particle.png' ),
		// 	color: 0xffffff,
		// 	size: randomRange(4, 8),
		// 	opacity: randomRange(0.4, 1),
		// 	blending: THREE.AdditiveBlending,
		// 	// alphaTest: 0.5,
		// 	transparent: true
		// });

		// starParticles = new THREE.PointCloud( starGeometry, material );
		// starParticles.sortParticles = true;

		// starParticles.rotation.x = -0.65;
		// // starParticles.rotation.y = ;
		// // starParticles.rotation.z = Math.random() * 6;

		// scene.add( starParticles );
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

		// starParticles.rotation.z = time * 0.05;

		camera.lookAt( scene.position );
		renderer.render( scene, camera );
	}












	// INITIATE MAP
	// initMap();
	// animateMap();

	// function initMap() {
	// 	container = document.getElementById('star-map');


	// 	// INITIAL CAMERA POSITIONING
	// 	camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 1, 3000 );
	// 	camera.position.x = 0;
	// 	camera.position.y = 400;
	// 	camera.position.z = 900;


	// 	// SCENE SETUP AND VARIABLES
	// 	scene = new THREE.Scene();

	// 	var light,
	// 		object;


	// 	// LIGHTING
	// 	scene.add( new THREE.AmbientLight( 0x404040 ) );

	// 	light = new THREE.DirectionalLight( 0xffffff );
	// 	light.position.set( 0, -0.25, 2 );
	// 	scene.add( light );


	// 	// TEXTURES
	// 	var map = THREE.ImageUtils.loadTexture( '/img/test.jpg' );
	// 	map.wrapS = map.wrapT = THREE.RepeatWrapping;
	// 	map.repeat.set(2, 2);
	// 	map.anisotropy = 16;

	// 	var material = new THREE.MeshLambertMaterial({
	// 		map: map,
	// 		side: THREE.DoubleSide
	// 	});


	// 	// CREATION OF STARFIELD
	// 	spaceObject = new THREE.Mesh( new THREE.SphereGeometry( 1000, 36, 36 ), material );
	// 	spaceObject.position.set( 0, 0, 0 );
	// 	scene.add( spaceObject );


	// 	// RENDERING
	// 	renderer = new THREE.WebGLRenderer({
	// 		antialias: true
	// 	});
	// 	renderer.setPixelRatio( window.devicePixelRatio );
	// 	renderer.setSize( window.innerWidth, window.innerHeight );

	// 	container.appendChild( renderer.domElement );


	// 	// RESIZING WINDOW
	// 	window.addEventListener( 'resize', onWindowResize, false );

	// }
	// function onWindowResize() {
	// 	camera.aspect = window.innerWidth / window.innerHeight;
	// 	camera.updateProjectionMatrix();

	// 	renderer.setSize( window.innerWidth, window.innerHeight );
	// }


	// function animateMap() {
	// 	requestAnimationFrame( animateMap );

	// 	renderMap();
	// }

	// function renderMap() {
	// 	var timer = Date.now() * 0.0001;
	// 	spaceObject.rotation.y = timer * 0.035;
	// 	spaceObject.rotation.z = timer * 0.015;

	// 	camera.lookAt( scene.position );

	// 	renderer.render( scene, camera );
	// }
});