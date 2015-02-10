(function(d3, _, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

  /**
    mixins for handling series data
  */
  var Series = {
    isSeries: true,

    seriesKey: di(function(chart, d, i) {
      return d.key;
    }),
    seriesValues: di(function(chart, d, i) {
      // Store seriesIndex on series
      d.seriesIndex = i;
      return d.values;
    }),
    seriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + i + (d['class'] ? ' ' + d['class'] : '');
    }),
    seriesIndex: di(function(chart, d, i) {
      var series = chart.seriesData.call(this, d, i);
      return series && series.seriesIndex || 0;
    }),
    seriesCount: di(function(chart, d, i) {
      return chart.data() ? chart.data().length : 1;
    }),
    seriesData: di(function(chart, d, i) {
      return helpers.getParentData(this);
    }),
    itemStyle: di(function(chart, d, i) {
      // Get style for data item in the following progression
      // data.style -> series.style -> chart.style
      var series = chart.seriesData.call(this, d, i) || {};
      var styles = _.defaults({}, d.style, series.style, chart.options().style);
      
      return helpers.style(styles) || null;
    }),

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
            .data(data, chart.seriesKey);

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass);
          
          series.exit()
            .remove();
          
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  /**
    mixins for handling XY data

    Properties:
    - xKey {String}
    - yKey {String}
    - xScale {Object|d3.scale}
    - yScale {Object|d3.scale}
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
  */
  var XY = {
    initialize: function() {
      // Set scale ranges once chart is ready to be rendered
      this.on('before:draw', this.setScales.bind(this));
    },
    
    isXY: true,

    xKey: property('xKey', {defaultValue: 'x'}),
    yKey: property('yKey', {defaultValue: 'y'}),

    xScale: property('xScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);
        this.setXScaleRange(scale);

        return {
          override: scale
        };
      },
      get: function(scale) {
        if (!scale) {
          scale = this.getDefaultXScale();
          this.setXScaleRange(scale);
        }

        return scale;
      }
    }),
    yScale: property('yScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);
        this.setYScaleRange(scale);

        return {
          override: scale
        };
      },
      get: function(scale) {
        if (!scale) {
          scale = this.getDefaultYScale();
          this.setYScaleRange(scale);
        }
 
        return scale;
      }
    }),

    xMin: property('xMin', {
      get: function(value) {
        var min = helpers.min(this.data(), this.xValue);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return parseFloat(valueOrDefault(value, (min < 0 ? min : 0)));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.xValue);
        return parseFloat(valueOrDefault(value, max));
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        var min = helpers.min(this.data(), this.yValue);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return parseFloat(valueOrDefault(value, (min < 0 ? min : 0)));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.yValue);
        return parseFloat(valueOrDefault(value, max));
      }
    }),

    x: di(function(chart, d, i) {
      return parseFloat(chart.xScale()(chart.xValue.call(this, d, i)));
    }),
    y: di(function(chart, d, i) {
      return parseFloat(chart.yScale()(chart.yValue.call(this, d, i)));
    }),
    x0: di(function(chart, d, i) {
      return parseFloat(chart.xScale()(0));
    }),
    y0: di(function(chart, d, i) {
      return parseFloat(chart.yScale()(0));
    }),

    xValue: di(function(chart, d, i) {
      return d[chart.xKey()];
    }),
    yValue: di(function(chart, d, i) {
      return d[chart.yKey()];
    }),
    keyValue: di(function(chart, d, i) {
      return !_.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i);
    }),

    setScales: function() {
      this.setXScaleRange(this.xScale());
      this.setYScaleRange(this.yScale());
    },

    setXScaleRange: function(xScale) {
      xScale.range([0, this.width()]);
    },
    setYScaleRange: function(yScale) {
      yScale.range([this.height(), 0]);
    },

    getDefaultXScale: function() {
      return helpers.createScaleFromOptions({
        data: this.data(),
        key: this.xKey()
      });
    },
    getDefaultYScale: function() {
      return helpers.createScaleFromOptions({
        data: this.data(),
        key: this.yKey()
      });
    }
  };

  /**
    TODO Remove
  */
  var XYSeries = {};

  /**
    mixins for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var Values = {
    isValues: true,

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),

    setXScaleRange: function(xScale) {
      if (_.isFunction(xScale.rangeBands)) {
        xScale.rangeBands(
          [0, this.width()], 
          this.itemPadding(), 
          this.itemPadding() / 2
        );
      }
      else {
        XY.setXScaleRange.call(this, xScale);
      }
    },

    getDefaultXScale: function() {
      return helpers.createScaleFromOptions({
        type: 'ordinal',
        data: this.data(),
        key: this.xKey()
      });
    },
  };

  /**
    mixins for charts of centered key,value series data (x: index, y: value, key)

    Properties:
    - [displayAdjacent = false] {Boolean} Display series next to each other (default is stacked)
    Dependencies: Series, XY, XYSeries, Values
  */
  var ValuesSeries = {
    displayAdjacent: property('displayAdjacent', {defaultValue: false}),

    transform: function(data) {
      // Transform series data from values to x,y
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};
          item.x = valueOrDefault(item.x, item.key);

          return item;
        }, this);
      }, this);

      return data;
    },

    // determine centered-x based on series display type (adjacent or layered)
    x: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacentWidth = chart.adjacentWidth.call(this, d, i);
      var left = chart.layeredX.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * chart.seriesIndex.call(this, d, i) || 0;
    }),
    adjacentWidth: di(function(chart, d, i) {
      var seriesCount = chart.seriesCount.call(this);

      if (seriesCount > 0)
        return chart.layeredWidth.call(this, d, i) / seriesCount;
      else
        return 0;
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart.xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var rangeBand = chart.xScale().rangeBand();
      return isFinite(rangeBand) ? rangeBand : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    })
  };

  /**
    mixin for handling labels in charts
  
    - attachLabels: call during chart initialization to add labels to chart
    - labels: properties passed directly to labels chart
  */
  var XYLabels = {
    attachLabels: function() {
      var options = this.labels();
      options.parent = this;

      var Labels = d3.chart(options.type);
      var base = this.base.append('g').attr('class', 'chart-labels');
      var labels = this._labels = new Labels(base, options);

      // Proxy x and y to parent chart
      labels.x = this.x;
      labels.y = this.y;

      this.on('draw', function(data) {
        labels.options(this.labels(), {silent: true});
        labels.draw(options.data || data);
      }.bind(this));
    },

    labels: property('labels', {
      get: function(value) {
        if (_.isBoolean(value))
          value = {display: value};

        return _.defaults({}, value, {
          display: false,
          type: 'XYLabels'
        });
      }
    })
  };

  var Hover = {
    initialize: function() {
      this.on('attach', function() {
        if (this.container) {
          this.container.on('enter:mouse', this.onMouseEnter.bind(this));
          this.container.on('move:mouse', this.onMouseMove.bind(this));
          this.container.on('leave:mouse', this.onMouseLeave.bind(this));
        }
      }.bind(this));
    },

    // Override with hover implementation
    onMouseEnter: function(position) {},
    onMouseMove: function(position) {},
    onMouseLeave: function() {}
  };

  var XYHover = {
    initialize: function() {
      Hover.initialize.apply(this, arguments);
      this.on('before:draw', function() {
        // Reset points on draw
        this._points = undefined;
      });
    },

    getPoint: di(function(chart, d, i, j) {
      return {
        x: chart.x.call(this, d, i, j),
        y: chart.y.call(this, d, i, j),
        d: d, i: i, j: j
      };
    }),

    getPoints: function() {
      var data = this.data();
      if (!this._points && data) {
        if (helpers.isSeriesData(data)) {
          // Get all points for each series
          this._points = _.map(data, function(series, j) {
            return getPointsForValues.call(this, series.values, j, {_parentData: series});
          }, this);
        }
        else {
          this._points = getPointsForValues.call(this, data, 0);
        }
      }

      return this._points;

      function getPointsForValues(values, seriesIndex, element) {
        var points = _.map(values, function(d, i) {
          return this.getPoint.call(element, d, i, seriesIndex);
        }, this);

        // Sort by x
        points.sort(function(a, b) {
          return a.x - b.x;
        });

        return points;
      }
    },

    getClosestPoints: function(position) {
      var points = this.getPoints();
      var closest = [];

      if (points.length && _.isArray(points[0])) {
        // Series data
        _.each(points, function(series) {
          closest.push(sortByDistance(series, position));
        });
      }
      else {
        closest.push(sortByDistance(points, position));
      }
      
      return closest;

      function sortByDistance(values, position) {
        var byDistance = _.map(values, function(point) {
          point.distance = getDistance(point, position);
          return point;
        });

        return _.sortBy(byDistance, 'distance'); 
      }

      function getDistance(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      }
    }    
  };

  // Expose mixins
  d3.chart.mixins = _.extend(d3.chart.mixins || {}, {
    Series: Series,
    XY: XY,
    XYSeries: _.extend({}, Series, XY, XYSeries),
    Values: _.extend({}, XY, Values),
    ValuesSeries: _.extend({}, Series, XY, XYSeries, Values, ValuesSeries),
    XYLabels: XYLabels,
    Hover: Hover,
    XYHover: _.extend({}, Hover, XYHover)
  });

})(d3, _, d3.chart.helpers);
