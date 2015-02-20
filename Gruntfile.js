module.exports = function(grunt) {
  // load-grunt-config does the following automatically
  // - load tasks/options into config
  // - load grunt-* npm tasks in package.json
  var config = require('load-grunt-config')(grunt, {
    configPath: require('path').join(process.cwd(), 'tasks/options'),
    init: false,
    loadGruntTasks: {
      pattern: 'grunt-*',
      config: require('./package.json'),
      scope: 'devDependencies'
    }
  });

  config.env = process.env;
  config.pkg = grunt.file.readJSON('package.json');
  config.meta = {
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
  };
  grunt.initConfig(config);

  grunt.loadTasks('tasks');
  this.registerTask('default', ['test']);

  this.registerTask('build', 'Temp build of the library', [
    'concat:temp',
    'copy:temp'
  ]);

  this.registerTask('build:release', 'Release build of the library', [
    'concat:release',
    'uglify:release',
    'copy:release'
  ]);

  this.registerTask('release', 'Builds a new release of the library', [
    'build:release',
    'jshint:release',
    'jasmine:release'
  ]);
  
  this.registerTask('test', 'Lint and run specs', [
    'jshint:src',
    'jshint:specs',
    'jasmine:temp'
  ]);

  this.registerTask('server', 'Run example (at http://localhost:4001)', [
    'connect:example:keepalive'
  ]);

  this.registerTask('debug', 'Run example with automatic build', [
    'connect:example',
    'watch:build'
  ]);
};
