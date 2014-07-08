module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  test: {
    files: ['src/**/*.js', 'specs/**/*.js'],
    tasks: ['build:quick', 'test']
  },
  build: {
    files: ['src/**/*.js'],
    tasks: ['build:quick']
  }
};
