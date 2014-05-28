(function(d3, _, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels
    Chart with labels positioned at (x,y) points

    Properties:
    - {String} [position = top] top, right, bottom, left, or a|b (a for positive values or 0, b for negative)
    - {Number} [offset = 10] px distance offset from data point
    - {String|Function} format String to be used in d3.format(...) or format function
  */
  d3.chart('Chart').extend('Labels', mixin(extensions.XY, {
    initialize: function() {
      this.seriesLayer('Labels', this.base.append('g').classed('chart-labels', true), {
        dataBind: function(data) {
          var chart = this.chart();
          return this.selectAll('text')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('text')
            .classed('chart-label', true)
            .attr('alignment-baseline', chart.labelAlignment)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();
            this
              .attr('x', chart.labelX)
              .attr('y', chart.y0)
              .attr('text-anchor', chart.labelAnchor)
              .text(0);
          },
          'merge:transition': function() {
            var chart = this.chart();
            this
              .attr('y', chart.labelY)
              .text(chart.labelValue);
          }
        }
      });
    },

    position: property('position', {defaultValue: 'top'}),
    offset: property('offset', {defaultValue: 14}),
    format: property('format', {
      type: 'function',
      set: function(value) {
        if (_.isString(value)) {
          return {override: d3.format(value)};
        }
      }
    }),

    labelX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    }),
    labelY: di(function(chart, d, i) {
      return chart.y.call(this, d, i) + chart.calculatedOffset.call(this, d, i).y;
    }),
    labelValue: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      return chart.format() ? chart.format()(value) : value;
    }),

    calculatedOffset: di(function(chart, d, i) {
      var offset = chart.offset();

      var byPosition = {
        top: {x: 0, y: -offset},
        right: {x: offset, y: 0},
        bottom: {x: 0, y: offset},
        left: {x: -offset, y: 0}
      };
      
      return byPosition[chart.calculatedPosition.call(this, d, i)];
    }),
    labelAnchor: di(function(chart, d, i) {
      if (chart.calculatedPosition.call(this, d, i) == 'right')
        return 'start';
      else if (chart.calculatedPosition.call(this, d, i) == 'left')
        return 'end';
      else
        return 'middle';
    }),
    labelAlignment: di(function(chart, d, i) {
      // Set alignment-baseline so that font size does not play into calculations
      // http://www.w3.org/TR/SVG/text.html#BaselineAlignmentProperties
      var byPosition = {
        top: 'after-edge',
        right: 'middle',
        bottom: 'before-edge',
        left: 'middle'
      };

      return byPosition[chart.calculatedPosition.call(this, d, i)];
    }),

    calculatedPosition: di(function(chart, d, i) {
      var position = chart.position();
      var parts = position.split('|');

      if (parts.length > 1) {
        var value = parts[0] == 'top' || parts[0] == 'bottom' ? chart.yValue.call(this, d, i) : chart.xValue.call(this, d, i);
        return value >= 0 ? parts[0] : parts[1];
      }
      else {
        return parts[0];
      }
    }),

    itemStyle: di(function(chart, d, i) {
      // For labels, only pull in label styles
      // - data.labels.style
      // - series.labels.style

      var data = d.labels || {};
      var series = chart.dataSeries.call(this, d, i) || {};
      series = series.labels || {};

      var styles = _.defaults({}, data.style, series.style, chart.options.style);
      
      return helpers.style(styles) || null;
    }),
  }));
  
  /**
    LabelValues
    Chart with labels for centered values
  */
  d3.chart('Labels').extend('LabelValues', mixin(extensions.Values, {
    labelX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    })
  }));

  /**
    ChartWithLabels
    Chart with labels attached
  */
  d3.chart('Chart').extend('ChartWithLabels', {
    initialize: function() {
      // Initialize on transform so that all child charts have been added
      // (make sure labels are on top)
      // TODO: While this does put labels on top of chart, it puts them on top of all charts
      // Need to place labels layer closer to parent chart
      this.once('transform', function() {
        if (this.showLabels()) {
          var labelOptions = _.defaults({}, this.options.labels, {
            displayAdjacent: this.displayAdjacent ? this.displayAdjacent() : false
          });

          var Labels = helpers.resolveChart(this.isValues ? 'LabelValues' : 'Labels', 'Chart', this.isValues);
          this.labels = new Labels(this.base, labelOptions);

          this.labels.xScale = property('xScale', {
            get: function() {
              return this._xScale();
            },
            context: this
          });
          this.labels.yScale = property('yScale', {
            get: function() {
              return this._yScale();
            },
            context: this
          });

          this.attach('Labels', this.labels);
        }
      });
    },

    transform: function(data) {
      this.trigger('transform');
      return data;
    },

    showLabels: property('showLabels', {defaultValue: true})
  });

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('ChartWithLabels').extend('Bars', mixin(extensions.XY, extensions.Values, {
    initialize: function() {
      this.seriesLayer('Bars', this.base.append('g').classed('chart-bars', true), {
        dataBind: function(data) {
          var chart = this.chart();

          return this.selectAll('rect')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('rect')
            .classed('chart-bar', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();
            this
                .attr('x', chart.barX)
                .attr('y', chart.y0)
                .attr('width', chart.itemWidth)
                .attr('height', 0);
          },
          'merge:transition': function() {
            var chart = this.chart();
            this
                .attr('y', chart.barY)
                .attr('height', chart.barHeight);
          }
        }
      });
    },
    barHeight: di(function(chart, d, i) {
      return Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();
      
      return y < y0 ? y : y0;
    }),
    displayAdjacent: property('displayAdjacent', {defaultValue: true})
  }));

  /**
    Line
    (x,y) line graph
  */
  d3.chart('ChartWithLabels').extend('Line', mixin(extensions.XY, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
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
              });
              // .attr('style', chart.itemStyle);
          }
        }
      });
    },
    lines: property('lines', {defaultValue: []}),
    // lineStyle: di(function(chart, d, i) {
    //   return helpers.style({
    //     stroke: chart.lineStroke.call(this, d, i),
    //     'stroke-dasharray': chart.lineStrokeDashArray.call(this, d, i)
    //   });
    // }),
    // lineStroke: di(function(chart, d, i) {
    //   return helpers.getValue(['stroke', 'color'], d, chart.options);
    // }),
    // lineStrokeDashArray: di(function(chart, d, i) {
    //   return helpers.getValue(['stroke-dasharray'], d, chart.options);
    // }),
    createLine: function(series) {
      var line = d3.svg.line()
        .x(this.x)
        .y(this.y);

      var interpolate = series.interpolate || this.options.interpolate;
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
  d3.chart('Line').extend('LineValues', extensions.Values);

})(d3, _, d3.chart.helpers, d3.chart.extensions);
