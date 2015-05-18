(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    XY Lines graph

    @class Lines
  */
  charts.Lines = charts.Chart.extend('Lines', mixin(mixins.Series, mixins.XY, mixins.XYLabels, mixins.Hover, mixins.HoverPoints, {
    initialize: function() {
      this.lines = {};

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
            .each(chart.createLine);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();

            if (!helpers.utils.isUndefined(chart.delay()))
              this.delay(chart.delay());
            if (!helpers.utils.isUndefined(chart.duration()))
              this.duration(chart.duration());
            if (!helpers.utils.isUndefined(chart.ease()))
              this.ease(chart.ease());

            this
              .attr('d', chart.lineData)
              .attr('style', chart.itemStyle);
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
      var key = chart.lineKey.call(this, d, i, j);
      var line = chart.lines[key] = d3.svg.line()
        .x(chart.x)
        .y(chart.y);

      var interpolate = d.interpolate || chart.interpolate();
      if (interpolate)
        line.interpolate(interpolate);
    }),
    lineKey: di(function(chart, d, i, j) {
      var key = chart.seriesKey(chart.seriesData.call(this, d, i, j));
      return key != null ? key : chart.seriesIndex.call(this, d, i, j);
    }),
    lineData: di(function(chart, d, i, j) {
      var key = chart.lineKey.call(this, d, i, j);
      if (chart.lines[key])
        return chart.lines[key](d);
    })
  }));

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
