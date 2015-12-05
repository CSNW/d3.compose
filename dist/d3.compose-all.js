/*!
 * d3.compose - Compose complex, data-driven visualizations from reusable charts and components with d3
 * v0.15.11 - https://github.com/CSNW/d3.compose - license: MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3'), require('d3.chart')) :
  typeof define === 'function' && define.amd ? define(['d3', 'd3.chart'], factory) :
  global.d3c = factory(global.d3,global.d3_chart);
}(this, function (d3,d3_chart) { 'use strict';

  d3 = 'default' in d3 ? d3['default'] : d3;

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
    onDataBind: function onDataBind(/* selection, data */) {},

    /**
      Called for standard layer's `insert`

      @method onInsert
      @param {d3.selection} selection
      @return {d3.selection}
    */
    onInsert: function onInsert(/* selection */) {},

    /**
      Call for standard layer's `events['enter']`

      @method onEnter
      @param {d3.selection} selection
    */
    onEnter: function onEnter(/* selection */) {},

    /**
      Call for standard layer's `events['enter:transition']`

      @method onEnterTransition
      @param {d3.selection} selection
    */
    // onEnterTransition: function onEnterTransition(selection) {},

    /**
      Call for standard layer's `events['update']`

      @method onUpdate
      @param {d3.selection} selection
    */
    onUpdate: function onUpdate(/* selection */) {},

    /**
      Call for standard layer's `events['update']`

      @method onUpdateTransition
      @param {d3.selection} selection
    */
    // onUpdateTransition: function onUpdateTransition(selection) {},

    /**
      Call for standard layer's `events['merge']`

      @method onMerge
      @param {d3.selection} selection
    */
    onMerge: function onMerge(/* selection */) {},

    /**
      Call for standard layer's `events['merge:transition']`

      @method onMergeTransition
      @param {d3.selection} selection
    */
    // onMergeTransition: function onMergeTransition(selection) {},

    /**
      Call for standard layer's `events['exit']`

      @method onExit
      @param {d3.selection} selection
    */
    onExit: function onExit(/* selection */) {}

    /**
      Call for standard layer's `events['exit:transition']`

      @method onExitTransition
      @param {d3.selection} selection
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

  // Many utils inlined from Underscore.js
  // (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors

  var slice = Array.prototype.slice;
  var toString = Object.prototype.toString;

  function _extend(target, extensions, undefined_only) {
    for (var i = 0, length = extensions.length; i < length; i++) {
      for (var key in extensions[i]) {
        if (!undefined_only || target[key] === void 0)
          target[key] = extensions[i][key];
      }
    }

    return target;
  }

  function contains(arr, item) {
    return arr.indexOf(item) >= 0;
  }

  function compact(arr) {
    return arr.filter(function(item) {
      return item;
    });
  }

  function difference(a, b) {
    return a.filter(function(value) {
      return b.indexOf(value) < 0;
    });
  }

  function defaults(target) {
    return _extend(target, slice.call(arguments, 1), true);
  }

  function extend(target) {
    return _extend(target, slice.call(arguments, 1));
  }

  function flatten(arr) {
    // Assumes all items in arr are arrays and only flattens one level
    return arr.reduce(function(memo, item) {
      return memo.concat(item);
    }, []);
  }

  function find(arr, fn, context) {
    if (!arr) return;
    for (var i = 0, length = arr.length; i < length; i++) {
      if (fn.call(context, arr[i], i, arr))
        return arr[i];
    }
  }

  function first(arr, n) {
    if (arr == null) return void 0;
    if (n == null) return arr[0];
    return Array.prototype.slice.call(arr, 0, n);
  }

  function isBoolean(obj) {
    return obj === true || obj === false;
  }
  function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  }
  function isNumber(obj) {
    return toString.call(obj) === '[object Number]';
  }
  function isString(obj) {
    return toString.call(obj) === '[object String]';
  }
  function isUndefined(obj) {
    return obj === void 0;
  }

  var isFunction = function(obj) {
    return toString.call(obj) === '[object Function]';
  };
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  function objectEach(obj, fn, context) {
    if (!obj) return;
    var keys = Object.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      fn.call(context, obj[keys[i]], keys[i], obj);
    }
  }

  function objectFind(obj, fn, context) {
    if (!obj) return;
    var keys = Object.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      if (fn.call(context, obj[keys[i]], keys[i], obj))
        return obj[keys[i]];
    }
  }

  function pluck(objs, key) {
    if (!objs) return [];
    return objs.map(function(obj) {
      return obj[key];
    });
  }

  function uniq(arr) {
    var result = [];
    for (var i = 0, length = arr.length; i < length; i++) {
      if (result.indexOf(arr[i]) < 0)
        result.push(arr[i]);
    }
    return result;
  }

  function inherits(Child, Parent) {
    Child.prototype = Object.create(Parent.prototype, {
      constructor: {
        value: Child,
        enumerable: false,
        writeable: true,
        configurable: true
      }
    });

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(Child, Parent);
    }
    else {
      Child.__proto__ = Parent; //eslint-disable-line no-proto

      // __proto__ isn't supported in IE,
      // use one-time copy of static properties to approximate
      defaults(Child, Parent);
    }
  }

  // If value isn't `undefined`, return `value`, otherwise use `default_value`
  //
  // @method valueOrDefault
  // @param {Any} [value]
  // @param {Any} default_value
  // @return {Any}
  function valueOrDefault(value, default_value) {
    return !isUndefined(value) ? value : default_value;
  }

  var utils = {
    slice: slice,
    toString: toString,
    contains: contains,
    compact: compact,
    difference: difference,
    defaults: defaults,
    extend: extend,
    flatten: flatten,
    find: find,
    first: first,
    isBoolean: isBoolean,
    isFunction: isFunction,
    isObject: isObject,
    isNumber: isNumber,
    isString: isString,
    isUndefined: isUndefined,
    objectEach: objectEach,
    objectFind: objectFind,
    pluck: pluck,
    uniq: uniq,
    inherits: inherits,
    valueOrDefault: valueOrDefault
  };

  var unique_index = 0;

  /**
    Helper for creating properties for charts/components

    @example
    ```javascript
    var Custom = d3.chart('Chart').extend('Custom', {
      // Create property that's stored internally as 'simple'
      simple: property()
    });
    var custom; // = new Custom(...);

    // set
    custom.simple('Howdy');

    // get
    console.log(custom.simple()); // -> 'Howdy'

    // Advanced
    // --------
    // Default values:
    Custom.prototype.message = property({
      default_value: 'Howdy!'
    });

    console.log(custom.message()); // -> 'Howdy!'
    custom.message('Goodbye');
    console.log(custom.message()); // -> 'Goodbye'

    // Set to undefined to reset to default value
    custom.message(undefined);
    console.log(custom.message()); // -> 'Howdy!'

    // Computed default value:
    Custom.property.computed = property({
      default_value: function() {
        // "this" = Custom instance
        return this.message();
      }
    });

    // Function default value:
    // For function default_values, wrap in function to differentiate from computed
    Custom.property.fn = property({
      default_value: function() {
        return function defaultFn() {};
      }
      // The following would be incorrectly evaluated
      // default_value: function defaultFn() {}
    })

    // Custom getter:
    Custom.prototype.exclaimed = property({
      get: function(value) {
        // Value is the underlying set value
        return value + '!';
      }
    });

    custom.exclaimed('Howdy');
    console.log(custom.exclaimed()); // -> 'Howdy!'

    // Custom setter:
    Custom.prototype.feeling = property({
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
    @for helpers
    @param {Object} [options]
    @param {Any} [options.default_value] default value for property (when set value is `undefined`). If default value is a function, wrap in another function as default_value is evaluated by default.
    @param {Function} [options.get] `function(value) {return ...}` getter, where `value` is the stored value and return desired value
    @param {Function} [options.set] `function(value, previous) {return {override, after}}`. Return `override` to override stored value and `after()` to run after set
    @param {Object} [options.context=this] context to evaluate get/set/after functions
    @return {Function} `()`: get, `(value)`: set
  */
  function property(options) {
    // DEPRECATED: name as first argument
    if (arguments.length == 2) {
      if (typeof console != 'undefined' && console.warn)
        console.warn('DEPRECATED - name argument for property is no longer supported will be removed in the next version of d3.compose');
      options = arguments[1];
    }

    options = options || {};
    var id = 'property_' + unique_index++;

    var property = function(value) {//eslint-disable-line no-shadow
      var properties = this.__properties = this.__properties || {};
      var context = valueOrDefault(property.context, this);

      if (arguments.length)
        return set.call(this);
      else
        return get.call(this);

      function get() {
        value = properties[id];

        if (isUndefined(value)) {
          // Use default value and unwrap if it's a function
          value = property.default_value;
          if (isFunction(value))
            value = value.call(context);
        }

        return isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set() {
        // Validate
        if (isFunction(options.validate) && !isUndefined(value) && !options.validate.call(context, value))
          throw new Error('Invalid value for property: ' + JSON.stringify(value));

        var previous = properties[id];
        properties[id] = value;

        if (isFunction(options.set) && !isUndefined(value)) {
          var response = options.set.call(context, value, previous);

          if (response && 'override' in response)
            properties[id] = response.override;
          if (response && isFunction(response.after))
            response.after.call(context, properties[id]);
        }

        return this;
      }
    };

    // For checking if function is a property
    property.is_property = true;
    property.id = id;
    property.set_from_options = valueOrDefault(options.set_from_options, true);
    property.default_value = options.default_value;
    property.context = options.context;
    property.options = options;

    return property;
  }

  /**
    Combine mixins with Parent super class for extension

    @example
    ```js
    var a = {transform: function() {}, a: 1};
    var b = {initialize: function() {}, b: 2};
    var c = {c: 3};

    var Custom = mixin(Chart, a, b, c).extend({
      initialize: function(options) {
        this._super.initialize.call(this, options);
        // d
      },
      transform: function(data) {
        data = this._super.transform.call(this, data);
        // d
      }
    });

    // initialize: Chart, b, d
    // transform: Chart, a, d
    ```
    @method mixin
    @for helpers
    @param {Function} Parent
    @param {...Object} ...mixins
    @return {Function}
  */
  function mixin(Parent/*, ...mixins*/) {
    var mixins = slice.call(arguments, 1);
    var initializes = [];
    var transforms = [];
    var mixed = {};

    mixins.forEach(function(mix) {
      objectEach(mix, function(value, key) {
        if (key == 'initialize')
          initializes.push(value);
        else if (key == 'transform')
          transforms.push(value);
        else
          mixed[key] = value;
      });
    });

    if (initializes.length) {
      mixed.initialize = function initialize() {
        var args = slice.call(arguments);
        Parent.prototype.initialize.apply(this, args);
        initializes.forEach(function(init) {
          init.apply(this, args);
        }, this);
      };
    }

    if (transforms.length) {
      mixed.transform = function transform(data) {
        data = Parent.prototype.transform.call(this, data);
        return transforms.reduce(function(memo, trans) {
          return trans.call(this, memo);
        }.bind(this), data);
      };
    }

    return Parent.extend(mixed);
  }

  /**
    Stack given array of elements vertically or horizontally

    @example
    ```js
    // Stack all text elements vertically, from the top, with 0px padding
    d3.selectAll('text').call(helpers.stack())

    // Stack all text elements horizontally, from the right, with 5px padding
    d3.selectAll('text').call(helpers.stack({
      direction: 'horizontal',
      origin: 'right',
      padding: 5
    }));
    ```
    @method stack
    @for helpers
    @param {Object} [options]
    @param {String} [options.direction=vertical] `"vertical"` or `"horizontal"`
    @param {String} [options.origin] `"top"`, `"right"`, `"bottom"`, or `"left"` (by default, `"top"` for `"vertical"` and `"left"` for `"horizontal"`)
    @param {Number} [options.padding=0] padding (in px) between elements
    @param {Number} [options.min_height=0] minimum spacing height (for vertical stacking)
    @param {Number} [options.min_width=0]  minimum spacing width (for horizontal stacking)
    @return {Function}
  */
  function stack(options) {
    options = extend({
      direction: 'vertical',
      origin: 'top',
      padding: 0,
      min_height: 0,
      min_width: 0
    }, options);

    // Ensure valid origin based on direction
    if (options.direction == 'horizontal' && !(options.origin == 'left' || options.origin == 'right'))
      options.origin = 'left';
    else if (options.direction == 'vertical' && !(options.origin == 'top' || options.origin == 'bottom'))
      options.origin = 'top';

    function padding(i) {
      return i > 0 && options.padding ? options.padding : 0;
    }

    return function(elements) {
      if (elements && elements.attr) {
        var previous = 0;

        elements.attr('transform', function(d, i) {
          var element_dimensions = this.getBBox();
          var spacing_width = d3.max([element_dimensions.width, options.min_width]);
          var spacing_height = d3.max([element_dimensions.height, options.min_height]);
          var x = 0;
          var y = 0;
          var next_position;

          if (options.direction == 'horizontal') {
            next_position = previous + spacing_width + padding(i);

            if (options.origin == 'left')
              x = previous + padding(i);
            else
              x = next_position;

            previous = next_position;
          }
          else {
            next_position = previous + spacing_height + padding(i);

            if (options.origin == 'top')
              y = previous + padding(i);
            else
              y = next_position;

            previous = next_position;
          }

          return translate(x, y);
        });
      }
    };
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

    // Calculate domain for data
    var scale = createScale({
      type: 'log',
      data: [{y: 1}, {y: 100}, {y: 2000}, {y: 5000}],
      key: 'y'
    });

    // Scale is passed through
    var original = d3.scale.linear();
    var scale = createScale(original);
    scale === original;

    // Set other properties by passing in "arguments" array
    var scale = createScale({
      type: 'ordinal',
      domain: ['a', 'b', 'c', 'd', 'e'],
      rangeRoundBands: [[0, 100], 0.1, 0.05] // -> rangeRoundBands([0, 100], 0.1, 0.05)
    });

    // Use ordinal + adjacent for bar charts
    var scale = createScale({
      type: 'ordinal',
      adjacent: true,
      domain: ['a', 'b', 'c'],
      series: 2 // Series count is required for adjacent if data isn't given
    })
    ```
    @method createScale
    @for helpers
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
    if (isFunction(options))
      return options;

    // Create scale (using d3.time.scale() if type is 'time')
    var scale;
    if (options.type == 'time')
      scale = d3.time.scale();
    else if (d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    objectEach(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through internal options)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (!contains(['type', 'data', 'value', 'key', 'centered', 'adjacent', 'series', 'padding'], key))
          scale[key].apply(scale, value);
      }
    });

    if (!options.domain && options.data && (options.key || options.value))
      scale = setDomain(scale, options);

    // Add centered and adjacent extensions to ordinal
    // (centered by default for ordinal)
    var centered = options.centered || (options.type == 'ordinal' && options.centered == null);
    if (options.type == 'ordinal' && (centered || options.adjacent))
      scale = addCentered(scale, options);

    // Add padding extension to ordinal
    if (options.type == 'ordinal' && (options.padding != null || centered || options.adjacent))
      scale = addPadding(scale, options);

    return scale;
  }

  function setDomain(scale, options) {
    // Use value "di" or create for key
    var getValue = options.value || function(d) {
      return d[options.key];
    };

    // Enforce series data
    var data = options.data;
    if (!isSeriesData(data))
      data = [{values: data}];

    var domain;
    if (options.type == 'ordinal') {
      // Domain for ordinal is array of unique values
      domain = uniq(flatten(data.map(function(series) {
        if (series && series.values)
          return series.values.map(getValue);
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
    return scale;
  }

  function addCentered(original, options) {
    // Get series count for adjacent
    var series_count = options.series || (!isSeriesData(options.data) ? 1 : options.data.length);

    // TODO Look into removing closure
    var scale = (function(original, options, series_count) {//eslint-disable-line no-shadow
      var context = function(value, series_index) {
        var width = context.width();

        if (!options.adjacent)
          series_index = 0;

        return original(value) + (0.5 * width) + (width * (series_index || 0));
      };
      extend(context, original, {
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

    return scale;
  }

  function addPadding(scale, options) {
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
    return scale;
  }

  /**
    Helper for robustly determining width/height of given selector.
    Checks dimensions from css, attributes, and bounding box.

    @method dimensions
    @for helpers
    @param {d3.Selection} selection
    @return {Object} `{width, height}`
  */
  function dimensions(selection) {
    // 1. Get width/height set via css (only valid for svg and some other elements)
    var client = clientDimensions(selection);

    if (client.width && client.height)
      return client;

    // 2. Get width/height set via attribute
    var attr = attrDimensions(selection);

    if (isSVG(selection)) {
      return {
        width: client.width != null ? client.width : attr.width || 0,
        height: client.height != null ? client.height : attr.height || 0
      };
    }
    else {
      var bbox = bboxDimensions(selection);

      // Size set by css -> client (only valid for svg and some other elements)
      // Size set by svg -> attr override or bounding_box
      // -> Take maximum
      return {
        width: d3.max([client.width, attr.width || bbox.width]) || 0,
        height: d3.max([client.height, attr.height || bbox.height]) || 0
      };
    }
  }

  function clientDimensions(selection) {
    var element = selection.node();
    var width = element && element.clientWidth;
    var height = element && element.clientHeight;

    // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
    //        calculate from css
    //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
    //        Note: This makes assumptions about the box model in use and that width/height are not percent values
    if (isSVG(selection) && (!element.clientWidth || !element.clientHeight) && typeof window !== 'undefined' && window.getComputedStyle) {
      var styles = window.getComputedStyle(element);
      height = parseFloat(styles.height) - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth);
      width = parseFloat(styles.width) - parseFloat(styles.borderLeftWidth) - parseFloat(styles.borderRightWidth);
    }

    return {
      width: width && !isNaN(width) ? width : null,
      height: height && !isNaN(height) ? height : null
    };
  }

  function attrDimensions(selection) {
    return {
      width: selection && selection.attr && parseFloat(selection.attr('width')),
      height: selection && selection.attr && parseFloat(selection.attr('height'))
    };
  }

  function bboxDimensions(selection) {
    var element = selection.node();
    var bbox;
    try {
      bbox = element && typeof element.getBBox == 'function' && element.getBBox();
    }
    catch(ex) {
      // Firefox throws error when calling getBBox when svg hasn't been displayed
      // Ignore error and set to empty
      bbox = {width: 0, height: 0};
    }

    return bbox;
  }

  function isSVG(selection) {
    return selection.node().nodeName == 'svg';
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
    if (isObject(x)) {
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
    rotation += ')';

    return rotation;
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

      var element_style = window.getComputedStyle(element);
      var css_font_size = parseFloat(element_style['font-size']);
      var css_line_height = parseFloat(element_style['line-height']);

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
    catch (ex) {
      // Errors can occur from getBBox and getComputedStyle
      // No useful information for offset, do nothing
    }

    return offset;
  }

  /**
    Determine if given data is likely series data

    @method isSeriesData
    @param {Array} data
    @return {Boolean}
  */
  function isSeriesData(data) {
    var first_item = first(data);
    return first_item && isObject(first_item) && Array.isArray(first_item.values);
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
    var getMax = function(series_data) {
      return series_data && d3.extent(series_data, getValue)[1];
    };

    if (isSeriesData(data)) {
      return data.reduce(function(memo, series) {
        if (series && Array.isArray(series.values)) {
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
    var getMin = function(series_data) {
      return series_data && d3.extent(series_data, getValue)[0];
    };

    if (isSeriesData(data)) {
      return data.reduce(function(memo, series) {
        if (series && Array.isArray(series.values)) {
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

    var keyValues = [];
    objectEach(styles, function(value, key) {
      keyValues.push(key + ': ' + value);
    });
    styles = keyValues.join('; ');

    return styles ? styles + ';' : '';
  }

  /**
    Get formatted margins for varying input

    @method getMargins
    @example
    ```js
    getMargins(4);
    // -> {top: 4, right: 4, bottom: 4, left: 4}

    getMargins({top: 20}, {top: 8, bottom: 8});
    // -> {top: 20, right: 0, bottom: 8, left: 0}
    ```
    @param {Number|Object} margins
    @param {Object} default_margins
    @return {Object}
  */
  function getMargins(margins, default_margins) {
    if (isNumber(margins))
      return {top: margins, right: margins, bottom: margins, left: margins};
    else
      return defaults({}, margins, default_margins, {top: 0, right: 0, bottom: 0, left: 0});
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

  function bindDi(diFn, chart) {
    return function wrapped(d, i, j) {
      return (diFn.original || diFn).call(this, chart, d, i, j);
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

  function createHelper(type) {
    return function(id, options) {
      if (!options) {
        options = id;
        id = undefined;
      }

      return extend({id: id, type: type}, options);
    };
  }

  var types = {
    string: {},
    number: {},
    array: {},
    object: {},
    any: {}
  };

  function checkProp(value, definition) {
    if (definition.validate && !definition.validate(value))
      throw new Error('Invalid value for property: ' + JSON.stringify(value));
  }

  function createPrepare(steps) {
    if (!Array.isArray(steps))
      steps = Array.prototype.slice.call(arguments);

    return function() {
      var selection = this.base;
      var context = this;

      return steps.reduce(function(props, step) {
        return step(selection, props, context);
      }, this.props);
    };
  }

  function createDraw(steps) {
    return function(selection, props) {
      var prepared = prepareSteps(steps, props);

      // TODO transitions
      var selected = prepared.select.call(selection);
      selected.exit().call(prepared.exit);
      selected.call(prepared.update);
      selected.enter().call(prepared.enter);
      selected.call(prepared.merge);
    };
  }

  function prepareSteps(steps, props) {
    steps = defaults({}, steps, {
      select: function() { return this; },
      enter: function() {},
      update: function() {},
      merge: function() {},
      exit: function() { this.remove(); }
    });
    // TODO transitions

    return {
      select: curry(steps.select, props),
      enter: curry(steps.enter, props),
      update: curry(steps.update, props),
      merge: curry(steps.merge, props),
      exit: curry(steps.exit, props)
    };
  }

  function curry(fn) {
    var values = Array.prototype.slice.call(arguments, 1);

    return function() {
      var args = Array.prototype.slice.call(arguments);
      return fn.apply(this, values.concat(args));
    };
  }

  function createTransition(props) {
    return function() {
      if (!isUndefined(props.duration))
        this.duration(props.duration);
      if (!isUndefined(props.delay))
        this.delay(props.delay);
      if (!isUndefined(props.ease))
        this.ease(props.ease);
    };
  }

  function getLayer(selection, id) {
    var layer = selection.select('[data-layer="' + id + '"]');
    if (layer.empty())
      layer = selection.append('g').attr('data-layer', id);

    return layer;
  }

  // TODO Move to Chart/Base
  var architecture = {
    update: function(selection, props) {
      this.base = selection;
      this.props = this.prepareProps(props);
    },
    prepareProps: function(props) {
      var properties = this.constructor && this.constructor.properties;
      if (!properties)
        return props;

      var prepared = extend({}, props);

      objectEach(properties, function(definition, key) {
        var prop = prepared[key];

        if (!isUndefined(prop))
          checkProp(prop, definition);
        else if (definition.getDefault)
          prepared[key] = definition.getDefault(this.base, prepared, this);
      }, this);

      return prepared;
    },
    attach: function(id, Type, selection, props) {
      var attached = this.attached[id];

      if (attached)
        attached.options(props);
      else
        attached = new Type(selection, props);

      attached.draw();
      this.attached[id] = attached;
    },
    detach: function(id) {
      var attached = this.attached[id];
      if (attached) {
        attached.base.remove();
        delete this.attached[id];
      }
    }
  };

  var helpers = {
    property: property,
    dimensions: dimensions,
    translate: translate,
    rotate: rotate,
    alignText: alignText,
    isSeriesData: isSeriesData,
    max: max,
    min: min,
    createScale: createScale,
    style: style,
    getMargins: getMargins,
    stack: stack,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    getParentData: getParentData,
    mixin: mixin,
    createHelper: createHelper,

    types: types,
    checkProp: checkProp,
    createPrepare: createPrepare,
    createDraw: createDraw,
    createTransition: createTransition,
    getLayer: getLayer
  };

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
      @default (use container value, if available)
    */
    delay: property({
      default_value: function() {
        return this.container && this.container.delay && this.container.delay();
      }
    }),

    /**
      Transition duration in milliseconds.

      @property duration
      @type Number|Function
      @default (use container value, if available)
    */
    duration: property({
      default_value: function() {
        return this.container && this.container.delay && this.container.duration();
      }
    }),

    /**
      Transition ease function

      - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
      - Note: arguments to pass to `d3.ease` are not supported

      @property ease
      @type String|Function
      @default (use container value, if available)
    */
    ease: property({
      default_value: function() {
        return this.container && this.container.delay && this.container.ease();
      }
    }),

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
      if (isSeriesData(data)) {
        data = data.map(function(series) {
          return extend({}, series, {
            values: series.values.map(normalizeData)
          });
        });
      }
      else if (Array.isArray(data)) {
        data = data.map(normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        if (!isObject(point))
          point = {x: index, y: point};
        else if (!Array.isArray(point) && isUndefined(point.x))
          point.x = index;

        return point;
      }
    },

    /**
      Get/set x-scale with `d3.scale` or with object (uses `helpers.createScale`)

      @property xScale
      @type Object|d3.scale
    */
    xScale: property({
      set: function(value) {
        var scale = createScale(value);
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
    yScale: property({
      set: function(value) {
        var scale = createScale(value);
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
    xKey: property({
      default_value: 'x'
    }),

    /**
      Key on data object for y-value

      @property yKey
      @type String
      @default 'y'
    */
    yKey: property({
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
    xValue: di(function(chart, d) {
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
    yValue: di(function(chart, d) {
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
      return createScale({
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
      return createScale({
        data: this.data(),
        key: 'y'
      });
    }
  };

  var d3Chart = d3.chart();

  // TEMP Clear namespace from mixins
  /**
    @namespace
  */

  /**
    Shared functionality between all charts and components.

    - Set properties automatically from `options`,
    - Store fully transformed data
    - Adds `"before:draw"` and `"draw"` events
    - Standard `width` and `height` calculations

    @class Base
  */
  function Base(selection, options) {
    // d3.chart() constructor without transform and initialize cascade
    this.base = selection;
    this._layers = {};
    this._attached = {};
    this._events = {};

    // Bind all di-functions to this chart
    bindAllDi(this);

    // Set options (and properties with set_from_options)
    if (options)
      this.options(options);

    // Initialize Chart (relies on explicitly calling super in initialize)
    this.initialize(options);
  }

  inherits(Base, d3Chart);

  extend(Base.prototype, {
    initialize: function() {},
    transform: function(data) {
      return data;
    },
    demux: function(name, data) { return data; },

    // Add events to draw: "before:draw" and "draw"
    draw: function(data) {
      // Transform data (relies on explicitly calling super in transform)
      data = this.transform(data);

      // Store fully-transformed data for reference
      this.data(data);

      this.trigger('before:draw', data);

      objectEach(this._layers, function(layer) {
        layer.draw(data);
      });
      objectEach(this._attached, function(attachment, name) {
        attachment.draw(this.demux(name, data));
      }, this);

      this.trigger('draw', data);
    },

    // Explicitly load d3.chart prototype
    layer: d3Chart.prototype.layer,
    unlayer: d3Chart.prototype.unlayer,
    attach: d3Chart.prototype.attach,
    on: d3Chart.prototype.on,
    once: d3Chart.prototype.once,
    off: d3Chart.prototype.off,
    trigger: d3Chart.prototype.trigger,

    /**
      Store fully-transformed data for direct access from the chart

      @property data
      @type Any
    */
    data: property(),

    /**
      Overall options for chart/component, automatically setting any matching properties.

      @example
      ```js
      var property = d3.compose.helpers.property;

      d3.chart('Base').extend('HasProperties', {
        a: property(),
        b: property({
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
    options: property({
      default_value: {},
      set: function(options, previous) {
        // Clear all unset options, except for data and options
        if (previous) {
          var unset = difference(Object.keys(previous), Object.keys(options));
          unset.forEach(function(key) {
            if (key != 'data' && key != 'options' && isProperty(this, key))
              this[key](undefined);
          }, this);
        }

        objectEach(options, function setFromOptions(value, key) {
          if (isProperty(this, key))
            this[key](value);
        }, this);

        function isProperty(chart, key) {
          return chart[key] && chart[key].is_property && chart[key].set_from_options;
        }
      }
    }),

    /**
      Get width of `this.base`.
      (Does not include `set` for setting width of `this.base`)

      @method width
      @return {Number}
    */
    width: function width() {
      return dimensions(this.base).width;
    },

    /**
      Get height of `this.base`.
      (Does not include `set` for setting height of `this.base`)

      @method height
      @return {Number}
    */
    height: function height() {
      return dimensions(this.base).height;
    }
  });

  Base.extend = function(proto_props, static_props) {
    // name may be first parameter for d3.chart usage
    var name;
    if (isString(proto_props)) {
      name = proto_props;
      proto_props = static_props;
      static_props = arguments[2];
    }

    var Parent = this;
    var Child;

    if (proto_props && proto_props.hasOwnProperty('constructor')) {
      Child = proto_props.constructor;

      // inherits sets constructor, remove from proto_props
      proto_props = extend({}, proto_props);
      delete proto_props.constructor;
    }
    else {
      Child = function() { return Parent.apply(this, arguments); };
    }

    inherits(Child, Parent);
    if (static_props)
      extend(Child, static_props);
    if (proto_props)
      extend(Child.prototype, proto_props);

    // If name is given, register with d3.chart
    if (name)
      d3Chart[name] = Child;

    return Child;
  };

  /**
    Common base for creating components that includes helpers for positioning and layout.

    ### Extending

    `d3.chart('Component')` contains intelligent defaults and there are no required overrides.
    Create a component just like a chart, by creating layers in the `initialize` method in `extend`.

    - To adjust layout calculation, use `prepareLayout`, `getLayout`, and `setLayout`.
    - To layout a component within the chart, use `skip_layout: true` and the static `layer_type: 'chart'`

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
  var Component = Base.extend({
    /**
      Component's position relative to chart
      (top, right, bottom, left)

      @property position
      @type String
      @default 'top'
    */
    position: property({
      default_value: 'top',
      validate: function(value) {
        return contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),

    /**
      Get/set the width of the component (in pixels)
      (used in layout calculations)

      @property width
      @type Number
      @default (actual width)
    */
    width: property({
      default_value: function() {
        return dimensions(this.base).width;
      }
    }),

    /**
      Get/set the height of the component (in pixels)
      (used in layout calculations)

      @property height
      @type Number
      @default (actual height)
    */
    height: property({
      default_value: function() {
        return dimensions(this.base).height;
      }
    }),

    /**
      Margins (in pixels) around component

      @property margins
      @type Object
      @default {top: 0, right: 0, bottom: 0, left: 0}
    */
    margins: property({
      set: function(values) {
        return {
          override: getMargins(values)
        };
      },
      default_value: getMargins()
    }),

    /**
      Center the component vertically/horizontally (depending on position)

      @property centered
      @type Boolean
      @default false
    */
    centered: property({
      default_value: false
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

          // (handle this.centered())

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

      if (this.centered()) {
        var actual_dimensions = dimensions(this.base);
        if ('height' in options)
          y += (options.height - actual_dimensions.height) / 2;
        else
          y += margins.top;

        if ('width' in options)
          x += (options.width - actual_dimensions.width) / 2;
        else
          x += margins.left;
      }
      else {
        x += margins.left;
        y += margins.top;
      }

      this.base.attr('transform', translate(x, y));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  }, {
    properties: {
      position: {
        type: types.string,
        validate: function(value) {
          return contains(['top', 'right', 'bottom', 'left'], value);
        }
      },
      width: {
        type: types.number,
        getDefault: function(selection, props, context) {
          // TODO Move to Component.prepare
          var width = context.width();
          return !isUndefined(width) ? width : dimensions(selection).width;
        }
      },
      height: {
        type: types.number,
        getDefault: function(selection, props, context) {
          // TODO Move to Component.prepare
          var height = context.height();
          return !isUndefined(height) ? height : dimensions(selection).height;
        }
      }
    },

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
    onMouseEnter: function(/* position */) {},

    /**
      (Override) Called when mouse moves within container

      @method onMouseMove
      @param {Object} position (chart and container {x,y} position of mouse)
      @param {Object} position.chart {x, y} position relative to chart origin
      @param {Object} position.container {x, y} position relative to container origin
    */
    onMouseMove: function(/* position */) {},

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
        var update = function update(position) {
          var closest = [];
          if (position)
            closest = getClosestPoints(points, position.chart, tolerance);

          updateActive(active, closest, this.container);
          active = closest;
        }.bind(this);

        this.container.on('mouseenter', function(position) {
          if (!points)
            points = getPoints(this, this.data());

          tolerance = this.hoverTolerance();
          update(position);
        }.bind(this));

        this.container.on('mousemove', update);
        this.container.on('mouseleave', update);
      }.bind(this));
    },

    /**
      Hover tolerance (in px) for calculating close points

      @property hoverTolerance
      @type Number
      @default Infinity
    */
    hoverTolerance: property({
      default_value: Infinity
    })
  };

  function getPoints(chart, data) {
    if (data) {
      if (!isSeriesData(data))
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
    if (!points)
      return [];

    return compact(points.map(function(series) {
      function setDistance(point) {
        point.distance = getDistance(point.meta, position);
        return point;
      }
      function closePoints(point) {
        return point.distance < tolerance;
      }
      function sortPoints(a, b) {
        if (a.distance < b.distance)
          return -1;
        else if (a.distance > b.distance)
          return 1;
        else
          return 0;
      }

      var by_distance = series.map(setDistance).filter(closePoints).sort(sortPoints);

      return by_distance[0];
    }));

    function getDistance(a, b) {
      return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    }
  }

  function updateActive(active, closest, container) {
    var active_keys = pluck(active, 'key');
    var closest_keys = pluck(closest, 'key');

    objectEach(closest, function(point) {
      if (contains(active_keys, point.key))
        container.trigger('mousemove:point', point);
      else
        container.trigger('mouseenter:point', point);
    });
    objectEach(active, function(point) {
      if (!contains(closest_keys, point.key))
        container.trigger('mouseleave:point', point);
    });
  }

  /**
    Mixin for handling labels in charts

    @class Labels
    @namespace mixins
  */
  var Labels$1 = {
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

      var LabelsClass = d3.chart(options.type);
      var base = this.base.append('g').attr('class', 'chart-labels');
      var labels = this._labels = new LabelsClass(base, options);

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
    labels: property({
      get: function(value) {
        if (isBoolean(value))
          value = {display: value};
        else if (!value)
          value = {display: false};

        return defaults({}, value, {
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

    @class LabelsXY
    @namespace mixins
    @extends Labels
  */
  var LabelsXY = extend({}, Labels$1, {
    proxyLabelMethods: ['x', 'y']
  });

  /**
    Mixin for inverting XY calculations with x vertical, increasing bottom-to-top and y horizontal, increasing left-to-right

    @class XYInverted
    @namespace mixins
  */
  var XYInverted = {
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
    Mixin for charts of centered key,value data (x: index, y: value, key)

    @class XYValues
    @namespace mixins
  */
  var XYValues = {
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
      return createScale({
        type: 'ordinal',
        data: this.data(),
        key: 'x',
        centered: true
      });
    }
  };

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
    seriesKey: di(function(chart, d) {
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
    seriesData: di(function() {
      return getParentData(this);
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
    itemStyle: di(function(chart, d) {
      return style(d.style) || null;
    }),

    /**
      Get series count for chart

      @method seriesCount
      @return {Number}
    */
    seriesCount: function() {
      var data = this.data();
      return (data && isSeriesData(data)) ? data.length : 1;
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

          // TODO Exit layer items then exit series layer
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
      return !isSeriesData(data) ? [{values: data}] : data;
    }
  };

  var mixins = {
    Series: Series,
    XY: XY,
    XYValues: XYValues,
    XYInverted: XYInverted,
    Labels: Labels$1,
    LabelsXY: LabelsXY,
    Hover: Hover,
    HoverPoints: HoverPoints,
    Transition: Transition,
    StandardLayer: StandardLayer
  };

  /**
    Gridlines component that draws major ticks for chart

    Uses d3.axis extensions for ticks:

    - `ticks`
    - `tickValues`

    ### Extending

    To extend the `Gridlines` component, the following methods are available

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
    d3.select('#chart').chart('Compose', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      var vertical = d3c.gridlines({
        scale: scales.x,
        orientation: 'vertical'
      });
      var horizontal = d3c.gridlines({
        scale: scales.y,
        orientation: 'horizontal'
      });

      return [
        vertical,
        horizontal
      ];
    });
    ```
    @class Gridlines
  */
  var Mixed$7 = mixin(Component, XY, Transition, StandardLayer);
  var Gridlines = Mixed$7.extend({
    initialize: function(options) {
      Mixed$7.prototype.initialize.call(this, options);

      // Proxy attach to parent for width/height
      var parent = this.options().parent;
      if (parent) {
        this.parent = parent;

        if (parent.container) {
          this.container = parent.container;
          this.trigger('attach');
        }
        else {
          parent.on('attach', function() {
            this.container = parent.container;
            this.trigger('attach');
          }.bind(this));
        }
      }

      // Use standard layer for extensibility
      this.standardLayer('Gridlines', this.base.append('g').attr('class', 'chart-gridlines'));
    },

    /**
      Use horizontal, vertical gridlines

      @property orientation
      @type String
      @default horizontal
    */
    orientation: property({
      default_value: 'horizontal',
      validate: function(value) {
        return contains(['horizontal', 'vertical'], value);
      },
      set: function() {
        // Update scale -> xScale/yScale when position changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),

    /**
      Scale to use for gridlines.
      Can be `d3.scale` or, if `Object` is given, `helpers.createScale` is used.

      @example
      ```js
      // Set with d3.scale directly
      gridlines.scale(d3.scale());

      // or with Object passed to helpers.createScale
      gridlines.scale({data: data, key: 'x'});
      ```
      @property scale
      @type Object|d3.scale
    */
    scale: property({
      set: function(value) {
        if (this.orientation() == 'vertical') {
          this.xScale(value);
          value = this.xScale();
        }
        else {
          this.yScale(value);
          value = this.yScale();
        }

        return {
          override: value
        };
      }
    }),

    // d3.axis extensions
    ticks: property({
      default_value: [10]
    }),
    tickValues: property(),

    drawLine: di(function(chart, d) {
      var x1, x2, y1, y2;
      if (chart.orientation() == 'vertical') {
        x1 = x2 = chart.xScale()(d);
        y1 = 0;
        y2 = chart.height();
      }
      else {
        x1 = 0;
        x2 = chart.width();
        y1 = y2 = chart.yScale()(d);
      }

      d3.select(this)
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y1)
        .attr('y2', y2);
    }),

    width: function width() {
      // Use container's explicit chart width rather than component width (if available)
      return this.container ? this.container.chartPosition().width : dimensions(this.base).width;
    },
    height: function height() {
      // Use container's explicit chart height rather than component width (if available)
      return this.container ? this.container.chartPosition().height : dimensions(this.base).width;
    },

    onDataBind: function onDataBind(selection, data) {
      // [false] is given for display: false when attached from Axis
      var hide = data && data[0] && data[0].y === false;

      var tick_values = this.tickValues();
      if (tick_values == null && !hide) {
        // Get tick values from scale
        var scale = this.orientation() == 'vertical' ? this.xScale() : this.yScale();
        var ticks_args = this.ticks();

        if (!ticks_args)
          ticks_args = [10];
        if (!Array.isArray(ticks_args))
          ticks_args = [ticks_args];

        tick_values = scale.ticks ? scale.ticks.apply(scale, ticks_args) : scale.domain();
      }

      return selection.selectAll('line').data(hide ? [] : tick_values);
    },
    onInsert: function onInsert(selection) {
      return selection.append('line')
        .attr('class', 'chart-gridline');
    },
    onMerge: function onMerge(selection) {
      selection
        .attr('opacity', 0)
        .each(this.drawLine);
    },
    onMergeTransition: function onMergeTransition(selection) {
      selection.attr('opacity', 1);
    },
    onExit: function onExit(selection) {
      selection.remove();
    },

    skip_layout: true
  }, {
    layer_type: 'chart',
    z_index: 55
  });

  var gridlines = createHelper('Gridlines');

  var default_legend_margins = {top: 8, right: 8, bottom: 8, left: 8};

  // TODO Define after Legend
  // Possibly by passing into Legend/wrapping with Legend
  var drawLegend = createDraw({
    select: select,
    enter: enter,
    merge: merge
  });

  /**
    Legend component that can automatically pull chart and series information from d3.compose

    Notes:

    - To exclude a chart from the legend, use `exclude_from_legend = true` in chart prototype or options
    - To exclude a series from the legend, use `exclude_from_legend = true` in series object
    - To add swatch for custom chart, use `Legend.registerSwatch()`

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var input = [{key: 'input', name: 'Input', values: data.input}];
        var output = [
          {key: 'output1', name: 'Output 1', values: data.output1},
          {key: 'output2', name: 'Output 2', values: data.output2}
        ];

        var charts = [
          d3c.lines('a', {data: input}), // ...
          d3c.bars('b', {data: output}) // ...
        ];
        var legend = d3c.legend({charts: ['a', 'b']});

        return [
          [d3c.layered(charts), legend]
        ];
      });

    // -> automatically creates legend from series data for 'a' and 'b'
    //    (Lines Swatch) Input
    //    (Bars Swatch) Output 1
    //    (Bars Swatch) Output 2

    // or, manually set data for legend
    return [
      d3c.legend({
        data: [
          {type: 'Lines', text: 'Input', class: 'series-index-0'},
          {type: 'Bars', text: 'Output 1', class: 'series-index-0'},
          {type: 'Bars', text: 'Output 2', class: 'series-index-1'},
        ]
      })
    };
    ```
    @class Legend
    @extends Component, StandardLayer
  */
  var Mixed$6 = mixin(Component, architecture);
  var Legend = Mixed$6.extend({
    prepare: createPrepare(
      prepareMargins$2,
      prepareLegendData,
      prepareLegend
    ),

    render: function() {
      // TODO Move to lifecycle
      this.update(this.base, this.options());

      var layer = getLayer(this.base, 'legend')
        .classed('chart-legend', true);
      var props = this.prepare();

      drawLegend(layer, props);
    },

    swatchClass: function(props, context, d) {
      return compact(['chart-legend-swatch', d['class']]).join(' ');
    },

    createSwatch: function(props, context, d, i) {
      var swatches = context.constructor.swatches;
      if (!swatches)
        return;

      var swatch = d && d.type && swatches[d.type] || swatches['default'];
      if (!swatch)
        return;

      var selection = d3.select(this);
      swatch.call(selection, context, d, i);
    },

    getLegendData: function(chart, series, series_index) {
      return {
        text: series.name || 'Series ' + (series_index + 1),
        key: chart.id + '.' + (series.key || series_index),
        type: chart.type,
        'class': compact([
          'chart-series',
          'chart-index-' + series_index,
          chart.options()['class'],
          series['class']
        ]).join(' ')
      };
    },

    // TODO
    // _itemDetails: function _itemDetails(d, i) {
    //   return {
    //     legend: this,
    //     d: d,
    //     i: i
    //   };
    // },

    // === TODO Remove, compatibility with current system
    initialize: function() {
      Mixed$6.prototype.initialize.apply(this, arguments);
      this.attached = {};
    },
    draw: function() {
      this.render();
    },
    swatchDimensions: function() {
      return this.props.swatchDimensions;
    }
    // ===
  }, {
    properties: extend({}, Component.properties, {
      /**
        Array of chart keys from container to display in legend

        @example
        ```js
        d3.select('#chart')
        .chart('Compose', function(data) {
          var charts = [
            {id: 'a'},
            {id: 'b'},
            {id: 'c'}
          ];
          var legend = d3c.legend({charts: ['a', 'c']});

          return [
            [d3c.layered(charts), legend]
          ];
        });
        ```
        @property charts
        @type Array
      */
      charts: {
        type: types.array
      },

      /**
        Dimensions of "swatch" in px

        @property swatchDimensions
        @type Object
        @default {width: 20, height: 20}
      */
      swatchDimensions: {
        type: types.object,
        getDefault: function() {
          return {width: 20, height: 20};
        }
      },

       /**
        Margins (in pixels) around legend

        @property margins
        @type Object
        @default {top: 8, right: 8, bottom: 8, left: 8}
      */
      margins: {
        type: types.any,
        getDefault: function() {
          return default_legend_margins;
        }
      },

      /**
        Direction to "stack" legend, "vertical" or "horizontal".
        (Default is set based on position: top/bottom = "horizontal", left/right = "vertical")

        @property stackDirection
        @type String
        @default (based on position)
      */
      stackDirection: {
        type: types.string,
        validate: function(value) {
          return contains(['vertical', 'horizontal'], value);
        },
        getDefault: function(selection, props) {
          var direction_by_position = {
            top: 'horizontal',
            right: 'vertical',
            bottom: 'horizontal',
            left: 'vertical'
          };
          return direction_by_position[props.position];
        }
      }
    }),

    z_index: 200,
    swatches: {
      'default': function(chart) {
        var swatch_dimensions = chart.swatchDimensions();

        this.append('circle')
          .attr('cx', swatch_dimensions.width / 2)
          .attr('cy', swatch_dimensions.height / 2)
          .attr('r', d3.min([swatch_dimensions.width, swatch_dimensions.height]) / 2)
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
      @param {Array|String} types Chart type(s)
      @param {Function} create "di" function that inserts swatch
    */
    registerSwatch: function(chart_types, create) {
      if (!Array.isArray(chart_types))
        chart_types = [chart_types];

      chart_types.forEach(function(chart_type) {
        this.swatches[chart_type] = create;
      }, this);
    }
  });

  function prepareMargins$2(selection, props) {
    return extend({}, props, {
      margins: getMargins(props.margins, default_legend_margins)
    });
  }

  function prepareLegendData(selection, props, context) {
    // Pull legend data from charts, if specified
    var data = props.data;
    if (props.charts) {
      var charts = context.container.charts();
      data = props.charts.reduce(function(combined_data, chart_id) {
        var chart = find(charts, function(find_chart) {
          return find_chart.id == chart_id;
        });

        // Check for exclude from legend option
        if (!chart || chart.exclude_from_legend || chart.options().exclude_from_legend)
          return combined_data;

        var chart_data = context.container.demux(chart_id, context.container.data());
        if (!isSeriesData(chart_data))
          chart_data = [{values: chart_data}];

        var legend_data = chart_data.reduce(function(memo, series, index) {
          if (series && !series.exclude_from_legend)
            memo.push(context.getLegendData(chart, series, index));

          return memo;
        }, []);

        return combined_data.concat(legend_data);
      }, []);
    }

    return extend({}, props, {
      data: data
    });
  }

  function prepareLegend(selection, props, context) {
    var data = props.data.map(function(d, i) {
      return extend({}, d, {
        'class': context.swatchClass(props, context, d, i)
      });
    });

    return extend({}, props, {
      data: data,
      createSwatch: curry(context.createSwatch, props, context)
    });
  }

  function select(props) {
    return this.selectAll('.chart-legend-group')
      .data(props.data, function(d) { return d.key; });
  }

  function enter(props) {
    var groups = this.append('g')
      .attr('class', 'chart-legend-group')
      .style({'pointer-events': 'all'});
      // TODO
      // .on('mouseenter', function(d, i) {
      //   this.container.trigger('mouseenter:legend', this._itemDetails(d, i));
      // }.bind(this))
      // .on('mousemove', function(d, i) {
      //   this.container.trigger('mousemove:legend', this._itemDetails(d, i));
      // }.bind(this))
      // .on('mouseleave', function(d, i) {
      //   this.container.trigger('mouseleave:legend', this._itemDetails(d, i));
      // }.bind(this));

    groups.append('g')
      .attr('width', props.swatchDimensions.width)
      .attr('height', props.swatchDimensions.height)
      .attr('class', 'chart-legend-swatch');
    groups.append('text')
      .attr('class', 'chart-legend-label');

    groups.append('rect')
      .attr('class', 'chart-legend-hover')
      .style({visibility: 'hidden'});
  }

  function merge(props) {
    var size = props.swatchDimensions;
    var swatch = this.select('.chart-legend-swatch');

    swatch
      .attr('class', function(d) { return d['class']; })
      .selectAll('*').remove();

    swatch.each(props.createSwatch);

    this.select('.chart-legend-label')
      .text(function(d) { return d.text; })
      .each(function() {
        // Vertically center text
        var offset = alignText(this, size.height);
        d3.select(this)
          .attr('transform', translate(size.width + 5, offset));
      });

    // Position groups after positioning everything inside
    this.call(stack({
      direction: props.stackDirection,
      origin: 'top',
      padding: 5,
      min_height: size.height,
      min_width: size.width
    }));

    // Position hover listeners
    var sizes = [];
    this.each(function() {
      sizes.push(this.getBBox());
    });
    this.select('.chart-legend-hover').each(function(d, i) {
      var item_size = sizes[i];
      var transform = null;

      if (item_size.height > item_size.height) {
        var offset = (item_size.height - item_size.height) / 2;
        transform = translate(0, -offset);
      }

      d3.select(this)
        .attr('width', item_size.width)
        .attr('height', item_size.height)
        .attr('transform', transform);
    });
  }

  // Create line swatch for Line and LineValues
  Legend.registerSwatch(['Lines'], function(chart) {
    var swatch_dimensions = chart.swatchDimensions();

    return this.append('line')
      .attr('x1', 0).attr('y1', swatch_dimensions.height / 2)
      .attr('x2', swatch_dimensions.width).attr('y2', swatch_dimensions.height / 2)
      .attr('class', 'chart-line');
  });

  // Create bars swatch for Bars and StackedBars
  Legend.registerSwatch(['Bars', 'StackedBars', 'HorizontalBars', 'HorizontalStackedBars'], function(chart) {
    var swatch_dimensions = chart.swatchDimensions();

    return this.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', swatch_dimensions.width).attr('height', swatch_dimensions.height)
      .attr('class', 'chart-bar');
  });

  var legend = createHelper('Legend');

  /**
    Legend positioned within chart bounds.

    @class InsetLegend
    @extends Legend
  */
  var InsetLegend = Legend.extend({
    render: function() {
      Legend.prototype.render.call(this);

      var layer = getLayer(this.base, 'legend');
      var transform = getTransform(layer, this.props);

      layer.attr('transform', transform);
    },

    skip_layout: true
  }, {
    properties: extend({}, Legend.properties, {
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
      translation: {
        type: types.object,
        getDefault: function() {
          return {x: 10, y: 0, relative_to: 'left-top'};
        }
      }
    }),

    layer_type: 'chart'
  });

  function getTransform(layer, props) {
    var value = props.translation;
    var x = value.x || 0;
    var y = value.y || 0;
    var relative_to_x = (value.relative_to && value.relative_to.split('-')[0]) || 'left';
    var relative_to_y = (value.relative_to && value.relative_to.split('-')[1]) || 'top';
    var size = dimensions(layer);

    if (relative_to_x === 'right')
      x = props.width - size.width - x;
    if (relative_to_y === 'bottom')
      y = props.height - size.height - y;

    return translate(x, y);
  }

  var insetLegend = createHelper('InsetLegend');

  /**
    Add text to a chart.

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          components: {
            title: {
              type: 'Text',
              position: 'top'
              text: 'Main Title',
              textAlign: 'left',
              'class': 'title'
            },
            notes: {
              type: 'Text',
              position: 'bottom',
              text: 'Notes',
              'class': 'notes'
            }
          }
        };
      });
    ```
    @class Text
    @extends Component, StandardLayer
  */
  var Mixed$4 = mixin(Component, architecture);
  var Text = Mixed$4.extend({
    prepare: createPrepare(
      prepareText
    ),

    render: function() {
      // TODO Move to lifecycle
      this.update(this.base, this.options());

      var layer = getLayer(this.base, 'text')
        .classed('chart-text', true);
      var props = this.prepare();

      drawText(layer, props);
    },

    // === TODO Remove, compatibility with current system
    initialize: function() {
      Mixed$4.prototype.initialize.apply(this, arguments);
      this.attached = {};
    },
    draw: function() {
      this.render();
    }
    // ===
  }, {
    properties: extend({}, Component.properties, {
      /**
        Text to display

        @property text
        @type String
      */
      text: types.string,

      /**
        Rotation of text

        @property rotation
        @type Number
        @default 0
      */
      rotation: {
        type: types.number,
        getDefault: function() {
          return 0;
        }
      },

      /**
        Horizontal text-alignment of text (`"left"`, `"center"`, or `"right"`)

        @property textAlign
        @type String
        @default "center"
      */
      textAlign: {
        type: types.string,
        validate: function(value) {
          return contains(['left', 'center', 'right'], value);
        },
        getDefault: function() {
          return 'center';
        }
      },

      /**
        text-anchor for text (`"start"`, `"middle"`, or `"end"`)

        @property anchor
        @type String
        @default (set by `textAlign`)
      */
      anchor: {
        type: types.string,
        validate: function(value) {
          return contains(['start', 'middle', 'end', 'inherit'], value);
        },
        getDefault: function(selection, props) {
          return {
            left: 'start',
            center: 'middle',
            right: 'end'
          }[props.textAlign];
        }
      },

      /**
        Vertical aligment for text (`"top"`, `"middle"`, `"bottom"`)

        @property verticalAlign
        @type String
        @default "middle"
      */
      verticalAlign: {
        type: types.string,
        validate: function(value) {
          return contains(['top', 'middle', 'bottom'], value);
        },
        getDefault: function() {
          return 'middle';
        }
      },

      /**
        Style object containing styles for text

        @property style
        @type Object
        @default {}
      */
      style: {
        type: types.object,
        getDefault: function() {
          return {};
        }
      }
    }),

    z_index: 70
  });

  function prepareText(selection, props) {
    // Calculate transform
    var x = {
      left: 0,
      center: props.width / 2,
      right: props.width
    }[props.textAlign];
    var y = {
      top: 0,
      middle: props.height / 2,
      bottom: props.height
    }[props.verticalAlign];

    var translation = translate(x, y);
    var rotation = rotate(props.rotation);
    var transform = translation + ' ' + rotation;

    return extend({}, props, {
      transform: transform
    });
  }

  function drawText(selection, props) {
    var text_selection = selection.selectAll('text');

    if (text_selection.empty())
      text_selection = selection.append('text');

    text_selection
      .attr('transform', props.transform)
      .attr('style', style(props.style))
      .attr('text-anchor', props.anchor)
      .attr('class', props['class'])
      .text(props.text);
  }

  function textOptions(id, options, default_options) {
    if (!options) {
      options = id;
      id = undefined;
    }
    if (isString(options))
      options = {text: options};

    return extend({id: id}, default_options, options);
  }

  function text(id, options) {
    return textOptions(id, options, {type: 'Text'});
  }

  /**
    Title component that extends Text with defaults (styling, sensible margins, and rotated when positioned left or right)

    @class Title
    @extends Text
  */
  var Title = Text.extend({
    prepare: createPrepare(
      prepareMargins,
      prepareText
    ),

    render: function() {
      Text.prototype.render.call(this);
      getLayer(this.base, 'text').classed('chart-title', true);
    },

    // === TODO Remove, compatibility with current system
    margins: function() {
      return this.props.margins;
    }
    // ===
  }, {
    properties: extend({}, Text.properties, {
      /**
        Margins (in pixels) around Title

        @property margins
        @type Object
        @default (set based on `position`)
      */
      margins: {
        type: types.any,
        getDefault: function(selection, props) {
          return defaultMargins(props.position);
        }
      },

      /**
        Rotation of title. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

        @property rotation
        @type Number
        @default (set based on `position`)
      */
      rotation: extend({}, Text.properties.rotation, {
        getDefault: function(selection, props) {
          var rotate_by_position = {
            right: 90,
            left: -90
          };

          return rotate_by_position[props.position] || 0;
        }
      })
    })
  });

  function prepareMargins(selection, props) {
    return extend({}, props, {
      margins: getMargins(props.margins, defaultMargins(props.position))
    });
  }

  function defaultMargins(position) {
    var default_margin = 8;
    var margins_by_position = {
      top: {top: default_margin, bottom: default_margin},
      right: {right: default_margin, left: default_margin},
      bottom: {top: default_margin, bottom: default_margin},
      left: {right: default_margin, left: default_margin}
    };
    return getMargins(margins_by_position[position]);
  }

  function title(id, options) {
    return textOptions(id, options, {type: 'Title'});
  }

  /**
    Axis title component that extends Title with defaults (styling)

    @class AxisTitle
    @extends Title
  */
  var AxisTitle = Title.extend({
    prepare: createPrepare(
      prepareMargins$1,
      prepareText
    ),

    setLayout: function(x, y, options) {
      Title.prototype.setLayout.call(this, x, y, options);
    },

    render: function() {
      Title.prototype.render.call(this);
      getLayer(this.base, 'text')
        .classed('chart-title', false)
        .classed('chart-axis-title', true);
    }
  }, {
    properties: extend({}, Title.properties, {
      /**
        Margins (in pixels) around axis title

        @property margins
        @type Object
        @default (set based on `position`)
      */
      margins: extend({}, Title.properties.margins, {
        getDefault: function(selection, props) {
          return defaultMargins$1(props.position);
        }
      })
    })
  });

  function prepareMargins$1(selection, props) {
    return extend({}, props, {
      margins: getMargins(props.margins, defaultMargins$1(props.position))
    });
  }

  function defaultMargins$1(position) {
    var default_margin = 8;
    var margins_by_position = {
      top: {top: default_margin / 2, bottom: default_margin},
      right: {left: default_margin / 2, right: default_margin},
      bottom: {bottom: default_margin / 2, top: default_margin},
      left: {right: default_margin / 2, left: default_margin}
    };

    return getMargins(margins_by_position[position]);
  }

  function axisTitle(id, options) {
    return textOptions(id, options, {type: 'AxisTitle'});
  }

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

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var scales = {
          x: {data: data, key: 'x'},
          y: {data: data, key: 'y'}
        };

        var charts = [];
        var xAxis = d3c.axis({scale: scales.x});
        var yAxis = d3c.axis({scale: scales.y});

        return [
          // Display y-axis to left of charts
          [yAxis, d3c.layered(charts)],

          // Display x-axis below charts
          xAxis
        ];
      });
    ```
    @class Axis
    @extends Component, Transition
  */
  var Mixed$5 = mixin(Component, Transition, architecture);

  var Axis = Mixed$5.extend({
    prepare: createPrepare(
      prepareScales,
      prepareAxis,
      prepareGridlines
    ),

    render: function() {
      // TODO Move to lifecycle
      // also, update is called on getLayout and render
      // to get up-to-date width/height defaults in scales
      // will need to move width/height and scale to prepare
      // (rather than getDefaults)
      this.update(this.base, this.options());

      var props = this.prepare();
      var layer = getLayer(this.base, 'axis')
        .attr('class', 'chart-axis')
        .attr('transform', props.transform);

      if (props.gridlines) {
        var gridlines_layer = getLayer(this.base, 'gridlines')
          .attr('class', 'chart-axis-gridlines');
        this.attach('gridlines', Gridlines, gridlines_layer, props.gridlines);
      }
      else {
        this.detach('gridlines');
      }

      drawAxis(layer, {axis: props.axis, transition: props.transition});
    },

    getLayout: function() {
      // TODO Move to lifecycle
      this.update(this.base, this.options());

      // Draw layout axis
      var props = {
        axis: this.prepare().axis
      };
      var layer = getLayer(this.base, 'layout')
        .attr('class', 'chart-axis chart-layout')
        .style({display: 'none'});

      drawAxis(layer, props);

      // Calculate layout
      // (make layout axis visible for width calculations in Firefox)
      layer.style({display: 'block'});

      var label_overhang = getLabelOverhang(layer, this.props.orientation);

      layer.style({display: 'none'});

      return {
        position: this.props.position,
        width: label_overhang.width,
        height: label_overhang.height
      };
    },
    setLayout: function() {
      // Axis is positioned as chart layer, so don't set layout
    },

    // === TODO Remove, compatibility with current system
    initialize: function() {
      Mixed$5.prototype.initialize.apply(this, arguments);
      this.attached = {};
    },
    draw: function() {
      this.render();
    }
    // ===
  }, {
    properties: extend({}, Component.properties, {
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
      scale: types.any,

      /**
        {x,y} translation of axis relative to chart
        (set by default based on position)

        @property translation
        @type Object
        @default (set based on position)
      */
      translation: {
        type: types.object,
        getDefault: function(selection, props) {
          return {
            top: {x: 0, y: 0},
            right: {x: props.width, y: 0},
            bottom: {x: 0, y: props.height},
            left: {x: 0, y: 0}
          }[props.position];
        }
      },

      /**
        Axis orient for ticks
        (set by default based on position)

        @property orient
        @type String
        @default (set based on position)
      */
      orient: {
        type: types.string,
        getDefault: function(selection, props) {
          return props.position;
        }
      },

      /**
        Axis orientation (vertical or horizonal)

        @property orientation
        @type String
        @default (set based on position)
      */
      orientation: {
        type: types.string,
        validate: function(value) {
          return contains(['horizontal', 'vertical'], value);
        },
        getDefault: function(selection, props) {
          return {
            top: 'horizontal',
            right: 'vertical',
            bottom: 'horizontal',
            left: 'vertical',
            x0: 'vertical',
            y0: 'horizontal'
          }[props.position];
        }
      },

      /**
        Attach gridlines for axis
        (`true` to show with default options, `{...}` to pass options to `Gridlines`)

        @property gridlines
        @type Boolean|Object
        @default false
      */
      gridlines: types.any,

      ticks: types.any,
      tickValues: types.any,
      tickSize: types.any,
      innerTickSize: types.any,
      outerTickSize: types.any,
      tickPadding: types.any,
      tickFormat: types.any
    }),

    layer_type: 'chart',
    z_index: 60
  });

  // TODO Move to xy.prepare
  function prepareScales(selection, props) {
    var xScale = props.orientation == 'horizontal' ? props.scale : props.xScale;
    if (!xScale)
      xScale = XY.getDefaultXScale.call({data: function() { return props.data; }});

    xScale = createScale(xScale);
    XY.setXScaleRange.call({width: function() { return props.width; }}, xScale);

    var yScale = props.orientation == 'vertical' ? props.scale : props.yScale;
    if (!yScale)
      yScale = XY.getDefaultYScale.call({data: function() { return props.data; }});

    yScale = createScale(yScale);
    XY.setYScaleRange.call({height: function() { return props.height; }}, yScale);

    return extend({}, props, {
      xScale: xScale,
      yScale: yScale,
      scale: props.orientation == 'vertical' ? yScale : xScale
    });
  }

  function prepareAxis(selection, props, context) {
    var axis = {
      scale: props.scale,
      orient: props.orient,
      ticks: props.ticks,
      tickValues: props.tickValues,
      tickSize: props.tickSize,
      innerTickSize: props.innerTickSize,
      outerTickSize: props.outerTickSize,
      tickPadding: props.tickPadding,
      tickFormat: props.tickFormat
    };
    var transform = translate(props.translation);
    var transition = {
      // Pull properties from Transition mixin
      duration: context.duration(),
      delay: context.delay(),
      ease: context.ease()
    };

    return extend({}, props, {
      axis: axis,
      transform: transform,
      transition: transition
    });
  }

  function prepareGridlines(selection, props, context) {
    var gridlines = props.gridlines;

    if (gridlines) {
      if (isBoolean(gridlines))
        gridlines = {};

      gridlines = defaults({}, gridlines, {
        parent: context,
        xScale: props.xScale,
        yScale: props.yScale,
        ticks: props.ticks,
        tickValues: props.tickValues,
        orientation: props.orientation == 'horizontal' ? 'vertical' : 'horizontal'
      });
    }

    return extend({}, props, {gridlines: gridlines});
  }

  function drawAxis(selection, props) {
    var axis = createAxis(props.axis);

    if (props.transition && !selection.selectAll('*').empty())
      selection = selection.transition().call(createTransition(props.transition));

    selection.call(axis);
  }

  function createAxis(props) {
    var axis = d3.svg.axis();
    var array_extensions = ['tickValues'];

    objectEach(props, function(value, key) {
      if (!isUndefined(value)) {
        // If value is array, treat as arguments array
        // otherwise, pass in directly
        if (Array.isArray(value) && !contains(array_extensions, key))
          axis[key].apply(axis, value);
        else
          axis[key](value);
      }
    });

    return axis;
  }

  function getLabelOverhang(selection, orientation) {
    // TODO Look into overhang relative to chartBase (for x0, y0)
    var overhangs = {width: [0], height: [0]};

    selection.selectAll('g').each(function() {
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
      width: d3.max(overhangs.width),
      height: d3.max(overhangs.height)
    };
  }

  var axis = createHelper('Axis');

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

      centered: helpers.property({
        default_value: true
        // can be automatically set from options object
      })
    });
    ```
    @class Chart
    @extends Base
  */
  var Chart = Base.extend({}, {
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
  var Mixed$2 = mixin(Chart, Series, XY, Hover, Transition, StandardLayer);
  var Labels = Mixed$2.extend({
    initialize: function(options) {
      Mixed$2.prototype.initialize.call(this, options);

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
      data = Mixed$2.prototype.transform.call(this, data);

      if (!isSeriesData(data))
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
    format: property({
      set: function(value) {
        if (isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),

    /**
      Label position relative to data point
      (top, right, bottom, or left)

      Additionally, `(a)|(b)` can be used to set position to `a` if y-value >= 0 and `b` otherwise,
      where `a` and `b` are `top`, `right`, `bottom`, or `left`

      For more advanced positioning, a "di" function can be specified to set position per label

      @example
      ```js
      labels.position('top'); // top for all values
      labels.position('top|bottom'); // top for y-value >= 0, bottom otherwise
      labels.position(function(d, i) { return d.x >= 0 ? 'right' : 'left'; });
      ```
      @property position
      @type String|Function
      @default top|bottom
    */
    position: property({
      default_value: 'top|bottom',
      get: function(value) {
        if (isString(value) && value.indexOf('|') >= 0) {
          var chart = this;
          var parts = value.split('|');
          return function(d, i, j) {
            var y_value = chart.yValue.call(this, d, i, j);
            return y_value >= 0 ? parts[0] : parts[1];
          };
        }
        else {
          return value;
        }
      }
    }),

    /**
      Offset between data point and label
      (if `Number` is given, offset is set based on position)

      @property offset
      @type Number|Object
      @default 0
    */
    offset: property({
      default_value: 0
    }),

    /**
      Padding between text and label background

      @property padding
      @type Number
      @default 1
    */
    padding: property({default_value: 1}),

    /**
      Define text anchor (start, middle, or end)

      (set by default based on label position)

      @property anchor
      @type String
      @default middle
    */
    anchor: property({
      validate: function(value) {
        return contains(['start', 'middle', 'end'], value);
      }
    }),

    /**
      Define text-alignment (top, middle, or bottom)

      (set by default based on label position)

      @property alignment
      @type String
      @default middle
    */
    alignment: property({
      validate: function(value) {
        return contains(['top', 'middle', 'bottom'], value);
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
      var value = valueOrDefault(d.label, valueOrDefault(d.__original_y, chart.yValue.call(this, d, i)));
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
    labelClass: di(function(chart, d) {
      return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
    }),

    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('g')
        .data(data, this.key);
    },
    onInsert: function onInsert(selection) {
      return selection.append('g')
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
      var position = chart.position();
      var values = {
        offset: chart.offset(),
        padding: chart.padding(),
        anchor: chart.anchor(),
        alignment: chart.alignment()
      };

      var options;
      if (isString(position))
        options = getOptions();

      selection.each(function(d, i, j) {
        if (!labels[j])
          labels[j] = [];

        // Store values for label and calculate layout
        var label = chart._prepareLabel(chart, this, d, i, j);
        labels[j].push(label);

        var label_options = options || getOptions.call(chart, this, d, i, j);

        chart._calculateLayout(chart, label_options, label);
      });

      // Collision detection
      this._handleCollisions(chart, labels);

      // Layout labels
      labels.forEach(function(series) {
        series.forEach(function(label) {
          this._setLayout(chart, label);
        }, this);
      }, this);

      function getOptions(element, d, i, j) {
        var label_options = extend({}, values);
        var label_position;

        if (isFunction(position))
          label_position = position.call(element, d, i, j);
        else
          label_position = position;

        if (isNumber(label_options.offset)) {
          var offset = {
            top: {x: 0, y: -label_options.offset},
            right: {x: label_options.offset, y: 0},
            bottom: {x: 0, y: label_options.offset},
            left: {x: -label_options.offset, y: 0}
          }[label_position];

          if (!offset)
            offset = {x: 0, y: 0};

          label_options.offset = offset;
        }
        if (isUndefined(label_options.anchor)) {
          label_options.anchor = {
            top: 'middle',
            right: 'start',
            bottom: 'middle',
            left: 'end'
          }[label_position];
        }
        if (isUndefined(label_options.alignment)) {
          label_options.alignment = {
            top: 'bottom',
            right: 'middle',
            bottom: 'top',
            left: 'middle'
          }[label_position];
        }
        return label_options;
      }
    },

    // (Override for custom labels)
    transitionLabels: function(selection) {
      selection.attr('opacity', 1);
    },

    //
    // Internal
    //

    _prepareLabel: function(chart, element, d, i) {
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
    },

    _calculateLayout: function(chart, options, label) {
      var text_bounds = label.text.element.getBBox();

      // Need to adjust text for line-height
      var text_y_adjustment = alignText(label.text.element);

      // Position background
      var layout = label.bg.layout = {
        x: options.offset.x,
        y: options.offset.y,
        width: text_bounds.width + (2 * options.padding),
        height: text_bounds.height + (2 * options.padding)
      };

      // Set width / height of label
      label.width = layout.width;
      label.height = layout.height;

      if (options.anchor == 'end')
        label.x -= layout.width;
      else if (options.anchor == 'middle')
        label.x -= (layout.width / 2);

      if (options.alignment == 'bottom')
        label.y -= layout.height;
      else if (options.alignment == 'middle')
        label.y -= (layout.height / 2);

      // Center text in background
      label.text.layout = {
        x: layout.x + (layout.width / 2) - (text_bounds.width / 2),
        y: layout.y + (layout.height / 2) - (text_bounds.height / 2) + text_y_adjustment
      };
    },

    _handleCollisions: function(chart, labels) {
      labels.forEach(function(series, seriesIndex) {
        // Check through remaining series for collisions
        labels.slice(seriesIndex + 1).forEach(function(compareSeries) {
          compareSeries.forEach(function(compareLabel) {
            series.forEach(function(label) {
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
          objectEach(labelB.group.labels, function(label) {
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
        function reset(label) {
          // Reset to original y
          label.y = label.originalY;
          return label;
        }
        function sortY(a, b) {
          if (a.y < b.y)
            return -1;
          else if (a.y > b.y)
            return 1;
          else
            return 0;
        }

        var byY = group.labels.map(reset).sort(sortY).reverse();

        byY.forEach(function(label, index) {
          var prev = first(byY, index);
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
    },

    _setLayout: function(chart, label) {
      label.bg.selection
        .attr('transform', translate(label.bg.layout.x, label.bg.layout.y))
        .attr('width', label.bg.layout.width)
        .attr('height', label.bg.layout.height);

      label.text.selection
        .attr('transform', translate(label.text.layout.x, label.text.layout.y));

      // Position label and set opacity to fade-in
      label.selection
        .attr('transform', translate(label.x, label.y))
        .attr('opacity', 0);
    }
  }, {
    z_index: 150
  });

  var labels = createHelper('Labels');

  /**
    (in-progress)

    @class HoverLabels
  */
  var Mixed$3 = mixin(Labels, Hover);
  var HoverLabels = Mixed$3.extend({
    initialize: function(options) {
      Mixed$3.prototype.initialize.call(this, options);
      this.on('attach', function() {
        this.container.on('mouseenter:point', this.onMouseEnterPoint.bind(this));
        this.container.on('mouseleave:point', this.onMouseLeavePoint.bind(this));
      }.bind(this));
    },

    /**
      Maximum distance to find active points

      @property hoverTolerance
      @type Number
      @default Infinity
    */
    hoverTolerance: property({
      set: function(value) {
        // Pass through hover tolerance to parent (if present)
        if (this.parent && this.parent.hoverTolerance)
          this.parent.hoverTolerance(value);
      },
      default_value: Infinity
    }),

    // Don't fade in labels, hidden until hover
    transitionLabels: function() {},

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
  });

  var hoverLabels = createHelper('HoverLabels');

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
    @extends Chart, Series, XY, XYValues, LabelsXY, Hover, Transition, StandardLayer
  */

  var Mixed$1 = mixin(Chart, Series, XY, XYValues, LabelsXY, Hover, Transition, StandardLayer);
  var Bars = Mixed$1.extend({
    initialize: function(options) {
      Mixed$1.prototype.initialize.call(this, options);

      this.on('before:draw', function() {
        this.offset_axis = this.getOffsetAxis();
      }.bind(this));

      // Use standard series layer for extensibility
      // (dataBind, insert, and events defined in prototype)
      this.standardSeriesLayer('Bars', this.base.append('g').classed('chart-bars', true));
      this.attachLabels();
    },

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
      return height > 0 ? height : 0;
    }),
    barWidth: di(function(chart) {
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
    bar0: di(function(chart, d, i) {
      var y0 = chart.y0();
      var offset = chart.barOffset();
      return chart.y.call(this, d, i) <= y0 ? y0 - offset : y0 + offset;
    }),
    barClass: di(function(chart, d) {
      return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
    }),

    // Shift bars slightly to account for axis thickness
    barOffset: function barOffset() {
      if (this.offset_axis) {
        var axis_thickness = parseInt(this.offset_axis.base.select('.domain').style('stroke-width')) || 0;
        return axis_thickness / 2;
      }
      else {
        return 0;
      }
    },

    getOffsetAxis: function getOffsetAxis() {
      var components = this.container && this.container.components();
      return objectFind(components, function(component) {
        if (component.type == 'Axis' && component.position() == 'bottom')
          return component;
      });
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
        .attr('y', this.bar0)
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
    onExitTransition: function onExitTransition(selection) {
      this.setupTransition(selection);

      selection
        .attr('y', this.bar0)
        .attr('height', 0)
        .remove();
    }
  });

  var bars = createHelper('Bars');

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
    @extends Bars, XYInverted
  */
  var HorizontalBars = mixin(Bars, XYInverted).extend({
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
    barHeight: di(function(chart) {
      return chart.itemWidth();
    }),
    bar0: di(function(chart, d, i) {
      var x0 = chart.x0();
      var offset = chart.barOffset();
      return chart.x.call(this, d, i) >= x0 ? x0 + offset : x0 - offset;
    }),

    getOffsetAxis: function getOffsetAxis() {
      var components = this.container && this.container.components();
      return objectFind(components, function(component) {
        if (component.type == 'Axis' && component.position() == 'left')
          return component;
      });
    },

    onEnter: function onEnter(selection) {
      selection
        .attr('x', this.bar0)
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

    onExitTransition: function onExitTransition(selection) {
      this.setupTransition(selection);

      selection
        .attr('x', this.bar0)
        .attr('width', 0)
        .remove();
    }
  });

  var horizontalBars = createHelper('HorizontalBars');

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
  var StackedBars = Bars.extend({
    transform: function(data) {
      data = Bars.prototype.transform.call(this, data);

      var grouped = {};
      var x_key = this.xKey();
      var y_key = this.yKey();
      data = data.map(function(series) {
        series = extend({}, series);
        series.values = series.values.map(function(value) {
          value = extend({}, value);
          var x = value[x_key];
          var y = value.__original_y = value[y_key];

          if (!grouped[x])
            grouped[x] = {pos: 0, neg: 0};

          if (y >= 0) {
            value.__previous = grouped[x].pos;
            grouped[x].pos = value[y_key] = grouped[x].pos + y;
          }
          else {
            value.__previous = grouped[x].neg;
            grouped[x].neg = value[y_key] = grouped[x].neg + y;
          }

          return value;
        }, this);

        return series;
      }, this);

      return data;
    },

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.yScale()(d.__previous) - chart.y.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return height > 0 ? height - offset : 0;
    })
  });

  var stackedBars = createHelper('StackedBars');

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
  var HorizontalStackedBars = HorizontalBars.extend({
    transform: function(data) {
      data = StackedBars.prototype.transform.call(this, data);
      data = HorizontalBars.prototype.transform.call(this, data);
      return data;
    },

    barWidth: di(function(chart, d, i) {
      var width = Math.abs(chart.yScale()(d.__previous) - chart.x.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return width > 0 ? width - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      var x = chart.x.call(this, d, i);
      var x0 = chart.yScale()(d.__previous);

      return x < x0 ? x : x0 + chart.barOffset();
    })
  });

  var horizontalStackedBars = createHelper('HorizontalStackedBars');

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
    @extends Chart, Series, XY, LabelsXY, Hover, HoverPoints, Transition, StandardLayer
  */
  var Mixed = mixin(Chart, Series, XY, LabelsXY, Hover, HoverPoints, Transition, StandardLayer);
  var Lines = Mixed.extend({
    initialize: function(options) {
      Mixed.prototype.initialize.call(this, options);

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
    interpolate: property({
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
  });

  var lines = createHelper('Lines');

  /*
    Extract layout from the given options

    @param {Array} options
    @return {Object} {data, items, layout}
  */
  function extractLayout(options) {
    if (!options)
      return;

    var data = {
      _charts: {},
      _components: {}
    };
    var items = {};
    var layout = [];
    var charts = [];
    var components = [];

    // TEMP Idenfify charts from layered,
    // eventually no distinction between charts and components
    var found = {
      row: false,
      charts: false
    };

    // Components are added from inside-out
    // so for position: top, position: left, use unshift
    options.forEach(function(row, row_index) {
      var row_components = [];

      if (!Array.isArray(row))
        row = [row];
      if (row.length > 1)
        found.row = true;

      var row_layout = row.map(function(item, col_index) {
        if (!item)
          return;

        if (item._layered) {
          // Charts
          found.charts = found.row = true;
          var chart_ids = [];

          item.items.forEach(function(chart, chart_index) {
            if (!chart)
              return;

            chart = defaults({}, chart, {id: getId(row_index, col_index, chart_index)});

            chart_ids.push(chart.id);
            charts.push(chart);
            items[chart.id] = chart;
          });

          return chart_ids;
        }

        var component = prepareComponent(item, row_index, col_index);
        items[component.id] = component;

        if (row.length > 1) {
          if (!found.charts) {
            // Left
            setPosition(component, 'left');
            row_components.unshift(component);
          }
          else {
            // Right
            setPosition(component, 'right');
            row_components.push(component);
          }
        }
        else {
          if (!found.row) {
            // Top
            setPosition(component, 'top');
            components.unshift(component);
          }
          else {
            // Bottom
            setPosition(component, 'bottom');
            components.push(component);
          }
        }

        return component.id;
      });

      if (row_components.length)
        components = components.concat(row_components);

      layout.push(row_layout);
    });

    charts.forEach(extractData('_charts'));
    components.forEach(extractData('_components'));

    return {
      data: data,
      items: items,
      layout: layout,

      charts: charts,
      components: components
    };

    function prepareComponent(component, row_index, col_index) {
      return defaults({}, component, {id: getId(row_index, col_index)});
    }
    function setPosition(component, position) {
      if (component && isFunction(component.position))
        component.position(position);
      else
        component.position = position;
    }
    function getId(row_index, col_index, layered_index) {
      var id = 'item-' + (row_index + 1) + '-' + (col_index + 1);
      if (layered_index != null)
        id += '-' + (layered_index + 1);

      return id;
    }

    function extractData(type) {
      return function(item) {
        if (item.data && !isFunction(item.data)) {
          data[type][item.id] = item.data;
          data[item.id] = item.data;
          delete item.data;
        }
      };
    }
  }

  /*
    Calculate component and chart coordinates for given layout
  */
  function calculateLayout(components, data, demux) {
    var overall_layout = {top: [], right: [], bottom: [], left: []};
    components.forEach(function(component) {
      if (component.skip_layout || !component.getLayout)
        return;

      var layout = component.getLayout(demux(component.id, data));
      var position = layout && layout.position;

      if (!contains(['top', 'right', 'bottom', 'left'], position))
        return;

      overall_layout[position].push({
        offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
        component: component
      });
    });

    return overall_layout;
  }

  /*
    Apply calculated layout to charts and components
  */
  function applyLayout(layout, chart_position, width, height) {
    layout.top.reduce(function(previous, part) {
      var y = previous - part.offset;
      setLayout(part.component, chart_position.left, y, {width: chart_position.width});

      return y;
    }, chart_position.top);

    layout.right.reduce(function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var x = previous + previousPart.offset;
      setLayout(part.component, x, chart_position.top, {height: chart_position.height});

      return x;
    }, width - chart_position.right);

    layout.bottom.reduce(function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var y = previous + previousPart.offset;
      setLayout(part.component, chart_position.left, y, {width: chart_position.width});

      return y;
    }, height - chart_position.bottom);

    layout.left.reduce(function(previous, part) {
      var x = previous - part.offset;
      setLayout(part.component, x, chart_position.top, {height: chart_position.height});

      return x;
    }, chart_position.left);

    function setLayout(component, x, y, options) {
      if (component && isFunction(component.setLayout))
        component.setLayout(x, y, options);
    }
  }

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
  var Overlay = Component.extend({
    initialize: function(options) {
      Component.prototype.initialize.call(this, options);
      this.base.attr('style', this.style());
    },
    skip_layout: true,

    /**
      Overlay's top-left x-position in px from left

      @property x
      @type Number
      @default 0
    */
    x: property({
      default_value: 0
    }),

    /**
      Overlay's top-left y-position in px from top

      @property y
      @type Number
      @default 0
    */
    y: property({
      default_value: 0
    }),

    /**
      Whether overlay is currently hidden

      @property hidden
      @type Boolean
      @default true
    */
    hidden: property({
      default_value: true
    }),

    /**
      Overlays base styling
      (default includes position and hidden)

      @property style
      @type String
      @default set from x, y, and hidden
    */
    style: property({
      default_value: function() {
        var transform = translate(this.x() + 'px', this.y() + 'px');
        var styles = {
          position: 'absolute',
          top: 0,
          left: 0,
          '-webkit-transform': transform,
          '-ms-transform': transform,
          transform: transform
        };

        if (this.hidden())
          styles.display = 'none';

        return style(styles);
      }
    }),

    /**
      Position overlay layer at given x,y coordinates

      @example
      ```js
      // Absolute, x: 100, y: 50
      overlay.position(100, 50);
      overlay.position({x: 100, y: 50});

      // Relative-to-chart, x: 50, y: 40
      overlay.position({chart: {x: 50, y: 40}});

      // Relative-to-container, x: 75, y: 50
      overlay.position({container: {x: 75, y: 50}});
      ```
      @method position
      @param {Object|Number} position {x,y}, {container: {x,y}}, {chart: {x,y}} or x in px from left
      @param {Number} [y] in px from top
    */
    // TODO This conflicts with component.position(), might need a rename
    position: function(position, y) {
      if (arguments.length > 1) {
        position = {
          x: position,
          y: y
        };
      }
      else {
        if ('container' in position) {
          position = this.getAbsolutePosition(position.container);
        }
        else if ('chart' in position) {
          if (this.container) {
            var chart = this.container.chartPosition();
            position = this.getAbsolutePosition({
              x: position.chart.x + chart.left,
              y: position.chart.y + chart.top
            });
          }
          else {
            position = this.getAbsolutePosition(position.chart);
          }
        }
      }

      this.x(position.x).y(position.y);
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

      if (container && this.container.responsive()) {
        var container_dimensions = dimensions(container);
        var chart_width = this.container.width();
        var chart_height = this.container.height();
        var width_ratio = container_dimensions.width / chart_width;
        var height_ratio = container_dimensions.height / chart_height;

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

  var default_compose_margins = {top: 10, right: 10, bottom: 10, left: 10};

  /**
    Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart.
    Using the `options` property, charts and components can be bound to data and customized to create dynamic charts.

    @example
    ```html
    <div id="#chart"></div>
    ```
    ```js
    var chart = d3.select('#chart').chart('Compose', function(data) {
      // Process data...

      // Create shared scales
      var scales = {
        x: {data: data.input, key: 'x', adjacent: true},
        y: {data: data.input, key: 'y'},
        y2: {data: data.output, key: 'y'}
      };

      // Setup charts and components
      var charts = [
        d3c.bars('input', {data: data.input, xScale: scales.x, yScale: scales.y}),
        d3c.lines('output', {data: data.output, xScale: scales.x, yScale: scales.y2})
      ];

      var title = d3c.title('d3.compose');
      var xAxis = d3c.axis('xAxis', {scale: scales.x});
      var yAxis = d3c.axis('yAxis', {scale: scales.y});
      var y2Axis = d3c.axis('y2Axis', {scale: scales.y2});

      // Layout charts and components
      return [
        title,
        [yAxis, d3c.layered(charts), y2Axis],
        xAxis
      ];;
    });

    chart.draw({input: [...], output: [...]});
    ```
    @class Compose
    @extends Base
  */
  var Compose = Base.extend({
    initialize: function(options) {
      Base.prototype.initialize.call(this, options);

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

    transform: function(data) {
      // Save raw data for redraw
      this.rawData(data);
      return Base.prototype.transform.call(this, data);
    },

    /**
      Get/set the options `object/function` for the chart that takes `data` and
      returns `[...layout]` for composing child charts and components.

      @example
      ```js
      // get
      chart.options();

      // set (static)
      chart.options([
        // ...
      ]);

      // set (dynamic, takes data and returns options)
      chart.options(function(data) {
        // process data...

        return [
          // ...
        ];
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
    options: property({
      default_value: function() { return function() {}; },
      set: function(options) {
        // If options is plain object,
        // return from generic options function
        if (!isFunction(options)) {
          return {
            override: function() {
              return options;
            }
          };
        }
      }
    }),

    // Store raw data for container before it has been transformed
    rawData: property(),

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
    margins: property({
      default_value: default_compose_margins,
      set: function(values) {
        return {
          override: getMargins(values, default_compose_margins)
        };
      }
    }),

    // Chart position
    chartPosition: property({
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
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
    width: property({
      default_value: null
    }),

    /**
      Get/set overall height of chart

      @property height
      @type Number
    */
    height: property({
      default_value: null
    }),

    _width: function() {
      var width = this.width();
      return width != null ? width : Base.prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : Base.prototype.height.call(this);
    },

    /**
      Enable responsive container + viewBox so that chart scales to fill width
      (only works if selection is not an svg)

      @property responsive
      @type Boolean
      @default true
    */
    responsive: property({
      default_value: true
    }),

    // Set svg viewBox attribute
    viewBox: property({
      default_value: function() {
        if (this.responsive() && this.width() && this.height())
          return '0 0 ' + this.width() + ' ' + this.height();
        else
          return null;
      }
    }),

    // Set svg preserveAspectRatio attribute
    preserveAspectRatio: property({
      default_value: function() {
        if (this.responsive())
          return 'xMidYMid meet';
        else
          return null;
      }
    }),

    // Set container style
    containerStyle: property({
      default_value: function() {
        if (this.responsive()) {
          var aspect_ratio = 1;
          if (this.width() && this.height())
            aspect_ratio = this.height() / this.width();

          return style({
            width: '100%',
            height: 0,
            'padding-top': (aspect_ratio * 100) + '%',
            position: 'relative'
          });
        }
        else {
          return style({position: 'relative'});
        }
      }
    }),

    // Set base style
    baseStyle: property({
      default_value: function() {
        if (this.responsive() && this.container) {
          return style({
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
      chart.charts([
        {id: 'input', type: 'Bars'}, // options to pass to Bars chart
        {id: 'output', type: 'Lines'} // options to pass to Lines chart
      ]);
      ```
      @property charts
      @type Array
    */
    charts: property({
      set: function(chart_options, charts) {
        // Store actual charts rather than options
        return {
          override: this._attachItems(chart_options, charts, this)
        };
      },
      default_value: []
    }),

    /**
      Set components from options or get components instances.
      Each component should use a unique key so that updates are passed to the existing chart
      (otherwise they are recreated on update).
      The `type` option must be a registered `d3.chart` and all other options are passed to the component.

      @example
      ```js
      chart.components([
        {id: 'axis.y', type: 'Axis'}, // options to pass to Axis component
        {id: 'title', type: 'Title'} // options to pass to Title component
      ])
      ```
      @property components
      @type Array
    */
    components: property({
      set: function(component_options, components) {
        // Store actual components rather than options
        return {
          override: this._attachItems(component_options, components, this)
        };
      },
      default_value: []
    }),

    /**
      Delay start of transition by specified milliseconds.
      (applied to all charts and components as default)

      @property delay
      @type Number|Function
      @default d3 default: 0
    */
    delay: property(),

    /**
      Transition duration in milliseconds.
      (applied to all charts and components as default)

      @property duration
      @type Number|Function
      @default d3 default: 250ms
    */
    duration: property(),

    /**
      Transition ease function.
      (applied to all charts and components as default)

      - See: [Transitions#ease](https://github.com/mbostock/d3/wiki/Transitions#ease)
      - Note: arguments to pass to `d3.ease` are not supported

      @property ease
      @type String|Function
      @default d3 default: 'cubic-in-out'
    */
    ease: property(),

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
      var config = this._prepareConfig(this.options(), data);
      if (!config)
        config = {data: {_charts: {}, _components: {}}, layout: [], charts: [], components: []};

      // Set charts and components from config
      this.charts(config.charts);
      this.components(config.components);

      // Add config data
      data = {
        original: data,
        config: config.data
      };
      this.data(data);

      this._setDimensions();

      // Layout components
      this.layout(config.layout, data);

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

      if (findById(this.charts(), name) && data.config._charts[name])
        return data.config._charts[name];
      else if (findById(this.components(), name) && data.config._components[name])
        return data.config._components[name];
      else
        return data.original;
    },

    // Create chart layer (for laying out charts)
    createChartLayer: function(options) {
      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options && options.z_index);
    },

    // Create component layer
    createComponentLayer: function(options) {
      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options && options.z_index);
    },

    // Create overlay layer
    createOverlayLayer: function() {
      if (!this.container)
        throw new Error('Cannot create overlay layer if original selection "d3.select(...).chart(\'Compose\')" is an svg. Use a div instead for responsive and overlay support.');

      return this.container.append('div')
        .attr('class', 'chart-overlay-layer');
    },

    // Layout components and charts for given data
    layout: function(layout, data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      layout = this._extractLayout(data);

      // 3. Set chart position from layout
      var chart_position = extend({}, this.margins());
      objectEach(layout, function(parts, key) {
        parts.forEach(function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this.positionLayers(layout);
    },

    attachHoverListeners: function() {
      // For responsive, listen on container div and calculate enter/exit for base from bounding rectangle
      // For non-responsive, bounding rectangle is container so calculations still apply

      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var container = this.container || this.base;
      var base = this.base.node();
      var chart_position, bounds, was_inside;

      container.on('mouseenter', function() {
        // Calculate chart position and bounds on enter and cache during move
        chart_position = chartPosition();
        bounds = getBounds();

        was_inside = inside(bounds);
        if (was_inside)
          enter();
      });
      container.on('mousemove', function() {
        // Mousemove may fire before mouseenter in IE
        if (!chart_position || !bounds) {
          chart_position = chartPosition();
          bounds = getBounds();
        }

        var is_inside = inside(bounds);
        if (was_inside && is_inside)
          move();
        else if (was_inside)
          leave();
        else if (is_inside)
          enter();

        was_inside = is_inside;
      });
      container.on('mouseleave', function() {
        if (was_inside) {
          was_inside = false;
          leave();
        }
      });

      function inside() {
        var mouse = d3.mouse(document.documentElement);
        return mouse[0] >= bounds.left && mouse[0] <= bounds.right && mouse[1] >= bounds.top && mouse[1] <= bounds.bottom;
      }
      function enter() {
        trigger('mouseenter', translateToXY(d3.mouse(base)));
      }
      function move() {
        trigger('mousemove', translateToXY(d3.mouse(base)));
      }
      function leave() {
        trigger('mouseleave');
      }

      function translateToXY(coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chart_x = x - chart_position.left;
        var chart_y = y - chart_position.top;

        // Set at chart bounds if outside of chart
        if (x > (chart_position.left + chart_position.width))
          chart_x = chart_position.width;
        else if (x < chart_position.left)
          chart_x = 0;

        if (y > (chart_position.top + chart_position.height))
          chart_y = chart_position.height;
        else if (y < chart_position.top)
          chart_y = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chart_x, y: chart_y}
        };
      }

      function getBounds() {
        var scroll_y = 'scrollY' in window ? window.scrollY : document.documentElement.scrollTop;

        bounds = extend({}, base.getBoundingClientRect());
        bounds.top += scroll_y;
        bounds.bottom += scroll_y;

        return bounds;
      }
    },

    // Attach chart/component child item with id
    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      Base.prototype.attach.call(this, id, item);

      if (item && isFunction(item.trigger))
        item.trigger('attach');
    },

    // Detach chart/component child item by id
    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && isFunction(item.trigger))
        item.trigger('detach');
    },

    // Position chart and component layers
    positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();
    },

    //
    // Internal
    //

    _setDimensions: function() {
      // Set container and svg dimensions
      // (if original selection is svg, no container and skip responsiveness)
      if (this.container) {
        this.container
          .attr('style', this.containerStyle());
      }

      this.base
        .attr('viewBox', this.viewBox())
        .attr('preserveAspectRatio', this.preserveAspectRatio())
        .attr('style', this.baseStyle())
        .attr('width', this.responsive() ? null : this.width())
        .attr('height', this.responsive() ? null : this.height());
    },

    _attachItems: function(items, container, context) {
      items = items || [];
      container = container || [];

      // Remove charts that are no longer needed
      var remove_ids = difference(pluck(container, 'id'), pluck(items, 'id'));
      remove_ids.forEach(function(remove_id) {
        context.detach(remove_id, findById(container, remove_id));
      });

      // Create or update charts
      return items.map(function(options) {
        // TODO May not have id, might need to auto-generate
        // (might be during another step)
        var id = options.id;
        var item = findById(container, id);

        if (options instanceof d3.chart()) {
          // If chart instance, replace with instance
          if (item)
            context.detach(id, item);

          context.attach(id, options);
          return options;
        }
        else {
          // TEMP Changing position has nasty side effects, disable for now
          var changed_position = item && !(item instanceof Overlay) && item.position && options.position && item.position() != options.position;

          if (item && (item.type != options.type || changed_position)) {
            // If chart type has changed, detach and re-create
            context.detach(id, item);
            item = undefined;
          }

          if (!item) {
            var Item = d3.chart(options.type);

            if (!Item)
              throw new Error('No registered d3.chart found for ' + options.type);

            var layer_options = {z_index: Item.z_index || 0};
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
          }
          else {
            item.options(options);
          }

          return item;
        }
      });
    },

    _prepareConfig: function(options, data) {
      return extractLayout(options(data));
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      this.base.selectAll('.chart-layer')
        .attr('transform', translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart_position = this.chartPosition();
      var width = this._width();
      var height = this._height();

      applyLayout(layout, chart_position, width, height);
    },

    _positionByZIndex: function() {
      var layers = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      function setZIndex(layer) {
        return {
          layer: layer,
          zIndex: parseInt(d3.select(layer).attr('data-zIndex')) || 0
        };
      }
      function sortZIndex(a, b) {
        if (a.zIndex < b.zIndex)
          return -1;
        else if (a.zIndex > b.zIndex)
          return 1;
        else
          return 0;
      }
      function getLayer(wrapped) {
        return wrapped.layer;
      }

      layers = layers.map(setZIndex).sort(sortZIndex).map(getLayer);

      // Move layers to z-index order
      layers.forEach(function(layer) {
        if (layer && layer.parentNode && layer.parentNode.appendChild)
          layer.parentNode.appendChild(layer);
      });
    },

    _extractLayout: function(data) {
      return calculateLayout(this.components(), data, this.demux.bind(this));
    }
  });

  // TODO Find better place for this
  function layered(items) {
    if (!Array.isArray(items))
      items = Array.prototype.slice.call(arguments);

    return {_layered: true, items: items};
  }

  function findById(items, id) {
    return find(items, function(item) {
      return item.id == id;
    });
  }

  // Export charts/components to d3.chart
  utils.extend(d3.chart(), {
    Base: Base,
    Chart: Chart,
    Component: Component,
    Overlay: Overlay,
    Compose: Compose,
    Lines: Lines,
    Bars: Bars,
    StackedBars: StackedBars,
    HorizontalBars: HorizontalBars,
    HorizontalStackedBars: HorizontalStackedBars,
    Labels: Labels,
    HoverLabels: HoverLabels,
    Text: Text,
    Title: Title,
    Axis: Axis,
    AxisTitle: AxisTitle,
    Legend: Legend,
    InsetLegend: InsetLegend,
    Gridlines: Gridlines
  });

  var d3c = d3.compose = {
    VERSION: '0.15.11',
    utils: utils,
    helpers: helpers,
    Base: Base,
    Chart: Chart,
    Component: Component,
    Overlay: Overlay,
    Compose: Compose,
    layered: layered,

    mixins: mixins,

    Lines: Lines,
    lines: lines,
    Bars: Bars,
    bars: bars,
    StackedBars: StackedBars,
    stackedBars: stackedBars,
    HorizontalBars: HorizontalBars,
    horizontalBars: horizontalBars,
    HorizontalStackedBars: HorizontalStackedBars,
    horizontalStackedBars: horizontalStackedBars,
    Labels: Labels,
    labels: labels,
    HoverLabels: HoverLabels,
    hoverLabels: hoverLabels,

    Text: Text,
    text: text,
    Title: Title,
    title: title,
    Axis: Axis,
    axis: axis,
    AxisTitle: AxisTitle,
    axisTitle: axisTitle,
    Legend: Legend,
    legend: legend,
    InsetLegend: InsetLegend,
    insetLegend: insetLegend,
    Gridlines: Gridlines,
    gridlines: gridlines
  };

  return d3c;

}));