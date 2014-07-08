module.exports = {
  options: {
    'jshintrc': '.jshintrc'
  },

  src: ['src/**/*.js'],
  specs: ['specs/*.spec.js'],
  temp: ['tmp/<%= pkg.name %>.js'],
  release: ['dist/<%= pkg.name %>.js'],
  grunt: ['Gruntfile.js']
};
