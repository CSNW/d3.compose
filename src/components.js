(function(d3, _, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Component
    Common component functionality / base for creating components

    Properties
    - {String} [position = top] (top, right, bottom, left)
    - {Number} [width = base width]
    - {Number} [height = base height]

    Customization
    - skipLayout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
    position: property('position', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
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
    skipLayout: false,

    /**
      Height/width/position to use in layout calculations
      (Override for more specific sizing in layout calculations)
    */
    layoutWidth: function() {
      return this.width();
    },
    layoutHeight: function() {
      return this.height();
    },
    layoutPosition: function() {
      return this.position();
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      this.base.attr('transform', helpers.transform.translate(x, y));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  });

  /**
    Title

    Properties:
    - {String} title
    - {Object} style
    - {Number} rotation
  */
  d3.chart('Component').extend('Title', {
    initialize: function() {
      this.layer('Title', this.base.append('g').classed('chart-title', true), {
        dataBind: function(data) {
          // TODO Look into databound titles
          return this.selectAll('text')
            .data([0]);
        },
        insert: function() {
          return this.append('text');
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('transform', chart.transformation())
              .attr('style', chart.style())
              .attr('alignment-baseline', 'middle')
              .attr('text-anchor', 'middle')
              .attr('class', chart.options['class'])
              .text(chart.title());
          }
        }
      });
    },

    title: property('title'),
    rotation: property('rotation', {
      defaultValue: function() {
        var rotateByPosition = {
          right: 90,
          left: -90
        };

        return rotateByPosition[this.position()] || 0;
      }
    }),

    transformation: function() {
      var translate = helpers.transform.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.transform.rotate(this.rotation());

      return translate + rotate;
    },
  });

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
  */
  d3.chart('Component').extend('Axis', mixin(extensions.Series, extensions.XY, {
    initialize: function() {
      // Transfer generic scale options to specific scale for axis
      if (this.options.scale) {
        var scale = this.isXAxis() ? 'xScale' : 'yScale';
        this[scale](helpers.createScaleFromOptions(this.options.scale));
      }

      this.axis = d3.svg.axis();
      this.axisLayer = this.base.append('g').attr('class', 'chart-axis');

      if (this.options.display) {
        this.layer('Axis', this.axisLayer, {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            return this.append('g');
          },
          events: {
            merge: function() {
              var chart = this.chart();

              // Setup axis (scale and properties)
              chart._setupAxis();

              // Place and render axis
              this
                .attr('transform', chart.translation())
                .call(chart.axis);
            }
          }
        });
      }
      else {
        this.skipLayout = true;
      }
    },

    position: property('position', {
      defaultValue: 'bottom',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      }
    }),

    translation: property('translation', {
      defaultValue: function() {
        var translationByPosition = {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(), y: 0},
          y0: {x: 0, y: this.y0()}
        };
        
        return helpers.translate(translationByPosition[this.position()]);
      }
    }),

    orient: property('orient', {
      defaultValue: function() {
        var orient = this.position();
        
        if (orient == 'x0')
          orient = 'left';
        else if (orient == 'y0')
          orient = 'bottom';
        
        return orient;
      }
    }),

    orientation: property('orientation', {
      validate: function(value) {
        return _.contains(['horizontal', 'vertical'], value);
      },
      defaultValue: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.position()];
      }
    }),

    ticks: property('ticks', {type: 'function'}),
    tickValues: property('tickValues', {type: 'function'}),
    tickSize: property('tickSize', {type: 'function'}),
    innerTickSize: property('innerTickSize', {type: 'function'}),
    outerTickSize: property('outerTickSize', {type: 'function'}),
    tickPadding: property('tickPadding', {type: 'function'}),
    tickFormat: property('tickFormat', {type: 'function'}),

    layoutHeight: function() {
      return this._labelOverhang().height;
    },
    layoutWidth: function() {
      return this._labelOverhang().width;
    },
    layoutPosition: function() {
      if (this.position() == 'x0')
        return 'bottom';
      else if (this.position() == 'y0')
        return 'right';
      else
        return this.position();
    },
    setLayout: function(x, y, options) {
      // Axis is positioned with chartBase, so don't set layout
      return;
    },

    isXAxis: function() {
      return this.orientation() == 'horizontal';
    },
    isYAxis: function() {
      return this.orientation() == 'vertical';
    },

    _setupAxis: function() {
      // Get scale by orientation
      var scale = this.isXAxis() ? this._xScale() : this._yScale();

      // Setup axis
      this.axis.scale(scale);

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value))
            this.axis[key].apply(this.axis, value);
          else
            this.axis[key](value);
        }
      }, this);
    },

    _labelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

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
  }));
  
  /**
    AxisValues
    Axis component for (key,value) series data
  */
  d3.chart('Component').extend('AxisValues', mixin(d3.chart('Axis').prototype, extensions.Values));

  /**
    Legend
  */
  d3.chart('Component').extend('Legend', {
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

            this.select('g').each(chart.createSwatch);
            this.select('text')
              .text(chart.dataValue.bind(chart))
              .attr('alignment-baseline', 'before-edge');

            // Position groups after positioning everything inside
            this.call(helpers.stack.bind(this, {origin: 'top', padding: 5}));
          }
        }
      });
    },
    isLegend: true,

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

    dataKey: di(function(chart, d, i) {
      return d.chart.id + '.' + d.series.name;
    }),
    dataValue: di(function(chart, d, i) {
      return d.series.name;
    }),
    dataSwatchProperties: di(function(chart, d, i) {
      // Extract swatch properties from data
      return _.defaults({}, d.chart, d.series, {
        type: 'swatch',
        color: 'blue',
        'class': ''
      });
    }),

    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);
      var properties = chart.dataSwatchProperties.call(this, d, i);

      // Clear existing swatch
      selection.empty();
      selection
        .classed(properties['class'], true);

      // TODO: Pull styles from itemStyle and add chart.createSwatch override (e.g. for line)
      if (properties.isLine) {
        selection.append('line')
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
    })
  });
  
  /**
    Inset legend
    Legend positioned within chart bounds

    Properties:
    - {Object} position {x,y} coordinates of legend origin relative chart bounds
  */
  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this._positionLegend();
    },

    position: property('position', {
      defaultValue: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        value = _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this._positionLegend();
          }
        };
      }
    }),
    skipLayout: true,

    _positionLegend: function() {
      if (this.legend) {
        var position = this.position();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
