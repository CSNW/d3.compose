module.exports = {
  jshint: {
    files: ['src/**/*.js'],
    tasks: ['jshint:src']
  },
  test: {
    files: ['src/**/*.js', 'specs/**/*.js'],
    tasks: ['test']
  },
  data: {
    files: ['src/data.js', 'specs/data-spec.js'],
    tasks: ['jshint:data', 'jasmine:data']
  }
};
