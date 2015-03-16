module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  var src = {
    core: [
      'src/helpers.js',
      'src/Base.js',
      'src/Chart.js',
      'src/Component.js',
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
          'tmp/<%= pkg.name %>.js': src.core,
          'tmp/<%= pkg.name %>-mixins.js': src.core.concat(src.mixins),
          'tmp/<%= pkg.name %>-all.js': src.core.concat(src.mixins, src.lib),
          'tmp/<%= pkg.name %>.css': src.css
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
        src: 'tmp/<%= pkg.name %>-mixins.js',
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
      temp: ['tmp/<%= pkg.name %>-all.js'],
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
        dest: 'tmp/<%= pkg.name %>-v<%= pkg.version %>.zip'
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

  grunt.registerTask('release', 'Build a new release of the library', function(target) {
    var semver = require('semver');
    var fs = require('fs');
    var pkg = grunt.config('pkg');
    var bower = grunt.file.readJSON('bower.json');
    var version = target;

    // Use target for major, minor, patch or version
    // (e.g. grunt release:minor, grunt release:1.0.0-beta.1)
    if (version == 'major' || version == 'minor' || version == 'patch')
      version = semver.inc(pkg.version, version);

    if (!version || !semver.valid(version))
      throw new Error('version of "major", "minor", "patch", or [version] is required for release (e.g. grunt release:minor or grunt release:1.0.0-beta.1');

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
  });

  grunt.registerTask('publish', 'Publish a new release of the library', function() {
    var done = this.async();
    var async = require('async');
    var version = grunt.option('version');

    if (!version)
      return done(new Error('"version" option required for publish task'));

    git.currentBranch(function(err, branch) {
      if (err) return done(err);
      if (branch != 'master')
        return done(new Error('Must be on master branch to publish'));

      async.series([
        git.commit.bind(git, 'v' + version),
        git.tag.bind(git, 'v' + version),
        git.push,
        git.pushTags
        // TODO Upload zip to GitHub release API
      ], done);
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

function exec(cmd, cb) {
  require('child_process').exec(cmd, {cwd: process.cwd()}, function(err, stdout, stderr) {
    if (err) return cb(err);

    cb(stderr, stdout);
  });
}
