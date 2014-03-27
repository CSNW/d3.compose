(function(d3, _, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;
  
  // Extensions
  // ----------------------------------------------------------- //
  var extensions = d3.chart.extensions = {};

  // Extensions for handling series data
  extensions.Series = {
    seriesKey: di(function(chart, d, i) {
      return d.key;
    }),
    seriesValues: di(function(chart, d, i) {
      // Store seriesIndex on series
      d.seriesIndex = i;
      return d.values;
    }),
    seriesClass: di(function(chart, d, i) {
      return 'series index-' + i + (d['class'] ? ' ' + d['class'] : '');
    }),
    seriesIndex: di(function(chart, d, i) {
      var data = helpers.getParentData(this);
      return data && data.seriesIndex || 0;
    }),
    seriesCount: di(function(chart, d, i) {
      return chart.data() ? chart.data().length : 1;
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
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  /**
    Extensions for handling XY data
  */
  extensions.XY = {
    initialize: function() {
      this.on('change:data', this.setScales);

      if (this.options.xScale)
        this.xScale(helpers.createScaleFromOptions(this.options.xScale));
      if (this.options.yScale)
        this.yScale(helpers.createScaleFromOptions(this.options.yScale));
    },

    x: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i));
    }),
    y: di(function(chart, d, i) {
      return chart._yScale()(chart.yValue.call(this, d, i));
    }),
    x0: di(function(chart, d, i) {
      return chart._xScale()(0);
    }),
    y0: di(function(chart, d, i) {
      return chart._yScale()(0);
    }),

    xValue: di(function(chart, d, i) {
      return d.x;
    }),
    yValue: di(function(chart, d, i) {
      return d.y;
    }),
    keyValue: di(function(chart, d, i) {
      return d.key;
    }),

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

        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.xValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return valueOrDefault(value, max);
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
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.yValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    })
  };

  /**
    Extensions for charts of centered key,value data (x: index, y: value, key)
  */
  extensions.Values = {
    isValues: true,
    transform: function(data) {
      // Transform series data from values to x,y
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};

          return {
            x: valueOrDefault(item.x, item.key),
            y: item.y,
            key: item.key
          };
        }, this);
      }, this);

      return data;
    },

    x: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this);
    }),

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(data, function(series, index) {
        return _.map(this.seriesValues(series, index), this.xValue);
      }, this);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

    setXScaleRange: function(xScale, data, chart) {
      return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
    },

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacentWidth = chart.adjacentWidth.call(this, d, i);
      var left = chart.x.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * chart.seriesIndex.call(this, d, i);
    }),
    adjacentWidth: di(function(chart, d, i) {
      return chart.layeredWidth.call(this, d, i) / chart.seriesCount.call(this);
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart.x.call(this, d, i);
    }),
    layeredWidth: di(function(chart, d, i) {
      return chart._xScale().rangeBand();
    }),

    // itemX/Width determine centered-x and width based on series display type (adjacent or layered)
    itemX: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    }),

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),
    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  };

})(d3, _, d3.chart.helpers);
