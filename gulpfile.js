var gulp = require('gulp');
var del = require('del');
var concatCss = require('gulp-concat-css');
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

gulp.task('build', function(cb) {
  runSequence('build-clean', ['build-library', 'build-mixins', 'build-all', 'build-css'], cb);
});
gulp.task('dist', function(cb) {
  runSequence('dist-clean', ['dist-library', 'dist-mixins', 'dist-all', 'dist-css'], cb);
});

gulp.task('build-clean', createClean(tmp));
gulp.task('dist-clean', createClean(dist));

gulp.task('build-library', createBuild('index.js', 'd3.compose', tmp));
gulp.task('build-mixins', createBuild('index-mixins.js', 'd3.compose-mixins', tmp));
gulp.task('build-all', createBuild('index-all.js', 'd3.compose-all', tmp));
gulp.task('build-css', createCss(tmp));

var dist_options = {header: true, minify: true};
gulp.task('dist-library', createBuild('index.js', 'd3.compose', dist, dist_options));
gulp.task('dist-mixins', createBuild('index-mixins.js', 'd3.compose-mixins', dist, dist_options));
gulp.task('dist-all', createBuild('index-all.js', 'd3.compose-all', dist, dist_options));
gulp.task('dist-css', createCss(dist));

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
