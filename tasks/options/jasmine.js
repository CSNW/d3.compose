module.exports = {
  options: {
    specs: ['specs/**/*.spec.js', '!specs/data.spec.js'],
    helpers: [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/jasmine-jquery/lib/jasmine-jquery.js'
    ],
    vendor: [
      'bower_components/d3/d3.js',
      'bower_components/underscore/underscore.js',
      'bower_components/d3.chart/d3.chart.js'
    ]
  },

  src: {
    src: '<%= meta.srcFiles %>',
    options: {
      outfile: 'specs/index.html',
      keepRunner: true  
    }
  },

  build: {
    src: 'dist/d3.chart.csnw.configurable.js',
    options: {
      keepRunner: false  
    }
  },

  data: {
    src: 'src/data.js',
    options: {
      specs: 'specs/data-spec.js',
      keepRunner: true,
      vendor: [
        'bower_components/d3/d3.js',
        'bower_components/underscore/underscore.js',
        'bower_components/backbone/backbone.js'
      ]
    }
  }
};
