module.exports = function(grunt) {
  var config = require('load-grunt-config')(grunt, {
    configPath: require('path').join(process.cwd(), 'tasks/options'),
    init: false
  });
  grunt.loadTasks('tasks');

  config.env = process.env;
  config.pkg = grunt.file.readJSON('package.json');
  config.meta = {
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %>\n' +
      ' * <%= pkg.homepage %>\n' +
      ' * License: <%= pkg.license %>\n' +
      ' */\n',
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
  };
  grunt.initConfig(config);

  this.registerTask('default', ['build']);

  // Build a new version of the library
  this.registerTask('build', 'Builds a temporary version', [
    'jshint:src',
    'concat_sourcemap:temp',
    'uglify:temp',
    'jshint:temp'
  ]);

  this.registerTask('build-release', 'Build a release version', [
    'jshint:src',
    'concat:release',
    'uglify:release',
    'jshint:release'
  ]);

  this.registerTask('tests', 'Builds the test package', []);
  
  this.registerTask('test', [
    'build', 
    'tests'
  ]);

  // grunt.loadNpmTasks('grunt-contrib-watch');
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-concat');
  // grunt.loadNpmTasks('grunt-concat-sourcemap');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-es6-module-transpiler');
};
