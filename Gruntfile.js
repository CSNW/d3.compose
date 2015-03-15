module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  var src = {
    core: [
      'src/helpers.js',
      'src/Base.js',
      'src/Chart.js',
      'src/Component.js',
      'src/Multi.js'
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
          'bower_components/underscore/underscore.js',
          'bower_components/d3.chart/d3.chart.js'
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

  grunt.registerTask('serve', 'Run example with automatic build', [
    'connect:example',
    'watch:build'
  ]);

  grunt.registerTask('debug', 'Run example with automatic build and testing', [
    'connect:example',
    'watch:test'
  ]);
};
