'use strict';

const path = require('path');
const gulp = require('gulp');
const GithubApi = require('github');
const inquirer = require('inquirer');
const $ = require('gulp-load-plugins')();

const pkg = require('./package.json');
const paths = {
  dist: './build/',
  css: 'src/css/*.css',
  zip: `${pkg.name}-v${pkg.version}.zip`
};
const banner = '/*!\n' +
  ' * <%= pkg.name %> - <%= pkg.description %>\n' +
  ' * v<%= pkg.version %> - <%= pkg.homepage %> - @license: <%= pkg.license %>\n' +
  ' */\n';

/**
  Build distribution version of library
*/
const dist_options = {minify: true, banner: true};

/**
  Bump the bower version to match package.json
*/
function version() {
  return gulp.src('./bower.json')
    .pipe($.bump({version: pkg.version}))
    .pipe(gulp.dest('./'));
}


/**
  Prepare files for docs
*/
function docs() {
  return gulp.src([`${paths.dist}*`, 'package.json', 'CHANGELOG.md'])
    .pipe($.copy('_docs/additional/'));
}

/**
  Create zip for github
*/
function zipGithub() {
  return gulp.src(`${paths.dist}*`, {base: 'dist'})
    .pipe($.zip(paths.zip))
    .pipe(gulp.dest(paths.dist));
}

/**
  Publish release to github
*/
function publishGithub(cb) {
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
        filePath: path.join(__dirname, paths.dist, paths.zip)
      }, cb);
    })
  });
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

module.exports = {
  css: css(paths.css, paths.dist, dist_options),
  docs,
  'publish:github': gulp.series(zipGithub, publishGithub),
  'version:bower': version
};
