module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  var src = {
    core: [
      'src/helpers.js',
      'src/Base.js',
      'src/Chart.js',
      'src/Component.js',
      'src/Overlay.js',
      'src/Compose.js'
    ],
    mixins: [
      'src/mixins.js'
    ],
    lib: [
      'src/charts/Labels.js',
      'src/charts/Bars.js',
      'src/charts/Lines.js',
      'src/components/Title.js',
      'src/components/Axis.js',
      'src/components/Legend.js',
      'src/extensions/xy.js'
    ],
    css: [
      'src/css/base.css'
    ]
  };

  grunt.initConfig({
    env: process.env,
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * License: <%= pkg.license %>\n' +
        ' */\n',
      src: src
    },

    concat: {
      temp: {
        options: {
          sourceMap: true
        },
        files: {
          '_tmp/<%= pkg.name %>.js': src.core,
          '_tmp/<%= pkg.name %>-mixins.js': src.core.concat(src.mixins),
          '_tmp/<%= pkg.name %>-all.js': src.core.concat(src.mixins, src.lib),
          '_tmp/<%= pkg.name %>.css': src.css
        }
      },
      release: {
        options: {
          banner: '<%= meta.banner %>'
        },
        files: {
          'dist/<%= pkg.name %>.js': src.core,
          'dist/<%= pkg.name %>-mixins.js': src.core.concat(src.mixins),
          'dist/<%= pkg.name %>-all.js': src.core.concat(src.mixins, src.lib),
          'dist/<%= pkg.name %>.css': src.css
        }
      }
    },

    copy: {
      docs: {
        files: [{
          expand: true,
          cwd: 'dist/',
          src: ['d3.compose-all.js', 'd3.compose-all.min.js', 'd3.compose-all.min.js.map', 'd3.compose.css'],
          dest: '_docs/additional/'
        }, {
          src: ['CHANGELOG.md'],
          dest: '_docs/additional/'
        }]
      }
    },

    connect: {
      example: {
        options: {
          port: 4001,
          base: ['.', 'example'],
          open: true,
          hostname: 'localhost'
        }
      }
    },

    jasmine: {
      options: {
        specs: ['specs/**/*.spec.js'],
        helpers: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/jasmine-jquery/lib/jasmine-jquery.js'
        ],
        vendor: [
          'bower_components/d3/d3.js',
          'bower_components/d3.chart/d3.chart.js',
          'bower_components/underscore/underscore.js'
        ]
      },

      temp: {
        src: '_tmp/<%= pkg.name %>-mixins.js',
        options: {
          outfile: 'specs/index.html',
          keepRunner: true
        }
      },
      release: {
        src: 'dist/<%= pkg.name %>-mixins.js',
        options: {
          outfile: 'specs/index.html',
          keepRunner: false
        }
      }
    },

    jshint: {
      options: {
        'jshintrc': '.jshintrc'
      },

      src: ['src/**/*.js'],
      specs: ['specs/*.spec.js'],
      temp: ['_tmp/<%= pkg.name %>-all.js'],
      release: ['dist/<%= pkg.name %>-all.js'],
      grunt: ['Gruntfile.js']
    },

    uglify: {
      options: {
        banner: '<%= meta.banner %>',
        sourceMap: true,
        mangle: {
          except: ['d3']
        }
      },
      release: {
        files: {
          'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js',
          'dist/<%= pkg.name %>-mixins.min.js': 'dist/<%= pkg.name %>-mixins.js',
          'dist/<%= pkg.name %>-all.min.js': 'dist/<%= pkg.name %>-all.js'
        }
      }
    },

    watch: {
      jshint: {
        files: ['src/**/*.js'],
        tasks: ['jshint:src']
      },
      test: {
        files: ['src/**/*.js', 'src/**/*.css', 'specs/**/*.js'],
        tasks: ['build', 'test']
      },
      build: {
        files: ['src/**/*.js', 'src/**/*.css'],
        tasks: ['build']
      }
    },

    zip: {
      release: {
        cwd: 'dist/',
        src: ['dist/*'],
        dest: '_tmp/<%= pkg.name %>-v<%= pkg.version %>.zip'
      }
    }
  });

  grunt.registerTask('default', ['test']);

  grunt.registerTask('build', 'Temp build of the library', [
    'concat:temp'
  ]);

  grunt.registerTask('build:release', 'Release build of the library', [
    'concat:release',
    'uglify:release'
  ]);

  grunt.registerTask('test', 'Lint and run specs', [
    'jshint:src',
    'jshint:specs',
    'jasmine:temp'
  ]);

  grunt.registerTask('serve', 'Run example with automatic build', [
    'connect:example',
    'watch:build'
  ]);

  grunt.registerTask('debug', 'Run example with automatic build and testing', [
    'connect:example',
    'watch:test'
  ]);

  grunt.registerTask('docs', 'Prepare files for docs', [
    'copy:docs'
  ]);

  grunt.registerTask('release', 'Build a new release of the library', function() {
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
      grunt.config('pkg', pkg);

      // build, jshint, test, and publish
      grunt.option('version', version);
      grunt.task.run([
        'build:release',
        'jshint:release',
        'jasmine:release',
        'zip:release',
        'publish'
      ]);

      done();
    });
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
        var asset_path = path.resolve(__dirname, '_tmp', pkg.name + '-' + tag + '.zip');

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
