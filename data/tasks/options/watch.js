module.exports = {
  jshint: {
    files: ['d3.data.js'],
    tasks: ['jshint:src']
  },
  test: {
    files: ['d3.data.js', 'specs/**/*.js'],
    tasks: ['test']
  }
};
