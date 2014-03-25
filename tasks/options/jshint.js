module.exports = {
  options: {
    'jshintrc': '.jshintrc',
    ignores: ['src/build/*.js']
  },

  src: ['src/**/*.js'],
  built: ['dist/<%= pkg.name %>.js']
};
