// TODO Move all grunt functionality to gulp/npm

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    env: process.env,
    pkg: grunt.file.readJSON('package.json'),

    copy: {
      docs: {
        files: [{
          expand: true,
          src: ['dist/*'],
          dest: '_docs/additional/'
        }, {
          expand: true,
          src: ['package.json', 'CHANGELOG.md'],
          dest: '_docs/additional/'
        }]
      }
    },

    zip: {
      release: {
        cwd: 'dist/',
        src: ['dist/*'],
        dest: '.tmp/<%= pkg.name %>-v<%= pkg.version %>.zip'
      }
    }
  });

  grunt.registerTask('docs', 'Prepare files for docs', [
    'copy:docs'
  ]);

  grunt.registerTask('prerelease', 'Prepare package.json for release', function() {
    var done = this.async();
    var inquirer = require('inquirer');
    var semver = require('semver');
    var fs = require('fs');
    var pkg = grunt.config('pkg');
    var bower = grunt.file.readJSON('bower.json');

    inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: 'Version ("major", "minor", "patch", or [version] (e.g. 0.1.2 or 1.0.0-beta.1)'
    }], function(answers) {
      var version = answers.version;

      if (version == 'major' || version == 'minor' || version == 'patch')
        version = semver.inc(pkg.version, version);
      else if (version && version.indexOf('v') === 0)
        version = version.substring(1);

      if (!version || !semver.valid(version))
        return done(new Error('version of "major", "minor", "patch", or [version] (e.g. 0.1.2 or 1.0.0-beta.1) is required for release'));

      grunt.log.writeln('Releasing ' + version + '...');

      // Update package.json, bower.json, and TODO gh-pages/config.yml with new version number
      pkg.version = version;
      bower.version = version;

      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2) + '\n');


      done();
    });
  });

  grunt.registerTask('release', 'Build a new release of the library', function() {
    var pkg = grunt.config('pkg');

    // publish
    grunt.config('pkg', pkg);
    grunt.option('version', pkg.version);
    grunt.task.run([
      'zip:release',
      'publish'
    ]);
  });

  grunt.registerTask('publish', 'Publish a new release of the library', function() {
    var done = this.async();
    var path = require('path');
    var async = require('async');
    var inquirer = require('inquirer');
    var pkg = grunt.config('pkg');
    var version = grunt.option('version');

    if (!version)
      return done(new Error('"version" option required for publish task'));

    inquirer.prompt([{
      type: 'input',
      name: 'token',
      message: 'Enter your GitHub token'
    }], function(answers) {
      var token = answers.token;
      if (!token)
        return done(new Error('A GitHub token is required to publish'));

      git.currentBranch(function(err, branch) {
        if (err) return done(err);
        if (branch != 'master')
          return done(new Error('Must be on master branch to publish'));

        var owner = 'CSNW';
        var repo = pkg.name;
        var tag = 'v' + version;
        var name = pkg.name + ' ' + tag;
        var asset_path = path.resolve(__dirname, '.tmp', pkg.name + '-' + tag + '.zip');

        async.series([
          git.commit.bind(git, tag),
          git.tag.bind(git, tag),
          git.push,
          git.pushTags,
          github.release.bind(github, owner, repo, tag, name, asset_path, token)
        ], done);
      });
    });
  });
};

var git = {
  commit: function(message, cb) {
    exec('git commit -am ' + message, cb);
  },
  tag: function(tag, cb) {
    exec('git tag ' + tag, cb);
  },
  push: function(cb) {
    exec('git push', cb);
  },
  pushTags: function(cb) {
    exec('git push --tags', cb);
  },
  currentBranch: function(cb) {
    exec('git rev-parse --abbrev-ref HEAD', function(err, branch) {
      if (err) return cb(err);

      cb(null, branch.replace(/\n/, ''));
    });
  }
};

var github = {
  release: function(owner, repo, tag, name, asset_path, token, cb) {
    var fs = require('fs');
    var path = require('path');
    var request = require('request');

    request.post({
      url: 'https://api.github.com/repos/' + owner + '/' + repo + '/releases',
      body: {
        tag_name: tag,
        name: name
      },
      headers: {
        'User-Agent': 'grunt publisher',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + token
      },
      json: true
    }, function(err, response, body) {
      if (err) return cb(err);
      if (response.statusCode != 201) return cb(new Error(body));

      var upload_url = body.upload_url.replace('{?name}', '');
      var stats = fs.statSync(asset_path);

      fs.createReadStream(asset_path)
        .pipe(request.post({
          url: upload_url,
          port: 443,
          headers: {
            'User-Agent': 'd3.compose publish',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + token,
            'Content-Type': 'application/zip',
            'Content-Length': stats.size
          },
          qs: {
            name: path.basename(asset_path)
          }
        }, function(err, response, body) {
          if (err) return cb(err);
          if (response.statusCode != 201) return cb(new Error(body));

          cb(null, response, body);
        }));
    });
  }
};

function exec(cmd, cb) {
  require('child_process').exec(cmd, {cwd: process.cwd()}, cb);
}
