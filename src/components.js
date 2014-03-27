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

  // Axis: Add axis for given (x,y) series data
  d3.chart('Component')
    .mixin(extensions.Series, extensions.XY)
    .extend('Axis', {
      initialize: function() {
        this.axis = d3.svg.axis();

        this.layer('Axis', this.base.append('g').classed('axis', true), {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales and data)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            var chart = this.chart();
            var position = chart.axisPosition();
            var orientation = chart.axisOrientation();

            // Get scale by orientation
            var scale = orientation == 'horizontal' ? chart._xScale() : chart._yScale();

            // Setup axis
            chart.axis
              .scale(scale)
              .orient(chart.axisOrient());

            return this.append('g');
          },
          events: {
            merge: function() {
              var chart = this.chart();
              this
                .attr('transform', chart.axisTranlation.call(chart))
                .call(chart.axis);
            }
          }
        });
      },

      axisTranlation: function(d, i) {
        var translationByPosition = {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(d, i), y: 0},
          y0: {x: 0, y: this.y0(d, i)}
        };
        
        return helpers.translate(translationByPosition[this.axisPosition()]);
      },

      // Position axis: top, right, bottom, left, x0, y0
      axisPosition: property('axisPosition', {
        defaultValue: 'bottom',
        set: function(value) {
          // Update chartOffset by position
          var offset = this.chartOffset();
          var offsetDistance = this.axisOffset();
          var orient = this.axisOrient();
          
          if (!offset[orient]) {
            offset[orient] = offsetDistance;
            this.chartOffset(offset);
          }
        }
      }),
      // Distance to offset chart margin on axis side
      axisOffset: property('axisOffset', {
        defaultValue: function() {
          var orientation = this.axisOrientation();
          return orientation == 'horizontal' ? 30 : 60;
        }
      }),

      axisOrient: property('axisOrient', {
        defaultValue: function() {
          var orient = this.axisPosition();
          
          if (orient == 'x0')
            orient = 'left';
          else if (orient == 'y0')
            orient = 'bottom';
          
          return orient;
        }
      }),
      axisOrientation: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.axisPosition()];
      }
    });
  
  // AxisValues: Axis component for (key,value) series data
  d3.chart('Component')
    .mixin(d3.chart('Axis').prototype, extensions.Values)
    .extend('AxisValues');

  /**
    Legend component
  */
  d3.chart('Component')
    .mixin()
    .extend('Legend', {
      initialize: function() {
        this.legend = this.base.append('g')
          .classed('legend', true);

        this.layer('Legend', this.legend, {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('g')
              .data(data, chart.dataKey.bind(chart));
          },
          insert: function() {
            var chart = this.chart();
            var groups = this.append('g')
              .attr('class', function(d, i) {
                return 'legend-group series index-' + i;
              });

            groups.append('g')
              .attr('width', 20)
              .attr('height', 20)
              .attr('class', 'legend-swatch');
            groups.append('text')
              .attr('class', 'legend-label')
              .attr('transform', helpers.translate(25, 0));
            
            return groups;
          },
          events: {
            merge: function() {
              var chart = this.chart();

              this.select('g').each(chart.createSwatches());
              this.select('text')
                .text(chart.dataValue.bind(chart))
                .attr('alignment-baseline', 'before-edge');

              // Position groups after positioning everything inside
              this.call(helpers.stack.bind(this, {origin: 'top', padding: 5}));
            }
          }
        });
      },

      dataKey: function(d, i) {
        return d.key;
      },
      dataValue: function(d, i) {
        return d.name;
      },
      dataSwatchProperties: function(d, i) {
        // Extract swatch properties from data
        return _.defaults({}, d, {
          type: 'swatch',
          color: 'blue',
          'class': ''
        });
      },

      createSwatches: function() {
        var chart = this;
        return function(d, i) {
          chart.createSwatch(d3.select(this), d, i);
        };
      },
      createSwatch: function(selection, d, i) {
        var properties = this.dataSwatchProperties(d, i);

        // Clear existing swatch
        selection.empty();
        selection
          .classed(properties['class'], true);

        if (properties.type == 'Line' || properties.type == 'LineValues') {
          var line = selection.append('line')
            .attr('x1', 0).attr('y1', 10)
            .attr('x2', 20).attr('y2', 10)
            .attr('class', 'line');
        }
        else {
          // Simple colored swatch
          selection.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 10)
            .attr('class', 'bar'); // TODO: Temporary
        }
      },

      // Position legend: top, right, bottom, left
      legendPosition: property('legendPosition', {
        defaultValue: 'right',
        set: function(value) {
          var offset = {top: 0, right: 0, bottom: 0, left: 0};

          offset[value] = 100;
          this.chartOffset(offset);
        }
      })
    });

  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this.positionLegend();
    },

    positionLegend: function() {
      if (this.legend) {
        var position = this.legendPosition();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    },

    // Position legend: (x,y) of top left corner
    legendPosition: property('legendPosition', {
      defaultValue: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        value = _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this.positionLegend();
          }
        };
      }
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
