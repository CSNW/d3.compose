(function(d3) {

  /**
    Foundation for building charts with series data

    @class Chart
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: 100,
    layer_type: 'chart'
  });

})(d3);
