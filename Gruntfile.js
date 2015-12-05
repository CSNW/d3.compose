// TODO Move all grunt functionality to gulp/npm

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    copy: {
      docs: {
        files: [{
          expand: true,
          src: ['dist/*'],
          dest: '_docs/additional/'
        }, {
          expand: true,
          src: ['package.json', 'CHANGELOG.md'],
          dest: '_docs/additional/'
        }]
      }
    }
  });

  grunt.registerTask('docs', 'Prepare files for docs', [
    'copy:docs'
  ]);
};
