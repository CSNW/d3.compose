(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Labels: Chart with labels positioned at (x,y) points
  d3.chart('Chart')
    .mixin(extensions.XY)
    .extend('Labels', {
      initialize: function() {
        this.seriesLayer('Labels', this.base.append('g').classed('labels', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('text')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            var chart = this.chart();

            // TODO: set font-family, font-size in style to override css

            return this.append('text')
              .classed('label', true)
              .attr('font-family', chart.labelFontFamily())
              .attr('font-size', chart.labelFontSize())
              .attr('alignment-baseline', chart.labelAlignment.bind(chart));
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                .attr('x', chart.labelX.bind(chart))
                .attr('y', chart.y0.bind(chart))
                .attr('text-anchor', chart.labelAnchor.bind(chart))
                .text(0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                .attr('y', chart.labelY.bind(chart))
                .text(chart.yValue.bind(chart));
            }
          }
        });
      },

      labelX: function(d, i) {
        return this.x(d, i) + this.calculatedLabelOffset(d, i).x;
      },
      labelY: function(d, i) {
        return this.y(d, i) + this.calculatedLabelOffset(d, i).y;
      },

      calculatedLabelOffset: function(d, i) {
        var offset = this.labelOffset();

        var byPosition = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: 0},
          bottom: {x: 0, y: offset},
          left: {x: -offset, y: 0}
        };
        
        return byPosition[this.calculatedLabelPosition(d, i)];
      },
      labelAnchor: function(d, i) {
        if (this.calculatedLabelPosition(d, i) == 'right')
          return 'start';
        else if (this.calculatedLabelPosition(d, i) == 'left')
          return 'end';
        else
          return 'middle';
      },
      labelAlignment: function(d, i) {
        // Set alignment-baseline so that font size does not play into calculations
        // http://www.w3.org/TR/SVG/text.html#BaselineAlignmentProperties
        var byPosition = {
          top: 'after-edge',
          right: 'middle',
          bottom: 'before-edge',
          left: 'middle'
        };

        return byPosition[this.calculatedLabelPosition(d, i)];
      },

      calculatedLabelPosition: function(d, i) {
        var position = this.labelPosition();
        var parts = position.split('|');

        if (parts.length > 1) {
          var value = parts[0] == 'top' || parts[0] == 'bottom' ? this.yValue(d, i) : this.xValue(d, i);
          return value >= 0 ? parts[0] : parts[1];
        }
        else {
          return parts[0];
        }
      },

      // top, right, bottom, left, 1|2 (1 for positive or 0, 2 for negative)
      labelPosition: property('labelPosition', {defaultValue: 'top'}),
      // px distance offset from (x,y) point
      labelOffset: property('labelOffset', {defaultValue: 14}),

      // Font size, px
      labelFontSize: property('labelFontSize', {defaultValue: '14px'}),
      labelFontFamily: property('labelFontFamily', {defaultValue: 'sans-serif'})
    });
  
  // LabelValues: Chart with labels for centered values
  d3.chart('Chart')
    .mixin(d3.chart('Labels').prototype, extensions.Values)
    .extend('LabelValues', {
      labelX: function(d, i) {
        return this.itemX(d, i) + this.calculatedLabelOffset(d, i).x;
      }
    });

  // ChartWithLabels: Chart with labels attached
  // TODO: Attach labels after chart so that labels appear above chart
  d3.chart('Chart').extend('ChartWithLabels', {
    initialize: function() {
      if (this.showLabels()) {
        // Create labels chart
        this.labels = this.base.chart(this.isValues ? 'LabelValues' : 'Labels', this.options);  

        // Transfer certain properties to labels
        if (this.labels.displayAdjacent && this.displayAdjacent)
          this.labels.displayAdjacent(this.displayAdjacent());

        // Attach labels chart
        this.attach('Labels', this.labels);
      }
    },
    showLabels: property('showLabels', {defaultValue: true})
  });

  // Bars: Bar graph with centered key,value data and adjacent display for series
  d3.chart('ChartWithLabels')
    .mixin(extensions.XY, extensions.Values)
    .extend('Bars', {
      initialize: function() {
        this.seriesLayer('Bars', this.base.append('g').classed('bar-chart', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('rect')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            return this.append('rect')
              .classed('bar', true);
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                  .attr('x', chart.barX.bind(chart))
                  .attr('y', chart.y0.bind(chart))
                  .attr('width', chart.itemWidth.bind(chart))
                  .attr('height', 0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                  .attr('y', chart.barY.bind(chart))
                  .attr('height', chart.barHeight.bind(chart));
            }
          }
        });
      },
      barHeight: function(d, i) {
        return Math.abs(this.y0(d, i) - this.y(d, i));
      },
      barX: function(d, i) {
        return this.itemX(d, i) - this.itemWidth(d, i) / 2;
      },
      barY: function(d, i) {
        var y = this.y(d, i);
        var y0 = this.y0();
        
        return y < y0 ? y : y0;
      },
      displayAdjacent: property('displayAdjacent', {defaultValue: true})
    });

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
