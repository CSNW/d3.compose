/*! d3.chart.multi - v0.9.1
 * https://github.com/CSNW/d3.chart.multi
 * License: MIT
 */
(function(d3, _) {

  /**
    Setup global z-index values
  */
  var z_index = {
    component: 50,
    axis: 51,
    title: 52,
    chart: 100,
    labels: 150,
    legend: 200
  };

  /**
    Property helper

    @example
    ```javascript
    var obj = {};

    // Create property that's stored internally as 'simple'
    obj.simple = property('simple');

    // set
    obj.simple('Howdy');

    // get
    console.log(obj.simple()); // -> 'Howdy'
    
    // Advanced
    // --------
    // Default values:
    obj.advanced = property('advanced', {
      default_value: 'Howdy!'
    });
  
    console.log(obj.advanced()); // -> 'Howdy!'
    obj.advanced('Goodbye');
    console.log(obj.advanced()); // -> 'Goodbye'

    // Set to undefined to reset to default value
    obj.advanced(undefined);
    console.log(obj.advanced()); // -> 'Howdy!'

    // Custom getter:
    obj.advanced = property('advanced', {
      get: function(value) {
        // Value is the underlying set value
        return value + '!';
      }
    });

    obj.advanced('Howdy');
    console.log(obj.advanced()); // -> 'Howdy!'

    // Custom setter:
    obj.advanced = property('advanced', {
      set: function(value, previous) {
        if (value == 'Hate') {
          // To override value, return obj with override specified
          return {
            override: 'Love',

            // To do something after override, use after callback
            after: function() {
              console.log('After: ' + this.advanced()); // -> 'After: Love'
            }
          };
        }
      }

      obj.advanced('Hate'); // -> 'After: Love'
      console.log(obj.advanced()); // -> 'Love'
    });
    ```

    @param {String} name of stored property
    @param {Object} options
    - default_value: default value for property (when set value is undefined)
    - get: function(value) {return ...} getter, where value is the stored value, return desired value
    - set: function(value, previous) {return {override, after}} 
      - return override to set stored value and after() to run after set
    - type: {String} ['Function']
      - 'Object' gets object extensions: extend({...})
      - 'Array' gets array extensions: push(...)
      - 'Function' don't evaluate in get/set
    - context: {Object} [this] context to evaluate get/set/after functions
    - prop_key: {String} ['__properties'] underlying key on object to store properties on

    @return {Function}
    - (): get
    - (value): set
  */ 
  function property(name, options) {
    options = options || {};
    var prop_key = options.prop_key || '__properties';

    var getSet = function(value) {
      var properties = this[prop_key] = this[prop_key] || {};
      var existing = properties[name];
      var context = valueOrDefault(getSet.context, this);
      
      if (arguments.length)
        return set.call(this, value);
      else
        return get.call(this);

      function get() {
        var value = valueOrDefault(properties[name], getSet.default_value);

        // Unwrap value if its type is not a function
        if (_.isFunction(value) && options.type != 'Function')
          value = value.call(this);

        return _.isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set(value) {
        // Validate
        if (_.isFunction(options.validate) && !options.validate.call(this, value))
          throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

        getSet.previous = properties[name];
        properties[name] = value;

        if (_.isFunction(options.set)) {
          var response = options.set.call(context, value, getSet.previous);
          
          if (response && _.has(response, 'override'))
            properties[name] = response.override;
          if (response && _.isFunction(response.after))
            response.after.call(context, properties[name]);
        }

        var changed = !_.isEqual(properties[name], getSet.previous);
        if (changed && _.isFunction(this.trigger)) {
          this.trigger('change:' + name, properties[name]);
          this.trigger('change', name, properties[name]);
        }

        return this;
      }
    };

    // For checking if function is a property
    getSet.is_property = true;
    getSet.set_from_options = valueOrDefault(options.set_from_options, true);
    getSet.default_value = options.default_value;
    getSet.context = options.context;

    return getSet;
  }

  /**
    If value isn't undefined, return value, otherwise use default_value
  
    @param {Varies} [value]
    @param {Varies} default_value
    @return {Varies}
  */
  function valueOrDefault(value, default_value) {
    return !_.isUndefined(value) ? value : default_value;
  }

  /**
    Dimensions
    Helper for robustly determining width/height of given selector

    @param {d3 Selection} selection
    @return {Object} {width, height}
  */
  function dimensions(selection) {
    var element = selection && selection.length && selection[0] && selection[0].length && selection[0][0];
    var is_SVG = element ? element.nodeName == 'svg' : false;

    // 1. Get width/height set via css (only valid for svg and some other elements)
    var client = {
      width: element && element.clientWidth, 
      height: element && element.clientHeight
    };

    // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
    //        calculate from css
    //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
    //        Note: This makes assumptions about the box model in use and that width/height are not percent values
    if (is_SVG && (!element.clientWidth || !element.clientHeight) && typeof window !== 'undefined' && window.getComputedStyle) {
      var styles = window.getComputedStyle(element);
      client.height = parseFloat(styles.height) - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth);
      client.width = parseFloat(styles.width) - parseFloat(styles.borderLeftWidth) - parseFloat(styles.borderRightWidth);
    }

    if (client.width && client.height)
      return client;

    // 2. Get width/height set via attribute
    var attr = {
      width: selection && selection.attr && parseFloat(selection.attr('width')),
      height: selection && selection.attr && parseFloat(selection.attr('height'))
    };
    
    if (is_SVG) {
      return {
        width: client.width != null ? client.width : attr.width || 0,
        height: client.height != null ? client.height : attr.height || 0
      };
    }
    else {
      // Firefox throws error when calling getBBox when svg hasn't been displayed
      // ignore error and set to empty
      var bbox = {width: 0, height: 0};
      try {
        bbox = element && typeof element.getBBox == 'function' && element.getBBox();
      }
      catch(ex) {}

      // Size set by css -> client (only valid for svg and some other elements)
      // Size set by svg -> attr override or bounding_box
      // -> Take maximum
      return {
        width: _.max([client.width, attr.width || bbox.width]) || 0,
        height: _.max([client.height, attr.height || bbox.height]) || 0
      };
    }
  }

  /**
    Translate by (x, y) distance
    
    @example
    ```javascript
    transform.translate(10, 15) == 'translate(10, 15)'
    transform.translate({x: 10, y: 15}) == 'translate(10, 15)'
    ```

    @param {Number|Object} [x] value or object with x and y
    @param {Number} [y]
    @return {String}
  */
  function translate(x, y) {
    if (_.isObject(x)) {
      y = x.y;
      x = x.x;
    }
      
    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
  }

  /**
    Rotate by degrees, with optional center

    @param {Number} degrees
    @param {Object} [center = {x: 0, y: 0}]
    @return {String}
  */
  function rotate(degrees, center) {
    var rotation = 'rotate(' + (degrees || 0);
    if (center)
      rotation += ' ' + (center.x || 0) + ',' + (center.y || 0);

    return rotation += ')';
  }

  /**
    Determine if given data is likely series data
  */
  function isSeriesData(data) {
    var first = _.first(data);
    return first && _.isObject(first) && _.isArray(first.values);
  }

  /**
    Get max for array/series by value di
  */
  function max(data, getValue) {
    var getMax = function(data) {
      return data && d3.extent(data, getValue)[1];
    };

    if (isSeriesData(data)) {
      return _.reduce(data, function(memo, series, index) {
        if (series && _.isArray(series.values)) {
          var series_max = getMax(series.values);
          return series_max > memo ? series_max : memo;
        }
        else {
          return memo;
        }
      }, -Infinity);
    }
    else {
      return getMax(data);
    }
  }

  /**
    Get min for array/series by value di
  */
  function min(data, getValue) {
    var getMin = function(data) {
      return data && d3.extent(data, getValue)[0];
    };

    if (isSeriesData(data)) {
      return _.reduce(data, function(memo, series, index) {
        if (series && _.isArray(series.values)) {
          var series_min = getMin(series.values);
          return series_min < memo ? series_min : memo;
        }
        else {
          return memo;
        }
      }, Infinity);
    }
    else {
      return getMin(data);
    }
  }

  /**
    Create scale from options
    
    @example
    ```javascript
    // Simple type, range, and domain
    var scale = createScaleFromOptions({
      type: 'linear', 
      domain: [0, 100], 
      range: [0, 500]
    });

    // Scale is passed through
    var original = d3.scale.linear();
    var scale = createScaleFromOptions(original);
    scale === original;

    // Set other properties by passing in "arguments" array
    var scale = createScaleFromOptions({
      type: 'ordinal',
      domain: ['a', 'b', 'c', 'd', 'e'],
      rangeRoundBands: [[0, 100], 0.1, 0.05]
    });
    ```

    @param {Object|function} options
    - (passing in function returns original function with no changes)
    - type: {String} Any available d3 scale (linear, ordinal, log, etc.) or time
    - domain: {Array} Domain for scale
    - range: {Array} Range for scale
    - ...: {Arguments Array} Set any other scale properties by passing in "arguments" array
    @return {d3.scale}
  */
  function createScaleFromOptions(options) {
    options = options || {};

    // If function, scale was passed in as options
    if (_.isFunction(options))
      return options;

    // Create scale (using d3.time.scale() if type is 'time')
    var scale;
    if (options.type && options.type == 'time')
      scale = d3.time.scale();
    else if (options.type && d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    _.each(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through type, data, or key)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (key != 'type' && key != 'data' && key != 'key')
          scale[key].apply(scale, value);  
      }
    });

    if (!options.domain && options.data && options.key) {
      var getValue = function(d, i) {
        return d[options.key];
      };

      if (options.type == 'ordinal') {
        // Extract unique values from series
        var getValues = function(data) {
          return _.map(data, getValue);
        };

        var all_values;
        if (isSeriesData(options.data)) {
          all_values = _.flatten(_.map(options.data, function(series) {
            if (series && _.isArray(series.values)) {
              return getValues(series.values);
            }
          }));
        }
        else {
          all_values = getValues(options.data);
        }

        scale.domain(_.uniq(all_values));
      }
      else {
        // By default, domain starts at 0 unless min is less than 0
        var min_value = min(options.data, getValue);

        scale.domain([
          min_value < 0 ? min_value : 0, 
          max(options.data, getValue)
        ]);
      }      
    }

    return scale;
  }

  /**
    Convert key,values to style string

    @example
    style({color: 'red', display: 'block'}) -> color: red; display: block;

    @param {Object} styles
    @return {String}
  */
  function style(styles) {
    if (!styles)
      return '';

    styles = _.map(styles, function(value, key) {
      return key + ': ' + value;
    });
    styles = styles.join('; ');

    return styles ? styles + ';' : '';
  }

  /**
    Create wrapped (d, i) function that adds chart instance as first argument
    Wrapped function uses standard d3 arguments and context
  
    Note: in order to pass proper context to di-functions called within di-function
          use `.call(this, d, i)` (where "this" is d3 context)

    @example
    ```javascript
    Chart.prototype.x = helpers.di(function(chart, d, i) {
      // "this" is traditional d3 context: node
      return chart._xScale()(chart.xValue.call(this, d, i));
    });
  
    // In order for chart to be specified, bind to chart
    chart.x = helpers.bindDi(chart.x, chart);
    // or
    helpers.bindAllDi(chart);

    this.select('point').attr('cx', chart.x);
    // (d, i) and "this" used from d3, "chart" injected automatically
    ```

    @param {Function} callback with (chart, d, i) arguments
    @return {Function}
  */
  function di(callback) {
    // Create intermediate wrapping in case it's called without binding
    var wrapped = function wrapped(d, i, j) {
      return callback.call(this, undefined, d, i, j);
    };
    wrapped._is_di = true;
    wrapped.original = callback;

    return wrapped;
  }

  function bindDi(di, chart) {
    return function wrapped(d, i, j) {
      return (di.original || di).call(this, chart, d, i, j);
    };
  }

  // Bind all di-functions found in chart
  function bindAllDi(chart) {
    for (var key in chart) {
      if (chart[key] && chart[key]._is_di)
        chart[key] = bindDi(chart[key], chart);
    }
  }


  /**
    Get parent data for element

    @param {Element} element
    @return {Varies}
  */
  function getParentData(element) {
    // @internal Shortcut if element + parentData needs to be mocked
    if (element._parent_data)
      return element._parent_data;

    var parent = element && element.parentNode;
    if (parent) {
      var data = d3.select(parent).data();
      return data && data[0];
    }
  }

  /**
    Mixin mixins into prototype

    Designed specifically to work with d3-chart
    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last  

    @param {Array or Object...} mixins Array of mixins or separate extension arguments
    @return {Object}
  */
  function mixin(mixins) {
    mixins = _.isArray(mixins) ? mixins : _.toArray(arguments);
    var mixed = _.extend.apply(this, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = _.toArray(arguments);

        _.each(mixins, function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return _.reduceRight(mixins, function(data, extension) {
          if (extension && extension.transform)
            return extension.transform.call(this, data);
          else
            return data;
        }, data, this);
      };
    }
    
    return mixed;
  }

  // Add helpers to d3.chart (static)
  d3.chart.helpers = _.extend({}, d3.chart.helpers, {
    z_index: z_index,
    property: property,
    valueOrDefault: valueOrDefault,
    dimensions: dimensions,
    translate: translate,
    rotate: rotate,
    isSeriesData: isSeriesData,
    max: max,
    min: min,
    createScaleFromOptions: createScaleFromOptions,
    style: style,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    getParentData: getParentData,
    mixin: mixin
  });
})(d3, _);
(function(d3, _, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

  /**
    mixins for handling series data
  */
  var Series = {
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

    xKey: property('xKey', {default_value: 'x'}),
    yKey: property('yKey', {default_value: 'y'}),

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

    setXScaleRange: function(x_scale) {
      x_scale.range([0, this.width()]);
    },
    setYScaleRange: function(y_scale) {
      y_scale.range([this.height(), 0]);
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
    mixins for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var XYValues = _.extend({}, XY, {
    transform: function(data) {
      // Transform series data from values to x,y
      if (helpers.isSeriesData(data)) {
        _.each(data, function(series) {
          series.values = _.map(series.values, normalizeData);
        }, this);
      }
      else {
        data = _.map(data, normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        point = _.isObject(point) ? point : {y: point};
        point.x = valueOrDefault(point.x, point.key);

        return point;
      }
    },

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {default_value: 0.1}),

    // If series data, display points at same index for different series adjacent
    displayAdjacent: property('displayAdjacent', {default_value: false}),

    // determine centered-x based on series display type (adjacent or layered)
    x: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacent_width = chart.adjacentWidth.call(this, d, i);
      var left = chart.layeredX.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacent_width / 2;
      var series_index = chart.seriesIndex ? chart.seriesIndex.call(this, d, i) : 1;
      
      return left + adjacent_width * series_index;
    }),
    adjacentWidth: di(function(chart, d, i) {
      var series_count = chart.seriesCount ? chart.seriesCount.call(this) : 1;

      if (series_count > 0)
        return chart.layeredWidth.call(this, d, i) / series_count;
      else
        return 0;
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart.xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var range_band = chart.xScale().rangeBand();
      return isFinite(range_band) ? range_band : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    }),

    setXScaleRange: function(x_scale) {
      if (_.isFunction(x_scale.rangeBands)) {
        x_scale.rangeBands(
          [0, this.width()], 
          this.itemPadding(), 
          this.itemPadding() / 2
        );
      }
      else {
        XY.setXScaleRange.call(this, x_scale);
      }
    },

    getDefaultXScale: function() {
      return helpers.createScaleFromOptions({
        type: 'ordinal',
        data: this.data(),
        key: this.xKey()
      });
    }
  });

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
        labels.options(this.labels());
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

  var XYHover = _.extend({}, Hover, {
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
            return getPointsForValues.call(this, series.values, j, {_parent_data: series});
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
  });

  // Expose mixins
  d3.chart.mixins = _.extend(d3.chart.mixins || {}, {
    Series: Series,
    XY: XY,
    XYValues: XYValues,
    XYLabels: XYLabels,
    Hover: Hover,
    XYHover: XYHover
  });

})(d3, _, d3.chart.helpers);

(function(d3, _, helpers) {
  var property = helpers.property;
  
  /**
    Base
    Shared functionality between all charts, components, and containers

    Properties:
    - data
    - options
    - style
  */
  d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    /**
      Store fully-transformed data

      @param {Object|Array} value
    */
    data: property('data'),

    /**
      General options for chart/component

      @param {Object} value
    */
    options: property('options', {
      default_value: {},
      set: function(options) {
        _.each(options, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }
    }),

    /**
      General style for chart/component

      @param {Object} value
    */
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),
    

    /**
      Get width/height of base
    */
    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    /**
      Base is last transform to be called,
      so stored data has been fully transformed
    */
    transform: function(data) {
      data = data || [];

      this.data(data);
      return data;
    },

    /**
      Add events to draw: before:draw and draw
    */
    draw: function(data) {
      this.trigger('before:draw', data);
      d3.chart().prototype.draw.apply(this, arguments);
      this.trigger('draw', data);
    }
  });

})(d3, _, d3.chart.helpers);

(function(d3, helpers) {
  
  /**
    Chart
    Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: helpers.z_index.chart
  });

})(d3, d3.chart.helpers);

(function(d3, _, helpers) {
  var property = helpers.property;

  /**
    Container
    Foundation for chart and component placement

    Properties:
    - {Object/Array} rawData
    - {Object} margins {top, right, bottom, left} in px
    - {Number} width in px
    - {Number} height in px
  */
  d3.chart('Base').extend('Container', {
    initialize: function(options) {
      this.charts_by_id = {};
      this.components_by_id = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.options(options || {});
      this.base.classed('chart-container', true);
      this.attachHoverListeners();
    },

    /**
      Store raw data for container before it has been transformed

      @param {Object|Array} value
    */
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @param {Object} value {top, right, bottom, left}
    */
    margins: property('margins', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: _.defaults({}, values, {
            top: 0, 
            right: 0, 
            bottom: 0, 
            left: 0
          })
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: function() {
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: this._width(),
          height: this._height()
        };
      },
      set: function(values) {
        return {
          override: _.defaults({}, values, {
            top: 0, 
            right: 0, 
            bottom: 0, 
            left: 0,
            width: this._width() - values.right - values.left,
            height: this._height() - values.bottom - values.top
          })
        };
      }
    }),

    /**
      Get/set overall width/height of Container
    */
    width: property('width'),
    height: property('height'),

    draw: function(data) {
      // Explicitly set width and height of container if width/height > 0
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Pre-draw for accurate dimensions for layout
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    /**
      Redraw with existing data
    */
    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - z_index
    */
    chartLayer: function(options) {
      options = _.defaults({}, options, {
        z_index: helpers.z_index.chart
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      Get component layer

      @param {Object} options
      - z_index
    */
    componentLayer: function(options) {
      options = _.defaults({}, options, {
        z_index: helpers.z_index.component
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    attachChart: function(id, chart) {
      this._attach(id, chart);
      this.charts_by_id[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.charts_by_id[id];
      if (!chart) return;

      this._detach(id, chart);
      delete this.charts_by_id[id];
    },

    attachComponent: function(id, component) {
      this._attach(id, component);
      this.components_by_id[id] = component;
    },

    detachComponent: function(id) {
      var component = this.components_by_id[id];
      if (!component) return;

      this._detach(id, component);
      delete this.components_by_id[id];
    },

    _width: function() {
      return helpers.valueOrDefault(this.width(), d3.chart('Base').prototype.width.call(this));
    },
    _height: function() {
      return helpers.valueOrDefault(this.height(), d3.chart('Base').prototype.height.call(this));
    },

    /**
      Layout components and charts
    */
    layout: function(data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      var layout = this._extractLayout(data);

      // 3. Set chart position from layout
      var chart_position = _.extend({}, this.margins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this._positionLayers(layout);
    },

    attachHoverListeners: function() {
      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var inside, chart_position;
      
      var throttledMouseMove = _.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 50);

      this.base.on('mouseenter', function() {
        inside = true;
        chart_position = chartPosition();
        trigger('enter:mouse', translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('leave:mouse');
      });

      function translateToXY(coordinates, chart_position) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chart_x = x - chart_position.left;
        var chart_y = y - chart_position.top;
        
        // Set at chart bounds if outside of chart
        if (x > (chart_position.left + chart_position.width))
          chart_x = chart_position.left + chart_position.width;
        else if (x < chart_position.left)
          chart_x = 0;

        if (y > (chart_position.top + chart_position.height))
          chart_y = chart_position.top + chart_position.height;
        else if (y < chart_position.top)
          chart_y = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chart_x, y: chart_y}
        };
      }
    },

    _attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      this.attach(id, item);

      if (item && _.isFunction(item.trigger))
        item.trigger('attach');
    },

    _detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && _.isFunction(item.trigger))
        item.trigger('detach');
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      
      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart = this.chartPosition();
      var width = this._width();
      var height = this._height();
      
      _.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});
        
        return y;
      }, chart.top);

      _.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      _.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      _.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

      function setLayout(component, x, y, options) {
        if (component && _.isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
    },

    _positionByZIndex: function() {
      // Get layers
      var elements = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      elements = _.sortBy(elements, function(element) {
        return parseInt(d3.select(element).attr('data-zIndex')) || 0;
      });

      // Move layers to z-index order
      _.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Extract layout from components
    _extractLayout: function(data) {
      var overall_layout = {top: [], right: [], bottom: [], left: []};
      _.each(this.components_by_id, function(component) {
        if (component.skip_layout)
          return;

        var layout = component.getLayout(data);
        var position = layout && layout.position;

        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overall_layout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      });
      
      return overall_layout;
    }
  });

})(d3, _, d3.chart.helpers);

(function(d3, _, helpers) {
  var property = helpers.property;
  
  /**
    Component
    Common component functionality / base for creating components

    Properties
    - {String} [position = top] (top, right, bottom, left)
    - {Number} [width = base width]
    - {Number} [height = base height]
    - {Object} [margins] % margins relative to component dimensions
      - top {Number} % of height
      - right {Number} % of width
      - bottom {Number} % of height
      - left {Number} % of width

    Customization
    - skip_layout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
    initialize: function(options) {
      this.options(options || {});
    },

    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    width: property('width', {
      default_value: function() {
        return helpers.dimensions(this.base).width;
      }
    }),
    height: property('height', {
      default_value: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    margins: property('margins', {
      get: function(values) {
        var percentages = _.defaults({}, values, {top: 0.0, right: 0.0, bottom: 0.0, left: 0.0});
        var width = this.width();
        var height = this.height();

        return {
          top: percentages.top * height,
          right: percentages.right * width,
          bottom: percentages.bottom * height,
          left: percentages.left * width
        };
      }
    }),

    /**
      Height/width/position to use in layout calculations
      (Override for more specific sizing in layout calculations)

      - skip_layout: Skip component during layout calculations and positioning
      - prepareLayout: perform any layout preparation required (default is draw)
      - getLayout: return position, width, and height for layout
      - setLayout: use x, y, and options {height, width} for layout
    */
    skip_layout: false,

    prepareLayout: function(data) {
      // Note: By default, components are double-drawn
      //       this may cause issues with transitions
      //       override prepareLayout to adjust this behavior
      this.draw(data);
    },

    getLayout: function(data) {
      this.prepareLayout(data);
      
      var margins = this.margins();
      return {
        position: this.position(),
        width: this.width() + margins.left + margins.right,
        height: this.height() + margins.top + margins.bottom
      };
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      var margins = this.margins();
      this.base.attr('transform', helpers.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  });

})(d3, _, d3.chart.helpers);

(function(d3, _, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels

    Options:
    - format
    - position (top, right, bottom, left)
    - offset ({x: ..., y: ...})
    - padding
    - anchor (start, middle, end)
    - alignment (top, middle, bottom)
  */
  d3.chart('Chart').extend('XYLabels', mixin(mixins.Series, mixins.XY, mixins.XYHover, {
    initialize: function() {
      // Proxy attach to parent for hover
      var parent = this.options().parent;
      if (parent) {
        parent.on('attach', function() {
          this.container = parent.container;
          this.trigger('attach');
        }.bind(this));
      }

      this.seriesLayer('Labels', this.base, {
        dataBind: function(data) {
          return this.selectAll('g')
            .data(data, this.chart().keyValue);
        },
        insert: function() {
          var chart = this.chart();

          var labels = this.append('g')
            .attr('class', chart.labelClass)
            .call(chart.insertLabels);

          return labels;
        },
        events: {
          'merge': function() {
            this.chart().mergeLabels(this);
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (chart.delay && chart.delay())
              this.delay(chart.delay());
            if (chart.duration && chart.duration())
              this.duration(chart.duration());
            if (chart.ease && chart.ease())
              this.ease(chart.ease());

            // Position labels
            chart.transitionLabels(this);
          }
        }
      });
    },

    transform: function(data) {
      if (!helpers.isSeriesData(data))
        data = [{key: 'labels', name: 'Labels', values: data}];

      // TODO Use ticks / domain from xScale
      // ticks = scale.ticks ? scale.ticks.apply(scale, [10]) : scale.domain()
      return data;
    },

    format: property('format', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),

    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    offset: property('offset', {
      default_value: {x: 0, y: 0},
      set: function(offset) {
        if (_.isNumber(offset)) {
          offset = {
            top: {x: 0, y: -offset},
            right: {x: offset, y: 0},
            bottom: {x: 0, y: offset},
            left: {x: -offset, y: 0}
          }[this.position()];

          if (!offset)
            offset = {x: 0, y: 0};

          return {
            override: offset
          };
        }
      }
    }),

    padding: property('padding', {default_value: 2}),

    anchor: property('anchor', {
      default_value: function() {
        return {
          'top': 'middle',
          'right': 'start',
          'bottom': 'middle',
          'left': 'end'
        }[this.position()];
      },
      validate: function(value) {
        return _.contains(['start', 'middle', 'end'], value);
      }
    }),

    alignment: property('labelAlignment', {
      default_value: function() {
        return {
          'top': 'bottom',
          'right': 'middle',
          'bottom': 'top',
          'left': 'middle'
        }[this.position()];
      },
      validate: function(value) {
        return _.contains(['top', 'middle', 'bottom'], value);
      }
    }),

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    labelText: di(function(chart, d, i) {
      var value = helpers.valueOrDefault(d.label, chart.yValue.call(this, d, i));
      var format = chart.format();

      return format ? format(value) : value;
    }),

    labelClass: di(function(chart, d, i) {
      return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
    }),

    insertLabels: function(selection) {
      selection.append('rect')
        .attr('class', 'chart-label-bg');
      selection.append('text')
        .attr('class', 'chart-label-text');
    },

    mergeLabels: function(selection) {
      var chart = this;
      
      selection.selectAll('text')
        .text(this.labelText);

      // Calculate layout
      var labels = [];
      var options = {
        offset: chart.offset(),
        padding: chart.padding(),
        anchor: chart.anchor(),
        alignment: chart.alignment()
      };
      selection.each(function(d, i, j) {
        if (!labels[j])
          labels[j] = [];

        // Store values for label and calculate layout
        var label = prepareLabel(chart, this, d, i , j);
        labels[j].push(label);

        calculateLayout(chart, options, label);
      });

      // Collision detection
      handleCollisions(chart, labels);

      // Layout labels
      _.each(labels, function(series) {
        _.each(series, function(label) {
          setLayout(chart, label);
        });
      });
    },

    transitionLabels: function(selection) {
      selection.attr('opacity', 1);
    },

    onMouseEnter: function(position) {
      var points = this.getClosestPoints(position.chart);

      this.removeHighlight();
      _.each(points, function(series) {
        if (series && series.length) {
          var closest = series[0];
        
          if (closest.distance < 50)
            this.highlightLabel(closest); 
        }
      }, this);
    },
    onMouseMove: function(position) {
      var points = this.getClosestPoints(position.chart);

      this.removeHighlight();
      _.each(points, function(series) {
        if (series && series.length) {
          var closest = series[0];
        
          if (closest.distance < 50)
            this.highlightLabel(closest);
        }
      }, this);
    },
    onMouseLeave: function() {
      this.removeHighlight();
    },

    highlightLabel: function(point) {
      var label = this.base.selectAll('g.chart-series')
        .selectAll('g')[point.j][point.i];

      if (label)
        d3.select(label).classed('highlight', true);
    },
    removeHighlight: function() {
      this.base
        .selectAll('g')
        .selectAll('g')
        .classed('highlight', false);
    }
  }), {
    z_index: helpers.z_index.labels
  });

  function prepareLabel(chart, element, d, i, j) {
    var selection = d3.select(element);
    var text = selection.select('text');
    var bg = selection.select('rect');

    return {
      x: chart.x.call(element, d, i),
      y: chart.y.call(element, d, i),
      element: element,
      selection: selection,
      text: {
        element: text.node(),
        selection: text
      },
      bg: {
        element: bg.node(),
        selection: bg
      }
    };
  }

  function calculateLayout(chart, options, label) {
    var text_bounds = label.text.element.getBBox();

    // Need to adjust text for line-height
    var text_y_adjustment = 0;
    try {
      var style = window.getComputedStyle(label.text.element);
      text_y_adjustment = -(parseInt(style['line-height']) - parseInt(style['font-size'])) / 2;
    }
    catch (ex) {}

    // Position background
    var layout = label.bg.layout = {
      x: options.offset.x,
      y: options.offset.y,
      width: text_bounds.width + 2*options.padding,
      height: text_bounds.height + 2*options.padding
    };

    // Set width / height of label
    label.width = layout.width;
    label.height = layout.height;

    if (options.anchor == 'end')
      layout.x -= layout.width;
    else if (options.anchor == 'middle')
      layout.x -= (layout.width / 2);

    if (options.alignment == 'bottom')
      layout.y -= layout.height;
    else if (options.alignment == 'middle')
      layout.y -= (layout.height / 2);

    // Center text in background
    label.text.layout = {
      x: layout.x + (layout.width / 2) - (text_bounds.width / 2),
      y: layout.y + (layout.height / 2) - (text_bounds.height / 2) + text_bounds.height + text_y_adjustment
    };
  }

  function handleCollisions(chart, labels) {
    _.each(labels, function(series, seriesIndex) {
      // Check through remaining series for collisions
      _.each(labels.slice(seriesIndex + 1), function(compareSeries) {
        _.each(compareSeries, function(compareLabel) {
          _.each(series, function(label) {
            if (checkForOverlap(label, compareLabel))
              groupLabels(label, compareLabel);
          });
        });
      });
    });

    function checkForOverlap(labelA, labelB) {
      var a = getEdges(labelA);
      var b = getEdges(labelB);

      var contained_LR = (b.left < a.left && b.right > a.right);
      var contained_TB = (b.bottom < a.bottom && b.top > a.top);
      var overlap_LR = (b.left >= a.left && b.left < a.right) || (b.right > a.left && b.right <= a.right) || contained_LR;
      var overlap_TB = (b.top >= a.top && b.top < a.bottom) || (b.bottom > a.top && b.bottom <= a.bottom) || contained_TB;

      return overlap_LR && overlap_TB;

      function getEdges(label) {
        return {
          left: label.x,
          right: label.x + label.width,
          top: label.y,
          bottom: label.y + label.height
        };
      }
    }

    function groupLabels(labelA, labelB) {
      if (labelA.group && labelB.group) {
        // Move labelB group labels into labelA group
        _.each(labelB.group.labels, function(label) {
          labelA.group.labels.push(label);
          label.group = labelA.group;
        });

        updateGroupPositions(labelA.group);
      }
      else if (labelA.group) {
        addLabelToGroup(labelB, labelA.group);
      }
      else if (labelB.group) {
        addLabelToGroup(labelA, labelB.group);
      }
      else {
        var group = {labels: []};
        addLabelToGroup(labelA, group);
        addLabelToGroup(labelB, group);
      }
    }

    function addLabelToGroup(label, group) {
      group.labels.push(label);
      label.group = group;
      label.originalY = label.y;

      updateGroupPositions(group);
    }

    function updateGroupPositions(group) {
      var byY = _.chain(group.labels)
        .each(function(label) {
          // Reset to original y
          label.y = label.originalY;
        })
        .sortBy(function(label) {
          return label.y;
        })
        .reverse()
        .value();

      _.each(byY, function(label, index) {
        var prev = _.first(byY, index);
        var overlap;

        for (var i = prev.length - 1; i >= 0; i--) {
          if (checkForOverlap(label, prev[i])) {
            overlap = prev[i];
            break;
          }
        }

        if (overlap)
          label.y = overlap.y - label.height;
      });
    }
  }

  function setLayout(chart, label) {
    label.bg.selection
      .attr('transform', helpers.translate(label.bg.layout.x, label.bg.layout.y))
      .attr('width', label.bg.layout.width)
      .attr('height', label.bg.layout.height);

    label.text.selection
      .attr('transform', helpers.translate(label.text.layout.x, label.text.layout.y));

    // Position label and set opacity to fade-in
    label.selection
      .attr('transform', helpers.translate(label.x, label.y))
      .attr('opacity', 0);
  }

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('Chart').extend('Bars', mixin(mixins.Series, mixins.XYValues, mixins.XYLabels, {
    initialize: function() {
      this.seriesLayer('Bars', this.base.append('g').classed('chart-bars', true), {
        dataBind: function(data) {
          var chart = this.chart();

          return this.selectAll('rect')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('rect')
            .attr('class', chart.barClass)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();

            this
              .attr('y', chart.y0)
              .attr('height', 0);  
          },
          'merge': function() {
            var chart = this.chart();

            this
              .attr('x', chart.barX)
              .attr('width', chart.itemWidth);
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (chart.delay())
              this.delay(chart.delay());
            if (chart.duration())
              this.duration(chart.duration());
            if (chart.ease())
              this.ease(chart.ease());

            this
              .attr('y', chart.barY)
              .attr('height', chart.barHeight);
          },
          'exit': function() {
            this.remove();
          }
        }
      });

      this.attachLabels();
    },
    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    displayAdjacent: property('displayAdjacent', {default_value: true}),

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i)) - chart.barOffset(); 
      return height > 0 ? height : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      return y < y0 ? y : y0 + chart.barOffset();
    }),
    barClass: di(function(chart, d, i) {
      return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
    }),

    barOffset: function barOffset() {
      if (!this.__axis) {
        this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.x"] .domain');
      }
      if (!this.__axis) {
        return 0;
      }

      var axisThickness = this.__axis[0][0] && parseInt(this.__axis.style('stroke-width')) || 0;
      return axisThickness / 2;
    },

    insertSwatch: function() {
      return this.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', 20).attr('height', 20)
        .attr('class', 'chart-bar');
    }
  }));
  
  /**
    Stacked Bars
  */
  d3.chart('Bars').extend('StackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
    },

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return height > 0 ? height - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      // Only handle positive y-values
      if (y > y0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || y0;
      var new_position = previous - (y0 - y);

      chart.bar_positions[i] = new_position;
      
      return new_position;
    }),

    displayAdjacent: property('displayAdjacent', {default_value: false})
  });

})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Line
    (x,y) line graph
  */
  d3.chart('Chart').extend('Line', mixin(mixins.Series, mixins.XY, mixins.XYLabels, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var lines = chart.lines = [];

          // Add lines based on underlying series data
          _.each(chart.data(), function(series, index) {
            lines[index] = chart.createLine(series);
          });

          // Rather than use provided series data
          return this.selectAll('path')
            .data(function(d, i) {
              return [chart.data()[i]];
            }, chart.seriesKey);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('path')
            .classed('chart-line', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();
            var lines = chart.lines;

            if (chart.delay())
              this.delay(chart.delay());
            if (chart.duration())
              this.duration(chart.duration());
            if (chart.ease())
              this.ease(chart.ease());

            this
              .attr('d', function(d, i) {
                return lines[chart.seriesIndex.call(this, d, i)](chart.seriesValues.call(this, d, i));
              })
              .attr('style', chart.itemStyle);
          }
        }
      });

      this.attachLabels();
    },
    
    interpolate: property('interpolate'),

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    createLine: function(series) {
      var line = d3.svg.line()
        .x(this.x)
        .y(this.y);

      var interpolate = series.interpolate || this.interpolate();
      if (interpolate)
        line.interpolate(interpolate);

      return line;
    },
    insertSwatch: function() {
      return this.append('line')
        .attr('x1', 0).attr('y1', 10)
        .attr('x2', 20).attr('y2', 10)
        .attr('class', 'chart-line');
    }
  }));
  
  /**
    LineValues
    Line graph for centered key,value data
  */
  d3.chart('Line').extend('LineValues', mixins.XYValues);

})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

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
              .attr('text-anchor', 'middle')
              .attr('class', chart.options()['class'])
              .text(chart.text());
          }
        }
      });
    },

    text: property('text', {
      get: function() {
        return this.options().text;
      }
    }),
    rotation: property('rotation', {
      default_value: function() {
        var rotate_by_position = {
          right: 90,
          left: -90
        };

        return rotate_by_position[this.position()] || 0;
      }
    }),

    transformation: function() {
      var translate = helpers.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.rotate(this.rotation());

      return translate + ' ' + rotate;
    },
  }, {
    z_index: helpers.z_index.title
  });
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
      Note: for x0 and y0, both x and y scales are required,
            so use `xScale` and `yScale` rather than `scale`
    - {x, y} [translation] of axis relative to chart bounds
    - {String} [orient = bottom] top, right, bottom, left
    - {String} [orientation = horizontal] horizontal, vertical

    Available d3 Axis mixins:
    - ticks
    - tickValues
    - tickSize
    - innerTickSize
    - outerTickSize
    - tickPadding
    - tickFormat
  */
  d3.chart('Component').extend('Axis', mixin(mixins.XY, {
    initialize: function() {
      // Create two axes (so that layout and transitions work)
      // 1. Display and transitions
      // 2. Layout (draw to get width, but separate so that transitions aren't affected)
      this.axis = d3.svg.axis();
      this._layout_axis = d3.svg.axis();

      this.axis_base = this.base.append('g').attr('class', 'chart-axis');
      this._layout_base = this.base.append('g')
        .attr('class', 'chart-axis chart-layout')
        .attr('style', 'display: none;');

      this.layer('Axis', this.axis_base, {
        dataBind: function(data) {
          // Setup axis (scale and properties)
          var chart = this.chart();
          chart._setupAxis(chart.axis);

          // Force addition of just one axis with dummy data array
          // (Axis will be drawn using underlying chart scales)
          return this.selectAll('g')
            .data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'enter': function() {
            // Place and render axis
            var chart = this.chart();
            
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          },
          'update': function() {
            this.attr('transform', this.chart().translation());
          },
          'update:transition': function() {
            // Render axis (with transition)
            var chart = this.chart();

            if (chart.delay())
              this.delay(chart.delay());
            
            if (chart._skip_transition) {
              this.duration(0);
              chart._skip_transition = undefined;
            }
            else if (chart.duration()) {
              this.duration(chart.duration());
            }
            
            if (chart.ease())
              this.ease(chart.ease());

            this.call(chart.axis);
          },
          'exit': function() {
            this.selectAll('g').remove();
          }
        }
      });

      this.layer('_LayoutAxis', this._layout_base, {
        dataBind: function(data) {
          var chart = this.chart();
          chart._setupAxis(chart._layout_axis);
          return this.selectAll('g').data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'merge': function() {
            var chart = this.chart();
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          }
        }
      });
    },
    duration: property('duration', {type: 'Function'}),
    delay: property('delay', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    scale: property('scale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);

        if (this.orientation() == 'vertical')
          this.yScale(scale.copy());
        else
          this.xScale(scale.copy());

        return {
          override: scale
        };
      }
    }),

    position: property('position', {
      default_value: 'bottom',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      },
      set: function() {
        // Update scale -> xScale/yScale when position changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),

    translation: property('translation', {
      default_value: function() {
        return {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(), y: 0},
          y0: {x: 0, y: this.y0()}
        }[this.position()];
      },
      get: function(value) {
        return helpers.translate(value);
      }
    }),

    orient: property('orient', {
      default_value: function() {
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
      default_value: function() {
        return {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        }[this.position()];
      },
      set: function() {
        // Update scale -> xScale/yScale when orientation changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),
    type: property('type'),

    ticks: property('ticks', {type: 'Function'}),
    tickValues: property('tickValues', {type: 'Function'}),
    tickSize: property('tickSize', {type: 'Function'}),
    innerTickSize: property('innerTickSize', {type: 'Function'}),
    outerTickSize: property('outerTickSize', {type: 'Function'}),
    tickPadding: property('tickPadding', {type: 'Function'}),
    tickFormat: property('tickFormat', {type: 'Function'}),

    getLayout: function(data) {
      // 1. Get previous values to restore after draw for proper transitions
      var state = this.getState();
      
      // 2. Draw with current values
      this.draw(data);

      // 3. Calculate layout
      // (make layout axis visible for width calculations in Firefox)
      this._layout_base.attr('style', 'display: block;');
      
      var label_overhang = this._getLabelOverhang();
      
      this._layout_base.attr('style', 'display: none;');

      // 4. Draw with previous values
      if (this._previous_raw_data) {
        this.setState(_.extend(state.previous, {duration: 0}));
        
        this.draw(this._previous_raw_data);

        // 5. Restore current values
        this.setState(state.current);
      }
      else {
        // Skip transition after layout
        // (Can transition from unexpected state)
        this._skip_transition = true;
      }

      // Store raw data for future layout
      this._previous_raw_data = data;

      var position = this.position();
      if (position == 'x0')
        position = 'bottom';
      else if (position == 'y0')
        position = 'right';
      
      return {
        position: position,
        width: label_overhang.width,
        height: label_overhang.height
      };
    },
    setLayout: function(x, y, options) {
      // Axis is positioned with chartBase, so don't set layout
      return;
    },

    getState: function() {
      return {
        previous: {
          scale: this.scale.previous,
          xScale: this.xScale.previous,
          yScale: this.yScale.previous,
          duration: this.duration.previous
        },
        current: {
          scale: this.scale(),
          xScale: this.xScale(),
          yScale: this.yScale(),
          duration: this.duration()
        }
      };
    },
    setState: function(state) {
      this
        .xScale(state.xScale)
        .yScale(state.yScale)
        .scale(state.scale)
        .duration(state.duration);
    },

    _setupAxis: function(axis) {
      // Setup axis
      if (this.orientation() == 'vertical')
        this.axis.scale(this.yScale());
      else
        this.axis.scale(this.xScale());

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      var array_extensions = ['tickValues'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value) && !_.contains(array_extensions, key))
            axis[key].apply(axis, value);
          else
            axis[key](value);
        }
      }, this);
    },

    _getLabelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

      this._layout_base.selectAll('.tick').each(function() {
        try {
          // There are cases where getBBox may throw 
          // (e.g. not currently displayed in Firefox)
          var bbox = this.getBBox();

          if (orientation == 'horizontal')
            overhangs.height.push(bbox.height);
          else
            overhangs.width.push(bbox.width);
        }
        catch (ex) {
          // Ignore error
        }
      });

      return {
        width: _.max(overhangs.width),
        height: _.max(overhangs.height)
      };
    }
  }), {
    layer_type: 'chart',
    z_index: helpers.z_index.axis
  });
  
  /**
    AxisValues
    Axis component for (key,value) series data
  */
  d3.chart('Axis').extend('AxisValues', mixin(mixins.XYValues));
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers) {
  var property = helpers.property;
  var di = helpers.di;

  /**
    Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend = this.base.append('g')
        .classed('chart-legend', true);

      // TODO Move display check to Multi.js
      if (this.options().display) {
        this.layer('Legend', this.legend, {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('g')
              .data(data, chart.dataKey.bind(chart));
          },
          insert: function() {
            var chart = this.chart();
            var groups = this.append('g')
              .attr('class', chart.dataGroupClass);

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
                .text(chart.dataValue)
                .attr('alignment-baseline', 'before-edge');

              // Position groups after positioning everything inside
              var direction_by_position = {
                top: 'horizontal',
                right: 'vertical',
                bottom: 'horizontal',
                left: 'vertical'
              };
              this.call(stack.bind(this, {direction: direction_by_position[chart.position()], origin: 'top', padding: 5}));
            }
          }
        });
      }
      else {
        this.skip_layout = true;
      }
    },

    transform: function(allData) {
      var demux = d3.chart('Multi').prototype.demux;
      var data = _.reduce(this.options().charts, function(data, chart) {
        if (chart.exclude_from_legend)
          return data;

        var chartData = _.compact(_.map(chart.data(), function(series, index) {
          if (series.exclude_from_legend) return;
          
          return {
            chart: chart,
            series: series,
            series_index: index
          };
        }));

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
    dataGroupClass: di(function(chart, d, i) {
      return 'chart-legend-group';
    }),
    dataSeriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + (d.series_index || 0);
    }),
    dataClass: di(function(chart, d, i) {
      var classes = [chart.dataSeriesClass.call(this, d, i)];
      if (d.chart.options()['class'])
        classes.push(d.chart.options()['class']);
      if (d.series['class'])
        classes.push(d.series['class']);

      return classes.join(' ') || null;
    }),
    dataStyle: di(function(chart, d, i) {
      var styles = _.defaults({}, d.series.style, d.chart.options().style);
      
      return helpers.style(styles) || null;
    }),

    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);

      // Clear existing swatch
      selection.selectAll('*').remove();
      selection
        .attr('class', chart.dataClass);

      var inserted;
      if (d && d.chart && _.isFunction(d.chart.insertSwatch)) {
        selection.chart = function() { return chart; };
        inserted = d.chart.insertSwatch.call(selection);
      }
      else {
        // Simple colored circle
        inserted = selection.append('circle')
          .attr('cx', 10)
          .attr('cy', 10)
          .attr('r', 10)
          .attr('class', 'chart-swatch');
      }

      // Style inserted element
      if (inserted && _.isFunction(inserted.attr))
        inserted.attr('style', chart.dataStyle.call(this, d, i));
    })
  }, {
    z_index: helpers.z_index.legend
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

    // TODO switch to translation
    position: property('position', {
      default_value: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this._positionLegend();
          }
        };
      }
    }),
    skip_layout: true,

    _positionLegend: function() {
      if (this.legend) {
        var position = this.position();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    }
  }, {
    layer_type: 'chart'
  });

  /**
    Stack given array of elements using options

    @example
    this.call(helpers.stack)
    this.call(helpers.stack.bind(this, {direction: 'horizontal', origin: 'left'}))
  
    @param {Object} [options]
    - {String} [direction=vertical] vertical or horizontal
    - {String} [origin=top] top/bottom for vertical and left/right for horizontal
  */
  function stack(options, elements) {
    if (options && !elements) {
      elements = options;
      options = {
        direction: 'vertical',
        origin: 'top',
        padding: 0
      };
    }

    function padding(d, i) {
      return i > 0 && options.padding ? options.padding : 0;
    }

    if (elements && elements.attr) {
      var previous = 0;
      elements
        .attr('transform', function(d, i) {
          var dimensions = this.getBBox();
          var x = 0;
          var y = 0;

          if (options.direction == 'horizontal') {
            if (!(options.origin == 'left' || options.origin == 'right'))
              options.origin = 'left';

            if (options.origin == 'left')
              x = previous + padding(d, i);
            else
              x = previous + dimensions.width + padding(d, i);

            previous = previous + dimensions.width + padding(d, i);
          }
          else {
            if (!(options.origin == 'top' || options.origin == 'bottom'))
              options.origin = 'top';

            if (options.origin == 'top')
              y = previous + padding(d, i);
            else
              y = previous + dimensions.height + padding(d, i);

            previous = previous + dimensions.height + padding(d, i);
          }

          return transform.translate(x, y);
        });
    }
  }
  
})(d3, d3.chart.helpers);

(function(d3, _, helpers) {
  var property = helpers.property;

  /**
    Multi chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Multi', function(data) {
        // Process data...
        var participation = data...;
        var results = data...;
        var scales = {
          x: {data: results or participation or join..., key: 'x'},
          y: {data: participation, key: 'y'},
          secondaryY: {data: results, key: 'y'}
        };

        return {
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y, itemPadding: 20},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.secondaryY, labels: {position: 'top'}}
          },
          axes: {
            x: {scale: scales.x}
            y: {scale: scales.y},
            secondaryY: {scale: scales.secondaryY}
          },
          legend: true,
          title: 'd3.chart.multi'
        };
      })
    ```

    @param {Function|Object} options
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      // When "options" changes, a full redraw is required to setup config
      this._full_redraw = false;

      // Internal storage of components and axes
      this._components = {};
      this._axes = {};
    },

    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._full_redraw = true;

        // If options is plain object,
        // return from generic options function
        if (!_.isFunction(options)) {
          return {
            override: function(data) {
              return options;
            }
          };
        }
      }
    }),

    title: property('title', {
      set: function(options, previous) {
        // Remove title if no options are given
        if (!options || _.isEmpty(options)) {
          this.detachComponent('title');
          return;
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title);

        this.attachComponents({title: options});
      }
    }),

    charts: property('charts', {
      set: function(charts, previous) {
        charts = charts || {};
        
        // Find charts to remove
        var remove_ids = _.difference(_.keys(this.charts_by_id), _.keys(charts));
        _.each(remove_ids, function(remove_id) {
          this.detachChart(remove_id);
        }, this);

        // Create or update charts
        _.each(charts, function(chart_options, chart_id) {
          var chart = this.charts_by_id[chart_id];
          chart_options = _.defaults({}, chart_options, d3.chart('Multi').defaults.charts);

          if (!chart) {
            var Chart = d3.chart(chart_options.type);
            chart = new Chart(this.chartLayer(), chart_options);

            this.attachChart(chart_id, chart);
          }
          else {
            chart.options(chart_options);
          }
        }, this);
      },
      default_value: {}
    }),

    axes: property('axes', {
      set: function(axes) {
        // Prepare axis and title options
        var components = {};
        _.each(axes || {}, function(options, id) {
          options = _.defaults({}, options, d3.chart('Multi').defaults.axes);
          components['axis.' + id] = options;

          if (options.title) {
            var title_options = _.isString(options.title) ? {text: options.title} : options.title;
            title_options = _.defaults({}, title_options, {
              type: 'Title',
              position: options.position,
              'class': 'chart-title-axis'
            });

            components['axis_title.' + id] = title_options;
          }
        });
        
        this.attachComponents(components, this._axes);
      },
      default_value: {}
    }),

    legend: property('legend', {
      set: function(options) {
        if (!options || options === false || options.display === false) {
          this.detachComponent('legend');
          return;
        }
        
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);

        // Load charts
        if (options.charts) {
          options.charts = _.map(options.charts, function(chart_id) {
            return this.charts_by_id[chart_id];
          }, this);
        }

        this.attachComponents({legend: options});
      }
    }),

    components: property('components', {
      set: function(components) {
        this.attachComponents(components, this._components);
      },
      default_value: {}
    }),
  
    draw: function(data) {
      var config = this._prepareConfig(data);

      this.axes(config.axes);
      this.charts(config.charts);
      this.components(config.components);
      this.legend(config.legend);
      this.title(config.title);

      d3.chart('Container').prototype.draw.call(this, {
        original: data,
        config: config.data
      });
    },

    redraw: function() {
      // Redraw chart with previously saved raw data / config
      if (this.rawData()) {
        if (this._full_redraw) {
          this._full_redraw = false;
          this.draw(this.rawData().original);
        }
        else {
          d3.chart('Container').prototype.draw.call(this, this.rawData());
        }
      }  
    },

    demux: function(name, data) {
      var item_data;
      var item = this.charts_by_id[name];
      if (item) {
        item_data = data.config.charts[name];
        if (item_data)
          return item_data;
      }
      else {
        item = this.components_by_id[name];
        if (item) {
          item_data = data.config.components[name];
          if (item_data)
            return item_data;
        }
      }

      // If no item data is found, use original data
      return data.original;
    },

    attachComponents: function(components, reference) {
      if (reference) {
        var remove_ids = _.difference(_.keys(reference), _.keys(components));
        _.each(remove_ids, function(remove_id) {
          this.detachComponent(remove_id);
          delete reference[remove_id];
        }, this);  
      }

      _.each(components, function(options, id) {
        var component = this.components_by_id[id];

        // If component type has change, detach and recreate
        if (component && component.type != options.type) {
          this.detachComponent(componentId);
          component = undefined;
        }

        if (!component) {
          var Component = d3.chart(options.type);

          var layer_options = {z_index: helpers.valueOrDefault(Component.z_index, helpers.z_index.component)};
          var base = Component.layer_type == 'chart' ? this.chartLayer(layer_options) : this.componentLayer(layer_options);

          component = new Component(base, options);
          component.type = options.type;

          this.attachComponent(id, component);

          if (reference)
            reference[id] = component;
        }
        else {
          component.options(options);
        }
      }, this);
    },

    _prepareConfig: function(data) {
      var config = _.defaults({}, this.options()(data), {
        charts: {},
        axes: {},
        components: {},
        legend: false,
        title: false,
        options: {}
      });

      // Normalize legend and title config
      if (config.legend === true)
        config.legend = {};

      if (!config.legend.charts && !config.legend.data)
        config.legend.charts = _.keys(config.charts);

      if (_.isString(config.title))
        config.title = {text: config.title};

      // Extract and remove data from config
      var config_data = {
        charts: {},
        components: {}
      };
      _.each(config.charts, function(chart_options, chart_id) {
        config_data.charts[chart_id] = chart_options.data;
        delete chart_options.data;
      });
      _.each(config.axes, function(axis_options, axis_id) {
        config_data.components['axis.' + axis_id] = axis_options.data;
        delete axis_options.data;
      });
      _.each(config.components, function(component_options, component_id) {
        config_data.components[component_id] = component_options.data;
        delete component_options.data;
      });
      if (_.isObject(config.legend)) {
        config_data.components.legend = config.legend.data;
        delete config.legend.data;
      }

      // Attach data to config
      config.data = config_data;
      return config;
    }
  }, {
    defaults: {
      charts: {},
      axes: {
        type: 'Axis'
      },
      legend: {
        type: 'Legend',
        position: 'right'
      },
      title: {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers);
