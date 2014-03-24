(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  d3.chart('Base').extend('Component', {
    chartOffset: property('chartOffset', {
      get: function(values) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, {top: 0, right: 0, bottom: 0, left: 0});

        return values;
      },
      set: function(values, previous) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, previous, {top: 0, right: 0, bottom: 0, left: 0});

        return {
          override: values,
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
