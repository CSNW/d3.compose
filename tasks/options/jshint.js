module.exports = {
  options: {
    'jshintrc': '.jshintrc',
    ignores: ['src/build/*.js']
  },

  src: ['src/**/*.js'],
  temp: ['tmp/<%= pkg.name %>.js'],
  release: ['dist/<%= pkg.name %>.js']
};
