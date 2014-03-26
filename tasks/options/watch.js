module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  build: {
    files: ['src/**/*.js'],
    tasks: ['build']
  },
  test: {
    files: ['src/**/*.js', 'specs/**/*.js'],
    tasks: ['test']
  }
};
