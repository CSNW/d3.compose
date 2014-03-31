module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  test: {
    files: ['src/**/*.js', 'specs/**/*.js'],
    tasks: ['test']
  }
};
