(function(d3, helpers) {
  
  /**
    Chart
    Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: 100
  });

})(d3, d3.chart.helpers);
