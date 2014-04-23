module.exports = {
  options: {
    'jshintrc': '.jshintrc'
  },

  src: ['src/**/*.js'],
  specs: ['specs/*.spec.js'],
  build: ['dist/<%= pkg.name %>.js'],
  grunt: ['Gruntfile.js'],
  data: ['src/data.js', 'specs/data-spec.js']
};
