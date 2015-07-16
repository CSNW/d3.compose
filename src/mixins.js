(function(d3, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;
  var utils = helpers.utils;
  var isUndefined = utils.isUndefined;

  /**
    Mixin for handling series data

    @class Series
    @namespace mixins
  */
  var Series = {
    /**
      Get key for given series data

      @method seriesKey
      @param {Any} d Series object with `key`
      @return {Any}
    */
    seriesKey: di(function(chart, d, i) {
      return d.key;
    }),

    /**
      Get values for given series data

      @method seriesValues
      @param {Any} d Series object with `values` array
      @return {Array}
    */
    seriesValues: di(function(chart, d, i) {
      // Store seriesIndex on series
      d.seriesIndex = i;
      return d.values;
    }),

    /**
      Get class for given series data

      @method seriesClass
      @param {Any} d
      @param {Number} i
      @return {String}
    */
    seriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + i + (d['class'] ? ' ' + d['class'] : '');
    }),

    /**
      Get index for given data-point of series

      @method seriesIndex
      @param {Any} d
      @param {Number} i
    */
    seriesIndex: di(function(chart, d, i) {
      var series = chart.seriesData.call(this, d, i);
      return series && series.seriesIndex || 0;
    }),

    /**
      Get parent series data for given data-point

      @method seriesData
      @return {Any}
    */
    seriesData: di(function(chart, d, i) {
      return helpers.getParentData(this);
    }),

    /**
      (di) Get style given series data or data-point
      (Uses "style" object on `d`, if defined)

      @method itemStyle
      @param {Any} d
      @param {Number} [i]
      @param {Number} [j]
      @return {String}
    */
    itemStyle: di(function(chart, d, i) {
      return helpers.style(d.style) || null;
    }),

    /**
      Get series count for chart

      @method seriesCount
      @return {Number}
    */
    seriesCount: function() {
      var data = this.data();
      return (data && helpers.isSeriesData(data)) ? data.length : 1;
    },

    /**
      Extension of layer() that handles data-binding and layering for series data.

      - Updates `dataBind` method to access underlying series values
      - Creates group layer for each series in chart
      - Should be used just like layer()

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(mixins.Series, {
        initialize: function() {
          this.seriesLayer('Circles', this.base, {
            // Create group for each series on this.base
            // and calls the following for each series item
            // (entire layer is called twice: series-1 and series-2)

            dataBind: function(data) {
              // 1. data = [1, 2, 3]
              // 2. data = [4, 5, 6]
            },
            insert: function() {
              // Same as chart.layer
              // (where "this" is series group layer)
            },
            events: {
              // Same as chart.layer
            }
          });
        }
      }));

      // ...

      chart.draw([
        {key: 'series-1', values: [1, 2, 3]},
        {key: 'series-2', values: [4, 5, 6]}
      ]);
      ```
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

    // Ensure data is in series form
    transform: function(data) {
      return !helpers.isSeriesData(data) ? [{values: data}] : data;
    }
  };

  /**
    Mixin for handling XY data

    @class XY
    @namespace mixins
  */
  var XY = {
    initialize: function() {
      // Set scale ranges once chart is ready to be rendered
      this.on('before:draw', this.setScales.bind(this));
    },

    transform: function(data) {
      data = data || [];

      // Transform series data from values to x,y
      if (helpers.isSeriesData(data)) {
        data = data.map(function(series) {
          return utils.extend({}, series, {
            values: series.values.map(normalizeData)
          });
        });
      }
      else if (Array.isArray(data)) {
        data = data.map(normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        if (!utils.isObject(point))
          point = {x: index, y: point};
        else if (!Array.isArray(point) && utils.isUndefined(point.x))
          point.x = index;

        return point;
      }
    },

    /**
      Get/set x-scale with `d3.scale` or with object (uses `helpers.createScale`)

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
      Get/set yscale with `d3.scale` or with object (uses `helpers.createScale`)

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
      Key on data object for x-value

      @property xKey
      @type String
      @default 'x'
    */
    xKey: property('xKey', {
      default_value: 'x'
    }),

    /**
      Key on data object for y-value

      @property yKey
      @type String
      @default 'y'
    */
    yKey: property('yKey', {
      default_value: 'y'
    }),

    /**
      Get scaled x-value for given data-point

      @method x
      @param {Any} d
      @param {Number} i
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
      @param {Any} d
      @param {Number} i
      @return {Number}
    */
    y: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

      return parseFloat(chart.yScale()(value, series_index));
    }),

    /**
      Get key for data-point. Looks for "key" on `d` first, otherwise uses x-value.

      @method key
      @param {Any} d
      @param {Number} i
      @return {Any}
    */
    key: di(function(chart, d, i) {
      return valueOrDefault(d.key, chart.xValue.call(this, d, i));
    }),

    /**
      Get scaled `x = 0` value

      @method x0
      @return {Number}
    */
    x0: function() {
      return parseFloat(this.xScale()(0));
    },

    /**
      Get scaled `y = 0` value

      @method x0
      @return {Number}
    */
    y0: function() {
      return parseFloat(this.yScale()(0));
    },

    /**
      Get x-value for data-point. Checks for `xKey()` on `d` first, otherwise uses `d[0]`.

      @example
      ```js
      xValue({x: 10, y: 20}); // -> 10
      xValue([10, 20]); // -> 10
      ```
      @method xValue
      @param {Any} d
      @return {Any}
    */
    xValue: di(function(chart, d, i) {
      var key = chart.xKey();
      if (d)
        return key in d ? d[key] : d[0];
    }),

    /**
      Get y-value for data-point. Checks for `yKey()` on `d` first, otherwise uses `d[1]`.

      @example
      ```js
      yValue({x: 10, y: 20}); // -> 20
      yValue([10, 20]); // -> 20
      ```
      @method yValue
      @param {Any} d
      @return {Any}
    */
    yValue: di(function(chart, d, i) {
      var key = chart.yKey();
      if (d)
        return key in d ? d[key] : d[1];
    }),

    /**
      Set x- and y-scale ranges (using `setXScaleRange` and `setYScaleRange`)

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
      Get default x-scale: `{data: this.data(), key: 'x'}`

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
      Get default y-scale: `{data: this.data(), key: 'y'}`

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
    Mixin for charts of centered key,value data (x: index, y: value, key)

    @class XYValues
    @namespace mixins
    @extends XY
  */
  var XYValues = utils.extend({}, XY, {
    /**
      Determine width of data-point when displayed adjacent

      @method adjacentWidth
      @return {Number}
    */
    adjacentWidth: function() {
      var series_count = this.seriesCount ? this.seriesCount() : 1;
      return this.layeredWidth() / series_count;
    },

    /**
      Determine layered width (width of group for adjacent)

      @method layeredWidth
      @return {Number}
    */
    layeredWidth: function() {
      var range_band = this.xScale() && this.xScale().rangeBand && this.xScale().rangeBand();
      var width = isFinite(range_band) ? range_band : 0;
      
      return width;
    },

    /**
      Determine item width based on series display type (adjacent or layered)

      @method itemWidth
      @return {Number}
    */
    itemWidth: function() {
      var scale = this.xScale();
      return scale && scale.width ? scale.width() : this.layeredWidth();
    },

    // Override default x-scale to use ordinal type
    /**
      Override default x-scale to use ordinal type: `{type: 'ordinal', data: this.data(), key: 'y', centered: true}`

      @method getDefaultYScale
      @return {d3.scale}
    */
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
    Mixin for inverting XY calculations with x vertical, increasing bottom-to-top and y horizontal, increasing left-to-right

    @class InvertedXY
    @namespace mixins
  */
  var InvertedXY = {
    /**
      Get x-value for plotting (scaled y-value)

      @method x
      @param {Any} d
      @param {Number} i
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
      @param {Any} d
      @param {Number} i
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
      Set range (0, width) for given y-scale

      @method setYScaleRange
      @param {d3.scale} y_scale
    */
    setYScaleRange: function(y_scale) {
      y_scale.range([0, this.width()]);
    }
  };

  /**
    Mixin for handling labels in charts

    @class Labels
    @namespace mixins
  */
  var Labels = {
    /**
      Call during chart initialization to add labels to chart

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(Labels, {
        initialize: function() {
          // this.layer()...

          // Attach labels layer
          this.attachLabels();
        }
      }));
      ```
      @method attachLabels
    */
    attachLabels: function() {
      var options = this.labels();
      options.parent = this;

      var Labels = d3.chart(options.type);
      var base = this.base.append('g').attr('class', 'chart-labels');
      var labels = this._labels = new Labels(base, options);

      // Proxy x and y to parent chart
      this.proxyLabelMethods.forEach(function(method) {
        labels[method] = this[method];
      }, this);

      this.on('draw', function(data) {
        options = this.labels();
        options.parent = this;
        
        labels.options(options);

        if (options.display !== false)
          labels.draw(options.data || data);
        else
          labels.draw([]);
      }.bind(this));
    },

    /**
      Options passed to labels chart

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(Labels, {
        // ...
      }));

      // ...

      chart.labels(true); // -> display labels with defaults
      chart.labels(false); // -> hide labels
      chart.labels({offset: 10}); // -> pass options to labels chart

      d3.select('#chart')
        .chart('Compose', function(data) {
          return {
            charts: {
              custom: {labels: {offset: 10}}
            }
          };
        });
      ```
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
    Mixin for handling labels in XY charts
    (proxies `x` and `y` to properly place labels for XY charts)

    @class XYLabels
    @namespace mixins
    @extends Labels
  */
  var XYLabels = utils.extend({}, Labels, {
    proxyLabelMethods: ['x', 'y']
  });

  /**
    Mixin for handling common hover behavior that adds standard `onMouseEnter`, `onMouseMove`, and `onMouseLeave` handlers
    and `getPoint` helper for adding helpful meta information to raw data point.

    @class Hover
    @namespace mixins
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
      @param {Any} d
      @param {Number} i
      @param {Number} j
      @return {key, series, d, meta {chart, i, j, x, y}}
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

      @example
      ```js
      d3.chart('Chart').extend('Bars', helpers.mixin(Hover, {
        initialize: function() {
          this.layer('bars', this.base, {
            // dataBind...
            insert: function() {
              // Want to trigger enter/leave point
              // when mouse enter/leaves bar (rect)
              var chart = this.chart();
              return this.append('rect')
                .on('mouseenter', chart.mouseEnterPoint)
                .on('mouseleave', chart.mouseLeavePoint);
            }
            // events...
          })
        }
      }));
      ```
      @method mouseEnterPoint
      @param {Any} d
      @param {Number} i
      @param {Number} j
    */
    mouseEnterPoint: di(function(chart, d, i, j) {
      chart.container.trigger('mouseenter:point', chart.getPoint.call(this, d, i, j));
    }),

    /**
      Call to trigger mouseleave:point when mouse leaves data-point

      @example
      ```js
      d3.chart('Chart').extend('Bars', helpers.mixin(Hover, {
        initialize: function() {
          this.layer('bars', this.base, {
            // dataBind...
            insert: function() {
              // Want to trigger enter/leave point
              // when mouse enter/leaves bar (rect)
              var chart = this.chart();
              return this.append('rect')
                .on('mouseenter', chart.mouseEnterPoint)
                .on('mouseleave', chart.mouseLeavePoint);
            }
            // events...
          })
        }
      }));
      ```
      @method mouseleavePoint
      @param {Any} d
      @param {Number} i
      @param {Number} j
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

  /**
    Mixin for automatically triggering "mouseenter:point"/"mouseleave:point" for chart data points that are within given `hoverTolerance`.

    @class HoverPoints
    @namespace mixins
  */
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
      Hover tolerance (in px) for calculating close points

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

      return data.map(function(series, j) {
        return series.values.map(function(d, i) {
          return chart.getPoint.call({_parent_data: series}, d, i, j);
        }).sort(function(a, b) {
          // Sort by x
          return a.meta.x - b.meta.x;
        });
      });
    }
  }

  function getClosestPoints(points, position, tolerance) {
    return utils.compact(points.map(function(series) {
      function distance(point) {
        point.distance = getDistance(point.meta, position);
        return point;
      }
      function close(point) {
        return point.distance < tolerance;
      }

      var by_distance = utils.sortBy(series.map(distance).filter(close), 'distance');

      return by_distance[0];
    }));

    function getDistance(a, b) {
      return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }
  }

  function updateActive(active, closest, container) {
    var active_keys = utils.pluck(active, 'key');
    var closest_keys = utils.pluck(closest, 'key');

    utils.eachObject(closest, function(point) {
      if (utils.contains(active_keys, point.key))
        container.trigger('mousemove:point', point);
      else
        container.trigger('mouseenter:point', point);
    });
    utils.eachObject(active, function(point) {
      if (!utils.contains(closest_keys, point.key))
        container.trigger('mouseleave:point', point);
    });
  }

  /**
    Mixin for handling common transition behaviors

    @class Transition
    @namespace mixins
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
      @default d3 default: 'cubic-in-out'
    */
    ease: property('ease', {type: 'Function'}),

    /**
      Setup delay, duration, and ease for transition

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(Transition, {
        initialize: function() {
          this.layer('circles', this.base, {
            // ...
            events: {
              'merge:transition': function() {
                // Set delay, duration, and ease from properties
                this.chart().setupTransition(this);
              }
            }
          });
        }
      }));
      ```
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
    Mixin to create standard layer to make extending charts straightforward.

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
      initialize: function() {
        this.standardLayer('main', this.base.append('g'))
        // dataBind, insert, events are defined on prototype
      },

      onDataBind: function(selection, data) {
        // ...
      },
      onInsert: function(selection) {
        // ...
      },
      onEnter: function(selection) {
        // ...
      },
      onUpdateTransition: function(selection) {
        // ...
      },
      // all d3.chart events are available: onMerge, onExit, ...
    }));
    ```
    @class StandardLayer
    @namespace mixins
  */
  var StandardLayer = {
    /**
      extension of `layer()` that uses standard methods on prototype for extensibility.

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
        initialize: function() {
          this.standardLayer('circles', this.base.append('g'));
        }

        // onDataBind, onInsert, etc. work with "circles" layer
      }));
      ```
      @method standardLayer
      @param {String} name
      @param {d3.selection} selection
    */
    standardLayer: function standardLayer(name, selection) {
      return createLayer(this, 'layer', name, selection);
    },

    /**
      extension of `seriesLayer()` that uses standard methods on prototype for extensibility.

      @example
      ```js
      d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
        initialize: function() {
          this.standardSeriesLayer('circles', this.base.append('g'));
        },

        // onDataBind, onInsert, etc. work with "circles" seriesLayer
      }));
      ```
      @method standardSeriesLayer
      @param {String} name
      @param {d3.selection} selection
    */
    standardSeriesLayer: function standardSeriesLayer(name, selection) {
      return createLayer(this, 'series', name, selection);
    },

    /**
      Called for standard layer's `dataBind`

      @method onDataBind
      @param {d3.selection} selection
      @param {Any} data
      @return {d3.selection}
    */
    onDataBind: function onDataBind(selection, data) {},

    /**
      Called for standard layer's `insert`

      @method onInsert
      @param {d3.selection} selection
      @return {d3.selection}
    */
    onInsert: function onInsert(selection) {},

    /**
      Call for standard layer's `events['enter']`

      @method onEnter
      @param {d3.selection}
    */
    onEnter: function onEnter(selection) {},

    /**
      Call for standard layer's `events['enter:transition']`

      @method onEnterTransition
      @param {d3.selection}
    */
    // onEnterTransition: function onEnterTransition(selection) {},

    /**
      Call for standard layer's `events['update']`

      @method onUpdate
      @param {d3.selection}
    */
    onUpdate: function onUpdate(selection) {},

    /**
      Call for standard layer's `events['update']`

      @method onUpdateTransition
      @param {d3.selection}
    */
    // onUpdateTransition: function onUpdateTransition(selection) {},

    /**
      Call for standard layer's `events['merge']`

      @method onMerge
      @param {d3.selection}
    */
    onMerge: function onMerge(selection) {},

    /**
      Call for standard layer's `events['merge:transition']`

      @method onMergeTransition
      @param {d3.selection}
    */
    // onMergeTransition: function onMergeTransition(selection) {},

    /**
      Call for standard layer's `events['exit']`

      @method onExit
      @param {d3.selection}
    */
    onExit: function onExit(selection) {},

    /**
      Call for standard layer's `events['exit:transition']`

      @method onExitTransition
      @param {d3.selection}
    */
    // onExitTransition: function onExitTransition(selection) {},
  };

  function createLayer(chart, type, name, selection) {
    var layer = {
      layer: 'layer',
      series: 'seriesLayer'
    }[type];

    if (layer && chart[layer]) {
      var events = {};
      [
        'enter',
        'enter:transition',
        'update',
        'update:transition',
        'merge',
        'merge:transition',
        'exit',
        'exit:transition'
      ].forEach(function(event) {
        var method = 'on' + event.split(':').map(function capitalize(str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }).join('');

        // Only create events if chart method exists as empty transition events can cause unforeseen issues
        if (chart[method]) {
          events[event] = function() {
            this.chart()[method](this);
          };
        }
      });

      return chart[layer](name, selection, {
        dataBind: function(data) {
          return this.chart().onDataBind(this, data);
        },
        insert: function() {
          return this.chart().onInsert(this);
        },
        events: events
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
