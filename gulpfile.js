// Gulp Basics
var gulp        = require('gulp');
var plumber     = require('gulp-plumber');
var lazypipe    = require('lazypipe');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var notify      = require('gulp-notify');
//var merge        = require('merge-stream');
var header      = require('gulp-header');
var gulpFilter  = require('gulp-filter');
var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var changed     = require('gulp-changed');
var expect      = require('gulp-expect-file');
// var webserver   = require('gulp-webserver');

// CSS
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss    = require('gulp-minify-css');
var concatCss    = require('gulp-concat-css');

// Javascript
var uglify       = require('gulp-uglify');

// Variables & Asset Builder
var manifest = require('asset-builder')('public/assets/manifest.json');
var javascripts = manifest.getDependencyByName('main.js');
var styles = manifest.getDependencyByName('main.css');
var package = require('./package.json');

/**
 * CSS processing pipeline
 */
var cssTasks = lazypipe()
  .pipe(plumber)
  .pipe(sourcemaps.init)
  .pipe(sass,{ style: 'expanded' })
  .pipe(autoprefixer, {
    browsers: [
      'last 2 versions',
      'ie 8',
      'ie 9',
      'android 2.3',
      'android 4',
      'opera 12'
    ]
  })
  .pipe(sourcemaps.write)
  .pipe(gulp.dest, 'dist')
  .pipe(expect,'dist/main.css')
  .pipe(rename, {suffix: '.min'})
  .pipe(minifyCss, {
    advanced: false,
    rebase: false
  })
  .pipe(gulp.dest, 'dist')
  .pipe(expect,'dist/main.min.css');

/**
 * Javascript processing pipeline
 */
var jsTasks = lazypipe()
  .pipe(plumber)
  .pipe(concat, javascripts.name)
  .pipe(gulp.dest, manifest.paths.dist)
  .pipe(expect,'public/dist/main.js')
  .pipe(rename, { suffix: '.min' })
  .pipe(uglify)
  .pipe(gulp.dest, manifest.paths.dist)
  .pipe(expect,'public/dist/main.min.js');

/**
 * Clean - removes the dist folder
 */
gulp.task('clean', require('del').bind(null, [manifest.paths.dist]));

/**
 * Wiredep - inject bower css dependencies
 */
gulp.task('wiredep', function() {
  var wiredep = require('wiredep').stream;
  return gulp.src('public/assets/sass/main.scss')
  //return gulp.src(project.css) can't get variable to work for some weird reason :|
    .pipe(wiredep())
    .pipe(changed('public/assets/sass', {
      hasChanged: changed.compareSha1Digest
    }))
    .pipe(gulp.dest(manifest.paths.source + 'sass'));
});

/**
 * Process styles
 */

gulp.task('styles',['wiredep'], function() {
    gulp.src('public/assets/sass/main.scss').pipe(cssTasks());
});


/**
 * Process javascript
 */
gulp.task('scripts', function() {
    gulp.src(javascripts.globs).pipe(jsTasks());
});

/**
 * Watch for changes and compile
 */
gulp.task('watch', function() {
  browserSync.init({
    files: ['dist/*','*.html','*.php'],
    proxy: manifest.config.devUrl
  });
  gulp.watch('public/assets/sass/**', ['styles']);
  gulp.watch('public/assets/scripts/**', ['scripts']);
});

/**
 * Web Server
 */
// gulp.task('serve', function() {
//   gulp.src('./')
//     .pipe(webserver({
//       livereload: {
//         enable: true
//       },
//       directoryListing: true,
//       fallback: 'index.html',
//       open: true
//     }));
//     gulp.watch('assets/sass/**', ['styles']);
//     gulp.watch('assets/scripts/**', ['scripts']);
// });

/**
 * Build everything
 */
gulp.task('build', function(callback) {
  runSequence(
    'clean',
    ['styles','scripts'],
    callback
  );
});

/**
 * "Gulp" task
 */
gulp.task('default', function() {
  gulp.start('build');
});

/**
 * lil better error handling
 */
function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}
