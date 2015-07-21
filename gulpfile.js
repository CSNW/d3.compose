var gulp = require('gulp');
var del = require('del');
var concatCss = require('gulp-concat-css');
var eslint = require('gulp-eslint');
var file = require('gulp-file');
var header = require('gulp-header');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var tmp = './_tmp/';
var dist = './dist/';

/**
  build:
  - Bundle d3.compose.js, d3.compose-mixins.js, d3.compose-all.js, and d3.compose.css to _tmp/
*/
gulp.task('build', function(cb) {
  runSequence(
    'clean-tmp',
    ['build-tmp-library', 'build-tmp-mixins', 'build-tmp-all', 'css-tmp'],
    cb);
});

/**
  dist:
  - Bundle and minify d3.compose.js, d3.compose-mixins.js, d3.compose-all.js, and d3.compose.css to dist/
*/
gulp.task('dist', function(cb) {
  runSequence(
    'clean-dist',
    ['build-dist-library', 'build-dist-mixins', 'build-dist-all', 'css-dist'],
    cb);
});

// clean
gulp.task('clean-tmp', createClean(tmp));
gulp.task('clean-dist', createClean(dist));

// build
gulp.task('build-tmp-library', createBuild('index.js', 'd3.compose', tmp));
gulp.task('build-tmp-mixins', createBuild('index-mixins.js', 'd3.compose-mixins', tmp));
gulp.task('build-tmp-all', createBuild('index-all.js', 'd3.compose-all', tmp));

var dist_options = {header: true, minify: true};
gulp.task('build-dist-library', createBuild('index.js', 'd3.compose', dist, dist_options));
gulp.task('build-dist-mixins', createBuild('index-mixins.js', 'd3.compose-mixins', dist, dist_options));
gulp.task('build-dist-all', createBuild('index-all.js', 'd3.compose-all', dist, dist_options));

// css
gulp.task('css-tmp', createCss(tmp));
gulp.task('css-dist', createCss(dist));

// lint
gulp.task('lint-src', createLint(['src/**/*.js']));
gulp.task('lint-specs', createLint(['specs/**/*.spec.js']));

function createClean(folder) {
  return function(cb) {
    del([folder], cb);
  }
}

function createBuild(input, output, folder, options) {
  options = options || {};
  return function() {
    var banner = '/*!\n' +
      ' * <%= pkg.name %> - <%= pkg.description %>\n' +
      ' * v<%= pkg.version %> - <%= pkg.homepage %> - license: <%= pkg.license %>\n' +
      ' */\n';

    var build = gulp.src(input)
      .pipe(plumber(handleError))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(bundle({
        name: 'd3.compose',
        sourceMapFile: output + '.js'
      }))
      .pipe(replace(/\{version\}/g, pkg.version))
      .pipe(rename(output + '.js'));

    if (options.minify) {
      // Add header to unminified
      if (options.header)
        build = build.pipe(header(banner, {pkg: pkg}))

      // Remove sourcemap from unminified and save
      // then rename and uglify
      build = build
        .pipe(replace(/\/\/# sourceMappingURL=.*/g, ''))
        .pipe(gulp.dest(folder))
        .pipe(rename(output + '.min.js'))
        .pipe(uglify());
    }

    if (options.header)
      build = build.pipe(header(banner, {pkg: pkg}))

    build = build
      .pipe(sourcemaps.write('./', {addComment: options.minify ? true : false}))
      .pipe(gulp.dest(folder));

    return build;
  };
}

function createCss(folder) {
  return function() {
    return gulp.src(['src/css/base.css'])
      .pipe(concatCss('d3.compose.css'))
      .pipe(gulp.dest(folder));
  }
}

function createLint(src) {
  return function() {
    return gulp.src(src)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failOnError());
  }
}

function handleError(err) {
  gutil.log(gutil.colors.red('Error (' + err.plugin + '): ' + err.message));
  this.emit('end');
}

// Wrap esperanto.bundle for pipe with options
// TODO: PR to gulp-esperanto
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var assign = require('object-assign');
var esperanto = require('esperanto');

function bundle(options) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull())
      return cb(null, file);

    var file_options = assign({}, {
      entry: file.relative,
      sourceMap: !!file.sourceMap,
      sourceMapSource: file.relative,
      sourceMapFile: file.relative
    }, options);

    esperanto.bundle(file_options).then(function(bundle) {
      try {
        var bundled = bundle.toUmd(file_options);

        if (file_options.sourceMap && bundled.map)
          applySourceMap(file, bundled.map);

        file.contents = new Buffer(bundled.code);
        cb(null, file);
      } catch(err) {
        cb(createError(err));
      }
    }).catch(function(err) {
      cb(createError(err));
    });
  });

  function createError(err) {
    var message = err.message;
    if (err.file)
      message += ' [' + err.file + ']';

    return new gutil.PluginError('gulp-esperanto', message);
  }
}
