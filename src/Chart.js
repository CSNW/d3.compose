(function(d3, _, helpers, mixins) {
  var property = helpers.property;
  
  /**
    Chart
    Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  });
  d3.chart('Chart').extend('SeriesChart', mixins.Series);

})(d3, _, d3.chart.helpers, d3.chart.mixins);
