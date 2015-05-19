(function(d3, charts) {

  /**
    Foundation for building charts with series data

    @class Chart
  */
  charts.Chart = charts.Base.extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: 100,
    layer_type: 'chart'
  });

})(d3, d3.compose.charts);
