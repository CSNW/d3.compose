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
    // TODO: Add LESS/SCSS -> dist: styles/d3.chart.csnw.configurable.base.css
  }
};
