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
      'src/helpers.js',
      'src/extensions.js',
      'src/base.js',
      'src/charts.js',
      'src/components.js',
      'src/configurable.js'
    ]
  };
  grunt.initConfig(config);

  grunt.loadTasks('tasks');
  this.registerTask('default', ['build']);
  
  this.registerTask('build', 'Builds a new version', [
    'jshint:src',
    'concat',
    'uglify',
    'jshint:build',
    'copy'
  ]);

  this.registerTask('tests', 'Prepares the test package', [
    // TODO Prepare test package
  ]);
  
  this.registerTask('test', 'Build library and tests and run tests' [
    'build', 
    'tests'
    // TODO Run tests
  ]);
};
