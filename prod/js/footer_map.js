$(document).ready(function() {

	// MAP GLOBAL VARIABLES
	var container;

	var camera,
		scene,
		renderer;
	var starfield = [];
	// 	starParticleSystem;



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
		// camera.position.y = 2000;
		// camera.position.z = 2000;
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
					opacity: ((outer + 1) / 3),
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

			starfield[fields].rotation.x = time * (0.025 / divisor);
			starfield[fields].rotation.y = time * (0.1 / divisor);
		}

		camera.lookAt( scene.position );
		renderer.render( scene, camera );
	}

});