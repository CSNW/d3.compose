(function(d3, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;
  var isUndefined = helpers.utils.isUndefined;

  /**
    mixins for handling series data

    @module Series
  */
  var Series = {
    /**
      Get key for given series data

      @method seriesKey
    */
    seriesKey: di(function(chart, d, i) {
      return d.key;
    }),

    /**
      Get values for given series data

      @method seriesValues
    */
    seriesValues: di(function(chart, d, i) {
      // Store seriesIndex on series
      d.seriesIndex = i;
      return d.values;
    }),

    /**
      Get class for given series data

      @method seriesClass
    */
    seriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + i + (d['class'] ? ' ' + d['class'] : '');
    }),

    /**
      Get index for given data-point of series

      @method seriesIndex
    */
    seriesIndex: di(function(chart, d, i) {
      var series = chart.seriesData.call(this, d, i);
      return series && series.seriesIndex || 0;
    }),

    /**
      Get parent series data for given data-point

      @method seriesData
    */
    seriesData: di(function(chart, d, i) {
      return helpers.getParentData(this);
    }),

    /**
      Get style given series data or data-point
      (Uses "style" object on `d`, if defined)

      @method itemStyle
      @return {String}
    */
    itemStyle: di(function(chart, d, i) {
      return helpers.style(d.style) || null;
    }),

    /**
      extension of layer()
      - updates dataBind method to access underlying series values
      - handles appending series groups to chart
      -> should be used just like layer() would be used without series

      @method seriesLayer
      @param {String} name
      @param {Selection} selection
      @param {Object} options (`dataBind` and `insert` required)
      @return {d3.chart.layer}
    */
    seriesLayer: function(name, selection, options) {
      if (options && options.dataBind) {
        var dataBind = options.dataBind;

        options.dataBind = function(data) {
          var chart = this.chart();
          var series = this.selectAll('g')
            .data(data, chart.seriesKey);

          series.enter()
            .append('g');

          series
            .attr('class', chart.seriesClass)
            .attr('style', chart.itemStyle);

          series.exit()
            .remove();

          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }

      return d3.chart().prototype.layer.call(this, name, selection, options);
    },

    /**
      Get series count

      @method seriesCount
    */
    seriesCount: function() {
      var data = this.data();
      return (data && helpers.isSeriesData(data)) ? data.length : 1;
    },

    // Ensure data is in series form
    transform: function(data) {
      return !helpers.isSeriesData(data) ? [{values: data}] : data;
    }
  };

  /**
    mixins for handling XY data

    @module XY
  */
  var XY = {
    initialize: function() {
      // Set scale ranges once chart is ready to be rendered
      this.on('before:draw', this.setScales.bind(this));
    },

    transform: function(data) {
      // Transform series data from values to x,y
      if (helpers.isSeriesData(data)) {
        data = utils.map(data, function(series) {
          return utils.extend({}, series, {
            values: utils.map(series.values, normalizeData)
          });
        });
      }
      else {
        data = utils.map(data, normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        if (!utils.isObject(point))
          point = {x: index, y: point};
        else if (!utils.isArray(point) && utils.isUndefined(point.x))
          point.x = index;

        return point;
      }
    },

    /**
      Get/set x-scale with d3.scale or with object (uses helpers.createScale)

      @property xScale
      @type Object|d3.scale
    */
    xScale: property('xScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);
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

    /**
      Get/set yscale with d3.scale or with object (uses helpers.createScale)

      @property xScale
      @type Object|d3.scale
    */
    yScale: property('yScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);
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

    /**
      Get scaled x-value for given data-point

      @method x
      @return {Number}
    */
    x: di(function(chart, d, i) {
      var value = chart.xValue.call(this, d, i);
      var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

      return parseFloat(chart.xScale()(value, series_index));
    }),

    /**
      Get scaled y-value for given data-point

      @method y
      @return {Number}
    */
    y: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

      return parseFloat(chart.yScale()(value, series_index));
    }),

    /**
      Get key for data-point

      @method key
      @return {Any}
    */
    key: di(function(chart, d, i) {
      return valueOrDefault(d.key, chart.xValue.call(this, d, i));
    }),

    /**
      Get scaled x = 0 value

      @method x0
      @return {Number}
    */
    x0: function() {
      return parseFloat(this.xScale()(0));
    },

    /**
      Get scaled y = 0 value

      @method x0
      @return {Number}
    */
    y0: function() {
      return parseFloat(this.yScale()(0));
    },

    /**
      Get x-value for data-point

      @method xValue
      @return {Any}
    */
    xValue: di(function(chart, d, i) {
      if (d)
        return 'x' in d ? d.x : d[0];
    }),

    /**
      Get y-value for data-point

      @method yValue
      @return {Any}
    */
    yValue: di(function(chart, d, i) {
      if (d)
        return 'y' in d ? d.y : d[1];
    }),

    /**
      Set x- and y- scale ranges

      @method setScales
    */
    setScales: function() {
      this.setXScaleRange(this.xScale());
      this.setYScaleRange(this.yScale());
    },

    /**
      Set range (0, width) for given x-scale

      @method setXScaleRange
      @param {d3.scale} x_scale
    */
    setXScaleRange: function(x_scale) {
      x_scale.range([0, this.width()]);
    },

    /**
      Set range(height, 0) for given y-scale

      @method setYScaleRange
      @param {d3.scale} y_scale
    */
    setYScaleRange: function(y_scale) {
      y_scale.range([this.height(), 0]);
    },

    /**
      Get default x-scale

      @method getDefaultXScale
      @return {d3.scale}
    */
    getDefaultXScale: function() {
      return helpers.createScale({
        data: this.data(),
        key: 'x'
      });
    },

    /**
      Get default y-scale

      @method getDefaultYScale
      @return {d3.scale}
    */
    getDefaultYScale: function() {
      return helpers.createScale({
        data: this.data(),
        key: 'y'
      });
    }
  };

  /**
    mixins for charts of centered key,value data (x: index, y: value, key)

    @module XYValues
  */
  var XYValues = utils.extend({}, XY, {
    /**
      Determine width of data-point when displayed adjacent

      @method adjacentWidth
    */
    adjacentWidth: function() {
      var series_count = this.seriesCount ? this.seriesCount() : 1;
      return this.layeredWidth() / series_count;
    },

    /**
      Determine layered width (width of group for adjacent)

      @method layeredWidth
    */
    layeredWidth: function() {
      var range_band = this.xScale() && this.xScale().rangeBand && this.xScale().rangeBand();
      var width = isFinite(range_band) ? range_band : 0;
      
      return width;
    },

    /**
      Determine item width based on series display type (adjacent or layered)

      @method itemWidth
    */
    itemWidth: function() {
      var scale = this.xScale();
      return scale && scale.width ? scale.width() : this.layeredWidth();
    },

    // Override default x-scale to use ordinal type
    getDefaultXScale: function() {
      return helpers.createScale({
        type: 'ordinal',
        data: this.data(),
        key: 'x',
        centered: true
      });
    }
  });
  
  /**
    mixins for inverting XY calculations with x vertical, increasing bottom-to-top and y horizontal, increasing left-to-right

    @module InvertedXY
  */
  var InvertedXY = {
    /**
      Get x-value for plotting (scaled y-value)

      @method x
      @return {Number}
    */
    x: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

      return parseFloat(chart.yScale()(value, series_index));
    }),

    /**
      Get y-value for plotting (scaled x-value)

      @method y
      @return {Number}
    */
    y: di(function(chart, d, i) {
      var value = chart.xValue.call(this, d, i);
      var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

      return parseFloat(chart.xScale()(value, series_index));
    }),

    /**
      Get scaled y = 0 value (along x-axis)

      @method x0
      @return {Number}
    */
    x0: function() {
      return parseFloat(this.yScale()(0));
    },

    /**
      Get scaled x = 0 value (along y-axis)

      @method x0
      @return {Number}
    */
    y0: function() {
      return parseFloat(this.xScale()(0));
    },

    /**
      Set range (height, 0) for given x-scale

      @method setXScaleRange
      @param {d3.scale} x_scale
    */
    setXScaleRange: function(x_scale) {
      x_scale.range([this.height(), 0]);
    },

    /**
      Set range(0, width) for given y-scale

      @method setYScaleRange
      @param {d3.scale} y_scale
    */
    setYScaleRange: function(y_scale) {
      y_scale.range([0, this.width()]);
    }
  };

  /**
    mixin for handling labels in charts

    @module Labels
  */
  var Labels = {
    /**
      Call during chart initialization to add labels to chart

      @method attachLabels
    */
    attachLabels: function() {
      var options = this.labels();
      options.parent = this;

      var Labels = d3.chart(options.type);
      var base = this.base.append('g').attr('class', 'chart-labels');
      var labels = this._labels = new Labels(base, options);

      // Proxy x and y to parent chart
      utils.each(this.proxyLabelMethods, function(method) {
        labels[method] = this[method];
      }, this);

      this.on('draw', function(data) {
        options = this.labels();
        labels.options(options);

        if (options.display !== false)
          labels.draw(options.data || data);
        else
          labels.draw([]);
      }.bind(this));
    },

    /**
      Options passed to labels chart

      @property labels
      @type Object
    */
    labels: property('labels', {
      get: function(value) {
        if (utils.isBoolean(value))
          value = {display: value};
        else if (!value)
          value = {display: false};

        return utils.defaults({}, value, {
          type: 'Labels'
        });
      }
    }),

    // Array of methods to proxy on labels chart
    proxyLabelMethods: []
  };

  /**
    mixin for handling labels in XY charts

    @module XYLabels
  */
  var XYLabels = utils.extend({}, Labels, {
    proxyLabelMethods: ['x', 'y']
  });

  /**
    mixin for handling common hover behavior

    @module Hover
  */
  var Hover = {
    initialize: function() {
      this.on('attach', function() {
        this.container.on('mouseenter', this.onMouseEnter.bind(this));
        this.container.on('mousemove', this.onMouseMove.bind(this));
        this.container.on('mouseleave', this.onMouseLeave.bind(this));
      }.bind(this));
    },

    /**
      Get point information for given data-point

      @method getPoint
      @return {key, series, d, i, j}
    */
    getPoint: di(function(chart, d, i, j) {
      var key = chart.key && chart.key.call(this, d, i, j);
      var series = chart.seriesData && chart.seriesData.call(this, d, i, j) || {};

      return {
        key: (series.key || j) + '.' + (key || i),
        series: series,
        d: d,
        meta: {
          chart: chart,
          i: i,
          j: j,
          x: chart.x && chart.x.call(this, d, i, j),
          y: chart.y && chart.y.call(this, d, i, j)
        }
      };
    }),

    /**
      Call to trigger mouseenter:point when mouse enters data-point

      @method mouseEnterPoint
    */
    mouseEnterPoint: di(function(chart, d, i, j) {
      chart.container.trigger('mouseenter:point', chart.getPoint.call(this, d, i, j));
    }),

    /**
      Call to trigger mouseleave:point when mouse leaves data-point

      @method mouseleavePoint
    */
    mouseLeavePoint: di(function(chart, d, i, j) {
      chart.container.trigger('mouseleave:point', chart.getPoint.call(this, d, i, j));
    }),

    /**
      (Override) Called when mouse enters container

      @method onMouseEnter
      @param {Object} position (chart and container {x,y} position of mouse)
        @param {Object} position.chart {x, y} position relative to chart origin
        @param {Object} position.container {x, y} position relative to container origin
    */
    onMouseEnter: function(position) {},

    /**
      (Override) Called when mouse moves within container

      @method onMouseMove
      @param {Object} position (chart and container {x,y} position of mouse)
        @param {Object} position.chart {x, y} position relative to chart origin
        @param {Object} position.container {x, y} position relative to container origin
    */
    onMouseMove: function(position) {},

    /**
      (Override) Called when mouse leaves container

      @method onMouseLeave
    */
    onMouseLeave: function() {}
  };

  var HoverPoints = {
    initialize: function() {
      var points, tolerance, active;

      this.on('draw', function() {
        // Clear cache on draw
        points = null;
      });

      this.on('attach', function() {
        this.container.on('mouseenter', function(position) {
          if (!points)
            points = getPoints(this, this.data());

          tolerance = this.hoverTolerance();
          update(position);
        }.bind(this));

        this.container.on('mousemove', update);
        this.container.on('mouseleave', update);
      }.bind(this));

      var update = function update(position) {
        var closest = [];
        if (position)
          closest = getClosestPoints(points, position.chart, tolerance);

        updateActive(active, closest, this.container);
        active = closest;
      }.bind(this);
    },

    /**
      Hover tolerance for calculating close points

      @property hoverTolerance
      @type Number
      @default 20
    */
    hoverTolerance: property('hoverTolerance', {
      default_value: 20
    })
  };

  function getPoints(chart, data) {
    if (data) {
      if (!helpers.isSeriesData(data))
        data = [{values: data}];

      return utils.map(data, function(series, j) {
        return utils.map(series.values, function(d, i) {
          return chart.getPoint.call({_parent_data: series}, d, i, j);
        }).sort(function(a, b) {
          // Sort by x
          return a.meta.x - b.meta.x;
        });
      });
    }
  }

  function getClosestPoints(points, position, tolerance) {
    return utils.compact(utils.map(points, function(series) {
      var by_distance = utils.chain(series)
        .map(function(point) {
          point.distance = getDistance(point.meta, position);
          return point;
        })
        .filter(function(point) {
          return point.distance < tolerance;
        })
        .sortBy('distance')
        .value();

      return by_distance[0];
    }));

    function getDistance(a, b) {
      return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }
  }

  function updateActive(active, closest, container) {
    var active_keys = utils.pluck(active, 'key');
    var closest_keys = utils.pluck(closest, 'key');

    utils.each(closest, function(point) {
      if (utils.contains(active_keys, point.key))
        container.trigger('mousemove:point', point);
      else
        container.trigger('mouseenter:point', point);
    });
    utils.each(active, function(point) {
      if (!utils.contains(closest_keys, point.key))
        container.trigger('mouseleave:point', point);
    });
  }

  /**
    mixin for handling common transition behaviors

    @module Transition
  */
  var Transition = {
    /**
      Delay start of transition by specified milliseconds.

      @property delay
      @type Number|Function
      @default d3 default: 0
    */
    delay: property('delay', {type: 'Function'}),

    /**
      Transition duration in milliseconds.

      @property duration
      @type Number|Function
      @default d3 default: 250ms
    */
    duration: property('duration', {type: 'Function'}),

    /**
      Transition ease function
      
      - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
      - Note: arguments to pass to `d3.ease` are not supported

      @property ease
      @type String|Function
      @default `d3.ease` default: 'cubic-in-out'
    */
    ease: property('ease', {type: 'Function'}),

    /**
      Setup delay, duration, and ease for transition

      @method setupTransition
      @param {d3.selection} selection
    */
    setupTransition: function setupTransition(selection) {
      var delay = this.delay();
      var duration = this.duration();
      var ease = this.ease();

      if (!isUndefined(delay))
        selection.delay(delay);
      if (!isUndefined(duration))
        selection.duration(duration);
      if (!isUndefined(ease))
        selection.ease(ease);
    }
  };

  /**
    mixin for create standard layer for extension

    @module StandardLayer
  */
  var StandardLayer = {
    /**
      extension of `layer()` that uses standard methods on prototype for extensibility.

      @method standardLayer
      @param {String} name
      @param {d3.selection} selection
    */
    standardLayer: function standardLayer(name, selection) {
      return createLayer(this, 'layer', name, selection);
    },

    /**
      extension of `seriesLayer()` that uses standard methods on prototype for extensibility.

      @method standardSeriesLayer
      @param {String} name
      @param {d3.selection} selection
    */
    standardSeriesLayer: function standardSeriesLayer(name, selection) {
      return createLayer(this, 'series', name, selection);
    },

    onDataBind: function onDataBind() {},
    onInsert: function onInsert() {},
    onEnter: function onEnter() {},
    onEnterTransition: function onEnterTransition() {},
    onUpdate: function onUpdate() {},
    onUpdateTransition: function onUpdateTransition() {},
    onMerge: function onMerge() {},
    onMergeTransition: function onMergeTransition() {},
    onExit: function onExit() {},
    onExitTransition: function onExitTransition() {},
  };

  function createLayer(chart, type, name, selection) {
    var layer = {
      layer: 'layer',
      series: 'seriesLayer'
    }[type];

    if (layer && chart[layer]) {
      return chart[layer](name, selection, {
        dataBind: function(data) {
          return this.chart().onDataBind(this, data);
        },
        insert: function() {
          return this.chart().onInsert(this);
        },
        events: {
          'enter': function() {
            this.chart().onEnter(this);
          },
          'enter:transition': function() {
            this.chart().onEnterTransition(this);
          },
          'update': function() {
            this.chart().onUpdate(this);
          },
          'update:transition': function() {
            this.chart().onUpdateTransition(this);
          },
          'merge': function() {
            this.chart().onMerge(this);
          },
          'merge:transition': function() {
            this.chart().onMergeTransition(this);
          },
          'exit': function() {
            this.chart().onExit(this);
          },
          'exit:transition': function() {
            this.chart().onExitTransition(this);
          }
        }
      });
    }
  }

  // Expose mixins
  d3.compose = d3.compose || {};
  d3.compose.mixins = utils.extend(d3.compose.mixins || {}, {
    Series: Series,
    XY: XY,
    XYValues: XYValues,
    InvertedXY: InvertedXY,
    Labels: Labels,
    XYLabels: XYLabels,
    Hover: Hover,
    HoverPoints: HoverPoints,
    Transition: Transition,
    StandardLayer: StandardLayer
  });

})(d3, d3.compose.helpers);
