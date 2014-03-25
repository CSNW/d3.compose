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

  grunt.loadTasks('tasks');
  this.registerTask('default', ['build']);
  
  this.registerTask('build', 'Builds a new version', [
    'jshint:src',
    'concat_sourcemap',
    'uglify',
    'jshint:built'
  ]);

  this.registerTask('tests', 'Builds the test package', []);
  
  this.registerTask('test', 'Build library and tests and run tests' [
    'build', 
    'tests'
  ]);
};
