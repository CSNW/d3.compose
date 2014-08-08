module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  test: {
    files: ['src/**/*.js', 'specs/**/*.js'],
    tasks: ['build', 'test']
  },
  build: {
    files: ['src/**/*.js', 'src/**/*.css'],
    tasks: ['build']
  }
};
