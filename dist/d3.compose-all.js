/*! d3.compose - v0.13.2
 * https://github.com/CSNW/d3.compose
 * License: MIT
 */
(function(d3, _) {

  /**
    `d3.compose.helpers` includes general purpose helpers that are used throughout d3.compose.
    Includes convenience functions for create charts/components (`property`, `di`, and `mixin`),
    helpful calculations (`dimensions`, `max`, and `min`) and other common behavior.

    @class helpers
  */

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
    Helper for creating properties for charts/components

    @example
    ```javascript
    var Custom = d3.chart('Chart').extend('Custom', {
      // Create property that's stored internally as 'simple'
      simple: property('simple')
    });
    var custom; // = new Custom(...);

    // set
    custom.simple('Howdy');

    // get
    console.log(custom.simple()); // -> 'Howdy'

    // Advanced
    // --------
    // Default values:
    Custom.prototype.message = property('message', {
      default_value: 'Howdy!'
    });

    console.log(custom.message()); // -> 'Howdy!'
    custom.message('Goodbye');
    console.log(custom.message()); // -> 'Goodbye'

    // Set to undefined to reset to default value
    custom.message(undefined);
    console.log(custom.message()); // -> 'Howdy!'

    // Custom getter:
    Custom.prototype.exclaimed = property('exclaimed', {
      get: function(value) {
        // Value is the underlying set value
        return value + '!';
      }
    });

    custom.exclaimed('Howdy');
    console.log(custom.exclaimed()); // -> 'Howdy!'

    // Custom setter:
    Custom.prototype.feeling = property('feeling', {
      set: function(value, previous) {
        if (value == 'Hate') {
          // To override value, return Object with override specified
          return {
            override: 'Love',

            // To do something after override, use after callback
            after: function() {
              console.log('After: ' + this.feeling()); // -> 'After: Love'
            }
          };
        }
      }

      custom.feeling('Hate'); // -> 'After: Love'
      console.log(custom.feeling()); // -> 'Love'
    });
    ```
    @method property
    @param {String} name of stored property
    @param {Object} [options]
    @param {Any} [options.default_value] default value for property (when set value is `undefined`)
    @param {Function} [options.get] `function(value) {return ...}` getter, where `value` is the stored value and return desired value
    @param {Function} [options.set] `function(value, previous) {return {override, after}}`. Return `override` to override stored value and `after()` to run after set
    @param {String} [options.type] `get` is evaluated by default, use `"Function"` to skip evaluation
    @param {Object} [options.context=this] context to evaluate get/set/after functions
    @param {String} [options.prop_key='__properties'] underlying key on object to store property
    @return {Function} `()`: get, `(value)`: set
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
    If value isn't `undefined`, return `value`, otherwise use `default_value`

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
    @return {Object} `{width, height}`
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
    translate(10, 15) == 'translate(10, 15)'
    translate({x: 10, y: 15}) == 'translate(10, 15)'
    ```
    @method translate
    @param {Number|Object} [x] value or `{x, y}`
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
    (needed due to lack of `alignment-baseline` support in Firefox)

    @example
    ```js
    var label = d3.select('text');

    // Place label vertically so that origin is top-left
    var offset = alignText(label);
    label.attr('transform', translate(0, offset));

    // Center label for line-height of 20px
    var offset = alignText(label, 20);
    label.attr('transform', translate(0, offset));
    ```
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

    @example
    ```js
    var data = [
      {values: [{y: 1}, {y: 2}, {y: 3}]},
      {values: [{y: 4}, {y: 2}, {y: 0}]}
    ];
    max(data, function(d, i) { return d.y; }); // -> 4
    ```
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

    @example
    ```js
    var data = [
      {values: [{x: 1}, {x: 2}, {x: 3}]},
      {values: [{x: 4}, {x: 2}, {x: 0}]}
    ];
    min(data, function(d, i) { return d.x; }); // -> 0
    ```
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
    @param {Object|Function} options (passing in `Function` returns original function with no changes)
    @param {String} [options.type='linear'] Any available `d3.scale` (`"linear"`, `"ordinal"`, `"log"`, etc.) or `"time"`
    @param {Array} [options.domain] Domain for scale
    @param {Array} [options.range] Range for scale
    @param {Any} [options.data] Used to dynamically set domain (with given value or key)
    @param {Function} [options.value] "di"-function for getting value for data
    @param {String} [options.key] Data key to extract value
    @param {Boolean} [options.centered] For "ordinal" scales, use centered x-values
    @param {Boolean} [options.adjacent] For "ordinal" + centered, set x-values for different series next to each other
    
    - Requires series-index as second argument to scale, otherwise centered x-value is used
    - Requires "data" or "series" options to determine number of series
    @param {Number} [options.series] Used with "adjacent" if no "data" is given to set series count
    @param {Number} [options.padding=0.1] For "ordinal" scales, set padding between different x-values
    @param {Array...} [options....] Set any other scale properties with array of arguments to pass to property
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

  // TODO Look into converting to d3's internal style handling
  // Convert key,values to style string
  //
  // @example
  // ```js
  // style({color: 'red', display: 'block'}) -> color: red; display: block;
  // ```
  // @method style
  // @param {Object} styles
  // @return {String}
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
    Stack given array of elements vertically or horizontally

    @example
    ```js
    // Stack all text elements vertically, from the top, with 0px padding
    d3.selectAll('text').call(helpers.stack)

    // Stack all text elements horizontally, from the right, with 5px padding
    d3.selectAll('text').call(helpers.stack.bind(this, {
      direction: 'horizontal', 
      origin: 'right',
      padding: 5
    }));
    ```
    @method stack
    @param {Object} [options]
    @param {String} [options.direction=vertical] `"vertical"` or `"horizontal"`
    @param {String} [options.origin] `"top"`, `"right"`, `"bottom"`, or `"left"` (by default, `"top"` for `"vertical"` and `"left"` for `"horizontal"`)
    @param {Number} [options.padding=0] padding (in px) between elements
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
    Create wrapped `(d, i)` function that adds chart instance as first argument.
    Wrapped function uses standard d3 arguments and context.

    Note: in order to pass proper context to di-functions called within di-function
    use `.call(this, d, i)` (where "this" is d3 context)

    @example
    ```javascript
    d3.chart('Base').extend('Custom', {
      initialize: function() {
        this.base.select('point')
          .attr('cx', this.x);
        // -> (d, i) and "this" used from d3, "chart" injected automatically
      },

      x: di(function(chart, d, i) {
        // "this" is standard d3 context: node
        return chart.xScale()(chart.xValue.call(this, d, i));
      })

      // xScale, xValue...
    });
    ```
    @method di
    @param {Function} callback with `(chart, d, i)` arguments
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
    Get parent data for element (used to get parent series for data point)

    @example
    ```js
    var data = [{
      name: 'Input',
      values: [1, 2, 3]
    }];

    d3.selectAll('g')
      .data(data)
      .enter().append('g')
        .selectAll('text')
          .data(function(d) { return d.values; })
          .enter().append('text')
            .text(function(d) {
              var series_data = getParentData(this);
              return series_data.name + ': ' + d;
            });

    // Input: 1, Input: 2, Input: 3
    ```
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
    Mix prototypes into single combined prototype for chart/component

    Designed specifically to work with d3.chart:

    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last

    @example
    ```js
    var a = {transform: function() {}, a: 1};
    var b = {initialize: function() {}, b: 2};
    var c = {c: 3};

    d3.chart('Chart').extend('Custom', mixin(a, b, c, {
      initialize: function() {
        // d
      },
      transform: function() {
        // d
      }
    }));

    // initialize: Chart -> b -> d
    // transform: d -> a -> Chart
    ```
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
      helpers.utils.each([
        'enter',
        'enter:transition',
        'update',
        'update:transition',
        'merge',
        'merge:transition',
        'exit',
        'exit:transition'
      ], function(event) {
        var method = 'on' + utils.map(event.split(':'), function capitalize(str) {
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

(function(d3, helpers, mixins, charts) {
  var utils = helpers.utils;
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Standalone or "embeddable" labels (uses `mixins.Labels` and `attachLabels` to embed in chart)

    ### Extending

    To extend the `Labels` chart, the following methods are available:

    - `insertLabels`
    - `mergeLabels`
    - `layoutLabels`
    - `transitionLabels`
    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    View the `Labels.js` source for the default implementation and more information on these methods.

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      return {
        charts: {
          input: {
            type: 'Lines',
            data: data.input,
            // xScale, yScale, other properties...

            // Show labels with default properties
            labels: true
          },
          output: {
            type: 'Bars',
            data: data.output,
            // xScale, yScale, other properties...

            // Pass options to labels
            labels: {
              offset: 2,
              position: 'top',
              style: {
                'font-size': '14px'
              },
              format: d3.format(',0d')
            }
          },
          labels: {
            type: 'Labels',
            data: data.labels,

            // xScale, yScale, other properties...
          }
        }
      };
    });
  
    chart.draw({
      input: [1, 2, 3],
      output: [10, 20, 30],
      labels: [
        {x: 0, y: 0},
        {x: 0, y: 30, label: 'Override (y by default)'},
        {x: 2, y: 0},
        {x: 2, y: 30}
      ]
    });
    ```
    @class Labels
    @extends Chart, Series, XY, Hover, Transition, StandardLayer
  */
  charts.Labels = charts.Chart.extend('Labels', mixin(
    mixins.Series,
    mixins.XY,
    mixins.Hover,
    mixins.Transition,
    mixins.StandardLayer,
    {
      initialize: function() {
        // Proxy attach to parent for hover
        var parent = this.options().parent;
        if (parent) {
          this.parent = parent;
          parent.on('attach', function() {
            this.container = parent.container;
            this.trigger('attach');
          }.bind(this));
        }

        // Use StandardLayer for extensibility
        this.standardSeriesLayer('Labels', this.base);
      },

      transform: function(data) {
        if (!helpers.isSeriesData(data))
          data = [{key: 'labels', name: 'Labels', values: data}];

        // TODO Use ticks / domain from xScale
        // ticks = scale.ticks ? scale.ticks.apply(scale, [10]) : scale.domain()
        return data;
      },

      /**
        Formatting function or string (string is passed to `d3.format`) for label values

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
        Label position relative to data point
        (top, right, bottom, or left)

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
        Offset between data point and label
        (if `Number` is given, offset is set based on position)

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
        @default 1
      */
      padding: property('padding', {default_value: 1}),

      /**
        Define text anchor (start, middle, or end)

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
        Define text-aligmment (top, middle, or bottom)
        
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

      /**
        Get label text for data-point (uses "label" property or y-value)

        @method labelText
        @param {Any} d
        @param {Number} i
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
        @param {Any} d
        @param {Number} i
        @return {String}
      */
      labelClass: di(function(chart, d, i) {
        return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
      }),

      onDataBind: function onDataBind(selection, data) {
        return selection.selectAll('g')
          .data(data, this.key);
      },
      onInsert: function onInsert(selection) {
        return selection.append('g')
          .on('mouseenter', this.mouseEnterPoint)
          .on('mouseleave', this.mouseLeavePoint)
          .call(this.insertLabels);
      },
      onMerge: function onMerge(selection) {
        selection.attr('class', this.labelClass);

        this.mergeLabels(selection);
        this.layoutLabels(selection);
      },
      onMergeTransition: function onMergeTransition(selection) {
        // Transition labels into position
        this.setupTransition(selection);
        this.transitionLabels(selection);
      },

      // (Override for custom labels)
      insertLabels: function(selection) {
        selection.append('rect')
          .attr('class', 'chart-label-bg');
        selection.append('text')
          .attr('class', 'chart-label-text');
      },

      // (Override for custom labels)
      mergeLabels: function(selection) {
        selection.selectAll('text')
          .text(this.labelText);
      },

      // (Override for custom labels)
      layoutLabels: function(selection) {
        // Calculate layout
        var chart = this;
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
      }
    }
  ), {
    z_index: 150
  });

  /**
    (in-progress)

    @class HoverLabels
  */
  d3.chart('Labels').extend('HoverLabels', mixin(mixins.Hover, {
    initialize: function() {
      this.on('attach', function() {
        this.container.on('mouseenter:point', this.onMouseEnterPoint.bind(this));
        this.container.on('mouseleave:point', this.onMouseLeavePoint.bind(this));
      }.bind(this));
    },

    /**
      Maximum distance to find active points

      @property hoverTolerance
      @type Number
      @default 20
    */
    hoverTolerance: property('hoverTolerance', {
      set: function(value) {
        // Pass through hover tolerance to parent (if present)
        if (this.parent && this.parent.hoverTolerance)
          this.parent.hoverTolerance(value);
      },
      default_value: 20
    }),

    // Don't fade in labels, hidden until hover
    transitionLabels: function(selection) {},

    onMouseEnterPoint: function(point) {
      var label = this.findLabelForPoint(point);
      if (label)
        d3.select(label).attr('opacity', 1);
    },
    onMouseLeavePoint: function(point) {
      var label = this.findLabelForPoint(point);
      if (label)
        d3.select(label).attr('opacity', 0);
    },

    findLabelForPoint: function(point) {
      var labels = this.base.selectAll('g.chart-series').selectAll('g');
      var chart = this;
      var label;

      labels.each(function(d, i, j) {
        var series = chart.seriesData.call(this, d, i, j);
        if (d === point.d && series === point.series)
          label = this;
      });

      return label;
    }
  }));

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

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;
  var isUndefined = helpers.utils.isUndefined;

  /**
    Bars chart with centered or adjacent display for single or series data.

    To display bars for different series next to each other (adjacent),
    use the `adjacent` option when creating the `xScale` (see example below).

    ### Extending

    To extend the `Bars` chart, the following methods are available:

    - `barHeight`
    - `barWidth`
    - `barX`
    - `barY`
    - `barClass`
    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      // Display bars for different series next to each other (adjacent: true)
      var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

      return {
        charts: {
          output: {
            type: 'Bars',
            data: data.output,
            xScale: xScale,
            // yScale: ...,
            // other properties...
          }
        }
      };
    });

    // Single y-values
    chart.draw([10, 20, 30]);

    // Series (x,y) values
    chart.draw([
      {values: [{x: 0, y: 10}, {x: 1, y: 20}, {x: 2, y: 30}]},
      {values: [{x: 0, y: 30}, {x: 1, y: 20}, {x: 2, y: 10}]}
    ]);
    ```
    @class Bars
    @extends Chart, Series, XYValues, XYLabels, Hover, Transition, StandardLayer
  */
  charts.Bars = charts.Chart.extend('Bars', mixin(
    mixins.Series,
    mixins.XYValues,
    mixins.XYLabels,
    mixins.Hover,
    mixins.Transition, 
    mixins.StandardLayer, 
    {
      initialize: function() {
        // Use standard series layer for extensibility
        // (dataBind, insert, and events defined in prototype)
        this.standardSeriesLayer('Bars', this.base.append('g').classed('chart-bars', true));
        this.attachLabels();
      },

      barHeight: di(function(chart, d, i) {
        var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
        return height > 0 ? height : 0;
      }),
      barWidth: di(function(chart, d, i) {
        return chart.itemWidth();
      }),
      barX: di(function(chart, d, i) {
        return chart.x.call(this, d, i) - chart.itemWidth() / 2;
      }),
      barY: di(function(chart, d, i) {
        var y = chart.y.call(this, d, i);
        var y0 = chart.y0();

        return y < y0 ? y : y0 + chart.barOffset();
      }),
      barClass: di(function(chart, d, i) {
        return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
      }),

      // Shift bars slightly to account for axis thickness
      barOffset: function barOffset() {
        var axis = this.getOffsetAxis();
        if (axis) {
          var axis_thickness = parseInt(axis.base.select('.domain').style('stroke-width')) || 0;
          return axis_thickness / 2;
        }
        else {
          return 0;
        }
      },
      getOffsetAxis: function getOffsetAxis() {
        return this.container && this.container.components()['axis.x'];
      },

      // Override StandardLayer
      onDataBind: function onDataBind(selection, data) {
        return selection.selectAll('rect')
          .data(data, this.key);
      },
      
      // Override StandardLayer
      onInsert: function onInsert(selection) {
        return selection.append('rect')
          .on('mouseenter', this.mouseEnterPoint)
          .on('mouseleave', this.mouseLeavePoint);
      },

      // Override StandardLayer
      onEnter: function onEnter(selection) {
        selection
          .attr('y', this.y0())
          .attr('height', 0);
      },

      // Override StandardLayer
      onMerge: function onMerge(selection) {
        selection
          .attr('class', this.barClass)
          .attr('style', this.itemStyle)
          .attr('x', this.barX)
          .attr('width', this.barWidth);
      },

      // Override StandardLayer
      onMergeTransition: function onMergeTransition(selection) {
        this.setupTransition(selection);

        selection
          .attr('y', this.barY)
          .attr('height', this.barHeight);
      },

      // Override StandardLayer
      onExit: function onExit(selection) {
        selection.remove();
      }
    }
  ));

  /**
    Bars chart with values stacked on top of each other

    (See `Bars` for extensibility details)

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      // Display bars for different series next to each other (adjacent: true)
      var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

      return {
        charts: {
          stacked_output: {
            type: 'StackedBars',
            data: data.output,
            xScale: xScale,
            // yScale: ...,
            // other properties...
          }
        }
      };
    });

    // Single y-values
    chart.draw([10, 20, 30]);

    // Series (x,y) values
    chart.draw([
      {values: [{x: 0, y: 10}, {x: 1, y: 20}, {x: 2, y: 30}]},
      {values: [{x: 0, y: 30}, {x: 1, y: 20}, {x: 2, y: 10}]}
    ]);
    ```
    @class StackedBars
    @extends Bars
  */
  charts.StackedBars = charts.Bars.extend('StackedBars', {
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
    })
  });

  /**
    Bars chart with bars that group from left-to-right

    (See `Bars` for extensibility details)

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      // Display bars for different series next to each other (adjacent: true)
      var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

      return {
        charts: {
          output: {
            type: 'HorizontalBars',
            data: data.output,
            xScale: xScale,
            // yScale: ...,
            // other properties...
          }
        }
      };
    });

    // Single y-values
    chart.draw([10, 20, 30]);

    // Series (x,y) values
    chart.draw([
      {values: [{x: 0, y: 10}, {x: 1, y: 20}, {x: 2, y: 30}]},
      {values: [{x: 0, y: 30}, {x: 1, y: 20}, {x: 2, y: 10}]}
    ]);
    ```
    @class HorizontalBars
    @extends Bars, InvertedXY
  */
  charts.HorizontalBars = charts.Bars.extend('HorizontalBars', mixin(mixins.InvertedXY, {
    barX: di(function(chart, d, i) {
      var x = chart.x.call(this, d, i);
      var x0 = chart.x0();

      return x < x0 ? x : x0 + chart.barOffset();
    }),
    barY: di(function(chart, d, i) {
      return chart.y.call(this, d, i) - chart.itemWidth() / 2;
    }),
    barWidth: di(function(chart, d, i) {
      var width = Math.abs(chart.x0() - chart.x.call(this, d, i)) - chart.barOffset();
      return width > 0 ? width : 0;
    }),
    barHeight: di(function(chart, d, i) {
      return chart.itemWidth();
    }),

    onEnter: function onEnter(selection) {
      selection
        .attr('x', this.x0())
        .attr('width', 0);
    },
    
    onMerge: function onMerge(selection) {
      selection
        .attr('class', this.barClass)
        .attr('style', this.itemStyle)
        .attr('y', this.barY)
        .attr('height', this.barHeight);
    },
    
    onMergeTransition: function onMergeTransition(selection) {
      this.setupTransition(selection);

      selection
        .attr('x', this.barX)
        .attr('width', this.barWidth);
    },
  }));

  /**
    Horizontal Stacked Bars

    (See `Bars` for extensibility details)

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      // Display bars for different series next to each other (adjacent: true)
      var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

      return {
        charts: {
          output: {
            type: 'HorizontalStackedBars',
            data: data.output,
            xScale: xScale,
            // yScale: ...,
            // other properties...
          }
        }
      };
    });

    // Single y-values
    chart.draw([10, 20, 30]);

    // Series (x,y) values
    chart.draw([
      {values: [{x: 0, y: 10}, {x: 1, y: 20}, {x: 2, y: 30}]},
      {values: [{x: 0, y: 30}, {x: 1, y: 20}, {x: 2, y: 10}]}
    ]);
    ```
    @class HorizontalStackedBars
    @extends HorizontalBars
  */
  charts.HorizontalStackedBars = charts.HorizontalBars.extend('HorizontalStackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
    },

    barWidth: di(function(chart, d, i) {
      var width = Math.abs(chart.x0() - chart.x.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return width > 0 ? width - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      var x = chart.x.call(this, d, i);
      var x0 = chart.x0();

      // Only handle positive x-values
      if (x < x0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || x0;
      var new_position = previous + (x - x0);

      chart.bar_positions[i] = new_position;

      return previous;
    })
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Create an XY Lines chart with single or series data.

    ### Extending

    Great care has been taken in making the standard charts in d3.compose extensible.
    To extend the `Lines` chart, the following methods are available:

    - `createLine`
    - `lineKey`
    - `lineData`
    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    View the `Lines.js` source for the default implementation and more information on these methods.

    @example
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      return {
        charts: {
          input: {
            type: 'Lines'
            data: data.input,
            // xScale: ...,
            // yScale: ...,
            // other properties...
          }
        }
      };
    });
  
    // Single y-values
    chart.draw([1, 2, 3]);

    // Series (x,y) values
    chart.draw([
      {values: [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]}
      {values: [{x: 0, y: 3}, {x: 1, y: 2}, {x: 2, y: 1}]}
    ]);
    ```
    @class Lines
    @extends Chart, Series, XY, XYLabels, Hover, HoverPoints, Transition, StandardLayer
  */
  charts.Lines = charts.Chart.extend('Lines', mixin(
    mixins.Series, 
    mixins.XY, 
    mixins.XYLabels, 
    mixins.Hover, 
    mixins.HoverPoints, 
    mixins.Transition, 
    mixins.StandardLayer, 
    {
      initialize: function() {
        this.lines = {};

        // Use standard series layer for extensibility
        // (dataBind, insert, and events defined in prototype)
        this.standardSeriesLayer('Lines', this.base.append('g').classed('chart-lines', true));

        this.attachLabels();
      },

      /**
        Set interpolation mode for line

        - See: [SVG-Shapes#line_interpolate](https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate)
        - Set to `null` or `'linear'` for no interpolation

        @property interpolate
        @type String
        @default monotone
      */
      interpolate: property('interpolate', {
        default_value: 'monotone'
      }),

      // Create line on insert (keyed by series/index)
      createLine: di(function(chart, d, i, j) {
        var key = chart.lineKey.call(this, d, i, j);
        var line = chart.lines[key] = d3.svg.line()
          .x(chart.x)
          .y(chart.y);

        var interpolate = d.interpolate || chart.interpolate();
        if (interpolate)
          line.interpolate(interpolate);
      }),

      // Get key for line (from series key or index)
      lineKey: di(function(chart, d, i, j) {
        var key = chart.seriesKey(chart.seriesData.call(this, d, i, j));
        return key != null ? key : chart.seriesIndex.call(this, d, i, j);
      }),

      // Get data for line
      lineData: di(function(chart, d, i, j) {
        var key = chart.lineKey.call(this, d, i, j);
        if (chart.lines[key])
          return chart.lines[key](d);
      }),

      // Override StandardLayer
      onDataBind: function onDataBind(selection, data) {
        return selection.selectAll('path')
          .data(function(d, i, j) {
            return [data.call(selection, d, i, j)];
          });
      },

      // Override StandardLayer
      onInsert: function onInsert(selection) {
        return selection.append('path')
          .classed('chart-line', true)
          .each(this.createLine);
      },

      // Override StandardLayer
      onMergeTransition: function onMergeTransition(selection) {
        this.setupTransition(selection);

        selection
          .attr('d', this.lineData)
          .attr('style', this.itemStyle);
      }
    }
  ));

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Add title text to a chart.

    ### Extending

    To extend the `Title` component, the following methods are available:

    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          components: {
            title: {
              type: 'Title',
              position: 'top'
              text: 'Main Title',
              textAlign: 'left',
              'class': 'title-main'
            },
            subtitle: {
              type: 'Title',
              position: 'bottom',
              text: 'Subtitle',
              'class': 'title-subtitle'
            }
          }
        };
      });
    ```
    @class Title
    @extends Component, StandardLayer
  */
  charts.Title = charts.Component.extend('Title', mixin(mixins.StandardLayer, {
    initialize: function() {
      // Use standard layer for extensibility
      this.standardLayer('Title', this.base.append('g').classed('chart-title', true));
    },

    /**
      Text to display in title

      @property text
      @type String
    */
    text: property('text'),

    /**
      Rotation of title text. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

      @property rotation
      @type Number
      @default (set based on `position`)
    */
    rotation: property('rotation', {
      default_value: function() {
        var rotate_by_position = {
          right: 90,
          left: -90
        };

        return rotate_by_position[this.position()] || 0;
      }
    }),

    /**
      Horizontal text-alignment of title (`"left"`, `"center"`, or `"right"`)

      @property textAlign
      @type String
      @default "center"
    */
    textAlign: property('textAlign', {
      default_value: 'center',
      validate: function(value) {
        return helpers.utils.contains(['left', 'center', 'right'], value);
      }
    }),

    /**
      text-anchor for title (`"start"`, `"middle"`, or `"end"`)

      @property anchor
      @type String
      @default (set by `textAlign`)
    */
    anchor: property('anchor', {
      default_value: function() {
        return {
          left: 'start',
          center: 'middle',
          right: 'end'
        }[this.textAlign()];
      },
      validate: function(value) {
        return helpers.utils.contains(['start', 'middle', 'end', 'inherit'], value);
      }
    }),

    /**
      Vertical aligment for title (`"top"`, `"middle"`, `"bottom"`)

      @property verticalAlign
      @type String
      @default "middle"
    */
    verticalAlign: property('verticalAlign', {
      default_value: 'middle',
      validate: function(value) {
        return helpers.utils.contains(['top', 'middle', 'bottom']);
      }
    }),

    /**
      Style object containing styles for title

      @property style
      @type Object
      @default {}
    */
    style: property('style', {
      default_value: {},
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),

    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('text')
        .data([0]);
    },
    onInsert: function onInsert(selection) {
      return selection.append('text');
    },
    onMerge: function onMerge(selection) {
      selection
        .attr('transform', this.transformation())
        .attr('style', this.style())
        .attr('text-anchor', this.anchor())
        .attr('class', this.options()['class'])
        .text(this.text());
    },

    transformation: function() {
      var x = {
        left: 0,
        center: this.width() / 2,
        right: this.width()
      }[this.textAlign()];
      var y = {
        top: 0,
        middle: this.height() / 2,
        bottom: this.height()
      }[this.verticalAlign()];

      var translate = helpers.translate(x, y);
      var rotate = helpers.rotate(this.rotation());

      return translate + ' ' + rotate;
    },
  }), {
    z_index: 70
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis component for XY data (wraps `d3.axis`).

    Available d3.axis extensions:

    - `ticks`
    - `tickValues`
    - `tickSize`
    - `innerTickSize`
    - `outerTickSize`
    - `tickPadding`
    - `tickFormat`

    ### Extending

    To extend the `Axis` component, the following methods are available:

    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var scales = {
          x: {data: data, key: 'x'},
          y: {data: data, key: 'y'}
        };

        return {
          components: {
            'x.axis': {
              type: 'Axis',
              position: 'bottom',
              scale: scales.x
            },
            'y.axis': {
              type: 'Axis',
              position: 'left',
              scale: scales.y
            }
          }
        };
      });
    ```
    @class Axis
    @extends Component, XY, Transition, StandardLayer
  */
  charts.Axis = charts.Component.extend('Axis', mixin(mixins.XY, mixins.Transition, mixins.StandardLayer, {
    initialize: function() {
      // Create two axes (so that layout and transitions work)
      // 1. Display and transitions
      // 2. Layout (draw to get width, but separate so that transitions aren't affected)
      this.axis = d3.svg.axis();

      this.axis_base = this.base.append('g').attr('class', 'chart-axis');
      this._layout_base = this.base.append('g')
        .attr('class', 'chart-axis chart-layout')
        .attr('style', 'display: none;');

      // Use standard layer for extensibility
      this.standardLayer('Axis', this.axis_base);

      this.layer('_LayoutAxis', this._layout_base, {
        dataBind: function(data) {
          return this.selectAll('g').data([0]);
        },
        insert: function() {
          return this.chart().onInsert(this);
        },
        events: {
          'enter': function() {
            this.chart().onEnter(this);
          },
          'merge': function() {
            this.chart().onMerge(this);
          }
        }
      });
    },

    /**
      Scale to pass to d3.axis

      - If `xScale`/`yScale` are given, `scale` is set automatically based on `position`.
      - Can be `d3.scale` or, if `Object` is given, `helpers.createScale` is used

      @example
      ```js
      // Set with d3.scale directly
      axis.scale(d3.scale());

      // or with Object passed helpers.createScale
      axis.scale({data: data, key: 'x'});

      // For x0/y0 position, both xScale and yScale needed
      // (scale is automatically set by position)
      axis.xScale({domain: [0, 100]});
      axis.yScale({domain: [0, 10]});
      axis.position('y0');

      // -> axis.scale() -> axis.xScale by default
      ```
      @property scale
      @type Object|d3.scale
    */
    scale: property('scale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);

        if (this.orientation() == 'vertical')
          this.yScale(scale);
        else
          this.xScale(scale);

        return {
          override: scale
        };
      }
    }),

    /**
      Position axis relative to chart
      (top, right, bottom, left, x0, y0)

      @property position
      @type String
      @default bottom
    */
    position: property('position', {
      default_value: 'bottom',
      validate: function(value) {
        return helpers.utils.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      },
      set: function() {
        // Update scale -> xScale/yScale when position changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),

    /**
      {x,y} translation of axis relative to chart
      (set by default based on position)

      @property translation
      @type Object
      @default (set based on position)
    */
    translation: property('translation', {
      default_value: function() {
        switch (this.position()) {
          case 'top':
            return {x: 0, y: 0};
          case 'right':
            return {x: this.width(), y: 0};
          case 'bottom':
            return {x: 0, y: this.height()};
          case 'left':
            return {x: 0, y: 0};
          case 'x0':
            return {x: this.x0(), y: 0};
          case 'y0':
            return {x: 0, y: this.y0()};
        }
      },
      get: function(value) {
        return helpers.translate(value);
      }
    }),

    /**
      Axis orient for ticks
      (set by default based on position)

      @property orient
      @type String
      @default (set based on position)
    */
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

    /**
      Axis orientation (vertical or horizonal)

      @property orientation
      @type String
      @default (set based on position)
    */
    orientation: property('orientation', {
      validate: function(value) {
        return helpers.utils.contains(['horizontal', 'vertical'], value);
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

    // d3.axis extensions
    ticks: property('ticks', {type: 'Function'}),
    tickValues: property('tickValues', {type: 'Function'}),
    tickSize: property('tickSize', {type: 'Function'}),
    innerTickSize: property('innerTickSize', {type: 'Function'}),
    outerTickSize: property('outerTickSize', {type: 'Function'}),
    tickPadding: property('tickPadding', {type: 'Function'}),
    tickFormat: property('tickFormat', {type: 'Function'}),

    onDataBind: function onDataBind(selection, data) {
      // Setup axis (scale and properties)
      this._setupAxis(this.axis);

      // Force addition of just one axis with dummy data array
      // (Axis will be drawn using underlying chart scales)
      return selection.selectAll('g').data([0]);
    },
    onInsert: function onInsert(selection) {
      return selection.append('g');
    },
    onEnter: function onEnter(selection) {
      // Place and render axis
      selection.call(this.axis);
    },
    onMerge: function onUpdate(selection) {
      selection.attr('transform', this.translation());
    },
    onUpdateTransition: function onUpdateTransition(selection) {
      // Render axis (with transition)
      this.setupTransition(selection);

      if (this._skip_transition) {
        selection.duration(0);
        this._skip_transition = undefined;
      }

      selection.call(this.axis);
    },
    onExit: function onExit(selection) {
      selection.selectAll('g').remove();
    },

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
        this.setState(helpers.utils.extend(state.previous, {duration: 0}));

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
        axis.scale(this.yScale());
      else
        axis.scale(this.xScale());

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      var array_extensions = ['tickValues'];
      helpers.utils.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!helpers.utils.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (helpers.utils.isArray(value) && !helpers.utils.contains(array_extensions, key))
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
        width: helpers.utils.max(overhangs.width),
        height: helpers.utils.max(overhangs.height)
      };
    }
  }), {
    layer_type: 'chart',
    z_index: 60
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers, mixins, charts) {
  var utils = helpers.utils;
  var property = helpers.property;
  var di = helpers.di;
  var mixin = helpers.mixin;

  /**
    Legend component that can automatically pull chart and series information from d3.compose

    Notes:

    - To exclude a chart from the legend, use `exclude_from_legend = true` in chart prototype or options
    - To exclude a series from the legend, use `exclude_from_legend = true` in series object
    - To add swatch for custom chart, use `Legend.registerSwatch()`

    ### Extending

    To extend the `Legend` component, the following methods are available:

    - `itemKey`
    - `itemText`
    - `swatchClass`
    - `createSwatch`
    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var input = [{key: 'input', name: 'Input', values: data.input}];
        var output = [
          {key: 'output1', name: 'Output 1', values: data.output1},
          {key: 'output2', name: 'Output 2', values: data.output2}
        ];

        return {
          charts: {
            a: {type: 'Lines', data: input}, // ...
            b: {type: 'Bars', data: output} // ...
          },
          components: {
            legend: {
              type: 'Legend',
              charts: ['a', 'b']
            }
          }
        };
      });

    // -> automatically creates legend from series data for 'a' and 'b'
    //    (Lines Swatch) Input
    //    (Bars Swatch) Output 1
    //    (Bars Swatch) Output 2

    // or, manually set data for legend
    return {
      components: {
        legend: {
          type: 'Legend',
          data: [
            {type: 'Lines', text: 'Input', class: 'series-index-0'},
            {type: 'Bars', text: 'Output 1', class: 'series-index-0'},
            {type: 'Bars', text: 'Output 2', class: 'series-index-1'},
          ]
        }
      }
    };
    ```
    @class Legend
    @extends Component, StandardLayer
  */
  charts.Legend = charts.Component.extend('Legend', mixin(mixins.StandardLayer, {
    initialize: function() {
      this.legend_base = this.base.append('g').classed('chart-legend', true);
      this.standardLayer('Legend', this.legend_base);
    },

    /**
      Array of chart keys from container to display in legend

      @example
      ```js
      d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          charts: {
            a: {},
            b: {},
            c: {}
          },
          components: {
            legend: {
              type: 'Legend',
              charts: ['a', 'c']
            }
          }
        };
      });
      ```
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
              key: chart_id + '.' + (series.key || index),
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

    // Key for legend item (default is key from data)
    itemKey: di(function(chart, d, i) {
      return d.key;
    }),

    // Text for legend item (default is text from data)
    itemText: di(function(chart, d, i) {
      return d.text;
    }),

    // Class to apply to swatch (default is class from data)
    swatchClass: di(function(chart, d, i) {
      return d['class'];
    }),

    // Create swatch (using registered swatches based on type from data)
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
    }),

    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('.chart-legend-group')
        .data(data, this.itemKey);
    },
    onInsert: function onInsert(selection) {
      var groups = selection.append('g')
        .attr('class', 'chart-legend-group');

      groups.append('g')
        .attr('width', this.swatchDimensions().width)
        .attr('height', this.swatchDimensions().height)
        .attr('class', 'chart-legend-swatch');
      groups.append('text')
        .attr('class', 'chart-legend-label');

      return groups;
    },
    onMerge: function onMerge(selection) {
      var swatch = this.swatchDimensions();

      selection.select('g').each(this.createSwatch);
      selection.select('text')
        .text(this.itemText)
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
      selection.call(helpers.stack.bind(selection, {direction: direction_by_position[this.position()], origin: 'top', padding: 5}));
    },
    onExit: function onExit(selection) {
      selection.remove();
    }
  }), {
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

      @example
      ```js
      d3.chart('Legend').registerSwatch(['Lines'], function(chart, d, i) {
        var dimensions = chart.swatchDimensions();

        return this.append('line')
          .attr('x1', 0).attr('y1', dimensions.height / 2)
          .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
          .attr('class', 'chart-line');
      });
      ```
      @method registerSwatch
      @static
      @param {String|Array} type Chart type
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
  charts.Legend.registerSwatch(['Lines'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('line')
      .attr('x1', 0).attr('y1', dimensions.height / 2)
      .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
      .attr('class', 'chart-line');
  });

  // Create bars swatch for Bars and StackedBars
  charts.Legend.registerSwatch(['Bars', 'StackedBars', 'HorizontalBars', 'HorizontalStackedBars'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', dimensions.width).attr('height', dimensions.height)
      .attr('class', 'chart-bar');
  });

  /**
    Legend positioned within chart bounds.

    @class InsetLegend
    @extends Legend
  */
  charts.InsetLegend = charts.Legend.extend('InsetLegend', {
    initialize: function() {
      this.on('draw', function() {
        // Position legend on draw
        // (Need actual width/height for relative_to)
        var translation = this.translation();
        this.legend_base.attr('transform', helpers.translate(translation.x, translation.y));
      }.bind(this));
    },

    /**
      Position legend within chart layer `{x, y, relative_to}`
      Use `relative_to` to use x,y values relative to x-y origin
      (e.g. `"left-top"` is default)

      @example
      ```js
      d3.select('#chart')
        .chart('Compose', function(data) {
          return {
            components: {
              legend: {
                type: 'InsetLegend',
                // Position legend 10px away from right-bottom corner of chart
                translation: {x: 10, y: 10, relative_to: 'right-bottom'}
              }
            }
          }
        });
      ```
      @property translation
      @type Object {x,y}
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

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);

(function(d3, helpers) {
  var utils = helpers.utils;

  /**
    Extensions are used for defining options for d3.compose that wrap common behavior, reduce boilerplate,
    and provide helpers for composing charts and components.

    @class extensions
  */

  /**
    XY extension
    Generate d3.compose options for XY charts
  
    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var scales = {
          x: {}, // ...
          y: {}, // ...
          y2: {} // ...
        };

        return d3.compose.xy({
          // charts and components as normal
          charts: {
            bars: {type: 'Bars'}, // ...
            lines: {type: 'Lines'} // ...
          }, 
          components: {}, // ...

          // Axes:
          // type: 'Axis'
          // position: x -> 'bottom', y -> 'left', x2 -> 'top', y2: 'right'
          axes: {
            x: {scale: scales.x, title: 'X Axis'},
            y: {scale: scales.y, title: 'Y Axis'},
            y2: {scale: scales.y2, title: 'Y2 Axis'}
          },
          title: 'Chart Title',
          legend: true
        });

        // transforms to
        return {
          charts: {
            bars: {type: 'Bars'},
            lines: {type: 'Lines'}
          },
          components: {
            // ...
            'axis.x': {type: 'Axis', position: 'bottom', scale: scales.x},
            'axis.x.title': {type: 'Title', position: 'bottom', text: 'X Axis'},
            'axis.y': {type: 'Axis', position: 'left', scale: scales.y},
            'axis.y.title': {type: 'Title', position: 'left', text: 'Y Axis'},
            'axis.y2': {type: 'Axis', position: 'right', scale: scales.y2},
            'axis.y2.title': {type: 'Title', position: 'right', text: 'Y2 Axis'},
            title: {type: 'Title', position: 'top', text: 'Chart Title'},
            legend: {type: 'Legend', position: 'right', charts: ['bars', 'lines']}
          }
        };
      })
    ```
    @method d3.compose.xy
    @for extensions
    @param {Object} options
    @param {Object} [options.charts] Standard d3.compose charts options
    @param {Object} [options.components] Standard d3.compose components options
    @param {Object} [options.axes] Set of axes components with defaults (type: 'Axis', position: (by key: x -> 'bottom', y -> 'left', x2 -> 'top', y2: 'right')) and 'title' that creates matched title component
    @param {String|Object} [options.title] Title text (with defaults) or options
    @param {Boolean|Object} [options.legend] Show legend (with defaults) or legend options
  */
  d3.compose.xy = function xy(options) {
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

})(d3, d3.compose.helpers);
