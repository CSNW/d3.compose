/*!
 * d3.compose - Compose complex, data-driven visualizations from reusable charts and components with d3
 * v0.14.3 - https://github.com/CSNW/d3.compose - license: MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3')) :
  typeof define === 'function' && define.amd ? define(['d3'], factory) :
  global.d3c = factory(global.d3)
}(this, function (d3) { 'use strict';

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
    valueOrDefault: valueOrDefault
  };

  function property(name, options) {
    options = options || {};
    var prop_key = options.prop_key || '__properties';

    var property = function(value) {//eslint-disable-line no-shadow
      var properties = this[prop_key] = this[prop_key] || {};
      var context = valueOrDefault(property.context, this);

      if (arguments.length)
        return set.call(this);
      else
        return get.call(this);

      function get() {
        value = valueOrDefault(properties[name], property.default_value);

        // Unwrap value if its type is not a function
        if (isFunction(value) && options.type != 'Function')
          value = value.call(this);

        return isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set() {
        // Validate
        if (isFunction(options.validate) && !isUndefined(value) && !options.validate.call(this, value))
          throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

        property.previous = properties[name];
        properties[name] = value;

        if (isFunction(options.set) && !isUndefined(value)) {
          var response = options.set.call(context, value, property.previous);

          if (response && 'override' in response)
            properties[name] = response.override;
          if (response && isFunction(response.after))
            response.after.call(context, properties[name]);
        }

        return this;
      }
    };

    // For checking if function is a property
    property.is_property = true;
    property.set_from_options = valueOrDefault(options.set_from_options, true);
    property.default_value = options.default_value;
    property.context = options.context;

    return property;
  }

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

    var client_dimensions = {
      width: element && element.clientWidth,
      height: element && element.clientHeight
    };

    // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
    //        calculate from css
    //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
    //        Note: This makes assumptions about the box model in use and that width/height are not percent values
    if (isSVG(selection) && (!element.clientWidth || !element.clientHeight) && typeof window !== 'undefined' && window.getComputedStyle) {
      var styles = window.getComputedStyle(element);
      client_dimensions.height = parseFloat(styles.height) - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth);
      client_dimensions.width = parseFloat(styles.width) - parseFloat(styles.borderLeftWidth) - parseFloat(styles.borderRightWidth);
    }

    return client_dimensions;
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

  function mixin(mixins) {
    mixins = Array.isArray(mixins) ? mixins : Array.prototype.slice.call(arguments);
    var mixed = extend.apply(null, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = Array.prototype.slice.call(arguments);

        mixins.forEach(function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return mixins.reduceRight(function(memo, extension) {
          if (extension && extension.transform)
            return extension.transform.call(this, memo);
          else
            return memo;
        }.bind(this), data);
      };
    }

    return mixed;
  }

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
          var element_dimensions = this.getBBox();
          var x = 0;
          var y = 0;

          if (options.direction == 'horizontal') {
            if (!(options.origin == 'left' || options.origin == 'right'))
              options.origin = 'left';

            if (options.origin == 'left')
              x = previous + padding(d, i);
            else
              x = previous + element_dimensions.width + padding(d, i);

            previous = previous + element_dimensions.width + padding(d, i);
          }
          else {
            if (!(options.origin == 'top' || options.origin == 'bottom'))
              options.origin = 'top';

            if (options.origin == 'top')
              y = previous + padding(d, i);
            else
              y = previous + element_dimensions.height + padding(d, i);

            previous = previous + element_dimensions.height + padding(d, i);
          }

          return translate(x, y);
        });
    }
  }

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
  function src_helpers__style(styles) {
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
    style: src_helpers__style,
    getMargins: getMargins,
    stack: stack,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    getParentData: getParentData,
    mixin: mixin,
    createHelper: createHelper
  };

  var Base = d3.chart('Base', {
    initialize: function(options) {
      // Bind all di-functions to this chart
      bindAllDi(this);

      if (options)
        this.options(options);
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

  var Chart = Base.extend('Chart', {}, {
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

  var Component = Base.extend('Component', {
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
    width: property('width', {
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
    height: property('height', {
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
    margins: property('margins', {
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
    centered: property('centered', {
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
        if (options.height)
          y += (options.height - this.height()) / 2;
        if (options.width)
          x += (options.width - this.width()) / 2;
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

  var Overlay = Component.extend('Overlay', {
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
          transform: translate(this.x() + 'px', this.y() + 'px')
        };

        if (this.hidden())
          styles.display = 'none';

        return src_helpers__style(styles);
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
    @extends Base
  */
  var Compose = Base.extend('Compose', {
    initialize: function() {
      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

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
      default_value: function() {},
      type: 'Function',
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
      default_value: default_compose_margins,
      set: function(values) {
        return {
          override: getMargins(values, default_compose_margins)
        };
      }
    }),

    // Chart position
    chartPosition: property('chartPosition', {
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
    width: property('width', {
      default_value: null
    }),

    /**
      Get/set overall height of chart

      @property height
      @type Number
    */
    height: property('height', {
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

          return src_helpers__style({
            width: '100%',
            height: 0,
            'padding-top': (aspect_ratio * 100) + '%',
            position: 'relative'
          });
        }
        else {
          return src_helpers__style({position: 'relative'});
        }
      }
    }),

    // Set base style
    baseStyle: property('baseStyle', {
      default_value: function() {
        if (this.responsive()) {
          return src_helpers__style({
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
    charts: property('charts', {
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
    components: property('components', {
      set: function(component_options, components) {
        // Store actual components rather than options
        return {
          override: this._attachItems(component_options, components, this)
        };
      },
      default_value: []
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
      var config = this._prepareConfig(this.options(), data);

      // Set charts and components from config
      if (config.charts)
        this.charts(config.charts);
      if (config.components)
        this.components(config.components);

      // Add config data
      data = {
        original: data,
        config: config.data
      };
      this.data(data);

      this._updateDimensions();

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

      if (findById(this.charts(), name) && data.config.charts[name])
        return data.config.charts[name];
      else if (findById(this.components(), name) && data.config.components[name])
        return data.config.components[name];
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
    layout: function(data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      var layout = this._extractLayout(data);

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
        bounds = extend({}, base.getBoundingClientRect());
        bounds.top += window.scrollY;
        bounds.bottom += window.scrollY;

        was_inside = inside(bounds);
        if (was_inside)
          enter();
      });
      container.on('mousemove', function() {
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

    _updateDimensions: function() {
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
          if (item && item.type != options.type) {
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
      // Load config from options fn
      var config = options(data);
      var normalized = {
        data: {
          charts: {},
          components: {}
        }
      };

      if (!config) {
        return normalized;
      }
      else {
        normalized.charts = [];
        normalized.components = [];
      }

      if (Array.isArray(config)) {
        // TEMP Idenfify charts from layered,
        // eventually no distinction between charts and components
        var found = {
          row: false,
          charts: false
        };

        config.forEach(function(row, row_index) {
          // Components are added from inside-out
          // so for position: top, position: left, use unshift

          if (Array.isArray(row)) {
            found.row = true;
            var row_components = [];

            row.forEach(function(item, col_index) {
              if (item._layered) {
                found.charts = true;
                normalized.charts = item.items.map(function(chart, chart_index) {
                  return defaults({}, chart, {id: 'chart-' + (chart_index + 1)});
                });
              }
              else if (!found.charts) {
                row_components.unshift(prepareComponent(item, 'left', row_index, col_index));
              }
              else {
                row_components.push(prepareComponent(item, 'right', row_index, col_index));
              }
            });

            normalized.components = normalized.components.concat(row_components);
          }
          else {
            if (row._layered) {
              found.row = found.charts = true;
              normalized.charts = row.items.slice();
            }
            else {
              if (!found.row)
                normalized.components.unshift(prepareComponent(row, 'top', row_index, 0));
              else
                normalized.components.push(prepareComponent(row, 'bottom', row_index, 0));
            }
          }
        });
      }
      else {
        // DEPRECATED
        objectEach(config.charts, function(chart_options, id) {
          normalized.charts.push(extend({id: id}, chart_options));
        });

        objectEach(config.components, function(component_options, id) {
          normalized.components.push(extend({id: id}, component_options));
        });
      }

      normalized.charts.forEach(extractData('charts'));
      normalized.components.forEach(extractData('components'));

      return normalized;

      function prepareComponent(component, position, row_index, col_index) {
        if (component && isFunction(component.position))
          component.position(position);
        else
          component = extend({position: position}, component);

        return defaults(component, {id: 'component-' + (row_index + 1) + '-' + (col_index + 1)});
      }

      function extractData(type) {
        return function(item) {
          if (item.data && !isFunction(item.data)) {
            normalized.data[type][item.id] = item.data;
            delete item.data;
          }
        };
      }
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      this.base.selectAll('.chart-layer')
        .attr('transform', translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart = this.chartPosition();
      var width = this._width();
      var height = this._height();

      layout.top.reduce(function(previous, part) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, chart.top);

      layout.right.reduce(function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      layout.bottom.reduce(function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      layout.left.reduce(function(previous, part) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

      function setLayout(component, x, y, options) {
        if (component && isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
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
      var overall_layout = {top: [], right: [], bottom: [], left: []};
      this.components().forEach(function(component) {
        if (component.skip_layout || !component.getLayout)
          return;

        var layout = component.getLayout(this.demux(component.id, data));
        var position = layout && layout.position;

        if (!contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overall_layout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      }, this);

      return overall_layout;
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

  var d3c = d3.compose = {
    VERSION: '0.14.3',
    utils: utils,
    helpers: helpers,
    Base: Base,
    Chart: Chart,
    Component: Component,
    Overlay: Overlay,
    Compose: Compose,
    layered: layered
  };

  var _index = d3c;

  return _index;

}));
