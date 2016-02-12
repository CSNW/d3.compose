'use strict';

const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const gulpLoadPlugins = require('gulp-load-plugins');
const rimraf = require('rimraf');
const GithubApi = require('github');
const inquirer = require('inquirer');
const babel = require('rollup-plugin-babel');

const $ = gulpLoadPlugins();
const pkg = require('./package.json');
const paths = {
  tmp: './.tmp/',
  dist: './dist/',
  src: 'src/**/*.js',
  css: 'src/css/*.css',
  test: 'test/**/*.test.js',
  library: 'd3.compose.js',
  mixins: 'd3.compose-mixins.js',
  all: 'd3.compose-all.js',
  zip: `${pkg.name}-v${pkg.version}.zip`
};
const banner = '/*!\n' +
  ' * <%= pkg.name %> - <%= pkg.description %>\n' +
  ' * v<%= pkg.version %> - <%= pkg.homepage %> - license: <%= pkg.license %>\n' +
  ' */\n';

/**
  Build temporary version of library
*/
gulp.task('build:tmp', series(
  'clean:tmp',
  parallel('build:tmp:all', 'build:tmp:css')
));
gulp.task('build:tmp:library', build(paths.library, paths.tmp));
gulp.task('build:tmp:mixins', build(paths.mixins, paths.tmp));
gulp.task('build:tmp:all', build(paths.all, paths.tmp));
gulp.task('build:tmp:css', css(paths.css, paths.tmp));

/**
  Rebuild temp on change in js/css
*/
gulp.task('build:watch', series(
  'build:tmp',
  parallel('build:watch:js', 'build:watch:css')
));
gulp.task('build:watch:js', () => {
  gulp.watch([paths.src, paths.all], parallel('build:tmp:all'));
});
gulp.task('build:watch:css', () => {
  gulp.watch([paths.css], parallel('build:tmp:css'));
});

/**
  Build distribution version of library
*/
const dist_options = {minify: true, banner: true};
gulp.task('build:dist', series(
  'clean:dist',
  parallel('build:dist:library', 'build:dist:mixins', 'build:dist:all', 'build:dist:css')
));
gulp.task('build:dist:library', build(paths.library, paths.dist, dist_options));
gulp.task('build:dist:mixins', build(paths.mixins, paths.dist, dist_options));
gulp.task('build:dist:all', build(paths.all, paths.dist, dist_options));
gulp.task('build:dist:css', css(paths.css, paths.dist, dist_options));

/**
  Clean output folders
*/
gulp.task('clean:tmp', cb => rimraf(paths.tmp, cb));
gulp.task('clean:dist', cb => rimraf(paths.dist, cb));

/**
  Bump the bower version to match package.json
*/
gulp.task('version:bower', () => {
  return gulp.src('./bower.json')
    .pipe($.bump({version: pkg.version}))
    .pipe(gulp.dest('./'));
});

/**
  Prepare files for docs
*/
gulp.task('docs', () => {
  return gulp.src([`${paths.dist}*`, 'package.json', 'CHANGELOG.md'])
    .pipe($.copy('_docs/additional/'));
});

/**
  Create zip for github
*/
gulp.task('zip:github', () => {
  return gulp.src(`${paths.dist}*`, {base: 'dist'})
    .pipe($.zip(paths.zip))
    .pipe(gulp.dest(paths.tmp));
});

/**
  Publish release to github
*/
gulp.task('publish:github', series('zip:github', (cb) => {
  const github = new GithubApi({
    version: '3.0.0',
    protocol: 'https'
  });
  const tag_name = `v${pkg.version}`;
  const owner = 'CSNW';
  const repo = 'd3.compose';
  const name = `${pkg.name} ${tag_name}`;

  inquirer.prompt([{
    type: 'input',
    name: 'token',
    message: 'Enter your GitHub token'
  }], (answers) => {
    const token = answers.token;
    if (!token)
      return cb(new Error('A GitHub token is required to publish'));

    github.authenticate({
      type: 'oauth',
      token
    });

    console.log(`Creating release: "${name}"`)

    github.releases.createRelease({
      owner,
      repo,
      tag_name,
      name
    }, (err, response) => {
      if (err) return cb(err);

      console.log(`Uploading zip: "${paths.zip}"`);

      github.releases.uploadAsset({
        owner,
        repo,
        id: response.id,
        name: paths.zip,
        filePath: path.join(__dirname, paths.tmp, paths.zip)
      }, cb);
    })
  });
}));

/**
  Create js library build function

  @method build
  @param {String} entry file for rollup
  @param {String} output folder
  @param {Object} options
  @param {Boolean} [options.minify = false] Output minified build
  @param {Boolean} [options.banner = false] Include banner with build
  @return {Function}
*/
function build(entry, output, options) {
  options = Object.assign({
    minify: false,
    banner: false
  }, options);
  const filename = path.basename(entry, '.js');

  return () => {
    var build = gulp.src(entry, {read: false})
      .pipe($.plumber(onError));

    // For minify, use bundled for sourcemap
    if (!options.minify)
      build = build.pipe($.sourcemaps.init());

    build = build
      .pipe($.rollup({
        moduleName: 'd3c',
        sourceMap: !options.minify,
        external: ['d3', 'd3.chart'],
        globals: {
          d3: 'd3'
        },
        format: 'umd',
        plugins: [
          babel({
            exclude: 'node_modules/**'
          })
        ]
      }))
      .pipe($.replace(/\{version\}/g, pkg.version));

    if (options.banner)
      build = build.pipe($.header(banner, {pkg}));

    if (options.minify) {
      build = build
        .pipe(gulp.dest(output))
        .pipe($.sourcemaps.init())
        .pipe($.rename(filename + '.min.js'))
        .pipe($.uglify({
          preserveComments: 'license'
        }));
    }

    build = build
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(output));

    return build;
  };
}

/**
  Create css build function

  @method css
  @param {String|Array} files glob
  @param {String} output folder
  @param {Object} [options]
  @param {Boolean} [options.banner = false] Include banner with build
  @return {Function}
*/
function css(files, output, options) {
  options = Object.assign({
    banner: false
  }, options);

  return () => {
    var build = gulp.src(files)

    if (options.banner)
      build = build.pipe($.header(banner, {pkg}));

    build = build
      .pipe($.rename('d3.compose.css'))
      .pipe(gulp.dest(output));

    return build;
  };
}

function onError(err) {
  $.util.log($.util.colors.red('Error (' + err.plugin + '): ' + err.message));
  $.util.log(err);
  this.emit('end');
}

/**
  Approximate gulp 4.0 series

  @param {...String} ...tasks
  @param {Function} [fn] Function to call at end of series
  @return {Function}
*/
function series() {
  const tasks = Array.prototype.slice.call(arguments);
  var fn = cb => cb();

  if (typeof tasks[tasks.length - 1] === 'function')
    fn = tasks.pop();

  return (cb) => {
    const tasks_with_cb = tasks.concat([(err) => {
      if (err) return cb(err);
      fn(cb);
    }]);

    runSequence.apply(this, tasks_with_cb);
  }
}

/**
  Approximate gulp 4.0 parallel

  @param {...String} ...tasks
  @return {Array}
*/
function parallel() {
  return Array.prototype.slice.call(arguments);
}
