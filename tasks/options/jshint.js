module.exports = {
  options: {
    'jshintrc': '.jshintrc',
    ignores: ['src/build/*.js']
  },

  src: ['src/**/*.js'],
  build: ['dist/<%= pkg.name %>.js']
};
