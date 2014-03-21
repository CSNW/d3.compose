(function(d3, _) {

  // Add shortcuts to helpers
  var property = d3.chart.helpers.property;
  var dimensions = d3.chart.helpers.dimensions;
  var translate = d3.chart.helpers.translate;
  var createScaleFromOptions = d3.chart.helpers.createScaleFromOptions;

  /**
    Base
  
    Shared functionality between all charts, components, and containers
  */
  d3.chart('Base', {
    initialize: function(options) {
      this.options = options || {};

      // Call any setters that match options
      _.each(this.options, function(value, key) {
        if (this[key] && this[key].isProperty && this[key].setFromOptions)
          this[key](value);
      }, this);
    },
    transform: function(data) {
      // Base is last transform to be called,
      // so stored data has been fully transformed
      this.data(data);
      return data;
    },

    width: function width() {
      return dimensions(this.base).width;
    },
    height: function height() {
      return dimensions(this.base).height;
    },

    // Store data after it has been fully transformed
    data: property('data', {
      set: function(data) {
        this.trigger('change:data', data);
      }
    })
  });

  /**
    Container

    Foundation for chart and component placement
  */
  d3.chart('Base').extend('Container', {
    initialize: function() {
      this.charts = [];
      this.chartsById = {};
      this.components = [];
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      }

      this.base.classed('chart', true);
      this.chartBase(this.base.append('g').classed('chart-base', true));

      this.updateDimensions();
      this.on('change:dimensions', function() {
        if (this.components)
          this.updateChartMargins();
        this.updateDimensions();
        this.redraw();
      });
    },

    updateDimensions: function() {
      // Explicitly set width and height of container
      this.base
        .attr('width', this.width())
        .attr('height', this.height());

      // Place chart base within container
      var margins = this._chartMargins();
      this.chartBase()
        .attr('transform', translate(margins.left, margins.top))
        .attr('width', this.chartWidth())
        .attr('height', this.chartHeight());
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    attachChart: function(id, chart) {
      chart.id = id;
      this.attach(id, chart);
      this.charts.push(chart);
      this.chartsById[id] = chart;
    },

    attachComponent: function(id, component) {
      component.id = id;
      this.attach(id, component);
      this.components.push(component);
      this.componentsById[id] = component;

      component.on('change:dimensions', function() {
        this.trigger('change:dimensions');
      });
    },

    updateChartMargins: function() {
      // Get user-defined chart margins
      var margins = this.chartMargins();

      // Update overall chart margins with component chartOffsets
      _.each(this.components, function(component) {
        var offset = component && component.chartOffset && component.chartOffset();

        if (offset) {
          margins.top += offset.top || 0;
          margins.right += offset.right || 0;
          margins.bottom += offset.bottom || 0;
          margins.left += offset.left || 0;
        }
      }, this);
      
      this._chartMargins(margins);
    },

    rawData: property('rawData'),
    chartBase: property('chartBase'),

    // Chart margins from Container edges ({top, right, bottom, left})
    chartMargins: property('chartMargins', {
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
    }),
    _chartMargins: property('_chartMargins', {
      defaultValue: function() {
        return this.chartMargins();
      }
    }),
    chartWidth: function() {
      var margins = this.chartMargins();
      return this.width() - margins.left - margins.right;
    },
    chartHeight: function() {
      var margins = this.chartMargins();
      return this.height() - margins.top - margins.bottom;
    },

    width: property('width', {
      defaultValue: function() {
        return dimensions(this.base).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return dimensions(this.base).height;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    })
  });

  
  // Extensions
  // ----------------------------------------------------------- //
  var extensions = d3.chart.extensions = {};

  // Extensions for handling series data
  extensions.Series = {
    seriesKey: function(d, i) {
      return d.key;
    },
    seriesValues: function(d, i) {
      // Store series_index on series and values
      // TODO: Look at more elegant way to do this that avoids changing data
      if (i != null)
        d.series_index = i;

      return _.map(d.values, function(value) {
        if (i != null)
          value.series_index = i;
        return value;
      });
    },
    seriesClass: function(d, i) {
      return 'series series_' + i + (d['class'] ? ' ' + d['class'] : '');
    },
    seriesIndex: function(d, i) {
      return d.series_index || 0;
    },
    seriesCount: function(d, i) {
      return this.data() ? this.data().length : 1;
    },

    /**
      seriesLayer

      extension of layer()
      - updates dataBind method to access underlying series values
      - handles appending series groups to chart
      -> should be used just like layer() would be used without series
      
      @param {String} name
      @param {Selection} selection
      @param {Object} options (`dataBind` and `insert` required)
    */
    seriesLayer: function(name, selection, options) {
      if (options && options.dataBind) {
        var dataBind = options.dataBind;

        options.dataBind = function(data) {
          var chart = this.chart();
          var series = this.selectAll('g')
            .data(data, chart.seriesKey.bind(chart));

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass.bind(chart));
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues.bind(chart));
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  // Extensions for handling XY data
  extensions.XY = {
    initialize: function() {
      this.on('change:data', this.setScales);

      if (this.options.xScale)
        this.xScale(createScaleFromOptions(this.options.xScale));
      if (this.options.yScale)
        this.yScale(createScaleFromOptions(this.options.yScale));
    },

    x: function(d, i) {
      return this._xScale()(this.xValue(d, i));
    },
    y: function(d, i) {
      return this._yScale()(this.yValue(d, i));
    },
    x0: function(d, i) {
      return this._xScale()(0);
    },
    y0: function(d, i) {
      return this._yScale()(0);
    },

    xValue: function(d, i) {
      return d.x;
    },
    yValue: function(d, i) {
      return d.y;
    },
    keyValue: function(d, i) {
      return d.key;
    },

    setScales: function() {
      var xScale = this.xScale();
      var yScale = this.yScale();

      // If no user-defined scales, create default and set domain
      if (!xScale)
        xScale = this.setXScaleDomain(this.defaultXScale(), this.data() || [], this);
      if (!yScale)
        yScale = this.setYScaleDomain(this.defaultYScale(), this.data() || [], this);

      // Range is dependent on chart dimensions, set separately even if scale is user-defined
      xScale = this.setXScaleRange(xScale, this.data() || [], this);
      yScale = this.setYScaleRange(yScale, this.data() || [], this);

      this._xScale(xScale)._yScale(yScale);
    },

    setXScaleDomain: function(xScale, data, chart) {
      return xScale.domain([this.xMin(), this.xMax()]);
    },
    setYScaleDomain: function(yScale, data, chart) {
      return yScale.domain([this.yMin(), this.yMax()]);
    },

    setXScaleRange: function(xScale, data, chart) {
      return xScale.range([0, chart.width()]);
    },
    setYScaleRange: function(yScale, data, chart) {
      return yScale.range([chart.height(), 0]);
    },

    defaultXScale: function() {
      return d3.scale.linear();
    },
    defaultYScale: function() {
      return d3.scale.linear();
    },

    // _xScale and _yScale used to differentiate between user- and internally-set values
    _xScale: property('_xScale', {type: 'function'}),
    _yScale: property('_yScale', {type: 'function'}),
    xScale: property('xScale', {type: 'function', setFromOptions: false}),
    yScale: property('yScale', {type: 'function', setFromOptions: false}),

    xMin: property('xMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var min = d3.extent(this.seriesValues(series, index), this.xValue)[0];
          return min < memo ? min : memo;
        }, Infinity, this);

        return value != null ? value : (min < 0 ? min : 0);
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.xValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return value != null ? value : max;
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var min = d3.extent(this.seriesValues(series, index), this.yValue)[0];
          return min < memo ? min : memo;
        }, Infinity, this);
        
        // Default behavior: if min is less than zero, use min, otherwise use 0
        return value != null ? value : (min < 0 ? min : 0);
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.yValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return value != null ? value : max;
      }
    })
  };

  // Extensions for charts of centered key,value data (x: index, y: value, key)
  extensions.Values = {
    isValues: true,
    transform: function(data) {
      // Transform series data from values to x,y
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};

          return {
            x: item.x != null ? item.x : item.key,
            y: item.y,
            key: item.key
          }
        }, this);
      }, this);

      return data;
    },

    x: function(d, i) {
      return this._xScale()(this.xValue(d, i)) + 0.5 * this.layeredWidth();
    },

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from series with most data to ensure loading all keys
      var keys = _.reduce(data, function(memo, series, index) {
        var keys = _.map(this.seriesValues(series, index), this.xValue.bind(this));
        return keys.length > memo.length ? keys : memo;
      }, [], this);

      return xScale.domain(keys);
    },

    setXScaleRange: function(xScale, data, chart) {
      return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
    },

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: function(d, i) {
      var adjacentWidth = this.adjacentWidth(d, i)
      var left = this.x(d, i) - this.layeredWidth(d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * this.seriesIndex(d, i);
    },
    adjacentWidth: function(d, i) {
      return this.layeredWidth(d, i) / this.seriesCount();
    },

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: function(d, i) {
      return this.x(d, i);
    },
    layeredWidth: function(d, i) {
      return this._xScale().rangeBand();
    },

    // itemX/Width determine centered-x and width based on series display type (adjacent or layered)
    itemX: function(d, i) {
      return this.displayAdjacent() ? this.adjacentX(d, i) : this.layeredX(d, i);
    },
    itemWidth: function(d, i) {
      return this.displayAdjacent() ? this.adjacentWidth(d, i) : this.layeredWidth(d, i);
    },

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),
    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  };

  // Charts
  // ----------------------------------------------------------- //

  // Chart: Foundation for building charts with series data
  d3.chart('Base').mixin(extensions.Series).extend('Chart');

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
              .attr('font-size', chart.labelFontSize());
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
        return this.x(d, i) + this.calculatedLabelOffset().x;
      },
      labelY: function(d, i) {
        return this.y(d, i) + this.calculatedLabelOffset().y;
      },

      calculatedLabelOffset: function() {
        var fontSize = parseFloat(this.labelFontSize());
        var offset = this.labelOffset();

        var by_position = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: (fontSize/2)},
          bottom: {x: 0, y: offset + fontSize},
          left: {x: -offset, y: (fontSize/2)}
        };
        
        return by_position[this.labelPosition()];
      },
      labelAnchor: function() {
        if (this.labelPosition() == 'right')
          return 'start';
        else if (this.labelPosition() == 'left')
          return 'end';
        else
          return 'middle';
      },

      // top, right, bottom, left
      labelPosition: property('labelPosition', {defaultValue: 'top'}),
      // px distance offset from (x,y) point
      labelOffset: property('labelOffset', {defaultValue: 14}),

      // Font size, px
      labelFontSize: property('labelFontSize', {
        defaultValue: 14,
        get: function(value) {
          // Make sure returned value is a string (add px if number)
          return _.isNumber(value) ? value + 'px' : value;
        }
      }),
      labelFontFamily: property('labelFontFamily', {defaultValue: 'sans-serif'})
    });
  
  // LabelValues: Chart with labels for centered values
  d3.chart('Chart')
    .mixin(d3.chart('Labels').prototype, extensions.Values)
    .extend('LabelValues', {
      labelX: function(d, i) {
        return this.itemX(d, i) + this.calculatedLabelOffset().x;
      }
    });

  // ChartWithLabels: Chart with labels attached
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
  })

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
            }
          }
        });
      },
      lines: property('lines', {defaultValue: []}),
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
  
  /**
    Configurable chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Configurable', {
        charts: [
          {type: 'Bars', data_key: 'participation', yScale: {domain: [0, 20000]}, itemPadding: 20},
          {type: 'LineValues', data_key: 'results', yScale: {domain: [0, 70]}, labelPosition: 'top'}
        ]
      })
      .width(600)
      .height(400)
      .chartMargins({top: 10, right: 10, bottom: 10, left: 10});
    ```

    @param {Object} options
    - charts: {Array} of chart definitions
      - type: Matches Chart name (Line, LineValues, Bars)
      - data_key: Key for extracting chart data from data object
      - other chart properties (e.g. xScale/yScale: {type, domain}, itemPadding, labelPosition, etc.)
    - axes: {Array} of axis definitions
      - type: [Axis] Matches Axis name (Axis, AxisValues)
      - data_key: Key for extracting axis data from data object
      - other axis properties
    - legend: {Object} of legend properties
      - data_key: Key for extracting legend data from data object
      - position: top, right, bottom, left
      - other legend properties
  */
  d3.chart('Container').extend('Configurable', {
    initialize: function() {
      // Setup charts
      _.each(this.options.charts, function(chart_options, i) {
        chart_options = _.defaults(chart_options || {}, {

        });

        if (!d3.chart(chart_options.type))
          return; // No matching chart found...

        var chart = this.chartBase().chart(chart_options.type, chart_options);
        var id = 'chart_' + i;

        this.attachChart(id, chart);
      }, this);

      // Setup axes
      _.each(this.options.axes, function(axis_options, i) {
        axis_options = _.defaults(axis_options || {}, {
          type: 'Axis'
        });

        if (!d3.chart(axis_options.type))
          return; // No matching axis found...

        var axis = this.chartBase().chart(axis_options.type, axis_options);
        var id = 'axis_' + i;

        this.attachComponent(id, axis);
      }, this);

      // Setup legend
      if (this.options.legend) {
        // ...
      }
    },
    demux: function(name, data) {
      var search = {id: name};
      var item = this.chartsById[name] || this.componentsById[name];
      var data_key = item && item.options && item.options.data_key || name;
      
      return data[data_key];
    }
  });

  // Components
  // ----------------------------------------------------------- //

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

            // Get scale by orientation (and if y-scale, flip range for correct values)
            var scale = orientation == 'horizontal' ? chart._xScale() : chart._yScale();

            // Setup axis
            chart.axis
              .scale(scale)
              .orient(chart.axisOrient());

            if (orientation == 'horizontal') {

              // chart.axis.ticks(function(d, i) {
              //   console.log('ticks', d, i);
              //   return d;
              // });
            }

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
        
        return translate(translationByPosition[this.axisPosition()]);
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
        var by_position = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return by_position[this.axisPosition()];
      }
    });
  
  // AxisValues: Axis component for (key,value) series data
  d3.chart('Component')
    .mixin(d3.chart('Axis').prototype, extensions.Values)
    .extend('AxisValues');

})(d3, _);
