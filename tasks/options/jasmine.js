module.exports = {
  src: '<%= meta.srcFiles %>',
  options: {
    specs: 'specs/**/*.spec.js',
    helpers: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jasmine-jquery/lib/jasmine-jquery.js'
    ],
    vendor: [
      'bower_components/d3/d3.js',
      'bower_components/underscore/underscore.js',
      'bower_components/d3.chart/d3.chart.js'
    ],
    outfile: 'specs/index.html',
    keepRunner: true
  }
};
