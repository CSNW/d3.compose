var gulp = require('gulp');
var del = require('del');
var concatCss = require('gulp-concat-css');
var connect = require('gulp-connect');
var eslint = require('gulp-eslint');
var header = require('gulp-header');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');

// TEMP Load grunt dependencies
require('gulp-grunt')(gulp);

var pkg = require('./package.json');
var tmp = './_tmp/';
var dist = './dist/';
var src = ['src/**/*.js', 'src/**/*.css'];
var specs = ['specs/**/*.spec.js'];

/**
  default:
  - start example server
  - watch for changes in src/ and specs/
  - build and test on changes
*/
gulp.task('default', ['connect', 'watch', 'build-and-test']);

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

/**
  test:
  - eslint src and specs
  - run specs through jasmine
*/
gulp.task('test', ['lint-src', 'lint-specs', 'grunt-jasmine:temp']);

/**
  watch:
  - build and test on changes in src/ and specs/
*/
gulp.task('watch', function() {
  return gulp.watch(src.concat(specs), ['build-and-test']);
});

/**
  serve:
  - build and serve example at localhost:4001
*/
gulp.task('serve', function(cb) {
  runSequence('build', ['connect', 'watch-build'], cb);
});

/**
  release:
  - build dist, test dist, and publish
*/
gulp.task('release', function(cb) {
  runSequence('dist', ['lint-dist', 'grunt-jasmine:release'], function() {
    gutil.log(gutil.colors.yellow('The release has successfully built, to publish run "grunt release"'));
    cb();
  });
});

/**
  docs:
  - copy files for gh-pages
*/
gulp.task('docs', ['grunt-docs']);

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

gulp.task('build-and-test', function(cb) {
  runSequence('build', 'test', cb);
});

// css
gulp.task('css-tmp', createCss(tmp));
gulp.task('css-dist', createCss(dist, {header: true}));

// lint
var compiled_options = {
  rules: {
    'eol-last': [0],
    'no-extra-strict': [0],
    'no-shadow': [0],
    'no-unused-expressions': [0],
    'semi': [0],
    'strict': [0]
  }
};

gulp.task('lint-src', createLint(['src/**/*.js', 'index.js', 'index-mixins.js', 'index-all.js']));
gulp.task('lint-specs', createLint(['specs/**/*.spec.js']));
gulp.task('lint-tmp', createLint(['_tmp/d3.compose-all.js'], compiled_options));
gulp.task('lint-dist', createLint(['dist/d3.compose-all.js'], compiled_options));

// watch
gulp.task('watch-build', function() {
  return gulp.watch(src, ['build']);
});

// connect
gulp.task('connect', function() {
  connect.server({
    root: ['.', 'example'],
    port: 4001
  });
});

var banner = '/*!\n' +
  ' * <%= pkg.name %> - <%= pkg.description %>\n' +
  ' * v<%= pkg.version %> - <%= pkg.homepage %> - license: <%= pkg.license %>\n' +
  ' */\n';

function createClean(folder) {
  return function(cb) {
    del([folder], cb);
  };
}

function createBuild(input, output, folder, options) {
  options = options || {};
  return function() {
    var build = gulp.src(input)
      .pipe(plumber(handleError))
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(bundle({
        name: 'd3c',
        sourceMapFile: output + '.js'
      }))
      .pipe(replace(/\{version\}/g, pkg.version))
      .pipe(rename(output + '.js'));

    if (options.minify) {
      // Add header to unminified
      if (options.header)
        build = build.pipe(header(banner, {pkg: pkg}));

      // Remove sourcemap from unminified and save
      // then rename and uglify
      build = build
        .pipe(replace(/\/\/# sourceMappingURL=.*/g, ''))
        .pipe(gulp.dest(folder))
        .pipe(rename(output + '.min.js'))
        .pipe(uglify());
    }

    if (options.header)
      build = build.pipe(header(banner, {pkg: pkg}));

    build = build
      .pipe(sourcemaps.write('./', {addComment: options.minify ? true : false}))
      .pipe(gulp.dest(folder));

    return build;
  };
}

function createCss(folder, options) {
  options = options || {};

  return function() {
    var css = gulp.src(['src/css/base.css']);

    if (options.header)
      css.pipe(header(banner, {pkg: pkg}));

    return css
      .pipe(concatCss('d3.compose.css'))
      .pipe(gulp.dest(folder));
  };
}

function createLint(files, options) {
  return function() {
    return gulp.src(files)
      .pipe(eslint(options))
      .pipe(eslint.format())
      .pipe(eslint.failOnError());
  };
}

function handleError(err) {
  gutil.log(gutil.colors.red('Error (' + err.plugin + '): ' + err.message));
  gutil.log(err);
  this.emit('end');
}

// Wrap esperanto.bundle for pipe with options
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

    esperanto.bundle(file_options).then(function(bundled) {
      try {
        var res = bundled.toUmd(file_options);

        if (file_options.sourceMap && res.map)
          applySourceMap(file, res.map);

        file.contents = new Buffer(res.code);
        cb(null, file);
      } catch(err) {
        cb(createError(err));
      }
    })
    ['catch'](function(err) {
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
