module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    meta: {
      pkg: grunt.file.readJSON('package.json'),
      srcFiles: [
        'src/build/header.js',
        'src/helpers.js',
        'src/extensions.js',
        'src/base.js',
        'src/chart.js',
        'src/component.js',
        'src/container.js',
        'src/charts/labels.js',
        'src/charts/line.js',
        'src/charts/bars.js',
        'src/components/axis.js',
        'src/components/legend.js',
        'src/charts/configurable.js',
        'src/build/footer.js'
      ]
    },

    watch: {
      jshint: {
        files: ['src/**/*.js'],
        tasks: ['jshint:src']
      },
      build: {
        files: ['src/**/*.js'],
        tasks: ['build-dist']
      },
      styles: {
        // TODO: Add LESS/SCSS
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: ['src/build/*.js']
      },
      src: ['src/**/*.js'],
      grunt: ['Gruntfile.js'],
      built: ['dist/d3.chart.csnw.configurable.js']
    },

    concat_sourcemap: {
      dist: {
        options: {
          sourceRoot: '../'
        },
        files: {
          "dist/d3.chart.csnw.configurable.js": "<%= meta.srcFiles %>"
        }
      },
      release: {
        files: {
          "d3.chart.csnw.configurable.js": "<%= meta.srcFiles %>"
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= meta.pkg.name %> - v<%= meta.pkg.version %>\n' +
          ' * <%= meta.pkg.homepage %>\n' +
          ' * License: <%= meta.pkg.license %>\n' +
          ' */\n',
        sourceMap: true,
        mangle: {
          except: ['d3']
        }
      },
      dist: {
        files: {
          "dist/d3.chart.csnw.configurable.min.js": "dist/d3.chart.csnw.configurable.js"
        }
      },
      release: {
        files: {
          "d3.chart.csnw.configurable.min.js": "d3.chart.csnw.configurable.js"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt-contrib-concat has pending support for sourcemap,
  // use grunt-concat-sourcemap in the meantime
  grunt.loadNpmTasks('grunt-concat-sourcemap');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  
  grunt.registerTask('default', ['build-dist']);
  grunt.registerTask('build-dist', ['jshint:src', 'concat_sourcemap:dist', 'uglify:dist', 'jshint:built']);
  grunt.registerTask('build', ['jshint:src', 'concat_sourcemap', 'uglify', 'jshint:built']);
  grunt.registerTask('release', ['build']);
};
