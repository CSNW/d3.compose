/*! d3.compose - v0.13.1
 * https://github.com/CSNW/d3.compose
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
    first: function(array, n) {
      // Underscore vs. Lo-dash disagree on the implementation for first
      // use Underscore's
      if (array == null) return void 0;
      if (n == null) return array[0];
      return Array.prototype.slice.call(array, 0, n);
    },
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
    pluck: _.pluck,
    reduce: _.reduce,
    reduceRight: _.reduceRight,
    reverse: _.reverse,
    sortBy: _.sortBy,
    throttle: _.throttle,
    toArray: _.toArray,
    uniq: _.uniq,
    value: _.value
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
      var height = element.getBBox().height;

      var style = window.getComputedStyle(element);
      var css_font_size = parseFloat(style['font-size']);
      var css_line_height = parseFloat(style['line-height']);

      // If line-height: normal, use estimate 1.14em
      // (actual line-height depends on browser and font)
      if (isNaN(css_line_height))
        css_line_height = 1.15 * css_font_size;

      var css_adjustment = -(css_line_height - css_font_size) / 2;

      // Add additional line-height, if specified
      var height_adjustment = 0;
      if (line_height && line_height > 0)
        height_adjustment = (line_height - height) / 2;

      offset = height + (css_adjustment || 0) + (height_adjustment || 0);
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
      @param {String} [options.type='linear'] Any available d3 scale (linear, ordinal, log, etc.) or time
      @param {Array} [options.domain] Domain for scale
      @param {Array} [options.range] Range for scale
      @param {Any} [options.data] Used to dynamically set domain (with given value "di" or key)
      @param {Function} [options.value] "di" for getting value for data
      @param {String} [options.key] Data key to extract value
      @param {Boolean} [options.centered] For "ordinal" scales, use centered x-values
      @param {Boolean} [options.adjacent] For "ordinal" + centered, set x-values for different series next to each-other
        Notes:
        - Requires series-index as second argument to scale, otherwise centered x-value is used
        - Requires "data" or "series" options to determine number of series
      @param {Number} [options.series] Used with "adjacent" if no "data" is given to set series count
      @param {Number} [options.padding=0.1] For "ordinal" scales, set padding between different x-values
        Note: Default = 0.1 for "centered" and "adjacent"
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
    if (options.type == 'time')
      scale = d3.time.scale();
    else if (d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    utils.each(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through internal options)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (!utils.contains(['type', 'data', 'value', 'key', 'centered', 'adjacent', 'series', 'padding'], key))
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

    // Add centered and adjacent extensions to ordinal
    // (centered by default for ordinal)
    var centered = options.centered || (options.type == 'ordinal' && options.centered == null);
    if (options.type == 'ordinal' && (centered || options.adjacent)) {
      var original = scale;

      // Get series count for adjacent
      var series_count = options.series || (!isSeriesData(options.data) ? 1 : options.data.length);

      scale = (function(original, options, series_count) {
        var context = function scale(value, series_index) {
          var width = context.width();

          if (!options.adjacent)
            series_index = 0;

          return original(value) + (0.5 * width) + (width * (series_index || 0));
        };
        utils.extend(context, original, {
          width: function() {
            var range_band = context.rangeBand && context.rangeBand();
            var width = isFinite(range_band) ? range_band : 0;

            if (options.adjacent)
              width = width / series_count;

            return width;
          }
        });

        // TODO test copy() behavior

        return context;
      })(original, options, series_count);
    }

    // Add padding extension to ordinal
    if (options.type == 'ordinal' && (options.padding != null || centered || options.adjacent)) {
      var padding = options.padding != null ? options.padding : 0.1;

      var original_range = scale.range;
      scale.range = function(range) {
        if (!arguments.length) return original_range();

        scale.rangeBands(
          range,
          padding,
          padding / 2
        );
      };

      if (options.range)
        scale.range(options.range);

      // TODO test copy() behavior
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
    Stack given array of elements using options

    @example
    ```js
    this.call(helpers.stack)
    this.call(helpers.stack.bind(this, {direction: 'horizontal', origin: 'left'}))
    ```
    @method stack
    @param {Object} [options]
      @param {String} [options.direction=vertical] vertical or horizontal
      @param {String} [options.origin=top] top/bottom for vertical and left/right for horizontal
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

          return translate(x, y);
        });
    }
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
  d3.compose = d3.compose || {};
  d3.compose.helpers = utils.extend({}, d3.compose.helpers, {
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
    stack: stack,
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
    Shared functionality between all charts and components.
    
    - Set properties automatically from `options`, 
    - Store fully transformed data
    - Adds `"before:draw"` and `"draw"` events
    - Standard `width` and `height` calculations

    @class Base
  */
  d3.compose.charts = d3.compose.charts || {};
  d3.compose.charts.Base = d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    /**
      Store fully-transformed data for direct access from the chart

      @property data
      @type Any
    */
    data: property('data'),

    /**
      Overall options for chart/component, automatically setting any matching properties.

      @example
      ```js
      var property = d3.compose.helpers.property;

      d3.chart('Base').extend('HasProperties', {
        initialize: function(options) {
          // Automatically set options
          this.options(options || {});
        },
        a: property('a'),
        b: property('b', {
          set: function(value) {
            return {
              override: value + '!'
            };
          }
        })
      });

      var instance = d3.select('#chart')
        .chart('HasProperties', {
          a: 123,
          b: 'Howdy',
          c: true
        });

      // Equivalent to:
      // d3.select(...)
      //   .chart('HasProperties')
      //   .options({...});

      console.log(instance.a()); // -> 123
      console.log(instance.b()); // -> Howdy!
      console.log(instance.options().c); // -> true
      ```
      @property options
      @type Object
    */
    options: property('options', {
      default_value: {},
      set: function(options) {
        each(options, function setFromOptions(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }
    }),

    /**
      Get width of `this.base`.
      (Does not include `set` for setting width of `this.base`)

      @method width
      @return {Number}
    */
    width: function width() {
      return helpers.dimensions(this.base).width;
    },

    /**
      Get height of `this.base`.
      (Does not include `set` for setting height of `this.base`)

      @method height
      @return {Number}
    */
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    // Store fully-transformed data for reference
    // (Base is last transform to be called, so stored data has been fully transformed)
    transform: function(data) {
      data = data || [];

      this.data(data);
      return data;
    },

    // Add events to draw: "before:draw" and "draw"
    draw: function(data) {
      this.trigger('before:draw', data);
      d3.chart().prototype.draw.apply(this, arguments);
      this.trigger('draw', data);
    }
  });

})(d3, d3.compose.helpers);

(function(d3, charts) {

  /**
    Common base for creating charts.
    Standard `d3.chart` charts can be used with d3.compose, but extending `d3.chart('Chart')` includes helpers for properties and "di" functions.

    ### Extending

    To take advantage of "di"-binding (automatically injects `chart` into "di" methods)
    and automatically setting properties from `options`, use `d3.compose.helpers.di`
    and `d3.compose.helpers.property` when creating your chart.

    @example
    ```js
    var helpers = d3.compose.helpers;

    d3.chart('Chart').extend('Pie', {
      initialize: function() {
        // same as d3.chart
      },
      transform: function(data) {
        // same as d3.chart
      },

      color: helpers.di(function(chart, d, i) {
        // "di" function with parent chart injected ("this" = element)
      }),

      centered: helpers.property('centered', {
        default_value: true
        // can be automatically set from options object
      })
    });
    ```
    @class Chart
    @extends Base
  */
  charts.Chart = charts.Base.extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    /**
      Default z-index for chart
      (Components are 50 by default, so Chart = 100 is above component by default)

      @example
      ```js
      d3.chart('Chart').extend('BelowComponentLayers', {
        // ...
      }, {
        z_index: 40
      });
      ```
      @attribute z_index
      @static
      @type Number
      @default 100
    */
    z_index: 100,
    layer_type: 'chart'
  });

})(d3, d3.compose.charts);

(function(d3, helpers, charts) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    Common base for creating components that includes helpers for positioning and layout.
    
    ### Extending

    `d3.chart('Component')` contains intelligent defaults and there are no required overrides.
    Create a component just like a chart, by creating layers in the `initialize` method in `extend`.

    - To adjust layout calculation, use `prepareLayout`, `getLayout`, and `setLayout`.
    - To layout a component within the chart, use `skip_layout: false` and the static `layer_type: 'Chart'`

    @example
    ```js
    d3.chart('Component').extend('Key', {
      initialize: function() {
        this.layer('Key', this.base, {
          dataBind: function(data) {
            return this.selectAll('text')
              .data(data);
          },
          insert: function() {
            return this.append('text');
          },
          events: {
            merge: function() {
              this.text(this.chart().keyText)
            }
          }
        })
      },

      keyText: helpers.di(function(chart, d, i) {
        return d.abbr + ' = ' + d.value;
      })
    });
    ```
    @class Component
    @extends Base
  */
  charts.Component = charts.Base.extend('Component', {
    initialize: function(options) {
      this.options(options || {});
    },

    /**
      Component's position relative to chart
      (top, right, bottom, left)

      @property position
      @type String
      @default 'top'
    */
    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return utils.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    /**
      Get/set the width of the component (in pixels)
      (used in layout calculations)

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
      Get/set the height of the component (in pixels)
      (used in layout calculations)

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

      @example
      ```js
      d3.chart('Component').extend('NotLaidOut', {
        skip_layout: true
      });
      ```
      @attribute skip_layout
      @type Boolean
      @default false
    */
    skip_layout: false,

    /**
      Perform any layout preparation required before getLayout (default is draw)
      (override in prototype of extension)

      Note: By default, components are double-drawn; 
      for every draw, they are drawn once to determine the layout size of the component and a second time for display with the calculated layout.
      This can cause issues if the component uses transitions. See Axis for an example of a Component with transitions.
      
      @example
      ```js
      d3.chart('Component').extend('Custom', {
        prepareLayout: function(data) {
          // default: this.draw(data);
          // so that getLayout has real dimensions

          // -> custom preparation (if necessary)
        }
      })
      ```
      @method prepareLayout
      @param {Any} data
    */
    prepareLayout: function(data) {
      this.draw(data);
    },

    /**
      Get layout details for use when laying out component
      (override in prototype of extension)

      @example
      ```js
      d3.chart('Component').extend('Custom', {
        getLayout: function(data) {
          var calculated_width, calculated_height;

          // Perform custom calculations...
  
          // Must return position, width, and height
          return {
            position: this.position(),
            width: calculated_width,
            height: calculated_height
          };
        }
      });
      ```
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

      @example
      ```js
      d3.chart('Component').extend('Custom', {
        setLayout: function(x, y, options) {
          // Set layout of this.base...
          // (the following is the default implementation)
          var margins = this.margins();

          this.base
            .attr('transform', helpers.translate(x + margins.left, y + margins.top));
          this.height(options && options.height);
          this.width(options && options.width);
        }
      });
      ```
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
    /**
      Default z-index for component
      (Charts are 100 by default, so Component = 50 is below chart by default)

      @example
      ```js
      d3.chart('Component').extend('AboveChartLayers', {
        // ...
      }, {
        z_index: 150
      });
      ```
      @attribute z_index
      @static
      @type Number
      @default 50
    */
    z_index: 50,

    /**
      Set to `'chart'` to use chart layer for component.
      (e.g. Axis uses chart layer to position with charts, but includes layout for ticks)

      @example
      ```js
      d3.chart('Component').extend('ChartComponent', {
        // ...
      }, {
        layer_type: 'chart'
      });
      ```
      @attribute layer_type
      @static
      @type String
      @default 'component'
    */
    layer_type: 'component'
  });

})(d3, d3.compose.helpers, d3.compose.charts);

(function(d3, helpers, charts) {
  var property = helpers.property;

  /**
    Common base for creating overlays that includes helpers for positioning and show/hide.

    ### Extending

    Create an overlay just like a chart, by creating layers in the `initialize` method in `extend`.

    - To adjust positioning, override `position`
    - To adjust show/hide behavior, override `show`/`hide`

    @example
    ```js
    d3.chart('Overlay').extend('ClosestPoints', {
      // TODO
    });
    ```
    @class Overlay
    @extends Component
  */
  charts.Overlay = charts.Component.extend('Overlay', {
    initialize: function() {
      this.base.attr('style', this.style());
    },
    skip_layout: true,
    
    /**
      Overlay's top-left x-position in px from left

      @property x
      @type Number
      @default 0
    */
    x: property('x', {
      default_value: 0
    }),

    /**
      Overlay's top-left y-position in px from top

      @property y
      @type Number
      @default 0
    */
    y: property('y', {
      default_value: 0
    }),

    /**
      Whether overlay is currently hidden

      @property hidden
      @type Boolean
      @default true
    */
    hidden: property('hidden', {
      default_value: true
    }),

    /**
      Overlays base styling
      (default includes position and hidden)

      @property style
      @type String
      @default set from x, y, and hidden
    */
    style: property('style', {
      default_value: function() {
        var styles = {
          position: 'absolute',
          top: 0,
          left: 0,
          transform: helpers.translate(this.x() + 'px', this.y() + 'px')
        };

        if (this.hidden())
          styles.display = 'none';

        return helpers.style(styles);
      }
    }),

    /**
      Position overlay layer at given x,y coordinates

      @method position
      @param {Number} x in px from left
      @param {Number} y in px from top
    */
    position: function(x, y) {
      this.x(x).y(y);
      this.base.attr('style', this.style());
    },

    /**
      Show overlay (with `display: block`)

      @method show
    */
    show: function() {
      this.hidden(false);
      this.base.attr('style', this.style());
    },

    /**
      Hide overlay (with `display: none`)

      @method hide
    */
    hide: function() {
      this.hidden(true);
      this.base.attr('style', this.style());
    },

    /**
      Get absolute position from container position
      (needed since container position uses viewBox and needs to be scaled to absolute position)

      @method getAbsolutePosition
      @param {Object} container_position ({x, y})
      @return {Object} absolute {x, y} relative to container div
    */
    getAbsolutePosition: function(container_position) {
      var container = this.container && this.container.container;

      if (container) {
        var dimensions = helpers.dimensions(container);
        var chart_width = this.container.width();
        var chart_height = this.container.height();
        var width_ratio = dimensions.width / chart_width;
        var height_ratio = dimensions.height / chart_height;

        return {
          x: width_ratio * container_position.x,
          y: height_ratio * container_position.y
        };
      }
      else {
        // Not attached so can't get actual dimensions
        // fallback to container position
        return container_position;  
      }
    }
  }, {
    layer_type: 'overlay'
  });

})(d3, d3.compose.helpers, d3.compose.charts);

(function(d3, helpers, charts) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    d3.compose
    Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart.
    Using the `options` property, charts and components can be bound to data and customized to create dynamic charts.

    @example
    ```html
    <div id="#chart"></div>
    ```
    ```js
    var chart = d3.select('#chart')
      .chart('Compose', function(data) {
        // Process data...
        
        // Create shared scales
        var scales = {
          x: {data: data.input, key: 'x', adjacent: true},
          y: {data: data.input, key: 'y'},
          y2: {data: data.output, key: 'y'}
        };

        return {
          charts: {
            input: {
              type: 'Bars', data: data.input, xScale: scales.x, yScale: scales.y
            },
            output: {
              type: 'Lines', data: data.output, xScale: scales.x, yScale: scales.y2}
            }
          },
          components: {
            'axis.y': {
              type: 'Axis', scale: scales.y, position: 'left'
            },
            'axis.y2': {
              type: 'Axis', scale: scales.y2, position: 'right'
            }
            title: {
              type: 'Title', position: 'top', text: 'd3.compose'
            }
          }
        });
      });

    chart.draw({input: [...], output: [...]});
    ```

    @class Compose
    @param {Function|Object} [options]
  */
  charts.Compose = charts.Base.extend('Compose', {
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

      // Responsive svg based on the following approach (embedded + padding hack)
      // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
      // (not enabled if selection is svg)
      if (this.base.node().tagName != 'svg') {
        this.container = this.base.append('div')
          .attr('class', 'chart-compose-container');

        this.base = this.container.append('svg')
          .attr('xlmns', 'http://www.w3.org/2000/svg')
          .attr('version', '1.1')
          .attr('class', 'chart-compose');
      }
      else {
        this.base.classed('chart-compose', true);
      }

      this.attachHoverListeners();
    },

    /**
      Get/set the options `object/function` for the chart that takes `data` and
      returns `{charts, components}` for composing child charts and components.
      All values are passed to the corresponding property (`{components}` sets `components` property).

      @example
      ```js
      // get
      chart.options();

      // set (static)
      chart.options({
        charts: {},
        components: {}
      });

      // set (dynamic, takes data and returns options)
      chart.options(function(data) {
        // process data...

        return {
          charts: {},
          components: {}
        };
      });

      // Set directly from d3.chart creation
      d3.select('#chart')
        .chart('Compose', function(data) {
          // ...
        });
      ```
      @property options
      @type Function|Object
    */
    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
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

    // Store raw data for container before it has been transformed
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @example
      ```js
      chart.margins({top: 10, right: 20, bottom: 10, left: 20});
      ```
      @property margins
      @type Object {top, right, bottom, left}
      @default {top: 10, right: 10, bottom: 10, left: 10}
    */
    margins: property('margins', {
      default_value: {top: 10, right: 10, bottom: 10, left: 10},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    // Chart position
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
      return width != null ? width : charts.Base.prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : charts.Base.prototype.height.call(this);
    },

    /**
      @property responsive
      @type Boolean
      @default true
    */
    responsive: property('responsive', {
      default_value: true
    }),

    // Set svg viewBox attribute
    viewBox: property('viewBox', {
      default_value: function() {
        if (this.responsive() && this.width() && this.height())
          return '0 0 ' + this.width() + ' ' + this.height();
        else
          return null;
      }
    }),

    // Set svg preserveAspectRatio attribute
    preserveAspectRatio: property('preserveAspectRatio', {
      default_value: function() {
        if (this.responsive())
          return 'xMidYMid meet';
        else
          return null;
      }
    }),

    // Set container style
    containerStyle: property('containerStyle', {
      default_value: function() {
        if (this.responsive()) {
          var aspect_ratio = 1;
          if (this.width() && this.height())
            aspect_ratio = this.height() / this.width();

          return helpers.style({
            width: '100%',
            height: 0,
            'padding-top': (aspect_ratio * 100) + '%',
            position: 'relative'
          });  
        }
        else {
          return helpers.style({position: 'relative'});
        }
      }
    }),

    // Set base style
    baseStyle: property('baseStyle', {
      default_value: function() {
        if (this.responsive()) {
          return helpers.style({
            position: 'absolute',
            top: 0,
            left: 0
          });
        }
        else {
          return null;
        }
      }
    }),

    /**
      Set charts from options or get chart instances.
      Each chart should use a unique key so that updates are passed to the existing chart
      (otherwise they are recreated on update).
      The `type` option must be a registered `d3.chart` and all other options are passed to the chart.

      @example
      ```js
      chart.charts({
        input: {type: 'Bars'}, // options to pass to Bars chart
        output: {type: 'Lines'} // options to pass to Lines chart
      });
      ```
      @property charts
      @type Object
    */
    charts: property('charts', {
      set: function(chart_options, charts) {
        // Store actual charts rather than options
        return {
          override: attachItems(chart_options, charts, this)
        };
      },
      default_value: {}
    }),

    /**
      Set components from options or get components instances.
      Each component should use a unique key so that updates are passed to the existing chart
      (otherwise they are recreated on update).
      The `type` option must be a registered `d3.chart` and all other options are passed to the component.

      @example
      ```js
      chart.components({
        'axis.y': {type: 'Axis'}, // options to pass to Axis component
        title: {type: 'Title'} // options to pass to Title component
      })
      ```
      @property components
      @type Object
    */
    components: property('components', {
      set: function(component_options, components) {
        // Store actual components rather than options
        return {
          override: attachItems(component_options, components, this)
        };
      },
      default_value: {}
    }),

    /**
      Draw chart with given data

      @example
      ```js
      var chart = d3.select('#chart')
        .chart('Compose', function(data) {
          // ...
        });

      chart.draw([1, 2, 3]);

      chart.draw({values: [1, 2, 3]});
      
      chart.draw([
        {values: [1, 2, 3]},
        {values: [4, 5, 6]}
      ]);
      ```
      @method draw
      @param {Any} data
    */
    draw: function(data) {
      // On redraw, get original data
      data = data && data.original || data;
      var config = prepareConfig(this.options(), data);

      // Set charts and components from config
      utils.each(config, function(value, key) {
        if (this[key] && this[key].is_property && this[key].set_from_options)
          this[key](value);
      }, this);

      // Add config data
      data = {
        original: data,
        config: config.data
      };
      this.data(data);

      // Set container and svg dimensions
      // (if original selection is svg, no container and skip responsiveness)
      if (this.container) {
        this.container
          .attr('style', this.containerStyle());

        this.base
          .attr('viewBox', this.viewBox())
          .attr('preserveAspectRatio', this.preserveAspectRatio())
          .attr('style', this.baseStyle())
          .attr('width', this.responsive() ? null : this.width() || null)
          .attr('height', this.responsive() ? null : this.height() || null);  
      }
      else {
        this.base
          .attr('width', this.width() || null)
          .attr('height', this.height() || null);
      }

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

    // Create chart layer (for laying out charts)
    createChartLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: charts.Chart.z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Create component layer
    createComponentLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: charts.Component.z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Create overlay layer
    createOverlayLayer: function(options) {
      if (!this.container)
        throw new Error('Cannot create overlay layer if original selection "d3.select(...).chart(\'Compose\')" is an svg. Use a div instead for responsive and overlay support.');

      return this.container.append('div')
        .attr('class', 'chart-overlay-layer');
    },

    // Layout components and charts for given data
    layout: function(data) {
      // 1. Place chart layers
      positionChartLayers(this.base.selectAll('.chart-layer'), this.chartPosition());

      // 2. Extract layout from components
      var layout = extractLayout(this.components(), data, this.demux.bind(this));

      // 3. Set chart position from layout
      var chart_position = utils.extend({}, this.margins());
      utils.each(layout, function(parts, key) {
        utils.each(parts, function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this.positionLayers(layout);
    },

    attachHoverListeners: function() {
      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var container = this.container || this.base;
      var base = this.base.node();
      var inside, chart_position;

      container.on('mouseenter', function() {
        // Calculate chart position on enter and cache during move
        chart_position = chartPosition();

        inside = true;
        trigger('mouseenter', translateToXY(d3.mouse(base), chart_position));
      });
      container.on('mousemove', function() {
        if (inside) {
          // Overlay layers may inadvertently delay mouseleave
          // so explicity check if mouse is within bounds of svg base element
          var mouse = d3.mouse(document.documentElement);
          var bounds = base.getBoundingClientRect();
          var inside_base = mouse[0] >= bounds.left && mouse[0] <= bounds.right && mouse[1] >= bounds.top && mouse[1] <= bounds.bottom;

          if (inside_base) {
            trigger('mousemove', translateToXY(d3.mouse(base), chart_position));
          }
          else {
            inside = false;
            trigger('mouseleave');
          }
        }
      });
      container.on('mouseleave', function() {
        if (inside) {
          inside = false;
          trigger('mouseleave');  
        }
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

    // Attach chart/component child item with id
    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && utils.isFunction(item.trigger))
        item.trigger('attach');
    },

    // Detach chart/component child item by id
    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && utils.isFunction(item.trigger))
        item.trigger('detach');
    },

    // Position chart and component layers
    positionLayers: function(layout) {
      positionChartLayers(this.base.selectAll('.chart-layer'), this.chartPosition());
      positionComponents(layout, this.chartPosition(), this._width(), this._height());
      positionByZIndex(this.base.selectAll('.chart-layer, .chart-component-layer')[0]);
    },
  });

  //
  // Internal
  //

  function attachItems(items, container, context) {
    items = items || {};
    container = container || {};

    // Remove charts that are no longer needed
    var remove_ids = utils.difference(utils.keys(container), utils.keys(items));
    utils.each(remove_ids, function(remove_id) {
      context.detach(remove_id, container[remove_id]);
      delete container[remove_id];
    });

    // Create or update charts
    utils.each(items, function(options, id) {
      var item = container[id];

      if (options instanceof d3.chart()) {
        // If chart instance, replace with instance
        if (item)
          context.detach(id, item);

        context.attach(id, options);
        container[id] = options;
      }
      else {
        if (item && item.type != options.type) {
          // If chart type has changed, detach and re-create
          context.detach(id, item);
          item = undefined;
        }

        if (!item) {
          var Item = d3.chart(options.type);

          if (!Item)
            throw new Error('No registered d3.chart found for ' + options.type);

          var layer_options = {z_index: Item.z_index};
          var createLayer = {
            'chart': 'createChartLayer',
            'component': 'createComponentLayer',
            'overlay': 'createOverlayLayer'
          }[Item.layer_type];

          if (!createLayer)
            throw new Error('Unrecognized layer type "' + Item.layer_type + '" for ' + options.type);

          var base = context[createLayer](layer_options);

          item = new Item(base, options);
          item.type = options.type;

          context.attach(id, item);
          container[id] = item;
        }
        else {
          item.options(options);
        }
      }
    });

    return container;
  }

  function prepareConfig(options, data) {
    // Load config from options fn
    var config = options(data);

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
  }

  function positionChartLayers(chart_layers, position) {
    chart_layers
      .attr('transform', helpers.translate(position.left, position.top))
      .attr('width', position.width)
      .attr('height', position.height);
  }

  function positionComponents(layout, chart, width, height) {
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
  }

  function positionByZIndex(layers) {
    // Sort by z-index
    layers = utils.sortBy(layers, function(layer) {
      return parseInt(d3.select(layer).attr('data-zIndex')) || 0;
    });

    // Move layers to z-index order
    utils.each(layers, function(layer) {
      if (layer && layer.parentNode && layer.parentNode.appendChild)
        layer.parentNode.appendChild(layer);
    });
  }

  function extractLayout(components, data, demux) {
    var overall_layout = {top: [], right: [], bottom: [], left: []};
    utils.each(components, function(component, id) {
      if (component.skip_layout)
        return;

      var layout = component.getLayout(demux(id, data));
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

})(d3, d3.compose.helpers, d3.compose.charts);
