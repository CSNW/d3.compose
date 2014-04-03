(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  d3.chart('Base').extend('Component', {
    initialize: function() {
      
    },

    width: property('width', {
      defaultValue: function() {
        return helpers.dimensions(this.base).width;
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    /**
      Height/width to use in layout calculations
      (Override for more specific sizing in layout calculations)
    */
    layoutWidth: function() {
      return this.width();
    },
    layoutHeight: function() {
      return this.height();
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      this.base.attr('transform', helpers.transform.translate(x, y));
      if (options && !_.isUndefined(options.height))
        this.height(options.height);
      if (options && !_.isUndefined(options.width))
        this.width(options.width);
    },

    position: property('position', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      },
      set: function(value, previous) {
        this.trigger('change:position');
      }
    })
  });

  // Title
d3.chart('Component')
  .extend('Title', {
    initialize: function() {
      this.layer('Title', this.base.append('g').classed('chart-title', true), {
        dataBind: function(data) {
          // TODO Look into databound titles

          // return this.selectAll('g')
          return this.selectAll('text')
            .data([0]);
        },
        insert: function() {
          // var group = this.append('g');
          // group.append('rect');
          // group.append('text');
          // return group;

          return this.append('text');
        },
        events: {
          merge: function() {
            var chart = this.chart();

            // this.select('rect')
            //   .attr('width', chart.width() / 2)
            //   .attr('height', chart.height() / 2)
            //   .attr('fill', '#999');

            // this.select('text')
            this
              .attr('transform', chart.transform())
              .attr('style', chart.style())
              .attr('alignment-baseline', 'middle')
              .attr('text-anchor', 'middle')
              .attr('class', chart.options['class'])
              .text(chart.title());
          }
        }
      });
    },

    transform: function() {
      var translate = helpers.transform.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.transform.rotate(this.rotation());

      return translate + rotate;
    },

    title: property('title'),
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),
    rotation: property('rotation', {
      defaultValue: function() {
        var rotateByPosition = {
          right: 90,
          left: -90
        };

        return rotateByPosition[this.position()] || 0;
      }
    })
  });

  // Axis: Add axis for given (x,y) series data
  d3.chart('Component')
    .mixin(extensions.Series, extensions.XY)
    .extend('Axis', {
      initialize: function() {
        // Transfer generic scale options to specific scale for axis
        if (this.options.scale) {
          var scale = this.isXAxis() ? 'xScale' : 'yScale';
          this[scale](helpers.createScaleFromOptions(this.options.scale));
        }

        this.axis = d3.svg.axis();
        this.axisLayer = this.base.append('g').attr('class', 'chart-axis');

        this.layer('Axis', this.axisLayer, {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales and data)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            var chart = this.chart();
            var position = chart.position();
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

      layoutHeight: function() {
        return this._labelOverhang().height;
      },
      layoutWidth: function() {
        return this._labelOverhang().width;
      },
      setLayout: function(x, y, options) {
        // Axis is positioned with chartBase, so don't set layout
        return;
      },

      isXAxis: function() {
        return this.axisOrientation() == 'horizontal';
      },
      isYAxis: function() {
        return this.axisOrientation() == 'vertical';
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
        
        return helpers.translate(translationByPosition[this.position()]);
      },

      // Position axis: top, right, bottom, left, x0, y0
      position: property('position', {
        defaultValue: 'bottom',
        set: function(value) {
          // TODO Do this automatically for properties
          this.trigger('change:position');
        },
        validate: function(value) {
          // TODO Add back x0 and y0
          return _.contains(['top', 'right', 'bottom', 'left'], value);
        }
      }),
      // Distance to offset chart margin on axis side
      axisOffset: property('axisOffset', {
        defaultValue: function() {
          var orientation = this.axisOrientation();
          return orientation == 'horizontal' ? 30 : 60;
        }
      }),

      axisOrient: function() {
        var orient = this.position();
        
        if (orient == 'x0')
          orient = 'left';
        else if (orient == 'y0')
          orient = 'bottom';
        
        return orient;
      },
      axisOrientation: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.position()];
      },

      _labelOverhang: function() {
        // TODO Look into overhang relative to chartBase (for x0, y0)
        var overhangs = {width: [0], height: [0]};
        var orientation = this.axisOrientation();

        this.axisLayer.selectAll('.tick').each(function() {
          if (orientation == 'horizontal')
            overhangs.height.push(this.getBBox().height);
          else
            overhangs.width.push(this.getBBox().width);
        });
        
        return {
          width: _.max(overhangs.width),
          height: _.max(overhangs.height)
        };
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
          .classed('chart-legend', true);

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
                return 'chart-legend-group chart-series index-' + (d.seriesIndex || 0);
              });

            groups.append('g')
              .attr('width', 20)
              .attr('height', 20)
              .attr('class', 'chart-legend-swatch');
            groups.append('text')
              .attr('class', 'chart-legend-label chart-label')
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

      transform: function(allData) {
        var extractData = d3.chart('Configurable').prototype.extractData;
        var data = _.reduce(this.options.charts, function(data, chart) {
          var chartData = _.map(extractData(chart, allData), function(series, index) {
            return {
              chart: chart,
              series: series,
              seriesIndex: index
            };
          });

          return data.concat(chartData);
        }, [], this);
        
        return data;
      },

      dataKey: function(d, i) {
        return d.chart.id + '.' + d.series.name;
      },
      dataValue: function(d, i) {
        return d.series.name;
      },
      dataSwatchProperties: function(d, i) {
        // Extract swatch properties from data
        return _.defaults({}, d.chart, d.series, {
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

        // TODO: Pull styles from itemStyle
        // (most of this is temporary)
        if (properties.isLine) {
          var line = selection.append('line')
            .attr('x1', 0).attr('y1', 10)
            .attr('x2', 20).attr('y2', 10)
            .attr('class', 'chart-line');
        }
        else {
          // Simple colored swatch
          selection.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 10)
            .attr('class', 'chart-bar');
        }
      },

      isLegend: true
    });

  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this.positionLegend();
    },

    layoutHeight: function() {
      return 0;
    },
    layoutWidth: function() {
      return 0;
    },
    setLayout: function(x, y, options) {
      // Positioned within chartBase, so don't set layout
      return;
    },

    positionLegend: function() {
      if (this.legend) {
        var position = this.position();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    },

    // Position legend: (x,y) of top left corner
    position: property('position', {
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
