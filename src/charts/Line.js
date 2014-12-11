(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Line
    (x,y) line graph
  */
  d3.chart('SeriesChart').extend('Line', mixin(mixins.XYSeries, mixins.LabelsSeries, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var lines = {};

          // Add lines based on underlying series data
          _.each(chart.data(), function(series, index) {
            lines[index] = chart.createLine(series);
          });
          chart.lines(lines);

          // Rather than use provided series data
          return this.selectAll('path')
            .data(function(d, i) {
              return [chart.data()[i]];
            }, chart.seriesKey);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('path')
            .classed('chart-line', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();
            var lines = chart.lines();

            this
              .attr('d', function(d, i) {
                return lines[chart.seriesIndex.call(this, d, i)](chart.seriesValues.call(this, d, i));
              })
              .attr('style', chart.itemStyle);
          }
        }
      });
    },
    lines: property('lines', {defaultValue: {}}),

    createLine: function(series) {
      var line = d3.svg.line()
        .x(this.x)
        .y(this.y);

      var interpolate = series.interpolate || this.options().interpolate;
      if (interpolate)
        line.interpolate(interpolate);

      return line;
    },
    insertSwatch: function() {
      return this.append('line')
        .attr('x1', 0).attr('y1', 10)
        .attr('x2', 20).attr('y2', 10)
        .attr('class', 'chart-line');
    }
  }));
  
  /**
    LineValues
    Line graph for centered key,value data
  */
  d3.chart('Line').extend('LineValues', mixins.ValuesSeries);

})(d3, d3.chart.helpers, d3.chart.mixins);
