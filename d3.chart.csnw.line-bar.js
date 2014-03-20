(function(d3, _) {

  // Add helpers
  var property = d3.chart.helpers.property;
  var dimensions = d3.chart.helpers.dimensions;
  var translate = d3.chart.helpers.translate;

  d3.chart('Base', {
    initialize: function(options) {
      this.options = options || {};
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

    data: property('data', {
      set: function(data) {
        this.trigger('change:data', data);
      }
    })
  });

  d3.chart('Base').extend('Container', {
    initialize: function() {
      // Overriding transform in init jumps it to the top of the stack
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
      var margins = this.chartMargins();
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

    rawData: property('rawData'),
    chartBase: property('chartBase'),
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
    chartWidth: function() {
      var margins = this.chartMargins();
      return this.width() - margins.left - margins.right;
    },
    chartHeight: function() {
      var margins = this.chartMargins();
      return this.height() - margins.top - margins.bottom;
    },

    width: property('width', {
      get: function(value) {
        return value != null ? value : dimensions(this.base).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      get: function(value) {
        return value != null ? value : dimensions(this.base).height;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    })
  });

  // Extensions

  var extensions = d3.chart.extensions = {};

  extensions.Series = {
    seriesKey: function(d, i) {
      return d.key;
    },
    seriesValues: function(d, i) {
      // Store series_index on series and values
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

  extensions.XY = {
    initialize: function() {
      this.on('change:data', this.setScales);
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
        xScale = this.setXScaleDomain(d3.scale.linear(), this.data() || [], this);
      if (!yScale)
        yScale = this.setYScaleDomain(d3.scale.linear(), this.data() || [], this);

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

    // _xScale and _yScale used to differentiate between user- and internally-set values
    _xScale: property('_xScale', {type: 'function'}),
    _yScale: property('_yScale', {type: 'function'}),
    xScale: property('xScale', {type: 'function'}),
    yScale: property('yScale', {type: 'function'}),

    xMin: property('xMin', {
      get: function(value) {
        var min = _.reduce(this.data(), function(memo, series, index) {
          var min = d3.extent(this.seriesValues(series, index), this.xValue)[0];
          return min < memo ? min : memo;
        }, Infinity, this);

        return value != null ? value : (min < 0 ? min : 0);
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.xValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return value != null ? value : max;
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
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
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.yValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return value != null ? value : max;
      }
    })
  };

  extensions.Values = {
    transform: function(data) {
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};

          // Use 0-based index for x
          return {
            x: item.x != null ? item.x : index,
            y: item.y,
            key: item.key
          }
        }, this);
      }, this);

      return data;
    }
  };

  extensions.Centered = {
    // Shift x-values 0.5 to right (center in step size of 1)
    // Expand domain +1 to include last shifted step
    x: function(d, i) {
      return this._xScale()(this.xValue(d, i) + 0.5);
    },
    setXScaleDomain: function(xScale, data, chart) {
      return xScale.domain([this.xMin(), this.xMax() + 1]);
    },

    itemWidth: function(d, i) {
      // Find maximum item count in series
      var max_count = _.reduce(this.data() || [], function(memo, series) {
        var count = this.seriesValues(series).length;
        return count > memo ? count : memo;
      }, 0, this);

      return (this.width() - this.itemPadding() * max_count) / max_count;
    },
    itemPadding: property('itemPadding', {
      get: function(value) {
        return value != null ? value : 0;
      }
    })
  };

  // Charts
  d3.chart('Base').mixin(extensions.Series).extend('Chart');

  d3.chart('Chart')
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
      lines: property('lines'),
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

  d3.chart('Chart')
    .mixin(extensions.XY, extensions.Values, extensions.Centered)
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
                .attr('width', chart.barWidth.bind(chart))
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
      barWidth: function(d, i) {
        var series_count = this.data() ? this.data().length : 1;
        return this.itemWidth() / series_count;
      },
      barX: function(d, i) {
        var x = this.x(d, i) - this.itemWidth() / 2
        return x + this.barWidth(d, i) * this.seriesIndex(d, i);
      },
      barY: function(d, i) {
        var y = this.y(d, i);
        var y0 = this.y0();
        
        return y < y0 ? y : y0;
      }
    });
  
  d3.chart('Chart')
    .mixin(d3.chart('Line').prototype, extensions.Values, extensions.Centered)
    .extend('LineValues');

  // Components

  d3.chart('Base').extend('Component', {
    width: property('width', {
      get: function(value) {
        return value != null ? value : dimensions(this.base).width;
      }
    }),
    height: property('height', {
      get: function(value) {
        return value != null ? value : dimensions(this.base).height;
      }
    })
  });
})(d3, _);
