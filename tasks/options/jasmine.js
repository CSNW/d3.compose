module.exports = {
  src: '<%= meta.srcFiles %>',
  options: {
    specs: 'specs/**/*.spec.js',
    vendor: [
      'bower_components/d3/d3.js',
      'bower_components/underscore/underscore.js',
      'bower_components/d3.chart/d3.chart.js'
    ],
    outfile: 'specs/index.html',
    keepRunner: true
  }
};
