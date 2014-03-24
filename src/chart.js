(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Chart: Foundation for building charts with series data
  */
  d3.chart('Base').mixin(extensions.Series).extend('Chart');

})(d3, _, d3.chart.helpers, d3.chart.extensions);
