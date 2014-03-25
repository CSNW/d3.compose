module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  build: {
    files: ['src/**/*.js', 'vendor/*'],
    tasks: ['build']
  },
  server: {
    files: ['src/**/*.js', 'vendor/*', 'test/**/*'],
    tasks: ['test']
  },
  styles: {
    files: ['src/styles/*.less'],
    tasks: ['less']
  }
};
