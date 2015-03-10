/*! d3.chart.multi - v0.11.0
 * https://github.com/CSNW/d3.chart.multi
 * License: MIT
 */
(function(d3, _) {

  utils = {
    chain: _.chain,
    clone: _.clone,
    contains: _.contains,
    compact: _.compact,
    difference: _.difference,
    defaults: _.defaults,
    each: _.each,
    extend: _.extend,
    flatten: _.flatten,
    first: _.first,
    has: _.has,
    isArray: _.isArray,
    isBoolean: _.isBoolean,
    isFunction: _.isFunction,
    isObject: _.isObject,
    isNumber: _.isNumber,
    isString: _.isString,
    isUndefined: _.isUndefined,
    keys: _.keys,
    map: _.map,
    min: _.min,
    max: _.max,
    reduce: _.reduce,
    reduceRight: _.reduceRight,
    reverse: _.reverse,
    sortBy: _.sortBy,
    throttle: _.throttle,
    toArray: _.toArray,
    uniq: _.uniq,
    value: _.value,
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

    @method property
    @param {String} name of stored property
    @param {Object} options
      @param {Any} options.default_value default value for property (when set value is undefined)
      @param {Function} options.get function(value) {return ...} getter, where value is the stored value, return desired value
      @param {Function} options.set: function(value, previous) {return {override, after}}
        - return override to set stored value and after() to run after set
      @param {String} [options.type='Function']
        - 'Function' don't evaluate in get/set
      @param {Object} [options.context=this] context to evaluate get/set/after functions
      @param {String} [options.prop_key='__properties'] underlying key on object to store properties on

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
        if (utils.isFunction(value) && options.type != 'Function')
          value = value.call(this);

        return utils.isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set(value) {
        // Validate
        if (utils.isFunction(options.validate) && !options.validate.call(this, value))
          throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

        getSet.previous = properties[name];
        properties[name] = value;

        if (utils.isFunction(options.set)) {
          var response = options.set.call(context, value, getSet.previous);

          if (response && utils.has(response, 'override'))
            properties[name] = response.override;
          if (response && utils.isFunction(response.after))
            response.after.call(context, properties[name]);
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

    @method valueOrDefault
    @param {Any} [value]
    @param {Any} default_value
    @return {Any}
  */
  function valueOrDefault(value, default_value) {
    return !utils.isUndefined(value) ? value : default_value;
  }

  /**
    Helper for robustly determining width/height of given selector

    @method dimensions
    @param {d3.Selection} selection
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
        width: utils.max([client.width, attr.width || bbox.width]) || 0,
        height: utils.max([client.height, attr.height || bbox.height]) || 0
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

    @method translate
    @param {Number|Object} [x] value or {x, y}
    @param {Number} [y]
    @return {String}
  */
  function translate(x, y) {
    if (utils.isObject(x)) {
      y = x.y;
      x = x.x;
    }

    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
  }

  /**
    Rotate by degrees, with optional center

    @method rotate
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
    Find vertical offset to vertically align text
    (needed due to lack of alignment-baseline support in Firefox)

    @method alignText
    @param {element} element
    @param {Number} [line_height]
    @return {Number} offset
  */
  function alignText(element, line_height) {
    var offset = 0;
    try {
      var style = window.getComputedStyle(element);
      var height = element.getBBox().height;

      // Adjust for line-height
      var adjustment = -(parseFloat(style['line-height']) - parseFloat(style['font-size'])) / 2;

      if (line_height && line_height > 0)
        adjustment += (line_height - height) / 2;

      offset = height + adjustment;
    }
    catch (ex) {}

    return offset;
  }

  /**
    Determine if given data is likely series data

    @method isSeriesData
    @param {Array} data
    @return {Boolean}
  */
  function isSeriesData(data) {
    var first = utils.first(data);
    return first && utils.isObject(first) && utils.isArray(first.values);
  }

  /**
    Get max for array/series by value di

    @method max
    @param {Array} data
    @param {Function} getValue di function that returns value for given (d, i)
    @return {Number}
  */
  function max(data, getValue) {
    var getMax = function(data) {
      return data && d3.extent(data, getValue)[1];
    };

    if (isSeriesData(data)) {
      return utils.reduce(data, function(memo, series, index) {
        if (series && utils.isArray(series.values)) {
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

    @method min
    @param {Array} data
    @param {Function} getValue di function that returns value for given (d, i)
    @return {Number}
  */
  function min(data, getValue) {
    var getMin = function(data) {
      return data && d3.extent(data, getValue)[0];
    };

    if (isSeriesData(data)) {
      return utils.reduce(data, function(memo, series, index) {
        if (series && utils.isArray(series.values)) {
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
    var scale = createScale({
      type: 'linear',
      domain: [0, 100],
      range: [0, 500]
    });

    // Scale is passed through
    var original = d3.scale.linear();
    var scale = createScale(original);
    scale === original;

    // Set other properties by passing in "arguments" array
    var scale = createScale({
      type: 'ordinal',
      domain: ['a', 'b', 'c', 'd', 'e'],
      rangeRoundBands: [[0, 100], 0.1, 0.05]
    });
    ```

    @method createScale
    @param {Object|Function} options
      - (passing in function returns original function with no changes)
      @param {String} [options.type] Any available d3 scale (linear, ordinal, log, etc.) or time
      @praam {Array} [options.domain] Domain for scale
      @param {Array} [options.range] Range for scale
      @param {Any} [options.data] Used to dynamically set domain (with given value "di" or key)
      @param {Function} [options.value] "di" for getting value for data
      @param {String} [options.key] Data key to extract value
      @param {Array...} [...] Set any other scale properties with array of arguments to pass to property
    @return {d3.Scale}
  */
  function createScale(options) {
    options = options || {};

    // If function, scale was passed in as options
    if (utils.isFunction(options))
      return options;

    // Create scale (using d3.time.scale() if type is 'time')
    var scale;
    if (options.type && options.type == 'time')
      scale = d3.time.scale();
    else if (options.type && d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    utils.each(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through type, data, value, or key)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (!utils.contains(['type', 'data', 'value', 'key'], key))
          scale[key].apply(scale, value);
      }
    });

    if (!options.domain && options.data && (options.key || options.value)) {
      // Use value "di" or create for key
      var getValue = options.value || function(d, i) {
        return d[options.key];
      };

      // Enforce series data
      var data = options.data;
      if (!isSeriesData(data))
        data = [{values: data}];

      var domain;
      if (options.type == 'ordinal') {
        // Domain for ordinal is array of unique values
        domain = utils.chain(data)
          .map(function(series) {
            if (series && series.values)
              return utils.map(series.values, getValue);
          })
          .flatten()
          .uniq()
          .value();
      }
      else {
        var min_value = min(data, getValue);

        domain = [
          min_value < 0 ? min_value : 0,
          max(data, getValue)
        ];
      }

      scale.domain(domain);
    }

    return scale;
  }

  /**
    Convert key,values to style string

    @example
    style({color: 'red', display: 'block'}) -> color: red; display: block;

    @method style
    @param {Object} styles
    @return {String}
  */
  function style(styles) {
    if (!styles)
      return '';

    styles = utils.map(styles, function(value, key) {
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

    @method di
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

    @method getParentData
    @param {Element} element
    @return {Any}
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
    Mixin into prototype

    Designed specifically to work with d3.chart
    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last

    @method mixin
    @param {Array|Object...} mixins... Array of mixins or mixins as separate arguments
    @return {Object}
  */
  function mixin(mixins) {
    mixins = utils.isArray(mixins) ? mixins : utils.toArray(arguments);
    var mixed = utils.extend.apply(null, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = utils.toArray(arguments);

        utils.each(mixins, function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return utils.reduceRight(mixins, function(data, extension) {
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
  d3.chart.helpers = utils.extend({}, d3.chart.helpers, {
    utils: utils,
    property: property,
    valueOrDefault: valueOrDefault,
    dimensions: dimensions,
    translate: translate,
    rotate: rotate,
    alignText: alignText,
    isSeriesData: isSeriesData,
    max: max,
    min: min,
    createScale: createScale,
    style: style,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    getParentData: getParentData,
    mixin: mixin
  });
})(d3, _);

(function(d3, helpers) {
  var each = helpers.utils.each;
  var property = helpers.property;

  /**
    Shared functionality between all charts and components

    @class Base
  */
  d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    /**
      Store fully-transformed data

      @property data
      @type Any
    */
    data: property('data'),

    /**
      Overall options for chart/component, automatically setting any matching properties

      @property options
      @type Object
    */
    options: property('options', {
      default_value: {},
      set: function(options) {
        each(options, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }
    }),

    /**
      Width of chart/component

      @method width
      @return {Number}
    */
    width: function width() {
      return helpers.dimensions(this.base).width;
    },

    /**
      Height of chart/component

      @method height
      @return {Number}
    */
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    // Store transformed data for reference
    // (Base is last transform to be called, so stored data has been fully transformed)
    transform: function(data) {
      data = data || [];

      this.data(data);
      return data;
    },

    // Add events to draw: before:draw and draw
    draw: function(data) {
      this.trigger('before:draw', data);
      d3.chart().prototype.draw.apply(this, arguments);
      this.trigger('draw', data);
    }
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {

  /**
    Foundation for building charts with series data

    @class Chart
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: 100
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    Common component functionality / base for creating components

    @class Component
  */
  d3.chart('Base').extend('Component', {
    initialize: function(options) {
      this.options(options || {});
    },

    /**
      Component position relative to chart
      (top, right, bottom, left)

      @property position
      @type String
      @default top
    */
    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return utils.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    /**
      @property width
      @type Number
      @default (actual width)
    */
    width: property('width', {
      default_value: function() {
        return helpers.dimensions(this.base).width;
      }
    }),

    /**
      @property height
      @type Number
      @default (actual height)
    */
    height: property('height', {
      default_value: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    /**
      Margins (in pixels) around component

      @property margins
      @type Object
      @default {top: 0, right: 0, bottom: 0, left: 0}
    */
    margins: property('margins', {
      set: function(values) {
        return {
          override: utils.defaults(values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      },
      default_value: {top: 0, right: 0, bottom: 0, left: 0}
    }),

    /**
      Skip component during layout calculations and positioning
      (override in prototype of extension)

      @attribute skip_layout
      @type Boolean
      @default false
    */
    skip_layout: false,

    /**
      Perform any layout preparation required before getLayout (default is draw)
      (override in prototype of extension)

      Note: By default, components are double-drawn, which may cause issues with transitions

      @method prepareLayout
      @param {Any} data
    */
    prepareLayout: function(data) {
      this.draw(data);
    },

    /**
      Get layout details for use when laying out component
      (override in prototype of extension)

      @method getLayout
      @param {Any} data
      @return {Object} position, width, and height for layout
    */
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
      (override in prototype of extension)

      @method setLayout
      @param {Number} x position of base top-left
      @param {Number} y position of base top-left
      @param {Object} options
        @param {Object} [options.height] height of component in layout
        @param {Object} [options.width] width of component in layout
    */
    setLayout: function(x, y, options) {
      var margins = this.margins();

      this.base.attr('transform', helpers.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  }, {
    z_index: 50
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var utils = helpers.utils;
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

        return d3.chart.xy({
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
        });
      })
    ```

    @class Multi
    @param {Function|Object} [options]
  */
  d3.chart('Base').extend('Multi', {
    initialize: function(options) {
      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      if (options)
        this.options(options);

      this.base.classed('chart-multi', true);
      this.attachHoverListeners();
    },

    /**
      Options function that returns {chart,component} for data or static {chart,component}

      @property options
      @type Function|Object
    */
    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        // Clear cached config
        this._config = null;

        // If options is plain object,
        // return from generic options function
        if (!utils.isFunction(options)) {
          return {
            override: function(data) {
              return options;
            }
          };
        }
      }
    }),

    /**
      Store raw data for container before it has been transformed

      @property rawData
      @type Any
    */
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @property margins
      @type Object {top, right, bottom, left}
    */
    margins: property('margins', {
      default_value: {top: 10, right: 10, bottom: 10, left: 10},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @internal
      @property chartPosition
      @param Object {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      },
      get: function(values) {
        values.width = this._width() - values.right - values.left;
        values.height = this._height() - values.bottom - values.top;

        return values;
      }
    }),

    /**
      Get/set overall width of chart

      @property width
      @type Number
    */
    width: property('width'),

    /**
      Get/set overall height of chart

      @property height
      @type Number
    */
    height: property('height'),

    _width: function() {
      var width = this.width();
      return width != null ? width : d3.chart('Base').prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : d3.chart('Base').prototype.height.call(this);
    },

    /**
      Set charts from options or get charts
      (Set from charts returned from `options` function)

      @property charts
      @type Object
    */
    charts: property('charts', {
      set: function(chart_options, charts) {
        chart_options = chart_options || {};
        charts = charts || {};

        // Remove charts that are no longer needed
        var remove_ids = utils.difference(utils.keys(charts), utils.keys(chart_options));
        utils.each(remove_ids, function(remove_id) {
          this.detach(remove_id, charts[remove_id]);
          delete charts[remove_id];
        }, this);

        // Create or update charts
        utils.each(chart_options, function(options, id) {
          var chart = charts[id];

          if (options instanceof d3.chart()) {
            // If chart instance, replace with instance
            if (chart)
              this.detach(id, chart);

            this.attach(id, options);
            charts[id] = options;
          }
          else {
            if (chart && chart.type != options.type) {
              // If chart type has changed, detach and re-create
              this.detach(id, chart);
              chart = undefined;
            }

            if (!chart) {
              var Chart = d3.chart(options.type);

              if (!Chart)
                throw new Error('No registered d3.chart found for ' + options.type);

              var base = this.createChartLayer();

              chart = new Chart(base, options);
              chart.type = options.type;

              this.attach(id, chart);
              charts[id] = chart;
            }
            else {
              chart.options(options);
            }
          }
        }, this);

        // Store actual charts rather than options
        return {
          override: charts
        };
      },
      default_value: {}
    }),

    /**
      Set components from options or get components
      (Set from components returned from `options` function)

      @property components
      @type Object
    */
    components: property('components', {
      set: function(component_options, components) {
        component_options = component_options || {};
        components = components || {};

        // Remove components that are no longer needed
        var remove_ids = utils.difference(utils.keys(components), utils.keys(component_options));
        utils.each(remove_ids, function(remove_id) {
          this.detach(remove_id, components[remove_id]);
          delete components[remove_id];
        }, this);

        // Create or update components
        utils.each(component_options, function(options, id) {
          var component = components[id];

          if (options instanceof d3.chart()) {
            // If component instance, replace with component
            if (component)
              this.detach(id, component);

            this.attach(id, options);
            components[id] = options;
          }
          else {
            // If component type has changed, detach and recreate
            if (component && component.type != options.type) {
              this.detach(id, component);
              component = undefined;
            }

            if (!component) {
              var Component = d3.chart(options.type);

              if (!Component)
                throw new Error('No registered d3.chart found for ' + options.type);

              var layer_options = {z_index: Component.z_index};
              var base = Component.layer_type == 'chart' ? this.createChartLayer(layer_options) : this.createComponentLayer(layer_options);

              component = new Component(base, options);
              component.type = options.type;

              this.attach(id, component);
              components[id] = component;
            }
            else {
              component.options(options);
            }
          }


        }, this);

        // Store actual components rather than options
        return {
          override: components
        };
      },
      default_value: {}
    }),

    /**
      Draw chart with given data

      @method draw
      @param {Object} data
    */
    draw: function(data) {
      if (!this._config) {
        data = data.original || data;
        this._config = this._prepareConfig(data);

        // Set charts and components from config
        utils.each(this._config, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }

      // Add config data
      data = {
        original: data,
        config: this._config.data
      };
      this.data(data);

      // Explicitly set width and height of container if width/height is defined
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Layout components
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    /**
      Redraw chart with current data

      @method redraw
    */
    redraw: function() {
      if (this.rawData())
        this.draw(this.rawData().original);
    },

    demux: function(name, data) {
      if (!data || !data.config || !data.original)
        return data;

      if (this.charts()[name] && data.config.charts[name])
        return data.config.charts[name];
      else if (this.components()[name] && data.config.components[name])
        return data.config.components[name];
      else
        return data.original;
    },

    /**
      Create chart layer (for laying out with charts)

      @method createChartLayer
      @param {Object} options
        @param {Number} options.z_index
      @return {d3.selection}
    */
    createChartLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Chart').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      create component layer

      @method createComponentLayer
      @param {Object} options
        @param {Number} options.z_index
      @return {d3.selection}
    */
    createComponentLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Component').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Layout components and chart for given data
    layout: function(data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      var layout = this._extractLayout(data);

      // 3. Set chart position from layout
      var chart_position = utils.extend({}, this.margins());
      utils.each(layout, function(parts, key) {
        utils.each(parts, function(part) {
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

      var throttledMouseMove = utils.throttle(function(coordinates) {
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

    _prepareConfig: function(data) {
      // Load config from options fn
      var config = this.options()(data);

      config = utils.defaults({}, config, {
        charts: {},
        components: {}
      });

      config.data = {
        charts: {},
        components: {}
      };

      utils.each(config.charts, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.charts[id] = options.data;

          // Remove data from options
          options = utils.clone(options);
          delete options.data;
          config.charts[id] = options;
        }
      });

      utils.each(config.components, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.components[id] = options.data;

          // Remove data from options
          options = utils.clone(options);
          delete options.data;
          config.components[id] = options;
        }
      });

      return config;
    },

    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && utils.isFunction(item.trigger))
        item.trigger('attach');
    },

    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && utils.isFunction(item.trigger))
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

      utils.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, chart.top);

      utils.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      utils.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      utils.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

      function setLayout(component, x, y, options) {
        if (component && utils.isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
    },

    _positionByZIndex: function() {
      // Get layers
      var elements = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      elements = utils.sortBy(elements, function(element) {
        return parseInt(d3.select(element).attr('data-zIndex')) || 0;
      });

      // Move layers to z-index order
      utils.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Extract layout from components
    _extractLayout: function(data) {
      var overall_layout = {top: [], right: [], bottom: [], left: []};
      utils.each(this.components(), function(component, id) {
        if (component.skip_layout)
          return;

        var layout = component.getLayout(this.demux(id, data));
        var position = layout && layout.position;

        if (!utils.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overall_layout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      }, this);

      return overall_layout;
    }
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

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
      seriesLayer

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
            .append('g')
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
      return parseFloat(chart.xScale()(chart.xValue.call(this, d, i)));
    }),

    /**
      Get scaled x-value for given data-point

      @method x
      @return {Number}
    */
    y: di(function(chart, d, i) {
      return parseFloat(chart.yScale()(chart.yValue.call(this, d, i)));
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
    transform: function(data) {
      // Transform series data from values to x,y
      if (helpers.isSeriesData(data)) {
        utils.each(data, function(series) {
          series.values = utils.map(series.values, normalizeData);
        }, this);
      }
      else {
        data = utils.map(data, normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        if (!utils.isObject(point))
          point = {x: index, y: point};
        else if (!utils.isArray(point) && utils.isUndefined(point.x))
          point.x = valueOrDefault(point.key, index);

        return point;
      }
    },

    /**
      Define padding (in percentage) between each item
      (If series is displayed adjacent, padding is just around group, not individual series)

      @property itemPadding
      @type Number
      @default 0.1
    */
    itemPadding: property('itemPadding', {default_value: 0.1}),

    /**
      If series data, display points at same index for different series adjacent

      @property displayAdjacent
      @type Boolean
      @default false
    */
    displayAdjacent: property('displayAdjacent', {default_value: false}),

    /**
      Determine centered-x based on series display type (adjacent or layered)

      @method x
    */
    x: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),

    /**
      x-value, when series are displayed next to each other at each x

      @method adjacentX
    */
    adjacentX: di(function(chart, d, i) {
      var adjacent_width = chart.adjacentWidth.call(this, d, i);
      var left = chart.layeredX.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacent_width / 2;
      var series_index = chart.seriesIndex ? chart.seriesIndex.call(this, d, i) : 1;

      return left + adjacent_width * series_index;
    }),

    /**
      Determine width of data-point when displayed adjacent

      @method adjacentWidth
    */
    adjacentWidth: di(function(chart, d, i) {
      var series_count = chart.seriesCount ? chart.seriesCount() : 1;

      if (series_count > 0)
        return chart.layeredWidth.call(this, d, i) / series_count;
      else
        return 0;
    }),

    /**
      x-value, when series are layered (share same x)

      @method layeredX
    */
    layeredX: di(function(chart, d, i) {
      return chart.xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),

    /**
      Determine layered width (width of group for adjacent)

      @method layeredWidth
    */
    layeredWidth: di(function(chart, d, i) {
      var range_band = chart.xScale().rangeBand();
      return isFinite(range_band) ? range_band : 0;
    }),

    /**
      Determine item width based on series display type (adjacent or layered)

      @method itemWidth
    */
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    }),

    // Override set x-scale range to use rangeBands (if present)
    setXScaleRange: function(x_scale) {
      if (utils.isFunction(x_scale.rangeBands)) {
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

    // Override default x-scale to use ordinal type
    getDefaultXScale: function() {
      return helpers.createScale({
        type: 'ordinal',
        data: this.data(),
        key: 'x'
      });
    }
  });

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
  var XYLabels = utils.extend(Labels, {
    proxyLabelMethods: ['x', 'y']
  });

  /**
    mixin for handling common hover behavior

    @module Hover
  */
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
    mixin for handling hover behavior for XY charts

    @module XYHover
  */
  var XYHover = utils.extend({}, Hover, {
    initialize: function() {
      Hover.initialize.apply(this, arguments);
      this.on('before:draw', function() {
        // Reset points on draw
        this._points = undefined;
      });
    },

    /**
      Get {x,y} details for given data-point

      @method getPoint
      @return {x, y, d, i, j}
    */
    getPoint: di(function(chart, d, i, j) {
      return {
        x: chart.x.call(this, d, i, j),
        y: chart.y.call(this, d, i, j),
        d: d, i: i, j: j
      };
    }),

    /**
      Get all point details for chart data (cached)

      @method getPoints
      @return {Array} {x,y} details for chart data
    */
    getPoints: function() {
      var data = this.data();
      if (!this._points && data) {
        if (helpers.isSeriesData(data)) {
          // Get all points for each series
          this._points = utils.map(data, function(series, j) {
            return getPointsForValues.call(this, series.values, j, {_parent_data: series});
          }, this);
        }
        else {
          this._points = getPointsForValues.call(this, data, 0);
        }
      }

      return this._points;

      function getPointsForValues(values, seriesIndex, element) {
        var points = utils.map(values, function(d, i) {
          return this.getPoint.call(element, d, i, seriesIndex);
        }, this);

        // Sort by x
        points.sort(function(a, b) {
          return a.x - b.x;
        });

        return points;
      }
    },

    /**
      Find closest points for each series to the given {x,y} position

      @method getClosestPoints
      @param {Object} position {x,y} position relative to chart
      @return {Array}
    */
    getClosestPoints: function(position) {
      var points = this.getPoints();
      var closest = [];

      if (!points)
        return [];

      if (points.length && utils.isArray(points[0])) {
        // Series data
        utils.each(points, function(series) {
          closest.push(sortByDistance(series, position));
        });
      }
      else {
        closest.push(sortByDistance(points, position));
      }

      return closest;

      function sortByDistance(values, position) {
        var byDistance = utils.map(values, function(point) {
          point.distance = getDistance(point, position);
          return point;
        });

        return utils.sortBy(byDistance, 'distance');
      }

      function getDistance(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      }
    }
  });

  // Expose mixins
  d3.chart.mixins = utils.extend(d3.chart.mixins || {}, {
    Series: Series,
    XY: XY,
    XYValues: XYValues,
    Labels: Labels,
    XYLabels: XYLabels,
    Hover: Hover,
    XYHover: XYHover
  });

})(d3, d3.chart.helpers);

(function(d3, helpers, mixins) {
  var utils = helpers.utils;
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    @class Labels
  */
  d3.chart('Chart').extend('Labels', mixin(mixins.Series, mixins.XY, mixins.XYHover, {
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
            .data(data, this.chart().key);
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

    /**
      Formatting function or string (string is passed to d3.format) for label values

      @property format
      @type String|Function
    */
    format: property('format', {
      type: 'Function',
      set: function(value) {
        if (utils.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),

    /**
      Label position relative to data-point

      @property position
      @type String
      @default top
    */
    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return utils.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    /**
      Offset between data-point and label
      (if number is given, offset is set based on position)

      @property offset
      @type Number|Object
      @default {x: 0, y: 0}
    */
    offset: property('offset', {
      default_value: {x: 0, y: 0},
      set: function(offset) {
        if (utils.isNumber(offset)) {
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

    /**
      Padding between text and label background

      @property padding
      @type Number
      @default 0
    */
    padding: property('padding', {default_value: 0}),

    /**
      Define text anchor, start, middle, or end
      (set by default based on label position)

      @property anchor
      @type String
      @default middle
    */
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
        return utils.contains(['start', 'middle', 'end'], value);
      }
    }),

    /**
      Define text-aligmment, top, middle, or bottom
      (set by default based on label position)

      @property alignment
      @type String
      @default middle
    */
    alignment: property('alignment', {
      default_value: function() {
        return {
          'top': 'bottom',
          'right': 'middle',
          'bottom': 'top',
          'left': 'middle'
        }[this.position()];
      },
      validate: function(value) {
        return utils.contains(['top', 'middle', 'bottom'], value);
      }
    }),

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    /**
      Get label text for data-point (uses "label" property or y-value)

      @method labelText
      @return {String}
    */
    labelText: di(function(chart, d, i) {
      var value = helpers.valueOrDefault(d.label, chart.yValue.call(this, d, i));
      var format = chart.format();

      return format ? format(value) : value;
    }),

    /**
      Get class for label group

      @method labelClass
      @return {String}
    */
    labelClass: di(function(chart, d, i) {
      return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
    }),

    // (Override for custom labels)
    insertLabels: function(selection) {
      selection.append('rect')
        .attr('class', 'chart-label-bg');
      selection.append('text')
        .attr('class', 'chart-label-text');
    },

    // (Override for custom labels)
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
      utils.each(labels, function(series) {
        utils.each(series, function(label) {
          setLayout(chart, label);
        });
      });
    },

    // (Override for custom labels)
    transitionLabels: function(selection) {
      selection.attr('opacity', 1);
    },

    onMouseEnter: function(position) {
      var points = this.getClosestPoints(position.chart);

      this.removeHighlight();
      utils.each(points, function(series) {
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
      utils.each(points, function(series) {
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
    z_index: 150
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
    var text_y_adjustment = helpers.alignText(label.text.element);

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
      y: layout.y + (layout.height / 2) - (text_bounds.height / 2) + text_y_adjustment
    };
  }

  function handleCollisions(chart, labels) {
    utils.each(labels, function(series, seriesIndex) {
      // Check through remaining series for collisions
      utils.each(labels.slice(seriesIndex + 1), function(compareSeries) {
        utils.each(compareSeries, function(compareLabel) {
          utils.each(series, function(label) {
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
        utils.each(labelB.group.labels, function(label) {
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
      var byY = utils.chain(group.labels)
        .each(function(label) {
          // Reset to original y
          label.y = label.originalY;
        })
        .sortBy(function(label) {
          return label.y;
        })
        .reverse()
        .value();

      utils.each(byY, function(label, index) {
        var prev = utils.first(byY, index);
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

})(d3, d3.chart.helpers, d3.chart.mixins);

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
            .data(data, chart.key);
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
              .attr('y', chart.y0())
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
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
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
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i));
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

    interpolate: property('interpolate', {
      default_value: 'monotone'
    }),

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
    style: property('style', {
      default_value: {}
    }),

    transformation: function() {
      var translate = helpers.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.rotate(this.rotation());

      return translate + ' ' + rotate;
    },
  }, {
    z_index: 70
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
        var scale = helpers.createScale(value);

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
    z_index: 60
  });
  
  /**
    AxisValues
    Axis component for (key,value) series data
  */
  d3.chart('Axis').extend('AxisValues', mixin(mixins.XYValues));
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers) {
  var utils = helpers.utils;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Legend component that can automatically draw data from charts

    @example
    ```js
    // (in Multi options)
    return {
      charts: {
        a: {...},
        b: {...}
      },
      components: {
        legend: {type: 'Legend', charts: ['a', 'b']}
      }
    }
    // -> automatically adds legend with data from charts a and b

    // or, manually set data for legend
    return {
      components: {
        legend: {type: 'Legend', data: [
          {text: 'A', key: 'a', type: 'Bars', class: 'legend-blue'},
          {text: 'B', key: 'b', type: 'Line', class: 'legend-green'},
          {text: 'C', key: 'c', class: 'legend-red'}
        ]}
      }
    }
    ```

    @class Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend_base = this.base.append('g').classed('chart-legend', true);

      this.layer('Legend', this.legend_base, {
        dataBind: function(data) {
          return this.selectAll('g')
            .data(data, this.chart().itemKey);
        },
        insert: function() {
          var chart = this.chart();
          var groups = this.append('g')
            .attr('class', chart.itemClass);

          groups.append('g')
            .attr('width', chart.swatchDimensions().width)
            .attr('height', chart.swatchDimensions().height)
            .attr('class', 'chart-legend-swatch');
          groups.append('text')
            .attr('class', 'chart-legend-label');

          return groups;
        },
        events: {
          merge: function() {
            var chart = this.chart();
            var swatch = chart.swatchDimensions();

            this.select('g').each(chart.createSwatch);
            this.select('text')
              .text(chart.itemText)
              .each(function() {
                // Vertically center text
                var offset = helpers.alignText(this, swatch.height);
                d3.select(this)
                  .attr('transform', helpers.translate(swatch.width + 5, offset));
              });

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
    },

    /**
      Array of chart keys from container to display in legend

      @property charts
      @type Array
    */
    charts: property('charts'),

    /**
      Dimensions of "swatch"

      @property swatchDimensions
      @type Object
      @default {width: 20, height: 20}
    */
    swatchDimensions: property('swatchDimensions', {
      default_value: {width: 20, height: 20}
    }),

    transform: function(data) {
      if (this.charts()) {
        // Pull legend data from charts
        var charts = this.container.charts();
        data = utils.reduce(this.charts(), function(data, chart_id) {
          var chart = charts[chart_id];

          // Check for exclude from legend option
          if (!chart || chart.exclude_from_legend || chart.options().exclude_from_legend)
            return data;

          var chart_data = this.container.demux(chart_id, this.container.data());
          if (!helpers.isSeriesData(chart_data))
            chart_data = [chart_data];

          var legend_data = utils.compact(utils.map(chart_data, function(series, index) {
            // Check for exclude from legend option on series
            if (!series || series.exclude_from_legend) return;

            return {
              text: series.name || 'Series ' + (index + 1),
              key: series.key ? chart_id + '.' + series.key : null,
              type: chart.type,
              'class': utils.compact([
                'chart-series',
                'chart-index-' + index,
                chart.options()['class'],
                series['class']
              ]).join(' ')
            };
          }));

          return data.concat(legend_data);
        }, [], this);
      }

      return data;
    },

    /**
      Key for legend item (default is key from data)

      @method itemKey
      @return {Any}
    */
    itemKey: di(function(chart, d, i) {
      return d.key;
    }),

    /**
      Text for legend item (default is text from data)

      @method itemText
      @return {String}
    */
    itemText: di(function(chart, d, i) {
      return d.text;
    }),

    /**
      Class to apply to swatch-text group

      @method itemClass
      @return {String}
    */
    itemClass: di(function(chart, d, i) {
      return 'chart-legend-group';
    }),

    /**
      Class to apply to swatch (default is class from data)

      @method swatchClass
      @return {String}
    */
    swatchClass: di(function(chart, d, i) {
      return d['class'];
    }),

    /**
      Create swatch (using registered swatches based on type from data)

      @method createSwatch
    */
    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);

      // Clear existing swatch
      selection.selectAll('*').remove();
      selection
        .attr('class', chart.swatchClass);

      var swatches = d3.chart('Legend').swatches;
      if (!swatches)
        return;

      if (d && d.type && swatches[d.type])
        swatches[d.type].call(selection, chart, d, i);
      else if (swatches['default'])
        swatches['default'].call(selection, chart, d, i);
    })
  }, {
    z_index: 200,
    swatches: {
      'default': function(chart, d, i) {
        var dimensions = chart.swatchDimensions();

        this.append('circle')
          .attr('cx', dimensions.width / 2)
          .attr('cy', dimensions.height / 2)
          .attr('r', utils.min([dimensions.width, dimensions.height]) / 2)
          .attr('class', 'chart-swatch');
      }
    },

    /**
      Register a swatch create function for the given chart type

      @method registerSwatch
      @static
      @param {String} type Chart type
      @param {Function} create "di" function that inserts swatch
    */
    registerSwatch: function(type, create) {
      if (!utils.isArray(type))
        type = [type];

      utils.each(type, function(type) {
        this.swatches[type] = create;
      }, this);
    }
  });

  // Create line swatch for Line and LineValues
  d3.chart('Legend').registerSwatch(['Line', 'LineValues'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('line')
      .attr('x1', 0).attr('y1', dimensions.height / 2)
      .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
      .attr('class', 'chart-line');
  });

  // Create bars swatch for Bars and StackedBars
  d3.chart('Legend').registerSwatch(['Bars', 'StackedBars'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', dimensions.width).attr('height', dimensions.height)
      .attr('class', 'chart-bar');
  });

  /**
    Legend positioned within chart bounds

    @class InsetLegend
  */
  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this.on('draw', function() {
        // Position legend on draw
        // (Need actual width/height for relative_to)
        var translation = this.translation();
        this.legend_base.attr('transform', helpers.translate(translation.x, translation.y));
      }.bind(this));
    },

    /**
      Position legend within chart layer {x,y,relative_to}
      Use `relative_to` to use x,y values relative to x-y origin
      (e.g. left-top is default)

      @property translation
      @type Object {x,y} translation
      @default {x: 10, y: 10, relative_to: 'left-top'}
    */
    translation: property('translation', {
      default_value: {x: 10, y: 0, relative_to: 'left-top'},
      get: function(value) {
        var x = value.x || 0;
        var y = value.y || 0;
        var relative_to_x = (value.relative_to && value.relative_to.split('-')[0]) || 'left';
        var relative_to_y = (value.relative_to && value.relative_to.split('-')[1]) || 'top';

        if (relative_to_x === 'right') {
          x = this.width() - helpers.dimensions(this.legend_base).width - x;
        }
        if (relative_to_y === 'bottom') {
          y = this.height() - helpers.dimensions(this.legend_base).height - y;
        }

        return {
          x: x,
          y: y
        };
      }
    }),

    skip_layout: true
  }, {
    layer_type: 'chart'
  });

  /*
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

          return helpers.translate(x, y);
        });
    }
  }

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var utils = helpers.utils;

  /**
    XY extension
    Generate d3.chart.multi options for XY charts

    @param {Object} options
    - charts {Object}
    - axes {Object}
    - title {String|Object}
    - legend {Boolean|Object}
  */
  d3.chart.xy = function xy(options) {
    options = options || {};
    var charts = utils.extend({}, options.charts);
    var components = utils.extend({}, options.components);
    var default_margin = 8;
    var default_margins = {top: default_margin, right: default_margin, bottom: default_margin, left: default_margin};

    // Title
    if (options.title) {
      var title_options = options.title;
      if (utils.isString(title_options))
        title_options = {text: title_options};

      title_options = utils.defaults({}, title_options, {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main',
        margins: default_margins
      });

      components.title = title_options;
    }

    // Axes
    utils.each(options.axes, function(axis_options, key) {
      var positionByKey = {
        x: 'bottom',
        y: 'left',
        x2: 'top',
        y2: 'right',
        secondaryX: 'top',
        secondaryY: 'right'
      };

      axis_options = utils.defaults({}, axis_options, {
        type: 'Axis',
        position: positionByKey[key]
      });

      components['axis.' + key] = axis_options;

      if (axis_options.title) {
        var title_options = axis_options.title;
        if (utils.isString(title_options))
          title_options = {text: title_options};

        title_options = utils.defaults({}, title_options, {
          type: 'Title',
          position: axis_options.position,
          'class': 'chart-title-axis',
          margins: utils.defaults({
            top: {top: default_margin / 2},
            right: {left: default_margin / 2},
            bottom: {bottom: default_margin / 2},
            left: {right: default_margin / 2}
          }[axis_options.position], default_margins)
        });

        components['axis.' + key + '.title'] = title_options;
      }
    });

    // Legend
    if (options.legend) {
      var legend_options = options.legend;
      if (legend_options === true)
        legend_options = {};

      legend_options = utils.defaults({}, legend_options, {
        type: 'Legend',
        position: 'right',
        margins: default_margins
      });

      // By default, use all charts for legend
      if (!legend_options.data && !legend_options.charts)
        legend_options.charts = utils.keys(charts);

      components.legend = legend_options;
    }

    return {
      charts: charts,
      components: components
    };
  };

})(d3, d3.chart.helpers);
