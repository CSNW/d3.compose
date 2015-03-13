(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    XY Line graph

    @class Line
  */
  d3.chart('Chart').extend('Line', mixin(mixins.Series, mixins.XY, mixins.XYLabels, mixins.Hover, mixins.HoverPoints, {
    initialize: function() {
      this.lines = [];

      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          return this.selectAll('path')
            .data(function(d, i, j) {
              return [data.call(this, d, i, j)];
            });
        },
        insert: function() {
          var chart = this.chart();

          return this.append('path')
            .classed('chart-line', true)
            .attr('style', chart.itemStyle)
            .each(chart.createLine);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();

            if (chart.delay())
              this.delay(chart.delay());
            if (chart.duration())
              this.duration(chart.duration());
            if (chart.ease())
              this.ease(chart.ease());

            this.attr('d', function(d, i, j) {
              return chart.lines[j](d);
            });
          }
        }
      });

      this.attachLabels();
    },

    /**
      Set interpolation mode for line

      - See: https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate
      - Set to null or 'linear' for no interpolation

      @property interpolate
      @type String
      @default monotone
    */
    interpolate: property('interpolate', {
      default_value: 'monotone'
    }),

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    createLine: di(function(chart, d, i, j) {
      var line = chart.lines[j] = d3.svg.line()
        .x(chart.x)
        .y(chart.y);

      var interpolate = d.interpolate || chart.interpolate();
      if (interpolate)
        line.interpolate(interpolate);
    })
  }));

})(d3, d3.chart.helpers, d3.chart.mixins);
