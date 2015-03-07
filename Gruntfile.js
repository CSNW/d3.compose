module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    env: process.env,
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * License: <%= pkg.license %>\n' +
        ' */\n',
      srcFiles: [
        // core
        'src/helpers.js',
        'src/Base.js',
        'src/Chart.js',
        'src/Component.js',
        'src/Multi.js',

        // mixins
        'src/mixins.js',

        // library
        'src/charts/XYLabels.js',
        'src/charts/Bars.js',
        'src/charts/Line.js',
        'src/components/Title.js',
        'src/components/Axis.js',
        'src/components/Legend.js',
        'src/extensions/xy.js'
      ]
    },

    concat: {
      options: {
        banner: '<%= meta.banner %>'
      },
      temp: {
        files: {
          'tmp/<%= pkg.name %>.js': '<%= meta.srcFiles %>'
        }
      },
      release: {
        files: {
          'dist/<%= pkg.name %>.js': '<%= meta.srcFiles %>'
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

    copy: {
      temp: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css'],
          dest: 'tmp/css/',
          rename: function(dest, name) {
            return dest + '<%= pkg.name %>.' + name;
          }
        }]
      },
      release: {
        files: [{
          expand: true,
          cwd: 'src/css',
          src: ['*.css'],
          dest: 'dist/css/',
          rename: function(dest, name) {
            return dest + '<%= pkg.name %>.' + name;
          }
        }]
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
          'bower_components/underscore/underscore.js',
          'bower_components/d3.chart/d3.chart.js'
        ]
      },

      temp: {
        src: 'tmp/d3.chart.multi.js',
        options: {
          outfile: 'specs/index.html',
          keepRunner: true  
        }
      },
      release: {
        src: 'dist/d3.chart.multi.js',
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
      temp: ['tmp/<%= pkg.name %>.js'],
      release: ['dist/<%= pkg.name %>.js'],
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
          'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
        }
      }
    },

    watch: {
      jshint: {
        files: ['src/**/*.js'],
        tasks: ['jshint:src']
      },
      test: {
        files: ['src/**/*.js', 'specs/**/*.js'],
        tasks: ['build', 'test']
      },
      build: {
        files: ['src/**/*.js', 'src/**/*.css'],
        tasks: ['build']
      }
    }
  });

  grunt.registerTask('default', ['test']);

  grunt.registerTask('build', 'Temp build of the library', [
    'concat:temp',
    'copy:temp'
  ]);

  grunt.registerTask('build:release', 'Release build of the library', [
    'concat:release',
    'uglify:release',
    'copy:release'
  ]);

  grunt.registerTask('release', 'Builds a new release of the library', [
    'build:release',
    'jshint:release',
    'jasmine:release'
  ]);
  
  grunt.registerTask('test', 'Lint and run specs', [
    'jshint:src',
    'jshint:specs',
    'jasmine:temp'
  ]);

  grunt.registerTask('server', 'Run example (at http://localhost:4001)', [
    'connect:example:keepalive'
  ]);

  grunt.registerTask('debug', 'Run example with automatic build', [
    'connect:example',
    'watch:build'
  ]);
};
