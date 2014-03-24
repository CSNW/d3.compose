module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    meta: {
      pkg: grunt.file.readJSON('package.json')
    },

    watch: {
      jshint: {
        files: ['src/**/*.js', 'Gruntfile.js'],
        tasks: ['jshint:grunt', 'jshint:src']
      },
      build: {
        files: ['src/**/*.js', 'Gruntfile.js'],
        tasks: ['build-dist']
      },
      styles: {
        // TODO: Add LESS/SCSS
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      src: ['src/**/*.js'],
      grunt: ['Gruntfile.js'],
      built: ['dist/d3.chart.csnw.configurable.js']
    },

    preprocess: {
      dist: {
        files: {
          'dist/d3.chart.csnw.configurable.js': 'src/build/d3.chart.csnw.configurable.js'
        }
      },
      release: {
        files: {
          'd3.chart.csnw.configurable.js': 'src/build/d3.chart.csnw.configurable.js' 
        }
      }
    },

    concat: {
      options: {
        banner: '/*! <%= meta.pkg.name %> - v<%= meta.pkg.version %>\n' +
          ' * <%= meta.pkg.homepage %>\n' +
          ' *  License: <%= meta.pkg.license %>\n' +
          ' */\n'
      },
      dist: {
        'dist/d3.chart.csnw.configurable.js': 'd3.chart.csnw.configurable.js'
      },
      release: {
        'd3.chart.csnw.configurable.js': 'd3.chart.csnw.configurable.js'
      }
    },

    uglify: {
      options: {
        // Preserve banner
        preserveComments: 'some'
      },
      dist: {
        files: {
          "dist/d3.chart.csnw.configurable.min.js": "dist/d3.chart.csnw.configurable.js"
        }
      },
      release: {
        files: {
          "d3.chart.csnw.configurable.min.js": "dist/d3.chart.csnw.configurable.js"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  grunt.registerTask('default', ['build-dist']);
  grunt.registerTask('build-dist', ['jshint:grunt', 'jshint:src', 'preprocess:dist', 'concat:dist', 'uglify:dist', 'jshint:built']);
  grunt.registerTask('build', ['jshint:grunt', 'jshint:src', 'preprocess', 'concat', 'uglify', 'jshint:built']);
  grunt.registerTask('release', ['build']);
};
