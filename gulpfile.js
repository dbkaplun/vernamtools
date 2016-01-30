var gulp = require('gulp')
var gutil = require('gulp-util')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var sourcemaps = require('gulp-sourcemaps')

var path = require('path')

// js
var browserify = require('browserify')
var watchify = require('watchify')
var uglify = require('gulp-uglify')

// css
var less = require('gulp-less')
var postcss = require('gulp-postcss')
var nano = require('cssnano')

// fonts
var flatten = require('gulp-flatten')

// html
var htmlmin = require('gulp-htmlmin')

var src = 'src/'
var dist = 'dist/'

var watching = false
var b = watchify(browserify(watchify.args))
  .transform('babelify')
  .add(path.resolve(src, 'index.jsx'))
  .on('log', gutil.log)

function bundle () {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
      // Add transformation tasks to the pipeline here
      .pipe(uglify({compress: {drop_debugger: false}}))
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist))
    .on('end', () => { if (!watching) b.close() })
}
gulp.task('build-js', bundle)
gulp.task('build-fonts', () => {
  return gulp.src('**/*.{ttf,woff,woff2,eof,svg}')
    .pipe(flatten())
    .pipe(gulp.dest(path.resolve(dist, 'fonts')))
})
gulp.task('build-css', () => {
  return gulp.src(path.resolve(src, 'less/index.less'))
    .pipe(sourcemaps.init())
      // Add transformation tasks to the pipeline here
      .pipe(less())
      .pipe(postcss([nano]))
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dist))
})
gulp.task('build-html', ['build-js', 'build-css', 'build-fonts'], () => {
  return gulp.src(path.resolve(src, 'index.html'))
    .pipe(htmlmin({collapseWhitespace: true, removeComments: true}))
    .pipe(gulp.dest('.'))
})
gulp.task('build', ['build-html'])

gulp.task('pre-watch', () => { watching = true })
gulp.task('watch', ['pre-watch', 'build'], () => {
  b.on('update', bundle)
  gulp.watch('**/*.less', ['build-css'])
  gulp.watch('**/*.html', ['build-html'])
})

gulp.task('default', ['build'])
