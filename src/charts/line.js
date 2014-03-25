(function(d3, _, helpers, extensions) {
  var property = helpers.property;
  
  // Line: (x,y) line graph
  d3.chart('ChartWithLabels')
    .mixin(extensions.XY)
    .extend('Line', {
      initialize: function() {
        this.seriesLayer('Line', this.base.append('g').classed('line-chart', true), {
          dataBind: function(data) {
            var chart = this.chart();

            // Add lines based on underlying series data
            chart.lines(_.map(chart.data(), function(series) {
              return chart.createLine(series);
            }));

            // Rather than use provided series data
            return this.selectAll('path')
              .data(function(d, i) {
                return [chart.data()[i]];
              }, chart.seriesKey.bind(chart));
          },
          insert: function() {
            return this.append('path')
              .classed('line', true);
          },
          events: {
            'merge:transition': function() {
              var chart = this.chart();
              var lines = chart.lines();

              this
                .attr('d', function(d, i) {
                  return lines[chart.seriesIndex(d, i)](chart.seriesValues(d, i));
                })
                .attr('style', chart.lineStyle.bind(chart));
            }
          }
        });
      },
      lines: property('lines', {defaultValue: []}),
      lineStyle: function(d, i) {
        return helpers.style({
          stroke: this.lineStroke(d, i),
          'stroke-dasharray': this.lineStrokeDashArray(d, i)
        });
      },
      lineStroke: function(d, i) {
        return helpers.getValue(['stroke', 'color'], d, this.options);
      },
      lineStrokeDashArray: function(d, i) {
        return helpers.getValue(['stroke-dasharray'], d, this.options);
      },
      createLine: function(series) {
        var line = d3.svg.line()
          .x(this.x.bind(this))
          .y(this.y.bind(this));

        var interpolate = series.interpolate || this.options.interpolate;
        if (interpolate)
          line.interpolate(interpolate);

        return line;
      }
    });
  
  // LineValues: Line graph for centered key,value data
  d3.chart('ChartWithLabels')
    .mixin(d3.chart('Line').prototype, extensions.Values)
    .extend('LineValues');

})(d3, _, d3.chart.helpers, d3.chart.extensions);
