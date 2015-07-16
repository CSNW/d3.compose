(function(d3, _) {

  /**
    `d3.compose.helpers` includes general purpose helpers that are used throughout d3.compose.
    Includes convenience functions for create charts/components (`property`, `di`, and `mixin`),
    helpful calculations (`dimensions`, `max`, and `min`) and other common behavior.

    @class helpers
  */

  var slice = Array.prototype.slice;
  utils = {
    contains: _.contains,
    compact: _.compact,
    difference: _.difference,
    defaults: _.defaults,
    each: _.each,
    extend: _.extend,
    flatten: _.flatten,
    filter: _.filter,
    find: _.find,
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
    keys: Object.keys,
    map: _.map,
    pluck: _.pluck,
    reduce: _.reduce,
    reduceRight: _.reduceRight,
    sortBy: _.sortBy,
    uniq: _.uniq
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
        if (utils.isFunction(options.validate) && !utils.isUndefined(value) && !options.validate.call(this, value))
          throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

        getSet.previous = properties[name];
        properties[name] = value;

        if (utils.isFunction(options.set) && !utils.isUndefined(value)) {
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
        width: d3.max([client.width, attr.width || bbox.width]) || 0,
        height: d3.max([client.height, attr.height || bbox.height]) || 0
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
        domain = utils.uniq(utils.flatten(utils.map(data, function(series) {
          if (series && series.values)
            return utils.map(series.values, getValue);
        })));
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
    mixins = utils.isArray(mixins) ? mixins : slice.call(arguments);
    var mixed = utils.extend.apply(null, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = slice.call(arguments);

        mixins.forEach(function(extension) {
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
