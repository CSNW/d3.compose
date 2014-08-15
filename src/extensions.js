(function(d3, _, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

  /**
    Extensions for handling series data
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
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  /**
    Extensions for handling XY data

    Properties:
    - xScale {d3.scale}
    - yScale {d3.scale}
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
    - [invertedXY = false] {Boolean} invert x and y axes

    Notes:
      Inverted XY
      - (x, y) position is updated to properly place point in inverted space
      - To invert, change range for scale (from width to height or vice-versa) and swap x and y coordinates
  */
  var XY = {
    isXY: true,

    xScale: property('xScale', {type: 'Function', setFromOptions: false}),
    yScale: property('yScale', {type: 'Function', setFromOptions: false}),

    xMin: property('xMin', {
      get: function(value) {
        var min = this.data() && d3.extent(this.data(), this.xValue)[0];

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = this.data() && d3.extent(this.data(), this.xValue)[1];
        return valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        var min = this.data() && d3.extent(this.data(), this.yValue)[0];

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        var max = this.data() && d3.extent(this.data(), this.yValue)[1];
        return valueOrDefault(value, max);
      }
    }),

    invertedXY: property('invertedXY', {
      defaultValue: false
    }),

    initialize: function() {
      this.on('change:data', this.setScales);
      this.on('change:options', createScalesFromOptions.bind(this));

      createScalesFromOptions.call(this);

      function createScalesFromOptions() {
        if (this.options().xScale)
          this.xScale(helpers.createScaleFromOptions(this.options().xScale));
        if (this.options().yScale)
          this.yScale(helpers.createScaleFromOptions(this.options().yScale));

        this.setScales(); 
      }
    },

    x: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._yScale()(chart.yValue.call(this, d, i));
      else
        return chart._xScale()(chart.xValue.call(this, d, i));
    }),
    y: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._xScale()(chart.xValue.call(this, d, i));
      else
        return chart._yScale()(chart.yValue.call(this, d, i));
    }),
    x0: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._yScale()(0);
      else
        return chart._xScale()(0);
    }),
    y0: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._xScale()(0);
      else
        return chart._yScale()(0);
    }),

    xValue: di(function(chart, d, i) {
      return d.x;
    }),
    yValue: di(function(chart, d, i) {
      return d.y;
    }),
    keyValue: di(function(chart, d, i) {
      return !_.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i) + ',' + chart.yValue.call(this, d, i);
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
      if (this.invertedXY())
        return xScale.range([chart.height(), 0]);
      else
        return xScale.range([0, chart.width()]);
    },
    setYScaleRange: function(yScale, data, chart) {
      if (this.invertedXY())
        return yScale.range([0, chart.width()]);
      else
        return yScale.range([chart.height(), 0]);
    },

    defaultXScale: function() {
      return d3.scale.linear();
    },
    defaultYScale: function() {
      return d3.scale.linear();
    },

    // _xScale and _yScale used to differentiate between user- and internally-set values
    _xScale: property('_xScale', {type: 'Function'}),
    _yScale: property('_yScale', {type: 'Function'}),
    
    _translateCoordinatesToPoints: function(coordinates, options) {
      var points = [];
      var result = {
        distance: Infinity,
        coordinates: {
          x: 0,
          y: 0
        }
      };

      _.each(this.data(), function(point, index) {
        var calculated = this._distance(point, index, coordinates, options);

        if (calculated.distance < result.distance) {
          result.distance = calculated.distance;
          result.coordinates.x = calculated.x;
          result.coordinates.y = calculated.y;
          result.values = point;
          result.index = index;
        }
      }, this);

      if (result.distance < Infinity) {
        points.push({
          // Leave series information blank (points only)
          points: [result]
        });
      }

      return points;
    },
    _distance: function(point, index, coordinates, options) {
      var x = this.x(point, index);
      var y = this.y(point, index);

      var distance;
      if (options.measurement == 'x')
        distance = Math.abs(x - coordinates.x);
      else if (options.measurement == 'y')
        distance = Math.abs(y - coordinates.y);
      else
        distance = Math.sqrt(Math.pow(x - coordinates.x, 2) + Math.pow(y - coordinates.y, 2));

      return {
        x: x,
        y: y,
        distance: distance
      };
    }
  };

  /**
    Extensions for handling series XY data
  
    Properties:
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
    Dependencies: Series, XY
  */
  var XYSeries = {
    xMin: property('xMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMin = d3.extent(seriesValues, this.xValue)[0];
            return seriesMin < memo ? seriesMin : memo;  
          }
          else {
            return memo;
          }          
        }, Infinity, this);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMax = d3.extent(seriesValues, this.xValue)[1];
            return seriesMax > memo ? seriesMax : memo;
          }
          else {
            return memo;
          }
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMin = d3.extent(seriesValues, this.yValue)[0];
            return seriesMin < memo ? seriesMin : memo;
          }
          else {
            return memo;
          }
        }, Infinity, this);
        
        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMax = d3.extent(seriesValues, this.yValue)[1];
            return seriesMax > memo ? seriesMax : memo;
          }
          else {
            return memo;
          }
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    }),

    _translateCoordinatesToPoints: function(coordinates, options) {
      var seriesPoints = [];

      _.each(this.data(), function(series, seriesIndex) {
        var result = {
          distance: Infinity,
          coordinates: {x: 0, y: 0},
          series: {
            key: series.key,
            name: series.name,
            index: seriesIndex
          }
        };

        _.each(series.values, function(point, pointIndex) {
          var calculated = this._distance(point, pointIndex, coordinates, series, options);

          if (calculated.distance < result.distance) {
            result.distance = calculated.distance;
            result.coordinates.x = calculated.x;
            result.coordinates.y = calculated.y;
            result.values = point;
            result.index = pointIndex;
          }
        }, this);

        if (result.distance < Infinity) {
          seriesPoints.push({
            key: series.key,
            name: series.name,
            'class': series['class'],
            index: seriesIndex,
            points: [result]
          });
        }
      }, this);

      return seriesPoints;
    },
    _distance: function(point, index, coordinates, series, options) {
      var x = this.x.call({_parentData: series}, point, index);
      var y = this.y.call({_parentData: series}, point, index);

      var distance;
      if (options.measurement == 'x')
        distance = Math.abs(x - coordinates.x);
      else if (options.measurement == 'y')
        distance = Math.abs(y - coordinates.y);
      else
        distance = Math.sqrt(Math.pow(x - coordinates.x, 2) + Math.pow(y - coordinates.y, 2));

      return {
        x: x,
        y: y,
        distance: distance
      };
    }
  };

  /**
    Extensions for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var Values = {
    isValues: true,

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),

    transform: function(data) {
      // Transform series data from values to x,y
      return _.map(data, function(item, index) {
        item = _.isObject(item) ? item : {y: item};
        item.x = valueOrDefault(item.x, item.key);

        return item;
      }, this);
    },

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(this.data(), this.xValue);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

    setXScaleRange: function(xScale, data, chart) {
      if (_.isFunction(xScale.rangeBands)) {
        if (this.invertedXY())
          return xScale.rangeBands([chart.height(), 0], this.itemPadding(), this.itemPadding() / 2);
        else
          return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
      }
      else {
        return XY.setXScaleRange.call(this, xScale, data, chart);
      }
    }
  };

  /**
    Extensions for charts of centered key,value series data (x: index, y: value, key)

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
      if (chart.invertedXY())
        return XY.x.original.call(this, chart, d, i);
      else
        return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),
    y: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
      else
        return XY.y.original.call(this, chart, d, i);
    }),

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(data, function(series, index) {
        return _.map(this.seriesValues(series, index), this.xValue);
      }, this);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

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
      return chart._xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var rangeBand = chart._xScale().rangeBand();
      return isFinite(rangeBand) ? rangeBand : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    })
  };

  /**
    Extensions for handling labels in charts

    Properties:
    - [labels] {Object}
    - [labelFormat] {String|Function}
    - [labelPosition = 'top'] {String} Label position (top, right, bottom, left)
    - [labelOffset = 0] {Number|Object} Label offset (distance or {x, y})
  */
  var Labels = {
    labels: property('labels', {
      defaultValue: {},
      set: function(options) {
        if (_.isBoolean(options))
          options = {display: options};
        else if (_.isString(options))
          options = {display: options == 'display' || options == 'show'}; 
        else if (options && _.isUndefined(options.display))
          options.display = true;

        _.each(options, function(value, key) {
          // Capitalize and append "label" and then set option
          var labelOption = 'label' + helpers.capitalize(key);

          if (this[labelOption] && this[labelOption].isProperty && this[labelOption].setFromOptions)
            this[labelOption](value, {silent: true});
        }, this);
      }
    }),

    labelDisplay: property('labelDisplay', {defaultValue: false}),
    labelFormat: property('labelFormat', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),
    labelPosition: property('labelPosition', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    labelOffset: property('labelOffset', {defaultValue: 0}),
    labelPadding: property('labelPadding', {defaultValue: 2}),
    labelStyle: property('labelStyle', {defaultValue: {}}),

    labelText: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      return chart.labelFormat() ? chart.labelFormat()(value) : value;
    }),
    labelAnchor: di(function(chart, d, i) {
      var position = chart.calculatedLabelPosition.call(this, d, i);

      if (position == 'right')
        return 'start';
      else if (position == 'left')
        return 'end';
      else
        return 'middle';
    }),
    
    calculatedLabelPosition: di(function(chart, d, i) {
      return chart.labelPosition();
    }),
    calculatedLabelOffset: di(function(chart, d, i) {
      var offset = chart.labelOffset();
      if (!_.isObject(offset)) {
        offset = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: 0},
          bottom: {x: 0, y: offset},
          left: {x: -offset, y: 0}
        }[chart.calculatedLabelPosition.call(this, d, i)];

        if (!offset)
          offset = {x: 0, y: 0};
      }

      return offset;
    }),

    _getLabels: function() {
      var labels = [];

      if (this.labelDisplay()) {
        labels.push({
          // Leave series information blank (labels only)
          labels: _.map(this.data(), function(point, index) {
            return {
              key: this.keyValue(point, index),
              coordinates: {
                x: this.x(point, index),
                y: this.y(point, index)
              },
              text: this.labelText(point, index),
              offset: this.calculatedLabelOffset(point, index),
              padding: this.labelPadding(),
              anchor: this.labelAnchor(point, index),
              'class': point['class'],
              style: this.labelStyle(),
              values: point,
              index: index,
            };
          }, this)
        });
      }      

      return labels;
    },

    _convertPointToLabel: function(point) {
      return {
        key: this.keyValue(point.values, point.index),
        coordinates: point.coordinates,
        text: this.labelText(point.values, point.index),
        offset: this.calculatedLabelOffset(point.values, point.index),
        padding: this.labelPadding(),
        anchor: this.labelAnchor(point.values, point.index),
        'class': point.values['class'],
        style: this.labelStyle(),
        values: point.values,
        index: point.index
      };
    }
  };

  /**
    Extensions for handling labels in series charts

    Dependencies: Labels
  */
  var LabelsSeries = {
    _getLabels: function() {
      var seriesLabels = [];

      if (this.labelDisplay()) {
        seriesLabels = _.map(this.data(), function(series, seriesIndex) {
          return {
            key: series.key,
            name: series.name,
            'class': series['class'],
            index: seriesIndex,
            labels: _.map(series.values, function(point, pointIndex) {
              return {
                key: this.keyValue.call({_parentData: series}, point, pointIndex),
                coordinates: {
                  x: this.x.call({_parentData: series}, point, pointIndex),
                  y: this.y.call({_parentData: series}, point, pointIndex)
                },
                text: this.labelText.call({_parentData: series}, point, pointIndex),
                offset: this.calculatedLabelOffset.call({_parentData: series}, point, pointIndex),
                padding: this.labelPadding(),
                anchor: this.labelAnchor.call({_parentData: series}, point, pointIndex),
                'class': point['class'],
                style: this.labelStyle(),
                values: point,
                index: pointIndex,
              };
            }, this)
          };
        }, this);
      }
      
      return seriesLabels;
    }
  };

  // Expose extensions
  d3.chart.extensions = _.extend(d3.chart.extensions || {}, {
    Series: Series,
    XY: XY,
    XYSeries: _.extend({}, Series, XY, XYSeries),
    Values: _.extend({}, XY, Values),
    ValuesSeries: _.extend({}, Series, XY, XYSeries, Values, ValuesSeries),
    Labels: Labels,
    LabelsSeries: _.extend({}, Labels, LabelsSeries)
  });

})(d3, _, d3.chart.helpers);
