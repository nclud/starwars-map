var gulp = require('gulp'),

	// Server and sync
	php  = require('gulp-connect-php'),
	browserSync = require('browser-sync'),

	// Other plugins
	rimraf = require('rimraf'),
	es = require('event-stream'),
	sass = require('gulp-sass'),
	sourcemaps = require('gulp-sourcemaps'),
	minify = require('gulp-minify-css'),
	usemin = require('gulp-usemin'),
	inject = require('gulp-inject'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	stripDebug = require('gulp-strip-debug'),
	imagemin = require('gulp-imagemin'),
	gzip = require('gulp-gzip'),
	gutil = require('gulp-util'),
	rsync = require('rsyncwrapper').rsync;

// Pull in outside tasks - for deployment
var requireDir = require('require-dir');
requireDir('./gulp_tasks');


// Server initiation and livereload, opens server in browser
gulp.task('php', function() {
    php.server({
    	base: 'prod',
    	port: 8010,
    	keepalive: true
    });
});
gulp.task('serve', ['php'], function() {
    browserSync({
        proxy: '127.0.0.1:8010',
        port: 3000,
        open: true,
        notify: false
    });
});


// SASS compiling & reloading
gulp.task('sass', function() {
    gulp.src('./prod/sass/*.scss')
	    .pipe(sourcemaps.init())
        .pipe(sass({
        	errLogToConsole: true
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./prod/css'))
        .pipe(browserSync.reload({
        	stream: true
        }));
});


// Clear 'dist' directory, then minifying, copying, processing, uglifying, etc for build
gulp.task('remove', function (cb) {
    rimraf('./dist', cb);
});

gulp.task('minify', ['sass'], function() {
	return gulp.src('./prod/css/*.css')
		.pipe(minify({
			keepSpecialComments: 0
		}))
		.pipe(gulp.dest('./dist/css'));
});

gulp.task('scripts', function() {
	return es.merge(
		gulp.src('./prod/js/lib/*.js')
			.pipe(concat('lib.js'))
			// .pipe(stripDebug())
			.pipe(uglify({
	      		mangle: false
	      	}))
			.pipe(gulp.dest('./dist/js')),
		gulp.src('./prod/js/shaders/*.js')
			.pipe(concat('shaders.js'))
			// .pipe(stripDebug())
			.pipe(uglify({
	      		mangle: false
	      	}))
			.pipe(gulp.dest('./dist/js')),
		gulp.src('./prod/js/*.js')
			// .pipe(stripDebug())
	      	.pipe(uglify({
	      		mangle: false
	      	}))
	      	.pipe(gulp.dest('./dist/js')),
		gulp.src('./prod/js/workers/*.js')
			// .pipe(stripDebug())
	      	.pipe(uglify({
	      		mangle: false
	      	}))
	      	.pipe(gulp.dest('./dist/js/workers'))
	);
});

gulp.task('gzip', ['scripts'], function() {
	return gulp.src(['./dist/js/lib.js', './dist/js/shaders.js'])
		.pipe(gzip())
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('html', ['scripts'], function() {
	return es.merge(
		gulp.src("./prod/**/*.html")
			.pipe(usemin())
			.pipe(inject(gulp.src('./dist/js/lib.js', {
				read: false
			}), {
				ignorePath: 'dist',
				removeTags: true,
				name: 'lib'
			}))
			.pipe(inject(gulp.src('./dist/js/shaders.js', {
				read: false
			}), {
				ignorePath: 'dist',
				removeTags: true,
				name: 'shaders'
			}))
	  		.pipe(gulp.dest('./dist')),
		gulp.src("./prod/**/*.php")
			.pipe(usemin())
			.pipe(inject(gulp.src('./dist/js/lib.js', {
				read: false
			}), {
				ignorePath: 'dist',
				removeTags: true,
				name: 'lib'
			}))
			.pipe(inject(gulp.src('./dist/js/shaders.js', {
				read: false
			}), {
				ignorePath: 'dist',
				removeTags: true,
				name: 'shaders'
			}))
	  		.pipe(gulp.dest('./dist')),
	  	gulp.src("./prod/**/*.txt")
	  		.pipe(gulp.dest('./dist')),
	  	gulp.src("./prod/**/*.json")
	  		.pipe(gulp.dest('./dist')),
	  	gulp.src("./prod/**/*.xml")
	  		.pipe(gulp.dest('./dist')),
  		gulp.src("./prod/**/*.mp3")
	  		.pipe(gulp.dest('./dist'))
	);
});

gulp.task('images', function() {
	return es.merge(
		gulp.src('./prod/img/**/*')
	        .pipe(imagemin({
	        	progressive: true,
	        	svgoPlugins: [{
	        		removeViewBox: false
	        	},
	        	{
	        		cleanupIDs: false
	        	},
	        	{
	        		collapseGroups: false
	        	},
	     		{
	     			convertShapeToPath: false
	     		}]
	        }))
	        .pipe(gulp.dest('./dist/img')),
		gulp.src(['./prod/*.png', './prod/*.jpg'])
	        .pipe(imagemin({
	        	progressive: true
	        }))
	        .pipe(gulp.dest('./dist'))
	);
});


// Watching files for changes before reloading
gulp.task('watch-img', function() {
	gulp.src('./prod/img/**/*')
	    .pipe(browserSync.reload({
	    	stream: true
	    }));
});

gulp.task('watch-js', function() {
	gulp.src('./prod/**/*.js')
	    .pipe(browserSync.reload({
	    	stream: true,
	    	once: true
	    }));
});

gulp.task('watch-html', function() {
	gulp.src('./prod/**/*.html')
	    .pipe(browserSync.reload({
	    	stream: true,
	    	once: true
	    }));
});

gulp.task('watch-php', function() {
	gulp.src('./prod/**/*.php')
	    .pipe(browserSync.reload({
	    	stream: true,
	    	once: true
	    }));
});




// Default functionality includes server with browser sync and watching
gulp.task('default', ['serve', 'sass'], function(){
	gulp.watch('./prod/sass/**/*.scss', ['sass']);
	gulp.watch('./prod/img/**/*', ['watch-img']);
	gulp.watch('./prod/js/**/*.js', ['watch-js']);
	gulp.watch('./prod/**/*.html', ['watch-html']);
	gulp.watch('./prod/**/*.php', ['watch-php']);
});



// Build functionality with cleaning, moving, compiling, etc.
gulp.task('build', ['remove'], function(){
	return gulp.start(
		'minify',
		'gzip',
		'html',
		'images'
	);
});
